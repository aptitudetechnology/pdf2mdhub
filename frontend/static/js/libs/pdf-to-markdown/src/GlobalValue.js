"use strict";
exports.__esModule = true;
var GlobalValue = /** @class */ (function () {
    function GlobalValue(definition, value, override) {
        if (override === void 0) { override = false; }
        this.definition = definition;
        this.value = value;
        this.override = override;
    }
    return GlobalValue;
}());
exports["default"] = GlobalValue;
