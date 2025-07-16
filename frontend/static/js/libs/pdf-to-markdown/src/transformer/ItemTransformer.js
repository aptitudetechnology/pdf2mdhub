"use strict";
exports.__esModule = true;
var TransformDescriptor_1 = require("../TransformDescriptor");
var ItemTransformer = /** @class */ (function () {
    function ItemTransformer(name, description, descriptorPartial, schemaTransformer) {
        if (schemaTransformer === void 0) { schemaTransformer = function (schema) { return schema; }; }
        this.name = name;
        this.description = description;
        this.descriptor = (0, TransformDescriptor_1.toDescriptor)(descriptorPartial);
        this.schemaTransformer = schemaTransformer;
    }
    return ItemTransformer;
}());
exports["default"] = ItemTransformer;
