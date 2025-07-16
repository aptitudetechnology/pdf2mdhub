"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.initialStage = void 0;
var TransformDescriptor_1 = require("../TransformDescriptor");
var PdfParser_1 = require("../PdfParser");
var Page_1 = require("./Page");
var ChangeTracker_1 = require("./ChangeTracker");
var ItemGroup_1 = require("./ItemGroup");
var EvaluationTracker_1 = require("./EvaluationTracker");
var Globals_1 = require("../Globals");
var StageResult = /** @class */ (function () {
    function StageResult(globals, descriptor, schema, pages, evaluations, changes, messages) {
        this.globals = globals;
        this.descriptor = descriptor;
        this.schema = schema;
        this.pages = pages;
        this.evaluations = evaluations;
        this.changes = changes;
        this.messages = messages;
    }
    StageResult.prototype.itemsUnpacked = function () {
        return this.pages.reduce(function (items, page) {
            page.itemGroups.forEach(function (itemGroup) { return itemGroup.unpacked().forEach(function (item) { return items.push(item); }); });
            return items;
        }, []);
    };
    StageResult.prototype.itemsCleanedAndUnpacked = function () {
        var _this = this;
        return this.pages.reduce(function (items, page) {
            page.itemGroups.forEach(function (itemGroup) {
                return itemGroup
                    .unpacked()
                    .filter(function (item) { return !_this.changes.isRemoved(item); })
                    .forEach(function (item) { return items.push(item); });
            });
            return items;
        }, []);
    };
    StageResult.prototype.selectPages = function (relevantChangesOnly, groupItems) {
        var _this = this;
        var _a, _b, _c;
        var result;
        // Ungroup pages
        if (!groupItems && ((_b = (_a = this.descriptor) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.itemMerger)) {
            result = this.pagesWithUnpackedItems();
        }
        else {
            result = this.pages;
        }
        // Filter out item (groups) with no changes
        if (relevantChangesOnly && !((_c = this.descriptor.debug) === null || _c === void 0 ? void 0 : _c.showAll) === true) {
            result = result.map(function (page) {
                return (__assign(__assign({}, page), { itemGroups: page.itemGroups.filter(function (itemGroup) { return _this.evaluations.evaluated(itemGroup.top) || _this.changes.hasChanged(itemGroup.top); }) }));
            });
        }
        return result;
    };
    StageResult.prototype.pagesWithUnpackedItems = function () {
        return this.pages.map(function (page) {
            var _a;
            return (__assign(__assign({}, page), { itemGroups: (_a = new Array()).concat.apply(_a, page.itemGroups.map(function (itemGroup) { return itemGroup.unpacked().map(function (item) { return new ItemGroup_1["default"](item); }); })) }));
        });
    };
    return StageResult;
}());
exports["default"] = StageResult;
function initialStage(inputSchema, inputItems) {
    var schema = inputSchema.map(function (column) { return ({ name: column }); });
    var evaluations = new EvaluationTracker_1["default"]();
    var changes = new ChangeTracker_1["default"]();
    var pages = (0, Page_1.asPages)(evaluations, changes, PdfParser_1.PARSE_SCHEMA, inputItems);
    var messages = [
        "Parsed ".concat(inputItems.length === 0 ? 0 : inputItems[inputItems.length - 1].page + 1, " pages with ").concat(inputItems.length, " items"),
    ];
    return new StageResult(new Globals_1["default"](), (0, TransformDescriptor_1.toDescriptor)({ debug: { showAll: true } }), schema, pages, evaluations, changes, messages);
}
exports.initialStage = initialStage;
