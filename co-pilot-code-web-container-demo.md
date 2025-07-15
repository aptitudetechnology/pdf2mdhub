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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF2MD Hub</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">
    <script src="https://cdn.jsdelivr.net/npm/@opengovsg/pdf2md@latest/dist/pdf2md.min.js"></script>
    <script src="{{ url_for('static', filename='js/pdf2md.js') }}"></script>
</head>
<body>
    {% block content %}{% endblock %}
</body>
</html>
```

## 3. static/js/upload.js
```javascript
class UploadInterface {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('upload-progress');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Drag and drop handlers
        // File input change handler
        // Progress tracking
    }

    handleFileUpload(files) {
        // Process files using PDF2MD.processAndUpload
        // Update UI with progress using this.progressBar.value = percent;
    }
}
```

## 4. static/js/document-viewer.js
```javascript
class DocumentViewer {
    constructor() {
        const container = document.getElementById('viewer-container');
        this.documentId = container.dataset.documentId;
        this.pdfViewer = document.getElementById('pdf-viewer');
        this.markdownViewer = document.getElementById('markdown-viewer');
        this.loadDocument();
    }

    async loadDocument() {
        // Load document data
        // Display PDF in iframe
        // Render markdown with syntax highlighting or using markdown-it
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
        // Tag filter dropdown handler
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
    <div id="progress-container">
        <progress id="upload-progress" value="0" max="100"></progress>
    </div>
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
<div id="viewer-container" data-document-id="{{ document.id }}">
    <div id="toolbar">
        <button id="download-btn">Download</button>
        <button id="edit-btn">Edit</button>
        <button id="delete-btn">Delete</button>
    </div>
    <div id="split-pane">
        <iframe id="pdf-viewer" src="{{ pdf_url }}"></iframe>
        <div id="markdown-viewer">{{ markdown_content|safe }}</div>
    </div>
    {% include "components/metadata_block.html" %}
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
        <select id="tag-filter">
            {% for tag in available_tags %}
            <option value="{{ tag }}">{{ tag }}</option>
            {% endfor %}
        </select>
    </aside>
    <div id="search-results">
        {% for doc in results %}
            {% include "components/document_card.html" %}
        {% endfor %}
    </div>
    <div id="pagination-controls">
        <!-- Pagination UI here -->
    </div>
</div>
<script src="{{ url_for('static', filename='js/search.js') }}"></script>
{% endblock %}
```

## 9. templates/components/document_card.html
```html
<div class="result-card">
    <img src="{{ doc.thumbnail_url }}" alt="Thumbnail">
    <div class="result-info">
        <h4>{{ doc.title }}</h4>
        <p>{{ doc.summary }}</p>
        <span>{{ doc.tags }}</span>
    </div>
</div>
```

## 10. templates/components/metadata_block.html
```html
<aside id="metadata-sidebar">
    <h3>Metadata</h3>
    <ul>
        <li>Title: {{ document.title }}</li>
        <li>Tags: {{ document.tags }}</li>
        <!-- Add more metadata fields as needed -->
    </ul>
</aside>
```

## 11. static/css/styles.css
- Responsive design
- Modern card-based layout
- Drag-and-drop visual feedback
- Progress animations using `<progress>`
- Light/dark theme toggle using media queries or JS
- Consistent layout for viewer, uploader, and search

## 12. backend/app.py
- Add endpoints:
  - `/upload` (handle file + metadata)
  - `/convert` (trigger PDF2MD conversion)
  - `/document/<id>` (viewing)
  - `/search` (query by text + tags)
- Flask Blueprints for modularity
- Use environment variables via `.env`

## 13. tests/
- Unit tests for:
  - File validation
  - Metadata submission
  - PDF to Markdown conversion
  - Search result matching
- Integration tests:
  - Upload flow (file → convert → view)
  - Viewer rendering
  - Pagination and filters
- Mock S3/filesystem if needed

---

# File Implementation Order

1. `static/js/upload.js`
2. `static/js/document-viewer.js`
3. `static/js/search.js`
4. `static/js/pdf2md.js`
5. `templates/components/document_card.html`
6. `templates/components/metadata_block.html`
7. `templates/upload.html`
8. `templates/viewer.html`
9. `templates/search.html`
10. `templates/base.html`
11. `static/css/styles.css`
12. `backend/app.py`
13. `tests/`