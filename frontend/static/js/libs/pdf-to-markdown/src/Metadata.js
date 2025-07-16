"use strict";
exports.__esModule = true;
var Metadata = /** @class */ (function () {
    function Metadata(original) {
        this.original = original;
    }
    Metadata.prototype.title = function () {
        return this.extract('Title', 'dc:title');
    };
    Metadata.prototype.author = function () {
        return this.extract('Author', 'dc:creator');
    };
    Metadata.prototype.extract = function (infoName, metadataKey) {
        var metadata = this.original['metadata'];
        if (metadata) {
            return metadata.get(metadataKey);
        }
        return this.original['info'][infoName];
    };
    return Metadata;
}());
exports["default"] = Metadata;
