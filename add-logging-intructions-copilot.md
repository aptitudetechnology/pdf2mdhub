# Adding Enhanced Logging for Debugging PDF2MD Hub

This document provides instructions for adding more detailed logging to the PDF2MD Hub backend, specifically focusing on the file upload and document processing routes. This will help diagnose "400 Bad Request" errors and other issues encountered during development.

The goal is to get more visibility into the data being received by the Flask application and the flow of execution within the critical API endpoints.

---

## 1. Configure Logging in `backend/app.py`

Ensure your `backend/app.py` has basic logging configured at the start.

**Open:** `backend/app.py`

**Add/Verify these lines near the top:**

```python
import logging # Add this import

# Configure logging
logging.basicConfig(level=logging.INFO, # Start with INFO, change to DEBUG for more verbosity
                    format='%(asctime)s %(levelname)s:%(name)s:%(message)s')
app_logger = logging.getLogger(__name__)

After db.create_all() in app.py (inside with app.app_context():), add:

db.create_all()
    app_logger.info("Database tables ensured.")
    # Add a log for the UPLOAD_FOLDER path
    app_logger.info(f"Using UPLOAD_FOLDER: {app.config['UPLOAD_FOLDER']}")
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        app_logger.warning(f"UPLOAD_FOLDER does not exist and will be created: {app.config['UPLOAD_FOLDER']}")

2. Enhance Logging in backend/routes/upload.py

This is the most critical route for the "400 Bad Request" issue during file upload. We need to log what the server is receiving.

Open: backend/routes/upload.py

Add current_app import:

from flask import Blueprint, request, jsonify, current_app # Add current_app
import json
from backend.models import db, Document, Tag
from backend.utils.storage import save_file
from backend.utils.indexing import update_document_search_index
import threading
import os # Make sure os is imported for path operations

Modify the upload_document function:

@upload_bp.route('/api/documents', methods=['POST'])
def upload_document():
    current_app.logger.info("--- START: POST /api/documents Request ---")
    current_app.logger.info(f"Headers: {request.headers}")
    current_app.logger.info(f"Form Data: {request.form}")
    current_app.logger.info(f"Files Data: {request.files}")

    file = request.files.get('pdf_file')

    if not file:
        current_app.logger.error("Error: No 'pdf_file' found in request.files.")
        current_app.logger.info("--- END: POST /api/documents Request (400 - No file part) ---")
        return jsonify({"error": "No file part in the request"}), 400

    current_app.logger.info(f"File found: {file.filename}, Content-Type: {file.content_type}")

    # Call save_file from utils/storage.py
    filepath, error = save_file(file)

    if error:
        current_app.logger.error(f"File saving error: {error}")
        current_app.logger.info("--- END: POST /api/documents Request (400 - File saving error) ---")
        return jsonify({"error": error}), 400

    current_app.logger.info(f"File saved to: {filepath}")

    try:
        uploaded_metadata = request.form.get('metadata')
        current_app.logger.info(f"Received metadata string: '{uploaded_metadata}'")

        try:
            metadata_dict = json.loads(uploaded_metadata) if uploaded_metadata else {}
            current_app.logger.info(f"Parsed metadata dictionary: {metadata_dict}")
        except json.JSONDecodeError as e:
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
            current_app.logger.error(f"JSON Decode Error for metadata: {e}. Metadata string was: '{uploaded_metadata}'")
            current_app.info("--- END: POST /api/documents Request (400 - Invalid metadata JSON) ---")
            return jsonify({"error": f"Invalid JSON for metadata: {e}"}), 400

        tag_names = request.form.getlist('tags')
        current_app.logger.info(f"Received tags: {tag_names}")

        tags = []
        for tag_name in tag_names:
            tag_name_cleaned = tag_name.strip().lower()
            if tag_name_cleaned:
                tag = Tag.query.filter_by(name=tag_name_cleaned).first()
                if not tag:
                    tag = Tag(name=tag_name_cleaned)
                    db.session.add(tag)
                    current_app.logger.info(f"Created new tag: {tag_name_cleaned}")
                tags.append(tag)
        db.session.flush()

        new_document = Document(
            filename=file.filename,
            file_path=filepath,
            metadata=metadata_dict,
            status='uploaded'
        )
        new_document.tags.extend(tags)

        db.session.add(new_document)
        db.session.commit()
        current_app.logger.info(f"Document record created in DB: ID={new_document.id}, Filename={new_document.filename}")

        # Trigger asynchronous text extraction and indexing
        threading.Thread(target=update_document_search_index,
                         args=(new_document.id, current_app._get_current_object())).start()
        current_app.logger.info(f"Started background thread for indexing document ID: {new_document.id}")

        current_app.logger.info("--- END: POST /api/documents Request (201 - Success) ---")
        return jsonify({
            "message": "File uploaded successfully. Processing for search indexing in background.",
            "document": new_document.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        current_app.logger.exception(f"Unhandled error during document upload processing.") # Logs traceback
        current_app.logger.info("--- END: POST /api/documents Request (500 - Server Error) ---")
        return jsonify({"error": f"Failed to upload document: {str(e)}"}), 500

        3. Add Logging to Other Routes (Optional, but Recommended)

For completeness and future debugging, consider adding similar entry/exit and error logging to your other API routes (backend/routes/documents.py, backend/routes/search.py).

Example for backend/routes/documents.py (for GET /api/documents/{id}):


# ... existing imports ...
from flask import Blueprint, request, jsonify, send_from_directory, current_app # Add current_app

# ... documents_bp definition ...

@documents_bp.route('/api/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    current_app.logger.info(f"--- START: GET /api/documents/{doc_id} Request ---")
    document = Document.query.get(doc_id)
    if not document:
        current_app.logger.warning(f"Document with ID {doc_id} not found.")
        current_app.logger.info(f"--- END: GET /api/documents/{doc_id} Request (404 - Not Found) ---")
        return jsonify({"error": "Document not found"}), 404
    current_app.logger.info(f"Found document: {document.filename}")
    current_app.logger.info(f"--- END: GET /api/documents/{doc_id} Request (200 - Success) ---")
    return jsonify({"document": document.to_dict()})

# ... continue for PUT, DELETE, etc. ...

Always use current_app.logger.exception(f"Message") inside except blocks to automatically include the traceback in the logs.

4. Rerun Your Application

After adding these logs, restart your Flask application. When you attempt an upload, pay close attention to your console output. The detailed INFO and ERROR messages will show you exactly what Flask is seeing in the request (Headers, Form Data, Files Data) and where the execution flow might be failing.

What to Look For in Logs:

    Files Data: ImmutableMultiDict([]): This is the most common indicator of a Content-Type issue. It means Flask received the request, but found no files in the expected multipart/form-data format. Check your frontend's Content-Type header (should be absent or multipart/form-data).

    File found: my_document.pdf, Content-Type: application/pdf: Good, the file itself was received.

    Received metadata string: 'null' or 'undefined': This indicates your frontend isn't sending the metadata form field, or it's sending an empty/null string.

    JSON Decode Error for metadata: The metadata form field was present, but its content wasn't valid JSON.

    Received tags: ImmutableMultiDict([]): Tags are not being sent as expected.

    Any Python tracebacks (TypeError, ValueError, KeyError, PermissionError).

By systematically checking these log outputs, you should be able to pinpoint why the "400 Bad Request" is occurring.