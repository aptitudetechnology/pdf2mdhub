"use strict";
exports.__esModule = true;
/**
 * Multi-stage progress. Progress is expressed in a number between 0 and 1.
 */
var Progress = /** @class */ (function () {
    function Progress(stages, weights) {
        if (weights === void 0) { weights = []; }
        this.stages = stages;
        this.stageDetails = new Array(stages.length);
        this.stageProgress = new Array(stages.length).fill(0);
        if (weights.length === 0) {
            this.stageWeights = new Array(stages.length).fill(1 / stages.length);
        }
        else {
            if (weights.length !== stages.length)
                throw new Error("Provided only ".concat(weights.length, " weights but expected ").concat(stages.length, " for ").concat(stages.length, " stages"));
            var weightsSummed = weights.reduce(function (sum, weight) { return +(sum + weight).toFixed(12); }, 0);
            if (weightsSummed !== 1)
                throw new Error("Weights [".concat(weights.join(', '), "] should sum up to 1, but did to ").concat(weightsSummed));
            this.stageWeights = weights;
        }
    }
    Progress.prototype.isComplete = function (stageIndex) {
        return this.stageProgress[stageIndex] === 1;
    };
    Progress.prototype.isProgressing = function (stageIndex) {
        var previousComplete = stageIndex === 0 || this.isComplete(stageIndex - 1);
        return previousComplete && this.stageProgress[stageIndex] < 1;
    };
    Progress.prototype.totalProgress = function () {
        var _this = this;
        var stageCount = this.stages.length;
        var stageProgressSummed = this.stageProgress.reduce(function (sum, stageProgress, index) { return sum + stageProgress * _this.stageWeights[index] * _this.stages.length; }, 0);
        return stageProgressSummed / stageCount;
    };
    return Progress;
}());
exports["default"] = Progress;
