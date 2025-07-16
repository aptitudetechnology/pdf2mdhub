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
exports.itemWithType = void 0;
var ItemTransformer_1 = require("./ItemTransformer");
var LineItemMerger_1 = require("../debug/LineItemMerger");
var CacluclateStatistics_1 = require("./CacluclateStatistics");
var groupingUtils_1 = require("../support/groupingUtils");
var stringFunctions_1 = require("../support/stringFunctions");
var DetectCodeQuoteBlocks = /** @class */ (function (_super) {
    __extends(DetectCodeQuoteBlocks, _super);
    function DetectCodeQuoteBlocks() {
        return _super.call(this, 'Detect Code Blocks', 'Find blocks of text which look like they could be code/quote blocks', {
            requireColumns: ['str', 'block'],
            debug: {
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }) || this;
    }
    DetectCodeQuoteBlocks.prototype.transform = function (context, inputItems) {
        var mostUsedHeight = context.getGlobal(CacluclateStatistics_1.MOST_USED_HEIGHT);
        var codeBlockItems = new Set();
        var foundCodeItems = 0;
        (0, groupingUtils_1.groupByPage)(inputItems).forEach(function (pageItems) {
            var minX = toMinX(pageItems);
            (0, groupingUtils_1.groupByBlock)(pageItems).forEach(function (blockItems) {
                if (!blockItems[0].data['types'] && looksLikeCodeBlock(minX, blockItems, mostUsedHeight)) {
                    foundCodeItems++;
                    blockItems.forEach(function (item) { return codeBlockItems.add(item.uuid); });
                }
            });
        });
        return {
            items: inputItems.map(function (item) {
                if (codeBlockItems.has(item.uuid)) {
                    return itemWithType(item, 'CODE');
                }
                return item;
            }),
            messages: ["Found ".concat(foundCodeItems, " code blocks.")]
        };
    };
    return DetectCodeQuoteBlocks;
}(ItemTransformer_1["default"]));
exports["default"] = DetectCodeQuoteBlocks;
function itemWithType(item, type) {
    var existingTypes = item.data['types'] || [];
    return item.withDataAddition({ types: __spreadArray(__spreadArray([], existingTypes, true), [type], false).filter(groupingUtils_1.onlyUniques) });
}
exports.itemWithType = itemWithType;
function toMinX(items) {
    var minX = 999;
    items.forEach(function (item) {
        minX = Math.min(minX, item.data['x']);
    });
    if (minX == 999) {
        return null;
    }
    return minX;
}
function looksLikeCodeBlock(minX, items, mostUsedHeight) {
    if (items.length == 0) {
        return false;
    }
    var xIsRelevant = function (x) {
        return x > minX + 1;
    };
    if (items.length == 1) {
        return xIsRelevant(items[0].data['x']) && items[0].data['height'] <= mostUsedHeight + 1;
    }
    var lineItems = (0, groupingUtils_1.groupByLine)(items);
    for (var index = 0; index < lineItems.length; index++) {
        var lineX = lineItems[index][0].data['x'];
        if (!xIsRelevant(lineX)) {
            return false;
        }
        var firstText = lineItems[index][0].data['str'];
        if ((0, stringFunctions_1.isListItemCharacter)(firstText) || (0, stringFunctions_1.isNumberedListItem)(firstText)) {
            return false;
        }
    }
    return true;
}
