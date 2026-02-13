import { useState, useCallback, useEffect, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import type { TypographyLabConfig, DesignToken, TokenGroup } from '@/core/tokens/types';
import { DEFAULT_TYPOGRAPHY_LAB_CONFIG } from '@/core/tokens/defaults';
import { generateTypographyTokens } from '@/core/engine/typography/ratios';
import { TYPE_RATIOS } from '@/core/engine/math/scales';

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';
const SAMPLE_HEADING = 'Design System';

function fontFamilyArrayToString(arr: string[]): string {
  return arr.join(', ');
}

function stringToFontFamilyArray(str: string): string[] {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TypographyLabTool() {
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const storedConfig = useTokenStore(
    (s) => s.generatorConfigs['typography-lab'],
  ) as TypographyLabConfig | undefined;

  const [config, setConfig] = useState<TypographyLabConfig>(
    storedConfig ?? DEFAULT_TYPOGRAPHY_LAB_CONFIG,
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Generate tokens from config
  const tokens = useMemo(
    () =>
      generateTypographyTokens({
        baseFontSize: config.baseFontSize,
        ratio: config.ratio,
        stepsAbove: config.stepsAbove,
        stepsBelow: config.stepsBelow,
        baseLineHeight: config.lineHeightConfig.base,
        tightening: config.lineHeightConfig.tightening,
      }),
    [config],
  );

  // Write tokens to store on config change
  useEffect(() => {
    const group: TokenGroup = {
      $type: 'typography',
      $description: 'Generated type scale',
    };

    // Write individual font size tokens
    const fontSize: TokenGroup = { $type: 'dimension' };
    const lineHeight: TokenGroup = { $type: 'number' };
    const letterSpacing: TokenGroup = { $type: 'dimension' };

    for (const t of tokens) {
      const fsToken: DesignToken = {
        $value: { value: t.fontSize, unit: 'px' },
        $type: 'dimension',
        $description: `Font size ${t.name}`,
        $extensions: {
          'com.dsw.generator': {
            toolId: 'typography-lab',
            generatedAt: new Date().toISOString(),
            configHash: '',
          },
          'com.dsw.tier': 'primitive',
        },
      };
      fontSize[t.name] = fsToken;

      const lhToken: DesignToken = {
        $value: t.lineHeight,
        $type: 'number',
        $description: `Line height for ${t.name}`,
      };
      lineHeight[t.name] = lhToken;

      const lsToken: DesignToken = {
        $value: { value: t.letterSpacing, unit: 'rem' },
        $type: 'dimension',
        $description: `Letter spacing for ${t.name}`,
      };
      letterSpacing[t.name] = lsToken;
    }

    group['fontSize'] = fontSize;
    group['lineHeight'] = lineHeight;
    group['letterSpacing'] = letterSpacing;

    // Write font family tokens
    const fontFamily: TokenGroup = { $type: 'fontFamily' };
    fontFamily['heading'] = {
      $value: config.fontFamilies.heading.join(', '),
      $type: 'fontFamily',
      $description: 'Heading font stack',
    } as DesignToken;
    fontFamily['body'] = {
      $value: config.fontFamilies.body.join(', '),
      $type: 'fontFamily',
      $description: 'Body font stack',
    } as DesignToken;
    fontFamily['mono'] = {
      $value: config.fontFamilies.mono.join(', '),
      $type: 'fontFamily',
      $description: 'Monospace font stack',
    } as DesignToken;
    group['fontFamily'] = fontFamily;

    setTokenGroup(['typography'], group);
    setGeneratorConfig('typography-lab', config);
  }, [config, tokens, setTokenGroup, setGeneratorConfig]);

  const updateConfig = useCallback((updates: Partial<TypographyLabConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateLineHeight = useCallback(
    (updates: Partial<TypographyLabConfig['lineHeightConfig']>) => {
      setConfig((prev) => ({
        ...prev,
        lineHeightConfig: { ...prev.lineHeightConfig, ...updates },
      }));
    },
    [],
  );

  const updateFontFamily = useCallback(
    (key: 'heading' | 'body' | 'mono', value: string) => {
      setConfig((prev) => ({
        ...prev,
        fontFamilies: {
          ...prev.fontFamilies,
          [key]: stringToFontFamilyArray(value),
        },
      }));
    },
    [],
  );

  // Find the matching ratio key or "custom"
  const activeRatioKey = useMemo(() => {
    for (const [key, entry] of Object.entries(TYPE_RATIOS)) {
      if (Math.abs(entry.value - config.ratio) < 0.001) return key;
    }
    return 'custom';
  }, [config.ratio]);

  // Compute max font size for visual scale bar normalization
  const maxFontSize = useMemo(
    () => Math.max(...tokens.map((t) => t.fontSize)),
    [tokens],
  );

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(key);
    setTimeout(() => setCopiedToken(null), 1500);
  }, []);

  // Build JSON output for token preview
  const tokenJson = useMemo(() => {
    const output: Record<string, { fontSize: string; lineHeight: number; letterSpacing: string }> = {};
    for (const t of tokens) {
      output[`typography.fontSize.${t.name}`] = {
        fontSize: `${t.fontSize}px`,
        lineHeight: t.lineHeight,
        letterSpacing: `${t.letterSpacing}em`,
      };
    }
    return JSON.stringify(output, null, 2);
  }, [tokens]);

  return (
    <ToolLayout
      title="Typography Lab"
      description="Type scale generator with mathematical ratios"
    >
      <SplitPanel
        leftWidth="380px"
        left={
          <div>
            {/* Base Font Size */}
            <ParameterSection title="Base Font Size">
              <SliderWithInput
                label="Base size"
                value={config.baseFontSize}
                onChange={(v) => updateConfig({ baseFontSize: v })}
                min={10}
                max={24}
                step={1}
                unit="px"
              />
            </ParameterSection>

            {/* Scale Ratio */}
            <ParameterSection title="Scale Ratio">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-text-secondary">Ratio preset</label>
                  <span className="text-xs font-mono text-text-tertiary">
                    {config.ratio.toFixed(3)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(TYPE_RATIOS).map(([key, entry]) => (
                    <button
                      key={key}
                      onClick={() => updateConfig({ ratio: entry.value })}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors text-left ${
                        activeRatioKey === key
                          ? 'bg-accent/10 text-accent border border-accent/30'
                          : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                      }`}
                    >
                      <span className="block font-medium">{entry.name}</span>
                      <span className="block text-[10px] opacity-60 font-mono">
                        {entry.value}
                      </span>
                    </button>
                  ))}
                </div>
                {activeRatioKey === 'custom' && (
                  <SliderWithInput
                    label="Custom ratio"
                    value={config.ratio}
                    onChange={(v) => updateConfig({ ratio: v })}
                    min={1.0}
                    max={2.0}
                    step={0.001}
                  />
                )}
              </div>
            </ParameterSection>

            {/* Scale Steps */}
            <ParameterSection title="Scale Steps">
              <SliderWithInput
                label="Steps above base"
                value={config.stepsAbove}
                onChange={(v) => updateConfig({ stepsAbove: v })}
                min={1}
                max={10}
                step={1}
              />
              <SliderWithInput
                label="Steps below base"
                value={config.stepsBelow}
                onChange={(v) => updateConfig({ stepsBelow: v })}
                min={0}
                max={4}
                step={1}
              />
            </ParameterSection>

            {/* Font Families */}
            <ParameterSection title="Font Families">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={fontFamilyArrayToString(config.fontFamilies.heading)}
                    onChange={(e) => updateFontFamily('heading', e.target.value)}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
                    Body
                  </label>
                  <input
                    type="text"
                    value={fontFamilyArrayToString(config.fontFamilies.body)}
                    onChange={(e) => updateFontFamily('body', e.target.value)}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
                    Monospace
                  </label>
                  <input
                    type="text"
                    value={fontFamilyArrayToString(config.fontFamilies.mono)}
                    onChange={(e) => updateFontFamily('mono', e.target.value)}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50 font-mono"
                    placeholder="JetBrains Mono, Fira Code, monospace"
                  />
                </div>
              </div>
            </ParameterSection>

            {/* Line Height */}
            <ParameterSection title="Line Height">
              <SliderWithInput
                label="Base line height"
                value={config.lineHeightConfig.base}
                onChange={(v) => updateLineHeight({ base: v })}
                min={1.2}
                max={2.0}
                step={0.05}
              />
              <SliderWithInput
                label="Tightening factor"
                value={config.lineHeightConfig.tightening}
                onChange={(v) => updateLineHeight({ tightening: v })}
                min={0}
                max={0.3}
                step={0.01}
                description="Reduces line height for larger sizes (logarithmic)"
              />
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {/* Type Specimen */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Type Specimen
              </h3>
              <div className="space-y-0">
                {[...tokens].reverse().map((t) => {
                  const remSize = Math.round((t.fontSize / 16) * 1000) / 1000;
                  const isBase = t.step === 0;
                  const isHeading = t.step >= 2;
                  const fontStack = isHeading
                    ? fontFamilyArrayToString(config.fontFamilies.heading)
                    : fontFamilyArrayToString(config.fontFamilies.body);

                  return (
                    <div
                      key={t.name}
                      className={`group flex items-baseline gap-4 py-3 border-b border-border-subtle hover:bg-surface-2/50 transition-colors ${
                        isBase ? 'bg-accent/5' : ''
                      }`}
                    >
                      {/* Token name and metrics */}
                      <div className="w-28 shrink-0 text-right pr-3 border-r border-border-subtle">
                        <span
                          className={`block text-xs font-semibold font-mono ${
                            isBase ? 'text-accent' : 'text-text-secondary'
                          }`}
                        >
                          {t.name}
                        </span>
                        <span className="block text-[10px] text-text-tertiary font-mono">
                          {t.fontSize}px / {remSize}rem
                        </span>
                        <span className="block text-[10px] text-text-tertiary font-mono">
                          LH {t.lineHeight} &middot; LS{' '}
                          {t.letterSpacing === 0
                            ? '0'
                            : `${t.letterSpacing}em`}
                        </span>
                      </div>

                      {/* Sample text */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p
                          className="text-text-primary truncate"
                          style={{
                            fontSize: `${t.fontSize}px`,
                            lineHeight: t.lineHeight,
                            letterSpacing: `${t.letterSpacing}em`,
                            fontFamily: fontStack,
                          }}
                        >
                          {isHeading ? SAMPLE_HEADING : SAMPLE_TEXT}
                        </p>
                      </div>

                      {/* Copy button */}
                      <button
                        onClick={() =>
                          handleCopy(
                            `font-size: ${t.fontSize}px; line-height: ${t.lineHeight}; letter-spacing: ${t.letterSpacing}em;`,
                            t.name,
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-all shrink-0"
                        title="Copy CSS"
                      >
                        {copiedToken === t.name ? (
                          <Check size={12} className="text-success" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Scale */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Visual Scale
              </h3>
              <div className="space-y-1.5">
                {[...tokens].reverse().map((t) => {
                  const widthPercent = (t.fontSize / maxFontSize) * 100;
                  const isBase = t.step === 0;

                  return (
                    <div key={t.name} className="flex items-center gap-3">
                      <span
                        className={`w-12 text-right text-[10px] font-mono shrink-0 ${
                          isBase ? 'text-accent font-semibold' : 'text-text-tertiary'
                        }`}
                      >
                        {t.name}
                      </span>
                      <div className="flex-1 h-5 relative">
                        <div
                          className={`h-full rounded-sm transition-all ${
                            isBase
                              ? 'bg-accent/20 border border-accent/40'
                              : 'bg-surface-3'
                          }`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className="w-14 text-[10px] font-mono text-text-tertiary shrink-0">
                        {t.fontSize}px
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Scale info */}
              <div className="mt-4 flex items-center gap-4 text-[10px] text-text-tertiary">
                <span>
                  Ratio: {config.ratio} (
                  {activeRatioKey === 'custom'
                    ? 'Custom'
                    : TYPE_RATIOS[activeRatioKey]?.name}
                  )
                </span>
                <span>
                  Steps: {config.stepsBelow} below / {config.stepsAbove} above
                </span>
                <span>Base: {config.baseFontSize}px</span>
              </div>
            </div>

            {/* Token Output */}
            <div className="border-t border-border-subtle pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Generated Tokens
                </h3>
                <button
                  onClick={() => handleCopy(tokenJson, '__json__')}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {copiedToken === '__json__' ? (
                    <>
                      <Check size={10} className="text-success" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-80 overflow-y-auto">
                <pre>{tokenJson}</pre>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
