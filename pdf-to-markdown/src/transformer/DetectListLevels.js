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
var text_types_1 = require("../text-types");
var stringFunctions_1 = require("../support/stringFunctions");
var DetectListLevels = /** @class */ (function (_super) {
    __extends(DetectListLevels, _super);
    function DetectListLevels() {
        return _super.call(this, 'Detect List Levels', 'Figure out the nesting levels of each list item', {
            requireColumns: ['str', 'block', 'x'],
            debug: {
                // showAll: true,
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }) || this;
    }
    // TODO instead of changing the 'str' we should annotate the item and let the converters do their thing
    DetectListLevels.prototype.transform = function (context, inputItems) {
        var listBlocks = 0;
        var modifiedBlocks = 0;
        (0, groupingUtils_1.groupByBlock)(inputItems)
            .filter(function (blockItems) {
            var types = blockItems[0].data['types'] || [];
            return types.map(text_types_1.toBlockType).includes('LIST');
        })
            .forEach(function (blockItems) {
            var lastItemX;
            var currentLevel = 0;
            var xByLevel = {};
            var modifiedBlock = false;
            var isOverflowLine = false;
            (0, groupingUtils_1.groupByLine)(blockItems).forEach(function (lineItems) {
                var firstItem = lineItems[0];
                var isLineItem = (0, stringFunctions_1.isListItem)(firstItem.data['str'] + ' ...') || (0, stringFunctions_1.isNumberedListItem)(firstItem.data['str'] + ' ...');
                var x = firstItem.data['x'];
                if (lastItemX) {
                    if (isLineItem) {
                        if ((0, groupingUtils_1.isGreaterWithTolerance)(x, lastItemX)) {
                            currentLevel++;
                            xByLevel[x] = currentLevel;
                        }
                        else if (x < lastItemX) {
                            currentLevel = xByLevel[x];
                        }
                    }
                    else {
                        // current level remains the seame
                        isOverflowLine = true;
                    }
                }
                else {
                    xByLevel[x] = 0;
                }
                if (currentLevel > 0) {
                    lineItems[0].listLevel = currentLevel;
                    modifiedBlock = true;
                    if (isOverflowLine) {
                        // TODO mark line so it can be indented as well ?
                    }
                }
                if (!isOverflowLine) {
                    lastItemX = x;
                }
                isOverflowLine = false;
            });
            listBlocks++;
            if (modifiedBlock) {
                modifiedBlocks++;
            }
        });
        return {
            items: inputItems.map(function (item) {
                return item;
            }),
            messages: ['Modified ' + modifiedBlocks + ' / ' + listBlocks + ' list blocks.']
        };
    };
    return DetectListLevels;
}(ItemTransformer_1["default"]));
exports["default"] = DetectListLevels;
