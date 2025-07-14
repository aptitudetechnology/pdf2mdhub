# Vanilla JS Markdown Viewer & Download Plan

## Backend: Markdown File Download Endpoint

- **Endpoint:** `GET /api/documents/<int:document_id>/download_markdown`
- **Logic:**
  - Lookup `Document` by `document_id`.
  - Return 404 if not found or if `document.markdown_filepath` is missing or file does not exist.
  - **Path Construction:**
    - Markdown files are stored in `/pdf2mdhub/backend/md/<project_folder>/<filename>.md`.
    - `document.markdown_filepath` should be the absolute path to the `.md` file (e.g., `/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment.md`).
    - Use `os.path.dirname(document.markdown_filepath)` for the directory and `os.path.basename(document.markdown_filepath)` for the filename in `send_from_directory`.
  - Use `send_from_directory` to serve the markdown file:
    - Directory: `os.path.dirname(document.markdown_filepath)`
    - Filename: `os.path.basename(document.markdown_filepath)`
    - `as_attachment=True` to force download.
  - Add logging for success and error cases.

## Frontend: Markdown Viewer Page (Vanilla JS)

- **HTML Structure:**
  - `<div id="markdown-viewer-content"></div>` for rendered markdown.
  - `<button id="download-markdown-btn">Download Markdown</button>` for download.
  - Script tag for custom JS (e.g., `viewer.js`).

- **JavaScript (viewer.js):**
  - Extract `document_id` from URL.
  - Fetch markdown from `/api/documents/<document_id>/markdown`.
  - Show loading indicator while fetching.
  - Handle errors and display user-friendly messages.
  - Parse JSON response and extract markdown string.
  - Use a CDN markdown library (e.g., marked.js) for rendering:
    - Example: `<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>`
    - Render HTML: `marked.parse(markdownString)`
  - Insert HTML into `markdown-viewer-content` div.
  - Add event listener to `download-markdown-btn` to trigger download from `/api/documents/<document_id>/download_markdown`.

- **Syntax Highlighting (Optional):**
  - Integrate highlight.js or Prism.js via CDN for code blocks.
  - Add `<link>` and `<script>` tags for the highlighter.
  - Configure markdown renderer's highlight option if needed.

- **Keep Vanilla JS:**
  - Use plain JavaScript for all DOM and event logic.
  - Avoid frameworks; use CDN libraries only for markdown and highlighting.

---

**Path Construction Example:**
- If your markdown file is at `/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment.md`, then:
  - Directory: `/pdf2mdhub/backend/md/08076c272cf05e322bc6359539db1fd9_8176302258184272_payment`
  - Filename: `08076c272cf05e322bc6359539db1fd9_8176302258184272_payment.md`
  - Use these in `send_from_directory` for download and in your API for reading content.

**This plan ensures a simple, maintainable, and secure markdown viewer and download feature using vanilla JS and correct backend path handling.**
