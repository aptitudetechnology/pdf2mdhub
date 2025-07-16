"use strict";
exports.__esModule = true;
exports.parser = void 0;
var PdfParser_1 = require("./PdfParser");
var defaultConfig = {
    pdfjsParams: {
        // TODO check if that cmap thing makes sense since we don't bundle them
        cMapUrl: 'cmaps/',
        cMapPacked: true
    }
};
function parser(pdfJs, options) {
    if (options === void 0) { options = defaultConfig; }
    return new PdfParser_1["default"](pdfJs, options.pdfjsParams);
}
exports.parser = parser;
