import { parse, oklch, formatHex, clampChroma } from 'culori';
import type { ExtractedColor } from '../extraction/types';

// ---- Types ----

export interface ClusteredColor {
  /** OKLCH lightness (0-1) */
  l: number;
  /** OKLCH chroma (0-0.4) */
  c: number;
  /** OKLCH hue (0-360) */
  h: number;
  /** Hex representation for display */
  hex: string;
  /** Number of times this color appeared in the source */
  count: number;
}

export interface ColorCluster {
  /** Human-readable name derived from hue angle */
  name: string;
  /** Center hue of this cluster in degrees */
  hueCenter: number;
  /** Colors in this cluster sorted by lightness (dark to light) */
  colors: ClusteredColor[];
}

// ---- Hue Names ----

const HUE_NAMES: Array<{ min: number; max: number; name: string }> = [
  { min: 0, max: 30, name: 'red' },
  { min: 30, max: 60, name: 'orange' },
  { min: 60, max: 90, name: 'yellow' },
  { min: 90, max: 150, name: 'green' },
  { min: 150, max: 180, name: 'teal' },
  { min: 180, max: 210, name: 'cyan' },
  { min: 210, max: 250, name: 'blue' },
  { min: 250, max: 280, name: 'indigo' },
  { min: 280, max: 310, name: 'purple' },
  { min: 310, max: 340, name: 'pink' },
  { min: 340, max: 360, name: 'red' },
];

function hueToName(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;
  for (const band of HUE_NAMES) {
    if (normalized >= band.min && normalized < band.max) {
      return band.name;
    }
  }
  return 'red';
}

// ---- Color Parsing ----

interface ParsedOklch {
  l: number;
  c: number;
  h: number;
  alpha: number;
  hex: string;
  count: number;
}

function parseToOklch(extracted: ExtractedColor): ParsedOklch | null {
  try {
    const parsed = parse(extracted.value);
    if (!parsed) return null;

    const o = oklch(parsed);
    if (!o) return null;

    const l = o.l ?? 0;
    const c = o.c ?? 0;
    const h = o.h ?? 0;
    const alpha = o.alpha ?? 1;

    // Filter out fully transparent colors
    if (alpha < 0.01) return null;

    // Get hex for display
    const clamped = clampChroma({ mode: 'oklch', l, c, h } as Parameters<typeof clampChroma>[0], 'oklch');
    const hex = formatHex(clamped) ?? '#000000';

    return { l, c, h, alpha, hex, count: extracted.count };
  } catch {
    return null;
  }
}

// ---- Deduplication ----

/** OKLCH deltaE: simple Euclidean distance in OKLCH space */
function oklchDistance(a: ParsedOklch, b: ParsedOklch): number {
  const dl = a.l - b.l;
  const dc = a.c - b.c;
  // Hue distance needs special handling for circular values
  let dh = a.h - b.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  // Weighted: hue differences at low chroma matter less
  const avgC = (a.c + b.c) / 2;
  const hueWeight = Math.min(avgC * 5, 1); // scale down hue diff when chroma is low
  const dhNormalized = (dh / 360) * hueWeight;
  return Math.sqrt(dl * dl + dc * dc + dhNormalized * dhNormalized);
}

function deduplicateColors(colors: ParsedOklch[], threshold = 0.02): ParsedOklch[] {
  if (colors.length === 0) return [];

  const result: ParsedOklch[] = [];
  const used = new Set<number>();

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue;

    let merged = { ...colors[i] };
    let totalCount = colors[i].count;

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue;
      if (oklchDistance(colors[i], colors[j]) < threshold) {
        totalCount += colors[j].count;
        used.add(j);
      }
    }

    merged = { ...merged, count: totalCount };
    result.push(merged);
  }

  return result;
}

// ---- Hue-based Grouping ----

function hueDifference(a: number, b: number): number {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

interface HueGroup {
  hueCenter: number;
  colors: ParsedOklch[];
}

function groupByHue(colors: ParsedOklch[], tolerance = 30): HueGroup[] {
  if (colors.length === 0) return [];

  // Sort by hue
  const sorted = [...colors].sort((a, b) => a.h - b.h);
  const groups: HueGroup[] = [];
  let currentGroup: ParsedOklch[] = [sorted[0]];
  let currentHueSum = sorted[0].h;

  for (let i = 1; i < sorted.length; i++) {
    const currentCenter = currentHueSum / currentGroup.length;
    if (hueDifference(sorted[i].h, currentCenter) <= tolerance) {
      currentGroup.push(sorted[i]);
      currentHueSum += sorted[i].h;
    } else {
      groups.push({
        hueCenter: currentHueSum / currentGroup.length,
        colors: currentGroup,
      });
      currentGroup = [sorted[i]];
      currentHueSum = sorted[i].h;
    }
  }

  // Push the last group
  groups.push({
    hueCenter: currentHueSum / currentGroup.length,
    colors: currentGroup,
  });

  // Check if first and last groups should merge (wrap-around at 360/0)
  if (groups.length >= 2) {
    const first = groups[0];
    const last = groups[groups.length - 1];
    if (hueDifference(first.hueCenter, last.hueCenter) <= tolerance) {
      const merged = [...last.colors, ...first.colors];
      const mergedHue = circularMean(merged.map((c) => c.h));
      groups[0] = { hueCenter: mergedHue, colors: merged };
      groups.pop();
    }
  }

  return groups;
}

/** Circular mean for hue angles */
function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;
  let sinSum = 0;
  let cosSum = 0;
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  const meanRad = Math.atan2(sinSum / angles.length, cosSum / angles.length);
  return ((meanRad * 180) / Math.PI + 360) % 360;
}

// ---- Cluster Name Deduplication ----

function deduplicateNames(clusters: ColorCluster[]): ColorCluster[] {
  const nameCount: Record<string, number> = {};
  return clusters.map((cluster) => {
    const baseName = cluster.name;
    if (nameCount[baseName] === undefined) {
      nameCount[baseName] = 0;
    }
    nameCount[baseName]++;
    const name = nameCount[baseName] === 1 ? baseName : `${baseName}-${nameCount[baseName]}`;
    return { ...cluster, name };
  });
}

// ---- Main Export ----

/**
 * Cluster extracted colors into palette groups.
 *
 * Algorithm:
 * 1. Parse all color strings to OKLCH space
 * 2. Filter out transparent/invalid colors
 * 3. Separate achromatic colors (chroma < 0.02) as the "neutral" palette
 * 4. Group remaining colors by hue band (30-degree tolerance)
 * 5. Within each hue group, sort by lightness
 * 6. Deduplicate very similar colors (OKLCH distance < 0.02)
 * 7. Return clusters with names derived from hue angle
 */
export function clusterColors(extracted: ExtractedColor[]): ColorCluster[] {
  if (extracted.length === 0) return [];

  // Step 1-2: Parse and filter
  const parsed: ParsedOklch[] = [];
  for (const e of extracted) {
    const p = parseToOklch(e);
    if (p) parsed.push(p);
  }

  if (parsed.length === 0) return [];

  // Step 3: Separate achromatic colors
  const ACHROMATIC_THRESHOLD = 0.02;
  const achromatic = parsed.filter((c) => c.c < ACHROMATIC_THRESHOLD);
  const chromatic = parsed.filter((c) => c.c >= ACHROMATIC_THRESHOLD);

  const clusters: ColorCluster[] = [];

  // Step 6 (achromatic): Deduplicate neutrals
  if (achromatic.length > 0) {
    const deduped = deduplicateColors(achromatic);
    // Sort by lightness
    deduped.sort((a, b) => a.l - b.l);

    clusters.push({
      name: 'neutral',
      hueCenter: 0,
      colors: deduped.map((c) => ({
        l: round(c.l, 4),
        c: round(c.c, 4),
        h: round(c.h, 2),
        hex: c.hex,
        count: c.count,
      })),
    });
  }

  // Steps 4-6 (chromatic): Group by hue, deduplicate, sort
  if (chromatic.length > 0) {
    const hueGroups = groupByHue(chromatic, 30);

    for (const group of hueGroups) {
      const deduped = deduplicateColors(group.colors);
      // Sort by lightness within each group
      deduped.sort((a, b) => a.l - b.l);

      if (deduped.length === 0) continue;

      // Recompute hue center from deduplicated colors
      const hueCenter = circularMean(deduped.map((c) => c.h));

      clusters.push({
        name: hueToName(hueCenter),
        hueCenter: round(hueCenter, 2),
        colors: deduped.map((c) => ({
          l: round(c.l, 4),
          c: round(c.c, 4),
          h: round(c.h, 2),
          hex: c.hex,
          count: c.count,
        })),
      });
    }
  }

  // Step 7: Deduplicate cluster names (e.g., two "blue" clusters)
  return deduplicateNames(clusters);
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
