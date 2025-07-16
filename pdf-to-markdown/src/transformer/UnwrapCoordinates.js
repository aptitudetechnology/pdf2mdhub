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
var ItemTransformer_1 = require("./ItemTransformer");
var CalculateCoordinates = /** @class */ (function (_super) {
    __extends(CalculateCoordinates, _super);
    function CalculateCoordinates() {
        return _super.call(this, 'Unwrap Coordinates', 'Extracts X and Y out of the Transform array', {
            requireColumns: ['transform'],
            debug: {
                showAll: true
            }
        }, function (incomingSchema) {
            return incomingSchema.reduce(function (schema, column) {
                if (column === 'transform') {
                    return __spreadArray(__spreadArray([], schema, true), ['x', 'y'], false);
                }
                return __spreadArray(__spreadArray([], schema, true), [column], false);
            }, new Array());
        }) || this;
    }
    CalculateCoordinates.prototype.transform = function (_, inputItems) {
        return {
            items: inputItems.map(function (item) {
                var transform = item.data['transform'];
                var x = transform[4];
                var y = transform[5];
                return item.withDataAddition({ x: x, y: y });
            }),
            messages: []
        };
    };
    return CalculateCoordinates;
}(ItemTransformer_1["default"]));
exports["default"] = CalculateCoordinates;
