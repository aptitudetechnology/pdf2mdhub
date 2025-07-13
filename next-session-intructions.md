# Next Session Instructions

## 1. OpenGovSG Integration Implementation

### Current Status
- ✅ Simulated PDF2MD conversion in `pdf2md.js`
- ✅ Event-driven architecture ready for real integration
- ✅ Progress tracking system in place

### Implementation Steps

#### A. Install OpenGovSG PDF2MD Library
```bash
# Add to your HTML or install via npm
npm install @opengovsg/pdf2md
```

#### B. Update `performConversion` Method
Replace the simulated conversion in `pdf2md.js` with:

```javascript
async performConversion(file, options, jobId) {
    // Import OpenGovSG library
    const { convertPdfToMarkdown } = await import('@opengovsg/pdf2md');
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                
                // Real OpenGovSG conversion
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

#### C. Update HTML Template
Add the OpenGovSG library to your base template:

```html
<!-- In templates/base.html -->
<script src="https://cdn.jsdelivr.net/npm/@opengovsg/pdf2md@latest/dist/pdf2md.min.js"></script>
<script src="{{ url_for('static', filename='js/pdf2md.js') }}"></script>
```

## 2. UI Implementation

### Required Files to Create

#### A. Upload Interface (`static/js/upload.js`)
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

#### B. Document Viewer (`static/js/document-viewer.js`)
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

#### C. Search Interface (`static/js/search.js`)
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

### HTML Templates to Create

#### A. Upload Template (`templates/upload.html`)
- Modern drag-and-drop interface
- Progress bars for individual files
- Batch upload support
- Tag input and metadata forms

#### B. Document Viewer Template (`templates/viewer.html`)
- Split-pane layout for PDF and Markdown
- Toolbar with download, edit, delete options
- Metadata sidebar
- Comments/notes section

#### C. Search Template (`templates/search.html`)
- Search input with autocomplete
- Advanced filter sidebar
- Results grid with thumbnails
- Pagination controls

### CSS Styling (`static/css/styles.css`)
- Responsive design
- Modern card-based layout
- Drag-and-drop visual feedback
- Progress animations
- Dark/light theme support

## 3. Backend Integration Points

### Required API Endpoints (already in app.py)
- `POST /api/documents` - Upload with metadata
- `GET /api/documents` - List with pagination
- `GET /api/documents/{id}` - Get specific document
- `PUT /api/documents/{id}` - Update metadata
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/search` - Search documents
- `GET /api/tags` - Get all tags

### Database Schema Updates
Ensure your `app.py` includes:
- Document status tracking
- Tag relationships
- Search indexing
- User tracking (if authentication added)

## 4. Testing Strategy

### Unit Tests
- PDF conversion accuracy
- API endpoint responses
- Search functionality
- File upload handling

### Integration Tests
- End-to-end workflow
- Batch processing
- Error handling
- Performance under load

### Browser Testing
- Cross-browser compatibility
- Mobile responsiveness
- File size limits
- Progress tracking accuracy

## 5. Deployment Considerations

### Frontend Assets
- Minify JavaScript and CSS 
- Optimize images
- Enable gzip compression
- Set up CDN for static assets

### Backend Optimization
- Database indexing for search
- File storage optimization
- Caching strategy
- Error logging and monitoring

### Security
- File type validation
- Size limits
- CSRF protection
- Content Security Policy

## 6. Quick Start Commands for Next Session

```bash
# Start the Flask backend
cd pdf2md-docs/backend
python app.py

# Test the current PDF2MD system
# Open browser to http://localhost:5000
# Upload a PDF file
# Check conversion results

# Create new files:
touch static/js/upload.js
touch static/js/document-viewer.js
touch static/js/search.js
touch templates/upload.html
touch templates/viewer.html
touch templates/search.html
```

## 7. Priority Order for Implementation

1. **Upload Interface** - Core functionality for file processing
2. **Document Viewer** - Essential for viewing converted documents
3. **Search Interface** - Important for document discovery
4. **OpenGovSG Integration** - Replace simulation with real conversion
5. **UI Polish** - Styling and user experience improvements
6. **Testing** - Comprehensive testing suite
7. **Deployment** - Production-ready setup

## 8. Expected Outcomes

After completing these implementations:
- ✅ Fully functional PDF to Markdown conversion
- ✅ Modern web interface with drag-and-drop
- ✅ Real-time progress tracking
- ✅ Document management with search
- ✅ Batch processing capabilities
- ✅ Production-ready system

## 9. Known Challenges to Address

1. **Large file handling** - Implement chunked upload
2. **Error recovery** - Robust error handling for failed conversions
3. **Performance** - Optimize for multiple simultaneous uploads
4. **Mobile support** - Ensure touch-friendly interface
5. **Accessibility** - WCAG compliance for screen readers

---

**Ready to continue development!** The foundation is solid, and these instructions will guide the next implementation phase.