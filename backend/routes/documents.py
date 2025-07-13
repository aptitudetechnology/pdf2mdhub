# backend/routes/documents.py

from flask import Blueprint, request, jsonify, send_from_directory, current_app
from backend.models import db, Document, Tag
from backend.utils.storage import delete_file
import os
import json # For metadata updates
from werkzeug.utils import secure_filename # For updating filename

documents_bp = Blueprint('documents', __name__)

# --- GET /api/documents ---
@documents_bp.route('/api/documents', methods=['GET'])
def list_documents():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    tag_filter = request.args.getlist('tags') # Can pass multiple 'tags=tag1&tags=tag2'

    documents_query = Document.query.order_by(Document.upload_date.desc())

    if status_filter:
        documents_query = documents_query.filter_by(status=status_filter)

    if tag_filter:
        for tag_name in tag_filter:
            documents_query = documents_query.filter(
                Document.tags.any(Tag.name == tag_name)
            )

    pagination = documents_query.paginate(page=page, per_page=per_page, error_out=False)
    documents = pagination.items

    return jsonify({
        "documents": [doc.to_dict() for doc in documents],
        "total_documents": pagination.total,
        "total_pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page
    })

# --- GET /api/documents/{id} ---
@documents_bp.route('/api/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    document = Document.query.get(doc_id)
    if not document:
        return jsonify({"error": "Document not found"}), 404
    return jsonify({"document": document.to_dict()})

# --- PUT /api/documents/{id} ---
@documents_bp.route('/api/documents/<int:doc_id>', methods=['PUT'])
def update_document_metadata(doc_id):
    document = Document.query.get(doc_id)
    if not document:
        return jsonify({"error": "Document not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    try:
        # Update metadata
        if 'metadata' in data and isinstance(data['metadata'], dict):
            # Using .update() allows merging existing metadata. Use assignment for full replacement.
            document.metadata.update(data['metadata'])

        # Update filename (if allowed and necessary)
        if 'filename' in data and data['filename'] != document.filename:
            # You might need logic here to rename the actual file on disk
            # For simplicity, we're just updating the DB record's filename field.
            document.filename = secure_filename(data['filename'])

        # Update status
        if 'status' in data and data['status'] in ['uploaded', 'processing_ocr', 'processed', 'failed']:
            document.status = data['status']

        # Update tags
        if 'tags' in data and isinstance(data['tags'], list):
            # Fetch existing tags and determine what to add/remove
            current_tags = {tag.name for tag in document.tags}
            new_tags_set = {tag.strip().lower() for tag in data['tags'] if tag.strip()}

            tags_to_add = new_tags_set - current_tags
            tags_to_remove = current_tags - new_tags_set

            # Remove tags
            for tag_name in tags_to_remove:
                tag_obj = Tag.query.filter_by(name=tag_name).first()
                if tag_obj and tag_obj in document.tags:
                    document.tags.remove(tag_obj)

            # Add new tags
            for tag_name in tags_to_add:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                document.tags.append(tag)
            db.session.flush() # Ensure new tags are persisted if added

        db.session.commit()
        return jsonify({
            "message": "Document updated successfully",
            "document": document.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating document {doc_id}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to update document: {str(e)}"}), 500

# --- DELETE /api/documents/{id} ---
@documents_bp.route('/api/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    document = Document.query.get(doc_id)
    if not document:
        return jsonify({"error": "Document not found"}), 404

    try:
        # Delete file from storage first
        success, msg = delete_file(document.file_path)
        if not success:
            current_app.logger.warning(f"Could not delete file {document.file_path} for document {doc_id}: {msg}")
            # Decide if you want to proceed with DB deletion if file deletion fails

        # Delete document record from database
        db.session.delete(document)
        db.session.commit()
        return jsonify({"message": "Document deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting document {doc_id}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to delete document: {str(e)}"}), 500

# --- GET /api/documents/{id}/download ---
@documents_bp.route('/api/documents/<int:doc_id>/download', methods=['GET'])
def download_document(doc_id):
    document = Document.query.get(doc_id)
    if not document:
        return jsonify({"error": "Document not found"}), 404

    directory = os.path.dirname(document.file_path)
    filename = os.path.basename(document.file_path)

    if not os.path.exists(document.file_path):
        return jsonify({"error": "File not found on server"}), 404

    return send_from_directory(directory, filename, as_attachment=True, download_name=document.filename)

# --- GET /api/tags (moved here for consistency, but could be in its own tags.py if more complex) ---
@documents_bp.route('/api/tags', methods=['GET'])
def get_all_tags():
    tags = Tag.query.all()
    return jsonify({"tags": [tag.name for tag in tags]})