"use strict";
exports.__esModule = true;
var EvaluationTracker = /** @class */ (function () {
    function EvaluationTracker() {
        this.evaluations = new Map();
        this.scored = false;
    }
    EvaluationTracker.prototype.evaluationCount = function () {
        return this.evaluations.size;
    };
    EvaluationTracker.prototype.hasScores = function () {
        return this.scored;
    };
    EvaluationTracker.prototype.evaluated = function (item) {
        return this.evaluations.has(item.uuid);
    };
    EvaluationTracker.prototype.evaluationScore = function (item) {
        return this.evaluations.get(item.uuid);
    };
    EvaluationTracker.prototype.trackEvaluation = function (item, score) {
        if (score === void 0) { score = undefined; }
        if (typeof score !== 'undefined') {
            this.scored = true;
        }
        this.evaluations.set(item.uuid, score);
    };
    return EvaluationTracker;
}());
exports["default"] = EvaluationTracker;
