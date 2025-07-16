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
exports.PositionChange = exports.Direction = exports.ContentChange = exports.Removal = exports.Addition = exports.ChangeCategory = exports.Change = void 0;
var Change = /** @class */ (function () {
    function Change(category) {
        this.category = category;
    }
    return Change;
}());
exports.Change = Change;
// This is merely for coloring different kind of changes
var ChangeCategory;
(function (ChangeCategory) {
    ChangeCategory["PLUS"] = "PLUS";
    ChangeCategory["MINUS"] = "MINUS";
    ChangeCategory["NEUTRAL"] = "NEUTRAL";
})(ChangeCategory = exports.ChangeCategory || (exports.ChangeCategory = {}));
var Addition = /** @class */ (function (_super) {
    __extends(Addition, _super);
    function Addition() {
        return _super.call(this, ChangeCategory.PLUS) || this;
    }
    return Addition;
}(Change));
exports.Addition = Addition;
var Removal = /** @class */ (function (_super) {
    __extends(Removal, _super);
    function Removal() {
        return _super.call(this, ChangeCategory.MINUS) || this;
    }
    return Removal;
}(Change));
exports.Removal = Removal;
var ContentChange = /** @class */ (function (_super) {
    __extends(ContentChange, _super);
    function ContentChange() {
        return _super.call(this, ChangeCategory.NEUTRAL) || this;
    }
    return ContentChange;
}(Change));
exports.ContentChange = ContentChange;
var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
})(Direction = exports.Direction || (exports.Direction = {}));
var PositionChange = /** @class */ (function (_super) {
    __extends(PositionChange, _super);
    function PositionChange(direction, amount) {
        var _this = _super.call(this, direction === Direction.UP ? ChangeCategory.PLUS : ChangeCategory.MINUS) || this;
        _this.direction = direction;
        _this.amount = amount;
        return _this;
    }
    return PositionChange;
}(Change));
exports.PositionChange = PositionChange;
