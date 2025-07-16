"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var ItemTransformer_1 = require("./ItemTransformer");
var LineItemMerger_1 = require("../debug/LineItemMerger");
var groupingUtils_1 = require("../support/groupingUtils");
/**
 * We can't trust order of occurence, esp. footnote links like to come last
 */
var SortXWithinLines = /** @class */ (function (_super) {
    __extends(SortXWithinLines, _super);
    function SortXWithinLines() {
        return _super.call(this, 'Sort by X', 'Sorts the items of a line by the x coordinate', {
            requireColumns: ['line', 'x'],
            debug: {
                itemMerger: new LineItemMerger_1["default"]()
            }
        }) || this;
    }
    SortXWithinLines.prototype.transform = function (_, inputItems) {
        return {
            items: (0, groupingUtils_1.transformGroupedByPageAndLine)(inputItems, function (_, __, items) {
                return items.sort(function (a, b) { return a.data['x'] - b.data['x']; });
            }),
            messages: []
        };
    };
    return SortXWithinLines;
}(ItemTransformer_1["default"]));
exports["default"] = SortXWithinLines;
