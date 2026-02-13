import { useState, useMemo, useCallback, useRef } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import { toHex } from '@/core/engine/color/oklch';
import type { ColorValue, TokenGroup } from '@/core/tokens/types';

interface ChartElement {
  id: string;
  label: string;
  category: 'structure' | 'labels' | 'decoration';
  description: string;
  inkCost: number; // relative ink weight 0-1
}

const CHART_ELEMENTS: ChartElement[] = [
  { id: 'major-gridlines', label: 'Major Gridlines', category: 'structure', description: 'Horizontal reference lines at major tick intervals', inkCost: 0.12 },
  { id: 'minor-gridlines', label: 'Minor Gridlines', category: 'structure', description: 'Finer gridlines between major intervals', inkCost: 0.08 },
  { id: 'axis-lines', label: 'Axis Lines', category: 'structure', description: 'X and Y axis border lines', inkCost: 0.06 },
  { id: 'tick-marks', label: 'Tick Marks', category: 'structure', description: 'Small marks along axes at data intervals', inkCost: 0.04 },
  { id: 'axis-labels', label: 'Axis Labels', category: 'labels', description: 'Text labels along X and Y axes', inkCost: 0.05 },
  { id: 'data-labels', label: 'Data Labels', category: 'labels', description: 'Value labels directly on data points/bars', inkCost: 0.07 },
  { id: 'chart-border', label: 'Chart Border', category: 'decoration', description: 'Outer border around the chart area', inkCost: 0.06 },
  { id: 'background-fill', label: 'Background Fill', category: 'decoration', description: 'Colored or shaded chart background', inkCost: 0.10 },
  { id: 'legend-border', label: 'Legend Border', category: 'decoration', description: 'Border around the legend area', inkCost: 0.04 },
];

const DATA_INK_WEIGHT = 0.38; // data bars always present

const SAMPLE_DATA = [
  { label: 'Q1', value: 65 },
  { label: 'Q2', value: 82 },
  { label: 'Q3', value: 48 },
  { label: 'Q4', value: 91 },
  { label: 'Q5', value: 73 },
];

const GUIDELINES = [
  {
    title: 'Maximize Data-Ink Ratio',
    description: 'Remove any visual element that does not directly convey data. If removing it changes nothing about the data story, it should go.',
  },
  {
    title: 'Gridlines: Use Sparingly',
    description: 'Major gridlines can aid reading precise values. Minor gridlines rarely add value and usually add clutter. Consider removing gridlines entirely when data labels are present.',
  },
  {
    title: 'Axis Lines vs. Gridlines',
    description: 'If gridlines are shown, the axis line at the base is redundant. Choose one. Similarly, tick marks duplicate what gridlines already communicate.',
  },
  {
    title: 'Data Labels vs. Axes',
    description: 'Direct data labels reduce the need for axis labels and gridlines. They let readers decode values without visual tracing.',
  },
  {
    title: 'Borders Add No Data',
    description: 'Chart borders and legend borders are decorative. The data and whitespace already define boundaries.',
  },
  {
    title: 'Background Fills',
    description: 'Colored backgrounds reduce contrast. A plain background (transparent or white) maximizes legibility.',
  },
];

function getColorTokenHexes(colorGroup: TokenGroup | undefined): string[] {
  if (!colorGroup) return [];
  const tokens = flattenTokenGroup(colorGroup);
  const hexes: string[] = [];
  for (const { token } of tokens) {
    const val = token.$value;
    if (val && typeof val === 'object' && 'colorSpace' in val && val.colorSpace === 'oklch') {
      hexes.push(toHex(val as ColorValue));
    }
    if (hexes.length >= 5) break;
  }
  return hexes;
}

const DEFAULT_COLORS = ['#4f87e0', '#34b87a', '#e8a838', '#e05a5a', '#8b5cf6'];

function SampleBarChart({
  elements,
  colors,
  width,
  height,
}: {
  elements: Record<string, boolean>;
  colors: string[];
  width: number;
  height: number;
}) {
  const padding = { top: 20, right: 20, bottom: elements['axis-labels'] ? 32 : 12, left: elements['axis-labels'] ? 36 : 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...SAMPLE_DATA.map((d) => d.value));
  const barGap = 6;
  const barWidth = (chartW - barGap * (SAMPLE_DATA.length - 1)) / SAMPLE_DATA.length;

  const majorTicks = [0, 25, 50, 75, 100];
  const minorTicks = [12.5, 37.5, 62.5, 87.5];

  return (
    <svg width={width} height={height} className="block">
      {/* Background fill */}
      {elements['background-fill'] && (
        <rect
          x={padding.left}
          y={padding.top}
          width={chartW}
          height={chartH}
          fill="var(--color-surface-2)"
        />
      )}

      {/* Chart border */}
      {elements['chart-border'] && (
        <rect
          x={padding.left}
          y={padding.top}
          width={chartW}
          height={chartH}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={1}
        />
      )}

      {/* Minor gridlines */}
      {elements['minor-gridlines'] &&
        minorTicks.map((tick) => {
          const y = padding.top + chartH - (tick / 100) * chartH;
          return (
            <line
              key={`minor-${tick}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
              stroke="var(--color-border-subtle)"
              strokeWidth={0.5}
              strokeDasharray="2,3"
            />
          );
        })}

      {/* Major gridlines */}
      {elements['major-gridlines'] &&
        majorTicks.map((tick) => {
          const y = padding.top + chartH - (tick / 100) * chartH;
          return (
            <line
              key={`major-${tick}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
              stroke="var(--color-border-subtle)"
              strokeWidth={0.75}
            />
          );
        })}

      {/* Axis lines */}
      {elements['axis-lines'] && (
        <>
          {/* Y axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartH}
            stroke="var(--color-text-tertiary)"
            strokeWidth={1}
          />
          {/* X axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="var(--color-text-tertiary)"
            strokeWidth={1}
          />
        </>
      )}

      {/* Tick marks */}
      {elements['tick-marks'] &&
        majorTicks.map((tick) => {
          const y = padding.top + chartH - (tick / 100) * chartH;
          return (
            <line
              key={`tick-${tick}`}
              x1={padding.left - 4}
              y1={y}
              x2={padding.left}
              y2={y}
              stroke="var(--color-text-tertiary)"
              strokeWidth={1}
            />
          );
        })}

      {/* Y-axis labels */}
      {elements['axis-labels'] &&
        majorTicks.map((tick) => {
          const y = padding.top + chartH - (tick / 100) * chartH;
          return (
            <text
              key={`ylabel-${tick}`}
              x={padding.left - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-text-tertiary"
              fontSize={9}
            >
              {tick}
            </text>
          );
        })}

      {/* Data bars */}
      {SAMPLE_DATA.map((d, i) => {
        const x = padding.left + i * (barWidth + barGap);
        const barH = (d.value / maxVal) * chartH;
        const y = padding.top + chartH - barH;
        const color = colors[i % colors.length];
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={color}
              rx={2}
            />
            {/* X-axis labels */}
            {elements['axis-labels'] && (
              <text
                x={x + barWidth / 2}
                y={padding.top + chartH + 14}
                textAnchor="middle"
                className="fill-text-tertiary"
                fontSize={9}
              >
                {d.label}
              </text>
            )}
            {/* Data labels */}
            {elements['data-labels'] && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-text-secondary"
                fontSize={9}
                fontWeight={600}
              >
                {d.value}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${padding.left + chartW - 70}, ${padding.top + 4})`}>
        {elements['legend-border'] && (
          <rect
            x={-4}
            y={-4}
            width={74}
            height={24}
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth={0.75}
            rx={3}
          />
        )}
        <rect x={0} y={0} width={10} height={10} fill={colors[0]} rx={1} />
        <text x={14} y={9} className="fill-text-secondary" fontSize={9}>Revenue</text>
      </g>
    </svg>
  );
}

export default function DataInkOptimizerTool() {
  const colorGroup = useTokenStore((s) => s.tokens.color);

  const storeColors = useRef(getColorTokenHexes(colorGroup));
  const chartColors = storeColors.current.length >= 5 ? storeColors.current : DEFAULT_COLORS;

  const [elements, setElements] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    for (const el of CHART_ELEMENTS) defaults[el.id] = true;
    return defaults;
  });

  const toggleElement = useCallback((id: string) => {
    setElements((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setAll = useCallback((value: boolean) => {
    setElements(() => {
      const next: Record<string, boolean> = {};
      for (const el of CHART_ELEMENTS) next[el.id] = value;
      return next;
    });
  }, []);

  const dataInkRatio = useMemo(() => {
    const totalNonDataInk = CHART_ELEMENTS.reduce(
      (sum, el) => sum + (elements[el.id] ? el.inkCost : 0),
      0,
    );
    const totalInk = DATA_INK_WEIGHT + totalNonDataInk;
    return Math.round((DATA_INK_WEIGHT / totalInk) * 100);
  }, [elements]);

  const enabledCount = useMemo(
    () => CHART_ELEMENTS.filter((el) => elements[el.id]).length,
    [elements],
  );

  const allElements: Record<string, boolean> = {};
  for (const el of CHART_ELEMENTS) allElements[el.id] = true;

  const ratioColor =
    dataInkRatio >= 70 ? 'text-success' : dataInkRatio >= 50 ? 'text-warning' : 'text-error';

  return (
    <ToolLayout
      title="Data-Ink Optimizer"
      description="Maximize data-ink ratio by removing non-essential chart elements"
    >
      <SplitPanel
        leftWidth="360px"
        left={
          <div>
            <ParameterSection title="Data-Ink Ratio">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border-subtle">
                <div>
                  <p className="text-[10px] text-text-tertiary">Current ratio</p>
                  <p className={`text-2xl font-bold font-mono ${ratioColor}`}>
                    {dataInkRatio}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-tertiary">Elements enabled</p>
                  <p className="text-sm font-mono text-text-secondary">
                    {enabledCount}/{CHART_ELEMENTS.length}
                  </p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${dataInkRatio}%`,
                    background:
                      dataInkRatio >= 70
                        ? 'var(--color-success, #22c55e)'
                        : dataInkRatio >= 50
                          ? 'var(--color-warning)'
                          : 'var(--color-error)',
                  }}
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setAll(true)}
                  className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => setAll(false)}
                  className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Disable All
                </button>
              </div>
            </ParameterSection>

            {(['structure', 'labels', 'decoration'] as const).map((cat) => (
              <ParameterSection
                key={cat}
                title={cat.charAt(0).toUpperCase() + cat.slice(1)}
              >
                {CHART_ELEMENTS.filter((el) => el.category === cat).map((el) => (
                  <div key={el.id} className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary">{el.label}</p>
                      <p className="text-[10px] text-text-tertiary">{el.description}</p>
                    </div>
                    <button
                      onClick={() => toggleElement(el.id)}
                      className={`relative shrink-0 w-8 h-[18px] rounded-full transition-colors ${
                        elements[el.id] ? 'bg-accent' : 'bg-surface-3'
                      }`}
                    >
                      <span
                        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface-0 transition-transform ${
                          elements[el.id] ? 'left-[16px]' : 'left-[2px]'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </ParameterSection>
            ))}
          </div>
        }
        right={
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Before &amp; After Comparison
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-tertiary mb-2 text-center">
                    Before (all elements)
                  </p>
                  <div className="rounded-lg border border-border-subtle bg-surface-1 p-2 overflow-hidden">
                    <SampleBarChart
                      elements={allElements}
                      colors={chartColors}
                      width={280}
                      height={200}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary mb-2 text-center">
                    After (current settings)
                  </p>
                  <div className="rounded-lg border border-border-subtle bg-surface-1 p-2 overflow-hidden">
                    <SampleBarChart
                      elements={elements}
                      colors={chartColors}
                      width={280}
                      height={200}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Element Impact
              </h3>
              <div className="space-y-1.5">
                {CHART_ELEMENTS.map((el) => (
                  <div key={el.id} className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        elements[el.id] ? 'bg-accent' : 'bg-surface-3'
                      }`}
                    />
                    <span className="text-xs text-text-secondary flex-1 min-w-0 truncate">
                      {el.label}
                    </span>
                    <div className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full bg-accent/60"
                        style={{ width: `${el.inkCost * 100 * (100 / 12)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-text-tertiary w-8 text-right shrink-0">
                      {Math.round(el.inkCost * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Tufte's Data-Ink Guidelines
              </h3>
              <div className="space-y-2.5">
                {GUIDELINES.map((g) => (
                  <div key={g.title} className="p-2.5 rounded-lg bg-surface-2 border border-border-subtle">
                    <p className="text-xs font-medium text-text-primary">{g.title}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{g.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
