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
exports.PAGE_MAPPING = exports.MOST_USED_FONT = exports.MOST_USED_DISTANCE = exports.MOST_USED_HEIGHT = exports.MAX_HEIGHT = exports.MAX_Y = exports.MIN_Y = exports.MAX_X = exports.MIN_X = void 0;
var ItemTransformer_1 = require("./ItemTransformer");
var GlobalDefinition_1 = require("../GlobalDefinition");
var PageMapping_1 = require("../PageMapping");
var PageFactorFinder_1 = require("../support/PageFactorFinder");
var groupingUtils_1 = require("../support/groupingUtils");
var functional_1 = require("../support/functional");
var stringFunctions_1 = require("../support/stringFunctions");
var simple_statistics_1 = require("simple-statistics");
exports.MIN_X = new GlobalDefinition_1["default"]('minX');
exports.MAX_X = new GlobalDefinition_1["default"]('maxX');
exports.MIN_Y = new GlobalDefinition_1["default"]('minY');
exports.MAX_Y = new GlobalDefinition_1["default"]('maxY');
exports.MAX_HEIGHT = new GlobalDefinition_1["default"]('maxHeight');
exports.MOST_USED_HEIGHT = new GlobalDefinition_1["default"]('mostUsedHeight');
exports.MOST_USED_DISTANCE = new GlobalDefinition_1["default"]('mostUsedDistance');
exports.MOST_USED_FONT = new GlobalDefinition_1["default"]('mostUsedFont');
exports.PAGE_MAPPING = new GlobalDefinition_1["default"]('pageMapping');
var config = {
    // how much distance to min/max/x/y can an item have in order to be considered fringe
    maxDistanceToFringe: 50
};
function to2DigitDecimalFromString(value) {
    return parseFloat(parseFloat(value).toFixed(2));
}
function to2DigitDecimal(value) {
    return parseFloat(value.toFixed(2));
}
var CalculateStatistics = /** @class */ (function (_super) {
    __extends(CalculateStatistics, _super);
    function CalculateStatistics() {
        return _super.call(this, 'Calculate Statistics', 'Calculate global statistics that are used in downstream transformers', {
            requireColumns: ['str', 'fontName', 'y', 'height'],
            producesGlobels: [
                exports.MIN_X.key,
                exports.MOST_USED_HEIGHT.key,
                exports.MOST_USED_FONT.key,
                exports.MOST_USED_DISTANCE.key,
                exports.MAX_HEIGHT.key,
                'fontToFormats',
            ],
            debug: {
                showAll: true
            }
        }) || this;
    }
    CalculateStatistics.prototype.transform = function (context, items) {
        // www.30secondsofcode.org/js/s/frequencies
        // www.30secondsofcode.org/js/s/group-by
        // TODO
        // filter out title pages
        // filter out <= most used keys + x = 3
        // ckmeans(6)
        var heights = items.map(function (item) { return item.data['height']; });
        var mostUsedByMedian = (0, simple_statistics_1.median)(heights);
        var heightToOccurrence = {};
        var fontToOccurrence = {};
        var maxHeight = 0;
        // let maxHeightFont: string;
        var minX = 999;
        var maxX = 0;
        var minY = 999;
        var maxY = 0;
        items.forEach(function (item) {
            var itemHeight = item.data['height'];
            var itemFont = item.data['fontName'];
            var x = item.data['x'];
            var y = item.data['y'];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            heightToOccurrence[itemHeight] = heightToOccurrence[itemHeight] ? heightToOccurrence[itemHeight] + 1 : 1;
            fontToOccurrence[itemFont] = fontToOccurrence[itemFont] ? fontToOccurrence[itemFont] + 1 : 1;
            if (itemHeight > maxHeight) {
                maxHeight = itemHeight;
                // maxHeightFont = itemFont;
            }
        });
        var mostUsedHeight = to2DigitDecimalFromString(getMostUsedKey(heightToOccurrence));
        var mostUsedFont = getMostUsedKey(fontToOccurrence);
        var groupedByPage = (0, groupingUtils_1.groupByPage)(items);
        var pageMapping = parsePageMapping(groupedByPage, minX, maxX, minY, maxY);
        // Parse line distances
        var distanceToOccurrence = {};
        var page = -1;
        var lastItemOfMostUsedHeight;
        items.forEach(function (item) {
            if (item.page !== page)
                lastItemOfMostUsedHeight = undefined;
            var itemHeight = to2DigitDecimalFromString(item.data['height']);
            var itemText = item.data['str'];
            var itemY = item.data['y'];
            if (itemHeight == mostUsedHeight && itemText.trim().length > 0) {
                if (lastItemOfMostUsedHeight && itemY != lastItemOfMostUsedHeight.data['y']) {
                    var distance = to2DigitDecimal(lastItemOfMostUsedHeight.data['y'] - itemY);
                    if (distance > 0) {
                        distanceToOccurrence[distance] = distanceToOccurrence[distance] ? distanceToOccurrence[distance] + 1 : 1;
                    }
                }
                lastItemOfMostUsedHeight = item;
            }
            else {
                lastItemOfMostUsedHeight = undefined;
            }
            page = item.page;
        });
        var mostUsedDistance = to2DigitDecimalFromString(getMostUsedKey(distanceToOccurrence));
        var mostUsedFontObject = context.fontMap.get(mostUsedFont);
        return {
            items: items,
            globals: [
                exports.MAX_HEIGHT.value(maxHeight),
                exports.MOST_USED_HEIGHT.value(mostUsedByMedian),
                exports.MOST_USED_DISTANCE.value(mostUsedDistance),
                exports.MOST_USED_FONT.value((mostUsedFontObject === null || mostUsedFontObject === void 0 ? void 0 : mostUsedFontObject.name) || mostUsedFont),
                exports.MIN_X.value(minX),
                exports.MAX_X.value(maxX),
                exports.MIN_Y.value(minY),
                exports.MAX_Y.value(maxY),
                exports.PAGE_MAPPING.value(pageMapping),
            ],
            // globals2: {
            //   mostUsedHeight: mostUsedHeight,
            //   mostUsedFont: mostUsedFont,
            //   mostUsedDistance: mostUsedDistance,
            //   maxHeightFont: maxHeightFont,
            //   fontToFormats: fontToType,
            // },
            messages: [
                'Items per height: ' + JSON.stringify(heightToOccurrence),
                'Items per font: ' + JSON.stringify(fontToOccurrence),
                'Items per distance: ' + JSON.stringify(distanceToOccurrence),
            ]
        };
    };
    return CalculateStatistics;
}(ItemTransformer_1["default"]));
exports["default"] = CalculateStatistics;
function parsePageMapping(groupedByPage, minX, maxX, minY, maxY) {
    var pageFactor = new PageFactorFinder_1["default"]().find(groupedByPage, function (items) { return ({
        index: items[0].page,
        numbers: possiblePageNumbers(items.filter(function (item) {
            var x = item.data['x'];
            var y = item.data['y'];
            return (x <= minX + config.maxDistanceToFringe ||
                x >= maxX - config.maxDistanceToFringe ||
                y <= minY + config.maxDistanceToFringe ||
                y >= maxY - config.maxDistanceToFringe);
        }))
    }); }, { sampleCount: 20, minFulfillment: 0.8 });
    return typeof pageFactor === 'undefined' ? new PageMapping_1["default"]() : new PageMapping_1["default"](pageFactor, true);
}
function getMostUsedKey(keyToOccurrence) {
    var maxOccurence = 0;
    var maxKey = '';
    Object.keys(keyToOccurrence).map(function (element) {
        if (!maxKey || keyToOccurrence[element] > maxOccurence) {
            maxOccurence = keyToOccurrence[element];
            maxKey = element;
        }
    });
    return maxKey;
}
function possiblePageNumbers(items) {
    return (0, functional_1.flatten)(items.map(function (item) {
        return ((0, stringFunctions_1.extractNumbers)(item.data['str'])
            .filter(function (number) { return number >= 0; })
            // .filter((number) => number <= line.page + 1)
            .filter(groupingUtils_1.onlyUniques));
    }));
}
