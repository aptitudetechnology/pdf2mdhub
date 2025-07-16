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
var NoOpTransformer = /** @class */ (function (_super) {
    __extends(NoOpTransformer, _super);
    function NoOpTransformer() {
        return _super.call(this, 'Does nothing', 'Simply for displaying the results.', {
            debug: {
                showAll: true
            }
        }) || this;
    }
    NoOpTransformer.prototype.transform = function (_, inputItems) {
        return {
            items: inputItems,
            messages: []
        };
    };
    return NoOpTransformer;
}(ItemTransformer_1["default"]));
exports["default"] = NoOpTransformer;
