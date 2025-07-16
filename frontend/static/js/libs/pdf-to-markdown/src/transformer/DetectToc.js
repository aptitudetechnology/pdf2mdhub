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
exports.HEADLINE_TYPE_TO_HEIGHT_RANGE = exports.TOC_GLOBAL = void 0;
var string_similarity_1 = require("string-similarity");
var ItemTransformer_1 = require("./ItemTransformer");
var GlobalDefinition_1 = require("../GlobalDefinition");
var LineItemMerger_1 = require("../debug/LineItemMerger");
var groupingUtils_1 = require("../support/groupingUtils");
var CacluclateStatistics_1 = require("./CacluclateStatistics");
var stringFunctions_1 = require("../support/stringFunctions");
var numberFunctions_1 = require("../support/numberFunctions");
var TOC_1 = require("../TOC");
var FontType_1 = require("../FontType");
var functional_1 = require("../support/functional");
var items_1 = require("../support/items");
var text_types_1 = require("../text-types");
var config = {
    // How many characters a line with a ending number needs to have minimally to be a valid link
    linkMinLength: 4,
    // How much bigger (height) then a 'normal' text a headline must be
    // TODO sync with DetectHeadline ??
    minHeadlineDistance: 1.5
};
exports.TOC_GLOBAL = new GlobalDefinition_1["default"]('toc');
exports.HEADLINE_TYPE_TO_HEIGHT_RANGE = new GlobalDefinition_1["default"]('headlineTypeToHeightRange');
var DetectToc = /** @class */ (function (_super) {
    __extends(DetectToc, _super);
    function DetectToc() {
        return _super.call(this, 'Detect TOC', 'Detect table of contents.', {
            requireColumns: ['x', 'y', 'str', 'line'],
            producesGlobels: [exports.TOC_GLOBAL.key, exports.HEADLINE_TYPE_TO_HEIGHT_RANGE.key],
            debug: {
                itemMerger: new LineItemMerger_1["default"]()
            }
        }, function (incomingSchema) {
            return incomingSchema.reduce(function (schema, column) {
                if (column === 'x') {
                    return __spreadArray(__spreadArray([], schema, true), ['types', 'x'], false);
                }
                return __spreadArray(__spreadArray([], schema, true), [column], false);
            }, new Array());
        }) || this;
    }
    DetectToc.prototype.transform = function (context, inputItems) {
        var pageMapping = context.getGlobal(CacluclateStatistics_1.PAGE_MAPPING);
        var mostUsedHeight = context.getGlobal(CacluclateStatistics_1.MOST_USED_HEIGHT);
        var maxPageToEvaluate = Math.min(context.pageCount / 2, 5 + Math.abs(pageMapping.pageFactor));
        var pagesToEvaluate = (0, groupingUtils_1.groupByPage)(inputItems.filter(function (item) { return item.page <= maxPageToEvaluate; }));
        var maxPageToBeLinkedTo = context.pageCount + pageMapping.pageFactor - 1;
        var tocArea = findTocArea(pagesToEvaluate, context.pageCount, maxPageToBeLinkedTo);
        if (!tocArea) {
            return { items: inputItems, messages: ['No Table of Contents found!'] };
        }
        var itemsInTocArea = inputItems.filter(function (item) { return tocArea.pages.includes(item.page); });
        var rawTocEntries = selectRawTocEntries(tocArea, itemsInTocArea);
        var headlineLevels = findTocEntryHeadlineLevels(rawTocEntries);
        var tocItemUuids = new Set((0, functional_1.flatten)((0, functional_1.flatten)(rawTocEntries.map(function (e) { return e.entryLines; }))).map(function (item) { return item.uuid; }));
        var tocHeadline = findTocHeadline(context.fontMap, mostUsedHeight, tocArea, itemsInTocArea, tocItemUuids);
        var notFoundHeadlines = [];
        var foundHeadlines = [];
        var headlineTypeToHeightRange = {}; //H1={min:23, max:25}
        rawTocEntries.forEach(function (rawEntry, index) {
            var itemType = headlineLevels[index];
            var uuids = findHeadline(context.fontMap, inputItems, mostUsedHeight, rawEntry.linkedPage, rawEntry.linkedPage - pageMapping.pageFactor, rawEntry.entryLines);
            if (uuids) {
                foundHeadlines.push({ level: itemType, uuids: uuids });
                // add headline height
                var headlineHeight = inputItems
                    .filter(function (item) { return uuids.has(item.uuid); })
                    .reduce(function (maxHeight, item) { return Math.max(maxHeight, item.data['height']); }, 0);
                var range = headlineTypeToHeightRange[itemType];
                if (range) {
                    range.min = Math.min(range.min, headlineHeight);
                    range.max = Math.max(range.max, headlineHeight);
                }
                else {
                    range = {
                        min: headlineHeight,
                        max: headlineHeight
                    };
                    headlineTypeToHeightRange[itemType] = range;
                }
            }
            else {
                notFoundHeadlines.push(rawEntry);
            }
        });
        var headlineUuidToLevelMap = foundHeadlines.reduce(function (uidToLevel, headline) {
            headline.uuids.forEach(function (uuid) {
                uidToLevel.set(uuid, headline.level);
            });
            return uidToLevel;
        }, new Map());
        var headlineTypes = foundHeadlines.reduce(function (allLevels, headline) {
            allLevels.add(headline.level);
            return allLevels;
        }, new Set());
        var tocHeadlineUuids = new Set(tocHeadline.map(function (item) { return item.uuid; }));
        return {
            items: inputItems
                .filter(function (item) { return !tocHeadlineUuids.has(item.uuid); })
                .filter(function (item) { return !tocArea.pages.includes(item.page) || !tocItemUuids.has(item.uuid); })
                .map(function (item) {
                var itemType = headlineUuidToLevelMap.get(item.uuid);
                if (itemType) {
                    return (0, items_1.itemWithType)(item, itemType);
                }
                return item;
            }),
            messages: [
                "Detected and removed ".concat(rawTocEntries.length, " TOC entries"),
                "Found ".concat(foundHeadlines.length, " matching headlines"),
            ],
            globals: [
                exports.TOC_GLOBAL.value(new TOC_1["default"](tocHeadline, tocArea.pages, headlineTypes)),
                exports.HEADLINE_TYPE_TO_HEIGHT_RANGE.value(headlineTypeToHeightRange),
            ]
        };
    };
    return DetectToc;
}(ItemTransformer_1["default"]));
exports["default"] = DetectToc;
function findTocArea(pagesToEvaluate, pageCount, maxPageToBeLinkedTo) {
    var linesWithNumber = [];
    pagesToEvaluate.forEach(function (pageItems) {
        var itemsGroupedByLine = (0, groupingUtils_1.groupByLine)(pageItems);
        itemsGroupedByLine.forEach(function (lineItems) {
            var number = findEndingNumber(lineItems);
            if (number &&
                Number.isInteger(number) &&
                number > 0 &&
                number <= maxPageToBeLinkedTo &&
                lineItems.map(function (item) { return item.data['str']; }).join('').length > config.linkMinLength) {
                var page = lineItems[0].page;
                var startItemUuid = lineItems[0].uuid;
                var y = lineItems[0].data['y'];
                linesWithNumber.push({ page: page, startItemUuid: startItemUuid, y: y, number: number });
            }
        });
    });
    if (linesWithNumber.length <= 0) {
        return undefined;
    }
    var lineNumberClusters = linesWithNumber.reduce(function (arrayOfAscendingNumberArrays, lineWithNumber) {
        if (arrayOfAscendingNumberArrays.length == 0) {
            return [[lineWithNumber]];
        }
        var lastArray = arrayOfAscendingNumberArrays[arrayOfAscendingNumberArrays.length - 1];
        var lastNumber = lastArray[lastArray.length - 1];
        if (lineWithNumber.number >= lastNumber.number) {
            lastArray.push(lineWithNumber);
        }
        else {
            arrayOfAscendingNumberArrays.push([lineWithNumber]);
        }
        return arrayOfAscendingNumberArrays;
    }, []);
    lineNumberClusters.sort(function (a, b) { return b.length - a.length; });
    if (lineNumberClusters[0].length < 3) {
        return undefined;
    }
    var selectedLines = lineNumberClusters[0];
    var pages = selectedLines.map(function (l) { return l.page; }).filter(groupingUtils_1.onlyUniques);
    if (!(0, numberFunctions_1.numbersAreConsecutive)(pages)) {
        return undefined;
    }
    if (pages.length > selectedLines.length / 5) {
        return undefined;
    }
    return {
        pages: pages,
        linesWithNumbers: selectedLines
    };
}
function findEndingNumber(lineItems) {
    var text = lineItems
        .reduce(function (text, item) {
        return text + item.data['str'];
    }, '')
        .trim();
    return (0, stringFunctions_1.extractEndingNumber)(text);
}
function selectRawTocEntries(tocArea, itemsInTocArea) {
    var numbersByStartUuid = tocArea.linesWithNumbers.reduce(function (map, l) {
        map.set(l.startItemUuid, l.number);
        return map;
    }, new Map());
    var itemsInTocAreaByLine = (0, groupingUtils_1.groupByLine)(itemsInTocArea);
    var maxHeightOfNumberedLines = Math.max.apply(Math, itemsInTocAreaByLine
        .reduce(function (lineHeights, lineItems) {
        if (numbersByStartUuid.has(lineItems[0].uuid)) {
            lineHeights.push(Math.max.apply(Math, lineItems.map(function (line) { return line.data['height']; })));
        }
        return lineHeights;
    }, [])
        .filter(groupingUtils_1.onlyUniques));
    var maxLinesBetweenLinesWithNumbers = Math.max.apply(Math, itemsInTocAreaByLine
        .reduce(function (lineDistance, lineItems) {
        if (numbersByStartUuid.has(lineItems[0].uuid)) {
            lineDistance.push(-1);
        }
        if (lineDistance.length > 0) {
            lineDistance[lineDistance.length - 1]++;
        }
        return lineDistance;
    }, [])
        .filter(groupingUtils_1.onlyUniques));
    var linesWithNumbersByPage = (0, functional_1.groupBy)(tocArea.linesWithNumbers, function (line) { return line.page; });
    var maxYBetweenLinesWithNumbers = Math.max.apply(Math, linesWithNumbersByPage.map(function (pageLines) {
        return pageLines.reduce(function (previous, line) {
            var y = line.y;
            if (previous.y == -1) {
                return { y: y, distance: -1 };
            }
            return {
                y: y,
                distance: Math.max(Math.abs(y - previous.y), previous.distance)
            };
        }, { y: -1, distance: -1 }).distance;
    }));
    var rawTocEntries = [];
    itemsInTocAreaByLine.reduce(function (beforeLines, lineItems) {
        var number = numbersByStartUuid.get(lineItems[0].uuid);
        if (!number) {
            beforeLines.push(lineItems);
            return beforeLines;
        }
        var validBeforeLines = beforeLines.filter(function (beforLine, beforeIndex) {
            var yDistance = Math.abs(beforLine[0].data['y'] - lineItems[0].data['y']);
            var beforLineHeight = Math.max.apply(Math, beforLine.map(function (item) { return item.data['height']; }));
            var beforeLineMuchLarger = beforLineHeight > maxHeightOfNumberedLines;
            return (!beforeLineMuchLarger &&
                beforeLines.length - beforeIndex <= maxLinesBetweenLinesWithNumbers &&
                yDistance <= maxYBetweenLinesWithNumbers);
        });
        var entryLines = __spreadArray(__spreadArray([], validBeforeLines, true), [lineItems], false);
        rawTocEntries.push({
            linkedPage: number,
            entryLines: entryLines
        });
        return [];
    }, []);
    return rawTocEntries;
}
function findTocHeadline(fontMap, mostUsedHeight, tocArea, itemsInTocArea, tocItemUuids) {
    var firstPageNonTocItems = itemsInTocArea
        .filter(function (item) { return item.page == tocArea.pages[0]; })
        .filter(function (item) { return !tocItemUuids.has(item.uuid); });
    var itemsGroupedByLine = (0, groupingUtils_1.groupByLine)(firstPageNonTocItems).filter(function (lineItems) {
        return hasHeadlineSymptoms(fontMap, mostUsedHeight, lineItems);
    });
    if (itemsGroupedByLine.length == 0) {
        return [];
    }
    return itemsGroupedByLine[itemsGroupedByLine.length - 1];
}
function findTocEntryHeadlineLevels(rawTocEntries) {
    // We focus on heights since it seems the most consistent metric to determining levels so far.
    //Other options would be looking at X-coordinates (per page), or at leading numbering (e.g. /^(\d)+.(\d)+.(\d)+/).
    var height = function (entry) { return Math.round((0, items_1.getHeight)(entry.entryLines[0][0])); };
    var allHeights = rawTocEntries.map(height).filter(groupingUtils_1.onlyUniques).sort(groupingUtils_1.descending);
    // we start with H2 (H1 is reserved for the document title)
    if (allHeights.length > 3) {
        return rawTocEntries.map(function () { return 'H2'; });
    }
    return rawTocEntries.map(function (entry) {
        var index = allHeights.indexOf(height(entry));
        return (0, text_types_1.toHeadlineType)(index + 2);
    });
}
/**
 * @param fontMap
 * @param items
 * @param mostUsedHeight
 * @param targetPage
 * @param targetPageIndex
 * @param entryLines
 * @returns set of uuids
 */
function findHeadline(fontMap, items, mostUsedHeight, targetPage, targetPageIndex, entryLines) {
    var tocEntryText = normalizeHeadlineChars(entryLines)
        .replace(new RegExp(targetPage + '$', 'g'), '')
        .replace(new RegExp('\\.\\.*$', 'g'), '');
    var pageItems = items.filter(function (item) { return item.page == targetPageIndex; });
    var canditate = fineMatchingHeadlineCanditate(tocEntryText, pageItems, fontMap, mostUsedHeight);
    if (canditate.length > 0) {
        return canditate.reduce(function (itemUuids, lineItems) {
            lineItems.forEach(function (item) { return itemUuids.add(item.uuid); });
            return itemUuids;
        }, new Set());
    }
    return undefined;
}
function fineMatchingHeadlineCanditate(tocEntryText, pageItems, fontMap, mostUsedHeight) {
    var itemsByLine = (0, groupingUtils_1.groupByLine)(pageItems);
    var headlineCanditates = [];
    var currentLines = [];
    var currentScore = 0;
    var currentText = '';
    for (var lineIdx = 0; lineIdx < itemsByLine.length; lineIdx++) {
        var lineItems = itemsByLine[lineIdx];
        var lineText = normalizeHeadlineChars([lineItems]);
        var lineInLink = tocEntryText.includes(lineText);
        var headlineSymptoms = hasHeadlineSymptoms(fontMap, mostUsedHeight, lineItems);
        if (lineInLink && headlineSymptoms) {
            var newText = currentText + lineText;
            var newScore = (0, string_similarity_1.compareTwoStrings)(newText, tocEntryText);
            if (newScore > currentScore) {
                currentScore = newScore;
                currentText = newText;
                currentLines.push(lineItems);
                if (newScore == 1) {
                    return currentLines;
                }
            }
            else if (currentScore > 0.95) {
                return currentLines;
            }
        }
        else {
            if (currentLines.length > 0) {
                headlineCanditates.push({ score: currentScore, lines: currentLines });
                currentLines = [];
                currentScore = 0;
                currentText = '';
            }
        }
    }
    // console.log(
    //   'headlineCanditates',
    //   tocEntryText,
    //   pageItems[0].page,
    //   headlineCanditates
    //     .sort((a, b) => a.score - b.score)
    //     .map((canditate) => canditate.score + ': ' + joinText(flatten(canditate.lines), '')),
    // );
    headlineCanditates = headlineCanditates.filter(function (candidate) { return candidate.score > 0.5; });
    if (headlineCanditates.length == 0) {
        return [];
    }
    return headlineCanditates.sort(function (a, b) { return a.score - b.score; })[0].lines;
}
function hasHeadlineSymptoms(fontMap, mostUsedHeight, lineItems) {
    return ((0, items_1.getHeight)(lineItems[0]) >= mostUsedHeight + config.minHeadlineDistance ||
        (0, FontType_1.declaredFontTypes)((0, items_1.getFontName)(fontMap, lineItems[0])).includes(FontType_1["default"].BOLD));
}
function normalizeHeadlineChars(lines) {
    var text = (0, functional_1.flatten)(lines)
        .map(function (item) { return (0, items_1.getText)(item); })
        .join('');
    return (0, stringFunctions_1.filterOut)(text, __spreadArray(__spreadArray([
        stringFunctions_1.WHITESPACE_CHAR_CODE,
        stringFunctions_1.TAB_CHAR_CODE
    ], stringFunctions_1.DASHS_CHAR_CODES, true), stringFunctions_1.PERIOD_CHAR_CODES, true)).toLowerCase();
}
