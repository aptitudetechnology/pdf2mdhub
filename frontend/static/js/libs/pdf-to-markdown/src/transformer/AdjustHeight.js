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
var groupingUtils_1 = require("../support/groupingUtils");
var AdjustHeight = /** @class */ (function (_super) {
    __extends(AdjustHeight, _super);
    function AdjustHeight() {
        return _super.call(this, 'Adjust Heights', 'Corrects height with help of the page viewport', {
            requireColumns: ['transform', 'height']
        }) || this;
    }
    AdjustHeight.prototype.transform = function (context, inputItems) {
        var correctedHeights = 0;
        return {
            items: (0, groupingUtils_1.transformGroupedByPage)(inputItems, function (page, items) {
                var pageViewport = context.pageViewports[page];
                return items.map(function (item) {
                    var itemTransform = item.data['transform'];
                    var itemHeight = item.data['height'];
                    var tx = pageViewport.transformFunction(itemTransform);
                    var fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
                    var dividedHeight = itemHeight / fontHeight;
                    var newHeight = Number.isNaN(dividedHeight) || dividedHeight <= 1 ? itemHeight : dividedHeight;
                    if (newHeight === itemHeight) {
                        return item;
                    }
                    else {
                        correctedHeights++;
                        return item.withDataAddition({ height: newHeight });
                    }
                });
            }),
            messages: ["".concat(correctedHeights, " corrected heights")]
        };
    };
    return AdjustHeight;
}(ItemTransformer_1["default"]));
exports["default"] = AdjustHeight;
