"use strict";
exports.__esModule = true;
var GlobalValue_1 = require("./GlobalValue");
var GlobalDefinition = /** @class */ (function () {
    function GlobalDefinition(key) {
        this.key = key;
    }
    GlobalDefinition.prototype.value = function (value) {
        return new GlobalValue_1["default"](this, value);
    };
    GlobalDefinition.prototype.overrideValue = function (value) {
        return new GlobalValue_1["default"](this, value, true);
    };
    return GlobalDefinition;
}());
exports["default"] = GlobalDefinition;
