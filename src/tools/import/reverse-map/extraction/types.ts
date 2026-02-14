// Extraction result types for the Reverse Map tool.
// These represent raw extracted design properties before they are
// converted into W3C DTCG tokens.

export interface ExtractedColor {
  /** Original CSS value (e.g., "#3b82f6", "rgb(59,130,246)", "oklch(0.62 0.25 264)") */
  value: string;
  /** Where it was found (e.g., "background-color", "--brand-primary") */
  source: string;
  /** How many times it appeared */
  count: number;
}

export interface ExtractedFontSize {
  /** In pixels */
  value: number;
  /** Original unit (px, rem, em) */
  unit: string;
  /** Original CSS value */
  originalValue: string;
  count: number;
}

export interface ExtractedFontFamily {
  /** Full font-family string */
  value: string;
  count: number;
}

export interface ExtractedSpacing {
  /** In pixels */
  value: number;
  /** Original unit */
  unit: string;
  /** Original CSS value */
  originalValue: string;
  /** "padding", "margin", "gap" */
  source: string;
  count: number;
}

export interface ExtractedShadow {
  /** Full box-shadow value */
  original: string;
  layers: Array<{
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    inset: boolean;
  }>;
}

export interface ExtractedMotion {
  durations: Array<{ value: number; unit: string; count: number }>;
  easings: Array<{ value: string; count: number }>;
}

export interface ExtractionResult {
  colors: ExtractedColor[];
  fontSizes: ExtractedFontSize[];
  fontFamilies: ExtractedFontFamily[];
  spacings: ExtractedSpacing[];
  shadows: ExtractedShadow[];
  motion: ExtractedMotion;
  /** CSS custom properties found */
  customProperties: Record<string, string>;
  source: 'css' | 'html' | 'bookmarklet' | 'file' | 'dtcg-json';
}

/** Create an empty ExtractionResult with the given source */
export function emptyResult(source: ExtractionResult['source']): ExtractionResult {
  return {
    colors: [],
    fontSizes: [],
    fontFamilies: [],
    spacings: [],
    shadows: [],
    motion: { durations: [], easings: [] },
    customProperties: {},
    source,
  };
}
