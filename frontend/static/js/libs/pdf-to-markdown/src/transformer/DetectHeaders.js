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
var CacluclateStatistics_1 = require("./CacluclateStatistics");
var DetectToc_1 = require("./DetectToc");
var functional_1 = require("../support/functional");
var items_1 = require("../support/items");
var text_types_1 = require("../text-types");
var config = {
    // How much taller a text must be to be a headline (relative to mostUsedHeight)
    minHeadlineDistance: 1.3
};
var DetectHeaders = /** @class */ (function (_super) {
    __extends(DetectHeaders, _super);
    function DetectHeaders() {
        return _super.call(this, 'Detect Headers', 'Detect Headers from Level 1 to 6', {
            requireColumns: ['str', 'y', 'height', 'line', 'fontName'],
            debug: {
                // showAll: true,
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }) || this;
    }
    DetectHeaders.prototype.transform = function (context, inputItems) {
        var maxHeight = context.getGlobal(CacluclateStatistics_1.MAX_HEIGHT);
        var mostUsedHeight = context.getGlobal(CacluclateStatistics_1.MOST_USED_HEIGHT);
        // const mostUsedDistance = context.getGlobal(MOST_USED_DISTANCE);
        // const mostUsedFont = context.getGlobal(MOST_USED_FONT);
        var toc = context.getGlobalOptionally(DetectToc_1.TOC_GLOBAL);
        var headlineTypeToHeightRange = context.getGlobalOptionally(DetectToc_1.HEADLINE_TYPE_TO_HEIGHT_RANGE);
        var itemsByLine = (0, groupingUtils_1.groupByLine)(inputItems);
        var itemToLevel = new Map();
        // TODO move the seperate parts to different transformations (easier debuggable/testable)
        // Handle title pages: Title pages often have multiple lines of extraordinary height.
        // Starting the leveling here would already consume most of the available headline levels.
        // Thus we handle those pages seperatly and make the biggest lines #1 and all others #2.
        var maxTitlePage = toc ? toc.startPage() : Math.min(5, context.pageCount - 3);
        var detectedHeaders = detectTitlePageHeaders(inputItems, itemsByLine, maxTitlePage, mostUsedHeight, maxHeight, itemToLevel);
        var hasHeaderType = function (types) { return types.find(function (t) { return (0, text_types_1.isHeadline)(t); }); };
        if (toc && headlineTypeToHeightRange) {
            // Use existing headline heights to find additional headlines
            var headlineTypes = Object.keys(headlineTypeToHeightRange);
            headlineTypes.forEach(function (headlineType) {
                var range = headlineTypeToHeightRange[headlineType];
                if (range.max > mostUsedHeight) {
                    // use only very clear headlines, only use max
                    inputItems.forEach(function (item) {
                        var itemHeight = item.data['height'];
                        var types = item.data['types'] || itemToLevel.has(item.uuid) ? [itemToLevel.get(item.uuid)] : [];
                        var isHeader = hasHeaderType(types);
                        if (!isHeader && itemHeight === range.max) {
                            itemToLevel.set(item.uuid, headlineType);
                            detectedHeaders++;
                        }
                    });
                }
            });
        }
        // Categorize headlines by the text heights
        var heights = [];
        itemsByLine
            .filter(function (lineItems) { return !itemToLevel.has(lineItems[0].uuid); })
            .map(function (lineItems) {
            var maxHeight = Math.max.apply(Math, lineItems.map(function (item) { return item.data['height']; }));
            if (maxHeight > mostUsedHeight * config.minHeadlineDistance && !heights.includes(maxHeight)) {
                heights.push(maxHeight);
            }
        });
        var heightToHeadline = new Map();
        heights.sort(function (a, b) { return b - a; });
        heights.forEach(function (height, i) {
            var headlineLevel = i + 2;
            if (headlineLevel <= 6) {
                var headlineType = (0, text_types_1.toHeadlineType)(2 + i);
                heightToHeadline.set(height, headlineType);
            }
        });
        itemsByLine
            .filter(function (lineItems) { return !itemToLevel.has(lineItems[0].uuid); })
            .forEach(function (lineItems) {
            var maxHeight = Math.max.apply(Math, lineItems.map(function (item) { return item.data['height']; }));
            var types = (0, functional_1.flatten)(lineItems.map(function (item) { return item.data['types'] || []; })).filter(groupingUtils_1.onlyUniques);
            if (!hasHeaderType(types) && !itemToLevel.has(lineItems[0].uuid)) {
                var headlineType_1 = heightToHeadline.get(maxHeight);
                if (headlineType_1 && !types.includes('H1') && !types.includes('H2')) {
                    lineItems.forEach(function (item) { return itemToLevel.set(item.uuid, headlineType_1); });
                    detectedHeaders++;
                }
            }
        });
        // TODO find headlines which have paragraph height
        // var smallesHeadlineLevel = 1;
        // parseResult.pages.forEach((page) => {
        //   page.items.forEach((item) => {
        //     if (item.type && item.type.headline) {
        //       smallesHeadlineLevel = Math.max(smallesHeadlineLevel, item.type.headlineLevel);
        //     }
        //   });
        // });
        // if (smallesHeadlineLevel < 6) {
        //   const nextHeadlineType = headlineByLevel(smallesHeadlineLevel + 1);
        //   parseResult.pages.forEach((page) => {
        //     var lastItem;
        //     page.items.forEach((item) => {
        //       if (
        //         !item.type &&
        //         item.height == mostUsedHeight &&
        //         item.font !== mostUsedFont &&
        //         (!lastItem ||
        //           lastItem.y < item.y ||
        //           (lastItem.type && lastItem.type.headline) ||
        //           lastItem.y - item.y > mostUsedDistance * 2) &&
        //         item.text() === item.text().toUpperCase()
        //       ) {
        //         detectedHeaders++;
        //         item.annotation = DETECTED_ANNOTATION;
        //         item.type = nextHeadlineType;
        //       }
        //       lastItem = item;
        //     });
        //   });
        // }
        return {
            items: inputItems.map(function (item) {
                var headerType = itemToLevel.get(item.uuid);
                if (headerType) {
                    var hasAlreadyHeadline = item.data['types'] || [].find(function (t) { return (0, text_types_1.isHeadline)(t); });
                    if (!hasAlreadyHeadline) {
                        return (0, items_1.itemWithType)(item, headerType);
                    }
                }
                return item;
            }),
            messages: ["Detected ".concat(detectedHeaders, " headers")]
        };
    };
    return DetectHeaders;
}(ItemTransformer_1["default"]));
exports["default"] = DetectHeaders;
function detectTitlePageHeaders(inputItems, itemsByLine, maxTitlePage, mostUsedHeight, maxHeight, itemToLevel) {
    var min2ndLevelHeaderHeigthOnMaxPage = mostUsedHeight + (maxHeight - mostUsedHeight) / 4;
    var pagesHavingMaxHeightItems = inputItems
        .filter(function (item) { return item.page <= maxTitlePage; })
        .filter(function (item) { return item.data['height'] === maxHeight; })
        .map(function (item) { return item.page; })
        .filter(groupingUtils_1.onlyUniques);
    var detectedHeaders = 0;
    itemsByLine
        .filter(function (items) { return pagesHavingMaxHeightItems.includes(items[0].page); })
        .forEach(function (lineItems) {
        var height = Math.max.apply(Math, lineItems.map(function (item) { return item.data['height']; }));
        if (height > min2ndLevelHeaderHeigthOnMaxPage) {
            if (height == maxHeight) {
                lineItems.forEach(function (item) { return itemToLevel.set(item.uuid, 'H1'); });
            }
            else {
                lineItems.forEach(function (item) { return itemToLevel.set(item.uuid, 'H2'); });
            }
            detectedHeaders++;
        }
    });
    return detectedHeaders;
}
