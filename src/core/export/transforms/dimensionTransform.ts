import type { DimensionValue } from '@/core/tokens/types';

export type DimensionUnit = 'px' | 'rem';

export function transformDimension(value: DimensionValue, targetUnit: DimensionUnit, baseFontSize = 16): string {
  if (value.unit === targetUnit) {
    return `${value.value}${targetUnit}`;
  }

  if (value.unit === 'px' && targetUnit === 'rem') {
    return `${value.value / baseFontSize}rem`;
  }

  if (value.unit === 'rem' && targetUnit === 'px') {
    return `${value.value * baseFontSize}px`;
  }

  return `${value.value}${value.unit}`;
}

export function isDimensionValue(value: unknown): value is DimensionValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'unit' in value &&
    typeof (value as DimensionValue).value === 'number' &&
    ((value as DimensionValue).unit === 'px' || (value as DimensionValue).unit === 'rem')
  );
}
