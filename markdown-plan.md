opilot, please help me with the following tasks:

Task 1: Backend - Make Markdown File Available for Direct Download

Goal: Create a new API endpoint in app.py that allows users to download the raw markdown (.md) file associated with a document.

    Endpoint Signature: GET /api/documents/<int:document_id>/download_markdown

    Logic Requirements:

        Retrieve the document_id from the URL.

        Query the database for the Document model corresponding to the document_id.

        Crucially, check document.markdown_filepath:

            If the document is not found, return a 404 JSON error.

            If document.markdown_filepath is None or the file doesn't exist at that path, return a 404 JSON error (e.g., "Markdown file not available for download").

        Use send_from_directory to serve the markdown file.

            The directory should be the parent directory of document.markdown_filepath (e.g., os.path.dirname(document.markdown_filepath)).

            The filename for send_from_directory should be the basename of document.markdown_filepath (e.g., os.path.basename(document.markdown_filepath)).

            Ensure it's served as an attachment (as_attachment=True) to force download.

        Include appropriate logging for success and error cases.

Task 2: Frontend - Render Markdown Content on the Viewer Page

Goal: Display the fetched markdown content (from the existing /api/documents/<document_id>/markdown endpoint) as formatted HTML in the viewer.html page.

    Identify suitable JavaScript markdown rendering libraries:

        Suggest popular, client-side markdown parsing and rendering libraries that convert markdown strings into HTML.

        Prioritize libraries suitable for a vanilla JavaScript setup.

        Examples: marked.js, markdown-it.

    Provide a basic HTML structure within viewer.html:

        Include a div element where the rendered markdown will be dynamically inserted. Give it a clear id (e.g., markdown-viewer-content).

        Include a button or link that triggers the download of the markdown file (referencing the new backend endpoint from Task 1). Give it an id like download-markdown-btn.

        Ensure a script tag exists at the end of the body to link to our custom JavaScript file (e.g., viewer.js).

    Write the JavaScript code (in viewer.js or similar) to:

        Get Document ID: Extract the document_id from the URL (e.g., window.location.pathname).

        Fetch and Render Markdown:

            Make an async/await fetch request to '/api/documents/<document_id>/markdown'.

            Handle network/HTTP errors; display a user-friendly error message in markdown-viewer-content if fetching fails.

            Parse the JSON response and extract the content string.

            Use the chosen markdown rendering library (from the suggestion above) to convert the content string into HTML.

            Insert the generated HTML into the markdown-viewer-content div.

        Implement Download Button Logic:

            Add an event listener to the download-markdown-btn.

            When clicked, set window.location.href to the new markdown download URL (/api/documents/<document_id>/download_markdown) to trigger the file download.

        Add basic error/loading indicators:

            Show a "Loading markdown..." message while fetching.

            If the API returns an error or empty content, display a clear message like "Failed to load markdown content." or "Markdown content not available."

    Consider syntax highlighting (Optional, but highly recommended for code blocks):

        If using marked.js or markdown-it, explain how to integrate a syntax highlighter like highlight.js or Prism.js for code blocks within the markdown.

        Mention the necessary <link> for CSS and <script> for JS for the highlighter library.

        Show how to configure the markdown renderer's highlight option.

        keep vanilla js as much as possible

        ~/pdf2mdhub/backend$ cd md
(venv) chris@simple:~/pdf2mdhub/backend/md$ ls
08076c272cf05e322bc6359539db1fd9_8176302258184272_payment  86c056828d8c61057a0ecae90baf2516_invoice_q3  cbc29fb27b88cb1bb2132fa7fccc9108_invoice_q3
830b811a08f754153a8a5a990ca5e7aa_invoice_q3                a59c49e0b5fa438cb20fd4e219e4947c_invoice_q3
(venv) chris@simple:~/pdf2mdhub/backend/md$ ls -poa
total 28
drwxrwxr-x  7 chris 4096 Jul 14 00:08 ./
drwxrwxr-x 10 chris 4096 Jul 14 00:42 ../
drwxrwxr-x  4 chris 4096 Jul 14 00:08 08076c272cf05e322bc6359539db1fd9_8176302258184272_payment/
drwxrwxr-x  4 chris 4096 Jul 13 23:44 830b811a08f754153a8a5a990ca5e7aa_invoice_q3/
drwxrwxr-x  4 chris 4096 Jul 13 19:07 86c056828d8c61057a0ecae90baf2516_invoice_q3/
drwxrwxr-x  4 chris 4096 Jul 13 23:23 a59c49e0b5fa438cb20fd4e219e4947c_invoice_q3/
drwxrwxr-x  4 chris 4096 Jul 13 23:39 cbc29fb27b88cb1bb2132fa7fccc9108_invoice_q3/
(venv) chris@simple:~/pdf2mdhub/backend/md$ cd 08076c272cf05e322bc6359539db1fd9_8176302258184272_payment/
(venv) chris@simple:~/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment$ ls
08076c272cf05e322bc6359539db1fd9_8176302258184272_payment.md  images  src
(venv) chris@simple:~/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment$ cd images/
(venv) chris@simple:~/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment/images$ ls
08076c272cf05e322bc6359539db1fd9_8176302258184272_payment-1.png
(venv) chris@simple:~/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment/images$ cd //
