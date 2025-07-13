# Proposed HTML Templates for PDF2MD Hub

This document summarizes the purpose and key structural elements of the HTML templates implemented for the PDF2MD Document Management System. These templates are built using Flask's Jinja2 templating engine and aim for a modern, responsive user interface.

## 1. `templates/base.html`

This is the foundational template for the entire application, providing the basic HTML structure, shared head elements, and a consistent navigation and footer.

**Key Elements:**
* **DOCTYPE & Head**: Standard HTML5 declaration, viewport meta tag, and `title` tag.
* **CSS Link**: Includes `static/css/styles.css` for global styling.
* **JavaScript Includes**:
    * `https://cdn.jsdelivr.net/npm/@opengovsg/pdf2md@latest/dist/pdf2md.min.js`: The client-side PDF to Markdown conversion library.
    * `{{ url_for('static', filename='js/pdf2md.js') }}`: Your application's core JavaScript logic for PDF conversion.
* **Header (`.app-header`)**: Contains the application logo/title and a main navigation bar with links to "Upload" and "Search" pages.
* **Main Content Area (`<main class="container">` and `{% block content %}`):** This is the dynamic area where specific page content from child templates will be injected.
* **Footer (`.app-footer`)**: Displays copyright information and can include global scripts.

**Purpose:** Ensures a consistent look and feel, and loads essential global resources (CSS, core JS libraries) across all pages.

## 2. `templates/components/document_card.html`

A reusable component designed to display a compact summary of a document, typically used within search results or document listings.

**Key Elements:**
* **Root Element (`.document-card`)**: Acts as a container for styling.
* **Thumbnail (`.card-thumbnail`)**: Displays an image preview of the document (or a default placeholder).
* **Content Area (`.card-content`)**: Contains the document's title, a brief summary, and a list of associated tags.
* **Tags (`.card-tags`)**: Iterates through `doc.tags` to display individual tags as styled badges.
* **View Link (`.card-link`)**: A direct link to the full document viewer page.

**Purpose:** Provides a consistent and visually appealing way to present document summaries in grid or list views, enhancing discoverability.

## 3. `templates/components/metadata_block.html`

Another reusable component for displaying detailed metadata associated with a document, particularly useful in the document viewer.

**Key Elements:**
* **Sidebar (`.metadata-sidebar`)**: The main container, likely to be styled as a sidebar in the viewer.
* **Document Details (`<h3>` and `.metadata-list`)**: Displays key document properties such as title, filename, size, upload date, processing status, and notes.
* **Tags (`.metadata-tags`)**: Similar to `document_card.html`, it displays tags associated with the document.
* **Edit Button (`.edit-metadata-btn`)**: A button to potentially trigger a modal or navigation for editing the document's metadata.

**Purpose:** Centralizes the display of detailed document attributes, providing users with comprehensive information at a glance.

## 4. `templates/upload.html`

This template defines the user interface for uploading new PDF documents, supporting drag-and-drop and file input, along with progress tracking and metadata entry.

**Key Elements:**
* **Main Container (`#upload-container`)**: Holds all upload-related elements.
* **Section Header (`.section-header`)**: Provides a title and description for the upload section.
* **Drop Zone (`#drop-zone`)**: A visually prominent area for drag-and-drop file interaction, with a hidden file input linked to a "Select Files" button.
* **Upload Queue (`#upload-queue`)**: A dynamic area where `upload.js` will inject individual file progress bars and status messages.
* **Overall Progress Container (`#overall-progress-container`)**: Displays a general progress bar for all ongoing uploads.
* **Metadata Form (`#metadata-form`)**: Allows users to enter common tags and a title for the batch of documents being uploaded, before conversion/upload.

**Purpose:** To provide an intuitive and interactive interface for users to upload and initiate the conversion of PDF documents, including preliminary metadata tagging.

## 5. `templates/viewer.html`

This template presents a dedicated view for a single document, featuring a side-by-side preview of the original PDF and its converted Markdown content.

**Key Elements:**
* **Main Container (`#viewer-container`)**: The primary wrapper for the viewer interface.
* **Viewer Header (`.viewer-header`)**: Displays the document title and a toolbar with actions like download (PDF/MD), edit metadata, and delete.
* **Split-Pane (`#split-pane`)**: Divides the screen into two main areas:
    * **PDF Pane (`.pdf-pane`)**: Contains an `<iframe>` to display the PDF.
    * **Markdown Pane (`.markdown-pane`)**: Displays the converted Markdown content (expected to be rendered, potentially by a JS library like `markdown-it`).
* **Metadata Sidebar**: Includes the `components/metadata_block.html` for detailed document information.
* **Comments/Notes Section (`#comments-section`)**: A text area for users to add or view notes associated with the document, with a save button.

**Purpose:** Offers a rich viewing experience for documents, allowing users to compare the original PDF with its Markdown conversion and manage document-specific details.

## 6. `templates/search.html`

This template provides a comprehensive search interface for documents, including search input, filters, results display, and pagination controls.

**Key Elements:**
* **Main Container (`#search-container`)**: Wraps all search-related UI.
* **Section Header (`.section-header`)**: Provides a title and description for the search functionality.
* **Search Input Group (`.search-input-group`)**: Contains the primary search bar and a search button.
* **Search Filters (`#search-filters`)**: A sidebar or section with filtering options, including:
    * Tag filter dropdown.
    * Date range inputs (`date-from`, `date-to`).
    * Buttons to apply and clear filters.
* **Search Results Grid (`#search-results`)**: The area where search results are displayed, typically by including multiple instances of `components/document_card.html`.
* **Pagination Controls (`#pagination-controls`)**: Buttons and information to navigate through multiple pages of search results.

**Purpose:** Enables users to efficiently discover documents through full-text search and advanced filtering by metadata.