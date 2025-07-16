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
var ItemTransformer_1 = require("./ItemTransformer");
var LineItemMerger_1 = require("../debug/LineItemMerger");
var groupingUtils_1 = require("../support/groupingUtils");
var CompactLines = /** @class */ (function (_super) {
    __extends(CompactLines, _super);
    function CompactLines() {
        return _super.call(this, 'Compact Lines', 'Combines items on the same y-axis', {
            requireColumns: ['str', 'y', 'height'],
            debug: {
                itemMerger: new LineItemMerger_1["default"](true)
            }
        }, function (incomingSchema) {
            return incomingSchema.reduce(function (schema, column) {
                if (column === 'x') {
                    return __spreadArray(__spreadArray([], schema, true), ['line', 'x'], false);
                }
                return __spreadArray(__spreadArray([], schema, true), [column], false);
            }, new Array());
        }) || this;
    }
    CompactLines.prototype.transform = function (_, inputItems) {
        var lines = 0;
        return {
            items: (0, groupingUtils_1.transformGroupedByPage)(inputItems, function (_, pageItems) {
                var lineNumber = -1;
                var lastY;
                return pageItems.map(function (item) {
                    var y = item.data['y'];
                    var height = item.data['height'];
                    if (!lastY || Math.abs(lastY - y) > (height / 6) * 4) {
                        lineNumber++;
                        lines++;
                    }
                    lastY = y;
                    return item.withDataAddition({ line: lineNumber });
                });
            }),
            messages: ["Formed ".concat(lines, " lines out of ").concat(inputItems.length, " items")]
        };
    };
    return CompactLines;
}(ItemTransformer_1["default"]));
exports["default"] = CompactLines;
