"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.PARSE_SCHEMA = void 0;
var Item_1 = require("./Item");
var Metadata_1 = require("./Metadata");
var ParseResult_1 = require("./ParseResult");
exports.PARSE_SCHEMA = ['transform', 'width', 'height', 'str', 'fontName', 'dir'];
/**
 * Parses a PDF via PDFJS and returns a ParseResult which contains more or less the original data from PDFJS.
 */
var PdfParser = /** @class */ (function () {
    function PdfParser(pdfjs, defaultParams) {
        if (defaultParams === void 0) { defaultParams = {}; }
        this.schema = exports.PARSE_SCHEMA;
        this.pdfjs = pdfjs;
        this.defaultParams = defaultParams;
    }
    PdfParser.prototype.parse = function (src, reporter) {
        return __awaiter(this, void 0, void 0, function () {
            var documentInitParameters;
            var _this = this;
            return __generator(this, function (_a) {
                documentInitParameters = __assign(__assign({}, this.defaultParams), this.documentInitParameters(src));
                return [2 /*return*/, this.pdfjs
                        .getDocument(documentInitParameters)
                        .promise.then(function (pdfjsDocument) {
                        reporter.parsedDocumentHeader(pdfjsDocument.numPages);
                        return Promise.all([
                            pdfjsDocument,
                            pdfjsDocument.getMetadata().then(function (pdfjsMetadata) {
                                reporter.parsedMetadata();
                                return new Metadata_1["default"](pdfjsMetadata);
                            }),
                            _this.extractPagesSequentially(pdfjsDocument, reporter),
                        ]);
                    })
                        .then(function (_a) {
                        var pdfjsDocument = _a[0], metadata = _a[1], pages = _a[2];
                        return Promise.all([
                            pdfjsDocument,
                            metadata,
                            pages,
                            _this.gatherFontObjects(pages)["finally"](function () { return reporter.parsedFonts(); }),
                        ]);
                    })
                        .then(function (_a) {
                        var pdfjsDocument = _a[0], metadata = _a[1], pages = _a[2], fontMap = _a[3];
                        var pdfjsPages = pages.map(function (page) { return page.pdfjsPage; });
                        var items = pages.reduce(function (allItems, page) { return allItems.concat(page.items); }, []);
                        var pageViewports = pdfjsPages.map(function (page) {
                            var viewPort = page.getViewport({ scale: 1.0 });
                            return {
                                transformFunction: function (itemTransform) {
                                    return _this.pdfjs.Util.transform(viewPort.transform, itemTransform);
                                }
                            };
                        });
                        return new ParseResult_1["default"](fontMap, pdfjsDocument.numPages, pdfjsPages, pageViewports, metadata, _this.schema, items);
                    })];
            });
        });
    };
    PdfParser.prototype.extractPagesSequentially = function (pdfjsDocument, reporter) {
        return __spreadArray([], Array(pdfjsDocument.numPages), true).reduce(function (accumulatorPromise, _, index) {
            return accumulatorPromise.then(function (accumulatedResults) {
                return pdfjsDocument.getPage(index + 1).then(function (pdfjsPage) {
                    return pdfjsPage
                        .getTextContent({
                        normalizeWhitespace: false,
                        disableCombineTextItems: true
                    })
                        .then(function (textContent) {
                        var items = textContent.items.map(function (pdfjsItem) { return new Item_1["default"](index, pdfjsItem); });
                        reporter.parsedPage(index);
                        return __spreadArray(__spreadArray([], accumulatedResults, true), [{ index: index, pdfjsPage: pdfjsPage, items: items }], false);
                    });
                });
            });
        }, Promise.resolve([]));
    };
    PdfParser.prototype.gatherFontObjects = function (pages) {
        var uniqueFontIds = new Set();
        return pages.reduce(function (promise, page) {
            var unknownPageFonts = page.items.reduce(function (unknowns, item) {
                var fontId = item.data['fontName'];
                if (!uniqueFontIds.has(fontId) && fontId.startsWith('g_d')) {
                    uniqueFontIds.add(fontId);
                    unknowns.push(fontId);
                }
                return unknowns;
            }, []);
            if (unknownPageFonts.length > 0) {
                // console.log(`Fetch fonts ${unknownPageFonts} for page ${page.index}`);
                promise = promise.then(function (fontMap) {
                    return page.pdfjsPage.getOperatorList().then(function () {
                        unknownPageFonts.forEach(function (fontId) {
                            var fontObject = page.pdfjsPage.commonObjs.get(fontId);
                            fontMap.set(fontId, fontObject);
                        });
                        return fontMap;
                    });
                });
            }
            return promise;
        }, Promise.resolve(new Map()));
    };
    PdfParser.prototype.documentInitParameters = function (src) {
        if (typeof src === 'string') {
            return { url: src };
        }
        if (this.isArrayBuffer(src)) {
            return { data: src };
        }
        if (typeof src === 'object') {
            return src;
        }
        throw new Error('Invalid PDFjs parameter for getDocument. Need either Uint8Array, string or a parameter object');
    };
    PdfParser.prototype.isArrayBuffer = function (object) {
        return typeof object === 'object' && object !== null && object.byteLength !== undefined;
    };
    return PdfParser;
}());
exports["default"] = PdfParser;
