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
var ItemMerger_1 = require("./ItemMerger");
var Item_1 = require("../Item");
var functional_1 = require("../support/functional");
var groupingUtils_1 = require("../support/groupingUtils");
var LineItemMerger = /** @class */ (function (_super) {
    __extends(LineItemMerger, _super);
    function LineItemMerger(trackAsNew) {
        if (trackAsNew === void 0) { trackAsNew = false; }
        var _this = _super.call(this, 'line') || this;
        _this.trackAsNew = trackAsNew;
        return _this;
    }
    LineItemMerger.prototype.merge = function (evaluationTracker, changeTracker, schema, items) {
        var page = items[0].page;
        var block = items[0].data['block'];
        var line = items[0].data['line'];
        var str = items.map(function (item) { return item.data['str']; }).join(' ');
        var x = Math.min.apply(Math, items.map(function (item) { return item.data['x']; }));
        var y = Math.min.apply(Math, items.map(function (item) { return item.data['y']; }));
        var width = items.reduce(function (sum, item) { return sum + item.data['width']; }, 0);
        var height = Math.max.apply(Math, items.map(function (item) { return item.data['height']; }));
        var fontNames = __spreadArray([], new Set(items.map(function (item) { return item.data['fontName']; })), true);
        var directions = __spreadArray([], new Set(items.map(function (item) { return item.data['dir']; })), true);
        var newItem = new Item_1["default"](page, {
            str: str,
            block: block,
            line: line,
            x: x,
            y: y,
            width: width,
            height: height,
            fontName: fontNames,
            dir: directions
        });
        if (schema.includes('types')) {
            var types = (0, functional_1.flatten)(items.map(function (item) { return item.data['types'] || []; })).filter(groupingUtils_1.onlyUniques);
            if (types.length > 0) {
                newItem.data['types'] = types;
            }
        }
        var evaluatedItem = items.find(function (item) { return evaluationTracker.evaluated(item); });
        if (evaluatedItem)
            evaluationTracker.trackEvaluation(newItem, evaluationTracker.evaluationScore(evaluatedItem));
        if (this.trackAsNew) {
            changeTracker.trackAddition(newItem);
        }
        else if (items.every(function (item) { return changeTracker.isRemoved(item); })) {
            changeTracker.trackRemoval(newItem);
        }
        else if (items.find(function (item) { return changeTracker.hasChanged(item); })) {
            changeTracker.trackContentChange(newItem);
        }
        return newItem;
    };
    return LineItemMerger;
}(ItemMerger_1["default"]));
exports["default"] = LineItemMerger;
