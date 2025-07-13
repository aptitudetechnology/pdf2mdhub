# backend/routes/upload.py
from flask import Blueprint, request, jsonify, current_app
import json
import os
from backend.models import db
from backend.models.document import Document
from backend.models.tag import Tag
from backend.utils.storage import save_file
from backend.utils.indexing import update_document_search_index # Will be called asynchronously later
import threading # For basic async simulation

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/api/documents', methods=['POST'])
def upload_document():
    # 1. Handle file upload
    file = request.files.get('pdf_file')
    filepath, error = save_file(file)
    if error:
        return jsonify({"error": error}), 400
    
    try:
        # 2. Extract metadata from request.form
        # Assumes document_metadata is sent as a stringified JSON in 'document_metadata' form field
        uploaded_metadata = request.form.get('document_metadata')
        try:
            metadata_dict = json.loads(uploaded_metadata) if uploaded_metadata else {}
        except json.JSONDecodeError:
            # Clean up uploaded file if metadata is invalid
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": "Invalid JSON for document_metadata"}), 400
        
        # 3. Handle tags from request
        tag_names = request.form.getlist('tags') # Assumes tags are sent as multiple 'tags' fields
        tags = []
        for tag_name in tag_names:
            tag_name = tag_name.strip().lower() # Normalize tags
            if tag_name:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                tags.append(tag)
        
        db.session.flush() # Ensure new tags get IDs before associating with document
        
        # 4. Create document record
        new_document = Document(
            filename=file.filename, # Use original filename here
            file_path=filepath,
            document_metadata=metadata_dict,  # FIXED: Changed from metadata to document_metadata
            status='uploaded' # Initial status
        )
        new_document.tags.extend(tags)
        db.session.add(new_document)
        db.session.commit()
        
        # 5. Trigger asynchronous text extraction and indexing
        # For a real app, use a proper task queue (Celery, RQ)
        # Here, we'll use a simple thread for demonstration.
        # Pass current_app to ensure the new thread has an app context for DB operations.
        threading.Thread(target=update_document_search_index,
                        args=(new_document.id, current_app._get_current_object())).start()
        
        return jsonify({
            "message": "File uploaded successfully. Processing for search indexing in background.",
            "document": new_document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Clean up partially uploaded file if error occurs
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        current_app.logger.error(f"Error during document upload: {e}", exc_info=True)
        return jsonify({"error": f"Failed to upload document: {str(e)}"}), 500