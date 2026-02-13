import { useCallback, useRef, useState } from 'react';
import type { BezierControlPoints } from '@/core/tokens/types';
import { sampleBezierCurve, BEZIER_PRESETS } from '@/core/engine/math/bezier';

interface BezierCurveEditorProps {
  value: BezierControlPoints;
  onChange: (value: BezierControlPoints) => void;
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  showPresets?: boolean;
}

const PAD = 24;

export function BezierCurveEditor({
  value,
  onChange,
  width = 240,
  height = 240,
  xLabel,
  yLabel,
  showPresets = true,
}: BezierCurveEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<1 | 2 | null>(null);

  const [x1, y1, x2, y2] = value;

  // Chart area within padding
  const cx = (v: number) => PAD + v * (width - PAD * 2);
  const cy = (v: number) => PAD + (1 - v) * (height - PAD * 2);

  const fromSVG = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current;
      if (!svg) return [0, 0];
      const rect = svg.getBoundingClientRect();
      const x = (clientX - rect.left - PAD) / (width - PAD * 2);
      const y = 1 - (clientY - rect.top - PAD) / (height - PAD * 2);
      return [Math.max(0, Math.min(1, x)), Math.max(-0.5, Math.min(1.5, y))];
    },
    [width, height],
  );

  const handlePointerDown = useCallback(
    (point: 1 | 2) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      setDragging(point);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const [px, py] = fromSVG(e.clientX, e.clientY);
      const next: BezierControlPoints = [...value];
      if (dragging === 1) {
        next[0] = px;
        next[1] = py;
      } else {
        next[2] = px;
        next[3] = py;
      }
      onChange(next);
    },
    [dragging, value, onChange, fromSVG],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Generate curve path
  const samples = sampleBezierCurve(value, 64);
  const pathD = samples
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(p.x)} ${cy(p.y)}`)
    .join(' ');

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-surface-2 rounded-lg border border-border-subtle select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Grid */}
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={cx(v)} y1={cy(0)} x2={cx(v)} y2={cy(1)} stroke="var(--color-border-subtle)" strokeWidth={0.5} />
            <line x1={cx(0)} y1={cy(v)} x2={cx(1)} y2={cy(v)} stroke="var(--color-border-subtle)" strokeWidth={0.5} />
          </g>
        ))}

        {/* Axis border */}
        <rect x={cx(0)} y={cy(1)} width={cx(1) - cx(0)} height={cy(0) - cy(1)} fill="none" stroke="var(--color-border)" strokeWidth={0.5} />

        {/* Diagonal reference */}
        <line x1={cx(0)} y1={cy(0)} x2={cx(1)} y2={cy(1)} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="3 3" />

        {/* Curve */}
        <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth={2} />

        {/* Control point lines */}
        <line x1={cx(0)} y1={cy(0)} x2={cx(x1)} y2={cy(y1)} stroke="var(--color-accent)" strokeWidth={1} strokeOpacity={0.5} />
        <line x1={cx(1)} y1={cy(1)} x2={cx(x2)} y2={cy(y2)} stroke="var(--color-accent)" strokeWidth={1} strokeOpacity={0.5} />

        {/* Control points */}
        <circle
          cx={cx(x1)}
          cy={cy(y1)}
          r={6}
          fill={dragging === 1 ? 'var(--color-accent)' : 'var(--color-surface-0)'}
          stroke="var(--color-accent)"
          strokeWidth={2}
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown(1)}
        />
        <circle
          cx={cx(x2)}
          cy={cy(y2)}
          r={6}
          fill={dragging === 2 ? 'var(--color-accent)' : 'var(--color-surface-0)'}
          stroke="var(--color-accent)"
          strokeWidth={2}
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown(2)}
        />

        {/* Endpoints */}
        <circle cx={cx(0)} cy={cy(0)} r={3} fill="var(--color-text-tertiary)" />
        <circle cx={cx(1)} cy={cy(1)} r={3} fill="var(--color-text-tertiary)" />

        {/* Labels */}
        {xLabel && (
          <text x={cx(0.5)} y={height - 4} textAnchor="middle" className="fill-text-tertiary text-[9px]">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text x={6} y={cy(0.5)} textAnchor="middle" className="fill-text-tertiary text-[9px]" transform={`rotate(-90, 6, ${cy(0.5)})`}>
            {yLabel}
          </text>
        )}
      </svg>

      {/* Values display */}
      <div className="flex items-center gap-2 text-[10px] text-text-tertiary font-mono">
        <span>({value.map((v) => v.toFixed(2)).join(', ')})</span>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(BEZIER_PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => onChange(preset)}
              className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                value.every((v, i) => Math.abs(v - preset[i]) < 0.01)
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
