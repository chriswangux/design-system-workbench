import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import type { GridBuilderConfig, DesignToken, TokenGroup, GridValue, BreakpointValue } from '@/core/tokens/types';
import { DEFAULT_GRID_CONFIG } from '@/core/tokens/defaults';

type BreakpointConfig = GridBuilderConfig['breakpoints'][0];

export default function GridSystemBuilderTool() {
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['grid-builder']) as GridBuilderConfig | undefined;

  const [config, setConfig] = useState<GridBuilderConfig>(storedConfig ?? DEFAULT_GRID_CONFIG);
  const [activeIdx, setActiveIdx] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(1024);

  useEffect(() => {
    // Write grid tokens
    const gridGroup: TokenGroup = { $type: 'grid' };
    const breakpointGroup: TokenGroup = { $type: 'breakpoint' };

    for (const bp of config.breakpoints) {
      const gridToken: DesignToken = {
        $value: {
          columns: bp.columns,
          gutter: { value: bp.gutter, unit: 'px' },
          margin: { value: bp.margin, unit: 'px' },
          ...(bp.maxWidth ? { maxWidth: { value: bp.maxWidth, unit: 'px' } } : {}),
        } as GridValue,
        $type: 'grid',
        $extensions: {
          'com.dsw.generator': { toolId: 'grid-builder', generatedAt: new Date().toISOString(), configHash: '' },
          'com.dsw.tier': 'primitive',
        },
      };
      gridGroup[bp.name] = gridToken;

      const bpToken: DesignToken = {
        $value: { minWidth: { value: bp.minWidth, unit: 'px' }, label: bp.name } as BreakpointValue,
        $type: 'breakpoint',
      };
      breakpointGroup[bp.name] = bpToken;
    }

    setTokenGroup(['grid'], gridGroup);
    setTokenGroup(['breakpoint'], breakpointGroup);
    setGeneratorConfig('grid-builder', config);
  }, [config, setTokenGroup, setGeneratorConfig]);

  const activeBp = config.breakpoints[activeIdx];

  const updateBreakpoint = (idx: number, updates: Partial<BreakpointConfig>) => {
    setConfig((prev) => ({
      ...prev,
      breakpoints: prev.breakpoints.map((bp, i) =>
        i === idx ? { ...bp, ...updates } : bp,
      ),
    }));
  };

  const addBreakpoint = () => {
    const last = config.breakpoints[config.breakpoints.length - 1];
    const newBp: BreakpointConfig = {
      name: `bp-${config.breakpoints.length + 1}`,
      minWidth: (last?.minWidth ?? 1024) + 256,
      columns: 12,
      gutter: 32,
      margin: 40,
    };
    setConfig((prev) => ({ ...prev, breakpoints: [...prev.breakpoints, newBp] }));
    setActiveIdx(config.breakpoints.length);
  };

  const removeBreakpoint = (idx: number) => {
    if (config.breakpoints.length <= 1) return;
    setConfig((prev) => ({
      ...prev,
      breakpoints: prev.breakpoints.filter((_, i) => i !== idx),
    }));
    setActiveIdx((prev) => Math.min(prev, config.breakpoints.length - 2));
  };

  // Find the active breakpoint for the preview width
  const activeForPreview = [...config.breakpoints]
    .sort((a, b) => b.minWidth - a.minWidth)
    .find((bp) => previewWidth >= bp.minWidth) ?? config.breakpoints[0];

  if (!activeBp) return null;

  return (
    <ToolLayout
      title="Grid System Builder"
      description="Define responsive column grids with gutter, margin, and breakpoint behavior"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            {/* Breakpoint selector */}
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Breakpoints</h3>
                <button onClick={addBreakpoint} className="text-xs text-accent hover:text-accent-hover">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {config.breakpoints.map((bp, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`group flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      i === activeIdx
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    <span>{bp.name}</span>
                    <span className="text-[10px] opacity-60">{bp.minWidth}px</span>
                    {config.breakpoints.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeBreakpoint(i); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-error"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <ParameterSection title="Breakpoint Settings">
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Name</label>
                  <input
                    type="text"
                    value={activeBp.name}
                    onChange={(e) => updateBreakpoint(activeIdx, { name: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
                <SliderWithInput
                  label="Min Width"
                  value={activeBp.minWidth}
                  onChange={(v) => updateBreakpoint(activeIdx, { minWidth: v })}
                  min={320}
                  max={1920}
                  step={8}
                  unit="px"
                />
              </div>
            </ParameterSection>

            <ParameterSection title="Grid">
              <SliderWithInput
                label="Columns"
                value={activeBp.columns}
                onChange={(v) => updateBreakpoint(activeIdx, { columns: v })}
                min={1}
                max={16}
                step={1}
              />
              <SliderWithInput
                label="Gutter"
                value={activeBp.gutter}
                onChange={(v) => updateBreakpoint(activeIdx, { gutter: v })}
                min={0}
                max={64}
                step={4}
                unit="px"
              />
              <SliderWithInput
                label="Margin"
                value={activeBp.margin}
                onChange={(v) => updateBreakpoint(activeIdx, { margin: v })}
                min={0}
                max={80}
                step={4}
                unit="px"
              />
              <SliderWithInput
                label="Max Width"
                value={activeBp.maxWidth ?? 0}
                onChange={(v) => updateBreakpoint(activeIdx, { maxWidth: v === 0 ? undefined : v })}
                min={0}
                max={1920}
                step={8}
                unit="px"
                description="0 = no max width (fluid)"
              />
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Preview width slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Grid Preview
                </h3>
                <span className="text-xs font-mono text-text-tertiary">
                  {previewWidth}px — using <span className="text-accent">{activeForPreview?.name}</span>
                </span>
              </div>
              <input
                type="range"
                value={previewWidth}
                onChange={(e) => setPreviewWidth(parseInt(e.target.value))}
                min={320}
                max={1440}
                step={1}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((previewWidth - 320) / (1440 - 320)) * 100}%, var(--color-surface-3) ${((previewWidth - 320) / (1440 - 320)) * 100}%, var(--color-surface-3) 100%)`,
                }}
              />
              {/* Breakpoint indicators */}
              <div className="relative h-4 mt-1">
                {config.breakpoints.map((bp, i) => {
                  const pct = ((bp.minWidth - 320) / (1440 - 320)) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 flex flex-col items-center"
                      style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
                    >
                      <div className="w-px h-2 bg-text-tertiary" />
                      <span className="text-[8px] text-text-tertiary mt-0.5">{bp.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid visualization */}
            {activeForPreview && (
              <div className="flex justify-center">
                <div
                  className="bg-surface-2 border border-border-subtle rounded-lg overflow-hidden relative"
                  style={{
                    width: `${Math.min(previewWidth * 0.5, 700)}px`,
                    height: '200px',
                  }}
                >
                  {/* Margin areas */}
                  <div
                    className="absolute inset-y-0 left-0 bg-warning/10 border-r border-warning/30"
                    style={{ width: `${(activeForPreview.margin / previewWidth) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 bg-warning/10 border-l border-warning/30"
                    style={{ width: `${(activeForPreview.margin / previewWidth) * 100}%` }}
                  />

                  {/* Columns */}
                  <div
                    className="absolute inset-y-0 flex"
                    style={{
                      left: `${(activeForPreview.margin / previewWidth) * 100}%`,
                      right: `${(activeForPreview.margin / previewWidth) * 100}%`,
                    }}
                  >
                    {Array.from({ length: activeForPreview.columns }).map((_, i) => {
                      const contentWidth = previewWidth - activeForPreview.margin * 2;
                      const totalGutters = (activeForPreview.columns - 1) * activeForPreview.gutter;
                      const colWidth = (contentWidth - totalGutters) / activeForPreview.columns;
                      const gutterPct = (activeForPreview.gutter / contentWidth) * 100;
                      const colPct = (colWidth / contentWidth) * 100;

                      return (
                        <div key={i} className="flex" style={{ width: `${colPct + (i < activeForPreview.columns - 1 ? gutterPct : 0)}%` }}>
                          <div className="flex-1 bg-accent/15 border-x border-accent/20" />
                          {i < activeForPreview.columns - 1 && (
                            <div style={{ width: `${(activeForPreview.gutter / (colWidth + activeForPreview.gutter)) * 100}%` }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Labels */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <span className="text-[9px] font-mono text-text-tertiary bg-surface-0/80 px-1.5 py-0.5 rounded">
                      {activeForPreview.columns} cols / {activeForPreview.gutter}px gutter / {activeForPreview.margin}px margin
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* All breakpoints summary */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Breakpoint Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2 text-text-tertiary font-medium">Name</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Min Width</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Columns</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Gutter</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Margin</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Max Width</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.breakpoints.map((bp, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border-subtle cursor-pointer hover:bg-surface-2 transition-colors ${
                          i === activeIdx ? 'bg-accent/5' : ''
                        }`}
                        onClick={() => setActiveIdx(i)}
                      >
                        <td className="py-2 font-mono text-text-primary">{bp.name}</td>
                        <td className="py-2 text-right font-mono text-text-secondary">{bp.minWidth}px</td>
                        <td className="py-2 text-right font-mono text-text-secondary">{bp.columns}</td>
                        <td className="py-2 text-right font-mono text-text-secondary">{bp.gutter}px</td>
                        <td className="py-2 text-right font-mono text-text-secondary">{bp.margin}px</td>
                        <td className="py-2 text-right font-mono text-text-secondary">{bp.maxWidth ? `${bp.maxWidth}px` : 'fluid'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Token output */}
            <div className="border-t border-border-subtle pt-6">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Generated CSS
              </h3>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                <pre>{config.breakpoints.map((bp) =>
                  `/* ${bp.name}: >= ${bp.minWidth}px */\n--grid-${bp.name}-columns: ${bp.columns};\n--grid-${bp.name}-gutter: ${bp.gutter}px;\n--grid-${bp.name}-margin: ${bp.margin}px;${bp.maxWidth ? `\n--grid-${bp.name}-max-width: ${bp.maxWidth}px;` : ''}`
                ).join('\n\n')}</pre>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
