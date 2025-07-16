"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var TransformContext_1 = require("./transformer/TransformContext");
var StageResult_1 = require("./debug/StageResult");
var ColumnAnnotation_1 = require("./debug/ColumnAnnotation");
var detectChanges_1 = require("./debug/detectChanges");
var Page_1 = require("./debug/Page");
var EvaluationTracker_1 = require("./debug/EvaluationTracker");
var ChangeTracker_1 = require("./debug/ChangeTracker");
var Globals_1 = require("./Globals");
// TODO only cache the parse ?
var Debugger = /** @class */ (function () {
    function Debugger(fontMap, pageViewports, pageCount, inputSchema, inputItems, transformers) {
        this.fontMap = fontMap;
        this.pageViewports = pageViewports;
        this.pageCount = pageCount;
        this.transformers = transformers;
        this.stageNames = __spreadArray(['Parse Result'], transformers.map(function (t) { return t.name; }), true);
        this.stageDescriptions = __spreadArray(['Initial items as parsed by PDFjs'], transformers.map(function (t) { return t.description; }), true);
        this.stageResultCache = [(0, StageResult_1.initialStage)(inputSchema, inputItems)];
    }
    Debugger.prototype.stageResult = function (stageIndex) {
        var _a;
        for (var idx = 0; idx < stageIndex + 1; idx++) {
            if (!this.stageResultCache[idx]) {
                var evaluations = new EvaluationTracker_1["default"]();
                var transformer = this.transformers[idx - 1];
                var previousStageResult = this.stageResultCache[idx - 1];
                var context = new TransformContext_1["default"](this.fontMap, this.pageViewports, previousStageResult.globals, evaluations);
                var previousItems = previousStageResult.itemsCleanedAndUnpacked();
                var inputSchema = toSimpleSchema(previousStageResult);
                var outputSchema = transformer.schemaTransformer(inputSchema);
                var itemResult = transformer.transform(context, __spreadArray([], previousItems, true));
                var globals = new Globals_1["default"](previousStageResult.globals).withValues(itemResult.globals);
                var changes = new ChangeTracker_1["default"]();
                var items = (0, detectChanges_1.detectChanges)(changes, previousItems, itemResult.items);
                var pages = (0, Page_1.asPages)(evaluations, changes, outputSchema, items, (_a = transformer.descriptor.debug) === null || _a === void 0 ? void 0 : _a.itemMerger);
                var messages = itemResult.messages;
                if (changes.changeCount() > 0 && messages.length === 0) {
                    messages.unshift("Detected ".concat(changes.changeCount(), " changes"));
                }
                this.stageResultCache.push(new StageResult_1["default"](globals, transformer.descriptor, toAnnotatedSchema(inputSchema, outputSchema), pages, evaluations, changes, messages));
            }
        }
        return this.stageResultCache[stageIndex];
    };
    return Debugger;
}());
exports["default"] = Debugger;
function toSimpleSchema(stageResult) {
    return stageResult.schema
        .filter(function (column) { return !column.annotation || column.annotation !== ColumnAnnotation_1["default"].REMOVED; })
        .map(function (column) { return column.name; });
}
function toAnnotatedSchema(inputSchema, outputSchema) {
    var annotatedSchema = [];
    var out_idx = 0;
    for (var in_idx = 0; in_idx < inputSchema.length; in_idx++) {
        var nextInputColumn = inputSchema[in_idx];
        var indexInOut = outputSchema.indexOf(nextInputColumn);
        if (indexInOut === -1) {
            annotatedSchema.push({ name: nextInputColumn, annotation: ColumnAnnotation_1["default"].REMOVED });
        }
        else if (indexInOut > out_idx) {
            while (out_idx < indexInOut) {
                annotatedSchema.push({ name: outputSchema[out_idx], annotation: ColumnAnnotation_1["default"].ADDED });
                out_idx++;
            }
            annotatedSchema.push({ name: nextInputColumn });
            out_idx++;
        }
        else {
            annotatedSchema.push({ name: nextInputColumn });
            out_idx++;
        }
    }
    for (var index = out_idx; index < outputSchema.length; index++) {
        annotatedSchema.push({ name: outputSchema[index], annotation: ColumnAnnotation_1["default"].ADDED });
    }
    return annotatedSchema;
}
