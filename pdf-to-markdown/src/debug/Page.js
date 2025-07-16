"use strict";
exports.__esModule = true;
exports.asPages = void 0;
var groupingUtils_1 = require("../support/groupingUtils");
var ItemGroup_1 = require("./ItemGroup");
function asPages(evaluationTracker, changeTracker, schema, items, itemMerger) {
    return (0, groupingUtils_1.groupByPage)(items).map(function (pageItems) {
        var itemGroups;
        if (itemMerger) {
            itemGroups = (0, groupingUtils_1.groupByElement)(pageItems, itemMerger.groupKey).map(function (groupItems) {
                if (groupItems.length > 1) {
                    var top_1 = itemMerger.merge(evaluationTracker, changeTracker, schema, groupItems);
                    return new ItemGroup_1["default"](top_1, groupItems);
                }
                else {
                    return new ItemGroup_1["default"](groupItems[0]);
                }
            });
        }
        else {
            itemGroups = pageItems.map(function (item) { return new ItemGroup_1["default"](item); });
        }
        return { index: pageItems[0].page, itemGroups: itemGroups };
    });
}
exports.asPages = asPages;
