import type { ColorValue } from '@/core/tokens/types';
import { toHex, toCssString, isInGamut } from '@/core/engine/color/oklch';
import { useState } from 'react';

interface ColorSwatchProps {
  color: ColorValue;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
  onClick?: () => void;
}

export function ColorSwatch({ color, label, size = 'md', showInfo = false, onClick }: ColorSwatchProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hex = toHex(color);
  const inGamut = isInGamut(color);

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className="flex flex-col items-center gap-1 relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        className={`${sizes[size]} rounded-md border border-border-subtle ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-accent/50' : 'cursor-default'} transition-all`}
        style={{ backgroundColor: hex }}
        title={hex}
      >
        {!inGamut && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-warning" title="Out of sRGB gamut" />
          </div>
        )}
      </button>
      {label && (
        <span className="text-[10px] text-text-tertiary text-center leading-tight">{label}</span>
      )}
      {showInfo && showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-0 border border-border rounded-md px-2 py-1.5 shadow-lg z-50 whitespace-nowrap">
          <div className="text-[10px] font-mono space-y-0.5">
            <div className="text-text-primary">{hex}</div>
            <div className="text-text-tertiary">{toCssString(color)}</div>
            <div className="text-text-tertiary">
              L: {color.channels[0].toFixed(3)} C: {color.channels[1].toFixed(3)} H: {color.channels[2].toFixed(1)}
            </div>
            {!inGamut && <div className="text-warning">Out of sRGB gamut</div>}
          </div>
        </div>
      )}
    </div>
  );
}

interface PaletteRowProps {
  colors: ColorValue[];
  labels?: string[];
  size?: 'sm' | 'md' | 'lg';
}

export function PaletteRow({ colors, labels, size = 'md' }: PaletteRowProps) {
  return (
    <div className="flex gap-1">
      {colors.map((color, i) => (
        <ColorSwatch
          key={i}
          color={color}
          label={labels?.[i]}
          size={size}
          showInfo
        />
      ))}
    </div>
  );
}
