# Co-Pilot Code Considerations

## 1. static/js/pdf2md.js
```javascript
// performConversion method using OpenGovSG PDF2MD
async performConversion(file, options, jobId) {
    const { convertPdfToMarkdown } = await import('@opengovsg/pdf2md');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                this.emit('progress', { jobId, progress: 30, status: 'Processing PDF structure...' });
                const markdown = await convertPdfToMarkdown(arrayBuffer, {
                    preserveImages: options.preserveImages || false,
                    extractTables: options.extractTables || true,
                    ...options
                });
                this.emit('progress', { jobId, progress: 90, status: 'Converting to Markdown...' });
                resolve(markdown);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
    });
}
```

## 2. templates/base.html
```html
<!-- Add OpenGovSG PDF2MD library CDN and local JS -->
<script src="https://cdn.jsdelivr.net/npm/@opengovsg/pdf2md@latest/dist/pdf2md.min.js"></script>
<script src="{{ url_for('static', filename='js/pdf2md.js') }}"></script>
```

## 3. static/js/upload.js
```javascript
class UploadInterface {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.progressContainer = document.getElementById('progress-container');
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Drag and drop handlers
        // File input change handler
        // Progress tracking
    }
    handleFileUpload(files) {
        // Process files using PDF2MD.processAndUpload
        // Update UI with progress
    }
}
```

## 4. static/js/document-viewer.js
```javascript
class DocumentViewer {
    constructor(documentId) {
        this.documentId = documentId;
        this.pdfViewer = document.getElementById('pdf-viewer');
        this.markdownViewer = document.getElementById('markdown-viewer');
        this.loadDocument();
    }
    async loadDocument() {
        // Load document data
        // Display PDF in iframe
        // Render markdown with syntax highlighting
    }
}
```

## 5. static/js/search.js
```javascript
class SearchInterface {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.resultsContainer = document.getElementById('search-results');
        this.filtersContainer = document.getElementById('search-filters');
        this.setupSearch();
    }
    setupSearch() {
        // Debounced search input
        // Filter handling
        // Results pagination
    }
}
```

## 6. templates/upload.html
```html
{% extends "base.html" %}
{% block content %}
<div id="upload-container">
    <h2>Upload PDF Documents</h2>
    <div id="drop-zone">Drag & drop files here or click to select</div>
    <input type="file" id="file-input" multiple accept="application/pdf">
    <div id="progress-container"></div>
    <form id="metadata-form">
        <input type="text" name="tags" placeholder="Tags (comma separated)">
        <input type="text" name="title" placeholder="Document Title">
        <!-- Add more metadata fields as needed -->
        <button type="submit">Submit Metadata</button>
    </form>
</div>
<script src="{{ url_for('static', filename='js/upload.js') }}"></script>
{% endblock %}
```

## 7. templates/viewer.html
```html
{% extends "base.html" %}
{% block content %}
<div id="viewer-container">
    <div id="toolbar">
        <button id="download-btn">Download</button>
        <button id="edit-btn">Edit</button>
        <button id="delete-btn">Delete</button>
    </div>
    <div id="split-pane">
        <iframe id="pdf-viewer" src="{{ pdf_url }}"></iframe>
        <div id="markdown-viewer">{{ markdown_content|safe }}</div>
    </div>
    <aside id="metadata-sidebar">
        <h3>Metadata</h3>
        <ul>
            <li>Title: {{ document.title }}</li>
            <li>Tags: {{ document.tags }}</li>
            <!-- Add more metadata fields as needed -->
        </ul>
    </aside>
    <section id="comments-section">
        <h3>Comments/Notes</h3>
        <!-- Comments UI here -->
    </section>
</div>
<script src="{{ url_for('static', filename='js/document-viewer.js') }}"></script>
{% endblock %}
```

## 8. templates/search.html
```html
{% extends "base.html" %}
{% block content %}
<div id="search-container">
    <input type="text" id="search-input" placeholder="Search documents...">
    <aside id="search-filters">
        <!-- Advanced filter options here -->
    </aside>
    <div id="search-results">
        {% for doc in results %}
        <div class="result-card">
            <img src="{{ doc.thumbnail_url }}" alt="Thumbnail">
            <div class="result-info">
                <h4>{{ doc.title }}</h4>
                <p>{{ doc.summary }}</p>
                <span>{{ doc.tags }}</span>
            </div>
        </div>
        {% endfor %}
    </div>
    <div id="pagination-controls">
        <!-- Pagination UI here -->
    </div>
</div>
<script src="{{ url_for('static', filename='js/search.js') }}"></script>
{% endblock %}
```

## 9. static/css/styles.css
- Responsive design
- Modern card-based layout
- Drag-and-drop visual feedback
- Progress animations
- Dark/light theme support

## 10. backend/app.py
- Ensure all required API endpoints exist and are functional.
- Update database schema for document status, tags, indexing, user tracking if needed.

## 11. tests/
- Add unit and integration tests for conversion, API, search, upload, error handling, performance.

---

# File Implementation Order
1. static/js/upload.js
2. static/js/document-viewer.js
3. static/js/search.js
4. static/js/pdf2md.js
5. templates/upload.html
6. templates/viewer.html
7. templates/search.html
8. templates/base.html
9. static/css/styles.css
10. backend/app.py
11. tests/
