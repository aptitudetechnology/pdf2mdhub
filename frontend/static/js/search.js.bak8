// static/js/search.js

class SearchInterface {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.resultsContainer = document.getElementById('search-results');
        this.tagFilter = document.getElementById('tag-filter');
        this.dateFromInput = document.getElementById('date-from');
        this.dateToInput = document.getElementById('date-to');
        this.applyFiltersBtn = document.getElementById('apply-filters-btn');
        this.clearFiltersBtn = document.getElementById('clear-filters-btn');
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.pageInfoSpan = document.getElementById('page-info');

        this.currentPage = 1;
        this.totalPages = 1;
        // Adjusted to 20 to align with backend's typical default per_page for /api/search
        this.resultsPerPage = 20; 

        this.setupSearch();
        this.loadSearchResults(); // Initial load when page loads
        console.log("DEBUG: SearchInterface initialized. Loading initial results."); // DEBUG: Initial load check
    }

    setupSearch() {
        // Debounced search input for live-ish search without excessive requests
        let searchTimeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentPage = 1; // Reset to first page on new search
                this.loadSearchResults();
            }, 500); // 500ms debounce
        });

        this.searchButton.addEventListener('click', () => {
            this.currentPage = 1;
            this.loadSearchResults();
        });

        this.applyFiltersBtn.addEventListener('click', () => {
            this.currentPage = 1;
            this.loadSearchResults();
        });

        this.clearFiltersBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.tagFilter.value = '';
            this.dateFromInput.value = '';
            this.dateToInput.value = '';
            this.currentPage = 1;
            this.loadSearchResults();
        });

        this.prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadSearchResults();
            }
        });

        this.nextPageBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadSearchResults();
            }
        });
    }

    async loadSearchResults() {
        const query = this.searchInput.value.trim();
        // Ensure tags are comma-separated for the backend as your /api/search expects
        const tags = this.tagFilter.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '').join(',');
        const dateFrom = this.dateFromInput.value;
        const dateTo = this.dateToInput.value;

        const params = new URLSearchParams({
            q: query,
            tags: tags,
            date_from: dateFrom,
            date_to: dateTo,
            page: this.currentPage,
            per_page: this.resultsPerPage
        });

        console.log("DEBUG: Calling /api/search with params:", params.toString()); // DEBUG: API call params

        try {
            this.resultsContainer.innerHTML = '<p class="no-results-message">Loading results...</p>'; // Loading indicator

            const response = await fetch(`/api/search?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            console.log("DEBUG: Received data from /api/search:", data); // DEBUG: Raw data from backend

            // --- CRITICAL CHANGE HERE: Adjusting to your backend's actual JSON structure ---
            // Your backend's /api/search endpoint now returns:
            // { results: [...], pagination: { page: X, pages: Y, ... } }
            this.renderResults(data.results); // Pass data.results to render the documents
            this.updatePagination(data.pagination.page, data.pagination.pages); // Use data.pagination object for page info
            console.log("DEBUG: renderResults and updatePagination called."); // DEBUG: Confirmation

        } catch (error) {
            console.error('ERROR: Error fetching search results:', error); // DEBUG: Error logging
            this.resultsContainer.innerHTML = `<p class="no-results-message">Error loading search results: ${error.message}</p>`;
            this.updatePagination(1, 1); // Reset pagination on error
        }
    }

    renderResults(documents) {
        console.log("DEBUG: Entering renderResults. Documents received:", documents); // DEBUG: Documents received by renderResults
        this.resultsContainer.innerHTML = ''; // Clear previous results
        if (documents && documents.length > 0) {
            documents.forEach(doc => {
                console.log("DEBUG: Processing document:", doc.id, doc.title); // DEBUG: Each document being processed
                const card = document.createElement('div');
                card.className = 'document-card';
                // Using a temporary variable to inspect the HTML string before assignment
                const cardHtml = `
                    <div class="card-thumbnail">
                        <img src="${doc.thumbnail_url || '/static/images/default_pdf_thumbnail.png'}" alt="Document Thumbnail">
                    </div>
                    <div class="card-content">
                        <h4 class="card-title">${doc.title || doc.original_name || 'Untitled Document'}</h4>
                        <p class="card-summary">${doc.summary || 'No summary available.'}</p>
                        <div class="card-tags">
                            ${doc.tags && doc.tags.length > 0 ? doc.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '<span class="tag no-tag">No Tags</span>'}
                        </div>
                        <div class="card-actions">
                            <a href="/documents/${doc.id}" class="card-link view-markdown-link">View Markdown</a>
                            <a href="/api/documents/${doc.id}/download" class="card-link view-pdf-link" target="_blank">View PDF</a>
                        </div>
                    </div>
                `;
                console.log("DEBUG: Generated card HTML for document:", doc.id, cardHtml); // DEBUG: Generated HTML
                card.innerHTML = cardHtml; // Assign the HTML
                this.resultsContainer.appendChild(card);
                console.log("DEBUG: Appended card for document:", doc.id); // DEBUG: Confirmation of append
            });
            console.log("DEBUG: Finished rendering all documents."); // DEBUG: All documents rendered
        } else {
            console.log("DEBUG: No documents to render."); // DEBUG: No documents path
            this.resultsContainer.innerHTML = '<p class="no-results-message">No documents found matching your criteria.</p>';
        }
    }

    updatePagination(currentPage, totalPages) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;

        this.pageInfoSpan.textContent = `Page ${this.currentPage} of ${this.totalPages}`;

        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === this.totalPages;
        console.log(`DEBUG: Pagination updated to Page ${this.currentPage} of ${this.totalPages}`); // DEBUG: Pagination info
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SearchInterface();
    console.log("DEBUG: DOMContentLoaded event fired. Initializing SearchInterface."); // DEBUG: DOM ready
});