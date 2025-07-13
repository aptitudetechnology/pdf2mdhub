import os
import logging
from datetime import datetime, timedelta 
import subprocess
import markdown
# from PyPDF2 import PdfReader # Not strictly needed for conversion with pdf2md, but keeping for other potential PDF operations
from flask import Flask, request, jsonify, send_from_directory, render_template, url_for, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__,
            static_folder='../frontend/static',
            template_folder='../frontend/templates')

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///pdf_documents.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions (THIS IS THE ONLY PLACE IT SHOULD BE)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# REMOVE THESE TWO LINES BELOW, they are not needed for Flask-Migrate 3.0+
# from flask_migrate import MigrateCommand
# app.cli.add_command('db', MigrateCommand)

# Configure Content Security Policy (CSP) headers
@app.after_request
def add_security_headers(response):
    csp = (
        "default-src 'self';"
        "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net;" # Keep jsdelivr if you still use any CDN resources
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;" # 'unsafe-inline' for inline styles if any
        "img-src 'self' data:;" # data: for base64 encoded images
        "font-src 'self' https://cdn.jsdelivr.net;"
        "object-src 'none';"
        "connect-src 'self';"
        "frame-src 'self';" # Allow iframes from same origin, specifically for PDF viewer
    )
    response.headers['Content-Security-Policy'] = csp
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# Database Model
class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    original_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    processed_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='pending') # pending, processing, completed, failed
    markdown_content = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    tags = db.relationship('Tag', secondary='document_tags', backref=db.backref('documents', lazy=True))

    def __repr__(self):
        return f'<Document {self.original_name}>'

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f'<Tag {self.name}>'

# Association table for many-to-many relationship
document_tags = db.Table('document_tags',
    db.Column('document_id', db.Integer, db.ForeignKey('document.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

# Utility Functions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def get_or_create_tag(tag_name):
    tag = Tag.query.filter_by(name=tag_name).first()
    if not tag:
        tag = Tag(name=tag_name)
        db.session.add(tag)
        db.session.commit()
    return tag

def convert_pdf_to_markdown(pdf_path):
    """
    Converts a PDF file to Markdown using the opendocsg/pdf2md tool.
    This function will be called as a background task.
    """
    try:
        # Define the output Markdown file path
        output_md_path = pdf_path.replace('.pdf', '.md')

        # Construct the command for opendocsg/pdf2md
        # Assuming `pdf2md` is in your PATH.
        # Check `pdf2md --help` for correct arguments if this command fails.
        # Common usage: `pdf2md <input_pdf_path> -o <output_md_path>`
        command = ['pdf2md', str(pdf_path), '-o', str(output_md_path)]

        logger.info(f"Executing PDF to Markdown conversion command: {' '.join(command)}")

        # Execute the command
        # capture_output=True captures stdout and stderr
        # text=True decodes stdout/stderr as text
        # check=True raises a CalledProcessError if the command returns a non-zero exit code
        result = subprocess.run(command, capture_output=True, text=True, check=True)

        logger.info(f"pdf2md stdout: {result.stdout}")
        if result.stderr:
            logger.warning(f"pdf2md stderr: {result.stderr}")

        # Read the content from the generated Markdown file
        if os.path.exists(output_md_path):
            with open(output_md_path, 'r', encoding='utf-8') as f:
                markdown_content = f.read()
            os.remove(output_md_path) # Clean up the generated .md file
            return markdown_content
        else:
            logger.error(f"pdf2md command executed, but no output file found at {output_md_path}")
            return None

    except subprocess.CalledProcessError as e:
        logger.error(f"Error converting PDF {pdf_path} using pdf2md. Command: {' '.join(e.cmd)}")
        logger.error(f"pdf2md stdout: {e.stdout}")
        logger.error(f"pdf2md stderr: {e.stderr}")
        return None
    except FileNotFoundError:
        logger.error("Error: 'pdf2md' command not found. Is opendocsg/pdf2md installed and in your system's PATH?")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during PDF to Markdown conversion: {e}")
        return None

# Background processing (simple simulation for now)
# In a real application, use a task queue like Celery
def process_document_task(document_id):
    with app.app_context():
        document = Document.query.get(document_id)
        if not document:
            logger.error(f"Document with ID {document_id} not found for processing.")
            return

        document.status = 'processing'
        db.session.commit()
        logger.info(f"Started processing document: {document.original_name} (ID: {document.id})")

        try:
            markdown_content = convert_pdf_to_markdown(document.file_path)

            if markdown_content:
                document.markdown_content = markdown_content
                document.processed_date = datetime.utcnow()
                document.status = 'completed'
                logger.info(f"Successfully processed document: {document.original_name}")
            else:
                document.status = 'failed'
                logger.error(f"Failed to get markdown content for document: {document.original_name}")
            db.session.commit()

        except Exception as e:
            document.status = 'failed'
            db.session.commit()
            logger.exception(f"Error during markdown conversion for document {document.original_name}: {e}")

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload')
def upload_page():
    return render_template('upload.html')

@app.route('/viewer/<int:document_id>')
def viewer_page(document_id):
    document = Document.query.get_or_404(document_id)
    return render_template('viewer.html', document=document)

@app.route('/search')
def search_page():
    query = request.args.get('query', '')
    tag_filter = request.args.get('tag', '')

    documents_query = Document.query

    if query:
        documents_query = documents_query.filter(
            (Document.original_name.ilike(f'%{query}%')) |
            (Document.markdown_content.ilike(f'%{query}%')) |
            (Document.notes.ilike(f'%{query}%'))
        )

    if tag_filter:
        documents_query = documents_query.join(Document.tags).filter(Tag.name.ilike(f'%{tag_filter}%'))

    documents = documents_query.order_by(Document.upload_date.desc()).all()
    all_tags = Tag.query.all()
    return render_template('search.html', documents=documents, query=query, tag_filter=tag_filter, all_tags=all_tags)


# API Endpoints
@app.route('/api/upload', methods=['POST'])
def upload_file():
    logger.info("--- START: POST /api/upload Request ---")
    if 'file' not in request.files:
        logger.warning("No file part in request.")
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        logger.warning("No selected file.")
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        original_name = file.filename
        unique_filename = f"{os.urandom(16).hex()}_{original_name}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)

        new_document = Document(
            original_name=original_name,
            file_path=file_path,
            status='pending'
        )
        db.session.add(new_document)
        db.session.commit()
        db.session.refresh(new_document) # Get the ID generated by the DB

        # Trigger background processing (in a real app, this would be a task queue)
        # For this simple example, we'll run it in a new thread or directly
        # For non-blocking, a simple threading approach (not for production):
        import threading
        threading.Thread(target=process_document_task, args=(new_document.id,)).start()
        logger.info(f"File uploaded and processing initiated for ID: {new_document.id}")
        logger.info("--- END: POST /api/upload Request (201 - Success) ---")
        return jsonify({
            'message': 'File uploaded and processing started',
            'document_id': new_document.id,
            'original_name': new_document.original_name
        }), 201
    else:
        logger.warning(f"File type not allowed: {file.filename}")
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Get a list of all documents, with optional search and filter."""
    logger.info("--- START: GET /api/documents Request ---")

    query = request.args.get('q', '') # 'q' for general query
    tag_filter = request.args.get('tag', '') # 'tag' for tag filter
    date_from_str = request.args.get('date_from')
    date_to_str = request.args.get('date_to')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    documents_query = Document.query

    if query:
        documents_query = documents_query.filter(
            (Document.original_name.ilike(f'%{query}%')) |
            (Document.markdown_content.ilike(f'%{query}%')) |
            (Document.notes.ilike(f'%{query}%'))
        )

    if tag_filter:
        documents_query = documents_query.join(Document.tags).filter(Tag.name.ilike(f'%{tag_filter}%'))

    if date_from_str:
        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d')
            documents_query = documents_query.filter(Document.upload_date >= date_from)
        except ValueError:
            logger.warning(f"Invalid date_from format: {date_from_str}")
            # Optionally return an error or ignore

    if date_to_str:
        try:
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d')
            # Add one day to include documents uploaded on date_to
            documents_query = documents_query.filter(Document.upload_date < date_to + timedelta(days=1))
        except ValueError:
            logger.warning(f"Invalid date_to format: {date_to_str}")
            # Optionally return an error or ignore

    documents = documents_query.order_by(Document.upload_date.desc()).paginate(page=page, per_page=per_page, error_out=False)

    documents_data = []
    for doc in documents.items: # Iterate over items for paginated results
        documents_data.append({
            'id': doc.id,
            'original_name': doc.original_name,
            'upload_date': doc.upload_date.isoformat(),
            'processed_date': doc.processed_date.isoformat() if doc.processed_date else None,
            'status': doc.status,
            'notes': doc.notes,
            'tags': [tag.name for tag in doc.tags]
        })

    response_data = {
        'documents': documents_data,
        'total_documents': documents.total,
        'total_pages': documents.pages,
        'current_page': documents.page,
        'per_page': documents.per_page,
        'has_next': documents.has_next,
        'has_prev': documents.has_prev
    }

    logger.info("--- END: GET /api/documents Request (200 - Success) ---")
    return jsonify(response_data)

@app.route('/api/documents/<int:document_id>', methods=['GET'])
def get_document_details(document_id):
    """Get details for a single document."""
    logger.info(f"--- START: GET /api/documents/{document_id} Request ---")
    document = Document.query.get_or_404(document_id)
    document_data = {
        'id': document.id,
        'original_name': document.original_name,
        'upload_date': document.upload_date.isoformat(),
        'processed_date': document.processed_date.isoformat() if document.processed_date else None,
        'status': document.status,
        'markdown_content': document.markdown_content, # Raw markdown for API consumers
        'notes': document.notes,
        'tags': [tag.name for tag in document.tags]
    }
    logger.info(f"--- END: GET /api/documents/{document_id} Request (200 - Success) ---")
    return jsonify(document_data)

@app.route('/api/documents/<int:document_id>', methods=['PUT'])
def update_document(document_id):
    """Update document details (e.g., notes, tags)."""
    logger.info(f"--- START: PUT /api/documents/{document_id} Request ---")
    document = Document.query.get_or_404(document_id)
    data = request.get_json()

    if 'notes' in data:
        document.notes = data['notes']

    if 'tags' in data:
        # Clear existing tags and add new ones
        document.tags = []
        for tag_name in data['tags']:
            tag = get_or_create_tag(tag_name)
            document.tags.append(tag)
    
    db.session.commit()
    logger.info(f"Document {document_id} updated.")
    logger.info(f"--- END: PUT /api/documents/{document_id} Request (200 - Success) ---")
    return jsonify({'message': 'Document updated successfully'})

@app.route('/api/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete a document and its associated file."""
    logger.info(f"--- START: DELETE /api/documents/{document_id} Request ---")
    document = Document.query.get_or_404(document_id)
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
            logger.info(f"Deleted file: {document.file_path}")
        
        # Delete associated tags if they are no longer linked to any documents (optional cleanup)
        # This part requires careful handling to avoid deleting tags still in use.
        # For simplicity, we'll just delete the document and its associations.
        db.session.delete(document)
        db.session.commit()
        logger.info(f"Document {document_id} and its file deleted successfully.")
        logger.info(f"--- END: DELETE /api/documents/{document_id} Request (200 - Success) ---")
        return jsonify({'message': 'Document deleted successfully'})
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error deleting document {document_id} or its file.")
        logger.info(f"--- END: DELETE /api/documents/{document_id} Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to delete document'}), 500

@app.route('/api/documents/<int:document_id>/download', methods=['GET'])
def download_pdf(document_id):
    """Serve the original PDF file for download or viewing."""
    logger.info(f"--- START: GET /api/documents/{document_id}/download Request ---")
    document = Document.query.get_or_404(document_id)
    directory = os.path.dirname(document.file_path)
    filename = os.path.basename(document.file_path)
    logger.info(f"Serving PDF: {filename} from {directory}")
    logger.info(f"--- END: GET /api/documents/{document_id}/download Request (200 - Success) ---")
    return send_from_directory(directory, filename, as_attachment=False, mimetype='application/pdf')

@app.route('/api/documents/<int:document_id>/markdown', methods=['GET'])
def get_document_markdown(document_id):
    """
    Get converted markdown content, rendered to HTML server-side for display.
    Provides raw markdown content if specifically requested for download (not shown here).
    """
    logger.info(f"--- START: GET /api/documents/{document_id}/markdown Request ---")
    try:
        document = Document.query.get_or_404(document_id)

        if not document.markdown_content:
            logger.warning(f"Markdown content not found for document ID {document_id}. Status: {document.status}")
            logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (404 - Not Processed) ---")
            return jsonify({'error': 'Document not processed yet', 'status': document.status}), 404

        # Convert Markdown to HTML here on the server for display
        html_content = markdown.markdown(document.markdown_content)

        logger.info(f"Returning HTML for document ID {document_id}.")
        logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (200 - Success) ---")
        return jsonify({
            'html_content': html_content, # Frontend will use this for display
            'markdown': document.markdown_content, # Keeping raw markdown for download button
            'processed_date': document.processed_date.isoformat() if document.processed_date else None
        })

    except Exception as e:
        logger.exception(f"Error getting markdown for document {document_id}.")
        logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to get markdown'}), 500


# Initial database setup (run once)
@app.cli.command('init-db')
def init_db_command():
    """Initializes or updates the database."""
    with app.app_context():
        db.create_all()
        # You can add initial data here if needed
        logger.info('Initialized the database.')

if __name__ == '__main__':
    # It's recommended to run migrations using 'flask db upgrade'
    # instead of create_all() directly in main for production setups.
    # For initial dev, create_all() is fine.
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5050)