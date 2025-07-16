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
exports.itemWithType = exports.getFontName = exports.joinText = exports.getText = exports.getHeight = void 0;
var assert_1 = require("../assert");
var groupingUtils_1 = require("./groupingUtils");
function get(item, name) {
    var value = item.data[name];
    (0, assert_1.assertDefined)(value, "No '".concat(name, "' defined in ").concat(JSON.stringify(item)));
    return value;
}
function getHeight(item) {
    return get(item, 'height');
}
exports.getHeight = getHeight;
function getText(item) {
    return get(item, 'str');
}
exports.getText = getText;
function joinText(items, joinCharacter) {
    return items.map(function (item) { return getText(item); }).join(joinCharacter);
}
exports.joinText = joinText;
function getFontName(fontMap, item) {
    var fontId = item.data['fontName'];
    var fontObject = fontMap.get(fontId);
    if (!fontObject) {
        return fontId;
    }
    return (0, assert_1.assertDefined)(fontObject['name'], "No 'name' found in ".concat(JSON.stringify(fontObject)));
}
exports.getFontName = getFontName;
function itemWithType(item, type) {
    var existingTypes = item.data['types'] || [];
    return item.withDataAddition({ types: __spreadArray(__spreadArray([], existingTypes, true), [type], false).filter(groupingUtils_1.onlyUniques) });
}
exports.itemWithType = itemWithType;
