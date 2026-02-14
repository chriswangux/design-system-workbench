import { parse, oklch } from 'culori';
import type { ExtractedShadow } from '../extraction/types';

// ---- Types ----

export interface ShadowAnalysis {
  /** Derived light source direction */
  lightSource: { x: number; y: number; z: number };
  /** Number of elevation levels detected */
  elevationSteps: number;
  /** Blur radius of the smallest shadow */
  baseBlur: number;
  /** Ratio between consecutive blur radii */
  blurRatio: number;
  /** Offset magnitude of the smallest shadow */
  baseOffset: number;
  /** Ratio between consecutive offset magnitudes */
  offsetRatio: number;
  /** How spread values behave across elevation levels */
  spreadBehavior: 'none' | 'shrink' | 'grow';
  /** Shadow color in OKLCH channels */
  shadowColor: [number, number, number];
  /** Average opacity for ambient (non-directional) shadows */
  ambientOpacity: number;
  /** Average opacity for directional shadows */
  directionalOpacity: number;
  /** How well the model fits the observed shadows (0-1) */
  fitQuality: number;
}

// ---- Helpers ----

interface NormalizedShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  colorL: number;
  colorC: number;
  colorH: number;
  alpha: number;
}

/**
 * Extract the primary (non-inset) layer from a shadow.
 * Multi-layer shadows: pick the layer with the largest blur.
 */
function extractPrimaryLayer(shadow: ExtractedShadow): NormalizedShadow | null {
  const nonInset = shadow.layers.filter((layer) => !layer.inset);
  if (nonInset.length === 0) return null;

  // Pick layer with largest blur
  const primary = nonInset.reduce((best, current) =>
    current.blur > best.blur ? current : best
  );

  // Parse color
  let colorL = 0;
  let colorC = 0;
  let colorH = 0;
  let alpha = 0.2;

  try {
    const parsed = parse(primary.color);
    if (parsed) {
      const o = oklch(parsed);
      if (o) {
        colorL = o.l ?? 0;
        colorC = o.c ?? 0;
        colorH = o.h ?? 0;
        alpha = o.alpha ?? 1;
      }
    }
  } catch {
    // Default to black with low opacity
    colorL = 0;
    colorC = 0;
    colorH = 0;
    alpha = 0.2;
  }

  return {
    offsetX: primary.offsetX,
    offsetY: primary.offsetY,
    blur: primary.blur,
    spread: primary.spread,
    colorL,
    colorC,
    colorH,
    alpha,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeConsecutiveRatios(values: number[]): number[] {
  const ratios: number[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] > 0) {
      ratios.push(values[i + 1] / values[i]);
    }
  }
  return ratios;
}

/**
 * Derive the light source direction from shadow offsets.
 * Returns a normalized (x, y, z) vector.
 */
function deriveLightSource(shadows: NormalizedShadow[]): { x: number; y: number; z: number } {
  if (shadows.length === 0) {
    return { x: 0, y: -1, z: 1 }; // Default: top-center light
  }

  // Average the direction of shadow offsets
  let avgX = 0;
  let avgY = 0;

  for (const s of shadows) {
    const mag = Math.sqrt(s.offsetX * s.offsetX + s.offsetY * s.offsetY);
    if (mag > 0) {
      // Shadow goes opposite to light direction
      avgX -= s.offsetX / mag;
      avgY -= s.offsetY / mag;
    }
  }

  const count = shadows.length;
  avgX /= count;
  avgY /= count;

  // Normalize the XY direction
  const xyMag = Math.sqrt(avgX * avgX + avgY * avgY);
  if (xyMag < 0.01) {
    // Shadows are centered - light is directly above
    return { x: 0, y: 0, z: 1 };
  }

  // Z component: higher values mean more "overhead" light (smaller offsets relative to blur)
  const avgBlur = shadows.reduce((s, sh) => s + sh.blur, 0) / count;
  const avgOffset = shadows.reduce((s, sh) => s + Math.sqrt(sh.offsetX ** 2 + sh.offsetY ** 2), 0) / count;
  const z = avgBlur > 0 ? Math.min(2, avgBlur / Math.max(avgOffset, 1)) : 1;

  // Normalize
  const totalMag = Math.sqrt(avgX * avgX + avgY * avgY + z * z);
  return {
    x: round(avgX / totalMag, 3),
    y: round(avgY / totalMag, 3),
    z: round(z / totalMag, 3),
  };
}

function determineSpreadBehavior(shadows: NormalizedShadow[]): 'none' | 'shrink' | 'grow' {
  if (shadows.length < 2) return 'none';

  const spreads = shadows.map((s) => s.spread);
  const allZero = spreads.every((s) => Math.abs(s) < 0.5);
  if (allZero) return 'none';

  // Check the trend
  let increasing = 0;
  let decreasing = 0;
  for (let i = 1; i < spreads.length; i++) {
    if (spreads[i] > spreads[i - 1] + 0.5) increasing++;
    if (spreads[i] < spreads[i - 1] - 0.5) decreasing++;
  }

  // If most spreads are negative, it's shrink
  const avgSpread = spreads.reduce((s, v) => s + v, 0) / spreads.length;
  if (avgSpread < -0.5) return 'shrink';
  if (avgSpread > 0.5 || increasing > decreasing) return 'grow';
  return 'none';
}

function computeFitQuality(
  shadows: NormalizedShadow[],
  baseBlur: number,
  blurRatio: number,
  baseOffset: number,
  offsetRatio: number,
): number {
  if (shadows.length <= 1) return 1;

  let totalError = 0;
  let totalMagnitude = 0;

  for (let i = 0; i < shadows.length; i++) {
    const expectedBlur = baseBlur * Math.pow(blurRatio, i);
    const offsetMag = Math.sqrt(shadows[i].offsetX ** 2 + shadows[i].offsetY ** 2);
    const expectedOffset = baseOffset * Math.pow(offsetRatio, i);

    const blurError = Math.abs(shadows[i].blur - expectedBlur);
    const offsetError = Math.abs(offsetMag - expectedOffset);

    totalError += blurError + offsetError;
    totalMagnitude += shadows[i].blur + offsetMag;
  }

  if (totalMagnitude === 0) return 1;
  const normalizedError = totalError / totalMagnitude;
  return Math.max(0, Math.min(1, 1 - normalizedError));
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ---- Main Export ----

/**
 * Analyze extracted shadows to derive shadow system parameters.
 *
 * Algorithm:
 * 1. Sort shadows by total blur radius (ascending = elevation levels)
 * 2. Compute blur ratios between consecutive levels
 * 3. Compute offset ratios between consecutive levels
 * 4. Derive light source direction from offset angles
 * 5. Extract shadow colors and compute average opacity
 * 6. Determine spread behavior from spread values
 */
export function analyzeShadows(shadows: ExtractedShadow[]): ShadowAnalysis {
  // Default result for edge cases
  const defaultResult: ShadowAnalysis = {
    lightSource: { x: 0, y: -0.447, z: 0.894 },
    elevationSteps: 5,
    baseBlur: 2,
    blurRatio: 2,
    baseOffset: 1,
    offsetRatio: 1.5,
    spreadBehavior: 'none',
    shadowColor: [0, 0, 0],
    ambientOpacity: 0.12,
    directionalOpacity: 0.2,
    fitQuality: 0,
  };

  if (shadows.length === 0) return defaultResult;

  // Extract primary layers
  const normalized: NormalizedShadow[] = [];
  for (const shadow of shadows) {
    const primary = extractPrimaryLayer(shadow);
    if (primary) normalized.push(primary);
  }

  if (normalized.length === 0) return defaultResult;

  // Step 1: Sort by blur (ascending = elevation levels)
  normalized.sort((a, b) => a.blur - b.blur);

  // Deduplicate shadows with very similar blur values
  const deduped: NormalizedShadow[] = [normalized[0]];
  for (let i = 1; i < normalized.length; i++) {
    const prev = deduped[deduped.length - 1];
    if (Math.abs(normalized[i].blur - prev.blur) > 0.5) {
      deduped.push(normalized[i]);
    }
  }

  // Handle single shadow
  if (deduped.length === 1) {
    const s = deduped[0];
    const lightSource = deriveLightSource(deduped);
    return {
      lightSource,
      elevationSteps: 1,
      baseBlur: round(Math.max(s.blur, 1), 2),
      blurRatio: 2,
      baseOffset: round(Math.max(Math.sqrt(s.offsetX ** 2 + s.offsetY ** 2), 0.5), 2),
      offsetRatio: 1.5,
      spreadBehavior: determineSpreadBehavior(deduped),
      shadowColor: [round(s.colorL, 4), round(s.colorC, 4), round(s.colorH, 2)],
      ambientOpacity: round(s.alpha * 0.6, 3),
      directionalOpacity: round(s.alpha, 3),
      fitQuality: 0.5,
    };
  }

  // Step 2: Compute blur ratios
  const blurs = deduped.map((s) => Math.max(s.blur, 0.1));
  const blurRatios = computeConsecutiveRatios(blurs);
  const blurRatio = blurRatios.length > 0 ? median(blurRatios) : 2;

  // Step 3: Compute offset ratios
  const offsets = deduped.map((s) => Math.max(Math.sqrt(s.offsetX ** 2 + s.offsetY ** 2), 0.1));
  const offsetRatios = computeConsecutiveRatios(offsets);
  const offsetRatio = offsetRatios.length > 0 ? median(offsetRatios) : 1.5;

  // Step 4: Light source direction
  const lightSource = deriveLightSource(deduped);

  // Step 5: Shadow color and opacity
  const avgColorL = deduped.reduce((s, sh) => s + sh.colorL, 0) / deduped.length;
  const avgColorC = deduped.reduce((s, sh) => s + sh.colorC, 0) / deduped.length;
  const avgColorH = deduped.reduce((s, sh) => s + sh.colorH, 0) / deduped.length;
  const avgAlpha = deduped.reduce((s, sh) => s + sh.alpha, 0) / deduped.length;

  // Split opacity into ambient and directional
  // Ambient is typically lower opacity, directional higher
  const sortedAlphas = deduped.map((s) => s.alpha).sort((a, b) => a - b);
  const ambientOpacity = sortedAlphas[0] ?? avgAlpha * 0.6;
  const directionalOpacity = sortedAlphas[sortedAlphas.length - 1] ?? avgAlpha;

  // Step 6: Spread behavior
  const spreadBehavior = determineSpreadBehavior(deduped);

  // Compute fit quality
  const baseBlur = Math.max(blurs[0], 0.5);
  const baseOffset = Math.max(offsets[0], 0.25);
  const fitQuality = computeFitQuality(deduped, baseBlur, blurRatio, baseOffset, offsetRatio);

  return {
    lightSource,
    elevationSteps: deduped.length,
    baseBlur: round(baseBlur, 2),
    blurRatio: round(Math.max(blurRatio, 1.1), 3),
    baseOffset: round(baseOffset, 2),
    offsetRatio: round(Math.max(offsetRatio, 1.1), 3),
    spreadBehavior,
    shadowColor: [round(avgColorL, 4), round(avgColorC, 4), round(avgColorH, 2)],
    ambientOpacity: round(Math.max(0.01, Math.min(1, ambientOpacity)), 3),
    directionalOpacity: round(Math.max(0.01, Math.min(1, directionalOpacity)), 3),
    fitQuality: round(fitQuality, 3),
  };
}
