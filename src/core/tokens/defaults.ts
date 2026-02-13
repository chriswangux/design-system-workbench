import type { ColorLabConfig, TypographyLabConfig, SpacingLabConfig, ShadowLabConfig, MotionConfig, GridBuilderConfig, GeneratorConfigMap, BezierControlPoints } from './types';

const LINEAR: BezierControlPoints = [0, 0, 1, 1];
const EASE_OUT: BezierControlPoints = [0, 0, 0.58, 1];

export const DEFAULT_COLOR_LAB_CONFIG: ColorLabConfig = {
  palettes: [
    {
      id: 'blue',
      name: 'blue',
      steps: 11,
      hue: { start: 240, end: 240, curve: LINEAR },
      chroma: { start: 0.01, end: 0.01, curve: [0.25, 0.8, 0.75, 0.2] },
      lightness: { start: 0.97, end: 0.15, curve: EASE_OUT },
    },
    {
      id: 'neutral',
      name: 'neutral',
      steps: 11,
      hue: { start: 240, end: 240, curve: LINEAR },
      chroma: { start: 0.005, end: 0.005, curve: LINEAR },
      lightness: { start: 0.98, end: 0.10, curve: LINEAR },
    },
  ],
};

export const DEFAULT_TYPOGRAPHY_LAB_CONFIG: TypographyLabConfig = {
  baseFontSize: 16,
  ratio: 1.25,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  lineHeightConfig: {
    base: 1.5,
    tightening: 0.1,
  },
};

export const DEFAULT_SPACING_LAB_CONFIG: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'geometric',
  ratio: 2,
  steps: 10,
};

export const DEFAULT_SHADOW_LAB_CONFIG: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.5, z: 1 },
  elevationSteps: 5,
  baseBlur: 2,
  blurRatio: 2,
  baseOffset: 1,
  offsetRatio: 1.5,
  spreadBehavior: 'none',
  shadowColor: {
    colorSpace: 'oklch',
    channels: [0, 0, 0],
    alpha: 1,
  },
  ambientOpacity: 0.08,
  directionalOpacity: 0.12,
};

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.2, 0, 0, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.3, 0, 1, 1] },
    { id: 'spring', name: 'Spring', type: 'spring', spring: { stiffness: 300, damping: 24, mass: 1 } },
  ],
  baseDuration: 100,
  durationRatio: 1.5,
  durationSteps: 6,
};

export const DEFAULT_GRID_CONFIG: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 16, margin: 16 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 24, margin: 24 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 24, margin: 32 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 32, margin: 40, maxWidth: 1280 },
  ],
};

export const DEFAULT_GENERATOR_CONFIGS: GeneratorConfigMap = {
  'color-lab': DEFAULT_COLOR_LAB_CONFIG,
  'typography-lab': DEFAULT_TYPOGRAPHY_LAB_CONFIG,
  'spacing-lab': DEFAULT_SPACING_LAB_CONFIG,
  'shadow-lab': DEFAULT_SHADOW_LAB_CONFIG,
  'motion': DEFAULT_MOTION_CONFIG,
  'grid-builder': DEFAULT_GRID_CONFIG,
};
