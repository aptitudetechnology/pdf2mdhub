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
exports.__esModule = true;
var ItemTransformer_1 = require("./ItemTransformer");
var RemoveEmptyItems = /** @class */ (function (_super) {
    __extends(RemoveEmptyItems, _super);
    function RemoveEmptyItems() {
        return _super.call(this, 'Remove Empty Items', 'Remove items which have only whitespace.', {
            requireColumns: ['str']
        }) || this;
    }
    RemoveEmptyItems.prototype.transform = function (_, inputItems) {
        var removed = 0;
        return {
            items: inputItems.filter(function (item) {
                var text = item.data['str'];
                var empty = text.trim() === '';
                if (empty)
                    removed++;
                return !empty;
            }),
            messages: ["Removed ".concat(removed, " blank items")]
        };
    };
    return RemoveEmptyItems;
}(ItemTransformer_1["default"]));
exports["default"] = RemoveEmptyItems;
