from flask import Blueprint, request, jsonify, current_app
import json
import os
from backend.models import db
from backend.models.document import Document
from backend.models.tag import Tag
from backend.utils.storage import save_file
from backend.utils.indexing import update_document_search_index
import threading
import inspect # ADDED: Import inspect for debugging

print(f"--- DEBUG: Loading upload.py from: {__file__} ---") # DEBUG: Prints file path on module load

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/api/documents', methods=['POST'])
def upload_document():
    # 1. Handle file upload - accept 'file' as sent by frontend
    file = request.files.get('file') # CORRECTED: Changed from 'pdf_file' to 'file'
    if not file: # Add check for missing file
        return jsonify({"error": "No file part in the request"}), 400

    filepath, error = save_file(file)
    if error:
        return jsonify({"error": error}), 400

    try:
        # 2. Extract metadata from request.form
        uploaded_metadata = request.form.get('document_metadata')
        try:
            metadata_dict = json.loads(uploaded_metadata) if uploaded_metadata else {}
        except json.JSONDecodeError:
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": "Invalid JSON for document_metadata"}), 400

        # Extract title from metadata or default to filename (REQUIRED for nullable=False)
        document_title = metadata_dict.get('title', file.filename.rsplit('.', 1)[0])

        # 3. Handle tags from request - expecting JSON string from frontend
        raw_tags = request.form.get('tags')
        tag_names = []
        if raw_tags:
            try:
                parsed_tags = json.loads(raw_tags)
                if isinstance(parsed_tags, list):
                    tag_names = parsed_tags
                else:
                    current_app.logger.warning(f"Tags JSON was not a list: {raw_tags}, treating as single tag.")
                    tag_names = [raw_tags]
            except json.JSONDecodeError:
                current_app.logger.warning(f"Invalid JSON for tags: {raw_tags}, treating as literal tag string.")
                tag_names = [raw_tags]

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
        print(f"--- DEBUG: Instantiating Document with file_path='{filepath}' ---") # DEBUG: Print argument
        print(f"--- DEBUG: Document class loaded from: {inspect.getfile(Document)} ---") # DEBUG: Print Document class source
        print(f"--- DEBUG: 'file_path' in Document.__dict__: {'file_path' in Document.__dict__}") # DEBUG: Check for 'file_path'
        print(f"--- DEBUG: 'filepath' in Document.__dict__: {'filepath' in Document.__dict__}") # DEBUG: Check for 'filepath'

        new_document = Document(
            title=document_title,
            filename=file.filename,
            file_path=filepath, # THIS MUST BE 'file_path'
            document_metadata=metadata_dict,
            status='uploaded'
        )
        new_document.tags.extend(tags)
        db.session.add(new_document)
        db.session.commit()

        # 5. Trigger asynchronous text extraction and indexing
        threading.Thread(target=update_document_search_index,
                        args=(new_document.id, current_app._get_current_object())).start()

        return jsonify({
            "message": "File uploaded successfully. Processing for search indexing in background.",
            "document": new_document.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        current_app.logger.error(f"Error during document upload: {e}", exc_info=True)
        return jsonify({"error": f"Failed to upload document: {str(e)}"}), 500