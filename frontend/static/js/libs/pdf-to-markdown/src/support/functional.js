"use strict";
exports.__esModule = true;
exports.arraysEqual = exports.flatten = exports.groupBy = exports.flatMap = void 0;
function flatMap(array, func) {
    return array.reduce(function (result, entry, idx) { return result.concat(func(entry, idx)); }, []);
}
exports.flatMap = flatMap;
function groupBy(array, groupKey) {
    var groupMap = array.reduce(function (map, element) {
        var key = groupKey(element);
        var elementsInGroup = map.get(key);
        if (elementsInGroup) {
            elementsInGroup.push(element);
        }
        else {
            map.set(key, [element]);
        }
        return map;
    }, new Map());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Array.from(groupMap, function (_a) {
        var _ = _a[0], value = _a[1];
        return value;
    });
}
exports.groupBy = groupBy;
function flatten(array) {
    return flatMap(array, function (e) { return e; });
}
exports.flatten = flatten;
function arraysEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (a.length !== b.length)
        return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
exports.arraysEqual = arraysEqual;
