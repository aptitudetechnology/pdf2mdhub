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
var LineItemMerger_1 = require("../debug/LineItemMerger");
var DetectLinks = /** @class */ (function (_super) {
    __extends(DetectLinks, _super);
    function DetectLinks() {
        return _super.call(this, 'Detect Links', 'Detect occurrences http links', {
            requireColumns: ['str'],
            debug: {
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }) || this;
    }
    DetectLinks.prototype.transform = function (context, inputItems) {
        return {
            // TODO this is missing links which are just part of an item
            items: inputItems.map(function (item) {
                var itemText = item.data['str'];
                if (itemText.startsWith('http:') || itemText.startsWith('www.')) {
                    // wordString = `http://${wordString}`; TODO www version
                    return item.withTokenTypes(['LINK']);
                }
                return item;
            }),
            messages: ["Detected ".concat('?', " links.")]
        };
    };
    return DetectLinks;
}(ItemTransformer_1["default"]));
exports["default"] = DetectLinks;
