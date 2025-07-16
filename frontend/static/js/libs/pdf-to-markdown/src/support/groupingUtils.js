"use strict";
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
exports.isGreaterWithTolerance = exports.majorityElement = exports.mostFrequent = exports.transformGroupedByPageAndLine = exports.transformGroupedByPage = exports.groupByElement = exports.groupByLine = exports.groupByBlock = exports.groupByPage = exports.median = exports.count = exports.max = exports.min = exports.descending = exports.ascending = exports.onlyUniques = exports.flatMap = void 0;
function flatMap(array, func) {
    return array.reduce(function (result, entry, idx) { return result.concat(func(entry, idx)); }, []);
}
exports.flatMap = flatMap;
function onlyUniques(value, index, self) {
    return self.indexOf(value) === index;
}
exports.onlyUniques = onlyUniques;
function ascending(a, b) {
    return a - b;
}
exports.ascending = ascending;
function descending(a, b) {
    return b - a;
}
exports.descending = descending;
function min(array, prevMin) {
    return array.reduce(function (prev, curr) {
        if (prev === undefined || curr < prev) {
            return curr;
        }
        return prev;
    }, prevMin);
}
exports.min = min;
function max(array, prevMin) {
    return array.reduce(function (prev, curr) {
        if (prev === undefined || curr > prev) {
            return curr;
        }
        return prev;
    }, prevMin);
}
exports.max = max;
function count(array, find) {
    return array.reduce(function (count, entry) { return (find(entry) ? count + 1 : count); }, 0);
}
exports.count = count;
function median(values) {
    if (values.length === 0)
        return 0;
    values.sort(function (a, b) {
        return a - b;
    });
    var half = Math.floor(values.length / 2);
    if (values.length % 2)
        return values[half];
    return (values[half - 1] + values[half]) / 2.0;
}
exports.median = median;
function groupBy(items, extractKey) {
    return items.reduce(function (pageItems, item) {
        var lastPageItems = pageItems[pageItems.length - 1];
        if (!lastPageItems || extractKey(item) !== extractKey(lastPageItems[0])) {
            pageItems.push([item]);
        }
        else {
            lastPageItems.push(item);
        }
        return pageItems;
    }, []);
}
function groupByPage(items) {
    return groupBy(items, function (item) { return item.page; });
}
exports.groupByPage = groupByPage;
function groupByBlock(items) {
    return groupByElement(items, 'block');
}
exports.groupByBlock = groupByBlock;
function groupByLine(items) {
    return groupByElement(items, 'line');
}
exports.groupByLine = groupByLine;
function groupByElement(items, elementName) {
    return groupBy(items, function (item) { return item.data[elementName]; });
}
exports.groupByElement = groupByElement;
function transformGroupedByPage(items, groupedTransformer) {
    var _a;
    return (_a = new Array()).concat.apply(_a, groupByPage(items).map(function (pageItems) { return groupedTransformer(pageItems[0].page, pageItems); }));
}
exports.transformGroupedByPage = transformGroupedByPage;
function transformGroupedByPageAndLine(items, groupedTransformer) {
    var transformedItems = [];
    groupByPage(items).forEach(function (pageItems) {
        groupByElement(pageItems, 'line').forEach(function (lineItems) {
            transformedItems.push.apply(transformedItems, groupedTransformer(pageItems[0].page, lineItems[0].data['line'], lineItems));
        });
    });
    return transformedItems;
}
exports.transformGroupedByPageAndLine = transformGroupedByPageAndLine;
function mostFrequent(items, dataElementKey) {
    var occurenceMap = items.reduce(function (map, item) {
        var key = item.data[dataElementKey];
        var occurrence = map.get(key) || 0;
        map.set(key, occurrence + 1);
        return map;
    }, new Map());
    var topElement = __spreadArray([], occurenceMap, true).reduce(function (topEntry, entry) { return (entry[1] >= topEntry[1] ? entry : topEntry); }, [undefined, 0])[0];
    //TODO optimally we should handle the 50/50 case
    return topElement;
}
exports.mostFrequent = mostFrequent;
function majorityElement(items, extract) {
    if (items.length == 0) {
        return;
    }
    var maj = 0, count = 1;
    for (var i = 1; i < items.length; i++) {
        if (extract(items[i]) === extract(items[maj])) {
            count++;
        }
        else {
            count--;
        }
        if (count === 0) {
            maj = i;
            count = 1;
        }
    }
    return extract(items[maj]);
}
exports.majorityElement = majorityElement;
function isGreaterWithTolerance(num1, num2, tolerance) {
    if (tolerance === void 0) { tolerance = 0.01; }
    return num1 - num2 > tolerance;
}
exports.isGreaterWithTolerance = isGreaterWithTolerance;
