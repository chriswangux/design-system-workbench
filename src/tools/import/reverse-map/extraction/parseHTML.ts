import type {
  ExtractionResult,
  ExtractedColor,
  ExtractedFontSize,
  ExtractedFontFamily,
  ExtractedSpacing,
  ExtractedShadow,
} from './types';
import { emptyResult } from './types';

// ---------------------------------------------------------------------------
// Tags to skip when walking the DOM
// ---------------------------------------------------------------------------

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE', 'NOSCRIPT',
  'BR', 'HR', 'WBR', 'BASE',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function increment<K>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Parse a computed pixel value like "16px" into a number.
 * Computed styles are always in px for dimensions.
 */
function parsePx(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalize a computed color value for deduplication.
 * Computed styles return rgb/rgba, so just lowercase and normalize spaces.
 */
function normalizeColor(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Check if a color is "interesting" (not transparent, not initial).
 */
function isInterestingColor(value: string): boolean {
  const v = normalizeColor(value);
  if (!v || v === 'transparent' || v === 'initial' || v === 'inherit') return false;
  if (v === 'rgba(0,0,0,0)') return false; // transparent
  return true;
}

/**
 * Parse a box-shadow computed value into layers.
 * Computed box-shadow is always in the form:
 * rgb(r, g, b) offsetX offsetY blur spread [inset]
 * separated by commas for multiple layers.
 */
function parseShadowLayers(value: string): ExtractedShadow['layers'] {
  if (!value || value === 'none') return [];

  const layers: ExtractedShadow['layers'] = [];

  // Split on commas at top level (respecting rgb/rgba parens)
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

      // Extract the color (functional notation)
      let color = '';
      const colorMatch = remaining.match(/(?:rgba?|hsla?)\([^)]+\)/);
      if (colorMatch) {
        color = colorMatch[0];
        remaining = remaining.replace(colorMatch[0], '').trim();
      }

      // Parse remaining numbers
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

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse raw HTML by rendering it in a sandboxed hidden iframe and walking
 * computed styles of all visible elements. Returns a Promise that resolves
 * once all styles are extracted and the iframe is cleaned up.
 */
export async function parseHTML(htmlText: string): Promise<ExtractionResult> {
  const result = emptyResult('html');

  // Bail out in non-browser environments (SSR, tests, etc.)
  if (typeof document === 'undefined') return result;

  return new Promise<ExtractionResult>((resolve) => {
    // Create a sandboxed iframe off-screen
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '-10000px';
    iframe.style.width = '1280px';
    iframe.style.height = '800px';
    iframe.style.visibility = 'hidden';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {
        // Already removed
      }
    };

    // Set a safety timeout to ensure we always resolve and clean up
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(result);
    }, 10000);

    iframe.onload = () => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(result);
          return;
        }

        extractFromDocument(iframeDoc, result);
      } catch {
        // If anything fails, return what we have
      } finally {
        clearTimeout(timeoutId);
        cleanup();
        resolve(result);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      resolve(result);
    };

    // Write the HTML into the iframe
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlText);
        iframeDoc.close();
      }
    } catch {
      clearTimeout(timeoutId);
      cleanup();
      resolve(result);
    }
  });
}

/**
 * Walk a document's elements and extract computed styles.
 */
function extractFromDocument(doc: Document, result: ExtractionResult): void {
  const colorCounts = new Map<string, { source: string; count: number }>();
  const fontSizeCounts = new Map<number, number>();
  const fontFamilyCounts = new Map<string, number>();
  const spacingValues = new Map<number, { source: string; count: number }>();
  const shadowSet = new Map<string, ExtractedShadow>();
  const durationCounts = new Map<number, { unit: string; count: number }>();
  const easingCounts = new Map<string, number>();

  const allElements = doc.querySelectorAll('*');

  for (const el of allElements) {
    if (SKIP_TAGS.has(el.tagName)) continue;

    let styles: CSSStyleDeclaration;
    try {
      styles = doc.defaultView!.getComputedStyle(el);
    } catch {
      continue;
    }

    // ---- Colors ----
    const colorProps = [
      'color', 'background-color', 'border-top-color', 'border-right-color',
      'border-bottom-color', 'border-left-color', 'outline-color',
    ];
    for (const prop of colorProps) {
      const val = styles.getPropertyValue(prop);
      if (isInterestingColor(val)) {
        const key = normalizeColor(val);
        const existing = colorCounts.get(key);
        if (existing) existing.count++;
        else colorCounts.set(key, { source: prop, count: 1 });
      }
    }

    // ---- Font size ----
    const fontSize = parsePx(styles.getPropertyValue('font-size'));
    if (fontSize > 0) {
      increment(fontSizeCounts, fontSize);
    }

    // ---- Font family ----
    const fontFamily = styles.getPropertyValue('font-family').trim();
    if (fontFamily) {
      const normalized = fontFamily.replace(/["']/g, '');
      increment(fontFamilyCounts, normalized);
    }

    // ---- Spacing ----
    const spacingProps: Array<{ prop: string; source: string }> = [
      { prop: 'padding-top', source: 'padding' },
      { prop: 'padding-right', source: 'padding' },
      { prop: 'padding-bottom', source: 'padding' },
      { prop: 'padding-left', source: 'padding' },
      { prop: 'margin-top', source: 'margin' },
      { prop: 'margin-right', source: 'margin' },
      { prop: 'margin-bottom', source: 'margin' },
      { prop: 'margin-left', source: 'margin' },
      { prop: 'row-gap', source: 'gap' },
      { prop: 'column-gap', source: 'gap' },
    ];
    for (const { prop, source } of spacingProps) {
      const val = parsePx(styles.getPropertyValue(prop));
      if (val > 0) {
        const existing = spacingValues.get(val);
        if (existing) existing.count++;
        else spacingValues.set(val, { source, count: 1 });
      }
    }

    // ---- Box shadow ----
    const shadow = styles.getPropertyValue('box-shadow');
    if (shadow && shadow !== 'none') {
      const key = shadow.trim();
      if (!shadowSet.has(key)) {
        const layers = parseShadowLayers(shadow);
        if (layers.length > 0) {
          shadowSet.set(key, { original: shadow, layers });
        }
      }

      // Also extract colors from the shadow
      const colors = shadow.match(/(?:rgba?|hsla?)\([^)]+\)/g) ?? [];
      for (const c of colors) {
        const cKey = normalizeColor(c);
        const existing = colorCounts.get(cKey);
        if (existing) existing.count++;
        else colorCounts.set(cKey, { source: 'box-shadow', count: 1 });
      }
    }

    // ---- Motion ----
    const transitionDuration = styles.getPropertyValue('transition-duration');
    if (transitionDuration && transitionDuration !== '0s') {
      const parts = transitionDuration.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        const match = trimmed.match(/^([\d.]+)(ms|s)$/);
        if (match) {
          const ms = match[2] === 's' ? parseFloat(match[1]) * 1000 : parseFloat(match[1]);
          if (ms > 0) {
            const existing = durationCounts.get(ms);
            if (existing) existing.count++;
            else durationCounts.set(ms, { unit: match[2], count: 1 });
          }
        }
      }
    }

    const transitionTiming = styles.getPropertyValue('transition-timing-function');
    if (transitionTiming && transitionTiming !== 'ease') {
      increment(easingCounts, transitionTiming.trim());
    }
  }

  // ---- Also extract CSS custom properties from stylesheets ----
  try {
    const sheets = doc.styleSheets;
    for (let si = 0; si < sheets.length; si++) {
      try {
        const rules = sheets[si].cssRules;
        for (let ri = 0; ri < rules.length; ri++) {
          const rule = rules[ri];
          if (rule instanceof CSSStyleRule) {
            const style = rule.style;
            for (let pi = 0; pi < style.length; pi++) {
              const prop = style[pi];
              if (prop.startsWith('--')) {
                result.customProperties[prop] = style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheet, skip
      }
    }
  } catch {
    // No stylesheet access
  }

  // ---- Build results ----

  result.colors = Array.from(colorCounts.entries())
    .map(([value, data]): ExtractedColor => ({
      value,
      source: data.source,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  result.fontSizes = Array.from(fontSizeCounts.entries())
    .map(([valuePx, count]): ExtractedFontSize => ({
      value: valuePx,
      unit: 'px',
      originalValue: `${valuePx}px`,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  result.fontFamilies = Array.from(fontFamilyCounts.entries())
    .map(([value, count]): ExtractedFontFamily => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  result.spacings = Array.from(spacingValues.entries())
    .map(([valuePx, data]): ExtractedSpacing => ({
      value: valuePx,
      unit: 'px',
      originalValue: `${valuePx}px`,
      source: data.source,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  result.shadows = Array.from(shadowSet.values());

  result.motion = {
    durations: Array.from(durationCounts.entries())
      .map(([ms, data]) => ({
        value: ms,
        unit: data.unit,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count),
    easings: Array.from(easingCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  };
}
