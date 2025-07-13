from flask import Blueprint, request, jsonify, current_app
import json
import os
from backend.models import db
from backend.models.document import Document
from backend.models.tag import Tag
from backend.utils.storage import save_file
from backend.utils.indexing import update_document_search_index
import threading
import inspect # Add this import

print(f"--- DEBUG: Loading upload.py from: {__file__} ---") # Add this line

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/api/documents', methods=['POST'])
def upload_document():
    # ... (your existing code) ...

    try:
        # ... (your existing code for metadata and tags) ...

        # 4. Create document record
        print(f"--- DEBUG: Instantiating Document with file_path={filepath} ---") # Add this line
        print(f"--- DEBUG: Document class loaded from: {inspect.getfile(Document)} ---") # Add this line
        print(f"--- DEBUG: 'file_path' in Document.__dict__: {'file_path' in Document.__dict__}") # Add this line
        print(f"--- DEBUG: 'filepath' in Document.__dict__: {'filepath' in Document.__dict__}") # Add this line

        new_document = Document(
            title=document_title,
            filename=file.filename,
            file_path=filepath, # THIS MUST BE 'file_path'
            document_metadata=metadata_dict,
            status='uploaded'
        )
        # ... (rest of your code) ...