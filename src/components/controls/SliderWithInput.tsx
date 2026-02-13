import { useCallback } from 'react';

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

export function SliderWithInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  description,
}: SliderWithInputProps) {
  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) {
        onChange(Math.max(min, Math.min(max, v)));
      }
    },
    [onChange, min, max],
  );

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={handleInput}
            min={min}
            max={max}
            step={step}
            className="w-16 bg-surface-3 border border-border-subtle rounded px-1.5 py-0.5 text-xs text-text-primary text-right outline-none focus:ring-1 focus:ring-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit && <span className="text-xs text-text-tertiary">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        onChange={handleSlider}
        min={min}
        max={max}
        step={step}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-surface-3) ${percentage}%, var(--color-surface-3) 100%)`,
        }}
      />
      {description && (
        <p className="text-[10px] text-text-tertiary">{description}</p>
      )}
    </div>
  );
}
