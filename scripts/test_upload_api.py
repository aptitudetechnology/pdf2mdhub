# test_upload_api.py
import pytest
from backend.app import create_app # Adjust this import if your app is elsewhere
import io
import json
from flask import url_for # Import url_for for robust URL generation

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    # If your app needs a real DB for tests, you'd configure it here
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    # with app.app_context():
    #    db.create_all() # Or run migrations

    with app.test_client() as client:
        # Push an application context if your test needs to access current_app or url_for directly
        with app.app_context():
            yield client
        # with app.app_context():
        #    db.drop_all() # Cleanup if you created tables

def test_document_upload_success(client):
    # Prepare a dummy file
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\ntrailer<</Size 3/Root 1 0 R>>startxref\n104\n%%EOF"
    file_data = (io.BytesIO(dummy_pdf_content), 'my_test_document.pdf')

    # Prepare metadata and tags
    document_metadata = {
        'title': 'Automated Test Document',
        'author': 'Test Suite',
        'year': 2024
    }
    tags = ['test-tag-1', 'api-upload-test']

    # Use the correct endpoint and method
    # According to app.url_map, the upload endpoint is '/api/upload' and the internal endpoint name is 'upload_file'
    # Using url_for with the blueprint and endpoint name is best practice
    # If upload_file is NOT part of a blueprint, use just 'upload_file'
    # If it IS part of the 'upload' blueprint, it would be 'upload.upload_file'
    # Your `upload.py` uses `upload_bp = Blueprint('upload', __name__)` so it's likely 'upload.upload_file'
    # However, your url_map output just says `upload_file`. This implies it's a root-level route,
    # or the blueprint registration is not prefixing the endpoint names.
    # Let's assume `upload_file` for now, but be aware of `upload.upload_file` as an alternative.
    # Based on your url_map, it appears upload_file is the direct endpoint name.
    
    # We use the literal string '/api/upload' for certainty, but url_for('upload_file') is preferred
    # if the app structure properly resolves it.
    upload_url = '/api/upload' # Or url_for('upload_file') if that works reliably

    response = client.post(
        upload_url,
        data={
            'file': file_data,
            'document_metadata': json.dumps(document_metadata),
            'tags': json.dumps(tags) # Ensure tags are also a JSON string
        },
        content_type='multipart/form-data'
    )

    # Assertions
    assert response.status_code == 201
    response_data = response.json
    assert response_data['message'] == "File uploaded successfully. Processing for search indexing in background."
    assert 'document' in response_data
    assert response_data['document']['title'] == 'Automated Test Document'
    assert response_data['document']['filename'] == 'my_test_document.pdf'
    # Add more assertions to check tags, file path (if returned), status, etc.
    assert 'tags' in response_data['document']
    assert len(response_data['document']['tags']) == 2
    assert 'test-tag-1' in [t['name'] for t in response_data['document']['tags']]

# Add more tests:
# - test_upload_no_file()
# - test_upload_invalid_metadata_json()
# - test_upload_invalid_tags_json()
# - test_upload_large_file() (if you have size limits)