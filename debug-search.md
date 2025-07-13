Debugging Search Functionality with GitHub Copilot

This guide provides instructions for using GitHub Copilot to help debug and fix issues with your backend search API, specifically addressing problems with query, tag, and date filtering.

Understanding the Problem

Your API has documents in the database (verified by the "All documents" test), but specific search criteria aren't working as expected. This means the issue isn't with document storage or retrieval of all items, but with how your backend filters results based on user input.

Here are the key areas to focus on:

    Query Text Search (q parameter): Your search for terms like "document" isn't returning expected results, even when the term exists in the document's content (e.g., markdown_content). This indicates a problem with the full-text search implementation.

    Tag Filtering (tags parameter): When you search for tags, the API is ignoring the tag filter and returning all documents. This is a critical bug in your tag filtering logic.

    Date Filtering (date_from, date_to parameters): Similar to tags, your date filters are being ignored, and the API is returning all documents regardless of the date range. This points to an issue in your date filtering logic.

Using GitHub Copilot to Debug and Fix

Follow these steps, using GitHub Copilot to assist you at each stage.

1. Identify the Search Endpoint Code

Open your backend application's code. Locate the file and function responsible for handling the /api/search endpoint. This is typically where you process incoming URL parameters (q, tags, date_from, date_to) and construct your database query.

Copilot Tip: You can ask Copilot:
"Where is the Flask (or Django, etc.) route handler for /api/search?"

2. Debugging Query Text Search (q parameter)

The goal here is to make sure your API correctly searches within the document's content.

    Examine the Query Construction: Look for the part of your code that handles the q parameter. It should be adding a condition to your database query to search within a text field (e.g., markdown_content, notes).

    Copilot Assistance:

        "How do I perform a case-insensitive full-text search in SQLAlchemy (or your ORM/DB) on a text field?"

        "Show me an example of using ILIKE (for PostgreSQL) or LIKE with wildcards in a SQL query for a search term."

        "Given this document model, how would I filter documents by a query string q that might appear in markdown_content or notes?"

    Implement the Fix: Adjust your query to correctly apply the text search. For example, using ILIKE for case-insensitive partial matches in PostgreSQL, or dedicated full-text search features of your database.

3. Debugging Tag Filtering (tags parameter)

This is a major bug where tags are being ignored.

    Locate Tag Processing: Find where the tags parameter from the URL is processed. It's likely a comma-separated string that needs to be split into a list.

    Examine Query Condition: Check how this list of tags is used in your database query. It should be filtering documents where their tags array/list/relationship contains any of the specified tags.

    Copilot Assistance:

        "How do I filter database records by a list of tags in Python/SQLAlchemy if my tags are stored as a relationship (or array field)?"

        "Provide a Python example to split a comma-separated string of tags into a list."

        "Show me how to construct a SQL query to find documents that have any of the tags in a given list."

    Implement the Fix: Correctly integrate the tag filtering into your database query. Ensure that if no documents match the tags, an empty list is returned, not all documents.

4. Debugging Date Filtering (date_from, date_to parameters)

Similar to tags, date filters are also being ignored.

    Date Parameter Parsing: Ensure you're correctly parsing the date_from and date_to strings (e.g., "YYYY-MM-DD") into Python datetime objects.

    Examine Query Conditions: Check how these datetime objects are used to filter based on the document's upload_date (or processed_date). You'll need upload_date >= date_from and upload_date <= date_to conditions.

    Copilot Assistance:

        "How do I parse a 'YYYY-MM-DD' date string into a Python datetime object?"

        "Show me how to filter SQLAlchemy query results by a date range on an upload_date field."

        "How can I ensure date range filtering includes documents uploaded on the exact date_to day?" (Often, you'll need to add one day to date_to and use < for an end-of-day inclusive filter).

    Implement the Fix: Apply the date range filtering correctly to your database query.

Testing Your Fixes

After implementing changes for each filtering mechanism:

    Restart your backend server.

    Run your test script again: python3 scripts/test_search_api.py

You should see more tests passing. If new failures appear, they might indicate unintended side effects or further refinements needed.

Updating Test Expectations (After Backend is Fixed)

Once your backend's filtering logic is confirmed to be working correctly, you'll need to make minor adjustments to your scripts/test_search_api.py to match the new reality of your database (which now has 2 invoice documents):

    Change check_results_count=1 to check_results_count=2 in tests where all 2 documents should be returned (e.g., "All documents", "Search by single tag 'invoice'", etc., assuming all 2 match).

    Adjust check_pagination['total'] to 2 for these tests as well.

By systematically addressing each filter with Copilot's help, you should be able to get your search functionality working robustly!