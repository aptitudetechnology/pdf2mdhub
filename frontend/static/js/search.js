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
        this.resultsPerPage = 10; // Assuming a default, can be fetched from backend if API supports

        this.setupSearch();
        this.loadSearchResults(); // Initial load when page loads
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
        const tags = this.tagFilter.value;
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

        try {
            this.resultsContainer.innerHTML = '<p class="no-results-message">Loading results...</p>'; // Loading indicator

            const response = await fetch(`/api/search?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json(); // Expecting { documents: [], total_pages: 1, current_page: 1 }

            this.renderResults(data.documents);
            this.updatePagination(data.current_page, data.total_pages);

        } catch (error) {
            console.error('Error fetching search results:', error);
            this.resultsContainer.innerHTML = `<p class="no-results-message">Error loading search results: ${error.message}</p>`;
            this.updatePagination(1, 1); // Reset pagination on error
        }
    }

    renderResults(documents) {
        this.resultsContainer.innerHTML = ''; // Clear previous results
        if (documents && documents.length > 0) {
            documents.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'document-card';
                card.innerHTML = `
                    <div class="card-thumbnail">
                        <img src="${doc.thumbnail_url || '/static/images/default_pdf_thumbnail.png'}" alt="Document Thumbnail">
                    </div>
                    <div class="card-content">
                        <h4 class="card-title">${doc.title}</h4>
                        <p class="card-summary">${doc.summary || 'No summary available.'}</p>
                        <div class="card-tags">
                            ${doc.tags ? doc.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '<span class="tag no-tag">No Tags</span>'}
                        </div>
                        <a href="/documents/${doc.id}" class="card-link">View Document</a>
                    </div>
                `;
                this.resultsContainer.appendChild(card);
            });
        } else {
            this.resultsContainer.innerHTML = '<p class="no-results-message">No documents found matching your criteria.</p>';
        }
    }

    updatePagination(currentPage, totalPages) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;

        this.pageInfoSpan.textContent = `Page ${this.currentPage} of ${this.totalPages}`;

        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === this.totalPages;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SearchInterface();
});