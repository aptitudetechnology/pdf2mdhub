import os
from flask import Flask, request, jsonify, render_template, send_from_directory, url_for
from werkzeug.utils import secure_filename
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
import logging
import subprocess # Make sure this is imported
import json # Make sure this is imported for tags

# --- Configuration ---
# Define the absolute path to the directory where this script is located
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Define the UPLOAD_FOLDER relative to the BASE_DIR
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Flask App Initialization
app = Flask(__name__,
            static_folder=os.path.join(BASE_DIR, '..', 'frontend', 'static'),
            template_folder=os.path.join(BASE_DIR, '..', 'frontend', 'templates'))

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///documents.db' # Ensure this is correct
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Recommended for SQLAlchemy

# Database setup
Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False) # Path to the PDF
    markdown_filepath = Column(String(500)) # Path to the converted Markdown
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default='pending') # e.g., 'pending', 'converted', 'failed'
    tags = relationship('Tag', secondary='document_tags', backref='documents') # Link to tags

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'filename': self.filename,
            'upload_date': self.upload_date.isoformat(),
            'status': self.status,
            'tags': [tag.name for tag in self.tags]
        }

class Tag(Base):
    __tablename__ = 'tags'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

class DocumentTag(Base):
    __tablename__ = 'document_tags'
    document_id = Column(Integer, ForeignKey('documents.id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tags.id'), primary_key=True)

engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)


# Helper function to check allowed extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- PDF to Markdown Conversion Function ---
def convert_pdf_to_markdown(pdf_path, document_id):
    logger.info(f"Started processing document ID: {document_id}")
    session = Session()
    document = session.query(Document).get(document_id) # Using query.get for now
    if not document:
        logger.error(f"Document with ID {document_id} not found in DB for conversion.")
        session.close()
        return None

    # Construct paths for the conversion
    # We now use secure_filename for both input and output to ensure consistency
    # and safely construct paths within the UPLOAD_FOLDER
    
    # pdf_path is already the full absolute path from the upload function
    
    # Calculate base name for the pdf2md tool (e.g., 'Invoice_')
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Construct the full absolute path for the output Markdown file
    output_md_filename = f"{base_name}.md"
    output_md_path = os.path.join(app.config['UPLOAD_FOLDER'], output_md_filename)

    logger.info(f"Executing PDF to Markdown conversion command: pdf2md {pdf_path} {base_name}")
    command = ['pdf2md', pdf_path, base_name]

    try:
        # Run the pdf2md command
        result = subprocess.run(command, capture_output=True, text=True, check=True)

        logger.info(f"pdf2md stdout: {result.stdout.strip()}")
        if result.stderr:
            logger.warning(f"pdf2md stderr: {result.stderr.strip()}")

        # Read the converted markdown content
        if not os.path.exists(output_md_path):
            raise FileNotFoundError(f"Markdown file not found after conversion: {output_md_path}")

        with open(output_md_path, 'r', encoding='utf-8') as f:
            markdown_content = f.read()

        # Update document status and markdown_filepath in DB
        document.status = 'converted'
        document.markdown_filepath = output_md_path
        session.commit()
        logger.info(f"Successfully converted and updated document ID: {document_id}")
        return markdown_content

    except subprocess.CalledProcessError as e:
        logger.error(f"Error converting PDF {pdf_path} using pdf2md. Command: {' '.join(e.cmd)}")
        logger.error(f"pdf2md stdout: {e.stdout.strip()}")
        logger.error(f"pdf2md stderr: {e.stderr.strip()}")
        document.status = 'conversion_failed'
        session.commit()
        raise Exception(f"PDF to Markdown conversion failed: {e.stderr.strip()}")
    except FileNotFoundError:
        logger.error(f"pdf2md command not found or markdown file not created for {pdf_path}. Ensure it's installed and in your system's PATH.")
        document.status = 'conversion_failed'
        session.commit()
        raise Exception("pdf2md command not found or output file missing.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during PDF to Markdown conversion: {e}", exc_info=True)
        document.status = 'conversion_failed'
        session.commit()
        raise Exception(f"PDF to Markdown conversion failed: {e}")
    finally:
        session.close()


# --- Routes ---

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
    session = Session()
    document = session.query(Document).get(document_id) # Using query.get for now
    session.close()
    if document:
        return render_template('viewer.html', document=document)
    return "Document not found", 404


@app.route('/api/upload', methods=['POST'])
def upload_file():
    logger.info("--- START: POST /api/upload Request ---")
    if 'file' not in request.files:
        logger.warning("No file part in request.")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    markdown_content_from_frontend = request.form.get('markdown_content')
    tags_json = request.form.get('tags')
    title = request.form.get('title')

    if file.filename == '':
        logger.warning("No selected file.")
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        # Generate a secure filename to prevent directory traversal attacks
        filename = secure_filename(file.filename)
        
        # Prepend a unique ID to the filename to avoid collisions
        unique_id = os.urandom(16).hex()
        final_filename = f"{unique_id}_{filename}"
        
        # Construct the full absolute path where the PDF will be saved
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], final_filename)
        
        try:
            file.save(pdf_path)
            logger.info(f"File saved to: {pdf_path}")

            session = Session()
            
            # Create a new Document entry in the database
            new_document = Document(
                title=title,
                filename=final_filename, # Store the unique filename
                filepath=pdf_path,     # Store the full path to the PDF
                status='uploaded' # Initial status
            )

            # Process tags
            if tags_json:
                try:
                    tags_array = json.loads(tags_json)
                    for tag_name in tags_array:
                        tag = session.query(Tag).filter_by(name=tag_name).first()
                        if not tag:
                            tag = Tag(name=tag_name)
                            session.add(tag)
                        new_document.tags.append(tag)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON for tags: {tags_json}")
            
            session.add(new_document)
            session.commit()
            document_id = new_document.id
            logger.info(f"File uploaded and processing initiated for ID: {document_id}")

            # Initiate background conversion (you might use a task queue for production)
            try:
                # Call conversion here. The content will be saved to the DB in the function.
                # The frontend's pdf2mdProcessor is for client-side display; backend handles server-side conversion.
                converted_markdown = convert_pdf_to_markdown(pdf_path, document_id)
                # No need to send markdown_content back directly if it's stored
                # The frontend will fetch it via /api/documents/<id>/markdown
            except Exception as e:
                logger.error(f"Error initiating conversion task for document ID {document_id}: {e}")
                # The convert_pdf_to_markdown function should update status to 'conversion_failed'
                # but we can ensure here too if an exception prevents that.
                session.rollback() # Rollback if something failed before commit
                session.query(Document).filter_by(id=document_id).update({'status': 'conversion_failed'})
                session.commit()
                # Continue with the response even if conversion failed, indicating the upload was successful
                # but conversion had an issue.

            session.close()
            return jsonify({'message': 'File uploaded successfully, processing initiated', 'document': new_document.to_dict()}), 201

        except SQLAlchemyError as e:
            logger.error(f"Database error during upload: {e}", exc_info=True)
            session.rollback()
            return jsonify({'error': 'Database error during upload.'}), 500
        except Exception as e:
            logger.error(f"An unexpected error occurred during file upload: {e}", exc_info=True)
            return jsonify({'error': f'Server error during upload: {e}'}), 500
    else:
        logger.warning(f"Attempted to upload disallowed file type: {file.filename}")
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/documents/<int:document_id>/markdown', methods=['GET'])
def get_document_markdown(document_id):
    logger.info(f"--- START: GET /api/documents/{document_id}/markdown Request ---")
    session = Session()
    document = session.query(Document).get(document_id) # Using query.get for now
    session.close()

    if not document:
        logger.warning(f"Markdown request for non-existent document ID: {document_id}")
        return jsonify({'error': 'Document not found'}), 404

    if document.status != 'converted' or not document.markdown_filepath or not os.path.exists(document.markdown_filepath):
        logger.info(f"Markdown not yet available or conversion failed for ID: {document_id}. Status: {document.status}")
        return jsonify({'error': 'Markdown content not yet available or conversion failed'}), 404

    try:
        with open(document.markdown_filepath, 'r', encoding='utf-8') as f:
            markdown_content = f.read()
        logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (200 - Success) ---")
        return jsonify({'markdown_content': markdown_content})
    except Exception as e:
        logger.error(f"Error reading markdown file for document ID {document_id}: {e}", exc_info=True)
        return jsonify({'error': 'Error reading markdown content'}), 500


@app.route('/api/documents', methods=['GET'])
def get_documents():
    logger.info("--- START: GET /api/documents Request ---")
    session = Session()
    query = session.query(Document)

    # Filtering parameters
    q = request.args.get('q', '').strip()
    tag_filter = request.args.get('tag', '').strip()
    date_from_str = request.args.get('date_from', '').strip()
    date_to_str = request.args.get('date_to', '').strip()

    if q:
        query = query.filter(Document.title.ilike(f'%{q}%') | Document.filename.ilike(f'%{q}%'))
    
    if tag_filter:
        query = query.join(Document.tags).filter(Tag.name == tag_filter)

    try:
        if date_from_str:
            date_from = datetime.fromisoformat(date_from_str)
            query = query.filter(Document.upload_date >= date_from)
        if date_to_str:
            date_to = datetime.fromisoformat(date_to_str) + timedelta(days=1) # Include the whole day
            query = query.filter(Document.upload_date < date_to)
    except ValueError:
        logger.warning("Invalid date format provided.")
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    total_documents = query.count()
    documents = query.order_by(Document.upload_date.desc()).paginate(page=page, per_page=per_page, error_out=False)

    session.close()

    response_data = {
        'documents': [doc.to_dict() for doc in documents.items],
        'total': total_documents,
        'page': documents.page,
        'per_page': documents.per_page,
        'pages': documents.pages
    }
    logger.info("--- END: GET /api/documents Request (200 - Success) ---")
    return jsonify(response_data)

# --- Document Download Routes ---
@app.route('/api/documents/<int:document_id>/download', methods=['GET'])
def download_pdf(document_id):
    session = Session()
    document = session.query(Document).get(document_id) # Using query.get for now
    session.close()

    if not document or not document.filepath or not os.path.exists(document.filepath):
        logger.warning(f"Download request for non-existent or missing PDF for ID: {document_id}")
        return jsonify({'error': 'PDF document not found'}), 404
    
    # Use send_from_directory to securely serve the file
    return send_from_directory(app.config['UPLOAD_FOLDER'], document.filename, as_attachment=True)

if __name__ == '__main__':
    # Ensure database tables are created on startup (for development)
    with app.app_context():
        Base.metadata.create_all(engine)
    app.run(host='0.0.0.0', port=5050, debug=True)