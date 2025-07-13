# backend/routes/documents.py

from flask import Blueprint, request, jsonify, send_from_directory, current_app
from backend.models import db, Document, Tag
from backend.utils.storage import delete_file
import os
import json
from werkzeug.utils import secure_filename

documents_bp = Blueprint('documents', __name__)

# ... (your other routes like list_documents, get_document, update_document_metadata, delete_document) ...

# --- GET /api/documents/{id}/download ---
@documents_bp.route('/api/documents/<int:doc_id>/download', methods=['GET'])
def download_document(doc_id):
    document = Document.query.get(doc_id)
    if not document:
        current_app.logger.warning(f"Download attempt for non-existent document ID: {doc_id}")
        return jsonify({"error": "Document not found"}), 404

    # --- DEBUGGING PRINTS/LOGS START HERE ---
    current_app.logger.debug(f"Attempting to download document ID: {doc_id}")
    current_app.logger.debug(f"Document object: {document}")
    current_app.logger.debug(f"Document file_path from DB: {document.file_path}")

    # Ensure file_path is not None or empty
    if not document.file_path:
        current_app.logger.error(f"Document ID {doc_id} has no file_path stored.")
        return jsonify({"error": "Document has no associated file path"}), 404

    directory = os.path.dirname(document.file_path)
    filename = os.path.basename(document.file_path)

    current_app.logger.debug(f"Derived directory for send_from_directory: {directory}")
    current_app.logger.debug(f"Derived filename for send_from_directory: {filename}")

    # Check if the file actually exists on the filesystem
    full_disk_path = os.path.join(directory, filename)
    current_app.logger.debug(f"Checking existence of file at: {full_disk_path}")

    if not os.path.exists(full_disk_path):
        current_app.logger.error(f"File NOT FOUND on disk at: {full_disk_path}")
        return jsonify({"error": "File not found on server"}), 404 # This error is from your code
    # --- DEBUGGING PRINTS/LOGS END HERE ---

    try:
        # This is where the actual file serving happens.
        # Moved inside the try block to catch errors during serving.
        return send_from_directory(directory, filename, as_attachment=True, download_name=document.original_name or document.filename)
    except Exception as e:
        # This catch block is likely the source of the generic error you're seeing
        current_app.logger.error(f"Failed to send file {filename} from directory {directory}: {e}", exc_info=True)
        return jsonify({"error": "Failed to download document"}), 500 # This is likely your generic error source


# --- GET /api/tags (moved here for consistency, but could be in its own tags.py if more complex) ---
@documents_bp.route('/api/tags', methods=['GET'])
def get_all_tags():
    tags = Tag.query.all()
    return jsonify({"tags": [tag.name for tag in tags]})