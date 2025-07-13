// static/js/upload.js

class UploadInterface {
    constructor() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.uploadQueue = document.getElementById('upload-queue');
        this.overallProgressContainer = document.getElementById('overall-progress-container');
        this.overallProgressBar = document.getElementById('overall-upload-progress');
        this.overallProgressText = document.getElementById('overall-progress-text');
        this.metadataForm = document.getElementById('metadata-form');
        this.formTagsInput = document.getElementById('form-tags');
        this.formTitleInput = document.getElementById('form-title');
        this.uploadButton = this.metadataForm.querySelector('button[type="submit"]');

        this.filesToUpload = [];
        this.jobStatus = {}; // To track progress for each file/job ID

        // Initialize PDF2MDProcessor (assuming pdf2md.js is loaded globally or imported)
        // Ensure PDF2MDProcessor is accessible, assuming it's a global instance or singleton
        if (typeof PDF2MDProcessor === 'undefined') {
            console.error("PDF2MDProcessor not found. Ensure pdf2md.js is loaded correctly.");
            // Fallback or error handling, maybe disable functionality
            this.uploadButton.disabled = true;
            this.dropZone.removeEventListener('click', () => this.fileInput.click()); // Disable drop zone click
            return;
        }
        this.pdf2mdProcessor = new PDF2MDProcessor();
        this.pdf2mdProcessor.on('progress', this.updateFileProgress.bind(this));
        this.pdf2mdProcessor.on('complete', this.handleFileComplete.bind(this));
        this.pdf2mdProcessor.on('error', this.handleFileError.bind(this));

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false); // Global prevent
        });

        // Highlight drop zone when item is over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => this.dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => this.dropZone.classList.remove('drag-over'), false);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

        // Handle file input change
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Allow click on drop zone to trigger file input
        this.dropZone.addEventListener('click', () => this.fileInput.click());

        // Handle form submission for metadata and actual upload
        this.metadataForm.addEventListener('submit', this.startProcessingAndUpload.bind(this));
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        this.handleFileUpload(files);
    }

    handleFileUpload(files) {
        if (files.length === 0) return;

        this.metadataForm.classList.remove('hidden');
        this.overallProgressContainer.classList.add('hidden'); // Hide overall progress until upload starts

        // Clear previous queue if new files are selected
        // This assumes single-batch uploads. If you want to add to existing queue, adjust this.
        this.filesToUpload = [];
        this.uploadQueue.innerHTML = ''; // Clear existing queue display
        const queuePlaceholder = this.uploadQueue.querySelector('.queue-placeholder');
        if (queuePlaceholder) queuePlaceholder.remove();
        this.uploadQueue.classList.remove('hidden');


        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf') {
                this.filesToUpload.push(file);
                this.addFileToQueue(file);
            } else {
                alert(`File "${file.name}" is not a PDF and will be skipped.`);
            }
        });
        this.updateUploadButtonState();
    }

    addFileToQueue(file) {
        const itemId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const fileItem = document.createElement('div');
        fileItem.className = 'file-upload-item';
        fileItem.id = itemId;
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-status">Ready</span>
            <progress class="file-progress" value="0" max="100"></progress>
        `;
        this.uploadQueue.appendChild(fileItem);

        this.jobStatus[itemId] = {
            file: file,
            progress: 0,
            status: 'Ready',
            element: fileItem,
            jobId: itemId // Use itemId as jobId for tracking
        };
    }

    updateUploadButtonState() {
        if (this.filesToUpload.length > 0) {
            this.uploadButton.textContent = `Start Upload & Convert (${this.filesToUpload.length} files)`;
            this.uploadButton.disabled = false;
        } else {
            this.uploadButton.textContent = 'No Files Selected';
            this.uploadButton.disabled = true;
            this.metadataForm.classList.add('hidden');
            // If the queue is empty, restore the placeholder
            if (!this.uploadQueue.querySelector('.queue-placeholder')) {
                const placeholder = document.createElement('p');
                placeholder.className = 'queue-placeholder';
                placeholder.textContent = 'No files selected yet.';
                this.uploadQueue.appendChild(placeholder);
            }
        }
    }

    async startProcessingAndUpload(e) {
        e.preventDefault();

        if (this.filesToUpload.length === 0) {
            alert('Please select PDF files to upload.');
            return;
        }

        this.metadataForm.classList.add('hidden'); // Hide form once upload starts
        this.overallProgressContainer.classList.remove('hidden');
        this.uploadButton.disabled = true; // Disable button to prevent re-submission

        const commonTagsRaw = this.formTagsInput.value.trim();
        //const commonTitle = this.formTitleInput.value.trim();

        // --- FIX: Process Tags for JSON before sending ---
        let tagsArray = [];
        if (commonTagsRaw) {
            // Split by comma, trim whitespace, filter out empty strings
            tagsArray = commonTagsRaw.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
        // Convert the JavaScript array to a JSON string
        const tagsJsonString = JSON.stringify(tagsArray); 
        console.log('Frontend preparing tags (JSON stringified):', tagsJsonString); // For debugging


        let completedFiles = 0;
        let totalFiles = this.filesToUpload.length;

        // Reset overall progress at the start of a new batch
        this.updateOverallProgress(0, totalFiles); 


        for (const file of this.filesToUpload) {
            const fileId = Object.keys(this.jobStatus).find(key => this.jobStatus[key].file === file);
            if (!fileId) continue;

            const jobOptions = {
                preserveImages: true, // Example option, can be dynamic
                extractTables: true,  // Example option
                // Any other options you want to pass to pdf2md
            };

            const itemElement = this.jobStatus[fileId].element;
            const statusSpan = itemElement.querySelector('.file-status');
            const progressBar = itemElement.querySelector('.file-progress');

            try {
                statusSpan.textContent = 'Converting...';
                progressBar.value = 10;

                const markdownContent = await this.pdf2mdProcessor.performConversion(file, jobOptions, fileId);

                statusSpan.textContent = 'Uploading...';
                progressBar.value = 95;

                // Send the file and markdown content to the backend
                const formData = new FormData();
                //formData.append('pdf_file', file);
                formData.append('file', file); // Change 'pdf_file' to 'file'
                formData.append('markdown_content', markdownContent);
                formData.append('tags', tagsJsonString); // Append the JSON stringified tags
                //formData.append('title', commonTitle || file.name.split('.').slice(0, -1).join('.')); // Use file name if no common title

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                statusSpan.textContent = `Uploaded! ID: ${result.document.id}`; // Corrected to result.document.id
                statusSpan.style.color = 'var(--success-color)';
                progressBar.value = 100;
                completedFiles++;

            } catch (error) {
                console.error(`Error processing/uploading ${file.name}:`, error);
                statusSpan.textContent = `Failed: ${error.message}`;
                statusSpan.style.color = 'var(--danger-color)';
                progressBar.value = 0;
                // Do not increment completedFiles on failure if you want progress to reflect only successful ones
            } finally {
                // Update overall progress based on the total number of files attempted,
                // and the number successfully processed.
                // It's often better to track completed vs total, but here we increment per file
                // and update based on that count.
                this.updateOverallProgress(completedFiles, totalFiles);
            }
        }

        // Final message after all files have been processed
        // Use a timeout to ensure progress bar finishes visually before alert/reset
        setTimeout(() => {
            alert('All file operations completed. Check individual file statuses for details.');
            this.filesToUpload = []; // Clear queue after processing attempt
            this.jobStatus = {}; // Reset job status
            this.uploadQueue.innerHTML = ''; // Clear display
            this.updateUploadButtonState(); // Update button text to reflect empty queue
            this.formTagsInput.value = ''; // Clear tags input
            this.formTitleInput.value = ''; // Clear title input
        }, 500); // Small delay
    }

    updateFileProgress({ jobId, progress, status }) {
        if (this.jobStatus[jobId]) {
            const itemElement = this.jobStatus[jobId].element;
            const statusSpan = itemElement.querySelector('.file-status');
            const progressBar = itemElement.querySelector('.file-progress');

            if (statusSpan) statusSpan.textContent = status;
            if (progressBar) progressBar.value = progress;
        }
    }

    handleFileComplete({ jobId, markdownContent }) {
        // This method is primarily for handling the *conversion* completion from PDF2MDProcessor.
        // The actual upload happens in `startProcessingAndUpload` after this.
        console.log(`Conversion job ${jobId} completed.`);
        // You could use this to update a temporary status for the file item
        // e.g., this.jobStatus[jobId].element.querySelector('.file-status').textContent = 'Conversion Complete';
    }

    handleFileError({ jobId, error }) {
        if (this.jobStatus[jobId]) {
            const itemElement = this.jobStatus[jobId].element;
            const statusSpan = itemElement.querySelector('.file-status');
            const progressBar = itemElement.querySelector('.file-progress');

            if (statusSpan) {
                statusSpan.textContent = `Conversion Error: ${error.message || 'Unknown error'}`;
                statusSpan.style.color = 'var(--danger-color)';
            }
            if (progressBar) progressBar.value = 0;
        }
        console.error(`Error in conversion job ${jobId}:`, error);
    }

    updateOverallProgress(completed, total) {
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        this.overallProgressBar.value = percent;
        this.overallProgressText.textContent = `${percent}% (${completed}/${total} files)`;

        if (completed === total && total > 0) {
            this.overallProgressText.textContent = `All operations completed!`;
            this.overallProgressBar.style.backgroundColor = 'var(--success-color)';
            // Consider if you want to visually clear the queue here or keep statuses
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UploadInterface();
});