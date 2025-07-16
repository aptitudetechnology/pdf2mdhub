"use strict";
exports.__esModule = true;
/**
 * Table of contents usually parsed by  `DetectToc.ts`.
 */
var TOC = /** @class */ (function () {
    function TOC(tocHeadlineItems, pages, detectedHeadlineLevels) {
        this.tocHeadlineItems = tocHeadlineItems;
        this.pages = pages;
        this.detectedHeadlineLevels = detectedHeadlineLevels;
    }
    TOC.prototype.startPage = function () {
        return Math.min.apply(Math, this.pages);
    };
    TOC.prototype.endPage = function () {
        return Math.max.apply(Math, this.pages);
    };
    return TOC;
}());
exports["default"] = TOC;
