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
exports.minXFromPageItems = void 0;
var ItemTransformer_1 = require("./ItemTransformer");
var LineItemMerger_1 = require("../debug/LineItemMerger");
var groupingUtils_1 = require("../support/groupingUtils");
var CacluclateStatistics_1 = require("./CacluclateStatistics");
var functional_1 = require("../support/functional");
var text_types_1 = require("../text-types");
var assert_1 = require("../assert");
var DetectBlocks = /** @class */ (function (_super) {
    __extends(DetectBlocks, _super);
    function DetectBlocks() {
        return _super.call(this, 'Detect Blocks', 'Like paragraphs, a list, etc...', {
            requireColumns: ['str', 'x', 'y'],
            debug: {
                showAll: false,
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }, function (incomingSchema) {
            return incomingSchema.reduce(function (schema, column) {
                if (column === 'line') {
                    return __spreadArray(__spreadArray([], schema, true), ['block', 'line'], false);
                }
                return __spreadArray(__spreadArray([], schema, true), [column], false);
            }, new Array());
        }) || this;
    }
    DetectBlocks.prototype.transform = function (context, inputItems) {
        var mostUsedDistance = context.getGlobal(CacluclateStatistics_1.MOST_USED_DISTANCE);
        var createdBlocks = 0;
        var lineItemCount = 0;
        var blocks = [];
        var currentBlock = new Block();
        (0, groupingUtils_1.groupByPage)(inputItems).forEach(function (pageItems) {
            var flushStashedItems = function () {
                if (currentBlock.entries.size > 0) {
                    blocks.push(currentBlock);
                    currentBlock = new Block();
                    createdBlocks++;
                }
            };
            var minX = minXFromPageItems(pageItems);
            (0, groupingUtils_1.groupByLine)(pageItems).forEach(function (lineItems) {
                lineItemCount++;
                if (currentBlock.entries.size > 0 && shouldFlushBlock(currentBlock, lineItems, minX, mostUsedDistance)) {
                    flushStashedItems();
                }
                currentBlock.addLine(lineItems);
            });
            if (currentBlock.entries.size > 0) {
                flushStashedItems();
            }
        });
        return {
            items: inputItems.map(function (item) {
                for (var i = 0; i < blocks.length; i++) {
                    var isInBlock = blocks[i].entries.has(item.uuid);
                    if (isInBlock) {
                        return item.withDataAddition({ block: i });
                    }
                }
                throw new Error('Item not in any block');
            }),
            messages: ['Gathered ' + createdBlocks + ' blocks out of ' + lineItemCount + ' line items']
        };
    };
    return DetectBlocks;
}(ItemTransformer_1["default"]));
exports["default"] = DetectBlocks;
function minXFromPageItems(items) {
    var minX = 999;
    items.forEach(function (item) {
        minX = Math.min(minX, item.data['x']);
    });
    if (minX == 999) {
        return null;
    }
    return minX;
}
exports.minXFromPageItems = minXFromPageItems;
function shouldFlushBlock(stashedBlock, lineItems, minX, mostUsedDistance) {
    var lineType = toLineType(lineItems);
    if (stashedBlock.type && (0, text_types_1.mergeFollowingNonTypedItems)(stashedBlock.type) && !lineType) {
        return false;
    }
    var hasBigDistance = bigDistance(stashedBlock, lineItems, minX, mostUsedDistance);
    if (stashedBlock.type &&
        (0, text_types_1.mergeFollowingNonTypedItemsWithSmallDistance)(stashedBlock.type) &&
        !lineType &&
        !hasBigDistance) {
        return false;
    }
    if ((0, text_types_1.toBlockType)(lineType) !== (0, text_types_1.toBlockType)(stashedBlock.type)) {
        return true;
    }
    if (lineType) {
        return !(0, text_types_1.mergeToBlock)(lineType);
    }
    else {
        return hasBigDistance;
    }
}
function bigDistance(block, lineItems, minX, mostUsedDistance) {
    var lineX = Math.min.apply(Math, lineItems.map(function (item) { return item.data['x']; }));
    var lineY = Math.min.apply(Math, lineItems.map(function (item) { return item.data['y']; }));
    var distance = block.minY - lineY;
    if (distance < 0 - mostUsedDistance / 2) {
        //distance is negative - and not only a bit
        return true;
    }
    var allowedDisctance = mostUsedDistance + 1;
    if (block.minX > minX && lineX > minX) {
        //intended elements like lists often have greater spacing
        allowedDisctance = mostUsedDistance + mostUsedDistance / 2;
    }
    if (distance > allowedDisctance) {
        return true;
    }
    return false;
}
function toLineType(lineItems) {
    var types = (0, functional_1.flatten)(lineItems.map(function (item) { return item.data['types'] || []; })).filter(groupingUtils_1.onlyUniques);
    if (types.length > 1) {
        throw "more than 1 type: ".concat(types);
    }
    return types.length == 1 ? types[0] : null;
}
var Block = /** @class */ (function () {
    function Block() {
        this.type = null;
        this.entries = new Set();
    }
    Block.prototype.addLine = function (items) {
        var _this = this;
        var lineType = toLineType(items);
        if (this.type) {
            (0, assert_1.assert)(!lineType || (0, text_types_1.toBlockType)(lineType) === this.type, "Adding line of type ".concat(lineType, " to block of type ").concat(this.type));
        }
        else {
            this.type = (0, text_types_1.toBlockType)(lineType);
        }
        this.minX = (0, groupingUtils_1.min)(items.map(function (item) { return item.data['x']; }), this.minX);
        this.minY = (0, groupingUtils_1.min)(items.map(function (item) { return item.data['y']; }), this.minY);
        items.forEach(function (item) { return _this.entries.add(item.uuid); });
    };
    return Block;
}());
