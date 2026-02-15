import type {
  ColorLabConfig,
  TypographyLabConfig,
  SpacingLabConfig,
  ShadowLabConfig,
  MotionConfig,
  GridBuilderConfig,
  BezierControlPoints,
} from '@/core/tokens/types';
import type { StylePreset } from './styleLibraryStore';

// ---- Shared Bezier Curves ----

const LINEAR: BezierControlPoints = [0, 0, 1, 1];
const EASE_OUT: BezierControlPoints = [0, 0, 0.58, 1];
const CHROMA_PEAK_MID: BezierControlPoints = [0.3, 0.9, 0.7, 0.1];

// ---- Helper: Standard Grid ----

const STANDARD_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 16, margin: 16 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 24, margin: 24 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 24, margin: 32 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 32, margin: 40, maxWidth: 1280 },
  ],
};

// ============================================================================
// 1. DEFAULT
// Clean and balanced. Blue accent on neutral grays.
// ============================================================================

const DEFAULT_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'blue',
      name: 'blue',
      steps: 11,
      hue: { start: 255, end: 255, curve: LINEAR },
      chroma: { start: 0.04, end: 0.10, curve: CHROMA_PEAK_MID },
      lightness: { start: 0.97, end: 0.20, curve: EASE_OUT },
    },
    {
      id: 'neutral',
      name: 'neutral',
      steps: 11,
      hue: { start: 250, end: 250, curve: LINEAR },
      chroma: { start: 0.005, end: 0.005, curve: LINEAR },
      lightness: { start: 0.98, end: 0.10, curve: LINEAR },
    },
  ],
};

const DEFAULT_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 16,
  ratio: 1.25,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  lineHeightConfig: { base: 1.5, tightening: 0.1 },
};

const DEFAULT_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'arithmetic',
  steps: 10,
};

const DEFAULT_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.5, z: 1 },
  elevationSteps: 5,
  baseBlur: 2,
  blurRatio: 2,
  baseOffset: 1,
  offsetRatio: 1.5,
  spreadBehavior: 'none',
  shadowColor: { colorSpace: 'oklch', channels: [0, 0, 0], alpha: 1 },
  ambientOpacity: 0.08,
  directionalOpacity: 0.12,
};

const DEFAULT_MOTION: MotionConfig = {
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

const DEFAULT_PRESET: StylePreset = {
  id: 'preset-default',
  siteComponent: 'default',
  name: 'Default',
  prompt: {
    overall: 'Clean and balanced. Blue accent on neutral grays. Inter font family. The standard starting point for most design systems.',
    characteristics: {
      typography: "Inter for headings and body, JetBrains Mono for code. 16px base, major third ratio (1.25). Comfortable 1.5 line-height with gentle tightening at large sizes.",
      colorPhilosophy: "Blue accent palette on cool neutral grays. Balanced saturation curve peaks mid-range. Neutrals carry a faint cool tint (hue 250) for cohesion.",
      borders: "Standard 1px borders using neutral palette. Clean and unobtrusive.",
      shadows: "Centered overhead light source. 5 elevation steps with moderate blur (2px base, 2x ratio). Neutral black shadow color. Balanced ambient/directional opacity.",
      animations: "Standard Material-inspired curves. 100ms base duration, 1.5x ratio across 6 steps. Includes spring easing for playful interactions.",
      interactions: "Smooth entrance and exit curves. Standard easing for general transitions. Spring physics for bouncy feedback.",
      layout: "Standard responsive grid: 4/8/12 columns. 16-32px gutters scaling with breakpoint. Max-width 1280px at xl.",
    },
  },
  generatorConfigs: {
    'color-lab': DEFAULT_COLORS,
    'typography-lab': DEFAULT_TYPOGRAPHY,
    'spacing-lab': DEFAULT_SPACING,
    'shadow-lab': DEFAULT_SHADOWS,
    'motion': DEFAULT_MOTION,
    'grid-builder': STANDARD_GRID,
  },
  colors: ['#a8c8f0', '#4a7fd4', '#1a3f7a', '#d4d4d8', '#27272a'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 2. LINEAR
// Dark, focused, and precise. Violet accents on deep charcoal neutrals.
// ============================================================================

const LINEAR_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'violet',
      name: 'violet',
      steps: 11,
      hue: { start: 280, end: 280, curve: LINEAR },
      chroma: { start: 0.05, end: 0.15, curve: [0.25, 0.85, 0.65, 0.15] },
      lightness: { start: 0.95, end: 0.18, curve: EASE_OUT },
    },
    {
      id: 'neutral-dark',
      name: 'neutral',
      steps: 11,
      hue: { start: 270, end: 270, curve: LINEAR },
      chroma: { start: 0.008, end: 0.008, curve: LINEAR },
      lightness: { start: 0.95, end: 0.08, curve: LINEAR },
    },
  ],
};

const LINEAR_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 15,
  ratio: 1.2,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  lineHeightConfig: { base: 1.45, tightening: 0.12 },
};

const LINEAR_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'geometric',
  ratio: 1.5,
  steps: 10,
};

const LINEAR_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0.2, y: -0.8, z: 1 },
  elevationSteps: 5,
  baseBlur: 1,
  blurRatio: 1.8,
  baseOffset: 1,
  offsetRatio: 1.6,
  spreadBehavior: 'shrink',
  shadowColor: { colorSpace: 'oklch', channels: [0, 0, 270], alpha: 1 },
  ambientOpacity: 0.04,
  directionalOpacity: 0.15,
};

const LINEAR_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.16, 0, 0, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.4, 0, 1, 1] },
    { id: 'micro', name: 'Micro', type: 'bezier', bezier: [0.12, 0, 0.2, 1] },
  ],
  baseDuration: 80,
  durationRatio: 1.4,
  durationSteps: 6,
};

const LINEAR_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 12, margin: 12 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 16, margin: 16 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 20, margin: 24 },
    { name: 'xl', minWidth: 1440, columns: 12, gutter: 24, margin: 32, maxWidth: 1440 },
  ],
};

const LINEAR_PRESET: StylePreset = {
  id: 'preset-linear',
  siteComponent: 'linear',
  name: 'Linear',
  prompt: {
    overall: 'Dark, focused, and precise. Violet accents on deep charcoal neutrals. Designed for tools and dashboards that demand attention without distraction.',
    characteristics: {
      typography: "Inter for all text, JetBrains Mono for code. 15px base, minor third ratio (1.2). Tight 1.45 line-height with aggressive tightening. Dense, tool-like hierarchy.",
      colorPhilosophy: "Violet accent on deep charcoal neutrals. Violet-tinted grays (hue 270) with low chroma (0.008). Accent chroma peaks early for punchy mid-tones.",
      darkMode: "Native dark aesthetic. Deep charcoal base (lightness 0.08). Violet-tinted surfaces feel cohesive rather than flat black.",
      borders: "Subtle violet-tinted borders. 1px, low contrast against dark surfaces. Functional, not decorative.",
      shadows: "Directional light (slight right offset). Shrinking spread for crisp edges. Low ambient (0.04), higher directional (0.15). Violet-tinted shadow color.",
      animations: "Snappy, tool-grade curves. bezier(0.16, 0, 0, 1) standard. 80ms base duration, 1.4x ratio. Includes dedicated micro-interaction curve.",
      interactions: "Instant-feeling micro interactions. Sharp entrance/exit curves. Focus on responsiveness over decoration.",
      layout: "Dense grid with tight gutters (12-24px). Max-width 1440px. 4/8/12 column progression. Optimized for dashboard density.",
    },
  },
  generatorConfigs: {
    'color-lab': LINEAR_COLORS,
    'typography-lab': LINEAR_TYPOGRAPHY,
    'spacing-lab': LINEAR_SPACING,
    'shadow-lab': LINEAR_SHADOWS,
    'motion': LINEAR_MOTION,
    'grid-builder': LINEAR_GRID,
  },
  colors: ['#1c1b22', '#6b6b78', '#9b6ee0', '#c5a3f5', '#f0eef5'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 3. STRIPE
// Pristine, confident, and spacious. Indigo gradients on bright whites.
// ============================================================================

const STRIPE_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'indigo',
      name: 'indigo',
      steps: 11,
      hue: { start: 265, end: 265, curve: LINEAR },
      chroma: { start: 0.06, end: 0.18, curve: [0.2, 0.8, 0.6, 0.2] },
      lightness: { start: 0.97, end: 0.22, curve: [0, 0, 0.4, 1] },
    },
    {
      id: 'neutral-cool',
      name: 'neutral',
      steps: 11,
      hue: { start: 240, end: 240, curve: LINEAR },
      chroma: { start: 0.005, end: 0.005, curve: LINEAR },
      lightness: { start: 0.99, end: 0.12, curve: LINEAR },
    },
  ],
};

const STRIPE_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 16,
  ratio: 1.333,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
    body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
    mono: ['SF Mono', 'Menlo', 'monospace'],
  },
  lineHeightConfig: { base: 1.55, tightening: 0.08 },
};

const STRIPE_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'geometric',
  ratio: 1.618,
  steps: 10,
};

const STRIPE_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.3, z: 1 },
  elevationSteps: 5,
  baseBlur: 4,
  blurRatio: 2.5,
  baseOffset: 1,
  offsetRatio: 1.8,
  spreadBehavior: 'none',
  shadowColor: { colorSpace: 'oklch', channels: [0, 0, 240], alpha: 1 },
  ambientOpacity: 0.12,
  directionalOpacity: 0.08,
};

const STRIPE_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.25, 0.1, 0.25, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0.2, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.4, 0, 1, 1] },
    { id: 'smooth', name: 'Smooth', type: 'bezier', bezier: [0.16, 1, 0.3, 1] },
  ],
  baseDuration: 150,
  durationRatio: 1.5,
  durationSteps: 6,
};

const STRIPE_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 20, margin: 20 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 28, margin: 32 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 32, margin: 40 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 40, margin: 48, maxWidth: 1200 },
  ],
};

const STRIPE_PRESET: StylePreset = {
  id: 'preset-stripe',
  siteComponent: 'stripe',
  name: 'Stripe',
  prompt: {
    overall: 'Pristine, confident, and spacious. Indigo gradients on bright whites. Generous spacing and soft shadows that breathe.',
    characteristics: {
      typography: "System fonts (-apple-system, BlinkMacSystemFont, Segoe UI) for native feel. SF Mono for code. 16px base, perfect fourth ratio (1.333). Relaxed 1.55 line-height.",
      colorPhilosophy: "Indigo accent on near-white neutrals. High lightness range (0.99 to 0.12). Cool-tinted neutrals (hue 240). Indigo chroma peaks early for vibrant mid-tones.",
      lightMode: "Pristine white foundation. Near-pure white surfaces (lightness 0.99). Airy, confident, premium feel.",
      borders: "Minimal, cool-tinted. 1px borders from the neutral palette. High contrast against white backgrounds.",
      shadows: "Large, soft, diffuse. 4px base blur, 2.5x ratio. Cool-tinted shadow color (hue 240). Higher ambient (0.12) than directional (0.08) for wrapped, even lighting.",
      animations: "Smooth and confident. bezier(0.25, 0.1, 0.25, 1) standard. 150ms base, 1.5x ratio. Includes a smooth spring-like bezier(0.16, 1, 0.3, 1).",
      interactions: "Gentle, refined transitions. Soft entrance curves. Smooth easing for hover states and reveals.",
      layout: "Generous spacing. 20-40px gutters. Max-width 1200px. Wide margins (up to 48px). Spacious, breathing layout.",
    },
  },
  generatorConfigs: {
    'color-lab': STRIPE_COLORS,
    'typography-lab': STRIPE_TYPOGRAPHY,
    'spacing-lab': STRIPE_SPACING,
    'shadow-lab': STRIPE_SHADOWS,
    'motion': STRIPE_MOTION,
    'grid-builder': STRIPE_GRID,
  },
  colors: ['#ffffff', '#a8a0d6', '#635bff', '#32297a', '#525f7f'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 4. WARM EARTH
// Organic and grounded. Terracotta and amber tones on warm stone neutrals.
// ============================================================================

const WARM_EARTH_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'terracotta',
      name: 'terracotta',
      steps: 11,
      hue: { start: 30, end: 30, curve: LINEAR },
      chroma: { start: 0.05, end: 0.12, curve: [0.35, 0.85, 0.65, 0.15] },
      lightness: { start: 0.96, end: 0.22, curve: EASE_OUT },
    },
    {
      id: 'amber',
      name: 'amber',
      steps: 11,
      hue: { start: 60, end: 55, curve: LINEAR },
      chroma: { start: 0.04, end: 0.14, curve: CHROMA_PEAK_MID },
      lightness: { start: 0.96, end: 0.25, curve: EASE_OUT },
    },
    {
      id: 'neutral-warm',
      name: 'neutral',
      steps: 11,
      hue: { start: 50, end: 50, curve: LINEAR },
      chroma: { start: 0.01, end: 0.01, curve: LINEAR },
      lightness: { start: 0.97, end: 0.12, curve: LINEAR },
    },
  ],
};

const WARM_EARTH_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 17,
  ratio: 1.25,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['Georgia', 'Cambria', 'serif'],
    body: ['system-ui', '-apple-system', 'sans-serif'],
    mono: ['Menlo', 'Consolas', 'monospace'],
  },
  lineHeightConfig: { base: 1.55, tightening: 0.08 },
};

const WARM_EARTH_SPACING: SpacingLabConfig = {
  baseUnit: 5,
  progression: 'arithmetic',
  steps: 10,
};

const WARM_EARTH_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0.4, y: -0.4, z: 1 },
  elevationSteps: 5,
  baseBlur: 3,
  blurRatio: 2,
  baseOffset: 1,
  offsetRatio: 1.6,
  spreadBehavior: 'none',
  shadowColor: { colorSpace: 'oklch', channels: [0.15, 0.02, 50], alpha: 1 },
  ambientOpacity: 0.10,
  directionalOpacity: 0.10,
};

const WARM_EARTH_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.25, 0, 0.15, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0.2, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.35, 0, 0.8, 1] },
    { id: 'gentle', name: 'Gentle', type: 'spring', spring: { stiffness: 180, damping: 22, mass: 1.2 } },
  ],
  baseDuration: 120,
  durationRatio: 1.6,
  durationSteps: 6,
};

const WARM_EARTH_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 16, margin: 20 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 24, margin: 28 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 28, margin: 36 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 32, margin: 44, maxWidth: 1200 },
  ],
};

const WARM_EARTH_PRESET: StylePreset = {
  id: 'preset-warm-earth',
  siteComponent: 'warm-earth',
  name: 'Warm Earth',
  prompt: {
    overall: 'Organic and grounded. Terracotta and amber tones on warm stone neutrals. Serif headings bring editorial warmth.',
    characteristics: {
      typography: "Georgia serif for headings, system sans-serif for body, Menlo for code. 17px base, major third ratio (1.25). Generous 1.55 line-height. Editorial, warm typographic voice.",
      colorPhilosophy: "Dual warm accent palettes: terracotta (hue 30) and amber (hue 60). Warm-tinted neutrals (hue 50, chroma 0.01). Earth-tone palette with natural, organic feel.",
      borders: "Warm-tinted borders. Subtle terracotta or amber influence. Soft, not harsh.",
      shadows: "Warm offset light (x:0.4, y:-0.4). Warm-tinted shadow color (hue 50, slight chroma). Balanced 0.10 ambient and directional opacity. Natural, grounded depth.",
      animations: "Organic, unhurried curves. bezier(0.25, 0, 0.15, 1) standard. 120ms base, 1.6x ratio. Includes gentle spring (stiffness 180, damping 22, mass 1.2).",
      interactions: "Warm, gentle transitions. Spring physics for natural bounce. Nothing abrupt or mechanical.",
      layout: "Comfortable grid with 16-32px gutters. Max-width 1200px. Slightly generous margins. Breathable but not sparse.",
    },
  },
  generatorConfigs: {
    'color-lab': WARM_EARTH_COLORS,
    'typography-lab': WARM_EARTH_TYPOGRAPHY,
    'spacing-lab': WARM_EARTH_SPACING,
    'shadow-lab': WARM_EARTH_SHADOWS,
    'motion': WARM_EARTH_MOTION,
    'grid-builder': WARM_EARTH_GRID,
  },
  colors: ['#f5ede4', '#c77b4a', '#d4a043', '#6b4a30', '#2c2520'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 5. NEON CYBER
// Bold and electric. Cyan and magenta on pure black. Monospace typography.
// ============================================================================

const NEON_CYBER_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'cyan',
      name: 'cyan',
      steps: 11,
      hue: { start: 195, end: 195, curve: LINEAR },
      chroma: { start: 0.08, end: 0.20, curve: [0.2, 0.9, 0.8, 0.1] },
      lightness: { start: 0.95, end: 0.15, curve: EASE_OUT },
    },
    {
      id: 'magenta',
      name: 'magenta',
      steps: 11,
      hue: { start: 340, end: 340, curve: LINEAR },
      chroma: { start: 0.06, end: 0.15, curve: [0.25, 0.85, 0.75, 0.15] },
      lightness: { start: 0.93, end: 0.18, curve: EASE_OUT },
    },
    {
      id: 'neutral-cyber',
      name: 'neutral',
      steps: 11,
      hue: { start: 250, end: 250, curve: LINEAR },
      chroma: { start: 0.005, end: 0.005, curve: LINEAR },
      lightness: { start: 0.90, end: 0.03, curve: [0.5, 0, 1, 0.5] },
    },
  ],
};

const NEON_CYBER_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 14,
  ratio: 1.2,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['JetBrains Mono', 'Fira Code', 'monospace'],
    body: ['system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  lineHeightConfig: { base: 1.45, tightening: 0.12 },
};

const NEON_CYBER_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'geometric',
  ratio: 2,
  steps: 8,
};

const NEON_CYBER_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -1, z: 0.8 },
  elevationSteps: 4,
  baseBlur: 1,
  blurRatio: 1.5,
  baseOffset: 1,
  offsetRatio: 1.4,
  spreadBehavior: 'shrink',
  shadowColor: { colorSpace: 'oklch', channels: [0, 0, 250], alpha: 1 },
  ambientOpacity: 0.05,
  directionalOpacity: 0.20,
};

const NEON_CYBER_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.12, 0, 0, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.5, 0, 1, 1] },
    { id: 'snap', name: 'Snap', type: 'bezier', bezier: [0.05, 0, 0, 1] },
  ],
  baseDuration: 60,
  durationRatio: 1.3,
  durationSteps: 6,
};

const NEON_CYBER_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 12, margin: 12 },
    { name: 'md', minWidth: 768, columns: 6, gutter: 16, margin: 16 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 16, margin: 24 },
    { name: 'xl', minWidth: 1440, columns: 12, gutter: 20, margin: 32, maxWidth: 1600 },
  ],
};

const NEON_CYBER_PRESET: StylePreset = {
  id: 'preset-neon-cyber',
  siteComponent: 'neon-cyber',
  name: 'Neon Cyber',
  prompt: {
    overall: 'Bold and electric. Cyan and magenta accents on pure black. Monospace typography. For interfaces that demand attention.',
    characteristics: {
      typography: "JetBrains Mono for headings (monospace-first), system sans for body. 14px base, minor third ratio (1.2). Tight 1.45 line-height. Dense, terminal-inspired hierarchy.",
      colorPhilosophy: "Dual neon accents: cyan (hue 195) and magenta (hue 340). Near-black neutrals (lightness down to 0.03) with faint cool tint (hue 250). High chroma accents (up to 0.20) against zero-chroma darks.",
      darkMode: "Deep, near-black foundation. Extreme lightness compression in darks (custom curve). Neon accents pop against the void.",
      borders: "Minimal, dark. Cool-tinted from neutral palette. May glow with accent color for emphasis.",
      shadows: "Sharp, directional. Overhead light (y:-1). Shrinking spread for precise edges. Very low ambient (0.05), high directional (0.20). Cool-tinted shadows.",
      animations: "Ultra-snappy. bezier(0.12, 0, 0, 1) standard. 60ms base, 1.3x ratio. Dedicated snap curve bezier(0.05, 0, 0, 1) for instant interactions.",
      interactions: "Instant, precise. Snap easing for clicks. Hard entrance, hard exit. No softness, no bounce.",
      layout: "Compact, widescreen-optimized. 12-20px gutters. Max-width 1600px at xl. 6-column tablet grid. Dense, data-rich layouts.",
    },
  },
  generatorConfigs: {
    'color-lab': NEON_CYBER_COLORS,
    'typography-lab': NEON_CYBER_TYPOGRAPHY,
    'spacing-lab': NEON_CYBER_SPACING,
    'shadow-lab': NEON_CYBER_SHADOWS,
    'motion': NEON_CYBER_MOTION,
    'grid-builder': NEON_CYBER_GRID,
  },
  colors: ['#0a0a0f', '#3a3a48', '#00d4e8', '#e84090', '#f0f0f5'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 6. SOFT PASTEL
// Gentle and approachable. Low saturation pastels with high lightness.
// ============================================================================

const SOFT_PASTEL_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'rose',
      name: 'rose',
      steps: 11,
      hue: { start: 350, end: 350, curve: LINEAR },
      chroma: { start: 0.03, end: 0.08, curve: [0.3, 0.8, 0.7, 0.2] },
      lightness: { start: 0.97, end: 0.30, curve: EASE_OUT },
    },
    {
      id: 'mint',
      name: 'mint',
      steps: 11,
      hue: { start: 160, end: 160, curve: LINEAR },
      chroma: { start: 0.03, end: 0.07, curve: [0.3, 0.8, 0.7, 0.2] },
      lightness: { start: 0.97, end: 0.30, curve: EASE_OUT },
    },
    {
      id: 'lavender',
      name: 'lavender',
      steps: 11,
      hue: { start: 290, end: 290, curve: LINEAR },
      chroma: { start: 0.03, end: 0.07, curve: [0.3, 0.8, 0.7, 0.2] },
      lightness: { start: 0.97, end: 0.30, curve: EASE_OUT },
    },
    {
      id: 'neutral-pastel',
      name: 'neutral',
      steps: 11,
      hue: { start: 60, end: 60, curve: LINEAR },
      chroma: { start: 0.008, end: 0.008, curve: LINEAR },
      lightness: { start: 0.98, end: 0.12, curve: LINEAR },
    },
  ],
};

const SOFT_PASTEL_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 16,
  ratio: 1.25,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['DM Sans', 'system-ui', 'sans-serif'],
    body: ['DM Sans', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  lineHeightConfig: { base: 1.6, tightening: 0.08 },
};

const SOFT_PASTEL_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'arithmetic',
  steps: 12,
};

const SOFT_PASTEL_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.2, z: 1 },
  elevationSteps: 5,
  baseBlur: 6,
  blurRatio: 2.5,
  baseOffset: 0.5,
  offsetRatio: 1.4,
  spreadBehavior: 'none',
  shadowColor: { colorSpace: 'oklch', channels: [0.2, 0.01, 290], alpha: 1 },
  ambientOpacity: 0.06,
  directionalOpacity: 0.06,
};

const SOFT_PASTEL_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.25, 0.1, 0.25, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0.15, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.35, 0, 0.7, 1] },
    { id: 'bounce', name: 'Bounce', type: 'spring', spring: { stiffness: 200, damping: 18, mass: 1 } },
  ],
  baseDuration: 180,
  durationRatio: 1.5,
  durationSteps: 6,
};

const SOFT_PASTEL_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 16, margin: 20 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 24, margin: 28 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 28, margin: 36 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 32, margin: 44, maxWidth: 1200 },
  ],
};

const SOFT_PASTEL_PRESET: StylePreset = {
  id: 'preset-soft-pastel',
  siteComponent: 'soft-pastel',
  name: 'Soft Pastel',
  prompt: {
    overall: 'Gentle and approachable. Low saturation pastels with high lightness. Rounded, soft shadows. A calm, friendly aesthetic.',
    characteristics: {
      typography: "DM Sans for headings and body, JetBrains Mono for code. 16px base, major third ratio (1.25). Relaxed 1.6 line-height. Friendly, rounded letterforms.",
      colorPhilosophy: "Three soft accent palettes: rose (350), mint (160), lavender (290). All low chroma (0.03-0.08). Warm-tinted neutrals (hue 60, chroma 0.008). Pastel, high-lightness palette.",
      lightMode: "Warm, high-lightness foundation (0.98). Soft, warm neutral base. Feels like watercolor paper.",
      borders: "Very soft, warm-tinted. Low contrast. Blends into pastel surfaces rather than defining edges.",
      shadows: "Very diffuse, large blur (6px base, 2.5x ratio). Lavender-tinted shadow color (hue 290). Low opacity (0.06 both ambient and directional). Pillowy, cloud-like depth.",
      animations: "Gentle, unhurried. bezier(0.25, 0.1, 0.25, 1) standard. 180ms base, 1.5x ratio. Includes bounce spring (stiffness 200, damping 18) for playful moments.",
      interactions: "Soft entrance curves. Bouncy spring for buttons and toggles. Nothing harsh or abrupt.",
      layout: "Comfortable, spacious grid. 16-32px gutters. Max-width 1200px. Generous margins. Breathing room everywhere.",
    },
  },
  generatorConfigs: {
    'color-lab': SOFT_PASTEL_COLORS,
    'typography-lab': SOFT_PASTEL_TYPOGRAPHY,
    'spacing-lab': SOFT_PASTEL_SPACING,
    'shadow-lab': SOFT_PASTEL_SHADOWS,
    'motion': SOFT_PASTEL_MOTION,
    'grid-builder': SOFT_PASTEL_GRID,
  },
  colors: ['#f2d4d8', '#ddd0f0', '#c8ece0', '#faf7f2', '#e0ddd8'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 7. CORPORATE
// Professional and structured. Navy blue on pure grays.
// ============================================================================

const CORPORATE_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'navy',
      name: 'navy',
      steps: 11,
      hue: { start: 245, end: 245, curve: LINEAR },
      chroma: { start: 0.04, end: 0.12, curve: CHROMA_PEAK_MID },
      lightness: { start: 0.96, end: 0.15, curve: EASE_OUT },
    },
    {
      id: 'neutral-pure',
      name: 'neutral',
      steps: 11,
      hue: { start: 0, end: 0, curve: LINEAR },
      chroma: { start: 0.002, end: 0.002, curve: LINEAR },
      lightness: { start: 0.98, end: 0.10, curve: LINEAR },
    },
  ],
};

const CORPORATE_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 16,
  ratio: 1.25,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    mono: ['SF Mono', 'Consolas', 'Liberation Mono', 'monospace'],
  },
  lineHeightConfig: { base: 1.5, tightening: 0.1 },
};

const CORPORATE_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'arithmetic',
  steps: 10,
};

const CORPORATE_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.5, z: 1 },
  elevationSteps: 5,
  baseBlur: 2,
  blurRatio: 2,
  baseOffset: 1,
  offsetRatio: 1.5,
  spreadBehavior: 'none',
  shadowColor: { colorSpace: 'oklch', channels: [0, 0, 0], alpha: 1 },
  ambientOpacity: 0.08,
  directionalOpacity: 0.10,
};

const CORPORATE_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.2, 0, 0, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.3, 0, 1, 1] },
    { id: 'subtle', name: 'Subtle', type: 'bezier', bezier: [0.25, 0.1, 0.25, 1] },
  ],
  baseDuration: 100,
  durationRatio: 1.5,
  durationSteps: 6,
};

const CORPORATE_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 16, margin: 16 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 24, margin: 24 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 24, margin: 32 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 32, margin: 40, maxWidth: 1280 },
  ],
};

const CORPORATE_PRESET: StylePreset = {
  id: 'preset-corporate',
  siteComponent: 'corporate',
  name: 'Corporate',
  prompt: {
    overall: 'Professional and structured. Navy blue on pure grays. System fonts for cross-platform consistency. A reliable, no-nonsense design system.',
    characteristics: {
      typography: "System font stack for cross-platform consistency. SF Mono/Consolas for code. 16px base, major third ratio (1.25). Standard 1.5 line-height. Professional, reliable hierarchy.",
      colorPhilosophy: "Navy accent (hue 245) on pure achromatic grays (chroma 0.002, hue 0). Clean separation between brand color and neutral surface. No warm or cool tinting in neutrals.",
      borders: "Clean, neutral. Pure gray borders with no color tinting. Functional and professional.",
      shadows: "Standard centered overhead light. Moderate blur (2px base, 2x ratio). Pure black shadow color. Conservative opacity (0.08 ambient, 0.10 directional).",
      animations: "Professional, understated. bezier(0.2, 0, 0, 1) standard. 100ms base, 1.5x ratio. Includes subtle ease bezier(0.25, 0.1, 0.25, 1) for hover states.",
      interactions: "Restrained and predictable. No spring physics. Subtle easing for general interactions. Professional, not playful.",
      layout: "Standard corporate grid. 4/8/12 columns. 16-32px gutters. Max-width 1280px. Balanced margins. Familiar, predictable structure.",
    },
  },
  generatorConfigs: {
    'color-lab': CORPORATE_COLORS,
    'typography-lab': CORPORATE_TYPOGRAPHY,
    'spacing-lab': CORPORATE_SPACING,
    'shadow-lab': CORPORATE_SHADOWS,
    'motion': CORPORATE_MOTION,
    'grid-builder': CORPORATE_GRID,
  },
  colors: ['#1a2456', '#4a6aa8', '#8ab0e0', '#808080', '#ffffff'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 8. EDITORIAL
// High contrast and typographic. Black and white with minimal accent color.
// ============================================================================

const EDITORIAL_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'accent-warm',
      name: 'accent',
      steps: 11,
      hue: { start: 20, end: 20, curve: LINEAR },
      chroma: { start: 0.05, end: 0.10, curve: [0.3, 0.85, 0.7, 0.15] },
      lightness: { start: 0.96, end: 0.22, curve: EASE_OUT },
    },
    {
      id: 'neutral-editorial',
      name: 'neutral',
      steps: 11,
      hue: { start: 0, end: 0, curve: LINEAR },
      chroma: { start: 0.002, end: 0.002, curve: LINEAR },
      lightness: { start: 0.99, end: 0.05, curve: LINEAR },
    },
  ],
};

const EDITORIAL_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 18,
  ratio: 1.333,
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['Playfair Display', 'Georgia', 'serif'],
    body: ['Source Serif Pro', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  lineHeightConfig: { base: 1.7, tightening: 0.1 },
};

const EDITORIAL_SPACING: SpacingLabConfig = {
  baseUnit: 5,
  progression: 'arithmetic',
  steps: 12,
};

const EDITORIAL_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.3, z: 1 },
  elevationSteps: 3,
  baseBlur: 2,
  blurRatio: 2,
  baseOffset: 1,
  offsetRatio: 1.5,
  spreadBehavior: 'none',
  shadowColor: { colorSpace: 'oklch', channels: [0, 0, 0], alpha: 1 },
  ambientOpacity: 0.04,
  directionalOpacity: 0.06,
};

const EDITORIAL_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.3, 0, 0.15, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0.15, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.4, 0, 0.85, 1] },
    { id: 'deliberate', name: 'Deliberate', type: 'bezier', bezier: [0.4, 0, 0.2, 1] },
  ],
  baseDuration: 200,
  durationRatio: 1.8,
  durationSteps: 5,
};

const EDITORIAL_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 20, margin: 24 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 28, margin: 32 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 32, margin: 48 },
    { name: 'xl', minWidth: 1280, columns: 12, gutter: 40, margin: 64, maxWidth: 1120 },
  ],
};

const EDITORIAL_PRESET: StylePreset = {
  id: 'preset-editorial',
  siteComponent: 'editorial',
  name: 'Editorial',
  prompt: {
    overall: 'High contrast and typographic. Black and white with minimal accent color. Serif type scale with generous reading rhythm. For content that speaks.',
    characteristics: {
      typography: "Playfair Display for headings, Source Serif Pro for body, JetBrains Mono for code. 18px base, perfect fourth ratio (1.333). Generous 1.7 line-height. Strong typographic hierarchy for long-form reading.",
      colorPhilosophy: "Minimal accent: warm hue 20 (burnt orange). Near-pure achromatic neutrals (chroma 0.002). Extreme lightness range (0.99 to 0.05). Maximum contrast between surface and text.",
      borders: "Minimal, near-invisible. Pure achromatic. Used sparingly to avoid competing with typography.",
      shadows: "Very subtle. 3 elevation steps only. Small blur (2px base). Pure black shadow color. Very low opacity (0.04 ambient, 0.06 directional). Typography is the primary depth cue, not shadows.",
      animations: "Deliberate and slow. bezier(0.3, 0, 0.15, 1) standard. 200ms base, 1.8x ratio. Only 5 duration steps. Includes deliberate curve for intentional, weighted transitions.",
      interactions: "Slow, purposeful. Deliberate easing suggests editorial weight. Transitions are measured and confident.",
      layout: "Wide margins for reading comfort. 20-40px gutters. Max-width 1120px (narrow for optimal line length). Up to 64px margins at xl. Content-first, generous whitespace.",
    },
  },
  generatorConfigs: {
    'color-lab': EDITORIAL_COLORS,
    'typography-lab': EDITORIAL_TYPOGRAPHY,
    'spacing-lab': EDITORIAL_SPACING,
    'shadow-lab': EDITORIAL_SHADOWS,
    'motion': EDITORIAL_MOTION,
    'grid-builder': EDITORIAL_GRID,
  },
  colors: ['#0a0a0a', '#404040', '#c87040', '#d4d4d4', '#ffffff'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// 9. FINTECH PREMIUM
// Premium, muted, editorial-quality. Linear / Mercury vibes.
// Near-black with subtle blue tint, single muted accent, dense and precise.
// ============================================================================

const FINTECH_COLORS: ColorLabConfig = {
  palettes: [
    {
      id: 'accent',
      name: 'accent',
      steps: 11,
      // Muted blue-violet — not electric, more like a quiet signal
      hue: { start: 250, end: 245, curve: LINEAR },
      chroma: { start: 0.03, end: 0.10, curve: [0.2, 0.7, 0.8, 0.3] },
      lightness: { start: 0.95, end: 0.25, curve: [0, 0, 0.5, 1] },
    },
    {
      id: 'neutral',
      name: 'neutral',
      steps: 11,
      // Blue-tinted neutrals — not pure gray, slightly cool
      hue: { start: 240, end: 240, curve: LINEAR },
      chroma: { start: 0.008, end: 0.012, curve: LINEAR },
      lightness: { start: 0.96, end: 0.06, curve: [0.1, 0, 0.9, 1] },
    },
  ],
};

const FINTECH_TYPOGRAPHY: TypographyLabConfig = {
  baseFontSize: 14,
  ratio: 1.2, // Minor third — tight, dense hierarchy
  stepsAbove: 6,
  stepsBelow: 2,
  fontFamilies: {
    heading: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
    body: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
    mono: ['Berkeley Mono', 'JetBrains Mono', 'SF Mono', 'monospace'],
  },
  lineHeightConfig: { base: 1.4, tightening: 0.12 },
};

const FINTECH_SPACING: SpacingLabConfig = {
  baseUnit: 4,
  progression: 'geometric',
  ratio: 1.5,
  steps: 10,
};

const FINTECH_SHADOWS: ShadowLabConfig = {
  lightSource: { x: 0, y: -0.3, z: 1.2 },
  elevationSteps: 4,
  baseBlur: 1.5,
  blurRatio: 2,
  baseOffset: 0.5,
  offsetRatio: 1.5,
  spreadBehavior: 'shrink',
  // Tinted shadow — picks up the blue from the neutrals
  shadowColor: { colorSpace: 'oklch', channels: [0.05, 0.01, 240], alpha: 1 },
  ambientOpacity: 0.03,
  directionalOpacity: 0.08,
};

const FINTECH_MOTION: MotionConfig = {
  easingCurves: [
    { id: 'standard', name: 'Standard', type: 'bezier', bezier: [0.12, 0, 0, 1] },
    { id: 'entrance', name: 'Entrance', type: 'bezier', bezier: [0, 0, 0, 1] },
    { id: 'exit', name: 'Exit', type: 'bezier', bezier: [0.5, 0, 1, 1] },
    { id: 'micro', name: 'Micro', type: 'bezier', bezier: [0.08, 0, 0, 1] },
  ],
  baseDuration: 70,
  durationRatio: 1.3,
  durationSteps: 6,
};

const FINTECH_GRID: GridBuilderConfig = {
  breakpoints: [
    { name: 'sm', minWidth: 640, columns: 4, gutter: 12, margin: 16 },
    { name: 'md', minWidth: 768, columns: 8, gutter: 16, margin: 20 },
    { name: 'lg', minWidth: 1024, columns: 12, gutter: 20, margin: 24 },
    { name: 'xl', minWidth: 1440, columns: 12, gutter: 24, margin: 32, maxWidth: 1440 },
  ],
};

const FINTECH_PRESET: StylePreset = {
  id: 'preset-fintech-premium',
  name: 'Fintech Premium',
  prompt: {
    overall: 'Premium, muted, editorial-quality. Near-black with subtle blue tint, single quiet accent, dense typography, razor-sharp transitions. Linear and Mercury vibes — not Bootstrap.',
    characteristics: {
      typography: "Inter as the primary face, Berkeley Mono/SF Mono for numeric data. Clean, tight tracking. 14px base, minor third ratio (1.2). Dense, information-rich hierarchy.",
      colorPhilosophy: "Entirely monochromatic by default. No saturated brand colors. Blue-tinted grays, near-whites, and soft blacks. The accent is a muted blue-violet — a quiet signal, not a shout.",
      toneSystem: "Blue-tinted neutral palette (hue 240). Subtle chroma (0.008-0.012) gives coolness without appearing colored. Accent palette slightly warmer violet (hue 245-250).",
      darkMode: "Not just inverted colors. Noise texture overlay for tactile grain. Radial glow bleeding from top-center. Card surfaces with gradient backgrounds and inset shadows. Input fields recessed via inward shadows.",
      lightMode: "Clean, airy, near-white surfaces. Minimal shadows. Feels like paper.",
      borders: "Subtle, 1px, tone-aware. Never harsh. Blue-tinted to match the neutral palette.",
      shadows: "Layered, diffuse, very soft. Blue-tinted shadow color. Shrinking spread. Low opacity (0.03 ambient, 0.08 directional). Multiple shadow layers for depth.",
      animations: "Purposeful, subtle. cubic-bezier(0.12, 0, 0, 1) easing. 70ms base duration. Micro interactions are near-instant.",
      interactions: "Cards lift 1px on hover. Focus rings use accent color with offset. Transitions are crisp and intentional.",
      layout: "Sticky sidebar navigation. Max-width 1440px. Tight gutters (12-24px). Dense but breathable. Dashboard-density, not magazine-airy.",
    },
  },
  siteComponent: 'fintech-premium',
  generatorConfigs: {
    'color-lab': FINTECH_COLORS,
    'typography-lab': FINTECH_TYPOGRAPHY,
    'spacing-lab': FINTECH_SPACING,
    'shadow-lab': FINTECH_SHADOWS,
    'motion': FINTECH_MOTION,
    'grid-builder': FINTECH_GRID,
  },
  colors: ['#0e0f14', '#1e2028', '#6e6e8a', '#8b8aba', '#eeeef2'],
  builtIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
};

// ============================================================================
// EXPORT
// ============================================================================

export const BUILT_IN_PRESETS: StylePreset[] = [
  DEFAULT_PRESET,
  FINTECH_PRESET,
  LINEAR_PRESET,
  STRIPE_PRESET,
  WARM_EARTH_PRESET,
  NEON_CYBER_PRESET,
  SOFT_PASTEL_PRESET,
  CORPORATE_PRESET,
  EDITORIAL_PRESET,
];
