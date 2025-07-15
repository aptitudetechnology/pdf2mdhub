# app.py - Refactored to eliminate circular imports
import os
from flask import Flask, request, jsonify, render_template, send_from_directory, url_for
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import logging
import subprocess
import json
import shutil

# Configuration
# Define PROJECT_ROOT to point to the top-level directory (pdf2mdhub)
# Since app.py is in 'backend/', os.path.dirname(__file__) is 'backend/',
# so os.path.join(..., '..') moves up one level to the project root.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Use PROJECT_ROOT for all main folder definitions
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads')
MARKDOWN_FOLDER = os.path.join(PROJECT_ROOT, 'md')
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure folders exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(MARKDOWN_FOLDER):
    os.makedirs(MARKDOWN_FOLDER)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    """Application factory pattern to avoid circular imports"""
    app = Flask(__name__,
                # Use PROJECT_ROOT for static and template folders as they are at the top level
                static_folder=os.path.join(PROJECT_ROOT, 'frontend', 'static'),
                template_folder=os.path.join(PROJECT_ROOT, 'frontend', 'templates'))
    
    @app.after_request
    def set_headers(response):
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        return response

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['MARKDOWN_FOLDER'] = MARKDOWN_FOLDER
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///documents.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Flask-SQLAlchemy - import only db instance
    from backend.models import db
    db.init_app(app)

    # Create tables within app context
    with app.app_context():
        db.create_all()

    # Register blueprints
    from backend.routes.search import search_bp
    app.register_blueprint(search_bp)

    # Register your WebContainer demo blueprint here
    from backend.routes.webcontainer_demo import webcontainer_demo_bp
    app.register_blueprint(webcontainer_demo_bp)

    # Register routes with the app
    register_routes(app)
    
    return app

def register_routes(app):
    """Register all routes with the Flask app"""
    
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/upload')
    def upload_page():
        return render_template('upload.html')

    @app.route('/search')
    def search_page():
        return render_template('search.html')

    @app.route('/viewer/<int:document_id>')
    def viewer_page(document_id):
        # Import models at function level to avoid circular imports
        from backend.models.document import Document
        document = Document.query.get(document_id)
        if document:
            return render_template('viewer.html', document=document)
        return "Document not found", 404

    @app.route('/api/upload', methods=['POST'])
    def upload_file():
        # Import models at function level to avoid circular imports
        from backend.models.document import Document
        from backend.models.tag import Tag
        from backend.models import db
        
        logger.info("--- START: POST /api/upload Request ---")
        
        # === ENHANCED DEBUGGING SECTION ===
        logger.info(f"--- DEBUG: Raw request.form: {dict(request.form)} ---")
        logger.info(f"--- DEBUG: Raw request.files: {dict(request.files)} ---")
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        logger.info(f"--- DEBUG: File object: {file} ---")
        logger.info(f"--- DEBUG: File.filename: {file.filename} ---")
        
        tags_json = request.form.get('tags')
        title = request.form.get('title')
        
        logger.info(f"--- DEBUG: Raw tags_json: {tags_json} ---")
        logger.info(f"--- DEBUG: Raw title from form: '{title}' (type: {type(title)}) ---")
        
        # Title fallback logic
        if not title or title.strip() == '':
            # Try to extract from filename
            if file.filename:
                title = file.filename.rsplit('.', 1)[0]
                logger.info(f"--- DEBUG: Using filename-based title: '{title}' ---")
            else:
                title = 'Untitled Document'
                logger.info(f"--- DEBUG: Using fallback title: '{title}' ---")
        
        logger.info(f"--- DEBUG: Final title for database: '{title}' ---")

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_id = os.urandom(16).hex()
            final_filename = f"{unique_id}_{filename}"
            pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], final_filename)

            try:
                file.save(pdf_path)
                logger.info(f"File saved to: {pdf_path}")

                logger.info(f"--- DEBUG: About to create Document with title='{title}' ---")
                new_document = Document(
                    title=title,
                    filename=final_filename,
                    file_path=pdf_path,
                    status='uploaded'
                )

                if tags_json:
                    try:
                        tags_array = json.loads(tags_json)
                        logger.info(f"--- DEBUG: Parsed tags_array: {tags_array} ---")
                        for tag_name in tags_array:
                            tag = Tag.query.filter_by(name=tag_name).first()
                            if not tag:
                                tag = Tag(name=tag_name)
                                db.session.add(tag)
                            new_document.tags.append(tag)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON for tags: {tags_json}")

                db.session.add(new_document)
                db.session.commit()

                document_id = new_document.id
                logger.info(f"File uploaded and processing initiated for ID: {document_id}")

                try:
                    convert_pdf_to_markdown(pdf_path, document_id)
                except Exception as e:
                    logger.error(f"Error during conversion: {e}")

                # Refresh the document to get latest status
                db.session.refresh(new_document)
                
                return jsonify({
                    'message': 'File uploaded successfully, processing initiated',
                    'document': new_document.to_dict()
                }), 201

            except Exception as e:
                logger.error(f"Error during upload: {e}")
                db.session.rollback()
                return jsonify({'error': f'Server error during upload: {e}'}), 500

        return jsonify({'error': 'File type not allowed'}), 400

    @app.route('/api/documents', methods=['GET'])
    def get_documents():
        # Import models at function level to avoid circular imports
        from backend.models.document import Document
        from backend.models.tag import Tag
        
        logger.info("--- START: GET /api/documents Request ---")
        
        query = Document.query
        
        # Apply filters
        q = request.args.get('q', '').strip()
        tag_filter = request.args.get('tag', '').strip()
        
        if q:
            query = query.filter(Document.title.ilike(f'%{q}%') | Document.filename.ilike(f'%{q}%'))
        
        if tag_filter:
            query = query.join(Document.tags).filter(Tag.name == tag_filter)
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        pagination = query.order_by(Document.upload_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'documents': [doc.to_dict() for doc in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        })

    @app.route('/api/documents/<int:document_id>/download', methods=['GET'])
    def download_pdf(document_id):
        # Import models at function level to avoid circular imports
        from backend.models.document import Document
        
        document = Document.query.get(document_id)
        if not document or not document.file_path or not os.path.exists(document.file_path):
            return jsonify({'error': 'PDF document not found'}), 404
        
        return send_from_directory(app.config['UPLOAD_FOLDER'], document.filename, as_attachment=True)

    @app.route('/api/documents/<int:document_id>/markdown', methods=['GET'])
    def get_document_markdown(document_id):
        """
        Serve markdown content for a specific document.
        This route is called by the frontend viewer.js
        """
        # Import Document model here to avoid circular imports
        from backend.models.document import Document
        
        try:
            logger.info(f"--- START: GET /api/documents/{document_id}/markdown Request ---")
            
            # Find the document in the database
            document = Document.query.get_or_404(document_id)
            
            # Check if markdown file exists
            if not document.markdown_filepath or not os.path.exists(document.markdown_filepath):
                logger.error(f"Markdown file not found for document {document_id}")
                return jsonify({
                    'error': 'Markdown file not found',
                    'document_id': document_id
                }), 404
            
            # Read and return markdown content
            try:
                with open(document.markdown_filepath, 'r', encoding='utf-8') as f:
                    markdown_content = f.read()
                
                logger.info(f"Successfully served markdown for document {document_id}")
                return jsonify({
                    'content': markdown_content,
                    'document_id': document_id,
                    'filename': document.filename # Use document.filename from DB
                })
                
            except Exception as e:
                logger.error(f"Error reading markdown file for document {document_id}: {e}")
                return jsonify({
                    'error': f'Error reading markdown file: {str(e)}',
                    'document_id': document_id
                }), 500
                
        except Exception as e:
            logger.error(f"Error in get_document_markdown for document {document_id}: {e}")
            return jsonify({
                'error': f'Internal server error: {str(e)}',
                'document_id': document_id
            }), 500
        finally:
            logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request ---")


# Helper function to check allowed extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# PDF to Markdown conversion function
def convert_pdf_to_markdown(pdf_path, document_id):
    # Import models at function level to avoid circular imports
    from backend.models.document import Document
    from backend.models import db
    from flask import current_app
    
    logger.info(f"Started processing document ID: {document_id}")
    
    document = Document.query.get(document_id)
    if not document:
        logger.error(f"Document with ID {document_id} not found in DB for conversion.")
        return None

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    project_folder_name = base_name
    project_folder_path = os.path.join(current_app.config['MARKDOWN_FOLDER'], project_folder_name)
    output_md_filename_in_project_folder = f"{base_name}.md"
    output_md_path = os.path.join(project_folder_path, output_md_filename_in_project_folder)

    # Clean up previous project folder
    if os.path.exists(project_folder_path):
        logger.info(f"Removing pre-existing project folder: {project_folder_path}")
        shutil.rmtree(project_folder_path)

    logger.info(f"Executing command: pdf2md {pdf_path} {base_name} (cwd: {current_app.config['MARKDOWN_FOLDER']})")
    command = ['pdf2md', pdf_path, base_name]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True,
                                cwd=current_app.config['MARKDOWN_FOLDER'])
        
        logger.info(f"pdf2md stdout: {result.stdout.strip()}")
        if result.stderr:
            logger.warning(f"pdf2md stderr: {result.stderr.strip()}")

        if not os.path.exists(output_md_path):
            raise FileNotFoundError(f"Markdown file not found after conversion: {output_md_path}")

        with open(output_md_path, 'r', encoding='utf-8') as f:
            markdown_content = f.read()

        # Update document status - Flask-SQLAlchemy handles the session
        document.status = 'converted'
        document.markdown_filepath = output_md_path
        db.session.commit()
        
        logger.info(f"Successfully converted and updated document ID: {document_id}")
        return markdown_content

    except Exception as e:
        logger.error(f"Error during conversion: {e}")
        document.status = 'conversion_failed'
        db.session.commit()
        raise Exception(f"PDF to Markdown conversion failed: {e}")

# Create the app instance - THIS LINE MUST BE AFTER create_app() function definition
app = create_app()

if __name__ == '__main__':
    # Debugging: Print PROJECT_ROOT to confirm it's correct
    logger.info(f"DEBUG: PROJECT_ROOT is set to: {PROJECT_ROOT}")

    # Define paths to your SSL certificates
    CERT_PATH = os.path.join(PROJECT_ROOT, 'ssl', 'cert.pem')
    KEY_PATH = os.path.join(PROJECT_ROOT, 'ssl', 'key.pem')
    
    # Debugging: Print full paths being checked
    logger.info(f"DEBUG: Checking for CERT_PATH: {CERT_PATH}")
    logger.info(f"DEBUG: Checking for KEY_PATH: {KEY_PATH}")

    # Explicitly check if certificate files exist for debugging
    logger.info(f"DEBUG: Does CERT_PATH exist? {os.path.exists(CERT_PATH)}")
    logger.info(f"DEBUG: Does KEY_PATH exist? {os.path.exists(KEY_PATH)}")

    # Check if certificate files exist
    if not os.path.exists(CERT_PATH) or not os.path.exists(KEY_PATH):
        logger.warning("SSL certificates (cert.pem, key.pem) not found. Running in HTTP mode.")
        logger.warning("To enable HTTPS, generate them using: openssl genrsa -out key.pem 2048 && openssl req -new -x509 -key key.pem -out cert.pem -days 365")
        app.run(host='0.0.0.0', port=5050, debug=True)
    else:
        logger.info("SSL certificates found. Running in HTTPS mode.")
        app.run(host='0.0.0.0', port=5050, debug=True, ssl_context=(CERT_PATH, KEY_PATH))
