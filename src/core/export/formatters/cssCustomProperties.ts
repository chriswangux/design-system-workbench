import type { TokenTree, Token, DesignToken, ShadowValue, ShadowLayer, DimensionValue, CubicBezierValue, DurationValue, TypographyValue, ColorValue } from '@/core/tokens/types';
import { isAlias } from '@/core/tokens/types';
import { flattenTokenTree } from '@/core/tokens/resolve';
import { transformColor, isColorValue, type ColorFormat } from '../transforms/colorTransform';
import { transformDimension, isDimensionValue, type DimensionUnit } from '../transforms/dimensionTransform';

export interface CSSExportOptions {
  colorFormat: ColorFormat;
  dimensionUnit: DimensionUnit;
  includeDescriptions: boolean;
  selector: string;
}

const DEFAULT_OPTIONS: CSSExportOptions = {
  colorFormat: 'oklch',
  dimensionUnit: 'rem',
  includeDescriptions: true,
  selector: ':root',
};

function tokenPathToVar(path: string[]): string {
  return `--${path.join('-')}`;
}

function formatTokenValue(
  token: Token,
  options: CSSExportOptions,
): string | null {
  if (isAlias(token)) {
    // Convert alias {color.blue.500} to var(--color-blue-500)
    const aliasPath = token.$value.slice(1, -1).split('.');
    return `var(${tokenPathToVar(aliasPath)})`;
  }

  const dt = token as DesignToken;
  const value = dt.$value;

  if (isColorValue(value)) {
    return transformColor(value as ColorValue, options.colorFormat);
  }

  if (isDimensionValue(value)) {
    return transformDimension(value as DimensionValue, options.dimensionUnit);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    // CubicBezier or font family array or shadow
    if (value.length === 4 && value.every((v) => typeof v === 'number')) {
      return `cubic-bezier(${(value as CubicBezierValue).join(', ')})`;
    }
    if (value.every((v) => typeof v === 'string')) {
      return (value as string[]).join(', ');
    }
    // Shadow value (array of shadow layers)
    if (value.length > 0 && typeof value[0] === 'object' && 'blur' in (value[0] as object)) {
      return (value as ShadowLayer[])
        .map((layer) => formatShadowLayer(layer, options))
        .join(', ');
    }
  }

  if (typeof value === 'object' && value !== null) {
    // Duration
    if ('unit' in value && ((value as DurationValue).unit === 'ms' || (value as DurationValue).unit === 's')) {
      return `${(value as DurationValue).value}${(value as DurationValue).unit}`;
    }
    // Typography composite
    if ('fontSize' in value && 'fontFamily' in value) {
      const t = value as TypographyValue;
      const family = Array.isArray(t.fontFamily) ? t.fontFamily.join(', ') : t.fontFamily;
      return `${t.fontWeight} ${transformDimension(t.fontSize, options.dimensionUnit)}/${t.lineHeight} ${family}`;
    }
  }

  return null;
}

function formatShadowLayer(layer: ShadowLayer, options: CSSExportOptions): string {
  const parts: string[] = [];
  if (layer.inset) parts.push('inset');
  parts.push(transformDimension(layer.offsetX, options.dimensionUnit));
  parts.push(transformDimension(layer.offsetY, options.dimensionUnit));
  parts.push(transformDimension(layer.blur, options.dimensionUnit));
  parts.push(transformDimension(layer.spread, options.dimensionUnit));
  if (typeof layer.color === 'string') {
    const aliasPath = layer.color.slice(1, -1).split('.');
    parts.push(`var(${tokenPathToVar(aliasPath)})`);
  } else {
    parts.push(transformColor(layer.color, options.colorFormat));
  }
  return parts.join(' ');
}

export function formatCSS(
  tree: TokenTree,
  options: Partial<CSSExportOptions> = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const allTokens = flattenTokenTree(tree);

  const lines: string[] = [];
  lines.push(`${opts.selector} {`);

  let currentGroup = '';
  for (const { path, token } of allTokens) {
    const group = path[0];
    if (group !== currentGroup) {
      if (currentGroup) lines.push('');
      lines.push(`  /* ${group} */`);
      currentGroup = group;
    }

    if (opts.includeDescriptions && token.$description) {
      lines.push(`  /* ${token.$description} */`);
    }

    const value = formatTokenValue(token, opts);
    if (value !== null) {
      lines.push(`  ${tokenPathToVar(path)}: ${value};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}
