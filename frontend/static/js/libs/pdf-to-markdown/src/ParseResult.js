"use strict";
exports.__esModule = true;
var ParseResult = /** @class */ (function () {
    function ParseResult(fontMap, pageCount, pdfjsPages, pageViewports, metadata, schema, items) {
        this.fontMap = fontMap;
        this.pageCount = pageCount;
        this.pdfjsPages = pdfjsPages;
        this.pageViewports = pageViewports;
        this.metadata = metadata;
        this.schema = schema;
        this.items = items;
    }
    return ParseResult;
}());
exports["default"] = ParseResult;
