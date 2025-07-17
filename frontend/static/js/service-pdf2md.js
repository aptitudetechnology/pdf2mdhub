// ~/pdf2mdhub/frontend/static/js/src/service-pdf2md.js
/**
 * Real implementation of PDF to Markdown conversion using opendocsg/pdf2md bundle
 * @param {File} file - The PDF file object
 * @param {Object} metadata - Additional metadata for the conversion
 * @returns {Promise<Object>} - Promise resolving to conversion result
 */

let pdf2mdModule = null;

/**
 * Initialize the PDF2MD module if not already loaded
 */
async function initializePdf2md() {
    if (pdf2mdModule) {
        return pdf2mdModule;
    }

    try {
        // Import the pdf2md bundle
        const module = await import('/static/js/libs/pdf2md-0.2.1/dist/pdf2md.bundle.js');
        pdf2mdModule = module;
        console.log('PDF2MD module loaded successfully');
        return pdf2mdModule;
    } catch (error) {
        console.error('Failed to load PDF2MD module:', error);
        throw new Error('Failed to initialize PDF2MD converter');
    }
}

/**
 * Convert PDF file to Markdown using the pdf2md bundle
 * @param {File} file - The PDF file object
 * @param {Object} metadata - Additional metadata for the conversion
 * @returns {Promise<Object>} - Promise resolving to conversion result
 */
export async function convertWithPdf2md(file, metadata) {
    console.log("--- convertWithPdf2md called ---");
    console.log("Input File:", file ? file.name : "[No File]");
    console.log("Input Metadata:", metadata);

    if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid file: Please provide a valid PDF file');
    }

    try {
        // Initialize the PDF2MD module
        const pdf2md = await initializePdf2md();
        
        // Convert file to array buffer for processing
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Different possible API patterns - we'll try the most common ones
        let markdownContent;
        
        // Try different API patterns based on common pdf2md implementations
        if (pdf2md.default && typeof pdf2md.default.convert === 'function') {
            // Pattern 1: module.default.convert(buffer)
            markdownContent = await pdf2md.default.convert(uint8Array);
        } else if (pdf2md.convert && typeof pdf2md.convert === 'function') {
            // Pattern 2: module.convert(buffer)
            markdownContent = await pdf2md.convert(uint8Array);
        } else if (pdf2md.default && typeof pdf2md.default === 'function') {
            // Pattern 3: module.default(buffer)
            markdownContent = await pdf2md.default(uint8Array);
        } else if (typeof pdf2md.default === 'object' && pdf2md.default.pdf2md) {
            // Pattern 4: module.default.pdf2md(buffer)
            markdownContent = await pdf2md.default.pdf2md(uint8Array);
        } else {
            // Log available methods for debugging
            console.log('Available pdf2md methods:', Object.keys(pdf2md));
            if (pdf2md.default) {
                console.log('Available default methods:', Object.keys(pdf2md.default));
            }
            throw new Error('Unknown PDF2MD API structure');
        }

        // Handle different response formats
        let finalMarkdown;
        if (typeof markdownContent === 'string') {
            finalMarkdown = markdownContent;
        } else if (markdownContent && markdownContent.markdown) {
            finalMarkdown = markdownContent.markdown;
        } else if (markdownContent && markdownContent.content) {
            finalMarkdown = markdownContent.content;
        } else if (markdownContent && markdownContent.text) {
            finalMarkdown = markdownContent.text;
        } else {
            console.log('Unexpected response format:', markdownContent);
            throw new Error('Unexpected response format from PDF2MD converter');
        }

        // Add metadata header to the markdown if provided
        let finalContent = finalMarkdown;
        if (metadata && (metadata.title || metadata.tags)) {
            const metadataHeader = createMetadataHeader(metadata, file.name);
            finalContent = metadataHeader + '\n\n' + finalMarkdown;
        }

        return {
            markdown: finalContent,
            success: true,
            message: `Successfully converted ${file.name} to Markdown`,
            originalFilename: file.name,
            fileSize: file.size,
            conversionTimestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('PDF2MD conversion error:', error);
        return {
            markdown: null,
            success: false,
            message: `Failed to convert ${file.name}: ${error.message}`,
            originalFilename: file.name,
            error: error.message
        };
    }
}

/**
 * Create a metadata header for the markdown content
 * @param {Object} metadata - The metadata object
 * @param {string} filename - The original filename
 * @returns {string} - Formatted metadata header
 */
function createMetadataHeader(metadata, filename) {
    const header = [];
    header.push('---');
    
    if (metadata.title) {
        header.push(`title: ${metadata.title}`);
    } else {
        header.push(`title: ${filename.replace('.pdf', '')}`);
    }
    
    if (metadata.tags) {
        const tags = metadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tags.length > 0) {
            header.push(`tags: [${tags.map(tag => `"${tag}"`).join(', ')}]`);
        }
    }
    
    header.push(`source: ${filename}`);
    header.push(`converted: ${new Date().toISOString()}`);
    header.push(`converter: opendocsg/pdf2md`);
    header.push('---');
    
    return header.join('\n');
}

/**
 * Test function to check if the PDF2MD module is working
 * @returns {Promise<boolean>} - True if module is available and working
 */
export async function testPdf2mdAvailability() {
    try {
        await initializePdf2md();
        return true;
    } catch (error) {
        console.error('PDF2MD module not available:', error);
        return false;
    }
}

/**
 * Get information about the loaded PDF2MD module
 * @returns {Promise<Object>} - Module information
 */
export async function getPdf2mdInfo() {
    try {
        const module = await initializePdf2md();
        return {
            available: true,
            version: module.version || 'unknown',
            methods: Object.keys(module),
            defaultMethods: module.default ? Object.keys(module.default) : []
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}