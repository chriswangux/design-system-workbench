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
// Bookmarklet JSON shape
// ---------------------------------------------------------------------------

interface BookmarkletPayload {
  version?: number;
  url?: string;
  timestamp?: string;
  colors?: string[];
  fontFamilies?: string[];
  fontSizes?: string[];
  spacings?: string[];
  shadows?: string[];
  customProperties?: Record<string, string>;
  transitions?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a CSS dimension string like "16px", "1.5rem", "0.75em" into px.
 */
function parseDimensionToPx(raw: string): { valuePx: number; unit: string } | null {
  const trimmed = raw.trim();
  if (trimmed === '0') return { valuePx: 0, unit: 'px' };
  const match = trimmed.match(/^(-?[\d.]+)(px|rem|em|pt|%)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2];
  let valuePx = num;
  if (unit === 'rem') valuePx = num * 16;
  else if (unit === 'em') valuePx = num * 16;
  else if (unit === 'pt') valuePx = num * (4 / 3);
  return { valuePx, unit };
}

/**
 * Parse a box-shadow string into layers.
 */
function parseShadowLayers(value: string): ExtractedShadow['layers'] {
  if (!value || value === 'none') return [];
  const layers: ExtractedShadow['layers'] = [];

  // Split on commas at top level
  const layerStrings: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layerStrings.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) layerStrings.push(current.trim());

  for (const ls of layerStrings) {
    try {
      let remaining = ls;
      const inset = remaining.includes('inset');
      remaining = remaining.replace(/\binset\b/g, '').trim();

      // Extract color
      let color = '';
      const colorMatch = remaining.match(/(?:rgba?|hsla?|oklch|oklab)\([^)]+\)/);
      if (colorMatch) {
        color = colorMatch[0];
        remaining = remaining.replace(colorMatch[0], '').trim();
      } else {
        const hexMatch = remaining.match(/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/);
        if (hexMatch) {
          color = hexMatch[0];
          remaining = remaining.replace(hexMatch[0], '').trim();
        }
      }

      const nums = remaining.split(/\s+/).map(parseFloat).filter(n => !isNaN(n));
      if (nums.length >= 2) {
        layers.push({
          offsetX: nums[0],
          offsetY: nums[1],
          blur: nums[2] ?? 0,
          spread: nums[3] ?? 0,
          color,
          inset,
        });
      }
    } catch {
      // Skip unparseable layers
    }
  }

  return layers;
}

/**
 * Parse a transition shorthand value like "0.2s ease" or "150ms cubic-bezier(0.4,0,0.2,1)".
 */
function parseTransition(value: string): {
  duration?: { value: number; unit: string };
  easing?: string;
} {
  const result: { duration?: { value: number; unit: string }; easing?: string } = {};
  const trimmed = value.trim();

  // Extract duration
  const durationMatch = trimmed.match(/([\d.]+)(ms|s)\b/);
  if (durationMatch) {
    const num = parseFloat(durationMatch[1]);
    const unit = durationMatch[2];
    result.duration = {
      value: unit === 's' ? num * 1000 : num,
      unit,
    };
  }

  // Extract easing
  const cubicMatch = trimmed.match(/cubic-bezier\([^)]+\)/);
  if (cubicMatch) {
    result.easing = cubicMatch[0];
  } else {
    const namedEasings = ['ease-in-out', 'ease-in', 'ease-out', 'ease', 'linear', 'step-start', 'step-end'];
    for (const name of namedEasings) {
      if (new RegExp(`\\b${name}\\b`).test(trimmed)) {
        result.easing = name;
        break;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse JSON output from the extraction bookmarklet.
 * Accepts either a parsed object or a JSON string.
 */
export function parseBookmarkletData(input: string | BookmarkletPayload): ExtractionResult {
  const result = emptyResult('bookmarklet');

  let data: BookmarkletPayload;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input) as BookmarkletPayload;
    } catch {
      return result; // Malformed JSON, return empty
    }
  } else {
    data = input;
  }

  // ---- Colors ----
  if (Array.isArray(data.colors)) {
    const colorCounts = new Map<string, number>();
    for (const c of data.colors) {
      if (typeof c !== 'string') continue;
      const key = c.trim().toLowerCase();
      colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
    }
    result.colors = Array.from(colorCounts.entries())
      .map(([value, count]): ExtractedColor => ({
        value,
        source: 'bookmarklet',
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ---- Font families ----
  if (Array.isArray(data.fontFamilies)) {
    const familyCounts = new Map<string, number>();
    for (const f of data.fontFamilies) {
      if (typeof f !== 'string') continue;
      const normalized = f.replace(/["']/g, '').trim();
      if (normalized) {
        familyCounts.set(normalized, (familyCounts.get(normalized) ?? 0) + 1);
      }
    }
    result.fontFamilies = Array.from(familyCounts.entries())
      .map(([value, count]): ExtractedFontFamily => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ---- Font sizes ----
  if (Array.isArray(data.fontSizes)) {
    const sizeCounts = new Map<string, { valuePx: number; unit: string; count: number }>();
    for (const s of data.fontSizes) {
      if (typeof s !== 'string') continue;
      const dim = parseDimensionToPx(s);
      if (dim) {
        const key = s.trim();
        const existing = sizeCounts.get(key);
        if (existing) existing.count++;
        else sizeCounts.set(key, { valuePx: dim.valuePx, unit: dim.unit, count: 1 });
      }
    }
    result.fontSizes = Array.from(sizeCounts.entries())
      .map(([originalValue, data]): ExtractedFontSize => ({
        value: data.valuePx,
        unit: data.unit,
        originalValue,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ---- Spacings ----
  if (Array.isArray(data.spacings)) {
    const spacingCounts = new Map<string, { valuePx: number; unit: string; count: number }>();
    for (const s of data.spacings) {
      if (typeof s !== 'string') continue;
      const dim = parseDimensionToPx(s);
      if (dim && dim.valuePx > 0) {
        const key = s.trim();
        const existing = spacingCounts.get(key);
        if (existing) existing.count++;
        else spacingCounts.set(key, { valuePx: dim.valuePx, unit: dim.unit, count: 1 });
      }
    }
    result.spacings = Array.from(spacingCounts.entries())
      .map(([originalValue, data]): ExtractedSpacing => ({
        value: data.valuePx,
        unit: data.unit,
        originalValue,
        source: 'bookmarklet',
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // ---- Shadows ----
  if (Array.isArray(data.shadows)) {
    const seen = new Set<string>();
    for (const s of data.shadows) {
      if (typeof s !== 'string') continue;
      const key = s.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const layers = parseShadowLayers(key);
      if (layers.length > 0) {
        result.shadows.push({ original: key, layers });
      }
    }
  }

  // ---- Custom properties ----
  if (data.customProperties && typeof data.customProperties === 'object') {
    for (const [key, value] of Object.entries(data.customProperties)) {
      if (typeof key === 'string' && typeof value === 'string') {
        result.customProperties[key] = value;
      }
    }
  }

  // ---- Transitions / Motion ----
  if (Array.isArray(data.transitions)) {
    const durationCounts = new Map<number, { unit: string; count: number }>();
    const easingCounts = new Map<string, number>();

    for (const t of data.transitions) {
      if (typeof t !== 'string') continue;
      const parsed = parseTransition(t);
      if (parsed.duration) {
        const ms = parsed.duration.value;
        const existing = durationCounts.get(ms);
        if (existing) existing.count++;
        else durationCounts.set(ms, { unit: parsed.duration.unit, count: 1 });
      }
      if (parsed.easing) {
        easingCounts.set(parsed.easing, (easingCounts.get(parsed.easing) ?? 0) + 1);
      }
    }

    const motion: ExtractedMotion = {
      durations: Array.from(durationCounts.entries())
        .map(([ms, d]) => ({ value: ms, unit: d.unit, count: d.count }))
        .sort((a, b) => b.count - a.count),
      easings: Array.from(easingCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
    };
    result.motion = motion;
  }

  return result;
}
