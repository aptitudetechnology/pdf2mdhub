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
var items_1 = require("../support/items");
var FontType_1 = require("../FontType");
var DetectFontStyles = /** @class */ (function (_super) {
    __extends(DetectFontStyles, _super);
    function DetectFontStyles() {
        return _super.call(this, 'Detect Font Styles', 'Detect occurrences of bold and italic tokens', {
            requireColumns: ['str'],
            debug: {
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }) || this;
    }
    DetectFontStyles.prototype.transform = function (context, inputItems) {
        return {
            items: inputItems.map(function (item) {
                var fontStyles = (0, FontType_1.declaredFontTypes)((0, items_1.getFontName)(context.fontMap, item));
                if (fontStyles.length > 0) {
                    return item.withTokenTypes(fontStyles);
                }
                return item;
            }),
            messages: ["Detected ".concat('?', " font styles.")]
        };
    };
    return DetectFontStyles;
}(ItemTransformer_1["default"]));
exports["default"] = DetectFontStyles;
