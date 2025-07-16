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
var groupingUtils_1 = require("../support/groupingUtils");
var items_1 = require("../support/items");
var stringFunctions_1 = require("../support/stringFunctions");
var DetectListItems = /** @class */ (function (_super) {
    __extends(DetectListItems, _super);
    function DetectListItems() {
        return _super.call(this, 'Detect List Items', 'Detect Lists with nesting', {
            requireColumns: ['str'],
            debug: {
                // showAll: true,
                itemMerger: new LineItemMerger_1["default"](false)
            }
        }) || this;
    }
    DetectListItems.prototype.transform = function (context, inputItems) {
        var foundListItems = 0;
        var foundNumberedItems = 0;
        var uuidsToType = new Map();
        (0, groupingUtils_1.groupByLine)(inputItems).forEach(function (lineItems) {
            var types = lineItems[0].data['types'];
            if (!types) {
                var firstText = lineItems[0].data['str'];
                if ((0, stringFunctions_1.isListItemCharacter)(firstText)) {
                    foundListItems++;
                    lineItems.forEach(function (i) { return uuidsToType.set(i.uuid, 'LIST'); });
                }
                else if ((0, stringFunctions_1.isNumberedListItem)(firstText)) {
                    foundNumberedItems++;
                    lineItems.forEach(function (i) { return uuidsToType.set(i.uuid, 'NUMBERED_LIST'); });
                }
            }
        });
        return {
            items: inputItems.map(function (item) {
                var listType = uuidsToType.get(item.uuid);
                if (listType) {
                    return (0, items_1.itemWithType)(item, listType);
                }
                return item;
            }),
            messages: ["Detected ".concat(foundListItems, " list items"), "Detected ".concat(foundNumberedItems, " numbered list items")]
        };
    };
    return DetectListItems;
}(ItemTransformer_1["default"]));
exports["default"] = DetectListItems;
