/**
 * PDF to Markdown Conversion Service
 * 
 * This service module provides functionality to convert PDF files to Markdown format
 * using the pdf-to-markdown library's modularized components.
 * 
 * Dependencies:
 * - pdf-to-markdown (modularize branch)
 * - pdf.js (Mozilla's PDF parsing library)
 * 
 * Usage:
 * import { convertPdfToMarkdown } from './service-pdf2markdown.js';
 * 
 * const result = await convertPdfToMarkdown(pdfBuffer, options);
 */

// Import core modules from pdf-to-markdown modularize branch
// Note: These imports should be adjusted based on the actual modularize branch structure
import { PdfParser } from 'pdf-to-markdown/lib/parser';
import { MarkdownConverter } from 'pdf-to-markdown/lib/converter';
import { TextExtractor } from 'pdf-to-markdown/lib/text-extractor';
import { StructureAnalyzer } from 'pdf-to-markdown/lib/structure-analyzer';

// Default configuration options
const DEFAULT_OPTIONS = {
  // Text extraction options
  preserveWhitespace: true,
  mergeHyphenatedWords: true,
  
  // Structure detection options
  detectHeaders: true,
  detectLists: true,
  detectTables: true,
  detectImages: false,
  
  // Markdown formatting options
  headerStyle: 'atx', // 'atx' for # headers, 'setext' for underlined headers
  codeBlockStyle: 'fenced', // 'fenced' for ```, 'indented' for 4-space indentation
  emphasisStyle: 'asterisk', // 'asterisk' for *, 'underscore' for _
  
  // Page handling
  includePageNumbers: false,
  pageBreakStyle: 'horizontal-rule', // 'horizontal-rule', 'page-break', 'none'
  
  // Quality settings
  minFontSize: 6,
  maxFontSize: 72,
  fontSizeThreshold: 0.5,
  
  // Advanced options
  debug: false,
  verbose: false
};

/**
 * Main conversion function that transforms PDF buffer to Markdown text
 * 
 * @param {ArrayBuffer|Buffer} pdfBuffer - The PDF file as a buffer
 * @param {Object} options - Configuration options for conversion
 * @returns {Promise<Object>} Conversion result containing markdown text and metadata
 */
export async function convertPdfToMarkdown(pdfBuffer, options = {}) {
  try {
    // Merge user options with defaults
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // Validate input
    if (!pdfBuffer) {
      throw new Error('PDF buffer is required');
    }
    
    if (config.debug) {
      console.log('Starting PDF to Markdown conversion...');
      console.log('Options:', config);
    }
    
    // Initialize parser with PDF buffer
    const parser = new PdfParser(config);
    const pdfDocument = await parser.loadDocument(pdfBuffer);
    
    if (config.debug) {
      console.log(`PDF loaded successfully. Pages: ${pdfDocument.numPages}`);
    }
    
    // Extract text and structure information
    const textExtractor = new TextExtractor(config);
    const structureAnalyzer = new StructureAnalyzer(config);
    
    const extractedData = await textExtractor.extractFromDocument(pdfDocument);
    const structureData = await structureAnalyzer.analyzeStructure(extractedData);
    
    if (config.debug) {
      console.log('Text extraction completed');
      console.log('Structure analysis completed');
    }
    
    // Convert to Markdown
    const markdownConverter = new MarkdownConverter(config);
    const markdownResult = await markdownConverter.convert(structureData);
    
    // Prepare result object
    const result = {
      markdown: markdownResult.text,
      metadata: {
        title: extractedData.title || 'Untitled Document',
        author: extractedData.author || 'Unknown',
        subject: extractedData.subject || '',
        creator: extractedData.creator || '',
        producer: extractedData.producer || '',
        creationDate: extractedData.creationDate || null,
        modificationDate: extractedData.modificationDate || null,
        pageCount: pdfDocument.numPages,
        wordCount: markdownResult.wordCount || 0,
        characterCount: markdownResult.characterCount || 0,
        processingTime: markdownResult.processingTime || 0
      },
      structure: {
        headers: structureData.headers || [],
        lists: structureData.lists || [],
        tables: structureData.tables || [],
        images: structureData.images || [],
        links: structureData.links || []
      },
      warnings: markdownResult.warnings || []
    };
    
    if (config.debug) {
      console.log('Conversion completed successfully');
      console.log(`Generated ${result.markdown.length} characters of markdown`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in PDF to Markdown conversion:', error);
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
}

/**
 * Utility function to convert PDF file from file path
 * 
 * @param {string} filePath - Path to the PDF file
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Conversion result
 */
export async function convertPdfFileToMarkdown(filePath, options = {}) {
  const fs = require('fs').promises;
  
  try {
    const pdfBuffer = await fs.readFile(filePath);
    return await convertPdfToMarkdown(pdfBuffer, options);
  } catch (error) {
    throw new Error(`Failed to read PDF file: ${error.message}`);
  }
}

/**
 * Utility function to convert PDF from URL
 * 
 * @param {string} url - URL to the PDF file
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Conversion result
 */
export async function convertPdfUrlToMarkdown(url, options = {}) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    return await convertPdfToMarkdown(pdfBuffer, options);
  } catch (error) {
    throw new Error(`Failed to fetch PDF from URL: ${error.message}`);
  }
}

/**
 * Utility function to get available conversion options
 * 
 * @returns {Object} Available options with descriptions
 */
export function getConversionOptions() {
  return {
    preserveWhitespace: {
      type: 'boolean',
      default: true,
      description: 'Preserve whitespace in the output'
    },
    mergeHyphenatedWords: {
      type: 'boolean',
      default: true,
      description: 'Merge words split by hyphens across lines'
    },
    detectHeaders: {
      type: 'boolean',
      default: true,
      description: 'Detect and format headers'
    },
    detectLists: {
      type: 'boolean',
      default: true,
      description: 'Detect and format lists'
    },
    detectTables: {
      type: 'boolean',
      default: true,
      description: 'Detect and format tables'
    },
    detectImages: {
      type: 'boolean',
      default: false,
      description: 'Detect and reference images'
    },
    headerStyle: {
      type: 'string',
      options: ['atx', 'setext'],
      default: 'atx',
      description: 'Header formatting style'
    },
    codeBlockStyle: {
      type: 'string',
      options: ['fenced', 'indented'],
      default: 'fenced',
      description: 'Code block formatting style'
    },
    emphasisStyle: {
      type: 'string',
      options: ['asterisk', 'underscore'],
      default: 'asterisk',
      description: 'Emphasis formatting style'
    },
    includePageNumbers: {
      type: 'boolean',
      default: false,
      description: 'Include page numbers in output'
    },
    pageBreakStyle: {
      type: 'string',
      options: ['horizontal-rule', 'page-break', 'none'],
      default: 'horizontal-rule',
      description: 'How to handle page breaks'
    },
    debug: {
      type: 'boolean',
      default: false,
      description: 'Enable debug logging'
    },
    verbose: {
      type: 'boolean',
      default: false,
      description: 'Enable verbose output'
    }
  };
}

/**
 * Utility function to validate PDF buffer
 * 
 * @param {ArrayBuffer|Buffer} buffer - Buffer to validate
 * @returns {boolean} True if valid PDF buffer
 */
export function isPdfBuffer(buffer) {
  if (!buffer || buffer.length < 5) {
    return false;
  }
  
  // Check for PDF signature
  const signature = new Uint8Array(buffer.slice(0, 5));
  return signature[0] === 0x25 && // %
         signature[1] === 0x50 && // P
         signature[2] === 0x44 && // D
         signature[3] === 0x46 && // F
         signature[4] === 0x2D;   // -
}

/**
 * Utility function to estimate conversion time
 * 
 * @param {ArrayBuffer|Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<number>} Estimated processing time in milliseconds
 */
export async function estimateConversionTime(pdfBuffer) {
  try {
    const parser = new PdfParser({ debug: false });
    const pdfDocument = await parser.loadDocument(pdfBuffer);
    
    // Rough estimation: 100ms per page + 500ms base processing
    const estimatedTime = (pdfDocument.numPages * 100) + 500;
    
    return estimatedTime;
  } catch (error) {
    return 1000; // Default estimate if parsing fails
  }
}

// Export default options for external use
export { DEFAULT_OPTIONS };

// Export version information
export const VERSION = '1.0.0';
export const SUPPORTED_FORMATS = ['pdf'];
export const OUTPUT_FORMATS = ['markdown', 'md'];