// Upload.js - Clean implementation with service selection
class PDFUploader {
    constructor() {
        this.selectedFiles = [];
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.uploadQueue = document.getElementById('upload-queue');
        this.metadataForm = document.getElementById('metadata-form');
        this.overallProgressContainer = document.getElementById('overall-progress-container');
        this.overallProgress = document.getElementById('overall-upload-progress');
        this.overallProgressText = document.getElementById('overall-progress-text');
    }

    attachEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        
        // Form submission
        this.metadataForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        this.dropZone.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files).filter(file => 
            file.type === 'application/pdf'
        );
        
        if (files.length > 0) {
            this.addFiles(files);
        }
    }

    addFiles(files) {
        // Filter out duplicates
        const newFiles = files.filter(file => 
            !this.selectedFiles.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            )
        );

        this.selectedFiles = [...this.selectedFiles, ...newFiles];
        this.updateFileQueue();
        this.showMetadataForm();
    }

    updateFileQueue() {
        if (this.selectedFiles.length === 0) {
            this.uploadQueue.innerHTML = '<p class="queue-placeholder">No files selected yet.</p>';
            return;
        }

        const fileList = this.selectedFiles.map((file, index) => `
            <div class="file-item" data-index="${index}">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
                <button type="button" class="remove-file" onclick="uploader.removeFile(${index})">×</button>
            </div>
        `).join('');

        this.uploadQueue.innerHTML = fileList;
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileQueue();
        
        if (this.selectedFiles.length === 0) {
            this.hideMetadataForm();
        }
    }

    showMetadataForm() {
        this.metadataForm.classList.remove('hidden');
    }

    hideMetadataForm() {
        this.metadataForm.classList.add('hidden');
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (this.selectedFiles.length === 0) {
            alert('Please select at least one PDF file.');
            return;
        }

        // Get selected conversion method
        const conversionMethod = document.querySelector('input[name="conversion-method"]:checked')?.value;
        if (!conversionMethod) {
            alert('Please select a conversion method.');
            return;
        }

        // Get metadata
        const tags = document.getElementById('form-tags').value.trim();
        const title = document.getElementById('form-title').value.trim();

        // Show progress
        this.showOverallProgress();

        try {
            await this.processFiles(conversionMethod, { tags, title });
            this.showSuccess();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideOverallProgress();
        }
    }

    async processFiles(conversionMethod, metadata) {
        const totalFiles = this.selectedFiles.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const file = this.selectedFiles[i];
            
            // Update progress
            const progress = ((i + 1) / totalFiles) * 100;
            this.updateOverallProgress(progress, `Processing ${file.name}...`);
            
            try {
                // Import and use the appropriate service
                let result;
                if (conversionMethod === 'opendocsg') {
                    const { convertWithPdf2md } = await import('../service-pdf2md.js');
                    result = await convertWithPdf2md(file, metadata);
                } else if (conversionMethod === 'pdf-to-markdown') {
                    const { convertWithPdfToMarkdown } = await import('./service-pdf2markdown.js');
                    result = await convertWithPdfToMarkdown(file, metadata);
                } else {
                    throw new Error('Invalid conversion method selected');
                }

                // Save to database
                await this.saveToDatabase(result, file.name, metadata);
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                throw new Error(`Failed to process ${file.name}: ${error.message}`);
            }
        }
    }

    async saveToDatabase(conversionResult, filename, metadata) {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: filename,
                markdown_content: conversionResult.markdown,
                metadata: {
                    tags: metadata.tags,
                    title: metadata.title || filename,
                    conversion_method: document.querySelector('input[name="conversion-method"]:checked')?.value,
                    created_at: new Date().toISOString()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save ${filename} to database`);
        }

        return await response.json();
    }

    showOverallProgress() {
        this.overallProgressContainer.classList.remove('hidden');
    }

    hideOverallProgress() {
        this.overallProgressContainer.classList.add('hidden');
    }

    updateOverallProgress(percent, message) {
        this.overallProgress.value = percent;
        this.overallProgressText.textContent = `${Math.round(percent)}% - ${message}`;
    }

    showSuccess() {
        alert('All files processed successfully!');
        this.resetForm();
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    resetForm() {
        this.selectedFiles = [];
        this.fileInput.value = '';
        this.updateFileQueue();
        this.hideMetadataForm();
        document.getElementById('form-tags').value = '';
        document.getElementById('form-title').value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize uploader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uploader = new PDFUploader();
});