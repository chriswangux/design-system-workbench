import type { ColorValue } from '@/core/tokens/types';
import { toRgb } from './oklch';

// ---- WCAG 2.1 Relative Luminance & Contrast ----

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: ColorValue): number {
  const { r, g, b } = toRgb(color);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: ColorValue, b: ColorValue): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WCAGLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';

export function wcagLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}

// ---- APCA (Accessible Perceptual Contrast Algorithm) ----
// Simplified APCA W3 implementation for perceptual contrast

const SA98G = {
  mainTRC: 2.4,
  sRco: 0.2126729,
  sGco: 0.7151522,
  sBco: 0.0721750,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  loClip: 0.1,
  deltaYmin: 0.0005,
};

function sRGBtoY(r: number, g: number, b: number): number {
  const rlin = Math.pow(r / 255, SA98G.mainTRC);
  const glin = Math.pow(g / 255, SA98G.mainTRC);
  const blin = Math.pow(b / 255, SA98G.mainTRC);
  let y = SA98G.sRco * rlin + SA98G.sGco * glin + SA98G.sBco * blin;
  if (y < SA98G.blkThrs) {
    y += Math.pow(SA98G.blkThrs - y, SA98G.blkClmp);
  }
  return y;
}

export function apcaContrast(textColor: ColorValue, bgColor: ColorValue): number {
  const txt = toRgb(textColor);
  const bg = toRgb(bgColor);

  const txtY = sRGBtoY(txt.r, txt.g, txt.b);
  const bgY = sRGBtoY(bg.r, bg.g, bg.b);

  if (Math.abs(bgY - txtY) < SA98G.deltaYmin) return 0;

  let contrast: number;
  if (bgY > txtY) {
    // Light background, dark text (BoW)
    const sBG = Math.pow(bgY, SA98G.normBG);
    const sTXT = Math.pow(txtY, SA98G.normTXT);
    contrast = (sBG - sTXT) * SA98G.scaleBoW;
    contrast = contrast < SA98G.loClip ? 0 : contrast - SA98G.loBoWoffset;
  } else {
    // Dark background, light text (WoB)
    const sBG = Math.pow(bgY, SA98G.revBG);
    const sTXT = Math.pow(txtY, SA98G.revTXT);
    contrast = (sBG - sTXT) * SA98G.scaleWoB;
    contrast = contrast > -SA98G.loClip ? 0 : contrast + SA98G.loWoBoffset;
  }

  return Math.round(contrast * 1000) / 1000;
}

// ---- Contrast Matrix ----

export interface ContrastResult {
  foreground: string; // token path
  background: string; // token path
  foregroundColor: ColorValue;
  backgroundColor: ColorValue;
  wcagRatio: number;
  wcagLevel: WCAGLevel;
  apcaValue: number;
}

export function computeContrastMatrix(
  colors: Array<{ path: string; color: ColorValue }>,
): ContrastResult[] {
  const results: ContrastResult[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue;
      const ratio = contrastRatio(colors[i].color, colors[j].color);
      results.push({
        foreground: colors[i].path,
        background: colors[j].path,
        foregroundColor: colors[i].color,
        backgroundColor: colors[j].color,
        wcagRatio: Math.round(ratio * 100) / 100,
        wcagLevel: wcagLevel(ratio),
        apcaValue: apcaContrast(colors[i].color, colors[j].color),
      });
    }
  }
  return results;
}
