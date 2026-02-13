import { useState, useEffect, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { generateSpacingScale } from '@/core/engine/math/scales';
import type { SpacingLabConfig, DesignToken, DimensionValue, TokenGroup } from '@/core/tokens/types';
import { DEFAULT_SPACING_LAB_CONFIG } from '@/core/tokens/defaults';

type Progression = SpacingLabConfig['progression'];

const PROGRESSION_OPTIONS: { value: Progression; label: string }[] = [
  { value: 'geometric', label: 'Geometric' },
  { value: 'arithmetic', label: 'Arithmetic' },
  { value: 'fibonacci', label: 'Fibonacci' },
  { value: 'custom', label: 'Custom' },
];

type OutputFormat = 'json' | 'css';

interface SpacingStep {
  index: number;
  tokenName: string;
  px: number;
  rem: number;
}

function buildSpacingSteps(values: number[]): SpacingStep[] {
  return values.map((px, i) => {
    const rounded = Math.round(px * 100) / 100;
    return {
      index: i,
      tokenName: `spacing.${(i + 1) * 100}`,
      px: rounded,
      rem: Math.round((rounded / 16) * 10000) / 10000,
    };
  });
}

function buildTokenGroup(steps: SpacingStep[]): TokenGroup {
  const group: TokenGroup = { $type: 'spacing' };
  for (const step of steps) {
    const key = String((step.index + 1) * 100);
    const dimensionValue: DimensionValue = { value: step.px, unit: 'px' };
    const token: DesignToken = {
      $value: dimensionValue,
      $type: 'dimension',
      $description: `${step.px}px (${step.rem}rem)`,
      $extensions: {
        'com.dsw.generator': {
          toolId: 'spacing-lab',
          generatedAt: new Date().toISOString(),
          configHash: '',
        },
        'com.dsw.tier': 'primitive',
      },
    };
    group[key] = token;
  }
  return group;
}

function formatTokenOutput(steps: SpacingStep[], format: OutputFormat): string {
  if (format === 'css') {
    return steps
      .map((s) => `--spacing-${(s.index + 1) * 100}: ${s.px}px; /* ${s.rem}rem */`)
      .join('\n');
  }
  // JSON format
  const obj: Record<string, { $value: DimensionValue; $type: string }> = {};
  for (const s of steps) {
    obj[s.tokenName] = {
      $value: { value: s.px, unit: 'px' },
      $type: 'dimension',
    };
  }
  return JSON.stringify(obj, null, 2);
}

export default function SpacingLabTool() {
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['spacing-lab']) as SpacingLabConfig | undefined;

  const [config, setConfig] = useState<SpacingLabConfig>(storedConfig ?? DEFAULT_SPACING_LAB_CONFIG);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
  const [copied, setCopied] = useState(false);

  // Generate the spacing scale from current config
  const scaleValues = useMemo(
    () =>
      generateSpacingScale(
        config.baseUnit,
        config.progression,
        config.steps,
        config.ratio,
        config.customValues,
      ),
    [config.baseUnit, config.progression, config.steps, config.ratio, config.customValues],
  );

  const steps = useMemo(() => buildSpacingSteps(scaleValues), [scaleValues]);

  // Find the max value for proportional bar widths
  const maxValue = useMemo(() => Math.max(...steps.map((s) => s.px), 1), [steps]);

  // Write to store on config change
  useEffect(() => {
    const group = buildTokenGroup(steps);
    setTokenGroup(['spacing'], group);
    setGeneratorConfig('spacing-lab', config);
  }, [config, steps, setTokenGroup, setGeneratorConfig]);

  const updateConfig = (updates: Partial<SpacingLabConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleCopy = () => {
    const text = formatTokenOutput(steps, outputFormat);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="Spacing Lab"
      description="Generate consistent spacing scales from base unit progressions"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            {/* Base Unit */}
            <ParameterSection title="Base Unit">
              <SliderWithInput
                label="Base"
                value={config.baseUnit}
                onChange={(v) => updateConfig({ baseUnit: v })}
                min={1}
                max={16}
                step={1}
                unit="px"
                description="The fundamental spacing unit all values derive from"
              />
            </ParameterSection>

            {/* Progression Type */}
            <ParameterSection title="Progression">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-text-secondary">Type</label>
                <div className="grid grid-cols-2 gap-1">
                  {PROGRESSION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateConfig({ progression: opt.value })}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                        config.progression === opt.value
                          ? 'bg-accent/10 text-accent border border-accent/30'
                          : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-tertiary">
                  {config.progression === 'geometric' && 'Each step is base \u00d7 ratio^n. Produces exponential growth.'}
                  {config.progression === 'arithmetic' && 'Each step adds the base unit linearly. Produces even increments.'}
                  {config.progression === 'fibonacci' && 'Each step is the sum of the two preceding values.'}
                  {config.progression === 'custom' && 'Define your own spacing values manually.'}
                </p>
              </div>
            </ParameterSection>

            {/* Ratio (geometric only) */}
            {config.progression === 'geometric' && (
              <ParameterSection title="Ratio">
                <SliderWithInput
                  label="Ratio"
                  value={config.ratio ?? 2}
                  onChange={(v) => updateConfig({ ratio: v })}
                  min={1.2}
                  max={4}
                  step={0.1}
                  description="Growth factor between consecutive steps"
                />
              </ParameterSection>
            )}

            {/* Steps */}
            <ParameterSection title="Steps">
              <SliderWithInput
                label="Count"
                value={config.steps}
                onChange={(v) => updateConfig({ steps: v })}
                min={4}
                max={16}
                step={1}
                description="Number of spacing values in the scale"
              />
            </ParameterSection>

            {/* Custom values editor */}
            {config.progression === 'custom' && (
              <ParameterSection title="Custom Values">
                <div className="space-y-1.5">
                  {Array.from({ length: config.steps }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-tertiary font-mono w-8 text-right">
                        {(i + 1) * 100}
                      </span>
                      <input
                        type="number"
                        value={config.customValues?.[i] ?? config.baseUnit * (i + 1)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) return;
                          const current = config.customValues ?? Array.from(
                            { length: config.steps },
                            (_, idx) => config.baseUnit * (idx + 1),
                          );
                          const updated = [...current];
                          updated[i] = val;
                          updateConfig({ customValues: updated });
                        }}
                        min={0}
                        step={1}
                        className="flex-1 bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary text-right outline-none focus:ring-1 focus:ring-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-text-tertiary">px</span>
                    </div>
                  ))}
                </div>
              </ParameterSection>
            )}
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Spacing Scale Visualization */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Spacing Scale
              </h3>
              <div className="space-y-1.5">
                {steps.map((step) => (
                  <div key={step.index} className="flex items-center gap-3 group">
                    <span className="text-[10px] font-mono text-text-tertiary w-20 text-right shrink-0">
                      {step.tokenName.replace('spacing.', '')}
                    </span>
                    <div className="flex-1 h-6 relative">
                      <div
                        className="h-full rounded-sm bg-accent/70 transition-all duration-200"
                        style={{
                          width: `${Math.max((step.px / maxValue) * 100, 1)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-baseline gap-1.5 shrink-0 w-28 text-right">
                      <span className="text-xs font-mono text-text-primary font-medium">
                        {step.px}px
                      </span>
                      <span className="text-[10px] font-mono text-text-tertiary">
                        {step.rem}rem
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Padding Reference */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Padding Reference
              </h3>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.index} className="flex items-start gap-3">
                    <span className="text-[10px] font-mono text-text-tertiary w-20 text-right shrink-0 pt-1">
                      {step.tokenName.replace('spacing.', '')}
                    </span>
                    <div className="bg-accent/10 border border-accent/20 rounded-md inline-block">
                      <div
                        style={{ padding: `${Math.min(step.px, 64)}px` }}
                      >
                        <div className="bg-surface-3 border border-border-subtle rounded px-2 py-1 text-[10px] text-text-secondary font-mono whitespace-nowrap">
                          {step.px}px
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Output */}
            <div className="border-t border-border-subtle pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Generated Tokens
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-md overflow-hidden border border-border-subtle">
                    <button
                      onClick={() => setOutputFormat('json')}
                      className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        outputFormat === 'json'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setOutputFormat('css')}
                      className={`px-2.5 py-1 text-[10px] font-medium transition-colors border-l border-border-subtle ${
                        outputFormat === 'css'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      CSS
                    </button>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                <pre>{formatTokenOutput(steps, outputFormat)}</pre>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
