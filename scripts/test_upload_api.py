# test_upload_api.py
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
                        f"Test '{test_name}' FAILED: Document '{key}' mismatch. Expected {expected_value}, got {actual_value}"
                elif key == 'document_metadata': # Special handling for metadata dict
                     for meta_key, meta_val in expected_value.items():
                         assert returned_document['document_metadata'].get(meta_key) == meta_val, \
                            f"Test '{test_name}' FAILED: Document metadata '{meta_key}' mismatch. Expected {meta_val}, got {returned_document['document_metadata'].get(meta_key)}"
                else:
                    assert actual_value == expected_value, \
                        f"Test '{test_name}' FAILED: Document '{key}' mismatch. Expected {expected_value}, got {actual_value}"
        
        print(f"Test '{test_name}' PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"Test '{test_name}' FAILED: Request failed - {e}")
    except AssertionError as e:
        print(f"Test '{test_name}' FAILED: {e}")
    except Exception as e:
        print(f"Test '{test_name}' FAILED: An unexpected error occurred - {e}")

# --- Test Cases ---
print("Starting backend API upload tests...\n")

# Test 1: Basic successful upload with minimal data
run_upload_test(
    "1. Basic successful upload",
    filename=DUMMY_PDF_FILENAME,
    file_content=DUMMY_PDF_CONTENT,
    expected_status=201,
    expected_message_substring="File uploaded successfully",
    check_document_data={
        "filename": DUMMY_PDF_FILENAME,
        "title": "test_document", # Default title derived from filename
        "status": "uploaded",
        "tags": [],
        "document_metadata": {}
    }
)

# Test 2: Upload with custom title and tags
custom_title = "Invoice Report Q3"
custom_tags = ["invoice", "finance", "report"]
custom_metadata = {"department": "accounting", "priority": "high"}

run_upload_test(
    "2. Upload with custom title, tags, and metadata",
    filename="invoice_q3.pdf",
    file_content=DUMMY_PDF_CONTENT,
    metadata={"title": custom_title, "source": "email"}, # Include custom title in metadata
    tags=custom_tags,
    expected_status=201,
    expected_message_substring="File uploaded successfully",
    check_document_data={
        "filename": "invoice_q3.pdf",
        "title": custom_title, # Should be the custom title from metadata
        "status": "uploaded",
        "tags": custom_tags,
        "document_metadata": {"title": custom_title, "source": "email"}
    }
)

# Test 3: Upload with empty metadata and tags
run_upload_test(
    "3. Upload with empty metadata and tags",
    filename="empty_meta_tags.pdf",
    file_content=DUMMY_PDF_CONTENT,
    metadata={},
    tags=[],
    expected_status=201,
    expected_message_substring="File uploaded successfully",
    check_document_data={
        "filename": "empty_meta_tags.pdf",
        "title": "empty_meta_tags",
        "status": "uploaded",
        "tags": [],
        "document_metadata": {}
    }
)

# Test 4: Upload without any metadata or tags fields
run_upload_test(
    "4. Upload without metadata or tags fields",
    filename="no_meta_no_tags.pdf",
    file_content=DUMMY_PDF_CONTENT,
    expected_status=201,
    expected_message_substring="File uploaded successfully",
    check_document_data={
        "filename": "no_meta_no_tags.pdf",
        "title": "no_meta_no_tags",
        "status": "uploaded",
        "tags": [],
        "document_metadata": {}
    }
)

# Test 5: Upload with invalid JSON for document_metadata
run_upload_test(
    "5. Upload with invalid JSON for document_metadata",
    filename="invalid_meta.pdf",
    file_content=DUMMY_PDF_CONTENT,
    metadata="this is not valid json", # Pass a string directly, not a dict
    tags=[],
    expected_status=400,
    expected_message_substring="Invalid JSON for document_metadata"
)

# Test 6: Upload with invalid JSON for tags
run_upload_test(
    "6. Upload with invalid JSON for tags",
    filename="invalid_tags.pdf",
    file_content=DUMMY_PDF_CONTENT,
    metadata={"title": "Test Invalid Tags"},
    tags="this is not valid json for tags", # Pass a string directly, not a list
    expected_status=201, # The backend is designed to *try* to parse, and if it fails, treat as literal string for the tag
    expected_message_substring="File uploaded successfully",
    check_document_data={
        "filename": "invalid_tags.pdf",
        "title": "Test Invalid Tags",
        "status": "uploaded",
        "tags": ["this is not valid json for tags"], # It should treat it as a single literal tag
        "document_metadata": {"title": "Test Invalid Tags"}
    }
)


# Test 7: Upload with no file part (should be caught by backend before save_file)
# This test requires manipulating `files` to be empty.
print(f"\n===== Running Upload Test: 7. Upload with no file part =====")
try:
    response = requests.post(UPLOAD_URL, files={}, data={'document_metadata': '{}'})
    response_data = response.json()

    print(f"\n--- API Response (Status: {response.status_code}) ---")
    print(json.dumps(response_data, indent=2))
    print("--------------------------------------")

    assert response.status_code == 400, \
        f"Test '7. Upload with no file part' FAILED: Expected status 400, got {response.status_code}. Response: {response.text}"
    assert "No file part in the request" in response_data.get('error', ''), \
        f"Test '7. Upload with no file part' FAILED: Expected error 'No file part', got '{response_data.get('error')}'"
    print(f"Test '7. Upload with no file part' PASSED.")

except requests.exceptions.RequestException as e:
    print(f"Test '7. Upload with no file part' FAILED: Request failed - {e}")
except AssertionError as e:
    print(f"Test '7. Upload with no file part' FAILED: {e}")
except Exception as e:
    print(f"Test '7. Upload with no file part' FAILED: An unexpected error occurred - {e}")


print("\nAll upload tests finished.")