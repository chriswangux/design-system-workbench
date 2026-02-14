import type { TokenTree, DesignToken, ColorValue } from '@/core/tokens/types';
import { toHex } from '@/core/engine/color/oklch';
import { flattenTokenTree } from '@/core/tokens/resolve';
import { transformDimension, isDimensionValue, type DimensionUnit } from '@/core/export/transforms/dimensionTransform';
import type { ColorFormat } from '@/core/export/transforms/colorTransform';

/**
 * Semantic CSS derivation for demo sites.
 *
 * DESIGN PRINCIPLE: Only emit a semantic variable when we're CONFIDENT
 * it will produce a usable result. A bad derivation (dark bg + dark fg,
 * or zero-chroma primary) is worse than no derivation, because it overrides
 * the demo's safe CSS fallback values.
 *
 * If validation fails for any semantic variable, we simply don't emit it,
 * and the demo uses its hardcoded fallback (e.g., `var(--sem-primary, #3b82f6)`).
 */

// ---- Helpers ----

interface ColorEntry {
  path: string[];
  color: ColorValue;
  hex: string;
}

function safeHex(color: ColorValue): string | null {
  try {
    const hex = toHex(color);
    // Validate it looks like a hex color
    if (hex && /^#[0-9a-fA-F]{6,8}$/.test(hex)) return hex;
    return null;
  } catch {
    return null;
  }
}

function lightness(c: ColorValue): number {
  return c.channels[0] ?? 0;
}

function chroma(c: ColorValue): number {
  return c.channels[1] ?? 0;
}

/**
 * Simple WCAG-approximate contrast check.
 * Returns true if the two colors have enough perceptual difference to be readable.
 * Uses OKLCH lightness as a fast proxy (not exact WCAG, but good enough for validation).
 */
function hasReadableContrast(light: ColorValue, dark: ColorValue): boolean {
  const diff = Math.abs(lightness(light) - lightness(dark));
  return diff > 0.4; // Minimum ~40% lightness difference
}

/**
 * Collect all valid color tokens. Extremely defensive.
 */
function collectColors(tree: TokenTree): ColorEntry[] {
  const entries: ColorEntry[] = [];
  try {
    const allTokens = flattenTokenTree(tree);
    for (const { path, token } of allTokens) {
      try {
        if (
          token.$type === 'color' &&
          token.$value &&
          typeof token.$value === 'object' &&
          'colorSpace' in (token.$value as object) &&
          'channels' in (token.$value as object)
        ) {
          const color = token.$value as ColorValue;
          if (!Array.isArray(color.channels) || color.channels.length < 3) continue;
          // Skip degenerate colors (NaN, Infinity)
          if (color.channels.some((c) => !isFinite(c))) continue;
          const hex = safeHex(color);
          if (!hex) continue;
          entries.push({ path, color, hex });
        }
      } catch {
        continue;
      }
    }
  } catch {
    // flattenTokenTree failed entirely
  }
  return entries;
}

interface PaletteGroup {
  name: string;
  entries: ColorEntry[];
  avgChroma: number;
}

function groupByPalette(entries: ColorEntry[]): PaletteGroup[] {
  const groups = new Map<string, ColorEntry[]>();

  for (const entry of entries) {
    const name = entry.path.length >= 2 && entry.path[0] === 'color'
      ? entry.path[1]
      : '_other';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(entry);
  }

  return Array.from(groups.entries()).map(([name, colors]) => {
    const sorted = [...colors].sort((a, b) => lightness(b.color) - lightness(a.color));
    const avg = colors.length > 0
      ? colors.reduce((sum, c) => sum + chroma(c.color), 0) / colors.length
      : 0;
    return { name, entries: sorted, avgChroma: avg };
  });
}

// ---- Main ----

export function deriveSemanticCSS(
  tree: TokenTree,
  _colorFormat: ColorFormat = 'hex',
  dimensionUnit: DimensionUnit = 'rem',
): string {
  const lines: string[] = [];
  const allColors = collectColors(tree);

  if (allColors.length > 0) {
    const palettes = groupByPalette(allColors);

    // Separate neutral (low chroma) and chromatic (high chroma) palettes
    const neutrals = palettes.filter((p) => p.avgChroma < 0.03 && p.entries.length >= 2);
    const chromatics = palettes.filter((p) => p.avgChroma >= 0.03 && p.entries.length >= 1);

    // Sort: neutrals by size (biggest first), chromatics by chroma (most colorful first)
    neutrals.sort((a, b) => b.entries.length - a.entries.length);
    chromatics.sort((a, b) => b.avgChroma - a.avgChroma);

    lines.push('  /* Semantic Colors */');

    // ---- Background & Foreground ----
    // Only emit if we find a neutral palette with a genuinely light top and dark bottom
    const neutralPalette = neutrals[0];
    if (neutralPalette && neutralPalette.entries.length >= 2) {
      const lightest = neutralPalette.entries[0];
      const darkest = neutralPalette.entries[neutralPalette.entries.length - 1];

      // Validate: lightest must be light, darkest must be dark, and they must contrast
      if (
        lightness(lightest.color) > 0.85 &&
        lightness(darkest.color) < 0.25 &&
        hasReadableContrast(lightest.color, darkest.color)
      ) {
        lines.push(`  --sem-background: ${lightest.hex};`);
        lines.push(`  --sem-foreground: ${darkest.hex};`);
        lines.push(`  --sem-secondary-foreground: ${darkest.hex};`);

        // Muted: middle of the neutral range
        const midIdx = Math.floor(neutralPalette.entries.length / 2);
        const mid = neutralPalette.entries[midIdx];
        if (mid) {
          lines.push(`  --sem-muted: ${mid.hex};`);
          lines.push(`  --sem-muted-foreground: ${darkest.hex}80;`);
          lines.push(`  --sem-border: ${mid.hex}40;`);
          lines.push(`  --sem-secondary: ${mid.hex}20;`);
        }
      }
      // If validation fails: don't emit bg/fg → demos use their hardcoded fallbacks
    }

    // ---- Primary / Accent ----
    // Only emit if we have a chromatic palette with meaningful chroma
    if (chromatics.length > 0) {
      const primaryPalette = chromatics[0];
      const midIdx = Math.floor(primaryPalette.entries.length / 2);
      const primaryColor = primaryPalette.entries[midIdx] ?? primaryPalette.entries[0];

      // Validate: must have visible chroma
      if (primaryColor && chroma(primaryColor.color) > 0.04) {
        lines.push(`  --sem-primary: ${primaryColor.hex};`);
        lines.push(`  --sem-accent: ${primaryColor.hex};`);

        // Primary foreground: use the lightest color from the primary palette if it's light enough,
        // otherwise use white
        const lightEnd = primaryPalette.entries[0];
        if (lightEnd && lightness(lightEnd.color) > 0.85) {
          lines.push(`  --sem-primary-foreground: ${lightEnd.hex};`);
          lines.push(`  --sem-accent-foreground: ${lightEnd.hex};`);
        } else {
          lines.push('  --sem-primary-foreground: #ffffff;');
          lines.push('  --sem-accent-foreground: #ffffff;');
        }
      }

      // Secondary chromatic palette
      if (chromatics.length > 1) {
        const secPalette = chromatics[1];
        const secMid = Math.floor(secPalette.entries.length / 2);
        const secColor = secPalette.entries[secMid] ?? secPalette.entries[0];
        if (secColor && chroma(secColor.color) > 0.04) {
          lines.push(`  --palette-secondary: ${secColor.hex};`);
        }
      }
    }
  }

  // ---- Typography ----
  try {
    const allTokens = flattenTokenTree(tree);
    let headingFont: string | null = null;
    let bodyFont: string | null = null;
    let monoFont: string | null = null;

    for (const { path, token } of allTokens) {
      const pathStr = path.join('.');
      if (pathStr.includes('fontFamily') || pathStr.includes('font-family')) {
        const val = (token as DesignToken).$value;
        if (typeof val === 'string' || Array.isArray(val)) {
          const fontStr = Array.isArray(val) ? val.join(', ') : val;
          if (fontStr.length > 0) {
            if (pathStr.includes('heading')) headingFont = fontStr;
            else if (pathStr.includes('body')) bodyFont = fontStr;
            else if (pathStr.includes('mono')) monoFont = fontStr;
          }
        }
      }
    }

    if (headingFont || bodyFont || monoFont) {
      lines.push('');
      lines.push('  /* Typography */');
      if (headingFont) lines.push(`  --sem-font-heading: ${headingFont};`);
      if (bodyFont) lines.push(`  --sem-font-body: ${bodyFont};`);
      if (monoFont) lines.push(`  --sem-font-mono: ${monoFont};`);
    }
  } catch {
    // Skip typography entirely if anything fails
  }

  // ---- Spacing ----
  try {
    const allTokens = flattenTokenTree(tree);
    for (const { path, token } of allTokens) {
      if (path[0] === 'spacing' && token.$type === 'spacing') {
        const val = (token as DesignToken).$value;
        if (isDimensionValue(val)) {
          const transformed = transformDimension(val, dimensionUnit);
          if (transformed && transformed !== '0rem' && transformed !== '0px') {
            lines.push('');
            lines.push('  /* Spacing */');
            lines.push(`  --sem-spacing-unit: ${transformed};`);
            break;
          }
        }
      }
    }
  } catch {
    // Skip
  }

  return lines.join('\n');
}
