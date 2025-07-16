"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.transform = exports.verifyRequiredColumns = exports.convert = exports.parseAndTransform = void 0;
var Globals_1 = require("./Globals");
var ParseProgressReporter_1 = require("./ParseProgressReporter");
var assert_1 = require("./assert");
var TransformContext_1 = require("./transformer/TransformContext");
var defaultOptions = {
    debug: false,
    progressListener: function () { }
};
function parseAndTransform(src, parser, transformers, progressListener) {
    return __awaiter(this, void 0, void 0, function () {
        var parseResult, transformedItems;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, parseAndVerifyTransformers(src, parser, transformers, progressListener)];
                case 1:
                    parseResult = _a.sent();
                    transformedItems = transform(parseResult, transformers);
                    return [2 /*return*/, Promise.resolve({
                            convert: function (converter) { return converter.convert(transformedItems); }
                        })];
            }
        });
    });
}
exports.parseAndTransform = parseAndTransform;
function convert(src, parser, transformers, converter, options) {
    if (options === void 0) { options = defaultOptions; }
    return __awaiter(this, void 0, void 0, function () {
        var parseResult, items, globals, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, parser.parse(src, new ParseProgressReporter_1["default"](options.progressListener))];
                case 1:
                    parseResult = _a.sent();
                    verifyRequiredColumns(parseResult.schema, transformers);
                    items = parseResult.items;
                    globals = new Globals_1["default"]();
                    context = new TransformContext_1["default"](parseResult.fontMap, parseResult.pageViewports, globals);
                    transformers.forEach(function (transformer) {
                        var result = transformer.transform(context, items);
                        globals = globals.withValues(result.globals);
                        items = result.items;
                    });
                    // convert
                    return [2 /*return*/, converter.convert(items)];
            }
        });
    });
}
exports.convert = convert;
function parseAndVerifyTransformers(src, parser, transformers, progressListener) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, parser.parse(src, new ParseProgressReporter_1["default"](progressListener)).then(function (parseResult) {
                    verifyRequiredColumns(parseResult.schema, transformers);
                    return parseResult;
                })];
        });
    });
}
/**
 * Goes through all transformer and makes sure each required column is available in its predecessor schema.
 *
 * @param inputSchema
 * @param transformers
 */
function verifyRequiredColumns(inputSchema, transformers) {
    var _a;
    var schemas = [inputSchema];
    var _loop_1 = function (idx) {
        var transformer = transformers[idx];
        var predecessorSchema = schemas[idx];
        (_a = transformer.descriptor.requireColumns) === null || _a === void 0 ? void 0 : _a.forEach(function (column) {
            (0, assert_1.assert)(predecessorSchema.includes(column), "Input schema [".concat(predecessorSchema.join(', '), "] for transformer '").concat(transformer.name, "' does not contain the required column '").concat(column, "'"));
        });
        var outputSchema = transformer.schemaTransformer(predecessorSchema);
        schemas.push(outputSchema);
    };
    for (var idx = 0; idx < transformers.length; idx++) {
        _loop_1(idx);
    }
}
exports.verifyRequiredColumns = verifyRequiredColumns;
function transform(parseResult, transformers) {
    var items = parseResult.items;
    var globals = new Globals_1["default"]();
    var context = new TransformContext_1["default"](parseResult.fontMap, parseResult.pageViewports, globals);
    transformers.forEach(function (transformer) {
        var result = transformer.transform(context, items);
        globals = globals.withValues(result.globals);
        items = result.items;
    });
    return items;
}
exports.transform = transform;
