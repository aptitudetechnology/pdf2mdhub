"use strict";
exports.__esModule = true;
exports.numbersAreConsecutive = exports.numbersAreAsencding = void 0;
function numbersAreAsencding(numbers) {
    return numbers.every(function (num, idx) { return (idx > 0 ? num >= numbers[idx - 1] : true); });
}
exports.numbersAreAsencding = numbersAreAsencding;
function numbersAreConsecutive(numbers) {
    return numbers.every(function (num, idx) { return (idx > 0 ? num === numbers[idx - 1] + 1 : true); });
}
exports.numbersAreConsecutive = numbersAreConsecutive;
