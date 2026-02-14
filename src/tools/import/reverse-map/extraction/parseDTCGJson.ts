import type {
  ExtractionResult,
  ExtractedColor,
  ExtractedFontSize,
  ExtractedSpacing,
  ExtractedShadow,
  ExtractedMotion,
} from './types';
import { emptyResult } from './types';

// ---------------------------------------------------------------------------
// DTCG JSON types (minimal -- only what we need for parsing)
// ---------------------------------------------------------------------------

interface DTCGToken {
  $value: unknown;
  $type?: string;
  $description?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDTCGToken(node: unknown): node is DTCGToken {
  return (
    typeof node === 'object' &&
    node !== null &&
    '$value' in node
  );
}

/**
 * Resolve an alias reference like "{color.blue.500}" within the token tree.
 * Returns the resolved value, or the original alias string if unresolvable.
 */
function resolveAlias(alias: string, root: Record<string, unknown>, depth = 0): unknown {
  if (depth > 10) return alias; // prevent infinite loops

  if (typeof alias !== 'string' || !alias.startsWith('{') || !alias.endsWith('}')) {
    return alias;
  }

  const path = alias.slice(1, -1).split('.');
  let current: unknown = root;

  for (const segment of path) {
    if (typeof current !== 'object' || current === null) return alias;
    current = (current as Record<string, unknown>)[segment];
  }

  if (isDTCGToken(current)) {
    const val = current.$value;
    if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
      return resolveAlias(val, root, depth + 1);
    }
    return val;
  }

  return alias;
}

/**
 * Convert a DTCG color value to a CSS string.
 * Handles various DTCG color representations.
 */
function colorToCSS(value: unknown): string | null {
  if (typeof value === 'string') return value;

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    // DTCG color object: { colorSpace, channels, alpha } (our internal format)
    if ('colorSpace' in obj && 'channels' in obj) {
      const channels = obj.channels as number[];
      const alpha = (obj.alpha as number) ?? 1;
      const cs = obj.colorSpace as string;
      if (cs === 'oklch' && channels.length >= 3) {
        const alphaStr = alpha < 1 ? ` / ${alpha}` : '';
        return `oklch(${channels[0]} ${channels[1]} ${channels[2]}${alphaStr})`;
      }
      if (cs === 'srgb' && channels.length >= 3) {
        const alphaStr = alpha < 1 ? `, ${alpha}` : '';
        return `rgb(${Math.round(channels[0] * 255)}, ${Math.round(channels[1] * 255)}, ${Math.round(channels[2] * 255)}${alphaStr})`;
      }
    }

    // Simple hex/rgb object
    if ('hex' in obj && typeof obj.hex === 'string') return obj.hex;
    if ('r' in obj && 'g' in obj && 'b' in obj) {
      const r = obj.r as number;
      const g = obj.g as number;
      const b = obj.b as number;
      const a = (obj.a as number) ?? 1;
      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }
  }

  return null;
}

/**
 * Convert a DTCG dimension value to px.
 */
function dimensionToPx(value: unknown): { valuePx: number; unit: string; original: string } | null {
  if (typeof value === 'string') {
    const match = value.match(/^(-?[\d.]+)(px|rem|em|pt)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2];
      let px = num;
      if (unit === 'rem') px = num * 16;
      else if (unit === 'em') px = num * 16;
      else if (unit === 'pt') px = num * (4 / 3);
      return { valuePx: px, unit, original: value };
    }
    // Try plain number (assume px)
    const plainNum = parseFloat(value);
    if (!isNaN(plainNum)) return { valuePx: plainNum, unit: 'px', original: value };
  }

  if (typeof value === 'number') {
    return { valuePx: value, unit: 'px', original: `${value}px` };
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('value' in obj && 'unit' in obj) {
      const num = typeof obj.value === 'number' ? obj.value : parseFloat(String(obj.value));
      const unit = String(obj.unit ?? 'px');
      if (!isNaN(num)) {
        let px = num;
        if (unit === 'rem') px = num * 16;
        else if (unit === 'em') px = num * 16;
        return { valuePx: px, unit, original: `${num}${unit}` };
      }
    }
  }

  return null;
}

/**
 * Convert a DTCG duration value to ms.
 */
function durationToMs(value: unknown): { ms: number; unit: string } | null {
  if (typeof value === 'string') {
    const match = value.match(/^([\d.]+)(ms|s)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2];
      return { ms: unit === 's' ? num * 1000 : num, unit };
    }
  }

  if (typeof value === 'number') {
    return { ms: value, unit: 'ms' };
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('value' in obj && 'unit' in obj) {
      const num = typeof obj.value === 'number' ? obj.value : parseFloat(String(obj.value));
      const unit = String(obj.unit ?? 'ms');
      if (!isNaN(num)) {
        return { ms: unit === 's' ? num * 1000 : num, unit };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a W3C DTCG format JSON token file and extract design properties.
 * Accepts either a parsed object or a JSON string.
 */
export function parseDTCGJson(input: string | Record<string, unknown>): ExtractionResult {
  const result = emptyResult('dtcg-json');

  let root: Record<string, unknown>;
  if (typeof input === 'string') {
    try {
      root = JSON.parse(input) as Record<string, unknown>;
    } catch {
      return result;
    }
  } else {
    root = input;
  }

  // Accumulators
  const colors: ExtractedColor[] = [];
  const fontSizes: ExtractedFontSize[] = [];
  const fontFamilies = new Map<string, number>();
  const spacings: ExtractedSpacing[] = [];
  const shadows: ExtractedShadow[] = [];
  const durations: ExtractedMotion['durations'] = [];
  const easings: ExtractedMotion['easings'] = [];

  /**
   * Recursively walk the DTCG tree, collecting tokens.
   */
  function walk(node: unknown, path: string, inheritedType?: string): void {
    if (typeof node !== 'object' || node === null) return;

    const obj = node as Record<string, unknown>;
    const nodeType = (obj.$type as string | undefined) ?? inheritedType;

    if (isDTCGToken(obj)) {
      // This is a token -- extract its value
      let value = obj.$value;

      // Resolve alias
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        value = resolveAlias(value, root);
      }

      processToken(value, nodeType, path);
      return;
    }

    // Otherwise, it's a group -- recurse into children
    for (const [key, child] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // skip meta keys
      walk(child, path ? `${path}.${key}` : key, nodeType);
    }
  }

  function processToken(value: unknown, type: string | undefined, path: string): void {
    switch (type) {
      case 'color': {
        const css = colorToCSS(value);
        if (css) {
          colors.push({ value: css, source: path, count: 1 });
        }
        break;
      }

      case 'dimension':
      case 'spacing': {
        const dim = dimensionToPx(value);
        if (dim) {
          spacings.push({
            value: dim.valuePx,
            unit: dim.unit,
            originalValue: dim.original,
            source: path,
            count: 1,
          });
        }
        break;
      }

      case 'fontSize': {
        const dim = dimensionToPx(value);
        if (dim) {
          fontSizes.push({
            value: dim.valuePx,
            unit: dim.unit,
            originalValue: dim.original,
            count: 1,
          });
        }
        break;
      }

      case 'fontFamily': {
        const family = Array.isArray(value) ? value.join(', ') : String(value);
        fontFamilies.set(family, (fontFamilies.get(family) ?? 0) + 1);
        break;
      }

      case 'fontWeight':
      case 'lineHeight':
      case 'letterSpacing':
      case 'number':
      case 'opacity':
        // These are simple numeric types; we don't have a dedicated bucket
        // for them in ExtractionResult yet, so skip.
        break;

      case 'shadow': {
        // DTCG shadow: single layer or array of layers
        const layerInputs = Array.isArray(value) ? value : [value];
        const layers: ExtractedShadow['layers'] = [];
        for (const layer of layerInputs) {
          if (typeof layer === 'object' && layer !== null) {
            const l = layer as Record<string, unknown>;
            const colorCSS = colorToCSS(l.color) ?? 'rgba(0,0,0,1)';
            const ox = dimensionToPx(l.offsetX);
            const oy = dimensionToPx(l.offsetY);
            const bl = dimensionToPx(l.blur);
            const sp = dimensionToPx(l.spread);
            layers.push({
              offsetX: ox?.valuePx ?? 0,
              offsetY: oy?.valuePx ?? 0,
              blur: bl?.valuePx ?? 0,
              spread: sp?.valuePx ?? 0,
              color: colorCSS,
              inset: (l.inset as boolean) ?? false,
            });
          }
        }
        if (layers.length > 0) {
          const original = layers
            .map(l => {
              const parts = [
                l.inset ? 'inset' : '',
                `${l.offsetX}px`,
                `${l.offsetY}px`,
                `${l.blur}px`,
                `${l.spread}px`,
                l.color,
              ].filter(Boolean).join(' ');
              return parts;
            })
            .join(', ');
          shadows.push({ original, layers });
        }
        break;
      }

      case 'duration': {
        const dur = durationToMs(value);
        if (dur) {
          durations.push({ value: dur.ms, unit: dur.unit, count: 1 });
        }
        break;
      }

      case 'cubicBezier': {
        if (Array.isArray(value) && value.length === 4) {
          const str = `cubic-bezier(${value.join(', ')})`;
          easings.push({ value: str, count: 1 });
        }
        break;
      }

      case 'transition': {
        // DTCG transition: { duration, timingFunction, delay, property }
        if (typeof value === 'object' && value !== null) {
          const t = value as Record<string, unknown>;
          const dur = durationToMs(t.duration);
          if (dur) durations.push({ value: dur.ms, unit: dur.unit, count: 1 });
          if (Array.isArray(t.timingFunction) && t.timingFunction.length === 4) {
            easings.push({ value: `cubic-bezier(${t.timingFunction.join(', ')})`, count: 1 });
          }
        }
        break;
      }

      case 'typography': {
        // DTCG typography composite
        if (typeof value === 'object' && value !== null) {
          const t = value as Record<string, unknown>;
          if (t.fontSize) {
            const dim = dimensionToPx(t.fontSize);
            if (dim) fontSizes.push({ value: dim.valuePx, unit: dim.unit, originalValue: dim.original, count: 1 });
          }
          if (t.fontFamily) {
            const family = Array.isArray(t.fontFamily) ? t.fontFamily.join(', ') : String(t.fontFamily);
            fontFamilies.set(family, (fontFamilies.get(family) ?? 0) + 1);
          }
        }
        break;
      }

      default: {
        // Attempt heuristic: if value looks like a color, treat it as one
        if (typeof value === 'string') {
          if (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^(?:rgba?|hsla?|oklch)\(/.test(value)) {
            colors.push({ value, source: path, count: 1 });
          }
        }
        break;
      }
    }
  }

  // Walk the tree
  walk(root, '');

  // Build results
  result.colors = colors;
  result.fontSizes = fontSizes;
  result.fontFamilies = Array.from(fontFamilies.entries())
    .map(([value, count]): { value: string; count: number } => ({ value, count }));
  result.spacings = spacings;
  result.shadows = shadows;
  result.motion = { durations, easings };

  return result;
}
