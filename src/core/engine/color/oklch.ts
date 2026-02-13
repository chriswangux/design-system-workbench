import { type ColorValue } from '@/core/tokens/types';
import {
  oklch,
  rgb,
  formatHex,
  formatCss,
  displayable,
  clampChroma,
  type Oklch,
  type Color,
} from 'culori';

// ---- Color Creation ----

export function createColor(l: number, c: number, h: number, alpha = 1): ColorValue {
  return {
    colorSpace: 'oklch',
    channels: [
      Math.max(0, Math.min(1, l)),
      Math.max(0, Math.min(0.4, c)),
      ((h % 360) + 360) % 360,
    ],
    alpha: Math.max(0, Math.min(1, alpha)),
  };
}

// ---- Conversion Utilities ----

function toCuloriOklch(color: ColorValue): Oklch {
  return {
    mode: 'oklch',
    l: color.channels[0],
    c: color.channels[1],
    h: color.channels[2],
    alpha: color.alpha,
  };
}

export function fromCuloriColor(c: Color): ColorValue {
  const o = oklch(c);
  if (!o) return createColor(0, 0, 0);
  return createColor(o.l ?? 0, o.c ?? 0, o.h ?? 0, o.alpha ?? 1);
}

export function toHex(color: ColorValue): string {
  const c = toCuloriOklch(color);
  const clamped = clampChroma(c, 'oklch');
  return formatHex(clamped) ?? '#000000';
}

export function toRgb(color: ColorValue): { r: number; g: number; b: number; a: number } {
  const c = toCuloriOklch(color);
  const clamped = clampChroma(c, 'oklch');
  const srgb = rgb(clamped);
  if (!srgb) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: Math.round((srgb.r ?? 0) * 255),
    g: Math.round((srgb.g ?? 0) * 255),
    b: Math.round((srgb.b ?? 0) * 255),
    a: srgb.alpha ?? 1,
  };
}

export function toCssString(color: ColorValue): string {
  const c = toCuloriOklch(color);
  return formatCss(c) ?? 'oklch(0 0 0)';
}

export function toDisplayHex(color: ColorValue): string {
  return toHex(color);
}

export function isInGamut(color: ColorValue): boolean {
  const c = toCuloriOklch(color);
  return displayable(c);
}

export function gamutMap(color: ColorValue): ColorValue {
  const c = toCuloriOklch(color);
  const clamped = clampChroma(c, 'oklch');
  return fromCuloriColor(clamped);
}

// ---- Color Manipulation ----

export function setLightness(color: ColorValue, l: number): ColorValue {
  return createColor(l, color.channels[1], color.channels[2], color.alpha);
}

export function setChroma(color: ColorValue, c: number): ColorValue {
  return createColor(color.channels[0], c, color.channels[2], color.alpha);
}

export function setHue(color: ColorValue, h: number): ColorValue {
  return createColor(color.channels[0], color.channels[1], h, color.alpha);
}

export function adjustLightness(color: ColorValue, delta: number): ColorValue {
  return setLightness(color, color.channels[0] + delta);
}

export function adjustChroma(color: ColorValue, delta: number): ColorValue {
  return setChroma(color, color.channels[1] + delta);
}

export function shiftHue(color: ColorValue, degrees: number): ColorValue {
  return setHue(color, color.channels[2] + degrees);
}

export function mixColors(a: ColorValue, b: ColorValue, t: number): ColorValue {
  const at = Math.max(0, Math.min(1, t));
  return createColor(
    a.channels[0] + (b.channels[0] - a.channels[0]) * at,
    a.channels[1] + (b.channels[1] - a.channels[1]) * at,
    lerpHue(a.channels[2], b.channels[2], at),
    a.alpha + (b.alpha - a.alpha) * at,
  );
}

function lerpHue(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((a + diff * t) % 360 + 360) % 360;
}

// ---- Palette Generation ----

export function generatePaletteColors(
  steps: number,
  hueRange: { start: number; end: number },
  chromaRange: { start: number; end: number },
  lightnessRange: { start: number; end: number },
  hueCurve: (t: number) => number,
  chromaCurve: (t: number) => number,
  lightnessCurve: (t: number) => number,
): ColorValue[] {
  const colors: ColorValue[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0.5 : i / (steps - 1);
    const h = hueRange.start + (hueRange.end - hueRange.start) * hueCurve(t);
    const c = chromaRange.start + (chromaRange.end - chromaRange.start) * chromaCurve(t);
    const l = lightnessRange.start + (lightnessRange.end - lightnessRange.start) * lightnessCurve(t);
    colors.push(createColor(l, c, h));
  }
  return colors;
}
