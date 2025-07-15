// util/pdf.js - Refactored to ES Module Syntax

// 1. Change require() for external libraries to import
//    Note: 'unpdf' is likely an NPM package. For browser usage, you'd typically need
//    to install it via npm/yarn and then use a bundler (Webpack, Rollup, Parcel)
//    to make it browser-compatible. If 'unpdf' provides a browser-ready build
//    that exposes these globally, then you might not need an import here, but that's less ideal.
//    Assuming you'll use a bundler or 'unpdf' has a direct ES module export.
import { getDocumentProxy, getResolvedPDFJS } from 'unpdf';

// 2. Change require() for internal project modules to import with .js extension
import { findPageNumbers, findFirstPage, removePageNumber } from '../../lib/util/page-number-functions.js';
import TextItem from '../models/TextItem.js'; // Assuming TextItem is a default export
import Page from '../models/Page.js'; // Assuming Page is a default export

const NO_OP = () => { };

/**
 * Reads a PDF document and parses its content.
 * @param {string|TypedArray|DocumentInitParameters|PDFDataRangeTransport} pdfBuffer
 * Passed to `pdfjs.getDocument()` to read a PDF document for parsing
 *
 * @param {Object} [callbacks]
 * Optional. A collection of callbacks to invoke when
 * elements within the PDF document are parsed
 * @param {Function} [callbacks.metadataParsed]
 * @param {Function} [callbacks.pageParsed]
 * @param {Function} [callbacks.fontParsed]
 * @param {Function} [callbacks.documentParsed]
 *
 * @returns {Promise<Object>} An object containing parsed fonts, metadata, pages, and the pdfDocument.
 */
// 3. Change exports.parse to export async function parse (named export)
export async function parse(pdfBuffer, callbacks) {
  const { metadataParsed, pageParsed, fontParsed, documentParsed } = {
    metadataParsed: NO_OP,
    pageParsed: NO_OP,
    fontParsed: NO_OP,
    documentParsed: NO_OP,
    ...(callbacks || {}),
  };

  const pdfDocument = await getDocumentProxy(new Uint8Array(pdfBuffer), {
    verbosity: 0,
  });

  const metadata = await pdfDocument.getMetadata();
  metadataParsed(metadata);

  const pages = [...Array(pdfDocument.numPages).keys()].map(
    index => new Page({ index })
  );

  documentParsed(pdfDocument, pages);

  const fonts = {
    ids: new Set(),
    map: new Map(),
  };

  let pageIndexNumMap = {};
  let firstPage;
  for (let j = 1; j <= pdfDocument.numPages; j++) {
    const page = await pdfDocument.getPage(j);
    const textContent = await page.getTextContent();

    if (Object.keys(pageIndexNumMap).length < 10) {
      pageIndexNumMap = findPageNumbers(pageIndexNumMap, page.pageNumber - 1, textContent.items);
    } else {
      firstPage = findFirstPage(pageIndexNumMap);
      break;
    }
  }

  let pageNum = firstPage ? firstPage.pageNum : 0;
  for (let j = 1; j <= pdfDocument.numPages; j++) {
    const page = await pdfDocument.getPage(j);

    // Trigger the font retrieval for the page
    await page.getOperatorList();

    const scale = 1.0;
    const viewport = page.getViewport({ scale });
    let textContent = await page.getTextContent();
    if (firstPage && page.pageIndex >= firstPage.pageIndex) {
      textContent = removePageNumber(textContent, pageNum);
      pageNum++;
    }
    const pdfjs = await getResolvedPDFJS(); // This line assumes pdfjs is available or part of unpdf
    const textItems = textContent.items.map(item => {
      const tx = pdfjs.Util.transform(
        viewport.transform,
        item.transform
      );

      const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
      const dividedHeight = item.height / fontHeight;
      return new TextItem({
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
        height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
        text: item.str,
        font: item.fontName,
      });
    });
    pages[page.pageNumber - 1].items = textItems;
    pageParsed(pages);

    const fontIds = new Set(textItems.map(t => t.font));
    for (const fontId of fontIds) {
      if (!fonts.ids.has(fontId) && fontId.startsWith('g_d')) {
        // Depending on which build of pdfjs-dist is used, the
        // WorkerTransport containing the font objects is either transport or _transport
        const transport = pdfDocument.transport || pdfDocument._transport; // eslint-disable-line no-underscore-dangle
        const font = await new Promise(
          resolve => transport.commonObjs.get(fontId, resolve)
        );
        fonts.ids.add(fontId);
        fonts.map.set(fontId, font);
        fontParsed(fonts);
      }
    }
  }
  return {
    fonts,
    metadata,
    pages,
    pdfDocument,
  };
}
