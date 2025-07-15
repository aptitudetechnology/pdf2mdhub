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
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MARKDOWN_FOLDER = os.path.join(BASE_DIR, 'md')
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
                static_folder=os.path.join(BASE_DIR, '..', 'frontend', 'static'),
                template_folder=os.path.join(BASE_DIR, '..', 'frontend', 'templates'))
    
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