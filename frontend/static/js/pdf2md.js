// PDF2MD Client-Side Processing
// Integrates with OpenGovSG's pdf2md library for browser-based PDF to Markdown conversion

class PDF2MDProcessor {
    constructor(options = {}) {
        this.options = {
            baseUrl: options.baseUrl || '/api',
            maxConcurrent: options.maxConcurrent || 3,
            timeout: options.timeout || 30000,
            ...options
        };
        
        this.processingQueue = [];
        this.activeProcessing = new Map();
        this.eventHandlers = new Map();
        
        // Initialize PDF2MD library (placeholder for actual OpenGovSG integration)
        this.initializePDF2MD();
    }
    
    initializePDF2MD() {
        // This would initialize the actual OpenGovSG pdf2md library
        // For demo purposes, we'll simulate the conversion
        console.log('PDF2MD processor initialized');
    }
    
    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => handler(data));
        }
    }
    
    // Convert single PDF file to Markdown
    async convertPDF(file, options = {}) {
        const jobId = this.generateJobId();
        
        try {
            this.emit('conversionStarted', { jobId, filename: file.name });
            
            // Validate file
            if (!this.isValidPDF(file)) {
                throw new Error('Invalid PDF file');
            }
            
            // Update progress
            this.emit('progress', { jobId, progress: 10, status: 'Reading PDF...' });
            
            // Convert PDF to Markdown (simulated for demo)
            const markdown = await this.performConversion(file, options, jobId);
            
            this.emit('progress', { jobId, progress: 100, status: 'Conversion complete' });
            this.emit('conversionCompleted', { jobId, markdown, filename: file.name });
            
            return {
                success: true,
                markdown,
                filename: file.name,
                jobId
            };
            
        } catch (error) {
            this.emit('conversionFailed', { jobId, error: error.message, filename: file.name });
            throw error;
        }
    }
    
    // Perform actual PDF to Markdown conversion
    async performConversion(file, options, jobId) {
        // This would use the actual OpenGovSG pdf2md library
        // For demo, we'll simulate the conversion process
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    
                    // Simulate progress updates
                    this.emit('progress', { jobId, progress: 30, status: 'Processing PDF structure...' });
                    await this.delay(1000);
                    
                    this.emit('progress', { jobId, progress: 60, status: 'Extracting text...' });
                    await this.delay(1000);
                    
                    this.emit('progress', { jobId, progress: 90, status: 'Converting to Markdown...' });
                    await this.delay(500);
                    
                    // Simulate markdown conversion
                    const markdown = this.simulateMarkdownConversion(file.name);
                    
                    resolve(markdown);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Simulate markdown conversion (replace with actual OpenGovSG conversion)
    simulateMarkdownConversion(filename) {
        return `# ${filename.replace('.pdf', '')}

## Document Summary
This document has been converted from PDF to Markdown using the OpenGovSG pdf2md library.

### Key Features Extracted:
- **Headings**: Properly formatted with markdown headers
- **Paragraphs**: Text blocks preserved with proper spacing
- **Lists**: Bullet points and numbered lists maintained
- **Tables**: Converted to markdown table format
- **Images**: Image references preserved where possible

### Conversion Details:
- **Original File**: ${filename}
- **Conversion Date**: ${new Date().toISOString()}
- **Processing Method**: Client-side PDF2MD conversion
- **Library**: OpenGovSG pdf2md

---

## Content

This is a sample conversion result. In a real implementation, this would contain the actual extracted and converted content from the PDF document.

### Sample Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

### Sample List

1. First item
2. Second item
   - Sub-item A
   - Sub-item B
3. Third item

### Code Block Example

\`\`\`javascript
// Sample code that might be extracted from PDF
function processDocument(content) {
    return content.trim();
}
\`\`\`

---

*This conversion was performed using client-side processing for optimal performance and privacy.*`;
    }
    
    // Batch convert multiple PDFs
    async batchConvert(files, options = {}) {
        const results = [];
        const batchId = this.generateJobId();
        
        this.emit('batchStarted', { batchId, totalFiles: files.length });
        
        // Process files with concurrency limit
        const chunks = this.chunkArray(Array.from(files), this.options.maxConcurrent);
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkPromises = chunk.map(file => this.convertPDF(file, options));
            
            try {
                const chunkResults = await Promise.allSettled(chunkPromises);
                results.push(...chunkResults);
                
                const completed = results.length;
                const progress = Math.round((completed / files.length) * 100);
                
                this.emit('batchProgress', { 
                    batchId, 
                    completed, 
                    total: files.length, 
                    progress 
                });
                
            } catch (error) {
                console.error('Batch processing error:', error);
            }
        }
        
        this.emit('batchCompleted', { batchId, results });
        return results;
    }
    
    // Upload converted document to server
    async uploadDocument(file, markdown, metadata = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('markdown_content', markdown);
        formData.append('tags', JSON.stringify(metadata.tags || []));
        formData.append('metadata', JSON.stringify(metadata.metadata || {}));
        formData.append('notes', metadata.notes || '');
        formData.append('uploaded_by', metadata.uploaded_by || 'anonymous');
        
        try {
            const response = await fetch(`${this.options.baseUrl}/documents`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            this.emit('uploadCompleted', { document: result.document });
            
            return result;
            
        } catch (error) {
            this.emit('uploadFailed', { error: error.message });
            throw error;
        }
    }
    
    // Complete workflow: convert and upload
    async processAndUpload(file, options = {}) {
        try {
            this.emit('workflowStarted', { filename: file.name });
            
            // Convert PDF to Markdown
            const conversion = await this.convertPDF(file, options);
            
            // Upload to server
            const upload = await this.uploadDocument(file, conversion.markdown, options);
            
            // Update document with processed status
            await this.updateDocumentStatus(upload.document.id, 'processed');
            
            this.emit('workflowCompleted', { 
                filename: file.name, 
                document: upload.document 
            });
            
            return upload;
            
        } catch (error) {
            this.emit('workflowFailed', { 
                filename: file.name, 
                error: error.message 
            });
            throw error;
        }
    }
    
    // Update document status on server
    async updateDocumentStatus(documentId, status) {
        try {
            const response = await fetch(`${this.options.baseUrl}/documents/${documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                throw new Error(`Status update failed: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Failed to update document status:', error);
            throw error;
        }
    }
    
    // Utility methods
    isValidPDF(file) {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    }
    
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Get processing statistics
    getStats() {
        return {
            activeJobs: this.activeProcessing.size,
            queuedJobs: this.processingQueue.length,
            maxConcurrent: this.options.maxConcurrent
        };
    }
    
    // Clear all processing jobs
    clearAll() {
        this.processingQueue = [];
        this.activeProcessing.clear();
        this.eventHandlers.clear();
    }
}

// Document Manager for handling document operations
class DocumentManager {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    
    async getDocuments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}/documents${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async getDocument(id) {
        const response = await fetch(`${this.baseUrl}/documents/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async updateDocument(id, data) {
        const response = await fetch(`${this.baseUrl}/documents/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update document: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async deleteDocument(id) {
        const response = await fetch(`${this.baseUrl}/documents/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete document: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async searchDocuments(query, params = {}) {
        const searchParams = new URLSearchParams({ q: query, ...params });
        const response = await fetch(`${this.baseUrl}/search?${searchParams}`);
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async getMarkdown(id) {
        const response = await fetch(`${this.baseUrl}/documents/${id}/markdown`);
        if (!response.ok) {
            throw new Error(`Failed to fetch markdown: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async downloadDocument(id) {
        const response = await fetch(`${this.baseUrl}/documents/${id}/download`);
        if (!response.ok) {
            throw new Error(`Failed to download document: ${response.statusText}`);
        }
        
        return response.blob();
    }
    
    async getTags() {
        const response = await fetch(`${this.baseUrl}/tags`);
        if (!response.ok) {
            throw new Error(`Failed to fetch tags: ${response.statusText}`);
        }
        
        return await response.json();
    }
}

// Progress tracking helper
class ProgressTracker {
    constructor() {
        this.jobs = new Map();
    }
    
    startJob(jobId, filename) {
        this.jobs.set(jobId, {
            filename,
            progress: 0,
            status: 'Starting...',
            startTime: Date.now()
        });
    }
    
    updateProgress(jobId, progress, status) {
        if (this.jobs.has(jobId)) {
            const job = this.jobs.get(jobId);
            job.progress = progress;
            job.status = status;
            job.lastUpdate = Date.now();
        }
    }
    
    completeJob(jobId) {
        if (this.jobs.has(jobId)) {
            const job = this.jobs.get(jobId);
            job.progress = 100;
            job.status = 'Completed';
            job.endTime = Date.now();
            job.duration = job.endTime - job.startTime;
        }
    }
    
    failJob(jobId, error) {
        if (this.jobs.has(jobId)) {
            const job = this.jobs.get(jobId);
            job.status = 'Failed';
            job.error = error;
            job.endTime = Date.now();
        }
    }
    
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
    
    clearCompleted() {
        for (const [jobId, job] of this.jobs) {
            if (job.progress === 100 || job.status === 'Failed') {
                this.jobs.delete(jobId);
            }
        }
    }
}

// Configuration helper
class PDF2MDConfig {
    constructor() {
        this.defaults = {
            baseUrl: '/api',
            maxConcurrent: 3,
            timeout: 30000,
            chunkSize: 1024 * 1024, // 1MB chunks
            enableProgress: true,
            enableStats: true
        };
    }
    
    merge(userConfig = {}) {
        return { ...this.defaults, ...userConfig };
    }
    
    validate(config) {
        const errors = [];
        
        if (config.maxConcurrent < 1) {
            errors.push('maxConcurrent must be at least 1');
        }
        
        if (config.timeout < 1000) {
            errors.push('timeout must be at least 1000ms');
        }
        
        if (config.chunkSize < 1024) {
            errors.push('chunkSize must be at least 1024 bytes');
        }
        
        return errors;
    }
}

// Export classes and utilities
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        PDF2MDProcessor,
        DocumentManager,
        ProgressTracker,
        PDF2MDConfig
    };
} else {
    // Browser environment
    window.PDF2MDProcessor = PDF2MDProcessor;
    window.DocumentManager = DocumentManager;
    window.ProgressTracker = ProgressTracker;
    window.PDF2MDConfig = PDF2MDConfig;
    
    // Global convenience instance
    window.PDF2MD = {
        processor: null,
        documentManager: null,
        
        init(config = {}) {
            const configHelper = new PDF2MDConfig();
            const mergedConfig = configHelper.merge(config);
            
            this.processor = new PDF2MDProcessor(mergedConfig);
            this.documentManager = new DocumentManager(mergedConfig.baseUrl);
            
            return this;
        },
        
        // Quick conversion method
        async convert(file, options = {}) {
            if (!this.processor) {
                throw new Error('PDF2MD not initialized. Call PDF2MD.init() first.');
            }
            return await this.processor.convertPDF(file, options);
        },
        
        // Quick upload method
        async upload(file, markdown, metadata = {}) {
            if (!this.processor) {
                throw new Error('PDF2MD not initialized. Call PDF2MD.init() first.');
            }
            return await this.processor.uploadDocument(file, markdown, metadata);
        },
        
        // Quick process and upload method
        async processAndUpload(file, options = {}) {
            if (!this.processor) {
                throw new Error('PDF2MD not initialized. Call PDF2MD.init() first.');
            }
            return await this.processor.processAndUpload(file, options);
        }
    };
}

// Auto-initialize if in browser with default config
if (typeof window !== 'undefined' && window.document) {
    document.addEventListener('DOMContentLoaded', () => {
        // Only auto-initialize if not already done
        if (!window.PDF2MD.processor) {
            window.PDF2MD.init();
        }
    });
}