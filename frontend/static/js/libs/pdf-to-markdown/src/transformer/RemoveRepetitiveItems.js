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
var string_similarity_1 = require("string-similarity");
var ItemTransformer_1 = require("./ItemTransformer");
var LineItemMerger_1 = require("../debug/LineItemMerger");
var CacluclateStatistics_1 = require("./CacluclateStatistics");
var groupingUtils_1 = require("../support/groupingUtils");
var stringFunctions_1 = require("../support/stringFunctions");
var stringFunctions_2 = require("../support/stringFunctions");
var config = {
    // From the absolute fringe elements (min/max y) how much y can item deviate before beeing disregarded.
    maxDistanceFromFringeElements: 45,
    // Max neighbour taken (in one direction) for detecting neighbour similarity.
    // Choosen number might be more effectful for PDFs with a strong odd/evan page differernce.
    neighbourReach: 2,
    minScore: 0.7
};
var RemoveRepetitiveItems = /** @class */ (function (_super) {
    __extends(RemoveRepetitiveItems, _super);
    function RemoveRepetitiveItems() {
        return _super.call(this, 'Remove Repetitive Items', 'Remove things like page numbers or license footers.', {
            requireColumns: ['x', 'y', 'str', 'line'],
            debug: {
                itemMerger: new LineItemMerger_1["default"]()
            }
        }) || this;
    }
    RemoveRepetitiveItems.prototype.transform = function (context, inputItems) {
        var minY = context.getGlobal(CacluclateStatistics_1.MIN_Y);
        var maxY = context.getGlobal(CacluclateStatistics_1.MAX_Y);
        var bottomMaxY = minY + config.maxDistanceFromFringeElements;
        var topMinY = maxY - config.maxDistanceFromFringeElements;
        // console.log('bottomMaxY', bottomMaxY, 'topMinY', topMinY);
        var fringeItems = inputItems.filter(function (item) {
            var y = item.data['y'];
            return y <= bottomMaxY || y >= topMinY;
        });
        var fringeLines = (0, groupingUtils_1.flatMap)((0, groupingUtils_1.groupByPage)(fringeItems).map(function (pageItems) {
            return (0, groupingUtils_1.groupByLine)(pageItems)
                .map(function (lineItems) {
                var lineY = yFromLineItems(lineItems);
                return new PageLine(pageItems[0].page, lineY, lineItems);
            })
                .sort(function (a, b) { return a.y - b.y; });
        }), function (e) { return e; });
        var fringeYs = fringeLines
            .map(function (line) { return line.y; })
            .filter(groupingUtils_1.onlyUniques)
            .sort(groupingUtils_1.ascending);
        var yScoreMap = calculateScores(context, fringeYs, fringeLines);
        // console.log('uniqueYs', uniqueYs);
        var removalCount = 0;
        var removedY = __spreadArray([], yScoreMap.entries(), true).filter(function (_a) {
            var _ = _a[0], value = _a[1];
            return value.value >= config.minScore;
        })
            .map(function (_a) {
            var key = _a[0], _ = _a[1];
            return key;
        })
            .join('||');
        return {
            items: (0, groupingUtils_1.transformGroupedByPageAndLine)(inputItems, function (_, __, lineItems) {
                var itemsY = yFromLineItems(lineItems);
                var score = yScoreMap.get(itemsY);
                if (score) {
                    lineItems.forEach(function (item) { return context.trackEvaluation(item, score.description); });
                    if (score.value >= config.minScore) {
                        removalCount++;
                        return [];
                    }
                }
                return lineItems;
            }),
            messages: ["Filtered out ".concat(removalCount, " items with y == ").concat(removedY)]
        };
    };
    return RemoveRepetitiveItems;
}(ItemTransformer_1["default"]));
exports["default"] = RemoveRepetitiveItems;
function calculateScores(context, fringeYs, fringeLines) {
    var pageMapping = context.getGlobal(CacluclateStatistics_1.PAGE_MAPPING);
    var map = new Map();
    fringeYs.forEach(function (y) {
        var yLines = fringeLines.filter(function (line) { return line.y == y; });
        if (yLines.length < 2) {
            map.set(y, new Score(0, "0 (only on ".concat(yLines.length, " page(s))")));
        }
        else {
            var pageNumberScore = pageMapping.detectedOnPage
                ? calculatePageNumerScore(context.pageCount, pageMapping.pageFactor, yLines)
                : 0;
            var textSimilarityScore = textSimilarity(yLines);
            // TODO possibly refine with:
            // - exclude headlines (higher height, e.g art of speaking)
            // - structural similarity (x, y, height, etc)
            // - contain chapter headings
            var totalScore = pageNumberScore + textSimilarityScore;
            map.set(y, new Score(totalScore, "".concat(totalScore.toFixed(2), ": (").concat(pageNumberScore.toFixed(2), " + ").concat(textSimilarityScore.toFixed(2), ")")));
        }
    });
    return map;
}
function calculatePageNumerScore(pageCount, pageFactor, lines) {
    var maxPageNumbers = pageCount + pageFactor;
    var linesWithPageNumbers = lines.filter(function (line) { return (0, stringFunctions_2.extractNumbers)(line.text()).includes(line.page + pageFactor); })
        .length;
    return linesWithPageNumbers / Math.min(maxPageNumbers, lines.length);
}
function textSimilarity(lines) {
    var similarities = (0, groupingUtils_1.flatMap)(lines, function (line, idx) {
        return adiacentLines(lines, idx).map(function (adiacentLine) { return calculateSimilarity(line, adiacentLine); });
    });
    return (0, groupingUtils_1.median)(similarities);
}
function calculateSimilarity(line1, line2) {
    if (line1.textWithoutNumbers().length === 0) {
        return 0;
    }
    return (0, string_similarity_1.compareTwoStrings)(line1.textWithoutNumbers(), line2.textWithoutNumbers());
}
function adiacentLines(lines, index) {
    // Prefer to either collect x downstream OR x upstream neighbours (not a mix) in order to better catch odd/even page differences
    var neighbours;
    if (index + config.neighbourReach < lines.length) {
        neighbours = lines.slice(index + 1, index + config.neighbourReach + 1);
    }
    else if (index - config.neighbourReach >= 0) {
        neighbours = lines.slice(index - config.neighbourReach - 1, index - 1);
    }
    else {
        neighbours = lines.filter(function (_, idx) { return idx !== index; });
    }
    return neighbours;
}
function yFromLineItems(lineItems) {
    return Math.round((0, groupingUtils_1.mostFrequent)(lineItems, 'y'));
}
var Score = /** @class */ (function () {
    function Score(value, description) {
        this.value = value;
        this.description = description;
    }
    return Score;
}());
/**
 * A number of Items on a line (~same y) on a page.
 */
var PageLine = /** @class */ (function () {
    function PageLine(page, y, items) {
        this.page = page;
        this.y = y;
        this.items = items;
    }
    PageLine.prototype.text = function () {
        if (!this._text) {
            this._text = this.items.reduce(function (all, item) { return all + item.data['str']; }, '');
        }
        return this._text;
    };
    PageLine.prototype.textWithoutNumbers = function () {
        if (!this._textWithoutNumbers) {
            this._textWithoutNumbers = (0, stringFunctions_1.filterOutDigits)(this.text());
        }
        return this._textWithoutNumbers;
    };
    return PageLine;
}());
