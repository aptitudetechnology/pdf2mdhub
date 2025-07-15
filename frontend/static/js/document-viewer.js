// static/js/document-viewer.js

class DocumentViewer {
    constructor() {
        const container = document.getElementById('viewer-container');
        this.documentId = container ? container.dataset.documentId : null;
        this.originalFileName = container ? container.dataset.originalName : null;

        if (!this.documentId) {
            console.error("Document ID not found in viewer container.");
            return;
        }

        this.pdfViewer = document.getElementById('pdf-viewer');
        this.markdownViewer = document.getElementById('markdown-viewer');
        this.markdownPlaceholder = document.getElementById('markdown-placeholder');
        this.notesTextArea = document.getElementById('document-notes');
        this.saveNotesBtn = document.getElementById('save-notes-btn');
        this.deleteDocumentBtn = document.getElementById('delete-document-btn');
        this.editMetadataBtn = document.getElementById('edit-metadata-btn');
        this.downloadMarkdownBtn = document.getElementById('download-markdown-btn');

        // Initialize MarkdownIt with enhanced configuration for PDF-converted content
        this.initializeMarkdownProcessor();
        
        this.setupEventListeners();
        this.loadDocumentData();
        this.fetchAndRenderMarkdown();
    }

    initializeMarkdownProcessor() {
        if (typeof markdownit !== 'undefined') {
            this.md = markdownit({
                html: true,           // Enable HTML tags in source (useful for PDF conversions)
                breaks: true,         // Convert '\n' in paragraphs into <br>
                linkify: true,        // Autoconvert URL-like text to links
                typographer: true,    // Enable language-neutral replacement + quotes beautification
                highlight: function(code, lang) {
                    // Integrate highlight.js if available
                    if (typeof hljs !== 'undefined') {
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return hljs.highlight(code, { language: lang }).value;
                            } catch (error) {
                                console.warn(`Highlight.js failed to highlight language '${lang}':`, error);
                            }
                        }
                        // Fallback to auto-detection
                        try {
                            return hljs.highlightAuto(code).value;
                        } catch (error) {
                            console.warn('Highlight.js auto-detection failed:', error);
                            return code; // Return plain code if highlighting fails
                        }
                    }
                    return code; // Return plain code if hljs not available
                }
            });

            // Add plugins if available (these would need to be included separately)
            // Uncomment and include these plugins if you want enhanced table/footnote support:
            // if (typeof markdownitTable !== 'undefined') {
            //     this.md.use(markdownitTable);
            // }
            // if (typeof markdownitFootnote !== 'undefined') {
            //     this.md.use(markdownitFootnote);
            // }
            // if (typeof markdownitTaskLists !== 'undefined') {
            //     this.md.use(markdownitTaskLists);
            // }

            console.info("MarkdownIt configured successfully for PDF-converted content.");
        } else {
            console.warn("MarkdownIt library not found. Markdown content will be displayed as plain text.");
            this.md = null;
        }
    }

    setupEventListeners() {
        if (this.saveNotesBtn) {
            this.saveNotesBtn.addEventListener('click', this.saveDocumentNotes.bind(this));
        }
        if (this.deleteDocumentBtn) {
            this.deleteDocumentBtn.addEventListener('click', this.deleteDocument.bind(this));
        }
        if (this.editMetadataBtn) {
            this.editMetadataBtn.addEventListener('click', () => {
                alert('Edit Metadata functionality not yet implemented for the client-side. This would typically open a modal or navigate to an edit page.');
            });
        }
        if (this.downloadMarkdownBtn) {
            this.downloadMarkdownBtn.addEventListener('click', this.downloadMarkdown.bind(this));
        }
    }

    downloadMarkdown() {
        if (!this.documentId) {
            console.error("Cannot download markdown: Document ID not available.");
            return;
        }
        window.location.href = `/api/documents/${this.documentId}/download_markdown`;
    }

    async loadDocumentData() {
        if (!this.documentId) return;

        try {
            const response = await fetch(`/api/documents/${this.documentId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Document not found.');
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const documentData = await response.json();

            // Display PDF in iframe (src is already set by Jinja in template)
            // The iframe's src is set by Jinja: src="/api/documents/{{ document.id }}/download"
            if (this.pdfViewer && documentData.pdf_url) {
                // Additional verification or fallback logic could go here
                console.log('PDF viewer initialized with URL:', documentData.pdf_url);
            } else if (this.pdfViewer) {
                console.warn('PDF URL not available in document data');
            }

            // Populate notes if available
            if (this.notesTextArea && documentData.notes) {
                this.notesTextArea.value = documentData.notes;
            }

            console.log('Document data loaded successfully');
        } catch (error) {
            console.error('Error loading main document data:', error);
            this.displayGlobalError(`Error loading document: ${error.message}`);
        }
    }

    async fetchAndRenderMarkdown() {
        if (!this.markdownViewer) {
            console.error("Markdown viewer element not found.");
            return;
        }
        if (!this.documentId) {
            this.showMarkdownPlaceholder('Error: Document ID not available for markdown fetch.');
            if (this.downloadMarkdownBtn) this.downloadMarkdownBtn.disabled = true;
            return;
        }

        // Show loading state
        this.showMarkdownPlaceholder('Loading Markdown content...');
        if (this.downloadMarkdownBtn) this.downloadMarkdownBtn.disabled = true;

        try {
            const response = await fetch(`/api/documents/${this.documentId}/markdown`);

            if (!response.ok) {
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    console.warn('Could not parse error response as JSON:', jsonError);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.content) {
                this.renderMarkdownContent(data.content);
                if (this.downloadMarkdownBtn) this.downloadMarkdownBtn.disabled = false;
            } else {
                this.showMarkdownPlaceholder('Markdown content not found for this document.');
                console.warn(`No markdown content received for document ID: ${this.documentId}`);
            }
        } catch (error) {
            console.error('Error fetching or rendering markdown:', error);
            this.showMarkdownPlaceholder(`Failed to load markdown content: ${error.message}`);
            if (this.downloadMarkdownBtn) this.downloadMarkdownBtn.disabled = true;
        }
    }

    renderMarkdownContent(markdownContent) {
        if (!this.markdownViewer) return;

        // Hide placeholder and show content
        this.hideMarkdownPlaceholder();
        
        if (this.md) {
            try {
                // Render markdown with MarkdownIt
                const renderedHtml = this.md.render(markdownContent);
                this.markdownViewer.innerHTML = renderedHtml;
                
                // Apply syntax highlighting to code blocks if highlight.js is available
                if (typeof hljs !== 'undefined') {
                    // Find all code blocks and apply highlighting
                    const codeBlocks = this.markdownViewer.querySelectorAll('pre code');
                    codeBlocks.forEach(block => {
                        hljs.highlightElement(block);
                    });
                }
                
                console.log('Markdown rendered successfully with MarkdownIt');
            } catch (renderError) {
                console.error('Error rendering markdown:', renderError);
                // Fallback to plain text on render error
                this.markdownViewer.textContent = markdownContent;
            }
        } else {
            // Fallback to plain text if MarkdownIt not available
            this.markdownViewer.textContent = markdownContent;
            console.warn('MarkdownIt not available, displaying as plain text');
        }
    }

    showMarkdownPlaceholder(message) {
        if (this.markdownPlaceholder) {
            this.markdownPlaceholder.innerHTML = message;
            this.markdownPlaceholder.style.display = 'block';
        }
        if (this.markdownViewer) {
            this.markdownViewer.style.display = 'none';
        }
    }

    hideMarkdownPlaceholder() {
        if (this.markdownPlaceholder) {
            this.markdownPlaceholder.style.display = 'none';
        }
        if (this.markdownViewer) {
            this.markdownViewer.style.display = 'block';
        }
    }

    displayGlobalError(message) {
        // Display a global error message - you might want to customize this
        console.error(message);
        // You could create a global error display element or use existing UI
    }

    async saveDocumentNotes() {
        if (!this.notesTextArea || !this.documentId) return;

        const notes = this.notesTextArea.value;
        const saveButton = this.saveNotesBtn;
        
        // Disable button during save
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
        }

        try {
            const response = await fetch(`/api/documents/${this.documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes: notes }),
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    console.warn('Could not parse error response as JSON:', jsonError);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            alert('Notes saved successfully!');
            console.log('Notes save result:', result);
        } catch (error) {
            console.error('Error saving notes:', error);
            alert(`Failed to save notes: ${error.message}`);
        } finally {
            // Re-enable button
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Save Notes';
            }
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
                    let errorMessage = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (jsonError) {
                        console.warn('Could not parse error response as JSON:', jsonError);
                    }
                    throw new Error(errorMessage);
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

// Ensure the class is instantiated once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentViewer();
});