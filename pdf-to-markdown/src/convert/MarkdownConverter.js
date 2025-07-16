"use strict";
exports.__esModule = true;
exports.lineToText = void 0;
var groupingUtils_1 = require("../support/groupingUtils");
var text_types_1 = require("../text-types");
var token_types_1 = require("../token-types");
var MarkdownConverter = /** @class */ (function () {
    function MarkdownConverter() {
    }
    MarkdownConverter.prototype.convert = function (items) {
        var content = '';
        (0, groupingUtils_1.groupByBlock)(items).forEach(function (blockItems) {
            var blockTypes = blockItems[0].data['types'] || [];
            var blockContent = '';
            (0, groupingUtils_1.groupByLine)(blockItems).forEach(function (lineItems) {
                blockContent += lineToText(lineItems, blockTypes);
                blockContent += '\n';
            });
            content += elementToText(blockContent, blockTypes[0]);
        });
        return content;
    };
    return MarkdownConverter;
}());
exports["default"] = MarkdownConverter;
function elementToText(text, type) {
    switch (type) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
            return '#'.repeat((0, text_types_1.headlineLevel)(type)) + ' ' + text + '\n';
        case 'CODE':
            return '```\n' + text.trim() + '\n```\n\n';
        case 'FOOTNOTES':
            return text;
        default:
            return text + '\n';
    }
}
function toWords(text) {
    return text.split(' ').filter(function (string) { return string.trim().length > 0; });
}
function lineToText(lineItems, blockTypes) {
    var text = '';
    var openFormat;
    var closeFormat = function () {
        text += (0, token_types_1.endSymbol)(openFormat);
        openFormat = null;
    };
    var lastLineItem = null;
    lineItems.forEach(function (lineItem, indexInLine) {
        var words = toWords(lineItem.data['str']);
        words.forEach(function (word, wordIndex) {
            var _a, _b;
            if (indexInLine === 0 && wordIndex === 0) {
                if (lineItem.listLevel) {
                    word = ' '.repeat(lineItem.listLevel * 2) + word;
                }
            }
            var wordFormat = lineItem.tokenTypes[0]; // bold, oblique, footnote etc...
            if (openFormat && (!wordFormat || wordFormat !== openFormat)) {
                closeFormat();
            }
            if ((wordIndex > 0 || indexInLine > 0) &&
                !(wordFormat && (0, token_types_1.attachWithoutWhitespace)(wordFormat)) &&
                !isPunctationCharacter(word)) {
                var insertWhitespace = true;
                if (indexInLine > 0 && wordIndex == 0) {
                    var xDistance = lineItem.data['x'] - lastLineItem.data['x'] - lastLineItem.data['width'];
                    if (xDistance < 2 && !((_a = lastLineItem.data['str']) === null || _a === void 0 ? void 0 : _a.endsWith(' ')) && !((_b = lineItem.data['str']) === null || _b === void 0 ? void 0 : _b.startsWith(' '))) {
                        insertWhitespace = false;
                    }
                }
                if (insertWhitespace) {
                    text += ' ';
                }
            }
            var disableInlineFormats = wordFormat && ((0, text_types_1.discardTokenTypes)(blockTypes) || (blockTypes.find(text_types_1.isHeadline) && wordFormat === 'BOLD'));
            if (wordFormat && !openFormat && !disableInlineFormats) {
                openFormat = wordFormat;
                text += (0, token_types_1.startSymbol)(openFormat);
            }
            if (wordFormat && (!disableInlineFormats || (0, token_types_1.plainTextFormat)(wordFormat))) {
                text += (0, token_types_1.tokenToText)(word, wordFormat);
            }
            else {
                text += word;
            }
        });
        if (openFormat && (indexInLine == lineItems.length - 1 || firstFormat(lineItems[indexInLine + 1]) !== openFormat)) {
            closeFormat();
        }
        lastLineItem = lineItem;
    });
    return text;
}
exports.lineToText = lineToText;
function firstFormat(lineItem) {
    if (lineItem.data['str'].length == 0) {
        return null;
    }
    return lineItem.tokenTypes[0];
}
function isPunctationCharacter(value) {
    if (value.length != 1) {
        return false;
    }
    return value[0] === '.' || value[0] === '!' || value[0] === '?';
}
