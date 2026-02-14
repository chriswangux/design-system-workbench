import type { ShadowLabConfig, ColorValue } from '@/core/tokens/types';
import type { ShadowAnalysis } from '../clustering/shadowParsing';

/**
 * Map a ShadowAnalysis to a ShadowLabConfig.
 *
 * Converts the analysis results into the format expected by the
 * shadow lab tool, including proper ColorValue construction for
 * the shadow color.
 */
export function toShadowLabConfig(analysis: ShadowAnalysis): ShadowLabConfig {
  // Construct the shadow color as a proper ColorValue
  const shadowColor: ColorValue = {
    colorSpace: 'oklch',
    channels: [
      clamp(analysis.shadowColor[0], 0, 1),
      clamp(analysis.shadowColor[1], 0, 0.4),
      ((analysis.shadowColor[2] % 360) + 360) % 360,
    ],
    alpha: clamp(analysis.directionalOpacity, 0.01, 1),
  };

  return {
    lightSource: {
      x: clamp(analysis.lightSource.x, -2, 2),
      y: clamp(analysis.lightSource.y, -2, 2),
      z: clamp(analysis.lightSource.z, 0.1, 3),
    },
    elevationSteps: clamp(analysis.elevationSteps, 1, 10),
    baseBlur: clamp(analysis.baseBlur, 0.5, 20),
    blurRatio: clamp(analysis.blurRatio, 1.1, 5),
    baseOffset: clamp(analysis.baseOffset, 0.25, 10),
    offsetRatio: clamp(analysis.offsetRatio, 1.1, 5),
    spreadBehavior: analysis.spreadBehavior,
    shadowColor,
    ambientOpacity: clamp(analysis.ambientOpacity, 0.01, 0.5),
    directionalOpacity: clamp(analysis.directionalOpacity, 0.01, 0.8),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
