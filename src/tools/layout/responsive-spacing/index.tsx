import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import type { TokenGroup, DesignToken, DimensionValue, BreakpointValue } from '@/core/tokens/types';

type ScalingStrategy = 'stepped' | 'fluid';

interface SpacingEntry {
  name: string;
  basePx: number;
}

interface BreakpointEntry {
  name: string;
  minWidthPx: number;
}

function extractSpacingEntries(group: TokenGroup | undefined): SpacingEntry[] {
  if (!group) return [];
  const flat = flattenTokenGroup(group);
  const entries: SpacingEntry[] = [];
  for (const { path, token } of flat) {
    // Skip responsive sub-group to avoid circular reads
    if (path[0] === 'responsive') continue;
    const val = token.$value;
    if (val && typeof val === 'object' && 'value' in val && 'unit' in val) {
      const dim = val as DimensionValue;
      entries.push({ name: path.join('.'), basePx: dim.value });
    }
  }
  return entries.sort((a, b) => a.basePx - b.basePx);
}

function extractBreakpointEntries(group: TokenGroup | undefined): BreakpointEntry[] {
  if (!group) return [];
  const flat = flattenTokenGroup(group);
  const entries: BreakpointEntry[] = [];
  for (const { path, token } of flat) {
    const val = token.$value;
    if (val && typeof val === 'object' && 'minWidth' in val) {
      const bp = val as BreakpointValue;
      entries.push({
        name: (bp.label ?? path.join('.')),
        minWidthPx: bp.minWidth.value,
      });
    }
  }
  return entries.sort((a, b) => a.minWidthPx - b.minWidthPx);
}

export default function ResponsiveSpacingTool() {
  const spacingGroup = useTokenStore((s) => s.tokens.spacing);
  const breakpointGroup = useTokenStore((s) => s.tokens.breakpoint);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);

  const spacingEntries = useMemo(() => extractSpacingEntries(spacingGroup), [spacingGroup]);
  const breakpointEntries = useMemo(() => extractBreakpointEntries(breakpointGroup), [breakpointGroup]);

  const [strategy, setStrategy] = useState<ScalingStrategy>('stepped');
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  // Initialize multipliers when breakpoints change
  const prevBpNamesRef = useRef<string>('');
  useEffect(() => {
    const key = breakpointEntries.map((b) => b.name).join(',');
    if (key !== prevBpNamesRef.current) {
      prevBpNamesRef.current = key;
      setMultipliers((prev) => {
        const next: Record<string, number> = {};
        for (let i = 0; i < breakpointEntries.length; i++) {
          const bp = breakpointEntries[i];
          next[bp.name] = prev[bp.name] ?? (i === 0 ? 1 : 1 + i * 0.25);
        }
        return next;
      });
    }
  }, [breakpointEntries]);

  const updateMultiplier = useCallback((bpName: string, value: number) => {
    setMultipliers((prev) => ({ ...prev, [bpName]: value }));
  }, []);

  // Build the matrix: for each spacing token * each breakpoint, compute the value
  const matrix = useMemo(() => {
    return spacingEntries.map((sp) => {
      const row: { bpName: string; value: number }[] = breakpointEntries.map((bp) => {
        const mult = multipliers[bp.name] ?? 1;
        return { bpName: bp.name, value: Math.round(sp.basePx * mult * 100) / 100 };
      });
      return { spacing: sp, values: row };
    });
  }, [spacingEntries, breakpointEntries, multipliers]);

  // Find max value for bar scaling
  const maxValue = useMemo(() => {
    let m = 1;
    for (const row of matrix) {
      for (const cell of row.values) {
        if (cell.value > m) m = cell.value;
      }
    }
    return m;
  }, [matrix]);

  // Generate CSS output
  const cssOutput = useMemo(() => {
    if (spacingEntries.length === 0 || breakpointEntries.length === 0) return '';
    const lines: string[] = [];

    if (strategy === 'fluid') {
      lines.push('/* Fluid responsive spacing using clamp() */');
      for (const sp of spacingEntries) {
        const sortedBps = [...breakpointEntries].sort((a, b) => a.minWidthPx - b.minWidthPx);
        const first = sortedBps[0];
        const last = sortedBps[sortedBps.length - 1];
        const minMult = multipliers[first.name] ?? 1;
        const maxMult = multipliers[last.name] ?? 1;
        const minVal = Math.round(sp.basePx * minMult * 100) / 100;
        const maxVal = Math.round(sp.basePx * maxMult * 100) / 100;
        const minPx = first.minWidthPx;
        const maxPx = last.minWidthPx;
        // Preferred = linear interpolation via vw
        const slope = (maxVal - minVal) / (maxPx - minPx);
        const vwCoeff = Math.round(slope * 100 * 10000) / 10000;
        const intercept = Math.round((minVal - slope * minPx) * 100) / 100;
        const preferred = `${intercept}px + ${vwCoeff}vw`;
        lines.push(`--spacing-${sp.name.replace(/\./g, '-')}: clamp(${minVal}px, ${preferred}, ${maxVal}px);`);
      }
    } else {
      lines.push('/* Stepped responsive spacing using media queries */');
      // Base values (smallest breakpoint)
      const firstBp = breakpointEntries[0];
      if (firstBp) {
        lines.push('');
        lines.push(':root {');
        for (const sp of spacingEntries) {
          const val = Math.round(sp.basePx * (multipliers[firstBp.name] ?? 1) * 100) / 100;
          lines.push(`  --spacing-${sp.name.replace(/\./g, '-')}: ${val}px;`);
        }
        lines.push('}');
      }
      // Media queries for remaining breakpoints
      for (let i = 1; i < breakpointEntries.length; i++) {
        const bp = breakpointEntries[i];
        lines.push('');
        lines.push(`@media (min-width: ${bp.minWidthPx}px) {`);
        lines.push('  :root {');
        for (const sp of spacingEntries) {
          const val = Math.round(sp.basePx * (multipliers[bp.name] ?? 1) * 100) / 100;
          lines.push(`    --spacing-${sp.name.replace(/\./g, '-')}: ${val}px;`);
        }
        lines.push('  }');
        lines.push('}');
      }
    }

    return lines.join('\n');
  }, [strategy, spacingEntries, breakpointEntries, multipliers]);

  // Write responsive tokens to store
  useEffect(() => {
    if (spacingEntries.length === 0 || breakpointEntries.length === 0) return;

    const responsiveGroup: TokenGroup = { $type: 'spacing' };
    for (const sp of spacingEntries) {
      const tokenName = sp.name.replace(/\./g, '-');
      if (strategy === 'fluid') {
        const sortedBps = [...breakpointEntries].sort((a, b) => a.minWidthPx - b.minWidthPx);
        const first = sortedBps[0];
        const last = sortedBps[sortedBps.length - 1];
        const minVal = Math.round(sp.basePx * (multipliers[first.name] ?? 1) * 100) / 100;
        const maxVal = Math.round(sp.basePx * (multipliers[last.name] ?? 1) * 100) / 100;
        const token: DesignToken = {
          $value: { value: maxVal, unit: 'px' } as DimensionValue,
          $type: 'dimension',
          $description: `Fluid: clamp(${minVal}px, ..., ${maxVal}px)`,
          $extensions: {
            'com.dsw.generator': { toolId: 'responsive-spacing', generatedAt: new Date().toISOString(), configHash: '' },
            'com.dsw.tier': 'semantic',
          },
        };
        responsiveGroup[tokenName] = token;
      } else {
        // Use the largest breakpoint value for the token
        const lastBp = breakpointEntries[breakpointEntries.length - 1];
        const val = Math.round(sp.basePx * (multipliers[lastBp.name] ?? 1) * 100) / 100;
        const token: DesignToken = {
          $value: { value: val, unit: 'px' } as DimensionValue,
          $type: 'dimension',
          $description: `Stepped responsive: ${breakpointEntries.map((bp) => `${bp.name}=${Math.round(sp.basePx * (multipliers[bp.name] ?? 1))}px`).join(', ')}`,
          $extensions: {
            'com.dsw.generator': { toolId: 'responsive-spacing', generatedAt: new Date().toISOString(), configHash: '' },
            'com.dsw.tier': 'semantic',
          },
        };
        responsiveGroup[tokenName] = token;
      }
    }
    setTokenGroup(['spacing', 'responsive'], responsiveGroup);
  }, [strategy, spacingEntries, breakpointEntries, multipliers, setTokenGroup]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cssOutput]);

  const hasData = spacingEntries.length > 0 && breakpointEntries.length > 0;

  return (
    <ToolLayout
      title="Responsive Spacing"
      description="Scale spacing tokens across breakpoints with stepped or fluid strategies"
    >
      <SplitPanel
        leftWidth="360px"
        left={
          <div>
            <ParameterSection title="Scaling Strategy">
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: 'stepped' as const, label: 'Stepped', desc: 'Discrete values per breakpoint' },
                  { id: 'fluid' as const, label: 'Fluid', desc: 'CSS clamp() between min/max' },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStrategy(opt.id)}
                    className={`px-3 py-2 rounded-md text-left transition-colors ${
                      strategy === opt.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    <span className="text-xs font-medium block">{opt.label}</span>
                    <span className="text-[10px] opacity-60 block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Breakpoint Multipliers">
              {breakpointEntries.length === 0 ? (
                <div className="p-3 rounded-md bg-surface-2 border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary">
                    No breakpoint tokens found.
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Use the Grid System Builder to define breakpoints first.
                  </p>
                </div>
              ) : (
                breakpointEntries.map((bp) => (
                  <SliderWithInput
                    key={bp.name}
                    label={`${bp.name} (${bp.minWidthPx}px)`}
                    value={multipliers[bp.name] ?? 1}
                    onChange={(v) => updateMultiplier(bp.name, v)}
                    min={0.5}
                    max={3}
                    step={0.05}
                    unit="x"
                    description={`Multiply base spacing by ${(multipliers[bp.name] ?? 1).toFixed(2)}`}
                  />
                ))
              )}
            </ParameterSection>

            {spacingEntries.length === 0 && (
              <ParameterSection title="Spacing Tokens">
                <div className="p-3 rounded-md bg-surface-2 border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary">
                    No spacing tokens found.
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Use the Spacing Lab to generate spacing tokens first.
                  </p>
                </div>
              </ParameterSection>
            )}

            {hasData && (
              <ParameterSection title="Summary">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Spacing tokens</span>
                    <span className="text-text-secondary font-mono">{spacingEntries.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Breakpoints</span>
                    <span className="text-text-secondary font-mono">{breakpointEntries.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Output values</span>
                    <span className="text-text-secondary font-mono">{spacingEntries.length * breakpointEntries.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Strategy</span>
                    <span className="text-text-secondary font-mono">{strategy === 'fluid' ? 'clamp()' : 'media queries'}</span>
                  </div>
                </div>
              </ParameterSection>
            )}
          </div>
        }
        right={
          <div className="p-6 space-y-6">
            {!hasData ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mb-3">
                  <span className="text-text-tertiary text-lg">&#8644;</span>
                </div>
                <p className="text-sm text-text-secondary">No Data Available</p>
                <p className="text-xs text-text-tertiary mt-1 max-w-xs">
                  Generate spacing tokens with the Spacing Lab and breakpoints with the Grid System Builder to populate this matrix.
                </p>
              </div>
            ) : (
              <>
                {/* Spacing Matrix */}
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Spacing Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left py-2 pr-3 text-text-tertiary font-medium sticky left-0 bg-surface-0 z-10">
                            Token
                          </th>
                          {breakpointEntries.map((bp) => (
                            <th key={bp.name} className="text-right py-2 px-2 text-text-tertiary font-medium whitespace-nowrap">
                              <div>{bp.name}</div>
                              <div className="text-[9px] opacity-60 font-normal">{(multipliers[bp.name] ?? 1).toFixed(2)}x</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.map((row) => (
                          <tr key={row.spacing.name} className="border-t border-border-subtle">
                            <td className="py-2 pr-3 font-mono text-text-primary whitespace-nowrap sticky left-0 bg-surface-0 z-10">
                              {row.spacing.name}
                              <span className="text-text-tertiary ml-1.5 text-[10px]">{row.spacing.basePx}px</span>
                            </td>
                            {row.values.map((cell) => (
                              <td key={cell.bpName} className="py-2 px-2 text-right">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="font-mono text-text-secondary">{cell.value}px</span>
                                  <div className="w-full h-1 rounded-full bg-surface-3 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-accent/60 transition-all duration-200"
                                      style={{ width: `${Math.max((cell.value / maxValue) * 100, 2)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Visual size comparison */}
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Size Comparison
                  </h3>
                  <div className="space-y-3">
                    {matrix.slice(0, 6).map((row) => (
                      <div key={row.spacing.name} className="space-y-1">
                        <span className="text-[10px] font-mono text-text-tertiary">{row.spacing.name}</span>
                        <div className="flex items-center gap-1.5">
                          {row.values.map((cell) => (
                            <div key={cell.bpName} className="flex flex-col items-center gap-0.5">
                              <div
                                className="bg-accent/30 rounded-sm border border-accent/20 transition-all duration-200"
                                style={{
                                  width: `${Math.max(Math.min(cell.value * 0.5, 60), 4)}px`,
                                  height: `${Math.max(Math.min(cell.value * 0.5, 60), 4)}px`,
                                }}
                              />
                              <span className="text-[8px] text-text-tertiary">{cell.bpName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CSS Output */}
                <div className="border-t border-border-subtle pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      CSS Output
                    </h3>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-64">
                    <pre>{cssOutput}</pre>
                  </div>
                </div>
              </>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
