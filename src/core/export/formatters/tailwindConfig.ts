import type { TokenTree, TokenGroup, Token, DesignToken, ColorValue, DimensionValue, CubicBezierValue, DurationValue } from '@/core/tokens/types';
import { isAlias } from '@/core/tokens/types';
import { transformColor, isColorValue, type ColorFormat } from '../transforms/colorTransform';
import { transformDimension, isDimensionValue, type DimensionUnit } from '../transforms/dimensionTransform';

export interface TailwindExportOptions {
  colorFormat: ColorFormat;
  dimensionUnit: DimensionUnit;
}

const DEFAULT_OPTIONS: TailwindExportOptions = {
  colorFormat: 'oklch',
  dimensionUnit: 'rem',
};

function extractGroupValues(
  group: TokenGroup | undefined,
  opts: TailwindExportOptions,
  transform: (value: unknown, opts: TailwindExportOptions) => string | null,
): Record<string, unknown> {
  if (!group) return {};
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    if (entry && typeof entry === 'object' && '$value' in entry) {
      const token = entry as Token;
      if (isAlias(token)) continue; // Skip aliases in Tailwind (use CSS vars approach)
      const formatted = transform((token as DesignToken).$value, opts);
      if (formatted) result[key] = formatted;
    } else if (entry && typeof entry === 'object' && !('$value' in entry)) {
      const nested = extractGroupValues(entry as TokenGroup, opts, transform);
      if (Object.keys(nested).length > 0) result[key] = nested;
    }
  }

  return result;
}

export function formatTailwindConfig(
  tree: TokenTree,
  options: Partial<TailwindExportOptions> = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const colors = extractGroupValues(tree.color, opts, (value) => {
    if (isColorValue(value)) return transformColor(value as ColorValue, opts.colorFormat);
    return null;
  });

  const spacing = extractGroupValues(tree.spacing, opts, (value) => {
    if (isDimensionValue(value)) return transformDimension(value as DimensionValue, opts.dimensionUnit);
    return null;
  });

  const boxShadow: Record<string, string> = {};
  // Shadow tokens are more complex - flatten them to strings for now
  if (tree.shadow) {
    for (const [key, entry] of Object.entries(tree.shadow)) {
      if (key.startsWith('$') || !entry || typeof entry !== 'object' || !('$value' in entry)) continue;
      // Just note it exists for now - full shadow formatting is complex
      boxShadow[key] = `/* shadow.${key} */`;
    }
  }

  const transitionTimingFunction: Record<string, string> = {};
  const transitionDuration: Record<string, string> = {};
  if (tree.motion) {
    if (tree.motion.easing && typeof tree.motion.easing === 'object') {
      for (const [key, entry] of Object.entries(tree.motion.easing)) {
        if (key.startsWith('$') || !entry || typeof entry !== 'object' || !('$value' in entry)) continue;
        const token = entry as DesignToken;
        if (Array.isArray(token.$value) && token.$value.length === 4) {
          transitionTimingFunction[key] = `cubic-bezier(${(token.$value as CubicBezierValue).join(', ')})`;
        }
      }
    }
    if (tree.motion.duration && typeof tree.motion.duration === 'object') {
      for (const [key, entry] of Object.entries(tree.motion.duration)) {
        if (key.startsWith('$') || !entry || typeof entry !== 'object' || !('$value' in entry)) continue;
        const token = entry as DesignToken;
        const val = token.$value as DurationValue;
        if (val && typeof val === 'object' && 'value' in val && 'unit' in val) {
          transitionDuration[key] = `${val.value}${val.unit}`;
        }
      }
    }
  }

  const config: Record<string, unknown> = {};
  if (Object.keys(colors).length > 0) config.colors = colors;
  if (Object.keys(spacing).length > 0) config.spacing = spacing;
  if (Object.keys(boxShadow).length > 0) config.boxShadow = boxShadow;
  if (Object.keys(transitionTimingFunction).length > 0) config.transitionTimingFunction = transitionTimingFunction;
  if (Object.keys(transitionDuration).length > 0) config.transitionDuration = transitionDuration;

  return `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: ${JSON.stringify(config, null, 4).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n')},
  },
};
`;
}
