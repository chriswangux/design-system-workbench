import { useState, useMemo, useEffect } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput, BezierCurveEditor } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { createColor, toHex, gamutMap } from '@/core/engine/color/oklch';
import { contrastRatio, wcagLevel, type WCAGLevel } from '@/core/engine/color/contrast';
import { createBezierEasing } from '@/core/engine/math/bezier';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import type { ColorValue, BezierControlPoints, TokenGroup, DesignToken } from '@/core/tokens/types';

type ThemeVariant = 'dark' | 'high-contrast' | 'brand';
type BoostStrategy = 'lighten-darken' | 'maximize';

interface ThemeDerivationConfig {
  variant: ThemeVariant;
  // Dark mode
  darkInversionCurve: BezierControlPoints;
  darkChromaDamping: number;
  darkHueShift: number;
  // High contrast
  hcMinContrast: number;
  hcStrategy: BoostStrategy;
  // Brand variant
  brandHueShift: number;
  brandChromaScale: number;
  brandLightnessAdj: number;
}

const DEFAULT_CONFIG: ThemeDerivationConfig = {
  variant: 'dark',
  // Default inversion curve: roughly inverts lightness with slight S-curve
  darkInversionCurve: [0.75, 0.9, 0.25, 0.1],
  darkChromaDamping: 0.85,
  darkHueShift: 0,
  hcMinContrast: 4.5,
  hcStrategy: 'lighten-darken',
  brandHueShift: 0,
  brandChromaScale: 1.0,
  brandLightnessAdj: 0,
};

const VARIANT_OPTIONS: ThemeVariant[] = ['dark', 'high-contrast', 'brand'];
const STRATEGY_OPTIONS: BoostStrategy[] = ['lighten-darken', 'maximize'];

interface ColorEntry {
  path: string;
  color: ColorValue;
}

interface ColorGroup {
  name: string;
  entries: ColorEntry[];
}

function extractColorGroups(colorTokens: TokenGroup | undefined): ColorGroup[] {
  if (!colorTokens) return [];
  const groups: ColorGroup[] = [];

  for (const [groupName, groupVal] of Object.entries(colorTokens)) {
    if (groupName.startsWith('$') || !groupVal || typeof groupVal !== 'object') continue;

    // Check if it's a direct token
    if ('$value' in groupVal && '$type' in groupVal) {
      const token = groupVal as unknown as DesignToken;
      if (token.$type === 'color' && typeof token.$value === 'object' && 'colorSpace' in (token.$value as object)) {
        groups.push({
          name: groupName,
          entries: [{ path: groupName, color: token.$value as ColorValue }],
        });
      }
      continue;
    }

    // It's a group — flatten it
    const flat = flattenTokenGroup(groupVal as TokenGroup, [groupName]);
    const entries: ColorEntry[] = [];
    for (const { path, token } of flat) {
      if (token.$type === 'color' && typeof token.$value === 'object' && 'colorSpace' in (token.$value as object)) {
        entries.push({ path: path.join('.'), color: token.$value as ColorValue });
      }
    }
    if (entries.length > 0) {
      groups.push({ name: groupName, entries });
    }
  }

  return groups;
}

function deriveDarkMode(
  color: ColorValue,
  inversionFn: (t: number) => number,
  chromaDamping: number,
  hueShift: number,
): ColorValue {
  const [l, c, h] = color.channels;
  const newL = inversionFn(l);
  const newC = c * chromaDamping;
  const newH = ((h + hueShift) % 360 + 360) % 360;
  return gamutMap(createColor(newL, newC, newH, color.alpha));
}

function deriveHighContrast(
  color: ColorValue,
  strategy: BoostStrategy,
  minContrast: number,
  bgRef: ColorValue,
): ColorValue {
  const [l, c, h] = color.channels;

  if (strategy === 'lighten-darken') {
    // If the color is light (L > 0.5), push it lighter; if dark, push darker
    let newL = l;
    const step = l > 0.5 ? 0.02 : -0.02;
    let candidate = gamutMap(createColor(newL, c, h, color.alpha));
    let ratio = contrastRatio(candidate, bgRef);
    let iterations = 0;
    while (ratio < minContrast && iterations < 50) {
      newL = Math.max(0, Math.min(1, newL + step));
      candidate = gamutMap(createColor(newL, c, h, color.alpha));
      ratio = contrastRatio(candidate, bgRef);
      iterations++;
      if (newL <= 0 || newL >= 1) break;
    }
    return candidate;
  }

  // Maximize distance: push very light or very dark
  const lightCandidate = gamutMap(createColor(0.97, c * 0.5, h, color.alpha));
  const darkCandidate = gamutMap(createColor(0.15, c * 0.8, h, color.alpha));
  const lightRatio = contrastRatio(lightCandidate, bgRef);
  const darkRatio = contrastRatio(darkCandidate, bgRef);
  return lightRatio > darkRatio ? lightCandidate : darkCandidate;
}

function deriveBrandVariant(
  color: ColorValue,
  hueShift: number,
  chromaScale: number,
  lightnessAdj: number,
): ColorValue {
  const [l, c, h] = color.channels;
  const newH = ((h + hueShift) % 360 + 360) % 360;
  const newC = Math.max(0, Math.min(0.4, c * chromaScale));
  const newL = Math.max(0, Math.min(1, l + lightnessAdj));
  return gamutMap(createColor(newL, newC, newH, color.alpha));
}

function ContrastBadge({ level }: { level: WCAGLevel }) {
  const styles: Record<WCAGLevel, string> = {
    'AAA': 'bg-success/15 text-success',
    'AA': 'bg-success/15 text-success',
    'AA-large': 'bg-warning/15 text-warning',
    'fail': 'bg-error/15 text-error',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${styles[level]}`}>
      {level}
    </span>
  );
}

function SampleUICard({
  label,
  bgColor,
  textColor,
  accentColor,
}: {
  label: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-lg border border-border-subtle/30 p-3 w-48 shrink-0"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-[10px] font-semibold mb-2" style={{ color: textColor }}>{label}</div>
      <div className="text-[9px] mb-2 opacity-80" style={{ color: textColor }}>
        Sample body text for the {label.toLowerCase()} theme.
      </div>
      <div
        className="rounded px-2 py-1 text-[9px] font-medium text-center"
        style={{ backgroundColor: accentColor, color: bgColor }}
      >
        Button
      </div>
    </div>
  );
}

export default function ThemeDerivationEngineTool() {
  const colorTokens = useTokenStore((s) => s.tokens.color);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['theme-derivation']) as ThemeDerivationConfig | undefined;

  const [config, setConfig] = useState<ThemeDerivationConfig>(storedConfig ?? DEFAULT_CONFIG);

  const update = (updates: Partial<ThemeDerivationConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const colorGroups = useMemo(() => extractColorGroups(colorTokens), [colorTokens]);

  const inversionFn = useMemo(
    () => createBezierEasing(config.darkInversionCurve),
    [config.darkInversionCurve],
  );

  // White and near-black reference colors for high contrast calculations
  const whiteRef = useMemo(() => createColor(1, 0, 0), []);
  const blackRef = useMemo(() => createColor(0, 0, 0), []);

  const derivedGroups = useMemo(() => {
    return colorGroups.map((group) => ({
      name: group.name,
      original: group.entries,
      derived: group.entries.map((entry) => {
        let derived: ColorValue;
        switch (config.variant) {
          case 'dark':
            derived = deriveDarkMode(entry.color, inversionFn, config.darkChromaDamping, config.darkHueShift);
            break;
          case 'high-contrast': {
            // Use mid-gray as reference to decide whether to lighten or darken
            const bgRef = entry.color.channels[0] > 0.5 ? blackRef : whiteRef;
            derived = deriveHighContrast(entry.color, config.hcStrategy, config.hcMinContrast, bgRef);
            break;
          }
          case 'brand':
            derived = deriveBrandVariant(entry.color, config.brandHueShift, config.brandChromaScale, config.brandLightnessAdj);
            break;
        }
        return { path: entry.path, color: derived };
      }),
    }));
  }, [colorGroups, config, inversionFn, whiteRef, blackRef]);

  // Contrast audit: check derived text-on-background pairs
  const contrastAudit = useMemo(() => {
    const results: Array<{
      fgPath: string;
      bgPath: string;
      ratio: number;
      level: WCAGLevel;
    }> = [];

    // For each group, check darkest derived color on lightest as text-on-bg
    for (const group of derivedGroups) {
      if (group.derived.length < 2) continue;
      const sorted = [...group.derived].sort((a, b) => a.color.channels[0] - b.color.channels[0]);
      const darkest = sorted[0];
      const lightest = sorted[sorted.length - 1];
      const ratio = contrastRatio(darkest.color, lightest.color);
      results.push({
        fgPath: darkest.path,
        bgPath: lightest.path,
        ratio: Math.round(ratio * 100) / 100,
        level: wcagLevel(ratio),
      });
    }
    return results;
  }, [derivedGroups]);

  // Write derived tokens to store
  useEffect(() => {
    const variantName = config.variant === 'high-contrast' ? 'high-contrast' : config.variant;
    const themeGroup: Record<string, unknown> = {
      $description: `Derived ${variantName} theme`,
    };
    for (const group of derivedGroups) {
      const groupTokens: Record<string, unknown> = { $type: 'color' as const };
      for (const entry of group.derived) {
        const segments = entry.path.split('.');
        const tokenName = segments[segments.length - 1];
        groupTokens[tokenName] = {
          $value: {
            colorSpace: 'oklch' as const,
            channels: [...entry.color.channels],
            alpha: entry.color.alpha,
          },
          $type: 'color' as const,
          $description: `Derived from ${entry.path}`,
          $extensions: {
            'com.dsw.generator': {
              toolId: 'theme-derivation',
              generatedAt: new Date().toISOString(),
              configHash: '',
            },
          },
        };
      }
      themeGroup[group.name] = groupTokens;
    }
    setTokenGroup(['themes', variantName], themeGroup as TokenGroup);
    setGeneratorConfig('theme-derivation', config);
  }, [config, derivedGroups, setTokenGroup, setGeneratorConfig]);

  // Pick representative colors for sample UI card
  const sampleColors = useMemo(() => {
    const allOriginal = colorGroups.flatMap((g) => g.entries);
    const allDerived = derivedGroups.flatMap((g) => g.derived);

    if (allOriginal.length === 0) return null;

    // Find lightest and darkest original for bg/text, mid for accent
    const sortedOrig = [...allOriginal].sort((a, b) => a.color.channels[0] - b.color.channels[0]);
    const sortedDerived = [...allDerived].sort((a, b) => a.color.channels[0] - b.color.channels[0]);

    const origBg = toHex(sortedOrig[sortedOrig.length - 1].color);
    const origText = toHex(sortedOrig[0].color);
    const origAccent = toHex(sortedOrig[Math.floor(sortedOrig.length / 2)].color);

    const derivedBg = toHex(sortedDerived[sortedDerived.length - 1].color);
    const derivedText = toHex(sortedDerived[0].color);
    const derivedAccent = toHex(sortedDerived[Math.floor(sortedDerived.length / 2)].color);

    return { origBg, origText, origAccent, derivedBg, derivedText, derivedAccent };
  }, [colorGroups, derivedGroups]);

  // CSS output
  const cssOutput = useMemo(() => {
    const lines: string[] = [];
    for (const group of derivedGroups) {
      for (const entry of group.derived) {
        const name = entry.path.replace(/\./g, '-');
        lines.push(`--theme-${config.variant}-${name}: ${toHex(entry.color)};`);
      }
    }
    return lines.join('\n');
  }, [derivedGroups, config.variant]);

  const hasColors = colorGroups.length > 0;

  return (
    <ToolLayout
      title="Theme Derivation Engine"
      description="Derive dark mode, high contrast, and brand variant themes from base color primitives"
    >
      <SplitPanel
        leftWidth="380px"
        left={
          <div>
            <ParameterSection title="Theme Variant">
              <div className="flex gap-1">
                {VARIANT_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => update({ variant: v })}
                    className={`flex-1 px-2 py-1 text-xs rounded capitalize transition-colors ${
                      config.variant === v
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    {v === 'high-contrast' ? 'High Contrast' : v === 'brand' ? 'Brand' : 'Dark Mode'}
                  </button>
                ))}
              </div>
            </ParameterSection>

            {config.variant === 'dark' && (
              <>
                <ParameterSection title="Lightness Inversion">
                  <BezierCurveEditor
                    value={config.darkInversionCurve}
                    onChange={(curve) => update({ darkInversionCurve: curve })}
                    width={340}
                    height={200}
                    xLabel="Input Lightness"
                    yLabel="Output Lightness"
                    showPresets={false}
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Maps input lightness to output. The default curve approximates inversion with adjustments
                    to preserve readability in dark themes.
                  </p>
                </ParameterSection>
                <ParameterSection title="Color Adjustments">
                  <SliderWithInput
                    label="Chroma Damping"
                    value={config.darkChromaDamping}
                    onChange={(v) => update({ darkChromaDamping: v })}
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    description="Reduce saturation for dark backgrounds"
                  />
                  <SliderWithInput
                    label="Hue Shift"
                    value={config.darkHueShift}
                    onChange={(v) => update({ darkHueShift: v })}
                    min={-30}
                    max={30}
                    step={1}
                    unit="deg"
                  />
                </ParameterSection>
              </>
            )}

            {config.variant === 'high-contrast' && (
              <>
                <ParameterSection title="Contrast Target">
                  <SliderWithInput
                    label="Min Contrast Ratio"
                    value={config.hcMinContrast}
                    onChange={(v) => update({ hcMinContrast: v })}
                    min={4.5}
                    max={7.0}
                    step={0.1}
                    description="WCAG AA = 4.5, AAA = 7.0"
                  />
                </ParameterSection>
                <ParameterSection title="Boost Strategy">
                  <div className="flex gap-1">
                    {STRATEGY_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => update({ hcStrategy: s })}
                        className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                          config.hcStrategy === s
                            ? 'bg-accent/10 text-accent border border-accent/30'
                            : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                        }`}
                      >
                        {s === 'lighten-darken' ? 'Lighten / Darken' : 'Maximize'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    {config.hcStrategy === 'lighten-darken'
                      ? 'Pushes light colors lighter and dark colors darker to increase contrast.'
                      : 'Maximizes distance by pushing colors to near-white or near-black.'}
                  </p>
                </ParameterSection>
              </>
            )}

            {config.variant === 'brand' && (
              <ParameterSection title="Brand Adjustments">
                <SliderWithInput
                  label="Hue Shift"
                  value={config.brandHueShift}
                  onChange={(v) => update({ brandHueShift: v })}
                  min={-180}
                  max={180}
                  step={1}
                  unit="deg"
                />
                <SliderWithInput
                  label="Chroma Scale"
                  value={config.brandChromaScale}
                  onChange={(v) => update({ brandChromaScale: v })}
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  unit="x"
                />
                <SliderWithInput
                  label="Lightness Adjustment"
                  value={config.brandLightnessAdj}
                  onChange={(v) => update({ brandLightnessAdj: v })}
                  min={-0.2}
                  max={0.2}
                  step={0.01}
                />
              </ParameterSection>
            )}
          </div>
        }
        right={
          <div className="p-6">
            {!hasColors ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-sm text-text-secondary mb-2">No color tokens found</div>
                <p className="text-xs text-text-tertiary max-w-xs">
                  Generate color palettes in the Color Lab first. This tool reads from the color
                  token group and derives theme variants algorithmically.
                </p>
              </div>
            ) : (
              <>
                {/* Palette Comparisons */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                  Palette Comparison
                </h3>
                <div className="space-y-6 mb-8">
                  {derivedGroups.map((group) => (
                    <div key={group.name}>
                      <div className="text-xs font-medium text-text-primary mb-2">{group.name}</div>
                      {/* Original row */}
                      <div className="mb-1">
                        <div className="text-[10px] text-text-tertiary mb-0.5">Original</div>
                        <div className="flex rounded-md overflow-hidden h-8">
                          {group.original.map((entry, i) => (
                            <div
                              key={i}
                              className="flex-1 relative group cursor-pointer"
                              style={{ backgroundColor: toHex(entry.color) }}
                              title={`${entry.path}: ${toHex(entry.color)}`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[7px] font-mono px-0.5 rounded bg-surface-0/70 text-text-primary">
                                  {toHex(entry.color)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Derived row */}
                      <div>
                        <div className="text-[10px] text-text-tertiary mb-0.5">
                          {config.variant === 'dark' ? 'Dark' : config.variant === 'high-contrast' ? 'High Contrast' : 'Brand'}
                        </div>
                        <div className="flex rounded-md overflow-hidden h-8">
                          {group.derived.map((entry, i) => (
                            <div
                              key={i}
                              className="flex-1 relative group cursor-pointer"
                              style={{ backgroundColor: toHex(entry.color) }}
                              title={`${entry.path}: ${toHex(entry.color)}`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[7px] font-mono px-0.5 rounded bg-surface-0/70 text-text-primary">
                                  {toHex(entry.color)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sample UI Cards */}
                {sampleColors && (
                  <>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                      UI Preview
                    </h3>
                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                      <SampleUICard
                        label="Base Theme"
                        bgColor={sampleColors.origBg}
                        textColor={sampleColors.origText}
                        accentColor={sampleColors.origAccent}
                      />
                      <SampleUICard
                        label={config.variant === 'dark' ? 'Dark Theme' : config.variant === 'high-contrast' ? 'High Contrast' : 'Brand Variant'}
                        bgColor={sampleColors.derivedBg}
                        textColor={sampleColors.derivedText}
                        accentColor={sampleColors.derivedAccent}
                      />
                    </div>
                  </>
                )}

                {/* Contrast Audit */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Contrast Audit
                </h3>
                {contrastAudit.length > 0 ? (
                  <div className="bg-surface-2 rounded-lg border border-border-subtle divide-y divide-border-subtle mb-8">
                    {contrastAudit.map((result, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <div className="text-[11px] text-text-secondary font-mono truncate max-w-[200px]">
                          {result.fgPath.split('.').pop()} / {result.bgPath.split('.').pop()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-text-tertiary font-mono">{result.ratio}:1</span>
                          <ContrastBadge level={result.level} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary mb-8">
                    Not enough color steps to perform contrast audit.
                  </p>
                )}

                {/* Token output */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Generated CSS
                </h3>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                  <pre>{cssOutput || '/* No tokens generated */'}</pre>
                </div>
              </>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
