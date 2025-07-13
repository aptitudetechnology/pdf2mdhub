from flask import Flask, request, jsonify, render_template, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_moment import Moment
from datetime import datetime
import os
import uuid
import mimetypes
from pathlib import Path
import json
from werkzeug.utils import secure_filename
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#app = Flask(__name__)
app = Flask(__name__, template_folder=os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'frontend', 'templates'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///pdf2md.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Initialize extensions
db = SQLAlchemy(app)
CORS(app)
moment = Moment(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database Models
# No changes needed here, as the previous conversation already had this corrected.
# I'm just confirming that your code now looks good.
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
    # Renamed from 'metadata' to 'document_metadata'
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
            # Changed 'metadata' to 'document_metadata' here as well for consistency
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
    return tag

# API Routes
@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/documents', methods=['POST'])
def upload_document():
    """Upload and process document"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Generate unique filename
        original_name = secure_filename(file.filename)
        filename = f"{uuid.uuid4()}_{original_name}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save file
        file.save(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
        
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
        
        # Handle tags
        tags_data = request.form.get('tags', '[]')
        try:
            tags_list = json.loads(tags_data) if isinstance(tags_data, str) else tags_data
        except json.JSONDecodeError:
            tags_list = []
        
        for tag_name in tags_list:
            if tag_name.strip():
                tag = get_or_create_tag(tag_name.strip())
                document.tags.append(tag)
        
        # Handle metadata
        metadata_data = request.form.get('metadata', '{}')
        try:
            metadata_dict = json.loads(metadata_data) if isinstance(metadata_data, str) else metadata_data
        except json.JSONDecodeError:
            metadata_dict = {}
        
        for key, value in metadata_dict.items():
            metadata = DocumentMetadata(
                document_id=document.id,
                key=key,
                value=str(value)
            )
            db.session.add(metadata)
        
        db.session.commit()
        
        logger.info(f"Document uploaded: {original_name} (ID: {document.id})")
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error uploading document: {str(e)}")
        return jsonify({'error': 'Failed to upload document'}), 500

@app.route('/api/documents', methods=['GET'])
def list_documents():
    """List documents with optional filtering"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        tag = request.args.get('tag')
        search = request.args.get('search')
        
        # Build query
        query = Document.query
        
        if status:
            query = query.filter(Document.status == status)
        
        if tag:
            query = query.join(Document.tags).filter(Tag.name == tag)
        
        if search:
            query = query.filter(
                db.or_(
                    Document.original_name.contains(search),
                    Document.notes.contains(search),
                    Document.markdown_content.contains(search)
                )
            )
        
        # Order by upload date (newest first)
        query = query.order_by(Document.upload_date.desc())
        
        # Paginate
        documents = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
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
        logger.error(f"Error listing documents: {str(e)}")
        return jsonify({'error': 'Failed to list documents'}), 500

@app.route('/api/documents/<int:document_id>', methods=['GET'])
def get_document(document_id):
    """Get specific document"""
    try:
        document = Document.query.get_or_404(document_id)
        return jsonify(document.to_dict())
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {str(e)}")
        return jsonify({'error': 'Document not found'}), 404

@app.route('/api/documents/<int:document_id>', methods=['PUT'])
def update_document(document_id):
    """Update document metadata"""
    try:
        document = Document.query.get_or_404(document_id)
        data = request.get_json()
        
        # Update basic fields
        if 'notes' in data:
            document.notes = data['notes']
        if 'status' in data:
            document.status = data['status']
        if 'markdown_content' in data:
            document.markdown_content = data['markdown_content']
            document.processed_date = datetime.utcnow()
            if document.status == 'uploaded':
                document.status = 'processed'
        
        # Update tags
        if 'tags' in data:
            # Clear existing tags
            document.tags = []
            
            # Add new tags
            for tag_name in data['tags']:
                if tag_name.strip():
                    tag = get_or_create_tag(tag_name.strip())
                    document.tags.append(tag)
        
        # Update metadata
        if 'metadata' in data:
            # Clear existing metadata
            DocumentMetadata.query.filter_by(document_id=document_id).delete()
            
            # Add new metadata
            for key, value in data['metadata'].items():
                metadata = DocumentMetadata(
                    document_id=document_id,
                    key=key,
                    value=str(value)
                )
                db.session.add(metadata)
        
        db.session.commit()
        
        logger.info(f"Document updated: {document.original_name} (ID: {document_id})")
        
        return jsonify({
            'message': 'Document updated successfully',
            'document': document.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating document {document_id}: {str(e)}")
        return jsonify({'error': 'Failed to update document'}), 500

@app.route('/api/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete document"""
    try:
        document = Document.query.get_or_404(document_id)
        
        # Delete file from filesystem
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete from database
        db.session.delete(document)
        db.session.commit()
        
        logger.info(f"Document deleted: {document.original_name} (ID: {document_id})")
        
        return jsonify({'message': 'Document deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete document'}), 500

@app.route('/api/documents/<int:document_id>/markdown', methods=['GET'])
def get_document_markdown(document_id):
    """Get converted markdown content"""
    try:
        document = Document.query.get_or_404(document_id)
        
        if not document.markdown_content:
            return jsonify({'error': 'Document not processed yet'}), 404
        
        return jsonify({
            'markdown': document.markdown_content,
            'processed_date': document.processed_date.isoformat() if document.processed_date else None
        })
        
    except Exception as e:
        logger.error(f"Error getting markdown for document {document_id}: {str(e)}")
        return jsonify({'error': 'Failed to get markdown'}), 500

@app.route('/api/documents/<int:document_id>/download', methods=['GET'])
def download_document(document_id):
    """Download original document"""
    try:
        document = Document.query.get_or_404(document_id)
        
        if not os.path.exists(document.file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            document.file_path,
            as_attachment=True,
            download_name=document.original_name
        )
        
    except Exception as e:
        logger.error(f"Error downloading document {document_id}: {str(e)}")
        return jsonify({'error': 'Failed to download document'}), 500

@app.route('/api/search', methods=['GET'])
def search_documents():
    """Search documents"""
    try:
        query = request.args.get('q', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        # Search in multiple fields
        search_query = Document.query.filter(
            db.or_(
                Document.original_name.contains(query),
                Document.notes.contains(query),
                Document.markdown_content.contains(query)
            )
        ).order_by(Document.upload_date.desc())
        
        # Paginate results
        results = search_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'query': query,
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
        logger.error(f"Error searching documents: {str(e)}")
        return jsonify({'error': 'Search failed'}), 500

@app.route('/api/tags', methods=['GET'])
def list_tags():
    """List all tags"""
    try:
        tags = Tag.query.all()
        return jsonify([tag.to_dict() for tag in tags])
    except Exception as e:
        logger.error(f"Error listing tags: {str(e)}")
        return jsonify({'error': 'Failed to list tags'}), 500

# Web interface routes
@app.route('/')
def index():
    return render_template('search.html')

@app.route('/upload')
def upload_page():
    return render_template('upload.html')

@app.route('/viewer/<int:document_id>')
def viewer_page(document_id):
    return render_template('viewer.html', document_id=document_id)

# Initialize database


# No longer need @app.before_first_request
# The db.create_all() call within the `if __name__ == '__main__':` block
# is sufficient for running once on startup.

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # This is the correct place to ensure tables are created on startup
    app.run(debug=True, host='0.0.0.0', port=5000)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)