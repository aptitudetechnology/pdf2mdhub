"use strict";
exports.__esModule = true;
exports.detectChanges = void 0;
var groupingUtils_1 = require("../support/groupingUtils");
var functional_1 = require("../support/functional");
/**
 * Compares incomming and outgoing items of a transformer in order to detect changes and to display them in any debug visualization.
 * Note: ItemMerger registers changes as well.
 */
function detectChanges(tracker, inputItems, outputItems) {
    var oututItemsByPage = (0, groupingUtils_1.groupByPage)(outputItems).reduce(function (map, pageItems) {
        map.set(pageItems[0].page, pageItems);
        return map;
    }, new Map());
    var mergedItems = [];
    (0, groupingUtils_1.groupByPage)(inputItems).forEach(function (inputPageItems) {
        var page = inputPageItems[0].page;
        var outputPageItems = oututItemsByPage.get(page) || [];
        mergedItems.push.apply(mergedItems, detectPageChanges(tracker, inputPageItems, outputPageItems));
    });
    return mergedItems;
}
exports.detectChanges = detectChanges;
function detectPageChanges(tracker, inputItems, outputItems) {
    var mergedItems = [];
    var addedItems = new Set();
    var removals = 0;
    var additions = 0;
    var outputIndex = 0;
    var _loop_1 = function (inputIdx) {
        var inputItem = inputItems[inputIdx];
        // In case the input item has already been added from the outputs items array
        if (addedItems.has(inputItem.uuid)) {
            return "continue";
        }
        var positionInOutput = outputItems.findIndex(function (item) { return item.uuid === inputItem.uuid; });
        if (positionInOutput < 0) {
            // Input doesn't exist in the output anymore
            tracker.trackRemoval(inputItem);
            mergedItems.push(inputItem);
            addedItems.add(inputItem.uuid);
            removals++;
        }
        else if (positionInOutput === inputIdx + additions - removals) {
            // Input is in output with no positional change
            mergedItems.push(outputItems[positionInOutput]);
            addedItems.add(outputItems[positionInOutput].uuid);
            outputIndex++;
            // But with type change (TODO generalize ?)
            var typesInInput = inputItem.data['types'];
            var typesInOutput = outputItems[positionInOutput].data['types'];
            if ((typesInInput || typesInOutput) && !(0, functional_1.arraysEqual)(typesInInput, typesInOutput)) {
                tracker.trackContentChange(inputItem);
            }
            if (!(0, functional_1.arraysEqual)(inputItem.tokenTypes, outputItems[positionInOutput].tokenTypes)) {
                tracker.trackContentChange(inputItem);
            }
        }
        else {
            var _loop_2 = function (intermediateOutputIdx) {
                var outputItem = outputItems[intermediateOutputIdx];
                var positionInInput = inputItems.findIndex(function (item) { return item.uuid === outputItem.uuid; });
                if (positionInInput < 0) {
                    tracker.trackAddition(outputItem);
                    mergedItems.push(outputItem);
                    addedItems.add(outputItem.uuid);
                    additions++;
                    outputIndex++;
                }
                else {
                    tracker.trackPositionalChange(outputItem, positionInInput - removals, intermediateOutputIdx - additions);
                    mergedItems.push(outputItem);
                    addedItems.add(outputItem.uuid);
                    outputIndex++;
                }
            };
            // Handle items from the output with arn't in the input array
            for (var intermediateOutputIdx = outputIndex; intermediateOutputIdx < positionInOutput; intermediateOutputIdx++) {
                _loop_2(intermediateOutputIdx);
            }
            tracker.trackPositionalChange(outputItems[positionInOutput], inputIdx - removals, positionInOutput - additions);
            mergedItems.push(outputItems[positionInOutput]);
            addedItems.add(outputItems[positionInOutput].uuid);
            outputIndex++;
            //TODO check for content change ?
        }
    };
    for (var inputIdx = 0; inputIdx < inputItems.length; inputIdx++) {
        _loop_1(inputIdx);
    }
    for (var remaingOutputIndex = outputIndex; remaingOutputIndex < outputItems.length; remaingOutputIndex++) {
        tracker.trackAddition(outputItems[remaingOutputIndex]);
        mergedItems.push(outputItems[remaingOutputIndex]);
        additions++;
    }
    return mergedItems;
}
