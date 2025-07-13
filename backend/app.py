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
from datetime import datetime
from pypdf import PdfReader # ADD THIS IMPORT

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

# --- ADDED: Content Security Policy (CSP) Header ---
@app.after_request
def add_security_headers(response):
    # WARNING: 'unsafe-eval' is included here to allow libraries like pdf2md.min.js to function.
    # This can make your application more vulnerable to XSS attacks.
    # For better security, consider using CSP-compliant Markdown rendering libraries.
    csp = (
        "default-src 'self';"
        "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net;" # Added 'unsafe-eval' and CDN
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;" # Added 'unsafe-inline' and CDN for styles if needed
        "img-src 'self' data:;" # Allows images from self and data URIs (for default thumbnail etc.)
        "connect-src 'self';" # Allows AJAX/fetch requests from self
        "object-src 'none';" # Blocks <object>, <embed>, <applet>
        "frame-ancestors 'none';" # Prevents your page from being embedded in iframes
        "base-uri 'self';" # Restricts the URLs that can be used in the document's <base> element
    )
    response.headers['Content-Security-Policy'] = csp
    response.headers['X-Content-Type-Options'] = 'nosniff' # Prevents browsers from MIME-sniffing a response away from the declared content-type
    response.headers['X-Frame-Options'] = 'DENY' # Prevents clickjacking
    response.headers['X-XSS-Protection'] = '1; mode=block' # Enables browser's built-in XSS filter
    return response
# --- END ADDED CSP HEADER ---


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

# Utility functions (consolidated)
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

def convert_pdf_to_markdown(pdf_path):
    """
    Converts text content from a PDF file into a basic Markdown string.
    This is a simple text extraction; complex layouts might not translate well.
    """
    markdown_content = []
    try:
        reader = PdfReader(pdf_path)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                # Basic attempt to format into Markdown-like structure
                # This can be heavily customized based on desired output
                lines = text.split('\n')
                for line in lines:
                    stripped_line = line.strip()
                    if not stripped_line:
                        continue

                    # Simple heuristics for Markdown
                    if len(stripped_line) < 50 and stripped_line.isupper():
                        markdown_content.append(f"## {stripped_line}") # Potential heading
                    elif stripped_line.endswith('.') or stripped_line.endswith('?'):
                        markdown_content.append(stripped_line + "\n") # Paragraph end
                    else:
                        markdown_content.append(stripped_line + " ") # Continue line

                markdown_content.append("\n\n---\n\n") # Separator between pages
        return "".join(markdown_content).strip()
    except Exception as e:
        logger.error(f"Error converting PDF {pdf_path} to markdown: {e}")
        return None # Return None if conversion fails


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
        # CHANGE THIS LINE from 'file' to 'pdf_file' as per frontend upload form
        if 'pdf_file'