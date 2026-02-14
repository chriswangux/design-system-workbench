import type { ExtractedSpacing } from '../extraction/types';

// ---- Types ----

export interface SpacingAnalysis {
  /** Detected base spacing unit in px */
  baseUnit: number;
  /** Best-fit progression type */
  progression: 'geometric' | 'arithmetic' | 'fibonacci' | 'custom';
  /** Ratio for geometric progression */
  ratio?: number;
  /** Number of steps in the scale */
  steps: number;
  /** How well the detected progression reproduces observed values (0-1) */
  fitQuality: number;
  /** All unique spacing values detected, sorted ascending */
  detectedValues: number[];
  /** Custom values if no standard progression fits well */
  customValues?: number[];
}

// ---- Helpers ----

function getUniqueValues(spacings: ExtractedSpacing[]): number[] {
  const valueSet = new Map<number, number>();

  for (const s of spacings) {
    // Round to nearest 0.5px to merge near-identical values
    const rounded = Math.round(s.value * 2) / 2;
    if (rounded < 1 || rounded > 200) continue; // Filter extremes
    valueSet.set(rounded, (valueSet.get(rounded) ?? 0) + s.count);
  }

  return Array.from(valueSet.keys()).sort((a, b) => a - b);
}

/**
 * Compute R-squared (coefficient of determination) between observed and predicted values.
 * Returns 0-1 where 1 is a perfect fit.
 */
function rSquared(observed: number[], predicted: number[]): number {
  if (observed.length === 0 || observed.length !== predicted.length) return 0;

  const mean = observed.reduce((s, v) => s + v, 0) / observed.length;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < observed.length; i++) {
    ssRes += (observed[i] - predicted[i]) ** 2;
    ssTot += (observed[i] - mean) ** 2;
  }

  if (ssTot === 0) return 1; // All values are the same
  const r2 = 1 - ssRes / ssTot;
  return Math.max(0, r2);
}

// ---- Geometric Progression Fitting ----

/**
 * Fit: value[n] = base * ratio^n
 * Find best base and ratio using least-squares in log space.
 */
function fitGeometric(values: number[]): { base: number; ratio: number; r2: number } {
  if (values.length < 2) return { base: values[0] ?? 4, ratio: 2, r2: 0 };

  // Work in log space: log(value) = log(base) + n * log(ratio)
  // This is a linear regression: y = a + b*x where y=log(value), x=step index
  const n = values.length;
  const logValues = values.map((v) => Math.log(v));
  const steps = values.map((_, i) => i);

  const sumX = steps.reduce((s, x) => s + x, 0);
  const sumY = logValues.reduce((s, y) => s + y, 0);
  const sumXY = steps.reduce((s, x, i) => s + x * logValues[i], 0);
  const sumX2 = steps.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) {
    return { base: values[0], ratio: 1, r2: 0 };
  }

  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;

  const base = Math.exp(a);
  const ratio = Math.exp(b);

  // Compute predicted values and R-squared
  const predicted = steps.map((i) => base * Math.pow(ratio, i));
  const r2 = rSquared(values, predicted);

  return {
    base: Math.round(base * 100) / 100,
    ratio: Math.round(ratio * 1000) / 1000,
    r2,
  };
}

// ---- Arithmetic Progression Fitting ----

/**
 * Fit: value[n] = base * (n + 1)
 * This is a simple linear progression where each step adds `base`.
 */
function fitArithmetic(values: number[]): { base: number; r2: number } {
  if (values.length < 2) return { base: values[0] ?? 4, r2: 0 };

  // Linear regression: value = base * (step + 1)
  // Minimize: sum((value_i - base * (i + 1))^2)
  // Derivative: sum(2 * (value_i - base * (i + 1)) * -(i + 1)) = 0
  // base = sum(value_i * (i + 1)) / sum((i + 1)^2)

  let sumVS = 0;
  let sumS2 = 0;

  for (let i = 0; i < values.length; i++) {
    const step = i + 1;
    sumVS += values[i] * step;
    sumS2 += step * step;
  }

  const base = sumVS / sumS2;

  // Compute predicted values
  const predicted = values.map((_, i) => base * (i + 1));
  const r2 = rSquared(values, predicted);

  return {
    base: Math.round(base * 100) / 100,
    r2,
  };
}

// ---- Fibonacci Progression Fitting ----

/**
 * Fit spacing values to a Fibonacci-based scale.
 * The scale is: base * [1, 1, 2, 3, 5, 8, 13, 21, 34, ...]
 */
function fitFibonacci(values: number[]): { base: number; r2: number } {
  if (values.length < 2) return { base: values[0] ?? 4, r2: 0 };

  // Generate fibonacci sequence up to enough steps
  const fib: number[] = [1, 1];
  while (fib.length < values.length + 5) {
    fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
  }

  // Deduplicate fib (the first 1,1)
  const fibUnique = [1, ...fib.slice(1).filter((v, i, arr) => v !== arr[i - 1] || i === 0)];

  // For each possible starting position in the fibonacci sequence,
  // find the best base multiplier
  let bestR2 = -Infinity;
  let bestBase = 4;

  for (let start = 0; start < Math.min(4, fibUnique.length); start++) {
    const fibSlice = fibUnique.slice(start, start + values.length);
    if (fibSlice.length < values.length) continue;

    // Least-squares: base = sum(value_i * fib_i) / sum(fib_i^2)
    let sumVF = 0;
    let sumF2 = 0;
    for (let i = 0; i < values.length; i++) {
      sumVF += values[i] * fibSlice[i];
      sumF2 += fibSlice[i] * fibSlice[i];
    }

    if (sumF2 === 0) continue;
    const base = sumVF / sumF2;
    const predicted = fibSlice.map((f) => base * f);
    const r2 = rSquared(values, predicted);

    if (r2 > bestR2) {
      bestR2 = r2;
      bestBase = base;
    }
  }

  return {
    base: Math.round(bestBase * 100) / 100,
    r2: Math.max(0, bestR2),
  };
}

// ---- Main Export ----

/**
 * Analyze extracted spacing values to detect the spacing progression.
 *
 * Algorithm:
 * 1. Collect unique spacing values in px, sort ascending
 * 2. Filter out extremes (< 1px, > 200px)
 * 3. Try fitting to geometric, arithmetic, and fibonacci progressions
 * 4. Compute R-squared for each fit
 * 5. Pick the best fit, or fall back to 'custom' if none fits well
 */
export function detectSpacing(spacings: ExtractedSpacing[]): SpacingAnalysis {
  const values = getUniqueValues(spacings);

  // Handle edge cases
  if (values.length === 0) {
    return {
      baseUnit: 4,
      progression: 'geometric',
      ratio: 2,
      steps: 6,
      fitQuality: 0,
      detectedValues: [],
    };
  }

  if (values.length === 1) {
    return {
      baseUnit: values[0],
      progression: 'geometric',
      ratio: 2,
      steps: 1,
      fitQuality: 1,
      detectedValues: values,
    };
  }

  // Try all progressions
  const geometric = fitGeometric(values);
  const arithmetic = fitArithmetic(values);
  const fibonacci = fitFibonacci(values);

  // Pick the best fit
  const fits = [
    { type: 'geometric' as const, r2: geometric.r2, base: geometric.base, ratio: geometric.ratio },
    { type: 'arithmetic' as const, r2: arithmetic.r2, base: arithmetic.base, ratio: undefined },
    { type: 'fibonacci' as const, r2: fibonacci.r2, base: fibonacci.base, ratio: undefined },
  ];

  fits.sort((a, b) => b.r2 - a.r2);
  const best = fits[0];

  // If even the best fit is poor (R2 < 0.8), fall back to custom
  const MIN_FIT_THRESHOLD = 0.8;

  if (best.r2 < MIN_FIT_THRESHOLD) {
    return {
      baseUnit: values[0],
      progression: 'custom',
      steps: values.length,
      fitQuality: Math.round(best.r2 * 1000) / 1000,
      detectedValues: values,
      customValues: values,
    };
  }

  const result: SpacingAnalysis = {
    baseUnit: best.base,
    progression: best.type,
    steps: values.length,
    fitQuality: Math.round(best.r2 * 1000) / 1000,
    detectedValues: values,
  };

  if (best.type === 'geometric' && best.ratio !== undefined) {
    result.ratio = best.ratio;
  }

  return result;
}
