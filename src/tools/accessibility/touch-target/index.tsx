import { useState, useMemo } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';

type PlatformStandard = 'ios' | 'android' | 'wcag' | 'custom';

interface PlatformSpec {
  label: string;
  minWidth: number;
  minHeight: number;
}

const PLATFORM_SPECS: Record<PlatformStandard, PlatformSpec> = {
  ios: { label: 'iOS', minWidth: 44, minHeight: 44 },
  android: { label: 'Android', minWidth: 48, minHeight: 48 },
  wcag: { label: 'WCAG', minWidth: 24, minHeight: 24 },
  custom: { label: 'Custom', minWidth: 0, minHeight: 0 },
};

const PLATFORMS: PlatformStandard[] = ['ios', 'android', 'wcag', 'custom'];

interface TouchTargetConfig {
  targetWidth: number;
  targetHeight: number;
  platform: PlatformStandard;
  spacing: number;
}

const DEFAULT_CONFIG: TouchTargetConfig = {
  targetWidth: 44,
  targetHeight: 44,
  platform: 'ios',
  spacing: 8,
};

function pxToMm(px: number, dpi: number = 160): number {
  return (px / dpi) * 25.4;
}

export default function TouchTargetSizerTool() {
  const [config, setConfig] = useState<TouchTargetConfig>(DEFAULT_CONFIG);

  const update = (updates: Partial<TouchTargetConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const spec = PLATFORM_SPECS[config.platform];

  const analysis = useMemo(() => {
    const meetsWidth = config.platform === 'custom' || config.targetWidth >= spec.minWidth;
    const meetsHeight = config.platform === 'custom' || config.targetHeight >= spec.minHeight;
    const passes = meetsWidth && meetsHeight;

    const widthPercent = spec.minWidth > 0
      ? Math.round((config.targetWidth / spec.minWidth) * 100)
      : 100;
    const heightPercent = spec.minHeight > 0
      ? Math.round((config.targetHeight / spec.minHeight) * 100)
      : 100;

    const area = config.targetWidth * config.targetHeight;
    const widthMm = pxToMm(config.targetWidth);
    const heightMm = pxToMm(config.targetHeight);

    return { passes, meetsWidth, meetsHeight, widthPercent, heightPercent, area, widthMm, heightMm };
  }, [config.targetWidth, config.targetHeight, config.platform, spec]);

  // Visualization scale: show at 2x for clarity, capped so it fits
  const vizScale = useMemo(() => {
    const maxDim = Math.max(config.targetWidth, config.targetHeight, spec.minWidth, spec.minHeight);
    if (maxDim * 2 > 200) return 200 / maxDim;
    return 2;
  }, [config.targetWidth, config.targetHeight, spec.minWidth, spec.minHeight]);

  return (
    <ToolLayout
      title="Touch Target Sizer"
      description="Verify minimum tap/click target sizes against platform standards"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Target Size">
              <SliderWithInput
                label="Width"
                value={config.targetWidth}
                onChange={(v) => update({ targetWidth: v })}
                min={16}
                max={96}
                step={1}
                unit="px"
              />
              <SliderWithInput
                label="Height"
                value={config.targetHeight}
                onChange={(v) => update({ targetHeight: v })}
                min={16}
                max={96}
                step={1}
                unit="px"
              />
            </ParameterSection>

            <ParameterSection title="Platform Standard">
              <div className="flex gap-1">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      update({ platform: p });
                    }}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      config.platform === p
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    <div>{PLATFORM_SPECS[p].label}</div>
                    {p !== 'custom' && (
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {PLATFORM_SPECS[p].minWidth}x{PLATFORM_SPECS[p].minHeight}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Spacing">
              <SliderWithInput
                label="Gap Between Targets"
                value={config.spacing}
                onChange={(v) => update({ spacing: v })}
                min={0}
                max={24}
                step={1}
                unit="px"
              />
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {/* Pass/Fail Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  analysis.passes
                    ? 'bg-success/15 text-success'
                    : 'bg-error/15 text-error'
                }`}
              >
                {analysis.passes ? 'PASS' : 'FAIL'}
              </div>
              <span className="text-sm text-text-secondary">
                {config.platform === 'custom'
                  ? 'No standard selected'
                  : analysis.passes
                    ? `Meets ${spec.label} minimum (${spec.minWidth}x${spec.minHeight}px)`
                    : `Below ${spec.label} minimum (${spec.minWidth}x${spec.minHeight}px)`}
              </span>
            </div>

            {/* Target Visualization */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Target Visualization
            </h3>
            <div className="flex justify-center mb-8">
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-8 inline-flex items-center justify-center"
                style={{ minWidth: 240, minHeight: 200 }}
              >
                <svg
                  width={Math.max(config.targetWidth, spec.minWidth) * vizScale + 20}
                  height={Math.max(config.targetHeight, spec.minHeight) * vizScale + 20}
                  viewBox={`0 0 ${Math.max(config.targetWidth, spec.minWidth) * vizScale + 20} ${Math.max(config.targetHeight, spec.minHeight) * vizScale + 20}`}
                >
                  {/* Platform minimum outline (dashed) */}
                  {config.platform !== 'custom' && (
                    <rect
                      x={(Math.max(config.targetWidth, spec.minWidth) * vizScale + 20 - spec.minWidth * vizScale) / 2}
                      y={(Math.max(config.targetHeight, spec.minHeight) * vizScale + 20 - spec.minHeight * vizScale) / 2}
                      width={spec.minWidth * vizScale}
                      height={spec.minHeight * vizScale}
                      fill="none"
                      stroke="var(--color-text-tertiary)"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      rx={4}
                    />
                  )}
                  {/* Actual target */}
                  <rect
                    x={(Math.max(config.targetWidth, spec.minWidth) * vizScale + 20 - config.targetWidth * vizScale) / 2}
                    y={(Math.max(config.targetHeight, spec.minHeight) * vizScale + 20 - config.targetHeight * vizScale) / 2}
                    width={config.targetWidth * vizScale}
                    height={config.targetHeight * vizScale}
                    fill={analysis.passes ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                    opacity={0.15}
                    stroke={analysis.passes ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                    strokeWidth={2}
                    rx={6}
                  />
                  {/* Size label */}
                  <text
                    x={(Math.max(config.targetWidth, spec.minWidth) * vizScale + 20) / 2}
                    y={(Math.max(config.targetHeight, spec.minHeight) * vizScale + 20) / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--color-text-secondary)"
                    fontSize={11}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {config.targetWidth}x{config.targetHeight}
                  </text>
                </svg>
              </div>
            </div>

            {/* Sample Buttons Row */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Real-World Context
            </h3>
            <div className="flex items-center justify-center gap-1 mb-8" style={{ gap: config.spacing }}>
              {['Back', 'Home', 'Search', 'Menu'].map((label) => (
                <button
                  key={label}
                  className="rounded flex items-center justify-center text-[10px] font-medium border transition-colors bg-accent/10 text-accent border-accent/30"
                  style={{
                    width: config.targetWidth,
                    height: config.targetHeight,
                    minWidth: config.targetWidth,
                    minHeight: config.targetHeight,
                  }}
                >
                  {config.targetWidth >= 32 ? label : label[0]}
                </button>
              ))}
            </div>

            {/* Spacing Visualization */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Spacing Between Targets
            </h3>
            <div className="flex justify-center mb-8">
              <svg
                width={config.targetWidth * vizScale * 2 + config.spacing * vizScale + 40}
                height={config.targetHeight * vizScale + 40}
              >
                {/* First target */}
                <rect
                  x={10}
                  y={10}
                  width={config.targetWidth * vizScale}
                  height={config.targetHeight * vizScale}
                  fill="var(--color-accent)"
                  opacity={0.15}
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  rx={4}
                />
                {/* Spacing indicator */}
                {config.spacing > 0 && (
                  <>
                    <line
                      x1={10 + config.targetWidth * vizScale}
                      y1={10 + config.targetHeight * vizScale / 2}
                      x2={10 + config.targetWidth * vizScale + config.spacing * vizScale}
                      y2={10 + config.targetHeight * vizScale / 2}
                      stroke="var(--color-text-tertiary)"
                      strokeWidth={1}
                      strokeDasharray="3 2"
                    />
                    <text
                      x={10 + config.targetWidth * vizScale + config.spacing * vizScale / 2}
                      y={10 + config.targetHeight * vizScale / 2 - 6}
                      textAnchor="middle"
                      fill="var(--color-text-tertiary)"
                      fontSize={9}
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {config.spacing}px
                    </text>
                  </>
                )}
                {/* Second target */}
                <rect
                  x={10 + config.targetWidth * vizScale + config.spacing * vizScale}
                  y={10}
                  width={config.targetWidth * vizScale}
                  height={config.targetHeight * vizScale}
                  fill="var(--color-accent)"
                  opacity={0.15}
                  stroke="var(--color-accent)"
                  strokeWidth={1.5}
                  rx={4}
                />
              </svg>
            </div>

            {/* Summary Panel */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Summary
            </h3>
            <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 mb-8">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Target Area</div>
                  <div className="text-sm text-text-primary font-mono">
                    {config.targetWidth} x {config.targetHeight} px
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Physical Size (160dpi)</div>
                  <div className="text-sm text-text-primary font-mono">
                    {analysis.widthMm.toFixed(1)} x {analysis.heightMm.toFixed(1)} mm
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">Total Area</div>
                  <div className="text-sm text-text-primary font-mono">
                    {analysis.area.toLocaleString()} px²
                  </div>
                </div>
                {config.platform !== 'custom' && (
                  <div>
                    <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">% of Minimum</div>
                    <div className={`text-sm font-mono ${
                      analysis.passes ? 'text-success' : 'text-error'
                    }`}>
                      {Math.min(analysis.widthPercent, analysis.heightPercent)}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Why Minimum Sizes Matter
            </h3>
            <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 text-[11px] text-text-secondary leading-relaxed space-y-2">
              <p>
                Touch targets that are too small lead to accidental taps, user frustration, and accessibility barriers.
                Users with motor impairments, larger fingers, or who are in motion need adequately sized targets.
              </p>
              <p>
                <strong className="text-text-primary">iOS Human Interface Guidelines</strong> recommend a minimum of 44x44pt
                for all tappable elements.
              </p>
              <p>
                <strong className="text-text-primary">Material Design (Android)</strong> specifies 48x48dp as the minimum
                touch target, with at least 8dp between targets.
              </p>
              <p>
                <strong className="text-text-primary">WCAG 2.2 Target Size (Level AA)</strong> requires at least 24x24 CSS pixels
                for pointer targets, with Level AAA recommending 44x44 CSS pixels.
              </p>
              {config.spacing < 8 && config.spacing > 0 && (
                <p className="text-warning">
                  Note: Current spacing ({config.spacing}px) is below the recommended 8px minimum gap between
                  interactive targets.
                </p>
              )}
              {config.spacing === 0 && (
                <p className="text-error">
                  Warning: No spacing between targets increases the risk of accidental activation of adjacent controls.
                </p>
              )}
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
