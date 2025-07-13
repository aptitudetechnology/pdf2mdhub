from flask import Flask, request, jsonify, render_template, send_file, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_moment import Moment
import logging
import os
import uuid
import mimetypes
from pathlib import Path
import json
from werkzeug.utils import secure_filename
from datetime import datetime # ADD THIS IMPORT

# Configure logging for the entire application
logging.basicConfig(level=logging.INFO, # Start with INFO, change to DEBUG for more verbosity during development
                    format='%(asctime)s %(levelname)s:%(name)s:%(message)s')
# Use the root logger or get a specific one if you want more granular control
# For this purpose, we can use current_app.logger or just a global 'logger'
logger = logging.getLogger(__name__) # Use this logger throughout the app for consistency

# --- CORRECTED AND CONSOLIDATED APP INITIALIZATION BLOCK ---

# 1. Define 'basedir' first, as it's the base for all other paths
basedir = os.path.abspath(os.path.dirname(__file__))

# 2. Define 'template_folder_path' using 'basedir'
template_folder_path = os.path.join(basedir, '..', 'frontend', 'templates')

# 3. Define 'static_folder_path' using 'basedir'
static_folder_path = os.path.join(basedir, '..', 'frontend', 'static')

# 4. Initialize Flask ONCE, using the defined paths
app = Flask(__name__,
            template_folder=template_folder_path,
            static_folder=static_folder_path)

# 5. Apply all app.config settings to this ONE 'app' instance
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///pdf2md.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# --- END CORRECTED APP INITIALIZATION BLOCK ---

## Add lines for debugging
logger.info(f"DEBUG: App template folder set to: {app.template_folder}")
logger.info(f"DEBUG: App static folder set to: {app.static_folder}")
logger.info(f"DEBUG: UPLOAD_FOLDER configured to: {app.config['UPLOAD_FOLDER']}")


# Initialize extensions (these must be initialized AFTER 'app' is defined)
db = SQLAlchemy(app)
CORS(app)
moment = Moment(app)

# Ensure upload directory exists
with app.app_context():
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        logger.warning(f"UPLOAD_FOLDER does not exist and will be created: {app.config['UPLOAD_FOLDER']}")
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    else:
        logger.info(f"UPLOAD_FOLDER already exists: {app.config['UPLOAD_FOLDER']}")

# Database Models
class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    markdown_content = db.Column(db.Text)
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    processed_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='uploaded')  # uploaded, processing, processed, failed
    uploaded_by = db.Column(db.String(100))
    notes = db.Column(db.Text)

    # Relationships
    tags = db.relationship('Tag', secondary='document_tags', backref='documents')
    document_metadata = db.relationship('DocumentMetadata', backref='document', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'processed_date': self.processed_date.isoformat() if self.processed_date else None,
            'status': self.status,
            'uploaded_by': self.uploaded_by,
            'notes': self.notes,
            'tags': [tag.name for tag in self.tags],
            'metadata': {meta.key: meta.value for meta in self.document_metadata}
        }

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# Association table for many-to-many relationship
document_tags = db.Table('document_tags',
    db.Column('document_id', db.Integer, db.ForeignKey('documents.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

class DocumentMetadata(db.Model):
    __tablename__ = 'document_metadata'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Text)

# Utility functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['pdf']

def get_or_create_tag(tag_name):
    """Get existing tag or create new one"""
    tag = Tag.query.filter_by(name=tag_name).first()
    if not tag:
        tag = Tag(name=tag_name)
        db.session.add(tag)
        logger.info(f"Created new tag: {tag_name}") # Log tag creation
    return tag

# API Routes
@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    logger.info("--- START: GET /api/health Request ---")
    response = jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })
    logger.info("--- END: GET /api/health Request (200 - Success) ---")
    return response

@app.route('/api/documents', methods=['POST'])
def upload_document():
    """Upload and process document"""
    logger.info("--- START: POST /api/documents Request ---")
    logger.info(f"Headers: {request.headers}")
    logger.info(f"Form Data: {request.form}")
    logger.info(f"Files Data: {request.files}")

    try:
        if 'file' not in request.files:
            logger.error("Error: No 'file' part in request.files.")
            logger.info("--- END: POST /api/documents Request (400 - No file part) ---")
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            logger.error("Error: No file selected, filename is empty.")
            logger.info("--- END: POST /api/documents Request (400 - No file selected) ---")
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            logger.error(f"Error: File type not allowed for {file.filename}.")
            logger.info("--- END: POST /api/documents Request (400 - File type not allowed) ---")
            return jsonify({'error': 'File type not allowed'}), 400

        logger.info(f"File received: {file.filename}, Content-Type: {file.content_type}")

        # Generate unique filename
        original_name = secure_filename(file.filename)
        filename = f"{uuid.uuid4()}_{original_name}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        # Save file
        file.save(file_path)
        logger.info(f"File saved to: {file_path}")

        # Get file info
        file_size = os.path.getsize(file_path)
        mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
        logger.info(f"File size: {file_size} bytes, MIME type: {mime_type}")

        # Create document record
        document = Document(
            filename=filename,
            original_name=original_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=request.form.get('uploaded_by', 'anonymous'),
            notes=request.form.get('notes', ''),
            status='uploaded'
        )

        db.session.add(document)
        db.session.flush()  # Get the ID
        logger.info(f"Document record initialized in DB (not yet committed): ID={document.id}, Original Name={document.original_name}")

        # Handle tags
        tags_data = request.form.get('tags', '[]')
        logger.info(f"Received tags string: '{tags_data}'")
        try:
            tags_list = json.loads(tags_data) if isinstance(tags_data, str) else tags_data
            if not isinstance(tags_list, list):
                raise ValueError("Tags data is not a list after JSON parsing.")
            logger.info(f"Parsed tags list: {tags_list}")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"JSON Decode/Value Error for tags: {e}. Tags string was: '{tags_data}'")
            # Clean up uploaded file if metadata/tags are invalid
            if os.path.exists(file_path):
                os.remove(file_path)
            db.session.rollback()
            logger.info("--- END: POST /api/documents Request (400 - Invalid tags JSON) ---")
            return jsonify({"error": f"Invalid JSON for tags: {e}"}), 400

        for tag_name in tags_list:
            if tag_name.strip():
                tag = get_or_create_tag(tag_name.strip())
                document.tags.append(tag)
        logger.info(f"Tags associated with document.")

        # Handle metadata
        metadata_data = request.form.get('metadata', '{}')
        logger.info(f"Received metadata string: '{metadata_data}'")
        try:
            metadata_dict = json.loads(metadata_data) if isinstance(metadata_data, str) else metadata_data
            if not isinstance(metadata_dict, dict):
                raise ValueError("Metadata data is not a dictionary after JSON parsing.")
            logger.info(f"Parsed metadata dictionary: {metadata_dict}")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"JSON Decode/Value Error for metadata: {e}. Metadata string was: '{metadata_data}'")
            # Clean up uploaded file if metadata/tags are invalid
            if os.path.exists(file_path):
                os.remove(file_path)
            db.session.rollback()
            logger.info("--- END: POST /api/documents Request (400 - Invalid metadata JSON) ---")
            return jsonify({"error": f"Invalid JSON for metadata: {e}"}), 400

        for key, value in metadata_dict.items():
            metadata = DocumentMetadata(
                document_id=document.id,
                key=key,
                value=str(value)
            )
            db.session.add(metadata)
        logger.info(f"Metadata associated with document.")

        db.session.commit()
        logger.info(f"Document uploaded and committed to DB: {original_name} (ID: {document.id})")

        logger.info("--- END: POST /api/documents Request (201 - Success) ---")
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        # Ensure cleanup of potentially saved file on error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
            logger.warning(f"Cleaned up partially uploaded file: {file_path}")
        logger.exception(f"Unhandled error during document upload processing.") # Logs traceback
        logger.info("--- END: POST /api/documents Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to upload document due to server error'}), 500

@app.route('/api/documents', methods=['GET'])
def list_documents():
    """List documents with optional filtering"""
    logger.info("--- START: GET /api/documents Request ---")
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        tag = request.args.get('tag')
        search = request.args.get('search')

        logger.info(f"Query params: page={page}, per_page={per_page}, status={status}, tag={tag}, search='{search}'")

        # Build query
        query = Document.query

        if status:
            query = query.filter(Document.status == status)
            logger.info(f"Filtering by status: {status}")

        if tag:
            query = query.join(Document.tags).filter(Tag.name == tag)
            logger.info(f"Filtering by tag: {tag}")

        if search:
            query = query.filter(
                db.or_(
                    Document.original_name.contains(search),
                    Document.notes.contains(search),
                    Document.markdown_content.contains(search)
                )
            )
            logger.info(f"Filtering by search query: '{search}'")

        # Order by upload date (newest first)
        query = query.order_by(Document.upload_date.desc())

        # Paginate
        documents = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        logger.info(f"Found {documents.total} documents. Returning page {page} of {documents.pages}.")
        logger.info("--- END: GET /api/documents Request (200 - Success) ---")
        return jsonify({
            'documents': [doc.to_dict() for doc in documents.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': documents.total,
                'pages': documents.pages,
                'has_next': documents.has_next,
                'has_prev': documents.has_prev
            }
        })

    except Exception as e:
        logger.exception(f"Error listing documents.") # Logs traceback
        logger.info("--- END: GET /api/documents Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to list documents'}), 500

@app.route('/api/documents/<int:document_id>', methods=['GET'])
def get_document(document_id):
    """Get specific document"""
    logger.info(f"--- START: GET /api/documents/{document_id} Request ---")
    try:
        document = Document.query.get_or_404(document_id)
        logger.info(f"Found document: {document.original_name} (ID: {document.id})")
        logger.info(f"--- END: GET /api/documents/{document_id} Request (200 - Success) ---")
        return jsonify(document.to_dict())
    except Exception as e:
        logger.warning(f"Document with ID {document_id} not found or error: {e}")
        logger.info(f"--- END: GET /api/documents/{document_id} Request (404 - Not Found) ---")
        return jsonify({'error': 'Document not found'}), 404

@app.route('/api/documents/<int:document_id>', methods=['PUT'])
def update_document(document_id):
    """Update document metadata"""
    logger.info(f"--- START: PUT /api/documents/{document_id} Request ---")
    logger.info(f"Request data for update: {request.get_json()}")
    try:
        document = Document.query.get_or_404(document_id)
        data = request.get_json()

        logger.info(f"Updating document: {document.original_name} (ID: {document_id}) with data: {data}")

        # Update basic fields
        if 'notes' in data:
            document.notes = data['notes']
            logger.info(f"Updated notes to: {data['notes']}")
        if 'status' in data:
            document.status = data['status']
            logger.info(f"Updated status to: {data['status']}")
        if 'markdown_content' in data:
            document.markdown_content = data['markdown_content']
            document.processed_date = datetime.utcnow()
            if document.status == 'uploaded':
                document.status = 'processed'
            logger.info(f"Updated markdown content and set processed_date. New status: {document.status}")


        # Update tags
        if 'tags' in data:
            logger.info(f"Received tags for update: {data['tags']}")
            # Clear existing tags
            document.tags = []
            logger.info("Cleared existing tags.")

            # Add new tags
            for tag_name in data['tags']:
                if tag_name.strip():
                    tag = get_or_create_tag(tag_name.strip())
                    document.tags.append(tag)
            logger.info("Added new tags.")

        # Update metadata
        if 'metadata' in data:
            logger.info(f"Received metadata for update: {data['metadata']}")
            # Clear existing metadata
            DocumentMetadata.query.filter_by(document_id=document_id).delete()
            logger.info("Cleared existing metadata.")

            # Add new metadata
            for key, value in data['metadata'].items():
                metadata = DocumentMetadata(
                    document_id=document_id,
                    key=key,
                    value=str(value)
                )
                db.session.add(metadata)
            logger.info("Added new metadata.")

        db.session.commit()

        logger.info(f"Document updated and committed: {document.original_name} (ID: {document_id})")
        logger.info(f"--- END: PUT /api/documents/{document_id} Request (200 - Success) ---")
        return jsonify({
            'message': 'Document updated successfully',
            'document': document.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error updating document {document_id}.") # Logs traceback
        logger.info(f"--- END: PUT /api/documents/{document_id} Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to update document'}), 500

@app.route('/api/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete document"""
    logger.info(f"--- START: DELETE /api/documents/{document_id} Request ---")
    try:
        document = Document.query.get_or_404(document_id)
        logger.info(f"Attempting to delete document: {document.original_name} (ID: {document.id})")

        # Delete file from filesystem
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
            logger.info(f"Deleted file from filesystem: {document.file_path}")
        else:
            logger.warning(f"File not found on disk for deletion: {document.file_path}")

        # Delete from database
        db.session.delete(document)
        db.session.commit()

        logger.info(f"Document record deleted from DB: {document.original_name} (ID: {document.id})")
        logger.info(f"--- END: DELETE /api/documents/{document_id} Request (200 - Success) ---")
        return jsonify({'message': 'Document deleted successfully'})

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error deleting document {document_id}.") # Logs traceback
        logger.info(f"--- END: DELETE /api/documents/{document_id} Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to delete document'}), 500

@app.route('/api/documents/<int:document_id>/markdown', methods=['GET'])
def get_document_markdown(document_id):
    """Get converted markdown content"""
    logger.info(f"--- START: GET /api/documents/{document_id}/markdown Request ---")
    try:
        document = Document.query.get_or_404(document_id)

        if not document.markdown_content:
            logger.warning(f"Markdown content not found for document ID {document_id}.")
            logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (404 - Not Processed) ---")
            return jsonify({'error': 'Document not processed yet'}), 404

        logger.info(f"Returning markdown for document ID {document_id}.")
        logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (200 - Success) ---")
        return jsonify({
            'markdown': document.markdown_content,
            'processed_date': document.processed_date.isoformat() if document.processed_date else None
        })

    except Exception as e:
        logger.exception(f"Error getting markdown for document {document_id}.") # Logs traceback
        logger.info(f"--- END: GET /api/documents/{document_id}/markdown Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to get markdown'}), 500

@app.route('/api/documents/<int:document_id>/download', methods=['GET'])
def download_document(document_id):
    """Download original document"""
    logger.info(f"--- START: GET /api/documents/{document_id}/download Request ---")
    try:
        document = Document.query.get_or_404(document_id)
        logger.info(f"Attempting to download file: {document.original_name} from {document.file_path}")

        if not os.path.exists(document.file_path):
            logger.warning(f"File not found on disk for download: {document.file_path}")
            logger.info(f"--- END: GET /api/documents/{document_id}/download Request (404 - File Not Found) ---")
            return jsonify({'error': 'File not found'}), 404

        logger.info(f"Serving file for download: {document.original_name}")
        logger.info(f"--- END: GET /api/documents/{document_id}/download Request (200 - Success) ---")
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_name
        )

    except Exception as e:
        logger.exception(f"Error downloading document {document_id}.") # Logs traceback
        logger.info(f"--- END: GET /api/documents/{document_id}/download Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to download document'}), 500

@app.route('/api/search', methods=['GET'])
def search_documents():
    """Search documents"""
    logger.info("--- START: GET /api/search Request ---")
    try:
        query_str = request.args.get('q', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        logger.info(f"Search params: query='{query_str}', page={page}, per_page={per_page}")

        # If no query is provided, return all documents (paginated)
        if not query_str:
            base_query = Document.query
            logger.info("No search query provided, listing all documents.")
        else:
            # Search in multiple fields if a query is provided
            base_query = Document.query.filter(
                db.or_(
                    Document.original_name.contains(query_str),
                    Document.notes.contains(query_str),
                    Document.markdown_content.contains(query_str)
                )
            )
            logger.info(f"Searching for documents matching '{query_str}'.")

        # Order by upload date (newest first)
        search_query = base_query.order_by(Document.upload_date.desc())

        # Paginate results
        results = search_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        logger.info(f"Found {results.total} search results. Returning page {page} of {results.pages}.")
        logger.info("--- END: GET /api/search Request (200 - Success) ---")
        return jsonify({
            'query': query_str,
            'results': [doc.to_dict() for doc in results.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': results.total,
                'pages': results.pages,
                'has_next': results.has_next,
                'has_prev': results.has_prev
            }
        })

    except Exception as e:
        logger.exception(f"Error searching documents.") # Logs traceback
        logger.info("--- END: GET /api/search Request (500 - Server Error) ---")
        return jsonify({'error': 'Search failed'}), 500

@app.route('/api/tags', methods=['GET'])
def list_tags():
    """List all tags"""
    logger.info("--- START: GET /api/tags Request ---")
    try:
        tags = Tag.query.all()
        logger.info(f"Returning {len(tags)} tags.")
        logger.info("--- END: GET /api/tags Request (200 - Success) ---")
        return jsonify([tag.to_dict() for tag in tags])
    except Exception as e:
        logger.exception(f"Error listing tags.") # Logs traceback
        logger.info("--- END: GET /api/tags Request (500 - Server Error) ---")
        return jsonify({'error': 'Failed to list tags'}), 500

# Web interface routes
@app.route('/')
def index():
    logger.info("--- Serving index page (search.html) ---")
    return render_template('search.html')

@app.route('/upload')
def upload_page():
    logger.info("--- Serving upload page (upload.html) ---")
    return render_template('upload.html')

@app.route('/viewer/<int:document_id>')
def viewer_page(document_id):
    logger.info(f"--- Serving viewer page (viewer.html) for document ID: {document_id} ---")
    return render_template('viewer.html', document_id=document_id)

# The single and correct entry point for running the app and creating tables
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # This ensures tables are created when you run app.py directly
        logger.info("Database tables ensured.")
    app.run(debug=True, host='0.0.0.0', port=5000)