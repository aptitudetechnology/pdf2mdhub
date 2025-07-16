"use strict";
exports.__esModule = true;
var groupingUtils_1 = require("./groupingUtils");
var PageFactorFinder = /** @class */ (function () {
    function PageFactorFinder() {
    }
    PageFactorFinder.prototype.find = function (containers, extractor, config) {
        if (config === void 0) { config = { sampleCount: 20, minFulfillment: 0.8 }; }
        var containerAnalyzeCount = Math.min(config.sampleCount, containers.length);
        var start = Math.max(containers.length / 2 - containerAnalyzeCount / 2, 0); //start somewhere in the middle
        var pageNumbers = containers
            .slice(start, start + containerAnalyzeCount)
            .map(function (container) { return extractor(container); })
            .map(function (extract) { return extract.numbers.map(function (num) { return num - extract.index; }).filter(groupingUtils_1.onlyUniques); });
        var distanceCounts = pageNumbers.reduce(function (map, indexDistancesPerPage) {
            indexDistancesPerPage.forEach(function (indexDistance) {
                map[indexDistance] = (map[indexDistance] || 0) + 1;
            });
            return map;
        }, {});
        var hits = Object.keys(distanceCounts)
            .filter(function (distance) { return distanceCounts[distance] / containerAnalyzeCount >= config.minFulfillment; })
            .sort(function (d1, d2) { return distanceCounts[d1] - distanceCounts[d2]; });
        // for all remaining index distance arrays - check y coordinates
        if (hits.length < 1) {
            return undefined;
        }
        return Number.parseInt(hits[0]);
    };
    return PageFactorFinder;
}());
exports["default"] = PageFactorFinder;
