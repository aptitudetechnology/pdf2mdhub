"use strict";
exports.__esModule = true;
var ChangeIndex_1 = require("./ChangeIndex");
var assert_1 = require("../assert");
var ADDITION = new ChangeIndex_1.Addition();
var REMOVAL = new ChangeIndex_1.Removal();
var CONTENT_CHANGE = new ChangeIndex_1.ContentChange();
var ChangeTracker = /** @class */ (function () {
    function ChangeTracker() {
        this.changes = new Map();
    }
    ChangeTracker.prototype.addChange = function (item, change) {
        var uuid = item.uuid;
        (0, assert_1.assertNot)(this.changes.has(uuid), "Change for item ".concat(uuid, " already defined! (old: ").concat(JSON.stringify(this.changes.get(uuid)), ", new: ").concat(JSON.stringify(change), ")"));
        this.changes.set(uuid, change);
    };
    ChangeTracker.prototype.changeCount = function () {
        return this.changes.size;
    };
    ChangeTracker.prototype.trackAddition = function (item) {
        this.addChange(item, ADDITION);
    };
    ChangeTracker.prototype.trackRemoval = function (item) {
        this.addChange(item, REMOVAL);
    };
    ChangeTracker.prototype.trackPositionalChange = function (item, oldPosition, newPosition) {
        var direction = newPosition > oldPosition ? ChangeIndex_1.Direction.DOWN : ChangeIndex_1.Direction.UP;
        var amount = Math.abs(newPosition - oldPosition);
        if (amount > 0) {
            this.addChange(item, new ChangeIndex_1.PositionChange(direction, amount));
        }
    };
    ChangeTracker.prototype.trackContentChange = function (item) {
        this.addChange(item, CONTENT_CHANGE);
    };
    ChangeTracker.prototype.change = function (item) {
        return this.changes.get(item.uuid);
    };
    ChangeTracker.prototype.hasChanged = function (item) {
        return this.changes.has(item.uuid);
    };
    ChangeTracker.prototype.isPlusChange = function (item) {
        var _a;
        return ((_a = this.change(item)) === null || _a === void 0 ? void 0 : _a.category) === ChangeIndex_1.ChangeCategory.PLUS;
    };
    ChangeTracker.prototype.isNeutralChange = function (item) {
        var _a;
        return ((_a = this.change(item)) === null || _a === void 0 ? void 0 : _a.category) === ChangeIndex_1.ChangeCategory.NEUTRAL;
    };
    ChangeTracker.prototype.isMinusChange = function (item) {
        var _a;
        return ((_a = this.change(item)) === null || _a === void 0 ? void 0 : _a.category) === ChangeIndex_1.ChangeCategory.MINUS;
    };
    ChangeTracker.prototype.isRemoved = function (item) {
        var _a;
        return ((_a = this.change(item)) === null || _a === void 0 ? void 0 : _a.constructor.name) === REMOVAL.constructor.name;
    };
    return ChangeTracker;
}());
exports["default"] = ChangeTracker;
