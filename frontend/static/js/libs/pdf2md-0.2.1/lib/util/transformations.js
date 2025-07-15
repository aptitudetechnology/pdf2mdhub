// util/transformations.js - Refactored to ES Module Syntax

// Import all required transformation classes and ParseResult
// IMPORTANT: Remember to add the .js extension for all relative imports!

import CalculateGlobalStats from '../models/transformations/text-item/CalculateGlobalStats.js';

import CompactLines from '../models/transformations/line-item/CompactLines.js';
import RemoveRepetitiveElements from '../models/transformations/line-item/RemoveRepetitiveElements.js';
import VerticalToHorizontal from '../models/transformations/line-item/VerticalToHorizontal.js';
import DetectTOC from '../models/transformations/line-item/DetectTOC.js';
import DetectListItems from '../models/transformations/line-item/DetectListItems.js';
import DetectHeaders from '../models/transformations/line-item/DetectHeaders.js';

import GatherBlocks from '../models/transformations/line-item-block/GatherBlocks.js';
import DetectCodeQuoteBlocks from '../models/transformations/line-item-block/DetectCodeQuoteBlocks.js';
import DetectListLevels from '../models/transformations/line-item-block/DetectListLevels.js';
import ToTextBlocks from '../models/transformations/ToTextBlocks.js';
import ToMarkdown from '../models/transformations/ToMarkdown.js';

import ParseResult from '../models/ParseResult.js';

// Change exports.makeTransformations to a named export
export const makeTransformations = fontMap => [
  new CalculateGlobalStats(fontMap),
  new CompactLines(),
  new RemoveRepetitiveElements(),
  new VerticalToHorizontal(),
  new DetectTOC(),
  new DetectHeaders(),
  new DetectListItems(),

  new GatherBlocks(),
  new DetectCodeQuoteBlocks(),
  new DetectListLevels(),

  new ToTextBlocks(),
  new ToMarkdown(),
];

// Change exports.transform to a named export
export const transform = (pages, transformations) => {
  var parseResult = new ParseResult({ pages });
  let lastTransformation;
  transformations.forEach(transformation => {
    if (lastTransformation) {
      parseResult = lastTransformation.completeTransform(parseResult);
    }
    parseResult = transformation.transform(parseResult);
    lastTransformation = transformation;
  });
  return parseResult;
};
