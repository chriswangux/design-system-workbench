// Extraction engine barrel export
export type {
  ExtractedColor,
  ExtractedFontSize,
  ExtractedFontFamily,
  ExtractedSpacing,
  ExtractedShadow,
  ExtractedMotion,
  ExtractionResult,
} from './types';
export { emptyResult } from './types';

export { parseCSS } from './parseCSS';
export { parseHTML } from './parseHTML';
export { parseBookmarkletData } from './parseBookmarkletData';
export { parseDTCGJson } from './parseDTCGJson';
export { parseFile } from './parseFile';
