"use strict";
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
var assert_1 = require("./assert");
var Globals = /** @class */ (function () {
    function Globals(globals) {
        this.map = globals ? new Map(globals.map) : new Map();
    }
    Globals.prototype.keys = function () {
        return __spreadArray([], this.map.keys(), true);
    };
    Globals.prototype.isDefined = function (definition) {
        return typeof this.map.get(definition.key) !== 'undefined';
    };
    Globals.prototype.get = function (definition) {
        var element = this.map.get(definition.key);
        (0, assert_1.assertDefined)(element, "No global with key '".concat(definition.key, "' registered. Only [").concat(__spreadArray([], this.map.keys(), true).join(','), "]"));
        return element;
    };
    Globals.prototype.getOptional = function (definition) {
        return this.map.get(definition.key);
    };
    Globals.prototype.set = function (definition, value) {
        (0, assert_1.assertNot)(this.isDefined(definition), "Global with key '".concat(definition.key, "' already registered."));
        this.map.set(definition.key, value);
    };
    Globals.prototype.override = function (definition, value) {
        this.map.set(definition.key, value);
    };
    Globals.prototype.withValues = function (values) {
        var _this = this;
        values === null || values === void 0 ? void 0 : values.forEach(function (value) {
            if (value.override) {
                _this.override(value.definition, value.value);
            }
            else {
                _this.set(value.definition, value.value);
            }
        });
        return this;
    };
    return Globals;
}());
exports["default"] = Globals;
