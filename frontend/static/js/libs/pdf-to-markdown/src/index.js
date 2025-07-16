"use strict";
exports.__esModule = true;
exports.createPipeline = exports.parseReporter = exports.transformers = void 0;
var ParseProgressReporter_1 = require("./ParseProgressReporter");
var PdfParser_1 = require("./PdfParser");
var PdfPipeline_1 = require("./PdfPipeline");
var AdjustHeight_1 = require("./transformer/AdjustHeight");
var UnwrapCoordinates_1 = require("./transformer/UnwrapCoordinates");
var RemoveEmptyItems_1 = require("./transformer/RemoveEmptyItems");
var CacluclateStatistics_1 = require("./transformer/CacluclateStatistics");
var CompactLines_1 = require("./transformer/CompactLines");
var SortXWithinLines_1 = require("./transformer/SortXWithinLines");
var RemoveRepetitiveItems_1 = require("./transformer/RemoveRepetitiveItems");
var DetectToc_1 = require("./transformer/DetectToc");
var DetectHeaders_1 = require("./transformer/DetectHeaders");
var NoOpTransformer_1 = require("./transformer/NoOpTransformer");
var DetectListItems_1 = require("./transformer/DetectListItems");
var DetectBlocks_1 = require("./transformer/DetectBlocks");
var DetectListLevels_1 = require("./transformer/DetectListLevels");
var DetectFootnotes_1 = require("./transformer/DetectFootnotes");
var DetectFontStyles_1 = require("./transformer/DetectFontStyles");
var DetectLinks_1 = require("./transformer/DetectLinks");
var DetectCodeQuoteBlocks_1 = require("./transformer/DetectCodeQuoteBlocks");
exports.transformers = [
    new AdjustHeight_1["default"](),
    new UnwrapCoordinates_1["default"](),
    new RemoveEmptyItems_1["default"](),
    new CacluclateStatistics_1["default"](),
    new CompactLines_1["default"](),
    new SortXWithinLines_1["default"](),
    new RemoveRepetitiveItems_1["default"](),
    new DetectFootnotes_1["default"](),
    new DetectFontStyles_1["default"](),
    new DetectLinks_1["default"](),
    new DetectToc_1["default"](),
    new DetectHeaders_1["default"](),
    new DetectListItems_1["default"](),
    new DetectBlocks_1["default"](),
    new DetectCodeQuoteBlocks_1["default"](),
    new DetectListLevels_1["default"](),
    new NoOpTransformer_1["default"](),
];
function parseReporter(progressListener) {
    return new ParseProgressReporter_1["default"](progressListener);
}
exports.parseReporter = parseReporter;
function createPipeline(pdfJs, options) {
    var _a;
    if (options === void 0) { options = {}; }
    var parser = new PdfParser_1["default"](pdfJs);
    return new PdfPipeline_1["default"](parser, ((_a = options.transformConfig) === null || _a === void 0 ? void 0 : _a.transformers) || exports.transformers);
}
exports.createPipeline = createPipeline;
