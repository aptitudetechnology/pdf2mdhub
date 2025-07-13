document.addEventListener('DOMContentLoaded', async () => {
    const documentId = document.getElementById('documentId')?.value;
    const markdownDisplayDiv = document.getElementById('markdown-display');

    if (!documentId || !markdownDisplayDiv) {
        console.error('Document ID or Markdown display div not found.');
        return;
    }

    try {
        // Fetch Markdown content from the API
        const response = await fetch(`/api/documents/${documentId}/markdown`);
        if (!response.ok) {
            // If the backend returns 404 for markdown, it means not processed yet
            if (response.status === 404) {
                markdownDisplayDiv.innerHTML = '<p>Markdown content not yet processed.</p>';
            } else {
                const errorData = await response.json();
                markdownDisplayDiv.innerHTML = `<p>Error loading Markdown: ${errorData.error || response.statusText}</p>`;
            }
            return;
        }

        const data = await response.json();
        const markdownText = data.markdown;

        if (markdownText) {
            // Use Marked.js to convert Markdown to HTML
            markdownDisplayDiv.innerHTML = marked.parse(markdownText);
        } else {
            markdownDisplayDiv.innerHTML = '<p>No Markdown content available.</p>';
        }

    } catch (error) {
        console.error('Error fetching or rendering Markdown:', error);
        markdownDisplayDiv.innerHTML = `<p>An unexpected error occurred while loading Markdown: ${error.message}</p>`;
    }
});