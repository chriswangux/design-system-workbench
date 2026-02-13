import { useState, useEffect, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { createColor, toHex, gamutMap } from '@/core/engine/color/oklch';
import { simulateCVD, CVD_TYPES, type CVDType } from '@/core/engine/color/cvdSimulation';
import type { ColorValue } from '@/core/tokens/types';

type PaletteType = 'sequential' | 'diverging' | 'categorical';
type HueStrategy = 'equidistant' | 'warm-cool' | 'analogous';

interface ChartPaletteConfig {
  paletteType: PaletteType;
  // Sequential
  seqBaseHue: number;
  seqSteps: number;
  seqLightnessStart: number;
  seqLightnessEnd: number;
  // Diverging
  divHueA: number;
  divHueB: number;
  divMidLightness: number;
  divSteps: number;
  // Categorical
  catCount: number;
  catStartHue: number;
  catStrategy: HueStrategy;
  // Shared
  minChroma: number;
  cvdCheck: boolean;
}

const DEFAULT_CONFIG: ChartPaletteConfig = {
  paletteType: 'categorical',
  seqBaseHue: 220,
  seqSteps: 7,
  seqLightnessStart: 0.95,
  seqLightnessEnd: 0.25,
  divHueA: 30,
  divHueB: 250,
  divMidLightness: 0.92,
  divSteps: 9,
  catCount: 6,
  catStartHue: 30,
  catStrategy: 'equidistant',
  minChroma: 0.12,
  cvdCheck: false,
};

const PALETTE_TYPES: PaletteType[] = ['sequential', 'diverging', 'categorical'];
const HUE_STRATEGIES: HueStrategy[] = ['equidistant', 'warm-cool', 'analogous'];

function generateSequential(config: ChartPaletteConfig): ColorValue[] {
  const colors: ColorValue[] = [];
  for (let i = 0; i < config.seqSteps; i++) {
    const t = config.seqSteps === 1 ? 0.5 : i / (config.seqSteps - 1);
    const l = config.seqLightnessStart + (config.seqLightnessEnd - config.seqLightnessStart) * t;
    // Chroma peaks at mid-lightness and tapers at extremes
    const chromaPeak = Math.max(config.minChroma, 0.15);
    const chromaFactor = 1 - Math.pow(2 * t - 1, 2) * 0.5;
    const c = Math.max(config.minChroma, chromaPeak * chromaFactor);
    colors.push(gamutMap(createColor(l, c, config.seqBaseHue)));
  }
  return colors;
}

function generateDiverging(config: ChartPaletteConfig): ColorValue[] {
  const colors: ColorValue[] = [];
  const steps = config.divSteps % 2 === 0 ? config.divSteps + 1 : config.divSteps;
  const mid = Math.floor(steps / 2);
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const distFromMid = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
    const l = config.divMidLightness + (0.35 - config.divMidLightness) * distFromMid;
    const c = Math.max(config.minChroma, 0.16 * distFromMid);
    const h = i <= mid ? config.divHueA : config.divHueB;
    if (i === mid) {
      // Neutral midpoint
      colors.push(gamutMap(createColor(config.divMidLightness, 0.01, 0)));
    } else {
      colors.push(gamutMap(createColor(l, c, h)));
    }
  }
  return colors;
}

function generateCategorical(config: ChartPaletteConfig): ColorValue[] {
  const colors: ColorValue[] = [];
  for (let i = 0; i < config.catCount; i++) {
    const t = config.catCount === 1 ? 0 : i / config.catCount;
    let hue: number;
    switch (config.catStrategy) {
      case 'equidistant':
        hue = (config.catStartHue + t * 360) % 360;
        break;
      case 'warm-cool': {
        // Alternate between warm (0-60, 300-360) and cool (120-270) ranges
        const warmHues = [0, 30, 45, 350, 15, 330];
        const coolHues = [200, 160, 250, 180, 220, 270];
        if (i % 2 === 0) {
          hue = (config.catStartHue + (warmHues[Math.floor(i / 2) % warmHues.length])) % 360;
        } else {
          hue = (config.catStartHue + (coolHues[Math.floor(i / 2) % coolHues.length])) % 360;
        }
        break;
      }
      case 'analogous':
        // Spread within a 120-degree arc
        hue = (config.catStartHue + t * 120) % 360;
        break;
    }
    // Vary lightness slightly to improve distinguishability
    const l = 0.55 + (i % 3) * 0.08;
    colors.push(gamutMap(createColor(l, Math.max(config.minChroma, 0.13), hue)));
  }
  return colors;
}

function generatePalette(config: ChartPaletteConfig): ColorValue[] {
  switch (config.paletteType) {
    case 'sequential': return generateSequential(config);
    case 'diverging': return generateDiverging(config);
    case 'categorical': return generateCategorical(config);
  }
}

/** Compute average minimum deltaE between all color pairs (perceptual distance in OKLCH) */
function computeDistinguishability(colors: ColorValue[]): number {
  if (colors.length < 2) return 100;
  let minDist = Infinity;
  let totalMinDist = 0;
  let pairs = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const dL = colors[i].channels[0] - colors[j].channels[0];
      const dC = colors[i].channels[1] - colors[j].channels[1];
      const dH = (colors[i].channels[2] - colors[j].channels[2]) * (Math.PI / 180);
      const dist = Math.sqrt(dL * dL + dC * dC + 2 * colors[i].channels[1] * colors[j].channels[1] * (1 - Math.cos(dH)));
      if (dist < minDist) minDist = dist;
      totalMinDist += dist;
      pairs++;
    }
  }
  // Normalize to 0-100 score (0.3 is very distinct in OKLCH space)
  const score = Math.min(100, Math.round((minDist / 0.3) * 100));
  return score;
}

function PaletteSwatches({ colors, label }: { colors: ColorValue[]; label?: string }) {
  return (
    <div>
      {label && (
        <div className="text-[10px] text-text-tertiary mb-1 font-medium">{label}</div>
      )}
      <div className="flex rounded-lg overflow-hidden h-10">
        {colors.map((color, i) => (
          <div
            key={i}
            className="flex-1 relative group cursor-pointer"
            style={{ backgroundColor: toHex(color) }}
            title={toHex(color)}
            onClick={() => handleCopyHex(toHex(color))}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-mono px-1 rounded bg-surface-0/70 text-text-primary">
                {copiedHex === toHex(color) ? 'Copied!' : toHex(color)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SampleBarChart({ colors }: { colors: ColorValue[] }) {
  const barHeights = useMemo(() => {
    // Deterministic pseudo-random heights
    return colors.map((_, i) => 30 + ((i * 37 + 13) % 60));
  }, [colors.length]);

  const barWidth = Math.min(40, Math.max(12, 280 / colors.length - 4));
  const chartWidth = colors.length * (barWidth + 4);
  const chartHeight = 100;

  return (
    <svg width={chartWidth} height={chartHeight + 20} viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}>
      {/* Baseline */}
      <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="var(--color-border-subtle)" strokeWidth={1} />
      {colors.map((color, i) => (
        <g key={i}>
          <rect
            x={i * (barWidth + 4) + 2}
            y={chartHeight - barHeights[i]}
            width={barWidth}
            height={barHeights[i]}
            fill={toHex(color)}
            rx={2}
          />
          <text
            x={i * (barWidth + 4) + 2 + barWidth / 2}
            y={chartHeight + 14}
            textAnchor="middle"
            fill="var(--color-text-tertiary)"
            fontSize={8}
            fontFamily="var(--font-mono, monospace)"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SampleDonutChart({ colors }: { colors: ColorValue[] }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 60;
  const innerR = 35;

  const slices = useMemo(() => {
    // Deterministic slice sizes
    const rawSizes = colors.map((_, i) => 1 + ((i * 23 + 7) % 3));
    const total = rawSizes.reduce((a, b) => a + b, 0);
    const normalized = rawSizes.map((s) => s / total);

    const result: Array<{ path: string; color: string }> = [];
    let startAngle = -Math.PI / 2;

    normalized.forEach((fraction, i) => {
      const endAngle = startAngle + fraction * 2 * Math.PI;
      const largeArc = fraction > 0.5 ? 1 : 0;

      const x1o = cx + outerR * Math.cos(startAngle);
      const y1o = cy + outerR * Math.sin(startAngle);
      const x2o = cx + outerR * Math.cos(endAngle);
      const y2o = cy + outerR * Math.sin(endAngle);
      const x1i = cx + innerR * Math.cos(endAngle);
      const y1i = cy + innerR * Math.sin(endAngle);
      const x2i = cx + innerR * Math.cos(startAngle);
      const y2i = cy + innerR * Math.sin(startAngle);

      const path = [
        `M ${x1o} ${y1o}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x1i} ${y1i}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
        'Z',
      ].join(' ');

      result.push({ path, color: toHex(colors[i]) });
      startAngle = endAngle;
    });

    return result;
  }, [colors]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path key={i} d={slice.path} fill={slice.color} stroke="var(--color-surface-1)" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

export default function ChartPaletteGeneratorTool() {
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['chart-palette']) as ChartPaletteConfig | undefined;

  const [config, setConfig] = useState<ChartPaletteConfig>(storedConfig ?? DEFAULT_CONFIG);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const colors = useMemo(() => generatePalette(config), [config]);

  const cvdSimulations = useMemo(() => {
    if (!config.cvdCheck) return [];
    return CVD_TYPES.filter((t) => t.type !== 'achromatopsia').map(({ type, label, prevalence }) => ({
      type,
      label,
      prevalence,
      colors: colors.map((c) => simulateCVD(c, type)),
    }));
  }, [colors, config.cvdCheck]);

  const score = useMemo(() => computeDistinguishability(colors), [colors]);

  const cvdScores = useMemo(() => {
    return cvdSimulations.map((sim) => ({
      ...sim,
      score: computeDistinguishability(sim.colors),
    }));
  }, [cvdSimulations]);

  // Write tokens to store
  useEffect(() => {
    const tokenGroup: Record<string, unknown> = {
      $description: `Chart palette - ${config.paletteType}`,
    };
    colors.forEach((color, i) => {
      tokenGroup[`${i + 1}`] = {
        $value: {
          colorSpace: 'oklch' as const,
          channels: [...color.channels],
          alpha: color.alpha,
        },
        $type: 'color' as const,
        $description: `${config.paletteType} palette step ${i + 1}`,
      };
    });
    setTokenGroup(['dataViz', config.paletteType], tokenGroup);
    setGeneratorConfig('chart-palette', config);
  }, [config, colors, setTokenGroup, setGeneratorConfig]);

  const update = (updates: Partial<ChartPaletteConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const cssOutput = useMemo(() => {
    return colors
      .map((c, i) => `--chart-${config.paletteType}-${i + 1}: ${toHex(c)};`)
      .join('\n');
  }, [colors, config.paletteType]);

  return (
    <ToolLayout
      title="Chart Palette Generator"
      description="Generate accessible color palettes for data visualization"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Palette Type">
              <div className="flex gap-1">
                {PALETTE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => update({ paletteType: type })}
                    className={`flex-1 px-2 py-1 text-xs rounded capitalize transition-colors ${
                      config.paletteType === type
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </ParameterSection>

            {config.paletteType === 'sequential' && (
              <ParameterSection title="Sequential Settings">
                <SliderWithInput
                  label="Base Hue"
                  value={config.seqBaseHue}
                  onChange={(v) => update({ seqBaseHue: v })}
                  min={0}
                  max={360}
                  step={1}
                  unit="deg"
                />
                <SliderWithInput
                  label="Steps"
                  value={config.seqSteps}
                  onChange={(v) => update({ seqSteps: v })}
                  min={3}
                  max={12}
                  step={1}
                />
                <SliderWithInput
                  label="Lightness Start"
                  value={config.seqLightnessStart}
                  onChange={(v) => update({ seqLightnessStart: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  description="Lightest end of the ramp"
                />
                <SliderWithInput
                  label="Lightness End"
                  value={config.seqLightnessEnd}
                  onChange={(v) => update({ seqLightnessEnd: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  description="Darkest end of the ramp"
                />
              </ParameterSection>
            )}

            {config.paletteType === 'diverging' && (
              <ParameterSection title="Diverging Settings">
                <SliderWithInput
                  label="Hue A"
                  value={config.divHueA}
                  onChange={(v) => update({ divHueA: v })}
                  min={0}
                  max={360}
                  step={1}
                  unit="deg"
                />
                <SliderWithInput
                  label="Hue B"
                  value={config.divHueB}
                  onChange={(v) => update({ divHueB: v })}
                  min={0}
                  max={360}
                  step={1}
                  unit="deg"
                />
                <SliderWithInput
                  label="Mid Lightness"
                  value={config.divMidLightness}
                  onChange={(v) => update({ divMidLightness: v })}
                  min={0.5}
                  max={1}
                  step={0.01}
                  description="Neutral midpoint lightness"
                />
                <SliderWithInput
                  label="Steps"
                  value={config.divSteps}
                  onChange={(v) => update({ divSteps: v })}
                  min={3}
                  max={12}
                  step={1}
                />
              </ParameterSection>
            )}

            {config.paletteType === 'categorical' && (
              <ParameterSection title="Categorical Settings">
                <SliderWithInput
                  label="Categories"
                  value={config.catCount}
                  onChange={(v) => update({ catCount: v })}
                  min={2}
                  max={12}
                  step={1}
                />
                <SliderWithInput
                  label="Starting Hue"
                  value={config.catStartHue}
                  onChange={(v) => update({ catStartHue: v })}
                  min={0}
                  max={360}
                  step={1}
                  unit="deg"
                />
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block">Hue Spread</label>
                  <div className="flex gap-1">
                    {HUE_STRATEGIES.map((strategy) => (
                      <button
                        key={strategy}
                        onClick={() => update({ catStrategy: strategy })}
                        className={`flex-1 px-2 py-1 text-xs rounded capitalize transition-colors ${
                          config.catStrategy === strategy
                            ? 'bg-accent/10 text-accent border border-accent/30'
                            : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                        }`}
                      >
                        {strategy === 'warm-cool' ? 'Warm/Cool' : strategy}
                      </button>
                    ))}
                  </div>
                </div>
              </ParameterSection>
            )}

            <ParameterSection title="Chroma">
              <SliderWithInput
                label="Min Chroma"
                value={config.minChroma}
                onChange={(v) => update({ minChroma: v })}
                min={0.05}
                max={0.3}
                step={0.01}
                description="Minimum color intensity for visibility"
              />
            </ParameterSection>

            <ParameterSection title="Accessibility">
              <button
                onClick={() => update({ cvdCheck: !config.cvdCheck })}
                className={`w-full px-3 py-2 text-xs rounded transition-colors text-left ${
                  config.cvdCheck
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                }`}
              >
                <div className="font-medium">CVD Simulation</div>
                <div className="text-[10px] opacity-70 mt-0.5">
                  {config.cvdCheck ? 'Enabled - showing simulations' : 'Click to preview color vision deficiency'}
                </div>
              </button>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {/* Palette Swatches */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Generated Palette
            </h3>
            <PaletteSwatches colors={colors} />
            <div className="flex gap-0.5 mt-2 mb-6">
              {colors.map((color, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full aspect-square rounded-md cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all"
                    style={{ backgroundColor: toHex(color) }}
                    onClick={() => navigator.clipboard.writeText(toHex(color))}
                    title="Click to copy"
                  />
                  <span className="text-[8px] text-text-tertiary mt-1 font-mono">
                    {toHex(color)}
                  </span>
                </div>
              ))}
            </div>

            {/* Sample Charts */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Chart Previews
            </h3>
            <div className="flex gap-6 items-start flex-wrap mb-6">
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4">
                <div className="text-[10px] text-text-tertiary mb-2">Bar Chart</div>
                <SampleBarChart colors={colors} />
              </div>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4">
                <div className="text-[10px] text-text-tertiary mb-2">Donut Chart</div>
                <SampleDonutChart colors={colors} />
              </div>
            </div>

            {/* Distinguishability Score */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Distinguishability
            </h3>
            <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl font-semibold text-text-primary font-mono">{score}</div>
                <div className="text-xs text-text-secondary">/100</div>
                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    score >= 70
                      ? 'bg-success/15 text-success'
                      : score >= 40
                        ? 'bg-warning/15 text-warning'
                        : 'bg-error/15 text-error'
                  }`}
                >
                  {score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Poor'}
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor: score >= 70
                      ? 'var(--color-success, #22c55e)'
                      : score >= 40
                        ? 'var(--color-warning, #f59e0b)'
                        : 'var(--color-error, #ef4444)',
                  }}
                />
              </div>
              <p className="text-[10px] text-text-tertiary mt-2">
                Based on minimum perceptual distance between color pairs in OKLCH space
              </p>
            </div>

            {/* CVD Simulations */}
            {config.cvdCheck && cvdScores.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Color Vision Deficiency Simulation
                </h3>
                <div className="space-y-3 mb-6">
                  {cvdScores.map((sim) => (
                    <div key={sim.type} className="bg-surface-2 rounded-lg border border-border-subtle p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs font-medium text-text-primary">{sim.label}</span>
                          <span className="text-[10px] text-text-tertiary ml-2">{sim.prevalence}</span>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sim.score >= 50
                              ? 'bg-success/15 text-success'
                              : sim.score >= 25
                                ? 'bg-warning/15 text-warning'
                                : 'bg-error/15 text-error'
                          }`}
                        >
                          {sim.score}/100
                        </div>
                      </div>
                      <PaletteSwatches colors={sim.colors} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Token Output */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Generated CSS
            </h3>
            <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
              <pre>{cssOutput}</pre>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
