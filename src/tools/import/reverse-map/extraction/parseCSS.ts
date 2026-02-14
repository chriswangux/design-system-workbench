import type {
  ExtractionResult,
  ExtractedColor,
  ExtractedFontSize,
  ExtractedFontFamily,
  ExtractedSpacing,
  ExtractedShadow,
  ExtractedMotion,
} from './types';
import { emptyResult } from './types';

// ---------------------------------------------------------------------------
// CSS named colors (lowercase) -- used to detect color values in declarations
// ---------------------------------------------------------------------------

const NAMED_COLORS = new Set([
  'aliceblue','antiquewhite','aqua','aquamarine','azure','beige','bisque',
  'black','blanchedalmond','blue','blueviolet','brown','burlywood','cadetblue',
  'chartreuse','chocolate','coral','cornflowerblue','cornsilk','crimson','cyan',
  'darkblue','darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey',
  'darkkhaki','darkmagenta','darkolivegreen','darkorange','darkorchid','darkred',
  'darksalmon','darkseagreen','darkslateblue','darkslategray','darkslategrey',
  'darkturquoise','darkviolet','deeppink','deepskyblue','dimgray','dimgrey',
  'dodgerblue','firebrick','floralwhite','forestgreen','fuchsia','gainsboro',
  'ghostwhite','gold','goldenrod','gray','green','greenyellow','grey',
  'honeydew','hotpink','indianred','indigo','ivory','khaki','lavender',
  'lavenderblush','lawngreen','lemonchiffon','lightblue','lightcoral','lightcyan',
  'lightgoldenrodyellow','lightgray','lightgreen','lightgrey','lightpink',
  'lightsalmon','lightseagreen','lightskyblue','lightslategray','lightslategrey',
  'lightsteelblue','lightyellow','lime','limegreen','linen','magenta','maroon',
  'mediumaquamarine','mediumblue','mediumorchid','mediumpurple','mediumseagreen',
  'mediumslateblue','mediumspringgreen','mediumturquoise','mediumvioletred',
  'midnightblue','mintcream','mistyrose','moccasin','navajowhite','navy',
  'oldlace','olive','olivedrab','orange','orangered','orchid','palegoldenrod',
  'palegreen','paleturquoise','palevioletred','papayawhip','peachpuff','peru',
  'pink','plum','powderblue','purple','rebeccapurple','red','rosybrown',
  'royalblue','saddlebrown','salmon','sandybrown','seagreen','seashell','sienna',
  'silver','skyblue','slateblue','slategray','slategrey','snow','springgreen',
  'steelblue','tan','teal','thistle','tomato','turquoise','violet','wheat',
  'white','whitesmoke','yellow','yellowgreen',
  // CSS special values
  'transparent','currentcolor','inherit',
]);

// ---------------------------------------------------------------------------
// Color-related CSS properties
// ---------------------------------------------------------------------------

const COLOR_PROPERTIES = new Set([
  'color', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'fill', 'stroke',
  'caret-color', 'accent-color', 'column-rule-color',
  'flood-color', 'lighting-color', 'stop-color',
]);

// Properties that may contain colors among other values
const COLOR_CONTAINING_PROPERTIES = new Set([
  'background', 'border', 'border-top', 'border-right', 'border-bottom',
  'border-left', 'outline', 'box-shadow', 'text-shadow', 'column-rule',
]);

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const FUNCTIONAL_COLOR_RE = /(?:rgba?|hsla?|oklch|oklab|lch|lab|color|hwb)\([^)]*\)/g;

const FONT_SIZE_RE = /^([\d.]+)(px|rem|em|pt|%)$/;

const SPACING_PROPERTIES = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap',
]);

const SHORTHAND_SPACING = new Set(['padding', 'margin', 'gap']);

const MOTION_DURATION_PROPERTIES = new Set([
  'transition-duration', 'animation-duration',
]);

const MOTION_EASING_PROPERTIES = new Set([
  'transition-timing-function', 'animation-timing-function',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip CSS comments from the source text.
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Parse a dimension value like "16px", "1.5rem", "0.75em" into
 * { value (in px), unit, originalValue }.
 */
function parseDimension(raw: string): { valuePx: number; unit: string; original: string } | null {
  const trimmed = raw.trim();
  if (trimmed === '0') {
    return { valuePx: 0, unit: 'px', original: '0' };
  }
  const match = trimmed.match(/^(-?[\d.]+)(px|rem|em|pt|%|vw|vh|vmin|vmax|ch|ex)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2];
  let valuePx = num;
  if (unit === 'rem') valuePx = num * 16;
  else if (unit === 'em') valuePx = num * 16; // assume base
  else if (unit === 'pt') valuePx = num * (4 / 3);
  return { valuePx, unit, original: trimmed };
}

/**
 * Increment count in a Map, or create with count 1.
 */
function increment<K>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Extract all color values from a CSS declaration value string.
 */
function extractColorsFromValue(value: string): string[] {
  const colors: string[] = [];

  // Extract hex colors
  const hexMatches = value.match(HEX_RE);
  if (hexMatches) {
    for (const h of hexMatches) colors.push(h);
  }

  // Extract functional colors (rgb, hsl, oklch, etc.)
  const funcMatches = value.match(FUNCTIONAL_COLOR_RE);
  if (funcMatches) {
    for (const f of funcMatches) colors.push(f);
  }

  // Check for named colors (only if no functional / hex found that covers it)
  // Split the value on whitespace and commas
  const tokens = value.split(/[\s,/]+/);
  for (const tok of tokens) {
    const lower = tok.toLowerCase().replace(/;$/, '');
    if (NAMED_COLORS.has(lower) && lower !== 'inherit' && lower !== 'currentcolor') {
      colors.push(lower);
    }
  }

  return colors;
}

// ---------------------------------------------------------------------------
// Shadow parsing
// ---------------------------------------------------------------------------

/**
 * Split a compound box-shadow value into individual layers.
 * E.g. "0 1px 2px black, inset 0 0 4px red" -> ["0 1px 2px black", "inset 0 0 4px red"]
 * Must respect functional parentheses.
 */
function splitShadowLayers(value: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) layers.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last) layers.push(last);
  return layers;
}

/**
 * Parse a single shadow layer string into structured data.
 */
function parseShadowLayer(layer: string): ExtractedShadow['layers'][number] | null {
  let remaining = layer.trim();
  const inset = /\binset\b/i.test(remaining);
  remaining = remaining.replace(/\binset\b/i, '').trim();

  // Extract color (functional or hex or named) from the string
  let color = 'rgba(0,0,0,1)';

  // Try functional color first
  const funcMatch = remaining.match(FUNCTIONAL_COLOR_RE);
  if (funcMatch) {
    color = funcMatch[0];
    remaining = remaining.replace(funcMatch[0], '').trim();
  } else {
    // Try hex
    const hexMatch = remaining.match(HEX_RE);
    if (hexMatch) {
      color = hexMatch[0];
      remaining = remaining.replace(hexMatch[0], '').trim();
    } else {
      // Try named color
      const words = remaining.split(/\s+/);
      const namedIdx = words.findIndex(w => NAMED_COLORS.has(w.toLowerCase()) && w.toLowerCase() !== 'inherit');
      if (namedIdx !== -1) {
        color = words[namedIdx].toLowerCase();
        words.splice(namedIdx, 1);
        remaining = words.join(' ');
      }
    }
  }

  // Parse numeric values: offsetX offsetY [blur [spread]]
  const numericTokens = remaining.split(/\s+/).filter(t => t.length > 0);
  const nums: number[] = [];
  for (const t of numericTokens) {
    const parsed = parseFloat(t);
    if (!isNaN(parsed)) nums.push(parsed);
    else break; // stop at non-numeric
  }

  if (nums.length < 2) return null;

  return {
    offsetX: nums[0],
    offsetY: nums[1],
    blur: nums[2] ?? 0,
    spread: nums[3] ?? 0,
    color,
    inset,
  };
}

// ---------------------------------------------------------------------------
// Transition shorthand parsing
// ---------------------------------------------------------------------------

function parseDurationValue(raw: string): { value: number; unit: string } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([\d.]+)(ms|s)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2];
  return { value: unit === 's' ? num * 1000 : num, unit };
}

// ---------------------------------------------------------------------------
// Rule-level extraction
// ---------------------------------------------------------------------------

interface ParsedDeclaration {
  property: string;
  value: string;
}

/**
 * Very lightweight brace-matching rule extraction.
 * Returns flat list of { selector, declarations } from CSS text.
 * Handles @media by recursing into the block.
 */
function extractDeclarations(css: string): ParsedDeclaration[] {
  const declarations: ParsedDeclaration[] = [];
  const cleaned = stripComments(css);

  // Walk character by character, tracking brace depth
  let i = 0;
  const len = cleaned.length;

  function skipWhitespace(): void {
    while (i < len && /\s/.test(cleaned[i])) i++;
  }

  function readUntil(stop: string): string {
    let buf = '';
    while (i < len && cleaned[i] !== stop) {
      buf += cleaned[i];
      i++;
    }
    return buf;
  }

  function parseBlock(): void {
    while (i < len) {
      skipWhitespace();
      if (i >= len) break;
      if (cleaned[i] === '}') { i++; return; }

      // Read until '{' or end
      const prelude = readUntil('{').trim();
      if (i >= len) break;
      i++; // skip '{'

      // Check if this is an at-rule with nested blocks (e.g. @media)
      if (prelude.startsWith('@media') || prelude.startsWith('@supports') || prelude.startsWith('@layer') || prelude.startsWith('@container')) {
        // Recurse into the nested block
        parseBlock();
        continue;
      }

      // Check if this is @font-face or @keyframes etc (has nested block)
      if (prelude.startsWith('@keyframes') || prelude.startsWith('@-webkit-keyframes')) {
        // Skip entire keyframes block
        let depth = 1;
        while (i < len && depth > 0) {
          if (cleaned[i] === '{') depth++;
          else if (cleaned[i] === '}') depth--;
          i++;
        }
        continue;
      }

      // Otherwise, this is a rule block -- read declarations until '}'
      const blockContent = readBlockContent();
      const decls = parseDeclarations(blockContent);
      declarations.push(...decls);
    }
  }

  function readBlockContent(): string {
    let buf = '';
    let depth = 1;
    while (i < len && depth > 0) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
      buf += cleaned[i];
      i++;
    }
    return buf;
  }

  function parseDeclarations(block: string): ParsedDeclaration[] {
    const result: ParsedDeclaration[] = [];
    // Split on semicolons, respecting parentheses
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (const ch of block) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (ch === ';' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());

    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = part.slice(0, colonIdx).trim().toLowerCase();
      const val = part.slice(colonIdx + 1).trim();
      if (prop && val) {
        result.push({ property: prop, value: val });
      }
    }
    return result;
  }

  parseBlock();
  return declarations;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseCSS(cssText: string): ExtractionResult {
  const result = emptyResult('css');

  const declarations = extractDeclarations(cssText);

  // Accumulators with counting
  const colorCounts = new Map<string, { source: string; count: number }>();
  const fontSizeCounts = new Map<string, { valuePx: number; unit: string; count: number }>();
  const fontFamilyCounts = new Map<string, number>();
  const spacingCounts = new Map<string, { valuePx: number; unit: string; source: string; count: number }>();
  const shadowSet = new Map<string, ExtractedShadow>();
  const durationCounts = new Map<string, { value: number; unit: string; count: number }>();
  const easingCounts = new Map<string, number>();

  for (const { property, value } of declarations) {
    // ---- Custom properties ----
    if (property.startsWith('--')) {
      result.customProperties[property] = value;

      // Also extract color if the custom property value is a color
      const colors = extractColorsFromValue(value);
      for (const c of colors) {
        const key = c.toLowerCase();
        const existing = colorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorCounts.set(key, { source: property, count: 1 });
        }
      }
      continue;
    }

    // ---- Colors ----
    if (COLOR_PROPERTIES.has(property)) {
      const colors = extractColorsFromValue(value);
      for (const c of colors) {
        const key = c.toLowerCase();
        const existing = colorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorCounts.set(key, { source: property, count: 1 });
        }
      }
    } else if (COLOR_CONTAINING_PROPERTIES.has(property)) {
      const colors = extractColorsFromValue(value);
      for (const c of colors) {
        const key = c.toLowerCase();
        const existing = colorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorCounts.set(key, { source: property, count: 1 });
        }
      }
    }

    // ---- Font size ----
    if (property === 'font-size') {
      const dim = parseDimension(value);
      if (dim) {
        const key = dim.original;
        const existing = fontSizeCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          fontSizeCounts.set(key, { valuePx: dim.valuePx, unit: dim.unit, count: 1 });
        }
      }
    }

    // ---- Font family ----
    if (property === 'font-family') {
      const normalized = value.replace(/["']/g, '').trim();
      if (normalized) {
        increment(fontFamilyCounts, normalized);
      }
    }

    // ---- Font shorthand ----
    if (property === 'font') {
      // font shorthand: [style] [variant] [weight] [stretch] size[/line-height] family
      // Quick extraction of font-size and family from the shorthand
      const parts = value.split(/\s+/);
      // Find first part that looks like a font-size
      for (let pi = 0; pi < parts.length; pi++) {
        const part = parts[pi].split('/')[0]; // handle size/line-height
        if (FONT_SIZE_RE.test(part)) {
          const dim = parseDimension(part);
          if (dim) {
            const key = dim.original;
            const existing = fontSizeCounts.get(key);
            if (existing) existing.count++;
            else fontSizeCounts.set(key, { valuePx: dim.valuePx, unit: dim.unit, count: 1 });
          }
          // Everything after this is font-family
          const familyParts = parts.slice(pi + 1).join(' ').replace(/["']/g, '').trim();
          if (familyParts) increment(fontFamilyCounts, familyParts);
          break;
        }
      }
    }

    // ---- Spacing ----
    if (SPACING_PROPERTIES.has(property)) {
      const baseSource = property.includes('-')
        ? property.split('-')[0] // "padding-top" -> "padding"
        : property;

      if (SHORTHAND_SPACING.has(property)) {
        // Shorthand: split into individual values
        const parts = value.split(/\s+/);
        for (const part of parts) {
          const dim = parseDimension(part);
          if (dim && dim.valuePx !== 0) {
            const key = `${dim.original}|${baseSource}`;
            const existing = spacingCounts.get(key);
            if (existing) {
              existing.count++;
            } else {
              spacingCounts.set(key, {
                valuePx: dim.valuePx,
                unit: dim.unit,
                source: baseSource,
                count: 1,
              });
            }
          }
        }
      } else {
        const dim = parseDimension(value);
        if (dim && dim.valuePx !== 0) {
          const key = `${dim.original}|${baseSource}`;
          const existing = spacingCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            spacingCounts.set(key, {
              valuePx: dim.valuePx,
              unit: dim.unit,
              source: baseSource,
              count: 1,
            });
          }
        }
      }
    }

    // ---- Shadows ----
    if (property === 'box-shadow' || property === 'text-shadow') {
      if (value === 'none' || value === 'inherit') continue;
      const key = value.trim();
      if (!shadowSet.has(key)) {
        const layerStrings = splitShadowLayers(value);
        const layers: ExtractedShadow['layers'] = [];
        for (const ls of layerStrings) {
          const parsed = parseShadowLayer(ls);
          if (parsed) layers.push(parsed);
        }
        if (layers.length > 0) {
          shadowSet.set(key, { original: value, layers });
        }
      }

      // Also extract colors from shadows
      const colors = extractColorsFromValue(value);
      for (const c of colors) {
        const cKey = c.toLowerCase();
        const existing = colorCounts.get(cKey);
        if (existing) existing.count++;
        else colorCounts.set(cKey, { source: property, count: 1 });
      }
    }

    // ---- Motion: durations ----
    if (MOTION_DURATION_PROPERTIES.has(property)) {
      const parts = value.split(',');
      for (const part of parts) {
        const parsed = parseDurationValue(part);
        if (parsed) {
          const key = part.trim();
          const existing = durationCounts.get(key);
          if (existing) existing.count++;
          else durationCounts.set(key, { value: parsed.value, unit: parsed.unit, count: 1 });
        }
      }
    }

    // ---- Motion: easings ----
    if (MOTION_EASING_PROPERTIES.has(property)) {
      const parts = splitAtTopLevelCommas(value);
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          increment(easingCounts, trimmed);
        }
      }
    }

    // ---- Transition shorthand ----
    if (property === 'transition') {
      // transition: property duration timing-function delay [, ...]
      const transitions = splitAtTopLevelCommas(value);
      for (const t of transitions) {
        const tokens = t.trim().split(/\s+/);
        for (const tok of tokens) {
          const dur = parseDurationValue(tok);
          if (dur) {
            const key = tok.trim();
            const existing = durationCounts.get(key);
            if (existing) existing.count++;
            else durationCounts.set(key, { value: dur.value, unit: dur.unit, count: 1 });
            break; // first duration-like token is the duration
          }
        }
        // Look for timing function
        const cubicMatch = t.match(/cubic-bezier\([^)]+\)/);
        if (cubicMatch) {
          increment(easingCounts, cubicMatch[0]);
        } else {
          // Check for named easings
          const namedEasings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'];
          for (const name of namedEasings) {
            // Word-boundary match
            if (new RegExp(`\\b${name}\\b`).test(t)) {
              increment(easingCounts, name);
              break;
            }
          }
        }
      }
    }

    // ---- Animation shorthand ----
    if (property === 'animation') {
      const animations = splitAtTopLevelCommas(value);
      for (const a of animations) {
        const tokens = a.trim().split(/\s+/);
        for (const tok of tokens) {
          const dur = parseDurationValue(tok);
          if (dur) {
            const key = tok.trim();
            const existing = durationCounts.get(key);
            if (existing) existing.count++;
            else durationCounts.set(key, { value: dur.value, unit: dur.unit, count: 1 });
            break;
          }
        }
        const cubicMatch = a.match(/cubic-bezier\([^)]+\)/);
        if (cubicMatch) {
          increment(easingCounts, cubicMatch[0]);
        }
      }
    }
  }

  // ---- Build final arrays ----

  result.colors = Array.from(colorCounts.entries())
    .map(([value, data]): ExtractedColor => ({
      value,
      source: data.source,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  result.fontSizes = Array.from(fontSizeCounts.entries())
    .map(([originalValue, data]): ExtractedFontSize => ({
      value: data.valuePx,
      unit: data.unit,
      originalValue,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  result.fontFamilies = Array.from(fontFamilyCounts.entries())
    .map(([value, count]): ExtractedFontFamily => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  result.spacings = Array.from(spacingCounts.entries())
    .map(([key, data]): ExtractedSpacing => {
      const originalValue = key.split('|')[0];
      return {
        value: data.valuePx,
        unit: data.unit,
        originalValue,
        source: data.source,
        count: data.count,
      };
    })
    .sort((a, b) => b.count - a.count);

  result.shadows = Array.from(shadowSet.values());

  const motion: ExtractedMotion = {
    durations: Array.from(durationCounts.values()).sort((a, b) => b.count - a.count),
    easings: Array.from(easingCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  };
  result.motion = motion;

  return result;
}

// ---------------------------------------------------------------------------
// Utility: split at top-level commas (respecting parentheses)
// ---------------------------------------------------------------------------

function splitAtTopLevelCommas(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}
