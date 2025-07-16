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
var stringFunctions_1 = require("../support/stringFunctions");
var DetectFootnotes = /** @class */ (function (_super) {
    __extends(DetectFootnotes, _super);
    function DetectFootnotes() {
        return _super.call(this, 'Detect Footnotes', 'Detect footnotes in text and link them to the references', {
            requireColumns: ['str', 'y'],
            debug: {
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }, function (incomingSchema) {
            return incomingSchema.reduce(function (schema, column) {
                if (column === 'x') {
                    return __spreadArray(__spreadArray([], schema, true), ['token types', 'x'], false);
                }
                return __spreadArray(__spreadArray([], schema, true), [column], false);
            }, new Array());
        }) || this;
    }
    DetectFootnotes.prototype.transform = function (context, inputItems) {
        var stash = [];
        var footnoteLinks = new Set();
        var footnotes = new Set();
        (0, groupingUtils_1.groupByLine)(inputItems).forEach(function (lineItems) {
            var firstY = lineItems[0].data['y'];
            lineItems.forEach(function (item, lineIndex) {
                var itemText = item.data['str'].trim();
                var itemY = item.data['y'];
                if ((0, stringFunctions_1.isNumber)(itemText)) {
                    if (hasPreceedingText(lineItems, lineIndex) && itemY > firstY) {
                        footnoteLinks.add(item.uuid);
                    }
                    else if (isFollowedByText(lineItems, lineIndex)) {
                        footnotes.add(item.uuid);
                    }
                    stash.push(item);
                }
            });
        });
        return {
            items: inputItems.map(function (item) {
                if (footnoteLinks.has(item.uuid)) {
                    return item.withTokenType('FOOTNOTE_LINK');
                }
                if (footnotes.has(item.uuid)) {
                    return item.withTokenType('FOOTNOTE');
                }
                return item;
            }),
            messages: ["Detected ".concat(footnoteLinks.size, "/").concat(footnotes.size, " footnotes.")]
        };
    };
    return DetectFootnotes;
}(ItemTransformer_1["default"]));
exports["default"] = DetectFootnotes;
function hasPreceedingText(lineItems, lineIndex) {
    for (var index = lineIndex - 1; index >= 0; index--) {
        var itemText = lineItems[index].data['str'].trim();
        if (!(0, stringFunctions_1.isNumber)(itemText)) {
            return true;
        }
    }
    return false;
}
function isFollowedByText(lineItems, lineIndex) {
    for (var index = lineIndex + 1; index < lineItems.length; index++) {
        var itemText = lineItems[index].data['str'].trim();
        if (!(0, stringFunctions_1.isNumber)(itemText)) {
            return true;
        }
    }
    return false;
}
