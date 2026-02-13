// Design Token types aligned with W3C DTCG 2025.10 specification
// https://www.designtokens.org/tr/drafts/format/

// ---- Token Type Discriminators ----

export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'shadow'
  | 'border'
  | 'transition'
  | 'gradient'
  | 'strokeStyle'
  | 'typography'
  | 'spacing'
  | 'opacity'
  | 'lineHeight'
  | 'letterSpacing'
  | 'breakpoint'
  | 'grid';

export type TokenTier = 'primitive' | 'semantic' | 'component';

// ---- Value Types ----

export interface ColorValue {
  colorSpace: 'oklch';
  channels: [number, number, number]; // L (0-1), C (0-0.4), H (0-360)
  alpha: number; // 0-1
}

export interface DimensionValue {
  value: number;
  unit: 'px' | 'rem';
}

export interface DurationValue {
  value: number;
  unit: 'ms' | 's';
}

export type CubicBezierValue = [number, number, number, number]; // [P1x, P1y, P2x, P2y]

export interface ShadowLayer {
  color: ColorValue | string; // string = alias reference
  offsetX: DimensionValue;
  offsetY: DimensionValue;
  blur: DimensionValue;
  spread: DimensionValue;
  inset?: boolean;
}

export type ShadowValue = ShadowLayer[];

export interface TypographyValue {
  fontFamily: string | string[];
  fontSize: DimensionValue;
  fontWeight: number;
  lineHeight: number; // unitless ratio
  letterSpacing: DimensionValue;
}

export interface GradientStop {
  color: ColorValue | string;
  position: number; // 0-1
}

export interface GradientValue {
  type: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}

export interface BorderValue {
  color: ColorValue | string;
  width: DimensionValue;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
}

export interface TransitionValue {
  duration: DurationValue;
  timingFunction: CubicBezierValue;
  delay?: DurationValue;
  property?: string;
}

export interface GridValue {
  columns: number;
  gutter: DimensionValue;
  margin: DimensionValue;
  maxWidth?: DimensionValue;
}

export interface BreakpointValue {
  minWidth: DimensionValue;
  label: string;
}

export type TokenValue =
  | ColorValue
  | DimensionValue
  | DurationValue
  | CubicBezierValue
  | ShadowValue
  | TypographyValue
  | GradientValue
  | BorderValue
  | TransitionValue
  | GridValue
  | BreakpointValue
  | string   // fontFamily
  | string[] // fontFamily array
  | number;  // fontWeight, opacity, lineHeight, letterSpacing, number

// ---- Token Extensions ----

export interface GeneratorExtension {
  toolId: string;
  generatedAt: string; // ISO timestamp
  configHash: string;
}

export interface TokenExtensions {
  'com.dsw.generator'?: GeneratorExtension;
  'com.dsw.tier'?: TokenTier;
  'com.dsw.tags'?: string[];
  [key: string]: unknown;
}

// ---- Design Token ----

export interface DesignToken {
  $value: TokenValue;
  $type: TokenType;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: TokenExtensions;
}

export interface AliasToken {
  $value: string; // e.g., "{color.blue.500}"
  $type: TokenType;
  $description?: string;
  $extensions?: TokenExtensions;
}

export type Token = DesignToken | AliasToken;

export function isAlias(token: Token): token is AliasToken {
  return typeof token.$value === 'string' && token.$value.startsWith('{') && token.$value.endsWith('}');
}

// ---- Token Groups & Tree ----

export interface TokenGroupMeta {
  $type?: TokenType;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

export type TokenGroupEntry = Token | TokenGroup;

export interface TokenGroup extends TokenGroupMeta {
  [key: string]: TokenGroupEntry | TokenType | string | Record<string, unknown> | undefined;
}

export interface TokenTree {
  color?: TokenGroup;
  typography?: TokenGroup;
  spacing?: TokenGroup;
  shadow?: TokenGroup;
  motion?: TokenGroup;
  grid?: TokenGroup;
  breakpoint?: TokenGroup;
  dataViz?: TokenGroup;
  [key: string]: TokenGroup | undefined;
}

// ---- Generator Configs ----

export type BezierControlPoints = [number, number, number, number];

export interface PaletteConfig {
  id: string;
  name: string;
  steps: number;
  hue: { start: number; end: number; curve: BezierControlPoints };
  chroma: { start: number; end: number; curve: BezierControlPoints };
  lightness: { start: number; end: number; curve: BezierControlPoints };
  lockPoints?: Array<{ step: number; color: ColorValue }>;
}

export interface ColorLabConfig {
  palettes: PaletteConfig[];
}

export interface TypographyLabConfig {
  baseFontSize: number;
  ratio: number;
  stepsAbove: number;
  stepsBelow: number;
  fontFamilies: {
    heading: string[];
    body: string[];
    mono: string[];
  };
  lineHeightConfig: {
    base: number;
    tightening: number;
  };
}

export interface SpacingLabConfig {
  baseUnit: number;
  progression: 'geometric' | 'arithmetic' | 'fibonacci' | 'custom';
  ratio?: number;
  steps: number;
  customValues?: number[];
}

export interface ShadowLabConfig {
  lightSource: { x: number; y: number; z: number };
  elevationSteps: number;
  baseBlur: number;
  blurRatio: number;
  baseOffset: number;
  offsetRatio: number;
  spreadBehavior: 'none' | 'shrink' | 'grow';
  shadowColor: ColorValue;
  ambientOpacity: number;
  directionalOpacity: number;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface EasingCurveConfig {
  id: string;
  name: string;
  type: 'bezier' | 'spring';
  bezier?: CubicBezierValue;
  spring?: SpringConfig;
}

export interface MotionConfig {
  easingCurves: EasingCurveConfig[];
  baseDuration: number;
  durationRatio: number;
  durationSteps: number;
}

export interface GridBuilderConfig {
  breakpoints: Array<{
    name: string;
    minWidth: number;
    columns: number;
    gutter: number;
    margin: number;
    maxWidth?: number;
  }>;
}

export interface GeneratorConfigMap {
  'color-lab'?: ColorLabConfig;
  'typography-lab'?: TypographyLabConfig;
  'spacing-lab'?: SpacingLabConfig;
  'shadow-lab'?: ShadowLabConfig;
  'motion'?: MotionConfig;
  'grid-builder'?: GridBuilderConfig;
  [toolId: string]: unknown;
}

// ---- Serialized Project ----

export interface SerializedProject {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  tokens: TokenTree;
  generatorConfigs: GeneratorConfigMap;
}
