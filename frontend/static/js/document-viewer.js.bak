// static/js/document-viewer.js

class DocumentViewer {
    constructor() {
        const container = document.getElementById('viewer-container');
        this.documentId = container ? container.dataset.documentId : null;

        if (!this.documentId) {
            console.error("Document ID not found in viewer container.");
            return;
        }

        this.pdfViewer = document.getElementById('pdf-viewer');
        this.markdownViewer = document.getElementById('markdown-viewer');
        this.notesTextArea = document.getElementById('document-notes');
        this.saveNotesBtn = document.getElementById('save-notes-btn');
        this.deleteDocumentBtn = document.getElementById('delete-document-btn');
        this.editMetadataBtn = document.getElementById('edit-metadata-btn'); // For future modal/page

        // Initialize MarkdownIt for rendering Markdown (if included)
        this.md = typeof markdownit !== 'undefined' ? markdownit() : null;
        if (!this.md) {
            console.warn("MarkdownIt library not found. Markdown content will be displayed as plain text.");
        }

        this.setupEventListeners();
        this.loadDocument();
    }

    setupEventListeners() {
        if (this.saveNotesBtn) {
            this.saveNotesBtn.addEventListener('click', this.saveDocumentNotes.bind(this));
        }
        if (this.deleteDocumentBtn) {
            this.deleteDocumentBtn.addEventListener('click', this.deleteDocument.bind(this));
        }
        // Add event listener for edit metadata button (e.g., open a modal)
        if (this.editMetadataBtn) {
            this.editMetadataBtn.addEventListener('click', () => {
                alert('Edit Metadata functionality not yet implemented for the client-side. This would typically open a modal or navigate to an edit page.');
                // Here you would typically open a modal or redirect to an edit form
            });
        }
    }

    async loadDocument() {
        try {
            const response = await fetch(`/api/documents/${this.documentId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Document not found.');
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const document = await response.json();

            // Display PDF in iframe (src is already set by Jinja in template, just verify)
            if (this.pdfViewer && document.pdf_url) {
                this.pdfViewer.src = document.pdf_url;
            } else if (this.pdfViewer) {
                 this.pdfViewer.contentDocument.body.innerHTML = '<div class="viewer-placeholder">PDF not available or still processing.</div>';
            }


            // Render markdown content
            if (this.markdownViewer && document.markdown_content) {
                if (this.md) {
                    this.markdownViewer.innerHTML = this.md.render(document.markdown_content);
                } else {
                    this.markdownViewer.textContent = document.markdown_content; // Fallback to plain text
                }
            } else if (this.markdownViewer) {
                this.markdownViewer.innerHTML = '<div class="viewer-placeholder">Markdown content not available or still processing.</div>';
            }

            // Populate notes if available
            if (this.notesTextArea && document.notes) {
                this.notesTextArea.value = document.notes;
            }

            // Update metadata sidebar if loaded dynamically (currently server-rendered)
            // You might need an API endpoint to get metadata if it's not fully rendered on page load
            // Example: updateMetadataSidebar(document);

        } catch (error) {
            console.error('Error loading document:', error);
            // Display an error message in the viewer
            if (this.pdfViewer) this.pdfViewer.contentDocument.body.innerHTML = `<div class="viewer-placeholder">Error loading PDF: ${error.message}</div>`;
            if (this.markdownViewer) this.markdownViewer.innerHTML = `<div class="viewer-placeholder">Error loading Markdown: ${error.message}</div>`;
        }
    }

    async saveDocumentNotes() {
        if (!this.notesTextArea || !this.documentId) return;

        const notes = this.notesTextArea.value;
        try {
            const response = await fetch(`/api/documents/${this.documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes: notes }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            alert('Notes saved successfully!');
            console.log('Notes save result:', result);
        } catch (error) {
            console.error('Error saving notes:', error);
            alert(`Failed to save notes: ${error.message}`);
        }
    }

    async deleteDocument() {
        if (!this.documentId) return;

        if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/documents/${this.documentId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                alert('Document deleted successfully!');
                window.location.href = '/search'; // Redirect to search page or dashboard
            } catch (error) {
                console.error('Error deleting document:', error);
                alert(`Failed to delete document: ${error.message}`);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DocumentViewer();
});