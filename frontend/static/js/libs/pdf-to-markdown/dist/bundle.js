"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b ||= {})
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/Progress.ts
  var Progress;
  var init_Progress = __esm({
    "src/Progress.ts"() {
      "use strict";
      Progress = class {
        constructor(stages, weights = []) {
          this.stages = stages;
          this.stageDetails = new Array(stages.length);
          this.stageProgress = new Array(stages.length).fill(0);
          if (weights.length === 0) {
            this.stageWeights = new Array(stages.length).fill(1 / stages.length);
          } else {
            if (weights.length !== stages.length)
              throw new Error(
                `Provided only ${weights.length} weights but expected ${stages.length} for ${stages.length} stages`
              );
            const weightsSummed = weights.reduce((sum, weight) => +(sum + weight).toFixed(12), 0);
            if (weightsSummed !== 1)
              throw new Error(`Weights [${weights.join(", ")}] should sum up to 1, but did to ${weightsSummed}`);
            this.stageWeights = weights;
          }
        }
        isComplete(stageIndex) {
          return this.stageProgress[stageIndex] === 1;
        }
        isProgressing(stageIndex) {
          const previousComplete = stageIndex === 0 || this.isComplete(stageIndex - 1);
          return previousComplete && this.stageProgress[stageIndex] < 1;
        }
        totalProgress() {
          const stageCount = this.stages.length;
          const stageProgressSummed = this.stageProgress.reduce(
            (sum, stageProgress, index) => sum + stageProgress * this.stageWeights[index] * this.stages.length,
            0
          );
          return stageProgressSummed / stageCount;
        }
      };
    }
  });

  // src/ParseProgressReporter.ts
  var ParseProgressReporter_exports = {};
  __export(ParseProgressReporter_exports, {
    default: () => ParseProgressReporter
  });
  var ParseProgressReporter;
  var init_ParseProgressReporter = __esm({
    "src/ParseProgressReporter.ts"() {
      "use strict";
      init_Progress();
      ParseProgressReporter = class {
        constructor(progressListenFunction) {
          this.progress = new Progress(["Document Header", "Metadata", "Pages", "Fonts"], [0.01, 0.01, 0.97, 0.01]);
          this.pagesToParse = 0;
          this.progressListenFunction = progressListenFunction;
        }
        parsedDocumentHeader(numberOfPages) {
          this.pagesToParse = numberOfPages;
          this.progress.stageProgress[0] = 1;
          this.progress.stageDetails[2] = `0 / ${numberOfPages}`;
          this.progressListenFunction(this.progress);
        }
        parsedMetadata() {
          this.progress.stageProgress[1] = 1;
          this.progressListenFunction(this.progress);
        }
        parsedPage(index) {
          const pagesParsed = index + 1;
          this.progress.stageProgress[2] = pagesParsed / this.pagesToParse;
          this.progress.stageDetails[2] = `${pagesParsed} / ${this.pagesToParse}`;
          this.progressListenFunction(this.progress);
        }
        parsedFonts() {
          this.progress.stageProgress[3] = 1;
          this.progressListenFunction(this.progress);
        }
      };
    }
  });

  // src/Item.ts
  var import_uuid, Item;
  var init_Item = __esm({
    "src/Item.ts"() {
      "use strict";
      import_uuid = __require("uuid");
      Item = class {
        constructor(page, data, tokenTypes = [], uuid = (0, import_uuid.v4)()) {
          this.listLevel = 0;
          this.tokenTypes = [];
          this.page = page;
          this.data = data;
          this.uuid = uuid;
          this.tokenTypes = tokenTypes;
        }
        value(column) {
          return this.data[column];
        }
        withTokenType(tokenType) {
          const newItem = new Item(this.page, this.data, this.tokenTypes, this.uuid);
          newItem.tokenTypes.push(tokenType);
          return newItem;
        }
        withTokenTypes(tokenTypes) {
          const newItem = new Item(this.page, this.data, this.tokenTypes, this.uuid);
          tokenTypes.forEach((tt) => newItem.tokenTypes.push(tt));
          return newItem;
        }
        withDataAddition(data) {
          return this.withData(__spreadValues(__spreadValues({}, this.data), data));
        }
        withData(data) {
          return new Item(this.page, data, this.tokenTypes, this.uuid);
        }
        /**
         * Returns the item without a uuid.
         */
        withoutUuid() {
          return new Item(this.page, this.data, this.tokenTypes, "");
        }
      };
    }
  });

  // src/Metadata.ts
  var Metadata;
  var init_Metadata = __esm({
    "src/Metadata.ts"() {
      "use strict";
      Metadata = class {
        constructor(original) {
          this.original = original;
        }
        title() {
          return this.extract("Title", "dc:title");
        }
        author() {
          return this.extract("Author", "dc:creator");
        }
        extract(infoName, metadataKey) {
          const metadata = this.original["metadata"];
          if (metadata) {
            return metadata.get(metadataKey);
          }
          return this.original["info"][infoName];
        }
      };
    }
  });

  // src/ParseResult.ts
  var ParseResult;
  var init_ParseResult = __esm({
    "src/ParseResult.ts"() {
      "use strict";
      ParseResult = class {
        constructor(fontMap, pageCount, pdfjsPages, pageViewports, metadata, schema, items) {
          this.fontMap = fontMap;
          this.pageCount = pageCount;
          this.pdfjsPages = pdfjsPages;
          this.pageViewports = pageViewports;
          this.metadata = metadata;
          this.schema = schema;
          this.items = items;
        }
      };
    }
  });

  // src/PdfParser.ts
  var PdfParser_exports = {};
  __export(PdfParser_exports, {
    PARSE_SCHEMA: () => PARSE_SCHEMA,
    default: () => PdfParser
  });
  var PARSE_SCHEMA, PdfParser;
  var init_PdfParser = __esm({
    "src/PdfParser.ts"() {
      "use strict";
      init_Item();
      init_Metadata();
      init_ParseResult();
      PARSE_SCHEMA = ["transform", "width", "height", "str", "fontName", "dir"];
      PdfParser = class {
        constructor(pdfjs, defaultParams = {}) {
          this.schema = PARSE_SCHEMA;
          this.pdfjs = pdfjs;
          this.defaultParams = defaultParams;
        }
        parse(src, reporter) {
          return __async(this, null, function* () {
            const documentInitParameters = __spreadValues(__spreadValues({}, this.defaultParams), this.documentInitParameters(src));
            return this.pdfjs.getDocument(documentInitParameters).promise.then((pdfjsDocument) => {
              reporter.parsedDocumentHeader(pdfjsDocument.numPages);
              return Promise.all([
                pdfjsDocument,
                pdfjsDocument.getMetadata().then((pdfjsMetadata) => {
                  reporter.parsedMetadata();
                  return new Metadata(pdfjsMetadata);
                }),
                this.extractPagesSequentially(pdfjsDocument, reporter)
              ]);
            }).then(([pdfjsDocument, metadata, pages]) => {
              return Promise.all([
                pdfjsDocument,
                metadata,
                pages,
                this.gatherFontObjects(pages).finally(() => reporter.parsedFonts())
              ]);
            }).then(([pdfjsDocument, metadata, pages, fontMap]) => {
              const pdfjsPages = pages.map((page) => page.pdfjsPage);
              const items = pages.reduce((allItems, page) => allItems.concat(page.items), []);
              const pageViewports = pdfjsPages.map((page) => {
                const viewPort = page.getViewport({ scale: 1 });
                return {
                  transformFunction: (itemTransform) => this.pdfjs.Util.transform(viewPort.transform, itemTransform)
                };
              });
              return new ParseResult(
                fontMap,
                pdfjsDocument.numPages,
                pdfjsPages,
                pageViewports,
                metadata,
                this.schema,
                items
              );
            });
          });
        }
        extractPagesSequentially(pdfjsDocument, reporter) {
          return [...Array(pdfjsDocument.numPages)].reduce((accumulatorPromise, _, index) => {
            return accumulatorPromise.then((accumulatedResults) => {
              return pdfjsDocument.getPage(index + 1).then((pdfjsPage) => {
                return pdfjsPage.getTextContent({
                  normalizeWhitespace: false,
                  disableCombineTextItems: true
                }).then((textContent) => {
                  const items = textContent.items.map((pdfjsItem) => new Item(index, pdfjsItem));
                  reporter.parsedPage(index);
                  return [...accumulatedResults, { index, pdfjsPage, items }];
                });
              });
            });
          }, Promise.resolve([]));
        }
        gatherFontObjects(pages) {
          const uniqueFontIds = /* @__PURE__ */ new Set();
          return pages.reduce((promise, page) => {
            const unknownPageFonts = page.items.reduce((unknowns, item) => {
              const fontId = item.data["fontName"];
              if (!uniqueFontIds.has(fontId) && fontId.startsWith("g_d")) {
                uniqueFontIds.add(fontId);
                unknowns.push(fontId);
              }
              return unknowns;
            }, []);
            if (unknownPageFonts.length > 0) {
              promise = promise.then((fontMap) => {
                return page.pdfjsPage.getOperatorList().then(() => {
                  unknownPageFonts.forEach((fontId) => {
                    const fontObject = page.pdfjsPage.commonObjs.get(fontId);
                    fontMap.set(fontId, fontObject);
                  });
                  return fontMap;
                });
              });
            }
            return promise;
          }, Promise.resolve(/* @__PURE__ */ new Map()));
        }
        documentInitParameters(src) {
          if (typeof src === "string") {
            return { url: src };
          }
          if (this.isArrayBuffer(src)) {
            return { data: src };
          }
          if (typeof src === "object") {
            return src;
          }
          throw new Error("Invalid PDFjs parameter for getDocument. Need either Uint8Array, string or a parameter object");
        }
        isArrayBuffer(object) {
          return typeof object === "object" && object !== null && object.byteLength !== void 0;
        }
      };
    }
  });

  // src/debug/EvaluationTracker.ts
  var EvaluationTracker;
  var init_EvaluationTracker = __esm({
    "src/debug/EvaluationTracker.ts"() {
      "use strict";
      EvaluationTracker = class {
        constructor() {
          this.evaluations = /* @__PURE__ */ new Map();
          this.scored = false;
        }
        evaluationCount() {
          return this.evaluations.size;
        }
        hasScores() {
          return this.scored;
        }
        evaluated(item) {
          return this.evaluations.has(item.uuid);
        }
        evaluationScore(item) {
          return this.evaluations.get(item.uuid);
        }
        trackEvaluation(item, score = void 0) {
          if (typeof score !== "undefined") {
            this.scored = true;
          }
          this.evaluations.set(item.uuid, score);
        }
      };
    }
  });

  // src/transformer/TransformContext.ts
  var TransformContext;
  var init_TransformContext = __esm({
    "src/transformer/TransformContext.ts"() {
      "use strict";
      init_EvaluationTracker();
      TransformContext = class {
        constructor(fontMap, pageViewports, globals, evaluations = new EvaluationTracker()) {
          this.fontMap = fontMap;
          this.pageViewports = pageViewports;
          this.globals = globals;
          this.evaluations = evaluations;
          this.pageCount = pageViewports.length;
        }
        trackEvaluation(item, score = void 0) {
          this.evaluations.trackEvaluation(item, score);
        }
        globalIsDefined(definition) {
          return this.globals.isDefined(definition);
        }
        getGlobal(definition) {
          return this.globals.get(definition);
        }
        getGlobalOptionally(definition) {
          return this.globals.getOptional(definition);
        }
      };
    }
  });

  // src/TransformDescriptor.ts
  function toDescriptor(partial) {
    return __spreadValues(__spreadValues({}, defaults), partial);
  }
  var defaults;
  var init_TransformDescriptor = __esm({
    "src/TransformDescriptor.ts"() {
      "use strict";
      defaults = {
        requireColumns: [],
        consumesGlobels: [],
        producesGlobels: []
      };
    }
  });

  // src/support/groupingUtils.ts
  function flatMap(array, func) {
    return array.reduce((result, entry, idx) => result.concat(func(entry, idx)), []);
  }
  function onlyUniques(value, index, self) {
    return self.indexOf(value) === index;
  }
  function ascending(a, b) {
    return a - b;
  }
  function descending(a, b) {
    return b - a;
  }
  function min(array, prevMin) {
    return array.reduce((prev, curr) => {
      if (prev === void 0 || curr < prev) {
        return curr;
      }
      return prev;
    }, prevMin);
  }
  function median(values) {
    if (values.length === 0)
      return 0;
    values.sort(function(a, b) {
      return a - b;
    });
    const half = Math.floor(values.length / 2);
    if (values.length % 2)
      return values[half];
    return (values[half - 1] + values[half]) / 2;
  }
  function groupBy(items, extractKey) {
    return items.reduce((pageItems, item) => {
      const lastPageItems = pageItems[pageItems.length - 1];
      if (!lastPageItems || extractKey(item) !== extractKey(lastPageItems[0])) {
        pageItems.push([item]);
      } else {
        lastPageItems.push(item);
      }
      return pageItems;
    }, []);
  }
  function groupByPage(items) {
    return groupBy(items, (item) => item.page);
  }
  function groupByBlock(items) {
    return groupByElement(items, "block");
  }
  function groupByLine(items) {
    return groupByElement(items, "line");
  }
  function groupByElement(items, elementName) {
    return groupBy(items, (item) => item.data[elementName]);
  }
  function transformGroupedByPage(items, groupedTransformer) {
    return new Array().concat(
      ...groupByPage(items).map((pageItems) => groupedTransformer(pageItems[0].page, pageItems))
    );
  }
  function transformGroupedByPageAndLine(items, groupedTransformer) {
    const transformedItems = [];
    groupByPage(items).forEach((pageItems) => {
      groupByElement(pageItems, "line").forEach((lineItems) => {
        transformedItems.push(...groupedTransformer(pageItems[0].page, lineItems[0].data["line"], lineItems));
      });
    });
    return transformedItems;
  }
  function mostFrequent(items, dataElementKey) {
    const occurenceMap = items.reduce((map, item) => {
      const key = item.data[dataElementKey];
      const occurrence = map.get(key) || 0;
      map.set(key, occurrence + 1);
      return map;
    }, /* @__PURE__ */ new Map());
    const topElement = [...occurenceMap].reduce(
      (topEntry, entry) => entry[1] >= topEntry[1] ? entry : topEntry,
      [void 0, 0]
    )[0];
    return topElement;
  }
  function isGreaterWithTolerance(num1, num2, tolerance = 0.01) {
    return num1 - num2 > tolerance;
  }
  var init_groupingUtils = __esm({
    "src/support/groupingUtils.ts"() {
      "use strict";
    }
  });

  // src/debug/ItemGroup.ts
  var ItemGroup;
  var init_ItemGroup = __esm({
    "src/debug/ItemGroup.ts"() {
      "use strict";
      ItemGroup = class {
        constructor(top, items = []) {
          this.top = top;
          this.elements = items;
        }
        hasMany() {
          return this.elements.length > 0;
        }
        unpacked() {
          if (this.elements.length > 0) {
            return this.elements;
          }
          return [this.top];
        }
      };
    }
  });

  // src/debug/Page.ts
  function asPages(evaluationTracker, changeTracker, schema, items, itemMerger) {
    return groupByPage(items).map((pageItems) => {
      let itemGroups;
      if (itemMerger) {
        itemGroups = groupByElement(pageItems, itemMerger.groupKey).map((groupItems) => {
          if (groupItems.length > 1) {
            const top = itemMerger.merge(evaluationTracker, changeTracker, schema, groupItems);
            return new ItemGroup(top, groupItems);
          } else {
            return new ItemGroup(groupItems[0]);
          }
        });
      } else {
        itemGroups = pageItems.map((item) => new ItemGroup(item));
      }
      return { index: pageItems[0].page, itemGroups };
    });
  }
  var init_Page = __esm({
    "src/debug/Page.ts"() {
      "use strict";
      init_groupingUtils();
      init_ItemGroup();
    }
  });

  // src/debug/ChangeIndex.ts
  var Change, Addition, Removal, ContentChange, PositionChange;
  var init_ChangeIndex = __esm({
    "src/debug/ChangeIndex.ts"() {
      "use strict";
      Change = class {
        constructor(category) {
          this.category = category;
        }
      };
      Addition = class extends Change {
        constructor() {
          super("PLUS" /* PLUS */);
        }
      };
      Removal = class extends Change {
        constructor() {
          super("MINUS" /* MINUS */);
        }
      };
      ContentChange = class extends Change {
        constructor() {
          super("NEUTRAL" /* NEUTRAL */);
        }
      };
      PositionChange = class extends Change {
        constructor(direction, amount) {
          super(direction === "UP" /* UP */ ? "PLUS" /* PLUS */ : "MINUS" /* MINUS */);
          this.direction = direction;
          this.amount = amount;
        }
      };
    }
  });

  // src/assert.ts
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  }
  function assertNot(condition, message) {
    if (condition) {
      throw new Error(message || "Assertion failed");
    }
  }
  function assertDefined(value, message) {
    if (value === null || typeof value === "undefined") {
      throw new Error(message || "Assertion failed");
    }
    return value;
  }
  var init_assert = __esm({
    "src/assert.ts"() {
      "use strict";
    }
  });

  // src/debug/ChangeTracker.ts
  var ADDITION, REMOVAL, CONTENT_CHANGE, ChangeTracker;
  var init_ChangeTracker = __esm({
    "src/debug/ChangeTracker.ts"() {
      "use strict";
      init_ChangeIndex();
      init_assert();
      ADDITION = new Addition();
      REMOVAL = new Removal();
      CONTENT_CHANGE = new ContentChange();
      ChangeTracker = class {
        constructor() {
          this.changes = /* @__PURE__ */ new Map();
        }
        addChange(item, change) {
          const uuid = item.uuid;
          assertNot(
            this.changes.has(uuid),
            `Change for item ${uuid} already defined! (old: ${JSON.stringify(this.changes.get(uuid))}, new: ${JSON.stringify(
              change
            )})`
          );
          this.changes.set(uuid, change);
        }
        changeCount() {
          return this.changes.size;
        }
        trackAddition(item) {
          this.addChange(item, ADDITION);
        }
        trackRemoval(item) {
          this.addChange(item, REMOVAL);
        }
        trackPositionalChange(item, oldPosition, newPosition) {
          const direction = newPosition > oldPosition ? "DOWN" /* DOWN */ : "UP" /* UP */;
          const amount = Math.abs(newPosition - oldPosition);
          if (amount > 0) {
            this.addChange(item, new PositionChange(direction, amount));
          }
        }
        trackContentChange(item) {
          this.addChange(item, CONTENT_CHANGE);
        }
        change(item) {
          return this.changes.get(item.uuid);
        }
        hasChanged(item) {
          return this.changes.has(item.uuid);
        }
        isPlusChange(item) {
          var _a;
          return ((_a = this.change(item)) == null ? void 0 : _a.category) === "PLUS" /* PLUS */;
        }
        isNeutralChange(item) {
          var _a;
          return ((_a = this.change(item)) == null ? void 0 : _a.category) === "NEUTRAL" /* NEUTRAL */;
        }
        isMinusChange(item) {
          var _a;
          return ((_a = this.change(item)) == null ? void 0 : _a.category) === "MINUS" /* MINUS */;
        }
        isRemoved(item) {
          var _a;
          return ((_a = this.change(item)) == null ? void 0 : _a.constructor.name) === REMOVAL.constructor.name;
        }
      };
    }
  });

  // src/Globals.ts
  var Globals;
  var init_Globals = __esm({
    "src/Globals.ts"() {
      "use strict";
      init_assert();
      Globals = class {
        constructor(globals) {
          this.map = globals ? new Map(globals.map) : /* @__PURE__ */ new Map();
        }
        keys() {
          return [...this.map.keys()];
        }
        isDefined(definition) {
          return typeof this.map.get(definition.key) !== "undefined";
        }
        get(definition) {
          const element = this.map.get(definition.key);
          assertDefined(
            element,
            `No global with key '${definition.key}' registered. Only [${[...this.map.keys()].join(",")}]`
          );
          return element;
        }
        getOptional(definition) {
          return this.map.get(definition.key);
        }
        set(definition, value) {
          assertNot(this.isDefined(definition), `Global with key '${definition.key}' already registered.`);
          this.map.set(definition.key, value);
        }
        override(definition, value) {
          this.map.set(definition.key, value);
        }
        withValues(values) {
          values == null ? void 0 : values.forEach((value) => {
            if (value.override) {
              this.override(value.definition, value.value);
            } else {
              this.set(value.definition, value.value);
            }
          });
          return this;
        }
      };
    }
  });

  // src/debug/StageResult.ts
  function initialStage(inputSchema, inputItems) {
    const schema = inputSchema.map((column) => ({ name: column }));
    const evaluations = new EvaluationTracker();
    const changes = new ChangeTracker();
    const pages = asPages(evaluations, changes, PARSE_SCHEMA, inputItems);
    const messages = [
      `Parsed ${inputItems.length === 0 ? 0 : inputItems[inputItems.length - 1].page + 1} pages with ${inputItems.length} items`
    ];
    return new StageResult(
      new Globals(),
      toDescriptor({ debug: { showAll: true } }),
      schema,
      pages,
      evaluations,
      changes,
      messages
    );
  }
  var StageResult;
  var init_StageResult = __esm({
    "src/debug/StageResult.ts"() {
      "use strict";
      init_TransformDescriptor();
      init_PdfParser();
      init_Page();
      init_ChangeTracker();
      init_ItemGroup();
      init_EvaluationTracker();
      init_Globals();
      StageResult = class {
        constructor(globals, descriptor, schema, pages, evaluations, changes, messages) {
          this.globals = globals;
          this.descriptor = descriptor;
          this.schema = schema;
          this.pages = pages;
          this.evaluations = evaluations;
          this.changes = changes;
          this.messages = messages;
        }
        itemsUnpacked() {
          return this.pages.reduce((items, page) => {
            page.itemGroups.forEach((itemGroup) => itemGroup.unpacked().forEach((item) => items.push(item)));
            return items;
          }, []);
        }
        itemsCleanedAndUnpacked() {
          return this.pages.reduce((items, page) => {
            page.itemGroups.forEach(
              (itemGroup) => itemGroup.unpacked().filter((item) => !this.changes.isRemoved(item)).forEach((item) => items.push(item))
            );
            return items;
          }, []);
        }
        selectPages(relevantChangesOnly, groupItems) {
          var _a, _b, _c;
          let result;
          if (!groupItems && ((_b = (_a = this.descriptor) == null ? void 0 : _a.debug) == null ? void 0 : _b.itemMerger)) {
            result = this.pagesWithUnpackedItems();
          } else {
            result = this.pages;
          }
          if (relevantChangesOnly && !((_c = this.descriptor.debug) == null ? void 0 : _c.showAll) === true) {
            result = result.map(
              (page) => __spreadProps(__spreadValues({}, page), {
                itemGroups: page.itemGroups.filter(
                  (itemGroup) => this.evaluations.evaluated(itemGroup.top) || this.changes.hasChanged(itemGroup.top)
                )
              })
            );
          }
          return result;
        }
        pagesWithUnpackedItems() {
          return this.pages.map(
            (page) => __spreadProps(__spreadValues({}, page), {
              itemGroups: new Array().concat(
                ...page.itemGroups.map((itemGroup) => itemGroup.unpacked().map((item) => new ItemGroup(item)))
              )
            })
          );
        }
      };
    }
  });

  // src/debug/ColumnAnnotation.ts
  var ColumnAnnotation, ColumnAnnotation_default;
  var init_ColumnAnnotation = __esm({
    "src/debug/ColumnAnnotation.ts"() {
      "use strict";
      ColumnAnnotation = /* @__PURE__ */ ((ColumnAnnotation2) => {
        ColumnAnnotation2["ADDED"] = "ADDED";
        ColumnAnnotation2["REMOVED"] = "REMOVED";
        return ColumnAnnotation2;
      })(ColumnAnnotation || {});
      ColumnAnnotation_default = ColumnAnnotation;
    }
  });

  // src/support/functional.ts
  function flatMap2(array, func) {
    return array.reduce((result, entry, idx) => result.concat(func(entry, idx)), []);
  }
  function groupBy2(array, groupKey) {
    const groupMap = array.reduce((map, element) => {
      const key = groupKey(element);
      const elementsInGroup = map.get(key);
      if (elementsInGroup) {
        elementsInGroup.push(element);
      } else {
        map.set(key, [element]);
      }
      return map;
    }, /* @__PURE__ */ new Map());
    return Array.from(groupMap, ([_, value]) => value);
  }
  function flatten(array) {
    return flatMap2(array, (e) => e);
  }
  function arraysEqual(a, b) {
    if (a === b)
      return true;
    if (a == null || b == null)
      return false;
    if (a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i])
        return false;
    }
    return true;
  }
  var init_functional = __esm({
    "src/support/functional.ts"() {
      "use strict";
    }
  });

  // src/debug/detectChanges.ts
  function detectChanges(tracker, inputItems, outputItems) {
    const oututItemsByPage = groupByPage(outputItems).reduce((map, pageItems) => {
      map.set(pageItems[0].page, pageItems);
      return map;
    }, /* @__PURE__ */ new Map());
    const mergedItems = [];
    groupByPage(inputItems).forEach((inputPageItems) => {
      const page = inputPageItems[0].page;
      const outputPageItems = oututItemsByPage.get(page) || [];
      mergedItems.push(...detectPageChanges(tracker, inputPageItems, outputPageItems));
    });
    return mergedItems;
  }
  function detectPageChanges(tracker, inputItems, outputItems) {
    const mergedItems = [];
    const addedItems = /* @__PURE__ */ new Set();
    let removals = 0;
    let additions = 0;
    let outputIndex = 0;
    for (let inputIdx = 0; inputIdx < inputItems.length; inputIdx++) {
      const inputItem = inputItems[inputIdx];
      if (addedItems.has(inputItem.uuid)) {
        continue;
      }
      const positionInOutput = outputItems.findIndex((item) => item.uuid === inputItem.uuid);
      if (positionInOutput < 0) {
        tracker.trackRemoval(inputItem);
        mergedItems.push(inputItem);
        addedItems.add(inputItem.uuid);
        removals++;
      } else if (positionInOutput === inputIdx + additions - removals) {
        mergedItems.push(outputItems[positionInOutput]);
        addedItems.add(outputItems[positionInOutput].uuid);
        outputIndex++;
        const typesInInput = inputItem.data["types"];
        const typesInOutput = outputItems[positionInOutput].data["types"];
        if ((typesInInput || typesInOutput) && !arraysEqual(typesInInput, typesInOutput)) {
          tracker.trackContentChange(inputItem);
        }
        if (!arraysEqual(inputItem.tokenTypes, outputItems[positionInOutput].tokenTypes)) {
          tracker.trackContentChange(inputItem);
        }
      } else {
        for (let intermediateOutputIdx = outputIndex; intermediateOutputIdx < positionInOutput; intermediateOutputIdx++) {
          const outputItem = outputItems[intermediateOutputIdx];
          const positionInInput = inputItems.findIndex((item) => item.uuid === outputItem.uuid);
          if (positionInInput < 0) {
            tracker.trackAddition(outputItem);
            mergedItems.push(outputItem);
            addedItems.add(outputItem.uuid);
            additions++;
            outputIndex++;
          } else {
            tracker.trackPositionalChange(outputItem, positionInInput - removals, intermediateOutputIdx - additions);
            mergedItems.push(outputItem);
            addedItems.add(outputItem.uuid);
            outputIndex++;
          }
        }
        tracker.trackPositionalChange(outputItems[positionInOutput], inputIdx - removals, positionInOutput - additions);
        mergedItems.push(outputItems[positionInOutput]);
        addedItems.add(outputItems[positionInOutput].uuid);
        outputIndex++;
      }
    }
    for (let remaingOutputIndex = outputIndex; remaingOutputIndex < outputItems.length; remaingOutputIndex++) {
      tracker.trackAddition(outputItems[remaingOutputIndex]);
      mergedItems.push(outputItems[remaingOutputIndex]);
      additions++;
    }
    return mergedItems;
  }
  var init_detectChanges = __esm({
    "src/debug/detectChanges.ts"() {
      "use strict";
      init_groupingUtils();
      init_functional();
    }
  });

  // src/Debugger.ts
  function toSimpleSchema(stageResult) {
    return stageResult.schema.filter((column) => !column.annotation || column.annotation !== ColumnAnnotation_default.REMOVED).map((column) => column.name);
  }
  function toAnnotatedSchema(inputSchema, outputSchema) {
    const annotatedSchema = [];
    let out_idx = 0;
    for (let in_idx = 0; in_idx < inputSchema.length; in_idx++) {
      const nextInputColumn = inputSchema[in_idx];
      const indexInOut = outputSchema.indexOf(nextInputColumn);
      if (indexInOut === -1) {
        annotatedSchema.push({ name: nextInputColumn, annotation: ColumnAnnotation_default.REMOVED });
      } else if (indexInOut > out_idx) {
        while (out_idx < indexInOut) {
          annotatedSchema.push({ name: outputSchema[out_idx], annotation: ColumnAnnotation_default.ADDED });
          out_idx++;
        }
        annotatedSchema.push({ name: nextInputColumn });
        out_idx++;
      } else {
        annotatedSchema.push({ name: nextInputColumn });
        out_idx++;
      }
    }
    for (let index = out_idx; index < outputSchema.length; index++) {
      annotatedSchema.push({ name: outputSchema[index], annotation: ColumnAnnotation_default.ADDED });
    }
    return annotatedSchema;
  }
  var Debugger;
  var init_Debugger = __esm({
    "src/Debugger.ts"() {
      "use strict";
      init_TransformContext();
      init_StageResult();
      init_ColumnAnnotation();
      init_detectChanges();
      init_Page();
      init_EvaluationTracker();
      init_ChangeTracker();
      init_Globals();
      Debugger = class {
        constructor(fontMap, pageViewports, pageCount, inputSchema, inputItems, transformers) {
          this.fontMap = fontMap;
          this.pageViewports = pageViewports;
          this.pageCount = pageCount;
          this.transformers = transformers;
          this.stageNames = ["Parse Result", ...transformers.map((t) => t.name)];
          this.stageDescriptions = ["Initial items as parsed by PDFjs", ...transformers.map((t) => t.description)];
          this.stageResultCache = [initialStage(inputSchema, inputItems)];
        }
        stageResult(stageIndex) {
          var _a;
          for (let idx = 0; idx < stageIndex + 1; idx++) {
            if (!this.stageResultCache[idx]) {
              const evaluations = new EvaluationTracker();
              const transformer = this.transformers[idx - 1];
              const previousStageResult = this.stageResultCache[idx - 1];
              const context = new TransformContext(
                this.fontMap,
                this.pageViewports,
                previousStageResult.globals,
                evaluations
              );
              const previousItems = previousStageResult.itemsCleanedAndUnpacked();
              const inputSchema = toSimpleSchema(previousStageResult);
              const outputSchema = transformer.schemaTransformer(inputSchema);
              const itemResult = transformer.transform(context, [...previousItems]);
              const globals = new Globals(previousStageResult.globals).withValues(itemResult.globals);
              const changes = new ChangeTracker();
              const items = detectChanges(changes, previousItems, itemResult.items);
              const pages = asPages(evaluations, changes, outputSchema, items, (_a = transformer.descriptor.debug) == null ? void 0 : _a.itemMerger);
              const messages = itemResult.messages;
              if (changes.changeCount() > 0 && messages.length === 0) {
                messages.unshift(`Detected ${changes.changeCount()} changes`);
              }
              this.stageResultCache.push(
                new StageResult(
                  globals,
                  transformer.descriptor,
                  toAnnotatedSchema(inputSchema, outputSchema),
                  pages,
                  evaluations,
                  changes,
                  messages
                )
              );
            }
          }
          return this.stageResultCache[stageIndex];
        }
      };
    }
  });

  // src/convert.ts
  function transform(parseResult, transformers) {
    let items = parseResult.items;
    let globals = new Globals();
    const context = new TransformContext(parseResult.fontMap, parseResult.pageViewports, globals);
    transformers.forEach((transformer) => {
      const result = transformer.transform(context, items);
      globals = globals.withValues(result.globals);
      items = result.items;
    });
    return items;
  }
  var init_convert = __esm({
    "src/convert.ts"() {
      "use strict";
      init_Globals();
      init_ParseProgressReporter();
      init_assert();
      init_TransformContext();
    }
  });

  // src/PdfPipeline.ts
  var PdfPipeline_exports = {};
  __export(PdfPipeline_exports, {
    default: () => PdfPipeline
  });
  var PdfPipeline;
  var init_PdfPipeline = __esm({
    "src/PdfPipeline.ts"() {
      "use strict";
      init_ParseProgressReporter();
      init_Debugger();
      init_convert();
      PdfPipeline = class {
        constructor(parser, transformers) {
          this.parser = parser;
          this.transformers = transformers;
        }
        parse(src, progressListener) {
          return __async(this, null, function* () {
            return this.parser.parse(src, new ParseProgressReporter(progressListener)).then((parseResult) => {
              return {
                debug: () => new Debugger(
                  parseResult.fontMap,
                  parseResult.pageViewports,
                  parseResult.pageCount,
                  parseResult.schema,
                  parseResult.items,
                  this.transformers
                ),
                transform: () => {
                  const items = transform(parseResult, this.transformers);
                  return {
                    convert: (converter) => converter.convert(items)
                  };
                }
              };
            });
          });
        }
      };
    }
  });

  // src/transformer/ItemTransformer.ts
  var ItemTransformer;
  var init_ItemTransformer = __esm({
    "src/transformer/ItemTransformer.ts"() {
      "use strict";
      init_TransformDescriptor();
      ItemTransformer = class {
        constructor(name, description, descriptorPartial, schemaTransformer = (schema) => schema) {
          this.name = name;
          this.description = description;
          this.descriptor = toDescriptor(descriptorPartial);
          this.schemaTransformer = schemaTransformer;
        }
      };
    }
  });

  // src/transformer/AdjustHeight.ts
  var AdjustHeight_exports = {};
  __export(AdjustHeight_exports, {
    default: () => AdjustHeight
  });
  var AdjustHeight;
  var init_AdjustHeight = __esm({
    "src/transformer/AdjustHeight.ts"() {
      "use strict";
      init_ItemTransformer();
      init_groupingUtils();
      AdjustHeight = class extends ItemTransformer {
        constructor() {
          super("Adjust Heights", "Corrects height with help of the page viewport", {
            requireColumns: ["transform", "height"]
          });
        }
        transform(context, inputItems) {
          let correctedHeights = 0;
          return {
            items: transformGroupedByPage(inputItems, (page, items) => {
              const pageViewport = context.pageViewports[page];
              return items.map((item) => {
                const itemTransform = item.data["transform"];
                const itemHeight = item.data["height"];
                const tx = pageViewport.transformFunction(itemTransform);
                const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
                const dividedHeight = itemHeight / fontHeight;
                const newHeight = Number.isNaN(dividedHeight) || dividedHeight <= 1 ? itemHeight : dividedHeight;
                if (newHeight === itemHeight) {
                  return item;
                } else {
                  correctedHeights++;
                  return item.withDataAddition({ height: newHeight });
                }
              });
            }),
            messages: [`${correctedHeights} corrected heights`]
          };
        }
      };
    }
  });

  // src/transformer/UnwrapCoordinates.ts
  var UnwrapCoordinates_exports = {};
  __export(UnwrapCoordinates_exports, {
    default: () => CalculateCoordinates
  });
  var CalculateCoordinates;
  var init_UnwrapCoordinates = __esm({
    "src/transformer/UnwrapCoordinates.ts"() {
      "use strict";
      init_ItemTransformer();
      CalculateCoordinates = class extends ItemTransformer {
        constructor() {
          super(
            "Unwrap Coordinates",
            "Extracts X and Y out of the Transform array",
            {
              requireColumns: ["transform"],
              debug: {
                showAll: true
              }
            },
            (incomingSchema) => {
              return incomingSchema.reduce((schema, column) => {
                if (column === "transform") {
                  return [...schema, "x", "y"];
                }
                return [...schema, column];
              }, new Array());
            }
          );
        }
        transform(_, inputItems) {
          return {
            items: inputItems.map((item) => {
              const transform2 = item.data["transform"];
              const x = transform2[4];
              const y = transform2[5];
              return item.withDataAddition({ x, y });
            }),
            messages: []
          };
        }
      };
    }
  });

  // src/transformer/RemoveEmptyItems.ts
  var RemoveEmptyItems_exports = {};
  __export(RemoveEmptyItems_exports, {
    default: () => RemoveEmptyItems
  });
  var RemoveEmptyItems;
  var init_RemoveEmptyItems = __esm({
    "src/transformer/RemoveEmptyItems.ts"() {
      "use strict";
      init_ItemTransformer();
      RemoveEmptyItems = class extends ItemTransformer {
        constructor() {
          super("Remove Empty Items", "Remove items which have only whitespace.", {
            requireColumns: ["str"]
          });
        }
        transform(_, inputItems) {
          let removed = 0;
          return {
            items: inputItems.filter((item) => {
              const text = item.data["str"];
              const empty = text.trim() === "";
              if (empty)
                removed++;
              return !empty;
            }),
            messages: [`Removed ${removed} blank items`]
          };
        }
      };
    }
  });

  // src/GlobalValue.ts
  var GlobalValue;
  var init_GlobalValue = __esm({
    "src/GlobalValue.ts"() {
      "use strict";
      GlobalValue = class {
        constructor(definition, value, override = false) {
          this.definition = definition;
          this.value = value;
          this.override = override;
        }
      };
    }
  });

  // src/GlobalDefinition.ts
  var GlobalDefinition;
  var init_GlobalDefinition = __esm({
    "src/GlobalDefinition.ts"() {
      "use strict";
      init_GlobalValue();
      GlobalDefinition = class {
        constructor(key) {
          this.key = key;
        }
        value(value) {
          return new GlobalValue(this, value);
        }
        overrideValue(value) {
          return new GlobalValue(this, value, true);
        }
      };
    }
  });

  // src/PageMapping.ts
  function romanize(num) {
    var lookup = { M: 1e3, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }, roman = "", i;
    for (i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  }
  var PageMapping;
  var init_PageMapping = __esm({
    "src/PageMapping.ts"() {
      "use strict";
      PageMapping = class {
        constructor(pageFactor = 1, detectedOnPage = false) {
          this.pageFactor = pageFactor;
          this.detectedOnPage = detectedOnPage;
        }
        /**
         * Translates a given page index to a page number label as printed on the page. E.g [0,1,2,3,4] could become [I, II, 1, 2].
         * @param pageIndex
         */
        pageLabel(pageIndex) {
          const pageNumber = pageIndex + this.pageFactor;
          if (pageNumber < 1) {
            return romanize(Math.abs(pageNumber - this.pageFactor) + 1);
          }
          return `${pageNumber}`;
        }
        shifted() {
          return this.pageFactor != 1;
        }
      };
    }
  });

  // src/support/PageFactorFinder.ts
  var PageFactorFinder;
  var init_PageFactorFinder = __esm({
    "src/support/PageFactorFinder.ts"() {
      "use strict";
      init_groupingUtils();
      PageFactorFinder = class {
        find(containers, extractor, config5 = { sampleCount: 20, minFulfillment: 0.8 }) {
          const containerAnalyzeCount = Math.min(config5.sampleCount, containers.length);
          const start = Math.max(containers.length / 2 - containerAnalyzeCount / 2, 0);
          const pageNumbers = containers.slice(start, start + containerAnalyzeCount).map((container) => extractor(container)).map((extract) => extract.numbers.map((num) => num - extract.index).filter(onlyUniques));
          const distanceCounts = pageNumbers.reduce((map, indexDistancesPerPage) => {
            indexDistancesPerPage.forEach((indexDistance) => {
              map[indexDistance] = (map[indexDistance] || 0) + 1;
            });
            return map;
          }, {});
          const hits = Object.keys(distanceCounts).filter((distance) => distanceCounts[distance] / containerAnalyzeCount >= config5.minFulfillment).sort((d1, d2) => distanceCounts[d1] - distanceCounts[d2]);
          if (hits.length < 1) {
            return void 0;
          }
          return Number.parseInt(hits[0]);
        }
      };
    }
  });

  // src/support/stringFunctions.ts
  function isDigit(charCode) {
    return charCode >= MIN_DIGIT_CHAR_CODE && charCode <= MAX_DIGIT_CHAR_CODE;
  }
  function toCharcodes(text) {
    const codes = [];
    for (let index = 0; index < text.length; index++) {
      codes.push(text.charCodeAt(index));
    }
    return codes;
  }
  function filterOutDigits(text) {
    return String.fromCharCode(...toCharcodes(text).filter((code) => !isDigit(code)));
  }
  function filterOut(text, codes) {
    return String.fromCharCode(...toCharcodes(text).filter((code) => !codes.includes(code)));
  }
  function extractNumbers(text) {
    return (text.match(/\d+/g) || []).map(Number);
  }
  function extractEndingNumber(text) {
    const match = text.match(/\d+$/g);
    if (match) {
      assert(match.length == 1, `Expected only one match, but got ${match}`);
      return Number(match[0]);
    }
    return void 0;
  }
  function isListItemCharacter(string) {
    if (string.length > 1) {
      return false;
    }
    const char = string.charAt(0);
    return char === "-" || char === "\u2022" || char === "\u2013";
  }
  function isListItem(value) {
    return /^[\s]*[-•–][\s].*$/g.test(value);
  }
  function isNumberedListItem(value) {
    return /^[\s]*\d*\.(?:\s|$)/g.test(value);
  }
  function isNumber(value) {
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      if (!isDigit(charCode)) {
        return false;
      }
    }
    return true;
  }
  var TAB_CHAR_CODE, WHITESPACE_CHAR_CODE, MIN_DIGIT_CHAR_CODE, MAX_DIGIT_CHAR_CODE, PERIOD_CHAR_CODES, DASHS_CHAR_CODES;
  var init_stringFunctions = __esm({
    "src/support/stringFunctions.ts"() {
      "use strict";
      init_assert();
      TAB_CHAR_CODE = 9;
      WHITESPACE_CHAR_CODE = 32;
      MIN_DIGIT_CHAR_CODE = 48;
      MAX_DIGIT_CHAR_CODE = 57;
      PERIOD_CHAR_CODES = [46, 190];
      DASHS_CHAR_CODES = [45, 189, 8211];
    }
  });

  // src/transformer/CacluclateStatistics.ts
  var CacluclateStatistics_exports = {};
  __export(CacluclateStatistics_exports, {
    MAX_HEIGHT: () => MAX_HEIGHT,
    MAX_X: () => MAX_X,
    MAX_Y: () => MAX_Y,
    MIN_X: () => MIN_X,
    MIN_Y: () => MIN_Y,
    MOST_USED_DISTANCE: () => MOST_USED_DISTANCE,
    MOST_USED_FONT: () => MOST_USED_FONT,
    MOST_USED_HEIGHT: () => MOST_USED_HEIGHT,
    PAGE_MAPPING: () => PAGE_MAPPING,
    default: () => CalculateStatistics
  });
  function to2DigitDecimalFromString(value) {
    return parseFloat(parseFloat(value).toFixed(2));
  }
  function to2DigitDecimal(value) {
    return parseFloat(value.toFixed(2));
  }
  function parsePageMapping(groupedByPage, minX, maxX, minY, maxY) {
    const pageFactor = new PageFactorFinder().find(
      groupedByPage,
      (items) => ({
        index: items[0].page,
        numbers: possiblePageNumbers(
          items.filter((item) => {
            const x = item.data["x"];
            const y = item.data["y"];
            return x <= minX + config.maxDistanceToFringe || x >= maxX - config.maxDistanceToFringe || y <= minY + config.maxDistanceToFringe || y >= maxY - config.maxDistanceToFringe;
          })
        )
      }),
      { sampleCount: 20, minFulfillment: 0.8 }
    );
    return typeof pageFactor === "undefined" ? new PageMapping() : new PageMapping(pageFactor, true);
  }
  function getMostUsedKey(keyToOccurrence) {
    let maxOccurence = 0;
    let maxKey = "";
    Object.keys(keyToOccurrence).map((element) => {
      if (!maxKey || keyToOccurrence[element] > maxOccurence) {
        maxOccurence = keyToOccurrence[element];
        maxKey = element;
      }
    });
    return maxKey;
  }
  function possiblePageNumbers(items) {
    return flatten(
      items.map((item) => {
        return extractNumbers(item.data["str"]).filter((number) => number >= 0).filter(onlyUniques);
      })
    );
  }
  var import_simple_statistics, MIN_X, MAX_X, MIN_Y, MAX_Y, MAX_HEIGHT, MOST_USED_HEIGHT, MOST_USED_DISTANCE, MOST_USED_FONT, PAGE_MAPPING, config, CalculateStatistics;
  var init_CacluclateStatistics = __esm({
    "src/transformer/CacluclateStatistics.ts"() {
      "use strict";
      init_ItemTransformer();
      init_GlobalDefinition();
      init_PageMapping();
      init_PageFactorFinder();
      init_groupingUtils();
      init_functional();
      init_stringFunctions();
      import_simple_statistics = __require("simple-statistics");
      MIN_X = new GlobalDefinition("minX");
      MAX_X = new GlobalDefinition("maxX");
      MIN_Y = new GlobalDefinition("minY");
      MAX_Y = new GlobalDefinition("maxY");
      MAX_HEIGHT = new GlobalDefinition("maxHeight");
      MOST_USED_HEIGHT = new GlobalDefinition("mostUsedHeight");
      MOST_USED_DISTANCE = new GlobalDefinition("mostUsedDistance");
      MOST_USED_FONT = new GlobalDefinition("mostUsedFont");
      PAGE_MAPPING = new GlobalDefinition("pageMapping");
      config = {
        // how much distance to min/max/x/y can an item have in order to be considered fringe
        maxDistanceToFringe: 50
      };
      CalculateStatistics = class extends ItemTransformer {
        constructor() {
          super("Calculate Statistics", "Calculate global statistics that are used in downstream transformers", {
            requireColumns: ["str", "fontName", "y", "height"],
            producesGlobels: [
              MIN_X.key,
              //TODO
              MOST_USED_HEIGHT.key,
              MOST_USED_FONT.key,
              MOST_USED_DISTANCE.key,
              MAX_HEIGHT.key,
              "fontToFormats"
            ],
            debug: {
              showAll: true
            }
          });
        }
        transform(context, items) {
          const heights = items.map((item) => item.data["height"]);
          const mostUsedByMedian = (0, import_simple_statistics.median)(heights);
          const heightToOccurrence = {};
          const fontToOccurrence = {};
          let maxHeight = 0;
          let minX = 999;
          let maxX = 0;
          let minY = 999;
          let maxY = 0;
          items.forEach((item) => {
            const itemHeight = item.data["height"];
            const itemFont = item.data["fontName"];
            const x = item.data["x"];
            const y = item.data["y"];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            heightToOccurrence[itemHeight] = heightToOccurrence[itemHeight] ? heightToOccurrence[itemHeight] + 1 : 1;
            fontToOccurrence[itemFont] = fontToOccurrence[itemFont] ? fontToOccurrence[itemFont] + 1 : 1;
            if (itemHeight > maxHeight) {
              maxHeight = itemHeight;
            }
          });
          const mostUsedHeight = to2DigitDecimalFromString(getMostUsedKey(heightToOccurrence));
          const mostUsedFont = getMostUsedKey(fontToOccurrence);
          const groupedByPage = groupByPage(items);
          const pageMapping = parsePageMapping(groupedByPage, minX, maxX, minY, maxY);
          const distanceToOccurrence = {};
          let page = -1;
          let lastItemOfMostUsedHeight;
          items.forEach((item) => {
            if (item.page !== page)
              lastItemOfMostUsedHeight = void 0;
            const itemHeight = to2DigitDecimalFromString(item.data["height"]);
            const itemText = item.data["str"];
            const itemY = item.data["y"];
            if (itemHeight == mostUsedHeight && itemText.trim().length > 0) {
              if (lastItemOfMostUsedHeight && itemY != lastItemOfMostUsedHeight.data["y"]) {
                const distance = to2DigitDecimal(lastItemOfMostUsedHeight.data["y"] - itemY);
                if (distance > 0) {
                  distanceToOccurrence[distance] = distanceToOccurrence[distance] ? distanceToOccurrence[distance] + 1 : 1;
                }
              }
              lastItemOfMostUsedHeight = item;
            } else {
              lastItemOfMostUsedHeight = void 0;
            }
            page = item.page;
          });
          const mostUsedDistance = to2DigitDecimalFromString(getMostUsedKey(distanceToOccurrence));
          const mostUsedFontObject = context.fontMap.get(mostUsedFont);
          return {
            items,
            globals: [
              MAX_HEIGHT.value(maxHeight),
              MOST_USED_HEIGHT.value(mostUsedByMedian),
              MOST_USED_DISTANCE.value(mostUsedDistance),
              MOST_USED_FONT.value((mostUsedFontObject == null ? void 0 : mostUsedFontObject.name) || mostUsedFont),
              MIN_X.value(minX),
              MAX_X.value(maxX),
              MIN_Y.value(minY),
              MAX_Y.value(maxY),
              PAGE_MAPPING.value(pageMapping)
            ],
            // globals2: {
            //   mostUsedHeight: mostUsedHeight,
            //   mostUsedFont: mostUsedFont,
            //   mostUsedDistance: mostUsedDistance,
            //   maxHeightFont: maxHeightFont,
            //   fontToFormats: fontToType,
            // },
            messages: [
              "Items per height: " + JSON.stringify(heightToOccurrence),
              "Items per font: " + JSON.stringify(fontToOccurrence),
              "Items per distance: " + JSON.stringify(distanceToOccurrence)
            ]
          };
        }
      };
    }
  });

  // src/debug/ItemMerger.ts
  var ItemMerger;
  var init_ItemMerger = __esm({
    "src/debug/ItemMerger.ts"() {
      "use strict";
      ItemMerger = class {
        constructor(groupKey) {
          this.groupKey = groupKey;
        }
      };
    }
  });

  // src/debug/LineItemMerger.ts
  var LineItemMerger;
  var init_LineItemMerger = __esm({
    "src/debug/LineItemMerger.ts"() {
      "use strict";
      init_ItemMerger();
      init_Item();
      init_functional();
      init_groupingUtils();
      LineItemMerger = class extends ItemMerger {
        constructor(trackAsNew = false) {
          super("line");
          this.trackAsNew = trackAsNew;
        }
        merge(evaluationTracker, changeTracker, schema, items) {
          const page = items[0].page;
          const block = items[0].data["block"];
          const line = items[0].data["line"];
          const str = items.map((item) => item.data["str"]).join(" ");
          const x = Math.min(...items.map((item) => item.data["x"]));
          const y = Math.min(...items.map((item) => item.data["y"]));
          const width = items.reduce((sum, item) => sum + item.data["width"], 0);
          const height = Math.max(...items.map((item) => item.data["height"]));
          const fontNames = [...new Set(items.map((item) => item.data["fontName"]))];
          const directions = [...new Set(items.map((item) => item.data["dir"]))];
          const newItem = new Item(page, {
            str,
            block,
            line,
            x,
            y,
            width,
            height,
            fontName: fontNames,
            dir: directions
          });
          if (schema.includes("types")) {
            const types2 = flatten(items.map((item) => item.data["types"] || [])).filter(onlyUniques);
            if (types2.length > 0) {
              newItem.data["types"] = types2;
            }
          }
          const evaluatedItem = items.find((item) => evaluationTracker.evaluated(item));
          if (evaluatedItem)
            evaluationTracker.trackEvaluation(newItem, evaluationTracker.evaluationScore(evaluatedItem));
          if (this.trackAsNew) {
            changeTracker.trackAddition(newItem);
          } else if (items.every((item) => changeTracker.isRemoved(item))) {
            changeTracker.trackRemoval(newItem);
          } else if (items.find((item) => changeTracker.hasChanged(item))) {
            changeTracker.trackContentChange(newItem);
          }
          return newItem;
        }
      };
    }
  });

  // src/transformer/CompactLines.ts
  var CompactLines_exports = {};
  __export(CompactLines_exports, {
    default: () => CompactLines
  });
  var CompactLines;
  var init_CompactLines = __esm({
    "src/transformer/CompactLines.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      CompactLines = class extends ItemTransformer {
        constructor() {
          super(
            "Compact Lines",
            "Combines items on the same y-axis",
            {
              requireColumns: ["str", "y", "height"],
              debug: {
                itemMerger: new LineItemMerger(true)
              }
            },
            (incomingSchema) => {
              return incomingSchema.reduce((schema, column) => {
                if (column === "x") {
                  return [...schema, "line", "x"];
                }
                return [...schema, column];
              }, new Array());
            }
          );
        }
        transform(_, inputItems) {
          let lines = 0;
          return {
            items: transformGroupedByPage(inputItems, (_2, pageItems) => {
              let lineNumber = -1;
              let lastY;
              return pageItems.map((item) => {
                const y = item.data["y"];
                const height = item.data["height"];
                if (!lastY || Math.abs(lastY - y) > height / 6 * 4) {
                  lineNumber++;
                  lines++;
                }
                lastY = y;
                return item.withDataAddition({ line: lineNumber });
              });
            }),
            messages: [`Formed ${lines} lines out of ${inputItems.length} items`]
          };
        }
      };
    }
  });

  // src/transformer/SortXWithinLines.ts
  var SortXWithinLines_exports = {};
  __export(SortXWithinLines_exports, {
    default: () => SortXWithinLines
  });
  var SortXWithinLines;
  var init_SortXWithinLines = __esm({
    "src/transformer/SortXWithinLines.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      SortXWithinLines = class extends ItemTransformer {
        constructor() {
          super("Sort by X", "Sorts the items of a line by the x coordinate", {
            requireColumns: ["line", "x"],
            debug: {
              itemMerger: new LineItemMerger()
            }
          });
        }
        transform(_, inputItems) {
          return {
            items: transformGroupedByPageAndLine(inputItems, (_2, __, items) => {
              return items.sort((a, b) => a.data["x"] - b.data["x"]);
            }),
            messages: []
          };
        }
      };
    }
  });

  // src/transformer/RemoveRepetitiveItems.ts
  var RemoveRepetitiveItems_exports = {};
  __export(RemoveRepetitiveItems_exports, {
    default: () => RemoveRepetitiveItems
  });
  function calculateScores(context, fringeYs, fringeLines) {
    const pageMapping = context.getGlobal(PAGE_MAPPING);
    const map = /* @__PURE__ */ new Map();
    fringeYs.forEach((y) => {
      const yLines = fringeLines.filter((line) => line.y == y);
      if (yLines.length < 2) {
        map.set(y, new Score(0, `0 (only on ${yLines.length} page(s))`));
      } else {
        const pageNumberScore = pageMapping.detectedOnPage ? calculatePageNumerScore(context.pageCount, pageMapping.pageFactor, yLines) : 0;
        const textSimilarityScore = textSimilarity(yLines);
        const totalScore = pageNumberScore + textSimilarityScore;
        map.set(
          y,
          new Score(
            totalScore,
            `${totalScore.toFixed(2)}: (${pageNumberScore.toFixed(2)} + ${textSimilarityScore.toFixed(2)})`
          )
        );
      }
    });
    return map;
  }
  function calculatePageNumerScore(pageCount, pageFactor, lines) {
    const maxPageNumbers = pageCount + pageFactor;
    const linesWithPageNumbers = lines.filter((line) => extractNumbers(line.text()).includes(line.page + pageFactor)).length;
    return linesWithPageNumbers / Math.min(maxPageNumbers, lines.length);
  }
  function textSimilarity(lines) {
    const similarities = flatMap(
      lines,
      (line, idx) => adiacentLines(lines, idx).map((adiacentLine) => calculateSimilarity(line, adiacentLine))
    );
    return median(similarities);
  }
  function calculateSimilarity(line1, line2) {
    if (line1.textWithoutNumbers().length === 0) {
      return 0;
    }
    return (0, import_string_similarity.compareTwoStrings)(line1.textWithoutNumbers(), line2.textWithoutNumbers());
  }
  function adiacentLines(lines, index) {
    let neighbours;
    if (index + config2.neighbourReach < lines.length) {
      neighbours = lines.slice(index + 1, index + config2.neighbourReach + 1);
    } else if (index - config2.neighbourReach >= 0) {
      neighbours = lines.slice(index - config2.neighbourReach - 1, index - 1);
    } else {
      neighbours = lines.filter((_, idx) => idx !== index);
    }
    return neighbours;
  }
  function yFromLineItems(lineItems) {
    return Math.round(mostFrequent(lineItems, "y"));
  }
  var import_string_similarity, config2, RemoveRepetitiveItems, Score, PageLine;
  var init_RemoveRepetitiveItems = __esm({
    "src/transformer/RemoveRepetitiveItems.ts"() {
      "use strict";
      import_string_similarity = __require("string-similarity");
      init_ItemTransformer();
      init_LineItemMerger();
      init_CacluclateStatistics();
      init_groupingUtils();
      init_stringFunctions();
      init_stringFunctions();
      config2 = {
        // From the absolute fringe elements (min/max y) how much y can item deviate before beeing disregarded.
        maxDistanceFromFringeElements: 45,
        // Max neighbour taken (in one direction) for detecting neighbour similarity.
        // Choosen number might be more effectful for PDFs with a strong odd/evan page differernce.
        neighbourReach: 2,
        minScore: 0.7
      };
      RemoveRepetitiveItems = class extends ItemTransformer {
        constructor() {
          super("Remove Repetitive Items", "Remove things like page numbers or license footers.", {
            requireColumns: ["x", "y", "str", "line"],
            debug: {
              itemMerger: new LineItemMerger()
            }
          });
        }
        transform(context, inputItems) {
          const minY = context.getGlobal(MIN_Y);
          const maxY = context.getGlobal(MAX_Y);
          const bottomMaxY = minY + config2.maxDistanceFromFringeElements;
          const topMinY = maxY - config2.maxDistanceFromFringeElements;
          const fringeItems = inputItems.filter((item) => {
            const y = item.data["y"];
            return y <= bottomMaxY || y >= topMinY;
          });
          const fringeLines = flatMap(
            groupByPage(fringeItems).map(
              (pageItems) => groupByLine(pageItems).map((lineItems) => {
                const lineY = yFromLineItems(lineItems);
                return new PageLine(pageItems[0].page, lineY, lineItems);
              }).sort((a, b) => a.y - b.y)
            ),
            (e) => e
          );
          const fringeYs = fringeLines.map((line) => line.y).filter(onlyUniques).sort(ascending);
          const yScoreMap = calculateScores(context, fringeYs, fringeLines);
          let removalCount = 0;
          const removedY = [...yScoreMap.entries()].filter(([_, value]) => value.value >= config2.minScore).map(([key, _]) => key).join("||");
          return {
            items: transformGroupedByPageAndLine(inputItems, (_, __, lineItems) => {
              const itemsY = yFromLineItems(lineItems);
              const score = yScoreMap.get(itemsY);
              if (score) {
                lineItems.forEach((item) => context.trackEvaluation(item, score.description));
                if (score.value >= config2.minScore) {
                  removalCount++;
                  return [];
                }
              }
              return lineItems;
            }),
            messages: [`Filtered out ${removalCount} items with y == ${removedY}`]
          };
        }
      };
      Score = class {
        constructor(value, description) {
          this.value = value;
          this.description = description;
        }
      };
      PageLine = class {
        constructor(page, y, items) {
          this.page = page;
          this.y = y;
          this.items = items;
        }
        text() {
          if (!this._text) {
            this._text = this.items.reduce((all, item) => all + item.data["str"], "");
          }
          return this._text;
        }
        textWithoutNumbers() {
          if (!this._textWithoutNumbers) {
            this._textWithoutNumbers = filterOutDigits(this.text());
          }
          return this._textWithoutNumbers;
        }
      };
    }
  });

  // src/support/numberFunctions.ts
  function numbersAreConsecutive(numbers) {
    return numbers.every((num, idx) => idx > 0 ? num === numbers[idx - 1] + 1 : true);
  }
  var init_numberFunctions = __esm({
    "src/support/numberFunctions.ts"() {
      "use strict";
    }
  });

  // src/TOC.ts
  var TOC;
  var init_TOC = __esm({
    "src/TOC.ts"() {
      "use strict";
      TOC = class {
        constructor(tocHeadlineItems, pages, detectedHeadlineLevels) {
          this.tocHeadlineItems = tocHeadlineItems;
          this.pages = pages;
          this.detectedHeadlineLevels = detectedHeadlineLevels;
        }
        startPage() {
          return Math.min(...this.pages);
        }
        endPage() {
          return Math.max(...this.pages);
        }
      };
    }
  });

  // src/FontType.ts
  function declaredFontTypes(fontName) {
    const fontNameLowerCase = fontName.toLowerCase();
    const boldAndOblique = boldAndObliqueTypeFragments.find((fragment) => fontNameLowerCase.includes(fragment));
    let bold;
    let oblique;
    if (boldAndOblique) {
      bold = true;
      oblique = true;
    } else {
      bold = !!boldTypeFragments.find((fragment) => fontNameLowerCase.includes(fragment));
      oblique = !!obliqueTypeFragments.find((fragment) => fontNameLowerCase.includes(fragment));
    }
    const fontTypes = [];
    if (bold) {
      fontTypes.push("BOLD" /* BOLD */);
    }
    if (oblique) {
      fontTypes.push("OBLIQUE" /* OBLIQUE */);
    }
    return fontTypes;
  }
  var FontType, FontType_default, boldTypeFragments, obliqueTypeFragments, boldAndObliqueTypeFragments;
  var init_FontType = __esm({
    "src/FontType.ts"() {
      "use strict";
      FontType = /* @__PURE__ */ ((FontType2) => {
        FontType2["BOLD"] = "BOLD";
        FontType2["OBLIQUE"] = "OBLIQUE";
        return FontType2;
      })(FontType || {});
      FontType_default = FontType;
      boldTypeFragments = [
        "bold",
        "heavy",
        "cmb",
        "cmbx",
        "cmbsy",
        "cmssbx",
        "logobf",
        "lcmssb",
        "eufb",
        "eurb",
        "eusb",
        "cmcbx",
        "cmcb",
        "cmcbxsl",
        "cmcssbx",
        "ecbl",
        "tcbl",
        "ecbx",
        "tcbx",
        "ecrb",
        "tcrb",
        "ecxc",
        "ecoc",
        "ecsx",
        "tcsx",
        "labl",
        "labx",
        "larb",
        "laxc",
        "laoc",
        "lasx",
        "t1bx",
        "t1b",
        "t1bxsl",
        "t1ssbx",
        "t2bx",
        "t2b",
        "t2ssbx"
      ];
      obliqueTypeFragments = [
        "oblique",
        "italic",
        "cmti",
        "cmmi",
        "cmu",
        "cmitt",
        "cmssi",
        "cmssqi",
        "cmfi",
        "lcmssi",
        "cmcti",
        "cmcbxti",
        "cmcitt",
        "cmcssi",
        "cmcssqi",
        "ccti",
        "eoti",
        "toti",
        "ecti",
        "tcti",
        "ecci",
        "tcci",
        "ecui",
        "tcui",
        "ecit",
        "tcit",
        "ecvi",
        "tcvi",
        "lati",
        "laci",
        "laui",
        "lait",
        "lavi",
        "t1ti",
        "t1itt",
        "t1ssi",
        "t2ti",
        "t2itt",
        "t2ssi"
      ];
      boldAndObliqueTypeFragments = [
        "cmmib",
        "cmbxti",
        "ecbi",
        "tcbi",
        "ecso",
        "tcso",
        "labi",
        "laso",
        "t1bxti",
        "t2bxti"
      ];
    }
  });

  // src/support/items.ts
  function get(item, name) {
    const value = item.data[name];
    assertDefined(value, `No '${name}' defined in ${JSON.stringify(item)}`);
    return value;
  }
  function getHeight(item) {
    return get(item, "height");
  }
  function getText(item) {
    return get(item, "str");
  }
  function getFontName(fontMap, item) {
    const fontId = item.data["fontName"];
    const fontObject = fontMap.get(fontId);
    if (!fontObject) {
      return fontId;
    }
    return assertDefined(fontObject["name"], `No 'name' found in ${JSON.stringify(fontObject)}`);
  }
  function itemWithType(item, type) {
    const existingTypes = item.data["types"] || [];
    return item.withDataAddition({ types: [...existingTypes, type].filter(onlyUniques) });
  }
  var init_items = __esm({
    "src/support/items.ts"() {
      "use strict";
      init_assert();
      init_groupingUtils();
    }
  });

  // src/text-types.ts
  function types(...types2) {
    return types2;
  }
  function toBlockType(type) {
    if (type === "NUMBERED_LIST") {
      return "LIST";
    }
    return type;
  }
  function isHeadline(type) {
    return types("H1", "H2", "H3", "H4", "H5", "H6").includes(type);
  }
  function toHeadlineType(number) {
    assert(number > 0 && number < 7, `Expected headline level between 1 and 6 but was ${number}`);
    return `H${number.toString()}`;
  }
  function mergeToBlock(type) {
    return types("FOOTNOTES", "CODE", "LIST", "NUMBERED_LIST").includes(type);
  }
  function mergeFollowingNonTypedItems(type) {
    return types("FOOTNOTES").includes(type);
  }
  function mergeFollowingNonTypedItemsWithSmallDistance(type) {
    return types("LIST", "NUMBERED_LIST").includes(type);
  }
  var init_text_types = __esm({
    "src/text-types.ts"() {
      "use strict";
      init_assert();
    }
  });

  // src/transformer/DetectToc.ts
  var DetectToc_exports = {};
  __export(DetectToc_exports, {
    HEADLINE_TYPE_TO_HEIGHT_RANGE: () => HEADLINE_TYPE_TO_HEIGHT_RANGE,
    TOC_GLOBAL: () => TOC_GLOBAL,
    default: () => DetectToc
  });
  function findTocArea(pagesToEvaluate, pageCount, maxPageToBeLinkedTo) {
    const linesWithNumber = [];
    pagesToEvaluate.forEach((pageItems) => {
      const itemsGroupedByLine = groupByLine(pageItems);
      itemsGroupedByLine.forEach((lineItems) => {
        const number = findEndingNumber(lineItems);
        if (number && Number.isInteger(number) && number > 0 && number <= maxPageToBeLinkedTo && lineItems.map((item) => item.data["str"]).join("").length > config3.linkMinLength) {
          const page = lineItems[0].page;
          const startItemUuid = lineItems[0].uuid;
          const y = lineItems[0].data["y"];
          linesWithNumber.push({ page, startItemUuid, y, number });
        }
      });
    });
    if (linesWithNumber.length <= 0) {
      return void 0;
    }
    const lineNumberClusters = linesWithNumber.reduce(
      (arrayOfAscendingNumberArrays, lineWithNumber) => {
        if (arrayOfAscendingNumberArrays.length == 0) {
          return [[lineWithNumber]];
        }
        const lastArray = arrayOfAscendingNumberArrays[arrayOfAscendingNumberArrays.length - 1];
        const lastNumber = lastArray[lastArray.length - 1];
        if (lineWithNumber.number >= lastNumber.number) {
          lastArray.push(lineWithNumber);
        } else {
          arrayOfAscendingNumberArrays.push([lineWithNumber]);
        }
        return arrayOfAscendingNumberArrays;
      },
      []
    );
    lineNumberClusters.sort((a, b) => b.length - a.length);
    if (lineNumberClusters[0].length < 3) {
      return void 0;
    }
    const selectedLines = lineNumberClusters[0];
    const pages = selectedLines.map((l) => l.page).filter(onlyUniques);
    if (!numbersAreConsecutive(pages)) {
      return void 0;
    }
    if (pages.length > selectedLines.length / 5) {
      return void 0;
    }
    return {
      pages,
      linesWithNumbers: selectedLines
    };
  }
  function findEndingNumber(lineItems) {
    const text = lineItems.reduce((text2, item) => {
      return text2 + item.data["str"];
    }, "").trim();
    return extractEndingNumber(text);
  }
  function selectRawTocEntries(tocArea, itemsInTocArea) {
    const numbersByStartUuid = tocArea.linesWithNumbers.reduce((map, l) => {
      map.set(l.startItemUuid, l.number);
      return map;
    }, /* @__PURE__ */ new Map());
    const itemsInTocAreaByLine = groupByLine(itemsInTocArea);
    const maxHeightOfNumberedLines = Math.max(
      ...itemsInTocAreaByLine.reduce((lineHeights, lineItems) => {
        if (numbersByStartUuid.has(lineItems[0].uuid)) {
          lineHeights.push(Math.max(...lineItems.map((line) => line.data["height"])));
        }
        return lineHeights;
      }, []).filter(onlyUniques)
    );
    const maxLinesBetweenLinesWithNumbers = Math.max(
      ...itemsInTocAreaByLine.reduce((lineDistance, lineItems) => {
        if (numbersByStartUuid.has(lineItems[0].uuid)) {
          lineDistance.push(-1);
        }
        if (lineDistance.length > 0) {
          lineDistance[lineDistance.length - 1]++;
        }
        return lineDistance;
      }, []).filter(onlyUniques)
    );
    const linesWithNumbersByPage = groupBy2(tocArea.linesWithNumbers, (line) => line.page);
    const maxYBetweenLinesWithNumbers = Math.max(
      ...linesWithNumbersByPage.map((pageLines) => {
        return pageLines.reduce(
          (previous, line) => {
            const y = line.y;
            if (previous.y == -1) {
              return { y, distance: -1 };
            }
            return {
              y,
              distance: Math.max(Math.abs(y - previous.y), previous.distance)
            };
          },
          { y: -1, distance: -1 }
        ).distance;
      })
    );
    const rawTocEntries = [];
    itemsInTocAreaByLine.reduce((beforeLines, lineItems) => {
      const number = numbersByStartUuid.get(lineItems[0].uuid);
      if (!number) {
        beforeLines.push(lineItems);
        return beforeLines;
      }
      const validBeforeLines = beforeLines.filter((beforLine, beforeIndex) => {
        const yDistance = Math.abs(beforLine[0].data["y"] - lineItems[0].data["y"]);
        const beforLineHeight = Math.max(...beforLine.map((item) => item.data["height"]));
        const beforeLineMuchLarger = beforLineHeight > maxHeightOfNumberedLines;
        return !beforeLineMuchLarger && beforeLines.length - beforeIndex <= maxLinesBetweenLinesWithNumbers && yDistance <= maxYBetweenLinesWithNumbers;
      });
      const entryLines = [...validBeforeLines, lineItems];
      rawTocEntries.push({
        linkedPage: number,
        entryLines
      });
      return [];
    }, []);
    return rawTocEntries;
  }
  function findTocHeadline(fontMap, mostUsedHeight, tocArea, itemsInTocArea, tocItemUuids) {
    const firstPageNonTocItems = itemsInTocArea.filter((item) => item.page == tocArea.pages[0]).filter((item) => !tocItemUuids.has(item.uuid));
    const itemsGroupedByLine = groupByLine(firstPageNonTocItems).filter(
      (lineItems) => hasHeadlineSymptoms(fontMap, mostUsedHeight, lineItems)
    );
    if (itemsGroupedByLine.length == 0) {
      return [];
    }
    return itemsGroupedByLine[itemsGroupedByLine.length - 1];
  }
  function findTocEntryHeadlineLevels(rawTocEntries) {
    const height = (entry) => Math.round(getHeight(entry.entryLines[0][0]));
    const allHeights = rawTocEntries.map(height).filter(onlyUniques).sort(descending);
    if (allHeights.length > 3) {
      return rawTocEntries.map(() => "H2");
    }
    return rawTocEntries.map((entry) => {
      const index = allHeights.indexOf(height(entry));
      return toHeadlineType(index + 2);
    });
  }
  function findHeadline(fontMap, items, mostUsedHeight, targetPage, targetPageIndex, entryLines) {
    const tocEntryText = normalizeHeadlineChars(entryLines).replace(new RegExp(targetPage + "$", "g"), "").replace(new RegExp("\\.\\.*$", "g"), "");
    const pageItems = items.filter((item) => item.page == targetPageIndex);
    const canditate = fineMatchingHeadlineCanditate(tocEntryText, pageItems, fontMap, mostUsedHeight);
    if (canditate.length > 0) {
      return canditate.reduce((itemUuids, lineItems) => {
        lineItems.forEach((item) => itemUuids.add(item.uuid));
        return itemUuids;
      }, /* @__PURE__ */ new Set());
    }
    return void 0;
  }
  function fineMatchingHeadlineCanditate(tocEntryText, pageItems, fontMap, mostUsedHeight) {
    const itemsByLine = groupByLine(pageItems);
    let headlineCanditates = [];
    let currentLines = [];
    let currentScore = 0;
    let currentText = "";
    for (let lineIdx = 0; lineIdx < itemsByLine.length; lineIdx++) {
      const lineItems = itemsByLine[lineIdx];
      const lineText = normalizeHeadlineChars([lineItems]);
      const lineInLink = tocEntryText.includes(lineText);
      const headlineSymptoms = hasHeadlineSymptoms(fontMap, mostUsedHeight, lineItems);
      if (lineInLink && headlineSymptoms) {
        const newText = currentText + lineText;
        const newScore = (0, import_string_similarity2.compareTwoStrings)(newText, tocEntryText);
        if (newScore > currentScore) {
          currentScore = newScore;
          currentText = newText;
          currentLines.push(lineItems);
          if (newScore == 1) {
            return currentLines;
          }
        } else if (currentScore > 0.95) {
          return currentLines;
        }
      } else {
        if (currentLines.length > 0) {
          headlineCanditates.push({ score: currentScore, lines: currentLines });
          currentLines = [];
          currentScore = 0;
          currentText = "";
        }
      }
    }
    headlineCanditates = headlineCanditates.filter((candidate) => candidate.score > 0.5);
    if (headlineCanditates.length == 0) {
      return [];
    }
    return headlineCanditates.sort((a, b) => a.score - b.score)[0].lines;
  }
  function hasHeadlineSymptoms(fontMap, mostUsedHeight, lineItems) {
    return getHeight(lineItems[0]) >= mostUsedHeight + config3.minHeadlineDistance || declaredFontTypes(getFontName(fontMap, lineItems[0])).includes(FontType_default.BOLD);
  }
  function normalizeHeadlineChars(lines) {
    const text = flatten(lines).map((item) => getText(item)).join("");
    return filterOut(text, [
      WHITESPACE_CHAR_CODE,
      TAB_CHAR_CODE,
      ...DASHS_CHAR_CODES,
      ...PERIOD_CHAR_CODES
    ]).toLowerCase();
  }
  var import_string_similarity2, config3, TOC_GLOBAL, HEADLINE_TYPE_TO_HEIGHT_RANGE, DetectToc;
  var init_DetectToc = __esm({
    "src/transformer/DetectToc.ts"() {
      "use strict";
      import_string_similarity2 = __require("string-similarity");
      init_ItemTransformer();
      init_GlobalDefinition();
      init_LineItemMerger();
      init_groupingUtils();
      init_CacluclateStatistics();
      init_stringFunctions();
      init_numberFunctions();
      init_TOC();
      init_FontType();
      init_functional();
      init_items();
      init_text_types();
      config3 = {
        // How many characters a line with a ending number needs to have minimally to be a valid link
        linkMinLength: 4,
        // How much bigger (height) then a 'normal' text a headline must be
        // TODO sync with DetectHeadline ??
        minHeadlineDistance: 1.5
      };
      TOC_GLOBAL = new GlobalDefinition("toc");
      HEADLINE_TYPE_TO_HEIGHT_RANGE = new GlobalDefinition(
        "headlineTypeToHeightRange"
      );
      DetectToc = class extends ItemTransformer {
        constructor() {
          super(
            "Detect TOC",
            "Detect table of contents.",
            {
              requireColumns: ["x", "y", "str", "line"],
              producesGlobels: [TOC_GLOBAL.key, HEADLINE_TYPE_TO_HEIGHT_RANGE.key],
              debug: {
                itemMerger: new LineItemMerger()
              }
            },
            (incomingSchema) => {
              return incomingSchema.reduce((schema, column) => {
                if (column === "x") {
                  return [...schema, "types", "x"];
                }
                return [...schema, column];
              }, new Array());
            }
          );
        }
        transform(context, inputItems) {
          const pageMapping = context.getGlobal(PAGE_MAPPING);
          const mostUsedHeight = context.getGlobal(MOST_USED_HEIGHT);
          const maxPageToEvaluate = Math.min(context.pageCount / 2, 5 + Math.abs(pageMapping.pageFactor));
          const pagesToEvaluate = groupByPage(inputItems.filter((item) => item.page <= maxPageToEvaluate));
          const maxPageToBeLinkedTo = context.pageCount + pageMapping.pageFactor - 1;
          const tocArea = findTocArea(pagesToEvaluate, context.pageCount, maxPageToBeLinkedTo);
          if (!tocArea) {
            return { items: inputItems, messages: ["No Table of Contents found!"] };
          }
          const itemsInTocArea = inputItems.filter((item) => tocArea.pages.includes(item.page));
          const rawTocEntries = selectRawTocEntries(tocArea, itemsInTocArea);
          const headlineLevels = findTocEntryHeadlineLevels(rawTocEntries);
          const tocItemUuids = new Set(
            flatten(flatten(rawTocEntries.map((e) => e.entryLines))).map((item) => item.uuid)
          );
          const tocHeadline = findTocHeadline(context.fontMap, mostUsedHeight, tocArea, itemsInTocArea, tocItemUuids);
          const notFoundHeadlines = [];
          const foundHeadlines = [];
          const headlineTypeToHeightRange = {};
          rawTocEntries.forEach((rawEntry, index) => {
            const itemType = headlineLevels[index];
            const uuids = findHeadline(
              context.fontMap,
              inputItems,
              mostUsedHeight,
              rawEntry.linkedPage,
              rawEntry.linkedPage - pageMapping.pageFactor,
              rawEntry.entryLines
            );
            if (uuids) {
              foundHeadlines.push({ level: itemType, uuids });
              const headlineHeight = inputItems.filter((item) => uuids.has(item.uuid)).reduce((maxHeight, item) => Math.max(maxHeight, item.data["height"]), 0);
              let range = headlineTypeToHeightRange[itemType];
              if (range) {
                range.min = Math.min(range.min, headlineHeight);
                range.max = Math.max(range.max, headlineHeight);
              } else {
                range = {
                  min: headlineHeight,
                  max: headlineHeight
                };
                headlineTypeToHeightRange[itemType] = range;
              }
            } else {
              notFoundHeadlines.push(rawEntry);
            }
          });
          const headlineUuidToLevelMap = foundHeadlines.reduce((uidToLevel, headline) => {
            headline.uuids.forEach((uuid) => {
              uidToLevel.set(uuid, headline.level);
            });
            return uidToLevel;
          }, /* @__PURE__ */ new Map());
          const headlineTypes = foundHeadlines.reduce((allLevels, headline) => {
            allLevels.add(headline.level);
            return allLevels;
          }, /* @__PURE__ */ new Set());
          const tocHeadlineUuids = new Set(tocHeadline.map((item) => item.uuid));
          return {
            items: inputItems.filter((item) => !tocHeadlineUuids.has(item.uuid)).filter((item) => !tocArea.pages.includes(item.page) || !tocItemUuids.has(item.uuid)).map((item) => {
              const itemType = headlineUuidToLevelMap.get(item.uuid);
              if (itemType) {
                return itemWithType(item, itemType);
              }
              return item;
            }),
            messages: [
              `Detected and removed ${rawTocEntries.length} TOC entries`,
              `Found ${foundHeadlines.length} matching headlines`
            ],
            globals: [
              TOC_GLOBAL.value(new TOC(tocHeadline, tocArea.pages, headlineTypes)),
              HEADLINE_TYPE_TO_HEIGHT_RANGE.value(headlineTypeToHeightRange)
            ]
          };
        }
      };
    }
  });

  // src/transformer/DetectHeaders.ts
  var DetectHeaders_exports = {};
  __export(DetectHeaders_exports, {
    default: () => DetectHeaders
  });
  function detectTitlePageHeaders(inputItems, itemsByLine, maxTitlePage, mostUsedHeight, maxHeight, itemToLevel) {
    const min2ndLevelHeaderHeigthOnMaxPage = mostUsedHeight + (maxHeight - mostUsedHeight) / 4;
    const pagesHavingMaxHeightItems = inputItems.filter((item) => item.page <= maxTitlePage).filter((item) => item.data["height"] === maxHeight).map((item) => item.page).filter(onlyUniques);
    let detectedHeaders = 0;
    itemsByLine.filter((items) => pagesHavingMaxHeightItems.includes(items[0].page)).forEach((lineItems) => {
      const height = Math.max(...lineItems.map((item) => item.data["height"]));
      if (height > min2ndLevelHeaderHeigthOnMaxPage) {
        if (height == maxHeight) {
          lineItems.forEach((item) => itemToLevel.set(item.uuid, "H1"));
        } else {
          lineItems.forEach((item) => itemToLevel.set(item.uuid, "H2"));
        }
        detectedHeaders++;
      }
    });
    return detectedHeaders;
  }
  var config4, DetectHeaders;
  var init_DetectHeaders = __esm({
    "src/transformer/DetectHeaders.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      init_CacluclateStatistics();
      init_DetectToc();
      init_functional();
      init_items();
      init_text_types();
      config4 = {
        // How much taller a text must be to be a headline (relative to mostUsedHeight)
        minHeadlineDistance: 1.3
      };
      DetectHeaders = class extends ItemTransformer {
        constructor() {
          super("Detect Headers", "Detect Headers from Level 1 to 6", {
            requireColumns: ["str", "y", "height", "line", "fontName"],
            debug: {
              // showAll: true,
              itemMerger: new LineItemMerger(false)
            }
          });
        }
        transform(context, inputItems) {
          const maxHeight = context.getGlobal(MAX_HEIGHT);
          const mostUsedHeight = context.getGlobal(MOST_USED_HEIGHT);
          const toc = context.getGlobalOptionally(TOC_GLOBAL);
          const headlineTypeToHeightRange = context.getGlobalOptionally(HEADLINE_TYPE_TO_HEIGHT_RANGE);
          const itemsByLine = groupByLine(inputItems);
          const itemToLevel = /* @__PURE__ */ new Map();
          const maxTitlePage = toc ? toc.startPage() : Math.min(5, context.pageCount - 3);
          let detectedHeaders = detectTitlePageHeaders(
            inputItems,
            itemsByLine,
            maxTitlePage,
            mostUsedHeight,
            maxHeight,
            itemToLevel
          );
          const hasHeaderType = (types2) => types2.find((t) => isHeadline(t));
          if (toc && headlineTypeToHeightRange) {
            const headlineTypes = Object.keys(headlineTypeToHeightRange);
            headlineTypes.forEach((headlineType) => {
              const range = headlineTypeToHeightRange[headlineType];
              if (range.max > mostUsedHeight) {
                inputItems.forEach((item) => {
                  const itemHeight = item.data["height"];
                  const types2 = item.data["types"] || itemToLevel.has(item.uuid) ? [itemToLevel.get(item.uuid)] : [];
                  const isHeader = hasHeaderType(types2);
                  if (!isHeader && itemHeight === range.max) {
                    itemToLevel.set(item.uuid, headlineType);
                    detectedHeaders++;
                  }
                });
              }
            });
          }
          const heights = [];
          itemsByLine.filter((lineItems) => !itemToLevel.has(lineItems[0].uuid)).map((lineItems) => {
            const maxHeight2 = Math.max(...lineItems.map((item) => item.data["height"]));
            if (maxHeight2 > mostUsedHeight * config4.minHeadlineDistance && !heights.includes(maxHeight2)) {
              heights.push(maxHeight2);
            }
          });
          const heightToHeadline = /* @__PURE__ */ new Map();
          heights.sort((a, b) => b - a);
          heights.forEach((height, i) => {
            const headlineLevel = i + 2;
            if (headlineLevel <= 6) {
              const headlineType = toHeadlineType(2 + i);
              heightToHeadline.set(height, headlineType);
            }
          });
          itemsByLine.filter((lineItems) => !itemToLevel.has(lineItems[0].uuid)).forEach((lineItems) => {
            const maxHeight2 = Math.max(...lineItems.map((item) => item.data["height"]));
            const types2 = flatten(lineItems.map((item) => item.data["types"] || [])).filter(onlyUniques);
            if (!hasHeaderType(types2) && !itemToLevel.has(lineItems[0].uuid)) {
              const headlineType = heightToHeadline.get(maxHeight2);
              if (headlineType && !types2.includes("H1") && !types2.includes("H2")) {
                lineItems.forEach((item) => itemToLevel.set(item.uuid, headlineType));
                detectedHeaders++;
              }
            }
          });
          return {
            items: inputItems.map((item) => {
              const headerType = itemToLevel.get(item.uuid);
              if (headerType) {
                const hasAlreadyHeadline = item.data["types"] || [].find((t) => isHeadline(t));
                if (!hasAlreadyHeadline) {
                  return itemWithType(item, headerType);
                }
              }
              return item;
            }),
            messages: [`Detected ${detectedHeaders} headers`]
          };
        }
      };
    }
  });

  // src/transformer/NoOpTransformer.ts
  var NoOpTransformer_exports = {};
  __export(NoOpTransformer_exports, {
    default: () => NoOpTransformer
  });
  var NoOpTransformer;
  var init_NoOpTransformer = __esm({
    "src/transformer/NoOpTransformer.ts"() {
      "use strict";
      init_ItemTransformer();
      NoOpTransformer = class extends ItemTransformer {
        constructor() {
          super("Does nothing", "Simply for displaying the results.", {
            debug: {
              showAll: true
            }
          });
        }
        transform(_, inputItems) {
          return {
            items: inputItems,
            messages: []
          };
        }
      };
    }
  });

  // src/transformer/DetectListItems.ts
  var DetectListItems_exports = {};
  __export(DetectListItems_exports, {
    default: () => DetectListItems
  });
  var DetectListItems;
  var init_DetectListItems = __esm({
    "src/transformer/DetectListItems.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      init_items();
      init_stringFunctions();
      DetectListItems = class extends ItemTransformer {
        constructor() {
          super("Detect List Items", "Detect Lists with nesting", {
            requireColumns: ["str"],
            debug: {
              // showAll: true,
              itemMerger: new LineItemMerger(false)
            }
          });
        }
        transform(context, inputItems) {
          let foundListItems = 0;
          let foundNumberedItems = 0;
          const uuidsToType = /* @__PURE__ */ new Map();
          groupByLine(inputItems).forEach((lineItems) => {
            const types2 = lineItems[0].data["types"];
            if (!types2) {
              const firstText = lineItems[0].data["str"];
              if (isListItemCharacter(firstText)) {
                foundListItems++;
                lineItems.forEach((i) => uuidsToType.set(i.uuid, "LIST"));
              } else if (isNumberedListItem(firstText)) {
                foundNumberedItems++;
                lineItems.forEach((i) => uuidsToType.set(i.uuid, "NUMBERED_LIST"));
              }
            }
          });
          return {
            items: inputItems.map((item) => {
              const listType = uuidsToType.get(item.uuid);
              if (listType) {
                return itemWithType(item, listType);
              }
              return item;
            }),
            messages: [`Detected ${foundListItems} list items`, `Detected ${foundNumberedItems} numbered list items`]
          };
        }
      };
    }
  });

  // src/transformer/DetectBlocks.ts
  var DetectBlocks_exports = {};
  __export(DetectBlocks_exports, {
    default: () => DetectBlocks,
    minXFromPageItems: () => minXFromPageItems
  });
  function minXFromPageItems(items) {
    let minX = 999;
    items.forEach((item) => {
      minX = Math.min(minX, item.data["x"]);
    });
    if (minX == 999) {
      return null;
    }
    return minX;
  }
  function shouldFlushBlock(stashedBlock, lineItems, minX, mostUsedDistance) {
    const lineType = toLineType(lineItems);
    if (stashedBlock.type && mergeFollowingNonTypedItems(stashedBlock.type) && !lineType) {
      return false;
    }
    const hasBigDistance = bigDistance(stashedBlock, lineItems, minX, mostUsedDistance);
    if (stashedBlock.type && mergeFollowingNonTypedItemsWithSmallDistance(stashedBlock.type) && !lineType && !hasBigDistance) {
      return false;
    }
    if (toBlockType(lineType) !== toBlockType(stashedBlock.type)) {
      return true;
    }
    if (lineType) {
      return !mergeToBlock(lineType);
    } else {
      return hasBigDistance;
    }
  }
  function bigDistance(block, lineItems, minX, mostUsedDistance) {
    const lineX = Math.min(...lineItems.map((item) => item.data["x"]));
    const lineY = Math.min(...lineItems.map((item) => item.data["y"]));
    const distance = block.minY - lineY;
    if (distance < 0 - mostUsedDistance / 2) {
      return true;
    }
    let allowedDisctance = mostUsedDistance + 1;
    if (block.minX > minX && lineX > minX) {
      allowedDisctance = mostUsedDistance + mostUsedDistance / 2;
    }
    if (distance > allowedDisctance) {
      return true;
    }
    return false;
  }
  function toLineType(lineItems) {
    const types2 = flatten(lineItems.map((item) => item.data["types"] || [])).filter(onlyUniques);
    if (types2.length > 1) {
      throw `more than 1 type: ${types2}`;
    }
    return types2.length == 1 ? types2[0] : null;
  }
  var DetectBlocks, Block;
  var init_DetectBlocks = __esm({
    "src/transformer/DetectBlocks.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      init_CacluclateStatistics();
      init_functional();
      init_text_types();
      init_assert();
      DetectBlocks = class extends ItemTransformer {
        constructor() {
          super(
            "Detect Blocks",
            "Like paragraphs, a list, etc...",
            {
              requireColumns: ["str", "x", "y"],
              debug: {
                showAll: false,
                itemMerger: new LineItemMerger(false)
              }
            },
            (incomingSchema) => {
              return incomingSchema.reduce((schema, column) => {
                if (column === "line") {
                  return [...schema, "block", "line"];
                }
                return [...schema, column];
              }, new Array());
            }
          );
        }
        transform(context, inputItems) {
          const mostUsedDistance = context.getGlobal(MOST_USED_DISTANCE);
          let createdBlocks = 0;
          let lineItemCount = 0;
          const blocks = [];
          let currentBlock = new Block();
          groupByPage(inputItems).forEach((pageItems) => {
            const flushStashedItems = () => {
              if (currentBlock.entries.size > 0) {
                blocks.push(currentBlock);
                currentBlock = new Block();
                createdBlocks++;
              }
            };
            const minX = minXFromPageItems(pageItems);
            groupByLine(pageItems).forEach((lineItems) => {
              lineItemCount++;
              if (currentBlock.entries.size > 0 && shouldFlushBlock(currentBlock, lineItems, minX, mostUsedDistance)) {
                flushStashedItems();
              }
              currentBlock.addLine(lineItems);
            });
            if (currentBlock.entries.size > 0) {
              flushStashedItems();
            }
          });
          return {
            items: inputItems.map((item) => {
              for (let i = 0; i < blocks.length; i++) {
                const isInBlock = blocks[i].entries.has(item.uuid);
                if (isInBlock) {
                  return item.withDataAddition({ block: i });
                }
              }
              throw new Error("Item not in any block");
            }),
            messages: ["Gathered " + createdBlocks + " blocks out of " + lineItemCount + " line items"]
          };
        }
      };
      Block = class {
        constructor() {
          this.type = null;
          this.entries = /* @__PURE__ */ new Set();
        }
        addLine(items) {
          const lineType = toLineType(items);
          if (this.type) {
            assert(
              !lineType || toBlockType(lineType) === this.type,
              `Adding line of type ${lineType} to block of type ${this.type}`
            );
          } else {
            this.type = toBlockType(lineType);
          }
          this.minX = min(
            items.map((item) => item.data["x"]),
            this.minX
          );
          this.minY = min(
            items.map((item) => item.data["y"]),
            this.minY
          );
          items.forEach((item) => this.entries.add(item.uuid));
        }
      };
    }
  });

  // src/transformer/DetectListLevels.ts
  var DetectListLevels_exports = {};
  __export(DetectListLevels_exports, {
    default: () => DetectListLevels
  });
  var DetectListLevels;
  var init_DetectListLevels = __esm({
    "src/transformer/DetectListLevels.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      init_text_types();
      init_stringFunctions();
      DetectListLevels = class extends ItemTransformer {
        constructor() {
          super("Detect List Levels", "Figure out the nesting levels of each list item", {
            requireColumns: ["str", "block", "x"],
            debug: {
              // showAll: true,
              itemMerger: new LineItemMerger(false)
            }
          });
        }
        // TODO instead of changing the 'str' we should annotate the item and let the converters do their thing
        transform(context, inputItems) {
          let listBlocks = 0;
          let modifiedBlocks = 0;
          groupByBlock(inputItems).filter((blockItems) => {
            const types2 = blockItems[0].data["types"] || [];
            return types2.map(toBlockType).includes("LIST");
          }).forEach((blockItems) => {
            let lastItemX;
            let currentLevel = 0;
            const xByLevel = {};
            let modifiedBlock = false;
            let isOverflowLine = false;
            groupByLine(blockItems).forEach((lineItems) => {
              const firstItem = lineItems[0];
              const isLineItem = isListItem(firstItem.data["str"] + " ...") || isNumberedListItem(firstItem.data["str"] + " ...");
              const x = firstItem.data["x"];
              if (lastItemX) {
                if (isLineItem) {
                  if (isGreaterWithTolerance(x, lastItemX)) {
                    currentLevel++;
                    xByLevel[x] = currentLevel;
                  } else if (x < lastItemX) {
                    currentLevel = xByLevel[x];
                  }
                } else {
                  isOverflowLine = true;
                }
              } else {
                xByLevel[x] = 0;
              }
              if (currentLevel > 0) {
                lineItems[0].listLevel = currentLevel;
                modifiedBlock = true;
                if (isOverflowLine) {
                }
              }
              if (!isOverflowLine) {
                lastItemX = x;
              }
              isOverflowLine = false;
            });
            listBlocks++;
            if (modifiedBlock) {
              modifiedBlocks++;
            }
          });
          return {
            items: inputItems.map((item) => {
              return item;
            }),
            messages: ["Modified " + modifiedBlocks + " / " + listBlocks + " list blocks."]
          };
        }
      };
    }
  });

  // src/transformer/DetectFootnotes.ts
  var DetectFootnotes_exports = {};
  __export(DetectFootnotes_exports, {
    default: () => DetectFootnotes
  });
  function hasPreceedingText(lineItems, lineIndex) {
    for (let index = lineIndex - 1; index >= 0; index--) {
      const itemText = lineItems[index].data["str"].trim();
      if (!isNumber(itemText)) {
        return true;
      }
    }
    return false;
  }
  function isFollowedByText(lineItems, lineIndex) {
    for (let index = lineIndex + 1; index < lineItems.length; index++) {
      const itemText = lineItems[index].data["str"].trim();
      if (!isNumber(itemText)) {
        return true;
      }
    }
    return false;
  }
  var DetectFootnotes;
  var init_DetectFootnotes = __esm({
    "src/transformer/DetectFootnotes.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_groupingUtils();
      init_stringFunctions();
      DetectFootnotes = class extends ItemTransformer {
        constructor() {
          super(
            "Detect Footnotes",
            "Detect footnotes in text and link them to the references",
            {
              requireColumns: ["str", "y"],
              debug: {
                itemMerger: new LineItemMerger(false)
              }
            },
            (incomingSchema) => {
              return incomingSchema.reduce((schema, column) => {
                if (column === "x") {
                  return [...schema, "token types", "x"];
                }
                return [...schema, column];
              }, new Array());
            }
          );
        }
        transform(context, inputItems) {
          const stash = [];
          const footnoteLinks = /* @__PURE__ */ new Set();
          const footnotes = /* @__PURE__ */ new Set();
          groupByLine(inputItems).forEach((lineItems) => {
            const firstY = lineItems[0].data["y"];
            lineItems.forEach((item, lineIndex) => {
              const itemText = item.data["str"].trim();
              const itemY = item.data["y"];
              if (isNumber(itemText)) {
                if (hasPreceedingText(lineItems, lineIndex) && itemY > firstY) {
                  footnoteLinks.add(item.uuid);
                } else if (isFollowedByText(lineItems, lineIndex)) {
                  footnotes.add(item.uuid);
                }
                stash.push(item);
              }
            });
          });
          return {
            items: inputItems.map((item) => {
              if (footnoteLinks.has(item.uuid)) {
                return item.withTokenType("FOOTNOTE_LINK");
              }
              if (footnotes.has(item.uuid)) {
                return item.withTokenType("FOOTNOTE");
              }
              return item;
            }),
            messages: [`Detected ${footnoteLinks.size}/${footnotes.size} footnotes.`]
          };
        }
      };
    }
  });

  // src/transformer/DetectFontStyles.ts
  var DetectFontStyles_exports = {};
  __export(DetectFontStyles_exports, {
    default: () => DetectFontStyles
  });
  var DetectFontStyles;
  var init_DetectFontStyles = __esm({
    "src/transformer/DetectFontStyles.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_items();
      init_FontType();
      DetectFontStyles = class extends ItemTransformer {
        constructor() {
          super("Detect Font Styles", "Detect occurrences of bold and italic tokens", {
            requireColumns: ["str"],
            debug: {
              itemMerger: new LineItemMerger(false)
            }
          });
        }
        transform(context, inputItems) {
          return {
            items: inputItems.map((item) => {
              const fontStyles = declaredFontTypes(getFontName(context.fontMap, item));
              if (fontStyles.length > 0) {
                return item.withTokenTypes(fontStyles);
              }
              return item;
            }),
            messages: [`Detected ${"?"} font styles.`]
          };
        }
      };
    }
  });

  // src/transformer/DetectLinks.ts
  var DetectLinks_exports = {};
  __export(DetectLinks_exports, {
    default: () => DetectLinks
  });
  var DetectLinks;
  var init_DetectLinks = __esm({
    "src/transformer/DetectLinks.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      DetectLinks = class extends ItemTransformer {
        constructor() {
          super("Detect Links", "Detect occurrences http links", {
            requireColumns: ["str"],
            debug: {
              itemMerger: new LineItemMerger(false)
            }
          });
        }
        transform(context, inputItems) {
          return {
            // TODO this is missing links which are just part of an item
            items: inputItems.map((item) => {
              const itemText = item.data["str"];
              if (itemText.startsWith("http:") || itemText.startsWith("www.")) {
                return item.withTokenTypes(["LINK"]);
              }
              return item;
            }),
            messages: [`Detected ${"?"} links.`]
          };
        }
      };
    }
  });

  // src/transformer/DetectCodeQuoteBlocks.ts
  var DetectCodeQuoteBlocks_exports = {};
  __export(DetectCodeQuoteBlocks_exports, {
    default: () => DetectCodeQuoteBlocks,
    itemWithType: () => itemWithType2
  });
  function itemWithType2(item, type) {
    const existingTypes = item.data["types"] || [];
    return item.withDataAddition({ types: [...existingTypes, type].filter(onlyUniques) });
  }
  function toMinX(items) {
    let minX = 999;
    items.forEach((item) => {
      minX = Math.min(minX, item.data["x"]);
    });
    if (minX == 999) {
      return null;
    }
    return minX;
  }
  function looksLikeCodeBlock(minX, items, mostUsedHeight) {
    if (items.length == 0) {
      return false;
    }
    const xIsRelevant = (x) => {
      return x > minX + 1;
    };
    if (items.length == 1) {
      return xIsRelevant(items[0].data["x"]) && items[0].data["height"] <= mostUsedHeight + 1;
    }
    const lineItems = groupByLine(items);
    for (let index = 0; index < lineItems.length; index++) {
      const lineX = lineItems[index][0].data["x"];
      if (!xIsRelevant(lineX)) {
        return false;
      }
      const firstText = lineItems[index][0].data["str"];
      if (isListItemCharacter(firstText) || isNumberedListItem(firstText)) {
        return false;
      }
    }
    return true;
  }
  var DetectCodeQuoteBlocks;
  var init_DetectCodeQuoteBlocks = __esm({
    "src/transformer/DetectCodeQuoteBlocks.ts"() {
      "use strict";
      init_ItemTransformer();
      init_LineItemMerger();
      init_CacluclateStatistics();
      init_groupingUtils();
      init_stringFunctions();
      DetectCodeQuoteBlocks = class extends ItemTransformer {
        constructor() {
          super("Detect Code Blocks", "Find blocks of text which look like they could be code/quote blocks", {
            requireColumns: ["str", "block"],
            debug: {
              itemMerger: new LineItemMerger(false)
            }
          });
        }
        transform(context, inputItems) {
          const mostUsedHeight = context.getGlobal(MOST_USED_HEIGHT);
          const codeBlockItems = /* @__PURE__ */ new Set();
          let foundCodeItems = 0;
          groupByPage(inputItems).forEach((pageItems) => {
            const minX = toMinX(pageItems);
            groupByBlock(pageItems).forEach((blockItems) => {
              if (!blockItems[0].data["types"] && looksLikeCodeBlock(minX, blockItems, mostUsedHeight)) {
                foundCodeItems++;
                blockItems.forEach((item) => codeBlockItems.add(item.uuid));
              }
            });
          });
          return {
            items: inputItems.map((item) => {
              if (codeBlockItems.has(item.uuid)) {
                return itemWithType2(item, "CODE");
              }
              return item;
            }),
            messages: [`Found ${foundCodeItems} code blocks.`]
          };
        }
      };
    }
  });

  // src/index.js
  var require_src = __commonJS({
    "src/index.js"(exports) {
      exports.__esModule = true;
      exports.createPipeline = exports.parseReporter = exports.transformers = void 0;
      var ParseProgressReporter_1 = (init_ParseProgressReporter(), __toCommonJS(ParseProgressReporter_exports));
      var PdfParser_1 = (init_PdfParser(), __toCommonJS(PdfParser_exports));
      var PdfPipeline_1 = (init_PdfPipeline(), __toCommonJS(PdfPipeline_exports));
      var AdjustHeight_1 = (init_AdjustHeight(), __toCommonJS(AdjustHeight_exports));
      var UnwrapCoordinates_1 = (init_UnwrapCoordinates(), __toCommonJS(UnwrapCoordinates_exports));
      var RemoveEmptyItems_1 = (init_RemoveEmptyItems(), __toCommonJS(RemoveEmptyItems_exports));
      var CacluclateStatistics_1 = (init_CacluclateStatistics(), __toCommonJS(CacluclateStatistics_exports));
      var CompactLines_1 = (init_CompactLines(), __toCommonJS(CompactLines_exports));
      var SortXWithinLines_1 = (init_SortXWithinLines(), __toCommonJS(SortXWithinLines_exports));
      var RemoveRepetitiveItems_1 = (init_RemoveRepetitiveItems(), __toCommonJS(RemoveRepetitiveItems_exports));
      var DetectToc_1 = (init_DetectToc(), __toCommonJS(DetectToc_exports));
      var DetectHeaders_1 = (init_DetectHeaders(), __toCommonJS(DetectHeaders_exports));
      var NoOpTransformer_1 = (init_NoOpTransformer(), __toCommonJS(NoOpTransformer_exports));
      var DetectListItems_1 = (init_DetectListItems(), __toCommonJS(DetectListItems_exports));
      var DetectBlocks_1 = (init_DetectBlocks(), __toCommonJS(DetectBlocks_exports));
      var DetectListLevels_1 = (init_DetectListLevels(), __toCommonJS(DetectListLevels_exports));
      var DetectFootnotes_1 = (init_DetectFootnotes(), __toCommonJS(DetectFootnotes_exports));
      var DetectFontStyles_1 = (init_DetectFontStyles(), __toCommonJS(DetectFontStyles_exports));
      var DetectLinks_1 = (init_DetectLinks(), __toCommonJS(DetectLinks_exports));
      var DetectCodeQuoteBlocks_1 = (init_DetectCodeQuoteBlocks(), __toCommonJS(DetectCodeQuoteBlocks_exports));
      exports.transformers = [
        new AdjustHeight_1["default"](),
        new UnwrapCoordinates_1["default"](),
        new RemoveEmptyItems_1["default"](),
        new CacluclateStatistics_1["default"](),
        new CompactLines_1["default"](),
        new SortXWithinLines_1["default"](),
        new RemoveRepetitiveItems_1["default"](),
        new DetectFootnotes_1["default"](),
        new DetectFontStyles_1["default"](),
        new DetectLinks_1["default"](),
        new DetectToc_1["default"](),
        new DetectHeaders_1["default"](),
        new DetectListItems_1["default"](),
        new DetectBlocks_1["default"](),
        new DetectCodeQuoteBlocks_1["default"](),
        new DetectListLevels_1["default"](),
        new NoOpTransformer_1["default"]()
      ];
      function parseReporter(progressListener) {
        return new ParseProgressReporter_1["default"](progressListener);
      }
      exports.parseReporter = parseReporter;
      function createPipeline(pdfJs, options) {
        var _a;
        if (options === void 0) {
          options = {};
        }
        var parser = new PdfParser_1["default"](pdfJs);
        return new PdfPipeline_1["default"](parser, ((_a = options.transformConfig) === null || _a === void 0 ? void 0 : _a.transformers) || exports.transformers);
      }
      exports.createPipeline = createPipeline;
    }
  });
  require_src();
})();
//# sourceMappingURL=bundle.js.map
