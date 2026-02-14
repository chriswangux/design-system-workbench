import type { SpacingLabConfig } from '@/core/tokens/types';
import type { SpacingAnalysis } from '../clustering/spacingDetection';

/**
 * Map a SpacingAnalysis to a SpacingLabConfig.
 *
 * The analysis already provides values closely matching the config shape.
 * This function ensures reasonable bounds and handles the custom values case.
 */
export function toSpacingLabConfig(analysis: SpacingAnalysis): SpacingLabConfig {
  const config: SpacingLabConfig = {
    baseUnit: clamp(analysis.baseUnit, 1, 32),
    progression: analysis.progression,
    steps: clamp(analysis.steps, 1, 20),
  };

  // Add ratio for geometric progression
  if (analysis.progression === 'geometric' && analysis.ratio !== undefined) {
    config.ratio = clamp(analysis.ratio, 1.1, 4);
  }

  // Add custom values if the progression is custom
  if (analysis.progression === 'custom' && analysis.customValues) {
    config.customValues = analysis.customValues.map((v) => Math.round(v * 100) / 100);
  }

  // If the progression is arithmetic or fibonacci, provide a ratio
  // that the existing spacing lab can use as a fallback
  if (analysis.progression === 'arithmetic') {
    // For arithmetic, ratio isn't used, but set a sensible default
    config.ratio = undefined;
  }

  if (analysis.progression === 'fibonacci') {
    // Fibonacci doesn't use ratio, but the spacing lab may need it
    config.ratio = undefined;
  }

  return config;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
