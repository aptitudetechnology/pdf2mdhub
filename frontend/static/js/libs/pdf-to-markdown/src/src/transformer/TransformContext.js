"use strict";
exports.__esModule = true;
var EvaluationTracker_1 = require("../debug/EvaluationTracker");
var TransformContext = /** @class */ (function () {
    function TransformContext(fontMap, pageViewports, globals, evaluations) {
        if (evaluations === void 0) { evaluations = new EvaluationTracker_1["default"](); }
        this.fontMap = fontMap;
        this.pageViewports = pageViewports;
        this.globals = globals;
        this.evaluations = evaluations;
        this.pageCount = pageViewports.length;
    }
    TransformContext.prototype.trackEvaluation = function (item, score) {
        if (score === void 0) { score = undefined; }
        this.evaluations.trackEvaluation(item, score);
    };
    TransformContext.prototype.globalIsDefined = function (definition) {
        return this.globals.isDefined(definition);
    };
    TransformContext.prototype.getGlobal = function (definition) {
        return this.globals.get(definition);
    };
    TransformContext.prototype.getGlobalOptionally = function (definition) {
        return this.globals.getOptional(definition);
    };
    return TransformContext;
}());
exports["default"] = TransformContext;
