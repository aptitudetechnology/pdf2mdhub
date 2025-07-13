import requests
import json
from datetime import datetime, timedelta

# --- Configuration ---
BASE_URL = "http://127.0.0.1:5000/api/search" # Default Flask address and your API endpoint

# --- Helper Functions ---

def print_response(response):
    """Helper to print response status and JSON content nicely."""
    print(f"\n--- API Response (Status: {response.status_code}) ---")
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
    except json.JSONDecodeError:
        print("Response is not valid JSON:")
        print(response.text)
    print("--------------------------------------")

def run_test(name, params):
    """Runs a single test case and prints results."""
    print(f"\n===== Running Test: {name} =====")
    print(f"Requesting URL: {BASE_URL}?{requests.compat.urlencode(params)}")
    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        data = response.json()

        print_response(response)

        # Basic assertions
        assert "documents" in data, "Response missing 'documents' key"
        assert isinstance(data["documents"], list), "'documents' is not a list"
        assert "total_results" in data, "Response missing 'total_results' key"
        assert "total_pages" in data, "Response missing 'total_pages' key"
        assert "current_page" in data, "Response missing 'current_page' key"
        assert "per_page" in data, "Response missing 'per_page' key"

        print(f"Test '{name}' PASSED.")
        return data # Return data for further inspection if needed

    except requests.exceptions.ConnectionError as e:
        print(f"Test '{name}' FAILED: Could not connect to backend. Is it running at {BASE_URL}? Error: {e}")
    except requests.exceptions.HTTPError as e:
        print(f"Test '{name}' FAILED: HTTP Error - {e}")
        print_response(e.response)
    except json.JSONDecodeError:
        print(f"Test '{name}' FAILED: Invalid JSON response from server.")
        if response:
            print_response(response)
    except AssertionError as e:
        print(f"Test '{name}' FAILED: Assertion Error - {e}")
    except Exception as e:
        print(f"Test '{name}' FAILED: An unexpected error occurred - {e}")

# --- Test Cases ---

def main():
    print("Starting backend API tests...\n")

    # TEST 1: Basic search with an empty query (should return all documents, or paginated first 10)
    run_test("1. All documents (empty query)", {})

    # TEST 2: Search by 'q' (filename, metadata, search_text)
    # REPLACE 'test_query' with a word you know exists in your document filenames/content.
    run_test("2. Search by query 'test'", {"q": "test"})
    run_test("2a. Search by query 'document'", {"q": "document"}) # Example
    run_test("2b. Search by query 'report'", {"q": "report"})     # Example

    # TEST 3: Search by tags (comma-separated, as frontend sends)
    # REPLACE 'tag1,tag2' with tags that exist in your database.
    # Make sure to have a document with BOTH 'meeting' AND 'finance' tags for 3a.
    run_test("3. Search by single tag 'meeting'", {"tags": "meeting"})
    run_test("3a. Search by multiple tags 'meeting,finance'", {"tags": "meeting,finance"})
    run_test("3b. Search by non-existent tag", {"tags": "nonexistenttag"})


    # TEST 4: Search by date range
    # Ensure you have documents uploaded within these ranges.
    # Adjust dates based on your test data.
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    last_week = today - timedelta(days=7)
    last_month = today - timedelta(days=30)
    next_week = today + timedelta(days=7) # For testing no future documents

    run_test(
        "4. Search by date_from (last week to today)",
        {"date_from": last_week.strftime('%Y-%m-%d')}
    )
    run_test(
        "4a. Search by date_to (up to yesterday)",
        {"date_to": yesterday.strftime('%Y-%m-%d')}
    )
    run_test(
        "4b. Search by full date range (last month to today)",
        {
            "date_from": last_month.strftime('%Y-%m-%d'),
            "date_to": today.strftime('%Y-%m-%d')
        }
    )
    run_test(
        "4c. Search with future date_from (should yield no results if no future documents)",
        {"date_from": next_week.strftime('%Y-%m-%d')}
    )


    # TEST 5: Pagination
    # You might need more than 10 documents in your DB for this to show multiple pages.
    run_test("5. Pagination - Page 1, 5 per_page", {"page": 1, "per_page": 5})
    run_test("5a. Pagination - Page 2, 5 per_page", {"page": 2, "per_page": 5})
    run_test("5b. Pagination - Requesting a page beyond total_pages", {"page": 999, "per_page": 10})

    # Combined test
    run_test(
        "6. Combined search (query, tags, dates, pagination)",
        {
            "q": "report",
            "tags": "finance,project", # Ensure documents exist with these
            "date_from": last_month.strftime('%Y-%m-%d'),
            "page": 1,
            "per_page": 2
        }
    )

    print("\nAll tests finished.")

if __name__ == "__main__":
    main()