import type { ColorValue } from '@/core/tokens/types';
import { toRgb, createColor } from './oklch';
import { oklch } from 'culori';

// Color Vision Deficiency simulation using Brettel/Vienot matrices
// Based on: https://ixora.io/projects/colorblindness/color-blindness-simulation-research/

export type CVDType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

// Brettel simulation matrices (linearized sRGB space)
// These are the full severity (100%) simulation matrices

const PROTANOPIA_MATRIX = [
  0.152286, 1.052583, -0.204868,
  0.114503, 0.786281, 0.099216,
  -0.003882, -0.048116, 1.051998,
];

const DEUTERANOPIA_MATRIX = [
  0.367322, 0.860646, -0.227968,
  0.280085, 0.672501, 0.047413,
  -0.011820, 0.042940, 0.968881,
];

const TRITANOPIA_MATRIX = [
  1.255528, -0.076749, -0.178779,
  -0.078411, 0.930809, 0.147602,
  0.004733, 0.691367, 0.303900,
];

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function delinearize(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  return clamped <= 0.0031308
    ? Math.round(clamped * 12.92 * 255)
    : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
}

function applyMatrix(r: number, g: number, b: number, matrix: number[]): [number, number, number] {
  return [
    matrix[0] * r + matrix[1] * g + matrix[2] * b,
    matrix[3] * r + matrix[4] * g + matrix[5] * b,
    matrix[6] * r + matrix[7] * g + matrix[8] * b,
  ];
}

export function simulateCVD(color: ColorValue, type: CVDType): ColorValue {
  if (type === 'achromatopsia') {
    const { r, g, b } = toRgb(color);
    const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const result = oklch({ mode: 'rgb', r: gray / 255, g: gray / 255, b: gray / 255 });
    if (!result) return color;
    return createColor(result.l ?? 0, result.c ?? 0, result.h ?? 0, color.alpha);
  }

  const { r, g, b } = toRgb(color);
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  let matrix: number[];
  switch (type) {
    case 'protanopia': matrix = PROTANOPIA_MATRIX; break;
    case 'deuteranopia': matrix = DEUTERANOPIA_MATRIX; break;
    case 'tritanopia': matrix = TRITANOPIA_MATRIX; break;
  }

  const [sr, sg, sb] = applyMatrix(lr, lg, lb, matrix);
  const dr = delinearize(sr);
  const dg = delinearize(sg);
  const db = delinearize(sb);

  const result = oklch({ mode: 'rgb', r: dr / 255, g: dg / 255, b: db / 255 });
  if (!result) return color;
  return createColor(result.l ?? 0, result.c ?? 0, result.h ?? 0, color.alpha);
}

export function simulatePalette(
  colors: ColorValue[],
  type: CVDType,
): ColorValue[] {
  return colors.map((c) => simulateCVD(c, type));
}

export const CVD_TYPES: { type: CVDType; label: string; prevalence: string }[] = [
  { type: 'protanopia', label: 'Protanopia', prevalence: '~1% of males' },
  { type: 'deuteranopia', label: 'Deuteranopia', prevalence: '~1% of males' },
  { type: 'tritanopia', label: 'Tritanopia', prevalence: '~0.003%' },
  { type: 'achromatopsia', label: 'Achromatopsia', prevalence: '~0.003%' },
];
