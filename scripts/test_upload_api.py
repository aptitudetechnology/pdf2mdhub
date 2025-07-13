import requests
import io
import json

# Download the PDF file and store it as DUMMY_PDF_CONTENT
def download_test_pdf():
    """Download the test PDF file and return its content as bytes."""
    pdf_url = "https://www.melbpc.org.au/wp-content/uploads/2017/10/small-example-pdf-file.pdf"
    
    try:
        print(f"Downloading test PDF from: {pdf_url}")
        response = requests.get(pdf_url)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        
        print(f"Successfully downloaded PDF ({len(response.content)} bytes)")
        return response.content
    
    except requests.exceptions.RequestException as e:
        print(f"Failed to download PDF: {e}")
        print("Using minimal fallback PDF content...")
        
        # Fallback minimal PDF content
        return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n173\n%%EOF"

# Download the PDF content
DUMMY_PDF_CONTENT = download_test_pdf()

# Your existing function and test code goes here...
def run_upload_test(test_name, filename, file_content, metadata=None, tags=None, title=None, expected_status=201, expected_message_substring=None, check_document_data=None):
    """
    Runs a single API upload test and asserts its outcome.

    Args:
        test_name (str): A descriptive name for the test.
        filename (str): The name of the file to send.
        file_content (bytes): The binary content of the file.
        metadata (dict, optional): Dictionary for document_metadata.
        tags (list, optional): List of strings for tags.
        title (str, optional): Title for the document.
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
    if title is not None:
        data['title'] = title

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

# Make sure you have UPLOAD_URL defined somewhere in your script
  UPLOAD_URL = "http://127.0.0.1:5050/upload"  # Replace with your actual URL

# Your test case
run_upload_test(
    "2. Upload with custom title, tags, and metadata",
    filename="invoice_q3.pdf",
    file_content=DUMMY_PDF_CONTENT,
    title="Invoice Report Q3",
    metadata={"source": "email", "department": "accounting"},
    tags=["invoice", "finance", "report"],
    expected_status=201,
    expected_message_substring="File uploaded successfully",
    check_document_data={
        "filename": "invoice_q3.pdf",
        "title": "Invoice Report Q3",
        "status": "uploaded",
        "tags": ["invoice", "finance", "report"],
        "document_metadata": {"source": "email", "department": "accounting"}
    }
)