// Scale generators for spacing, typography, duration, and other numeric progressions

export type ScaleType = 'geometric' | 'arithmetic' | 'fibonacci' | 'custom';

/**
 * Generate a geometric scale: base * ratio^n
 * Used for: typography (modular scale), spacing, duration
 */
export function geometricScale(base: number, ratio: number, steps: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < steps; i++) {
    values.push(base * Math.pow(ratio, i));
  }
  return values;
}

/**
 * Generate an arithmetic scale: base + (step * increment)
 * Used for: linear spacing progressions
 */
export function arithmeticScale(base: number, increment: number, steps: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < steps; i++) {
    values.push(base + increment * i);
  }
  return values;
}

/**
 * Generate a fibonacci-based scale starting from a base value.
 * Each step is the sum of the two preceding steps (approximated for non-integer bases).
 */
export function fibonacciScale(base: number, steps: number): number[] {
  if (steps <= 0) return [];
  if (steps === 1) return [base];
  const values = [base, base];
  for (let i = 2; i < steps; i++) {
    values.push(values[i - 1] + values[i - 2]);
  }
  return values;
}

/**
 * Generate a spacing scale from a configuration.
 */
export function generateSpacingScale(
  baseUnit: number,
  progression: ScaleType,
  steps: number,
  ratio?: number,
  customValues?: number[],
): number[] {
  switch (progression) {
    case 'geometric':
      return geometricScale(baseUnit, ratio ?? 2, steps);
    case 'arithmetic':
      return arithmeticScale(baseUnit, baseUnit, steps);
    case 'fibonacci':
      return fibonacciScale(baseUnit, steps);
    case 'custom':
      return customValues?.slice(0, steps) ?? [];
  }
}

/**
 * Generate a type scale with steps above and below the base.
 * Returns sizes from smallest to largest.
 */
export function generateTypeScale(
  baseFontSize: number,
  ratio: number,
  stepsAbove: number,
  stepsBelow: number,
): number[] {
  const sizes: number[] = [];
  for (let i = -stepsBelow; i <= stepsAbove; i++) {
    sizes.push(baseFontSize * Math.pow(ratio, i));
  }
  return sizes.map((s) => Math.round(s * 100) / 100);
}

/**
 * Generate a duration scale for animation timing.
 */
export function generateDurationScale(
  baseDuration: number,
  ratio: number,
  steps: number,
): number[] {
  return geometricScale(baseDuration, ratio, steps).map((d) => Math.round(d));
}

// Common typographic scale ratios
export const TYPE_RATIOS: Record<string, { name: string; value: number }> = {
  'minor-second': { name: 'Minor Second', value: 1.067 },
  'major-second': { name: 'Major Second', value: 1.125 },
  'minor-third': { name: 'Minor Third', value: 1.2 },
  'major-third': { name: 'Major Third', value: 1.25 },
  'perfect-fourth': { name: 'Perfect Fourth', value: 1.333 },
  'augmented-fourth': { name: 'Augmented Fourth', value: 1.414 },
  'perfect-fifth': { name: 'Perfect Fifth', value: 1.5 },
  'golden-ratio': { name: 'Golden Ratio', value: 1.618 },
};

// Rounding utility for display values
export function roundToUnit(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}
