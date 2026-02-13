// Typography calculation utilities

/**
 * Calculate optimal line height for a given font size.
 * Larger text needs less line height (tighter leading).
 *
 * Formula: lineHeight = base - (tightening * log2(fontSize / baseFontSize))
 * Ensures large headings get tighter spacing while body text stays comfortable.
 */
export function calculateLineHeight(
  fontSize: number,
  baseFontSize: number,
  baseLineHeight: number,
  tightening: number,
): number {
  if (fontSize <= baseFontSize) return baseLineHeight;
  const ratio = fontSize / baseFontSize;
  const reduction = tightening * Math.log2(ratio);
  return Math.max(1.1, Math.round((baseLineHeight - reduction) * 1000) / 1000);
}

/**
 * Calculate letter spacing adjustments.
 * Larger text typically needs negative letter spacing (tighter tracking).
 */
export function calculateLetterSpacing(
  fontSize: number,
  baseFontSize: number,
): number {
  if (fontSize <= baseFontSize) return 0;
  const ratio = fontSize / baseFontSize;
  return Math.round(-0.02 * Math.log2(ratio) * 1000) / 1000;
}

/**
 * Generate typography tokens for a type scale.
 */
export function generateTypographyTokens(config: {
  baseFontSize: number;
  ratio: number;
  stepsAbove: number;
  stepsBelow: number;
  baseLineHeight: number;
  tightening: number;
}): Array<{
  name: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  step: number;
}> {
  const tokens: Array<{
    name: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    step: number;
  }> = [];

  for (let i = -config.stepsBelow; i <= config.stepsAbove; i++) {
    const fontSize = Math.round(config.baseFontSize * Math.pow(config.ratio, i) * 100) / 100;
    const lineHeight = calculateLineHeight(
      fontSize,
      config.baseFontSize,
      config.baseLineHeight,
      config.tightening,
    );
    const letterSpacing = calculateLetterSpacing(fontSize, config.baseFontSize);

    let name: string;
    if (i < 0) name = `xs${Math.abs(i) > 1 ? Math.abs(i) : ''}`;
    else if (i === 0) name = 'base';
    else name = `${i === 1 ? 'lg' : i === 2 ? 'xl' : `${i - 1}xl`}`;

    tokens.push({ name, fontSize, lineHeight, letterSpacing, step: i });
  }

  return tokens;
}

// Common font stack presets
export const FONT_STACKS = {
  system: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
  mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
  serif: ['Georgia', '"Times New Roman"', 'Times', 'serif'],
};
