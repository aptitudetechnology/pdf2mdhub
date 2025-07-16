import PdfParser from '/static/js/libs/pdf-to-markdown/src/PdfParser.js';
import MarkdownConverter from '/static/js/libs/pdf-to-markdown/src/convert/MarkdownConverter.js';

import { parser } from '/static/js/libs/pdf-to-markdown/src/parse.js';

import * as convert from '/static/js/libs/pdf-to-markdown/src/convert.js';

import PdfPipeline from '/static/js/libs/pdf-to-markdown/src/PdfPipeline.js';

import PdfDebugger from '/static/js/libs/pdf-to-markdown/src/Debugger.js';

window.MarkdownConverter = MarkdownConverter;
window.PdfParser = parser;
window.PdfPipeline = PdfPipeline;
window.PdfDebugger = PdfDebugger;
window.convert = convert;

