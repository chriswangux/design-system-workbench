import type { TypographyLabConfig } from '@/core/tokens/types';
import type { TypographyAnalysis } from '../clustering/typographyDetection';

/**
 * Map a TypographyAnalysis to a TypographyLabConfig.
 *
 * This is a relatively straightforward mapping since the analysis
 * already produces values in the same shape as the config. The main
 * additions are:
 * - Default line height config (not detectable from font sizes alone)
 * - Sanitizing font family lists
 * - Ensuring reasonable bounds on all values
 */
export function toTypographyLabConfig(analysis: TypographyAnalysis): TypographyLabConfig {
  return {
    baseFontSize: clamp(analysis.baseFontSize, 8, 32),
    ratio: clamp(analysis.ratio, 1.05, 2),
    stepsAbove: clamp(analysis.stepsAbove, 0, 12),
    stepsBelow: clamp(analysis.stepsBelow, 0, 4),
    fontFamilies: sanitizeFontFamilies(analysis.fontFamilies),
    lineHeightConfig: deriveLineHeightConfig(analysis),
  };
}

/**
 * Sanitize font family lists: ensure each category has at least one value,
 * and clean up generic family names.
 */
function sanitizeFontFamilies(
  families: TypographyAnalysis['fontFamilies'],
): TypographyLabConfig['fontFamilies'] {
  const heading = families.heading.length > 0
    ? families.heading
    : families.body.length > 0
      ? families.body
      : ['Inter', 'system-ui', 'sans-serif'];

  const body = families.body.length > 0
    ? families.body
    : ['Inter', 'system-ui', 'sans-serif'];

  const mono = families.mono.length > 0
    ? families.mono
    : ['ui-monospace', 'SFMono-Regular', 'monospace'];

  return { heading, body, mono };
}

/**
 * Derive line height configuration.
 *
 * Line height and tightening can't be reliably detected from font size alone,
 * so we use sensible defaults. If the analysis detected larger sizes (headings),
 * we use slightly tighter line heights for them.
 */
function deriveLineHeightConfig(
  analysis: TypographyAnalysis,
): TypographyLabConfig['lineHeightConfig'] {
  // Default line height for body text
  const base = 1.5;

  // Tightening factor: how much line height decreases per step above base
  // More steps above = more display sizes = more tightening needed
  const tightening = analysis.stepsAbove > 4 ? 0.05 : 0.03;

  return { base, tightening };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
