"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var uuid_1 = require("uuid");
var Item = /** @class */ (function () {
    function Item(page, data, tokenTypes, uuid) {
        if (tokenTypes === void 0) { tokenTypes = []; }
        if (uuid === void 0) { uuid = (0, uuid_1.v4)(); }
        this.listLevel = 0;
        this.tokenTypes = [];
        this.page = page;
        this.data = data;
        this.uuid = uuid;
        this.tokenTypes = tokenTypes;
    }
    Item.prototype.value = function (column) {
        return this.data[column];
    };
    Item.prototype.withTokenType = function (tokenType) {
        var newItem = new Item(this.page, this.data, this.tokenTypes, this.uuid);
        newItem.tokenTypes.push(tokenType);
        return newItem;
    };
    Item.prototype.withTokenTypes = function (tokenTypes) {
        var newItem = new Item(this.page, this.data, this.tokenTypes, this.uuid);
        tokenTypes.forEach(function (tt) { return newItem.tokenTypes.push(tt); });
        return newItem;
    };
    Item.prototype.withDataAddition = function (data) {
        return this.withData(__assign(__assign({}, this.data), data));
    };
    Item.prototype.withData = function (data) {
        return new Item(this.page, data, this.tokenTypes, this.uuid);
    };
    /**
     * Returns the item without a uuid.
     */
    Item.prototype.withoutUuid = function () {
        return new Item(this.page, this.data, this.tokenTypes, '');
    };
    return Item;
}());
exports["default"] = Item;
