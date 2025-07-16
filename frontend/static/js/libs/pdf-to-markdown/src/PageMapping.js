"use strict";
exports.__esModule = true;
/**
 * Holds the information which (zero based) page index maps to a page number.
 */
var PageMapping = /** @class */ (function () {
    function PageMapping(pageFactor, detectedOnPage) {
        if (pageFactor === void 0) { pageFactor = 1; }
        if (detectedOnPage === void 0) { detectedOnPage = false; }
        this.pageFactor = pageFactor;
        this.detectedOnPage = detectedOnPage;
    }
    /**
     * Translates a given page index to a page number label as printed on the page. E.g [0,1,2,3,4] could become [I, II, 1, 2].
     * @param pageIndex
     */
    PageMapping.prototype.pageLabel = function (pageIndex) {
        var pageNumber = pageIndex + this.pageFactor;
        if (pageNumber < 1) {
            return romanize(Math.abs(pageNumber - this.pageFactor) + 1);
        }
        return "".concat(pageNumber);
    };
    PageMapping.prototype.shifted = function () {
        return this.pageFactor != 1;
    };
    return PageMapping;
}());
exports["default"] = PageMapping;
function romanize(num) {
    var lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }, roman = '', i;
    for (i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}
