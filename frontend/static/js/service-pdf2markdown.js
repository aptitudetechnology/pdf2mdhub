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
//import { PdfParser } from './PdfParser';
//import { MarkdownConverter } from './convert/MarkdownConverter';
//import { parse } from './parse';
//import { convert } from './convert';
//import { PdfPipeline } from './PdfPipeline';
//import { Debugger as PdfDebugger } from './Debugger'; // Fixed: renamed import to avoid reserved word
//import { Config } from './Config';


// In your TypeScript files, change from:
import { PdfParser } from './PdfParser';

// To:
import { PdfParser } from '/static/js/libs/pdf-to-markdown/src/PdfParser.js';
import { MarkdownConverter } from '/static/js/libs/pdf-to-markdown/src/convert/MarkdownConverter.js';
import { parse } from '/static/js/libs/pdf-to-markdown/src/parse.js';
import { convert } from '/static/js/libs/pdf-to-markdown/src/convert.js';
import { PdfPipeline } from '/static/js/libs/pdf-to-markdown/src/PdfPipeline.js';
import { Debugger as PdfDebugger } from '/static/js/libs/pdf-to-markdown/src/Debugger.js';
import { Config } from '/static/js/libs/pdf-to-markdown/src/Config.js';


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
    const config = new Config({ ...DEFAULT_OPTIONS, ...options });
    
    // Validate input
    if (!pdfBuffer) {
      throw new Error('PDF buffer is required');
    }
    
    if (config.debug) {
      console.log('Starting PDF to Markdown conversion...');
      console.log('Options:', config);
    }
    
    const startTime = Date.now();
    
    // Initialize parser and pipeline
    const parser = new PdfParser();
    const pipeline = new PdfPipeline(config);
    
    // Parse the PDF document
    const parseResult = await parse(pdfBuffer, config);
    
    if (config.debug) {
      console.log(`PDF parsed successfully. Pages: ${parseResult.pages.length}`);
    }
    
    // Convert to Markdown using the pipeline
    const markdownResult = await convert(parseResult, config);
    
    if (config.debug) {
      console.log('Conversion completed successfully');
      console.log(`Generated ${markdownResult.length} characters of markdown`);
    }
    
    // Prepare result object
    const result = {
      markdown: markdownResult,
      metadata: {
        title: parseResult.metadata?.title || 'Untitled Document',
        author: parseResult.metadata?.author || 'Unknown',
        subject: parseResult.metadata?.subject || '',
        creator: parseResult.metadata?.creator || '',
        producer: parseResult.metadata?.producer || '',
        creationDate: parseResult.metadata?.creationDate || null,
        modificationDate: parseResult.metadata?.modificationDate || null,
        pageCount: parseResult.pages.length,
        wordCount: markdownResult.split(/\s+/).length,
        characterCount: markdownResult.length,
        processingTime: Date.now() - startTime
      },
      structure: {
        headers: parseResult.headers || [],
        lists: parseResult.lists || [],
        tables: parseResult.tables || [],
        images: parseResult.images || [],
        links: parseResult.links || []
      },
      warnings: parseResult.warnings || []
    };
    
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
    const parseResult = await parse(pdfBuffer, new Config({ debug: false }));
    
    // Rough estimation: 100ms per page + 500ms base processing
    const estimatedTime = (parseResult.pages.length * 100) + 500;
    
    return estimatedTime;
  } catch (error) {
    return 1000; // Default estimate if parsing fails
  }
}

// Export default options for external use
export { DEFAULT_OPTIONS };

/**
 * Utility function to get detailed debug information during conversion
 * 
 * @param {ArrayBuffer|Buffer} pdfBuffer - PDF buffer
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Debug information and conversion result
 */
export async function convertPdfWithDebug(pdfBuffer, options = {}) {
  try {
    const config = new Config({ ...DEFAULT_OPTIONS, ...options, debug: true });
    const pdfDebugger = new PdfDebugger(config); // Fixed: renamed variable to avoid reserved keyword
    
    // Parse with debug tracking
    const parseResult = await parse(pdfBuffer, config);
    
    // Convert with debug information
    const markdownResult = await convert(parseResult, config);
    
    // Get debug stages information
    const debugInfo = {
      stages: pdfDebugger.getStageResults(),
      transformations: pdfDebugger.getTransformationResults(),
      statistics: pdfDebugger.getStatistics(),
      performance: pdfDebugger.getPerformanceMetrics()
    };
    
    return {
      markdown: markdownResult,
      debug: debugInfo,
      parseResult: parseResult
    };
    
  } catch (error) {
    throw new Error(`Debug conversion failed: ${error.message}`);
  }
}

/**
 * Utility function to get transformation pipeline stages
 * 
 * @returns {Array<string>} Available transformation stages
 */
export function getTransformationStages() {
  return [
    'unwrapCoordinates',
    'adjustHeights', 
    'calculateStatistics',
    'compactLines',
    'detectBlocks',
    'detectCodeBlocks',
    'detectFontStyles',
    'detectFootnotes',
    'detectHeaders',
    'detectLinks',
    'detectListItems',
    'detectListLevels',
    'detectTOC',
    'removeEmptyItems',
    'removeRepetitiveItems',
    'sortbyX'
  ];
}

// Export version information
export const VERSION = '1.0.0';
export const SUPPORTED_FORMATS = ['pdf'];
export const OUTPUT_FORMATS = ['markdown', 'md'];

// Adapter function to match the expected interface in upload.js
export async function convertWithPdfToMarkdown(file, metadata) {
  try {
    // Convert File object to ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Call the main conversion function
    const result = await convertPdfToMarkdown(buffer, {
      debug: false,
      verbose: false,
      ...metadata
    });
    
    return result;
    
  } catch (error) {
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
}