import requests
import json
from datetime import datetime, timedelta

# Configuration for the API endpoint
BASE_URL = "http://127.0.0.1:5000/api/search"

def run_test(test_name, url, expected_status=200, check_results_count=None, check_pagination=None, check_tags=None, check_query=None):
    """
    Runs a single API search test and asserts its outcome.

    Args:
        test_name (str): A descriptive name for the test.
        url (str): The full URL to request for the search.
        expected_status (int): The expected HTTP status code (default: 200).
        check_results_count (int, optional): The expected number of documents in the 'results' list.
        check_pagination (dict, optional): A dictionary of expected key-value pairs for the 'pagination' object.
        check_tags (list, optional): A list of tags to check if they are present in the returned documents.
                                      For simplicity, assumes at least one document should contain these tags.
        check_query (str, optional): The expected value for the 'query' field in the response.
    """
    print(f"\n===== Running Test: {test_name} =====")
    print(f"Requesting URL: {url}")
    try:
        response = requests.get(url)
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        response_data = response.json()

        print(f"\n--- API Response (Status: {response.status_code}) ---")
        print(json.dumps(response_data, indent=2))
        print("--------------------------------------")

        # Assertion 1: Check HTTP status code
        assert response.status_code == expected_status, \
            f"Test '{test_name}' FAILED: Expected status {expected_status}, got {response.status_code}"

        # **FIXED:** Assert that 'results' key exists
        assert 'results' in response_data, \
            f"Test '{test_name}' FAILED: Assertion Error - Response missing 'results' key"

        # **FIXED:** Get results from the 'results' key
        results = response_data.get('results', [])
        pagination = response_data.get('pagination', {})
        query = response_data.get('query', '') # Get the query from the response

        # Assertion 2: Check results count if specified
        if check_results_count is not None:
            assert len(results) == check_results_count, \
                f"Test '{test_name}' FAILED: Expected {check_results_count} results, got {len(results)}"

        # Assertion 3: Check pagination if specified
        if check_pagination:
            for key, expected_value in check_pagination.items():
                actual_value = pagination.get(key)
                # Handle boolean comparison explicitly
                if isinstance(expected_value, bool) and isinstance(actual_value, bool):
                    assert actual_value == expected_value, \
                        f"Test '{test_name}' FAILED: Pagination '{key}' mismatch. Expected {expected_value}, got {actual_value}"
                else:
                    assert actual_value == expected_value, \
                        f"Test '{test_name}' FAILED: Pagination '{key}' mismatch. Expected {expected_value}, got {actual_value}"


        # Assertion 4: Check tags in results (if documents are expected)
        if check_tags and check_results_count and check_results_count > 0:
            found_all_expected_tags = True
            for expected_tag in check_tags:
                tag_found_in_any_doc = False
                for doc in results:
                    doc_tags = doc.get('tags', [])
                    if expected_tag in doc_tags:
                        tag_found_in_any_doc = True
                        break
                if not tag_found_in_any_doc:
                    found_all_expected_tags = False
                    assert False, f"Test '{test_name}' FAILED: No document found with tag '{expected_tag}'"
            if found_all_expected_tags: # Only print PASS if all tags were found
                 print(f"Test '{test_name}' PASSED for tags check.")
        elif check_tags and (check_results_count is None or check_results_count == 0):
            # If tags are checked but no results are expected, ensure no results are returned.
            assert len(results) == 0, f"Test '{test_name}' FAILED: Expected no results, but received some while checking for tags."


        # Assertion 5: Check query in response
        if check_query is not None:
            assert query == check_query, \
                f"Test '{test_name}' FAILED: Query mismatch. Expected '{check_query}', got '{query}'"

        print(f"Test '{test_name}' PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"Test '{test_name}' FAILED: Request failed - {e}")
    except AssertionError as e:
        print(f"Test '{test_name}' FAILED: {e}")
    except json.JSONDecodeError:
        print(f"Test '{test_name}' FAILED: Could not decode JSON from response. Response content: {response.text}")
    except Exception as e:
        print(f"Test '{test_name}' FAILED: An unexpected error occurred - {e}")

# --- Test Cases ---
print("Starting backend API tests...\n")

# Get today's date and calculate relevant dates for date range tests
today = datetime.now()
yesterday = today - timedelta(days=1)
last_week = today - timedelta(days=7)
last_month = today - timedelta(days=30)
future_date = today + timedelta(days=7)


# 1. All documents (empty query)
run_test(
    "1. All documents (empty query)",
    f"{BASE_URL}", # No query params for simplicity, or ?q= for explicit empty query
    check_results_count=1, # Expecting 1 document from previous upload
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 2. Search by query 'test' (should yield no results if content does not contain 'test')
# The uploaded content does not contain "test"
run_test(
    "2. Search by query 'test'",
    f"{BASE_URL}?q=test",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 20, "has_next": False, "has_prev": False},
    check_query="test"
)

# 2a. Search by query 'document' (should yield result if content contains 'document' - which it does from markdown_content)
run_test(
    "2a. Search by query 'document'",
    f"{BASE_URL}?q=document",
    check_results_count=1,
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 20, "has_next": False, "has_prev": False},
    check_query="document"
)

# 2b. Search by query 'report' (should yield no result if content does not contain 'report')
# The uploaded content does not contain "report"
run_test(
    "2b. Search by query 'report'",
    f"{BASE_URL}?q=report",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 20, "has_next": False, "has_prev": False},
    check_query="report"
)


# 3. Search by single tag 'invoice' (should yield 1 result as the uploaded document has 'invoice' tag)
run_test(
    "3. Search by single tag 'invoice'",
    f"{BASE_URL}?tags=invoice",
    check_results_count=1,
    check_tags=['invoice'],
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 20, "has_next": False, "has_prev": False},
    check_query="" # Tags don't change the query field, which reflects the 'q' parameter
)

# 3a. Search by single tag 'meeting' (should yield no result as the uploaded document has 'invoice' only)
run_test(
    "3a. Search by single tag 'meeting'",
    f"{BASE_URL}?tags=meeting",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)


# 3b. Search by multiple tags 'invoice,report' (should yield 1 result if the document has 'invoice', even if not 'report')
run_test(
    "3b. Search by multiple tags 'invoice,report'",
    f"{BASE_URL}?tags=invoice%2Creport", # URL-encoded comma
    check_results_count=1,
    check_tags=['invoice'], # Still expect 'invoice' as the only relevant tag from our single uploaded doc
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 3c. Search by non-existent tag
run_test(
    "3c. Search by non-existent tag",
    f"{BASE_URL}?tags=nonexistenttag",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 4. Search by date_from (last week to today)
# Assuming the document was uploaded today (current date: July 13, 2025)
run_test(
    "4. Search by date_from (last week to today)",
    f"{BASE_URL}?date_from={last_week.strftime('%Y-%m-%d')}",
    check_results_count=1,
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 4a. Search by date_to (up to yesterday)
# The document was uploaded *today*, so filtering up to yesterday should yield 0 results
run_test(
    "4a. Search by date_to (up to yesterday)",
    f"{BASE_URL}?date_to={yesterday.strftime('%Y-%m-%d')}",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 4b. Search by full date range (last month to today)
run_test(
    "4b. Search by full date range (last month to today)",
    f"{BASE_URL}?date_from={last_month.strftime('%Y-%m-%d')}&date_to={today.strftime('%Y-%m-%d')}",
    check_results_count=1,
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 4c. Search with future date_from (should yield no results if no future documents)
run_test(
    "4c. Search with future date_from (should yield no results if no future documents)",
    f"{BASE_URL}?date_from={future_date.strftime('%Y-%m-%d')}",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 20, "has_next": False, "has_prev": False},
    check_query=""
)

# 5. Pagination - Page 1, 5 per_page
# With only 1 document, this will show 1 document on page 1, total pages 1.
run_test(
    "5. Pagination - Page 1, 5 per_page",
    f"{BASE_URL}?page=1&per_page=5",
    check_results_count=1,
    check_pagination={"total": 1, "page": 1, "pages": 1, "per_page": 5, "has_next": False, "has_prev": False},
    check_query=""
)

# 5a. Pagination - Page 2, 5 per_page
# With only 1 document, page 2 should be empty, but pagination info might still reflect total.
run_test(
    "5a. Pagination - Page 2, 5 per_page",
    f"{BASE_URL}?page=2&per_page=5",
    check_results_count=0,
    check_pagination={"total": 1, "page": 2, "pages": 1, "per_page": 5, "has_next": False, "has_prev": True},
    check_query=""
)

# 5b. Pagination - Requesting a page beyond total_pages
run_test(
    "5b. Pagination - Requesting a page beyond total_pages",
    f"{BASE_URL}?page=999&per_page=10",
    check_results_count=0,
    check_pagination={"total": 1, "page": 999, "pages": 1, "per_page": 10, "has_next": False, "has_prev": True},
    check_query=""
)

# 6. Combined search (query, tags, dates, pagination)
# Expect 0 results given the specific parameters that likely don't match the single uploaded document.
# (e.g., query 'report' and tag 'project' are not in the existing document)
run_test(
    "6. Combined search (query, tags, dates, pagination)",
    f"{BASE_URL}?q=report&tags=finance%2Cproject&date_from={last_month.strftime('%Y-%m-%d')}&page=1&per_page=2",
    check_results_count=0,
    check_pagination={"total": 0, "page": 1, "pages": 0, "per_page": 2, "has_next": False, "has_prev": False},
    check_query="report"
)

print("\nAll tests finished.")