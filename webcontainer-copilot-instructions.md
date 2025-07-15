# GitHub Copilot Instructions: PDF2MD Web Container Integration

## Context
Convert a PDF2MD client-side processor from simulation to real PDF text extraction using OpenGovSG library via web containers.

## Current State
- Existing `PDF2MDProcessor` class with `simulateMarkdownConversion()` method
- Template-based conversion that creates markdown headers and structure but no real text extraction
- Files being processed: PDFs in `./backend/uploads/`, Markdown output in `./backend/md/{hash}_{filename}/`

## Objective
Replace simulation with real PDF text extraction using `@opendocsg/pdf2md` library running in web containers.

## Implementation Steps

### 1. Setup Web Container Runtime
```javascript
// Install and import WebContainers
// npm install @webcontainer/api
import { WebContainer } from '@webcontainer/api';

// Initialize web container in PDF2MDProcessor constructor
async initializeWebContainer() {
    this.webContainer = await WebContainer.boot();
    await this.setupNodeEnvironment();
}
```

### 2. Configure Node.js Environment in Container
```javascript
// Create package.json for the container
const packageJson = {
    "name": "pdf2md-container",
    "type": "module",
    "dependencies": {
        "@opendocsg/pdf2md": "latest"
    }
};

// Install dependencies in container
await this.webContainer.mount({
    'package.json': {
        file: {
            contents: JSON.stringify(packageJson, null, 2)
        }
    }
});

// Install npm packages
await this.webContainer.spawn('npm', ['install']);
```

### 3. Replace simulateMarkdownConversion() Method
```javascript
// Replace this method completely
async performConversion(file, options, jobId) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const buffer = Buffer.from(arrayBuffer);
                
                // Write PDF to container filesystem
                await this.webContainer.fs.writeFile('/input.pdf', buffer);
                
                // Create conversion script
                const conversionScript = `
                    const path = require('path');
                    const fs = require('fs');
                    const pdf2md = require('@opendocsg/pdf2md');
                    
                    const pdfBuffer = fs.readFileSync('/input.pdf');
                    
                    pdf2md(pdfBuffer, {
                        onProgress: (progress) => {
                            // Send progress updates
                            console.log('PROGRESS:', progress);
                        }
                    })
                    .then(text => {
                        fs.writeFileSync('/output.md', text);
                        console.log('CONVERSION_COMPLETE');
                    })
                    .catch(err => {
                        console.error('CONVERSION_ERROR:', err);
                    });
                `;
                
                // Write and execute conversion script
                await this.webContainer.fs.writeFile('/convert.js', conversionScript);
                const process = await this.webContainer.spawn('node', ['/convert.js']);
                
                // Handle progress updates
                process.output.pipeTo(new WritableStream({
                    write(chunk) {
                        const output = new TextDecoder().decode(chunk);
                        if (output.includes('PROGRESS:')) {
                            const progress = parseInt(output.match(/PROGRESS: (\d+)/)?.[1] || '0');
                            this.emit('progress', { jobId, progress, status: 'Converting...' });
                        }
                    }
                }));
                
                // Wait for completion
                await process.exit;
                
                // Read converted markdown
                const markdown = await this.webContainer.fs.readFile('/output.md', 'utf-8');
                resolve(markdown);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.readAsArrayBuffer(file);
    });
}
```

### 4. Update Constructor to Initialize Container
```javascript
constructor(options = {}) {
    // ... existing constructor code ...
    
    this.webContainer = null;
    this.containerReady = false;
    
    // Initialize web container
    this.initializeWebContainer().then(() => {
        this.containerReady = true;
        console.log('Web container initialized successfully');
    }).catch(error => {
        console.error('Failed to initialize web container:', error);
    });
}
```

### 5. Add Container Validation
```javascript
// Add this method to check container readiness
async waitForContainer() {
    if (this.containerReady) return;
    
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (this.containerReady) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Web container initialization timeout'));
        }, 30000);
    });
}
```

### 6. Update convertPDF Method
```javascript
// Update to wait for container before conversion
async convertPDF(file, options = {}) {
    const jobId = this.generateJobId();
    
    try {
        // Wait for container to be ready
        await this.waitForContainer();
        
        this.emit('conversionStarted', { jobId, filename: file.name });
        
        // Validate file
        if (!this.isValidPDF(file)) {
            throw new Error('Invalid PDF file');
        }
        
        // Update progress
        this.emit('progress', { jobId, progress: 10, status: 'Initializing conversion...' });
        
        // Convert PDF to Markdown using real OpenGovSG library
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
```

### 7. Clean Up Resources
```javascript
// Add cleanup method
async cleanup() {
    if (this.webContainer) {
        await this.webContainer.teardown();
        this.webContainer = null;
        this.containerReady = false;
    }
}

// Update clearAll method
clearAll() {
    this.processingQueue = [];
    this.activeProcessing.clear();
    this.eventHandlers.clear();
    this.cleanup();
}
```

### 8. Error Handling and Fallback
```javascript
// Add error handling for container failures
async performConversion(file, options, jobId) {
    try {
        await this.waitForContainer();
        return await this.performRealConversion(file, options, jobId);
    } catch (error) {
        console.error('Container conversion failed:', error);
        // Fallback to simulation if container fails
        this.emit('progress', { jobId, progress: 50, status: 'Falling back to simulation...' });
        return this.simulateMarkdownConversion(file.name);
    }
}
```

## Testing Instructions

1. **Test container initialization**: Verify web container boots successfully
2. **Test npm install**: Ensure @opendocsg/pdf2md installs in container
3. **Test file I/O**: Verify PDF files can be written to container filesystem
4. **Test conversion**: Confirm real text extraction works
5. **Test error handling**: Verify graceful fallback to simulation
6. **Test cleanup**: Ensure containers are properly torn down

## Dependencies to Add
```json
{
    "@webcontainer/api": "^1.1.0",
    "buffer": "^6.0.3"
}
```

## Key Changes
- Remove `simulateMarkdownConversion()` as primary conversion method
- Replace with real OpenGovSG library calls via web container
- Add container lifecycle management
- Implement proper error handling and fallback
- Add progress tracking for real conversion process

## Notes
- Web containers may take time to initialize on first load
- Consider preloading container during app startup
- Monitor memory usage with large PDF files
- Test browser compatibility (modern browsers only)
- Consider caching converted files to avoid re-conversion
