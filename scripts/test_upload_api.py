# test_upload_api.py
import sys
print("Python sys.path:", sys.path) # DEBUG: Prints Python's module search path

# The import below is the one causing the error. We keep it to see sys.path before it fails.
from backend.app import create_app # Adjust this import if your app is elsewhere

import requests
import json
import io
import os
import time # For slight delays if needed

# --- Configuration ---
UPLOAD_URL = "http://127.0.0.1:5050/api/documents" # This matches your upload_bp.route

# A simple dummy PDF content for testing.
# This isn't a valid PDF, but it simulates a binary file for the upload process.
# The content itself won't be processed as a PDF by the backend unless you have a real PDF parser.
# For now, it just needs to be a byte stream.
DUMMY_PDF_CONTENT = b"This is a test PDF document for upload. It contains some text that might be indexed later."
DUMMY_PDF_FILENAME = "test_document.pdf"

# --- Test Helper Function ---
def run_upload_test(test_name, filename, file_content, metadata=None, tags=None, expected_status=201, expected_message_substring=None, check_document_data=None):
    """
    Runs a single API upload test and asserts its outcome.

    Args:
        test_name (str): A descriptive name for the test.
        filename (str): The name of the file to send.
        file_content (bytes): The binary content of the file.
        metadata (dict, optional): Dictionary for document_metadata.
        tags (list, optional): List of strings for tags.
        expected_status (int): The expected HTTP status code (default: 201 Created).
        expected_message_substring (str, optional): A substring expected in the 'message' field of the response.
        check_document_data (dict, optional): A dictionary of key-value pairs to check in the 'document' object.
    """
    print(f"\n===== Running Upload Test: {test_name} =====")
    print(f"Uploading to URL: {UPLOAD_URL}")

    # Prepare the file for requests
    files = {'file': (filename, io.BytesIO(file_content), 'application/pdf')}

    # Prepare form data
    data = {}
    if metadata is not None:
        data['document_metadata'] = json.dumps(metadata)
    if tags is not None:
        data['tags'] = json.dumps(tags)

    try:
        response = requests.post(UPLOAD_URL, files=files, data=data)
        response_data = {}
        try:
            response_data = response.json()
        except json.JSONDecodeError:
            print(f"Test '{test_name}' FAILED: Could not decode JSON from response. Response content: {response.text}")
            print(f"Status Code: {response.status_code}")
            assert False, "JSON Decode Error"

        print(f"\n--- API Response (Status: {response.status_code}) ---")
        print(json.dumps(response_data, indent=2))
        print("--------------------------------------")

        # Assertion 1: Check HTTP status code
        assert response.status_code == expected_status, \
            f"Test '{test_name}' FAILED: Expected status {expected_status}, got {response.status_code}. Response: {response.text}"

        # Assertion 2: Check message substring
        if expected_message_substring:
            actual_message = response_data.get('message', '')
            assert expected_message_substring in actual_message, \
                f"Test '{test_name}' FAILED: Expected message to contain '{expected_message_substring}', got '{actual_message}'"

        # Assertion 3: Check returned document data if status is success
        if expected_status >= 200 and expected_status < 300 and check_document_data:
            returned_document = response_data.get('document', {})
            assert returned_document, f"Test '{test_name}' FAILED: No 'document' object in successful response."
            for key, expected_value in check_document_data.items():
                actual_value = returned_document.get(key)
                if key == 'tags': # Special handling for tags, order might differ
                    actual_value_set = set(actual_value) if actual_value else set()
                    expected_value_set = set(expected_value) if expected_value else set()
                    assert actual_value_set == expected_value_set, \
                        f"Test '{test_name}' FAILED: Document '{key}' mismatch.