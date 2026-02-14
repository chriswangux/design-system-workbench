import type { ExtractedFontSize, ExtractedFontFamily } from '../extraction/types';

// ---- Types ----

export interface TypographyAnalysis {
  /** Detected base font size in px */
  baseFontSize: number;
  /** Detected type scale ratio */
  ratio: number;
  /** Number of steps above the base in the scale */
  stepsAbove: number;
  /** Number of steps below the base in the scale */
  stepsBelow: number;
  /** Categorized font families */
  fontFamilies: {
    heading: string[];
    body: string[];
    mono: string[];
  };
  /** How well the detected ratio reproduces all observed sizes (0-1) */
  fitQuality: number;
  /** All unique font sizes detected, sorted ascending */
  detectedSizes: number[];
}

// ---- Constants ----

/** Common type scale ratios */
const KNOWN_RATIOS = [
  { name: 'minor-second', value: 1.067 },
  { name: 'major-second', value: 1.125 },
  { name: 'minor-third', value: 1.2 },
  { name: 'major-third', value: 1.25 },
  { name: 'perfect-fourth', value: 1.333 },
  { name: 'augmented-fourth', value: 1.414 },
  { name: 'perfect-fifth', value: 1.5 },
  { name: 'golden-ratio', value: 1.618 },
];

/** Monospace font keywords */
const MONO_KEYWORDS = [
  'mono',
  'consolas',
  'courier',
  'menlo',
  'fira code',
  'jetbrains',
  'source code',
  'roboto mono',
  'sf mono',
  'cascadia',
  'inconsolata',
  'hack',
  'iosevka',
];

/** Serif font keywords */
const SERIF_KEYWORDS = [
  'serif',
  'georgia',
  'times',
  'garamond',
  'palatino',
  'cambria',
  'book antiqua',
  'playfair',
  'merriweather',
  'lora',
  'dm serif',
  'source serif',
  'noto serif',
];

// ---- Font Size Detection ----

function getUniqueSizes(fontSizes: ExtractedFontSize[]): number[] {
  const sizeMap = new Map<number, number>();

  for (const fs of fontSizes) {
    // Round to 1 decimal place to merge near-identical sizes
    const rounded = Math.round(fs.value * 10) / 10;
    if (rounded <= 0) continue;
    sizeMap.set(rounded, (sizeMap.get(rounded) ?? 0) + fs.count);
  }

  return Array.from(sizeMap.keys()).sort((a, b) => a - b);
}

function findBase(sizes: number[]): number {
  if (sizes.length === 0) return 16;
  if (sizes.length === 1) return sizes[0];

  // Find the size closest to 16px
  let closest = sizes[0];
  let minDist = Math.abs(sizes[0] - 16);

  for (const size of sizes) {
    const dist = Math.abs(size - 16);
    if (dist < minDist) {
      minDist = dist;
      closest = size;
    }
  }

  return closest;
}

function detectRatio(sizes: number[]): { ratio: number; fitQuality: number } {
  if (sizes.length < 2) {
    return { ratio: 1.25, fitQuality: 0 };
  }

  // Compute all consecutive ratios
  const ratios: number[] = [];
  for (let i = 0; i < sizes.length - 1; i++) {
    if (sizes[i] > 0) {
      const r = sizes[i + 1] / sizes[i];
      if (r > 1 && r < 3) {
        ratios.push(r);
      }
    }
  }

  if (ratios.length === 0) {
    return { ratio: 1.25, fitQuality: 0 };
  }

  // Compute median ratio
  const sorted = [...ratios].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  // Compute standard deviation
  const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  const variance = ratios.reduce((s, r) => s + (r - mean) * (r - mean), 0) / ratios.length;
  const stdDev = Math.sqrt(variance);

  // Check if ratio is consistent enough
  if (stdDev < 0.1) {
    // Good consistency - snap to nearest known ratio if close
    const snapped = snapToKnownRatio(median);
    const fitQuality = Math.max(0, 1 - stdDev * 5);
    return { ratio: snapped, fitQuality };
  }

  // Poor consistency - still return the median but with low fit quality
  return { ratio: Math.round(median * 1000) / 1000, fitQuality: Math.max(0, 1 - stdDev * 3) };
}

function snapToKnownRatio(ratio: number): number {
  const SNAP_THRESHOLD = 0.03;
  for (const known of KNOWN_RATIOS) {
    if (Math.abs(ratio - known.value) < SNAP_THRESHOLD) {
      return known.value;
    }
  }
  return Math.round(ratio * 1000) / 1000;
}

function computeSteps(
  sizes: number[],
  base: number,
  ratio: number,
): { stepsAbove: number; stepsBelow: number } {
  if (ratio <= 1 || sizes.length === 0) {
    return { stepsAbove: 0, stepsBelow: 0 };
  }

  let stepsAbove = 0;
  let stepsBelow = 0;

  for (const size of sizes) {
    if (size > base * 1.01) {
      // Count how many ratio steps this is above the base
      const steps = Math.round(Math.log(size / base) / Math.log(ratio));
      if (steps > stepsAbove) stepsAbove = steps;
    } else if (size < base * 0.99) {
      const steps = Math.round(Math.log(base / size) / Math.log(ratio));
      if (steps > stepsBelow) stepsBelow = steps;
    }
  }

  return { stepsAbove, stepsBelow };
}

function computeFitQuality(
  sizes: number[],
  base: number,
  ratio: number,
): number {
  if (sizes.length <= 1 || ratio <= 1) return 0;

  // For each detected size, find the closest size on the scale
  let totalError = 0;
  let maxPossibleError = 0;

  for (const size of sizes) {
    // Find the nearest step
    const step = Math.round(Math.log(size / base) / Math.log(ratio));
    const expected = base * Math.pow(ratio, step);
    const error = Math.abs(size - expected) / expected;
    totalError += error;
    maxPossibleError += 1; // normalized so max per-size error is ~1
  }

  if (maxPossibleError === 0) return 1;
  const normalizedError = totalError / maxPossibleError;
  return Math.max(0, Math.min(1, 1 - normalizedError * 5));
}

// ---- Font Family Detection ----

function isMonospace(family: string): boolean {
  const lower = family.toLowerCase();
  return MONO_KEYWORDS.some((kw) => lower.includes(kw));
}

function isSerif(family: string): boolean {
  const lower = family.toLowerCase();
  // Check explicit serif keywords but exclude sans-serif
  if (lower.includes('sans-serif') || lower.includes('sans serif')) return false;
  return SERIF_KEYWORDS.some((kw) => lower.includes(kw));
}

function parseFontFamilyList(value: string): string[] {
  // Split comma-separated font-family string and clean up quotes
  return value
    .split(',')
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
    .filter((f) => f.length > 0);
}

function categorizeFontFamilies(
  families: ExtractedFontFamily[],
): { heading: string[]; body: string[]; mono: string[] } {
  if (families.length === 0) {
    return { heading: [], body: [], mono: [] };
  }

  // Sort by count descending
  const sorted = [...families].sort((a, b) => b.count - a.count);

  const monoFamilies: string[] = [];
  const serifFamilies: string[] = [];
  const sansFamilies: string[] = [];

  for (const family of sorted) {
    const parsed = parseFontFamilyList(family.value);
    const primary = parsed[0] ?? family.value;

    if (isMonospace(primary)) {
      if (!monoFamilies.includes(family.value)) {
        monoFamilies.push(family.value);
      }
    } else if (isSerif(primary)) {
      if (!serifFamilies.includes(family.value)) {
        serifFamilies.push(family.value);
      }
    } else {
      if (!sansFamilies.includes(family.value)) {
        sansFamilies.push(family.value);
      }
    }
  }

  // The most common sans-serif is the body font
  // Secondary sans or any serif is the heading font
  const body = sansFamilies.length > 0 ? [sansFamilies[0]] : [];
  const heading =
    serifFamilies.length > 0
      ? [serifFamilies[0]]
      : sansFamilies.length > 1
        ? [sansFamilies[1]]
        : [];
  const mono = monoFamilies.length > 0 ? [monoFamilies[0]] : [];

  return { heading, body, mono };
}

// ---- Main Export ----

/**
 * Analyze extracted font sizes and families to detect the type scale.
 *
 * Algorithm:
 * 1. Collect unique font sizes in px, sort ascending
 * 2. Find the value closest to 16px as the base
 * 3. Compute ratio between consecutive sizes
 * 4. If median ratio is consistent (std dev < 0.1), that's the scale ratio
 * 5. Count steps above and below the base
 * 6. Categorize font families: body, heading, mono
 * 7. Compute fit quality
 */
export function detectTypography(
  fontSizes: ExtractedFontSize[],
  fontFamilies: ExtractedFontFamily[],
): TypographyAnalysis {
  const sizes = getUniqueSizes(fontSizes);

  // Handle edge cases
  if (sizes.length === 0) {
    return {
      baseFontSize: 16,
      ratio: 1.25,
      stepsAbove: 0,
      stepsBelow: 0,
      fontFamilies: categorizeFontFamilies(fontFamilies),
      fitQuality: 0,
      detectedSizes: [],
    };
  }

  if (sizes.length === 1) {
    return {
      baseFontSize: sizes[0],
      ratio: 1.25,
      stepsAbove: 0,
      stepsBelow: 0,
      fontFamilies: categorizeFontFamilies(fontFamilies),
      fitQuality: 1,
      detectedSizes: sizes,
    };
  }

  const base = findBase(sizes);
  const { ratio } = detectRatio(sizes);
  const { stepsAbove, stepsBelow } = computeSteps(sizes, base, ratio);
  const fitQuality = computeFitQuality(sizes, base, ratio);

  return {
    baseFontSize: base,
    ratio,
    stepsAbove,
    stepsBelow,
    fontFamilies: categorizeFontFamilies(fontFamilies),
    fitQuality: Math.round(fitQuality * 1000) / 1000,
    detectedSizes: sizes,
  };
}
