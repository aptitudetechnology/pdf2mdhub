// frontend/static/js/viewer.js
document.addEventListener('DOMContentLoaded', function() {
    const documentId = document.getElementById('viewer-container')?.dataset.documentId;
    const markdownViewer = document.getElementById('markdown-viewer');
    const markdownPlaceholder = document.getElementById('markdown-placeholder');

    if (!documentId) {
        console.error('Document ID not found on viewer-container.');
        return;
    }

    // Function to load and render Markdown (now HTML)
    async function loadMarkdownContent() {
        if (!markdownViewer) {
            console.error('Markdown viewer element not found.');
            return;
        }

        try {
            const response = await fetch(`/api/documents/${documentId}/markdown`);
            const data = await response.json();

            if (response.ok) {
                if (data.html_content) { // EXPECT 'html_content' from backend for display
                    markdownViewer.innerHTML = data.html_content;
                    markdownViewer.classList.remove('viewer-placeholder');
                    if (markdownPlaceholder) markdownPlaceholder.remove();
                } else {
                    markdownViewer.innerHTML = '<div class="viewer-placeholder">Markdown content empty or conversion failed.</div>';
                    if (markdownPlaceholder) markdownPlaceholder.remove();
                }
            } else {
                markdownViewer.innerHTML = `<div class="viewer-placeholder">Error loading Markdown: ${data.error || response.statusText}. Status: ${data.status || 'unknown'}.</div>`;
                if (markdownPlaceholder) markdownPlaceholder.remove();
                console.error('Failed to fetch markdown:', data.error || response.statusText);
            }
        } catch (error) {
            markdownViewer.innerHTML = '<div class="viewer-placeholder">Failed to load Markdown content due to network or server error.</div>';
            if (markdownPlaceholder) markdownPlaceholder.remove();
            console.error('Network or parsing error:', error);
        }
    }

    // Call the function to load markdown when the page loads
    loadMarkdownContent();

    // Event listener for "Download Markdown" button
    const downloadMarkdownBtn = document.getElementById('download-markdown-btn');
    if (downloadMarkdownBtn) {
        downloadMarkdownBtn.addEventListener('click', async () => {
            try {
                // Fetch the *original* markdown content for download
                // The /api/documents/<id>/markdown endpoint now returns both 'html_content' and 'markdown'
                const response = await fetch(`/api/documents/${documentId}/markdown`);
                const data = await response.json();

                if (response.ok && data.markdown) { // Use data.markdown for download
                    const blob = new Blob([data.markdown], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const originalName = document.getElementById('viewer-container')?.dataset.originalName || `document_${documentId}.md`;
                    a.download = originalName.replace(/\.pdf$/i, '.md');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    alert('Markdown download initiated!');
                } else {
                    alert('Failed to get Markdown content for download. Document might not be processed yet.');
                    console.error('Failed to fetch markdown for download:', data.error || response.statusText);
                }
            } catch (error) {
                console.error('Error during markdown download:', error);
                alert('An error occurred during Markdown download.');
            }
        });
    }

    // Save Notes functionality
    const saveNotesBtn = document.getElementById('save-notes-btn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', async () => {
            const notes = document.getElementById('document-notes').value;
            try {
                const response = await fetch(`/api/documents/${documentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ notes: notes })
                });
                if (response.ok) {
                    alert('Notes saved successfully!');
                } else {
                    const errorData = await response.json();
                    alert('Failed to save notes: ' + (errorData.error || response.statusText));
                }
            } catch (error) {
                console.error('Error saving notes:', error);
                alert('An error occurred while saving notes.');
            }
        });
    }

    // Edit Metadata functionality (placeholder)
    const editMetadataBtn = document.getElementById('edit-metadata-btn');
    if (editMetadataBtn) {
        editMetadataBtn.addEventListener('click', () => {
            alert('Edit Details functionality to be implemented (e.g., open a modal).');
        });
    }

    // Delete Document functionality
    const deleteDocumentBtn = document.getElementById('delete-document-btn');
    if (deleteDocumentBtn) {
        deleteDocumentBtn.addEventListener('click', async () => {
            const confirmDelete = confirm('Are you sure you want to delete this document? This action cannot be undone.');
            if (confirmDelete) {
                try {
                    const response = await fetch(`/api/documents/${documentId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        alert('Document deleted successfully.');
                        window.location.href = '/';
                    } else {
                        const errorData = await response.json();
                        alert('Failed to delete document: ' + (errorData.error || response.statusText));
                    }
                } catch (error) {
                    console.error('Error deleting document:', error);
                    alert('An error occurred while deleting the document.');
                }
            }
        });
    }
});