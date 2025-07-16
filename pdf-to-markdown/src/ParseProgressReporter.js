"use strict";
exports.__esModule = true;
var Progress_1 = require("./Progress");
var ParseProgressReporter = /** @class */ (function () {
    function ParseProgressReporter(progressListenFunction) {
        this.progress = new Progress_1["default"](['Document Header', 'Metadata', 'Pages', 'Fonts'], [0.01, 0.01, 0.97, 0.01]);
        this.pagesToParse = 0;
        this.progressListenFunction = progressListenFunction;
    }
    ParseProgressReporter.prototype.parsedDocumentHeader = function (numberOfPages) {
        this.pagesToParse = numberOfPages;
        this.progress.stageProgress[0] = 1;
        this.progress.stageDetails[2] = "0 / ".concat(numberOfPages);
        this.progressListenFunction(this.progress);
    };
    ParseProgressReporter.prototype.parsedMetadata = function () {
        this.progress.stageProgress[1] = 1;
        this.progressListenFunction(this.progress);
    };
    ParseProgressReporter.prototype.parsedPage = function (index) {
        var pagesParsed = index + 1;
        this.progress.stageProgress[2] = pagesParsed / this.pagesToParse;
        this.progress.stageDetails[2] = "".concat(pagesParsed, " / ").concat(this.pagesToParse);
        this.progressListenFunction(this.progress);
    };
    ParseProgressReporter.prototype.parsedFonts = function () {
        this.progress.stageProgress[3] = 1;
        this.progressListenFunction(this.progress);
    };
    return ParseProgressReporter;
}());
exports["default"] = ParseProgressReporter;
