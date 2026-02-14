import { nanoid } from 'nanoid';
import type { ColorLabConfig, PaletteConfig } from '@/core/tokens/types';
import type { ColorCluster } from '../clustering/colorClustering';
import { fitBezierCurve } from '../clustering/bezierFitting';

/**
 * Map color clusters to a ColorLabConfig.
 *
 * For each cluster, this:
 * 1. Determines hue, chroma, and lightness ranges from the cluster's colors
 * 2. Fits bezier curves to the lightness and chroma progressions
 * 3. Fits a bezier curve to any hue progression
 * 4. Produces a PaletteConfig with the derived control points
 */
export function toColorLabConfig(clusters: ColorCluster[]): ColorLabConfig {
  if (clusters.length === 0) {
    return { palettes: [] };
  }

  const palettes: PaletteConfig[] = clusters.map((cluster) =>
    clusterToPalette(cluster)
  );

  return { palettes };
}

function clusterToPalette(cluster: ColorCluster): PaletteConfig {
  const { name, colors } = cluster;
  const steps = Math.max(colors.length, 2);

  // Extract ranges
  const lightnesses = colors.map((c) => c.l);
  const chromas = colors.map((c) => c.c);
  const hues = colors.map((c) => c.h);

  const lightnessStart = Math.min(...lightnesses);
  const lightnessEnd = Math.max(...lightnesses);
  const chromaStart = chromas[0] ?? 0;
  const chromaEnd = chromas[chromas.length - 1] ?? 0;

  // Hue range: for neutrals, hue is irrelevant
  const isNeutral = name === 'neutral' || chromas.every((c) => c < 0.02);
  const hueStart = isNeutral ? 0 : Math.min(...hues);
  const hueEnd = isNeutral ? 0 : Math.max(...hues);

  // Fit lightness curve
  // Normalize lightness values to [0, 1] relative to the range
  const lightnessCurve = fitProgressionCurve(lightnesses, lightnessStart, lightnessEnd);

  // Fit chroma curve
  const chromaCurve = fitProgressionCurve(chromas, chromaStart, chromaEnd);

  // Fit hue curve (only meaningful if there's hue variation)
  const hueCurve = isNeutral || Math.abs(hueEnd - hueStart) < 5
    ? linearCurve()
    : fitProgressionCurve(hues, hueStart, hueEnd);

  return {
    id: nanoid(8),
    name,
    steps,
    hue: {
      start: round(hueStart, 2),
      end: round(hueEnd, 2),
      curve: hueCurve,
    },
    chroma: {
      start: round(chromaStart, 4),
      end: round(chromaEnd, 4),
      curve: chromaCurve,
    },
    lightness: {
      start: round(lightnessStart, 4),
      end: round(lightnessEnd, 4),
      curve: lightnessCurve,
    },
  };
}

/**
 * Fit a bezier curve to a progression of values.
 * Values are mapped to (x, y) where x is the normalized step position
 * and y is the normalized value within [start, end].
 */
function fitProgressionCurve(
  values: number[],
  start: number,
  end: number,
): [number, number, number, number] {
  if (values.length < 2) return linearCurve();

  const range = end - start;
  if (Math.abs(range) < 1e-6) {
    // All values are the same - linear is fine
    return linearCurve();
  }

  // Create normalized (x, y) points
  const points = values.map((v, i) => ({
    x: values.length === 1 ? 0.5 : i / (values.length - 1),
    y: (v - start) / range,
  }));

  const result = fitBezierCurve(points);

  // If the fit quality is very low, fall back to linear
  if (result.fitQuality < 0.5) {
    return linearCurve();
  }

  return result.controlPoints;
}

function linearCurve(): [number, number, number, number] {
  return [0.33, 0.33, 0.67, 0.67];
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
