import type { ColorValue } from '@/core/tokens/types';
import { toHex, toRgb, toCssString } from '@/core/engine/color/oklch';

export type ColorFormat = 'oklch' | 'hex' | 'rgb' | 'hsl';

export function transformColor(color: ColorValue, format: ColorFormat): string {
  switch (format) {
    case 'oklch':
      return toCssString(color);
    case 'hex': {
      // hex6 cannot represent alpha — fall back to rgba for semi-transparent colors
      if (color.alpha !== undefined && color.alpha < 1) {
        const { r, g, b, a } = toRgb(color);
        return `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(4))})`;
      }
      return toHex(color);
    }
    case 'rgb': {
      const { r, g, b, a } = toRgb(color);
      return a < 1
        ? `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(4))})`
        : `rgb(${r}, ${g}, ${b})`;
    }
    case 'hsl': {
      const { r, g, b } = toRgb(color);
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        else if (max === gn) h = ((bn - rn) / d + 2) / 6;
        else h = ((rn - gn) / d + 4) / 6;
      }
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
  }
}

export function isColorValue(value: unknown): value is ColorValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'colorSpace' in value &&
    (value as ColorValue).colorSpace === 'oklch' &&
    'channels' in value
  );
}
