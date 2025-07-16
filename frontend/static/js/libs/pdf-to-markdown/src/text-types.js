"use strict";
exports.__esModule = true;
exports.discardTokenTypes = exports.mergeFollowingNonTypedItemsWithSmallDistance = exports.mergeFollowingNonTypedItems = exports.mergeToBlock = exports.headlineLevel = exports.toHeadlineType = exports.isHeadline = exports.toBlockType = void 0;
var assert_1 = require("./assert");
function types() {
    var types = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        types[_i] = arguments[_i];
    }
    return types;
}
function toBlockType(type) {
    if (type === 'NUMBERED_LIST') {
        return 'LIST';
    }
    return type;
}
exports.toBlockType = toBlockType;
function isHeadline(type) {
    return types('H1', 'H2', 'H3', 'H4', 'H5', 'H6').includes(type);
}
exports.isHeadline = isHeadline;
function toHeadlineType(number) {
    (0, assert_1.assert)(number > 0 && number < 7, "Expected headline level between 1 and 6 but was ".concat(number));
    return "H".concat(number.toString());
}
exports.toHeadlineType = toHeadlineType;
function headlineLevel(type) {
    var level = parseInt(type[1]);
    (0, assert_1.assert)(level > 0 && level < 7, "Expected headline level between 1 and 6 but was ".concat(level, " (from '").concat(type, "')"));
    return level;
}
exports.headlineLevel = headlineLevel;
function mergeToBlock(type) {
    return types('FOOTNOTES', 'CODE', 'LIST', 'NUMBERED_LIST').includes(type);
}
exports.mergeToBlock = mergeToBlock;
function mergeFollowingNonTypedItems(type) {
    return types('FOOTNOTES').includes(type);
}
exports.mergeFollowingNonTypedItems = mergeFollowingNonTypedItems;
function mergeFollowingNonTypedItemsWithSmallDistance(type) {
    return types('LIST', 'NUMBERED_LIST').includes(type);
}
exports.mergeFollowingNonTypedItemsWithSmallDistance = mergeFollowingNonTypedItemsWithSmallDistance;
// Discard token types like bold for certain text types
function discardTokenTypes(blockTypes) {
    if (blockTypes.includes('CODE')) {
        return true;
    }
    return false;
}
exports.discardTokenTypes = discardTokenTypes;
