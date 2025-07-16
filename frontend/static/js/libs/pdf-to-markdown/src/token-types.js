"use strict";
exports.__esModule = true;
exports.tokenToText = exports.plainTextFormat = exports.attachWithoutWhitespace = exports.endSymbol = exports.startSymbol = void 0;
var startSymbol = function (type) {
    switch (type) {
        case 'BOLD':
            return '**';
        case 'OBLIQUE':
            return '_';
        default:
            return '';
        //   throw new Error(`No start symbol defined for type: ${type}`);
    }
};
exports.startSymbol = startSymbol;
var endSymbol = function (type) {
    switch (type) {
        case 'BOLD':
            return '**';
        case 'OBLIQUE':
            return '_';
        default:
            return '';
        //   throw new Error(`No end symbol defined for type: ${type}`);
    }
};
exports.endSymbol = endSymbol;
var attachWithoutWhitespace = function (type) {
    switch (type) {
        case 'FOOTNOTE_LINK':
            return true;
        default:
            return false;
    }
};
exports.attachWithoutWhitespace = attachWithoutWhitespace;
var plainTextFormat = function (type) {
    switch (type) {
        case 'FOOTNOTE_LINK':
            return true;
        default:
            return false;
    }
};
exports.plainTextFormat = plainTextFormat;
function tokenToText(token, type) {
    switch (type) {
        case 'LINK':
            return "[".concat(token, "](").concat(token, ")");
        case 'FOOTNOTE_LINK':
            return "[^".concat(token, "]");
        case 'FOOTNOTE':
            return "[^".concat(token, "]:");
        default:
            return token;
    }
}
exports.tokenToText = tokenToText;
