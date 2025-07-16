"use strict";
exports.__esModule = true;
var ItemGroup = /** @class */ (function () {
    function ItemGroup(top, items) {
        if (items === void 0) { items = []; }
        this.top = top;
        this.elements = items;
    }
    ItemGroup.prototype.hasMany = function () {
        return this.elements.length > 0;
    };
    ItemGroup.prototype.unpacked = function () {
        if (this.elements.length > 0) {
            return this.elements;
        }
        return [this.top];
    };
    return ItemGroup;
}());
exports["default"] = ItemGroup;
