import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Copy, Lock } from 'lucide-react';
import { nanoid } from 'nanoid';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput, BezierCurveEditor, ColorSwatch, PaletteRow } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import type { ColorLabConfig, PaletteConfig, BezierControlPoints } from '@/core/tokens/types';
import { DEFAULT_COLOR_LAB_CONFIG } from '@/core/tokens/defaults';
import { generatePalette, paletteToTokenGroup, type GeneratedPalette } from './colorGenerator';
import { toHex, toCssString } from '@/core/engine/color/oklch';

export default function ColorLabTool() {
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['color-lab']) as ColorLabConfig | undefined;

  const [config, setConfig] = useState<ColorLabConfig>(storedConfig ?? DEFAULT_COLOR_LAB_CONFIG);
  const [activePaletteIdx, setActivePaletteIdx] = useState(0);
  const [palettes, setPalettes] = useState<GeneratedPalette[]>([]);

  // Regenerate palettes when config changes
  useEffect(() => {
    const generated = config.palettes.map(generatePalette);
    setPalettes(generated);

    // Write to token store
    for (const p of generated) {
      setTokenGroup(['color', p.name], paletteToTokenGroup(p));
    }
    setGeneratorConfig('color-lab', config);
  }, [config, setTokenGroup, setGeneratorConfig]);

  const activePalette = config.palettes[activePaletteIdx];
  const activeGenerated = palettes[activePaletteIdx];

  const updateActivePalette = useCallback(
    (updates: Partial<PaletteConfig>) => {
      setConfig((prev) => ({
        ...prev,
        palettes: prev.palettes.map((p, i) =>
          i === activePaletteIdx ? { ...p, ...updates } : p,
        ),
      }));
    },
    [activePaletteIdx],
  );

  const updateCurve = useCallback(
    (channel: 'hue' | 'chroma' | 'lightness', curve: BezierControlPoints) => {
      updateActivePalette({
        [channel]: { ...activePalette[channel], curve },
      });
    },
    [activePalette, updateActivePalette],
  );

  const addPalette = () => {
    const newPalette: PaletteConfig = {
      id: nanoid(8),
      name: `palette-${config.palettes.length + 1}`,
      steps: 11,
      hue: { start: Math.random() * 360, end: Math.random() * 360, curve: [0, 0, 1, 1] },
      chroma: { start: 0.01, end: 0.01, curve: [0.25, 0.8, 0.75, 0.2] },
      lightness: { start: 0.97, end: 0.15, curve: [0, 0, 0.58, 1] },
    };
    setConfig((prev) => ({ ...prev, palettes: [...prev.palettes, newPalette] }));
    setActivePaletteIdx(config.palettes.length);
  };

  const removePalette = (idx: number) => {
    if (config.palettes.length <= 1) return;
    setConfig((prev) => ({
      ...prev,
      palettes: prev.palettes.filter((_, i) => i !== idx),
    }));
    setActivePaletteIdx((prev) => Math.min(prev, config.palettes.length - 2));
  };

  if (!activePalette) return null;

  return (
    <ToolLayout
      title="Color Lab"
      description="Procedural color palette generation using bezier curves in OKLCH space"
    >
      <SplitPanel
        leftWidth="380px"
        left={
          <div>
            {/* Palette selector */}
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Palettes</h3>
                <button
                  onClick={addPalette}
                  className="p-1 rounded hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                  title="Add palette"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {config.palettes.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePaletteIdx(i)}
                    className={`group flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                      i === activePaletteIdx
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {palettes[i]?.steps[5] && (
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: toHex(palettes[i].steps[5].gamutMapped) }}
                      />
                    )}
                    <span>{p.name}</span>
                    {config.palettes.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removePalette(i); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-error transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette name & steps */}
            <ParameterSection title="Palette Settings">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-text-secondary mb-1 block">Name</label>
                  <input
                    type="text"
                    value={activePalette.name}
                    onChange={(e) => updateActivePalette({ name: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
                <div className="w-20">
                  <SliderWithInput
                    label="Steps"
                    value={activePalette.steps}
                    onChange={(v) => updateActivePalette({ steps: v })}
                    min={3}
                    max={21}
                    step={1}
                  />
                </div>
              </div>
            </ParameterSection>

            {/* Hue curve */}
            <ParameterSection title="Hue">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <SliderWithInput
                    label="Start"
                    value={activePalette.hue.start}
                    onChange={(v) => updateActivePalette({ hue: { ...activePalette.hue, start: v } })}
                    min={0}
                    max={360}
                    step={1}
                    unit="deg"
                  />
                  <SliderWithInput
                    label="End"
                    value={activePalette.hue.end}
                    onChange={(v) => updateActivePalette({ hue: { ...activePalette.hue, end: v } })}
                    min={0}
                    max={360}
                    step={1}
                    unit="deg"
                  />
                </div>
              </div>
              <BezierCurveEditor
                value={activePalette.hue.curve}
                onChange={(curve) => updateCurve('hue', curve)}
                width={340}
                height={160}
                xLabel="Step"
                yLabel="Hue"
                showPresets={false}
              />
            </ParameterSection>

            {/* Chroma curve */}
            <ParameterSection title="Chroma">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <SliderWithInput
                    label="Start"
                    value={activePalette.chroma.start}
                    onChange={(v) => updateActivePalette({ chroma: { ...activePalette.chroma, start: v } })}
                    min={0}
                    max={0.37}
                    step={0.001}
                  />
                  <SliderWithInput
                    label="End"
                    value={activePalette.chroma.end}
                    onChange={(v) => updateActivePalette({ chroma: { ...activePalette.chroma, end: v } })}
                    min={0}
                    max={0.37}
                    step={0.001}
                  />
                </div>
              </div>
              <BezierCurveEditor
                value={activePalette.chroma.curve}
                onChange={(curve) => updateCurve('chroma', curve)}
                width={340}
                height={160}
                xLabel="Step"
                yLabel="Chroma"
                showPresets={false}
              />
            </ParameterSection>

            {/* Lightness curve */}
            <ParameterSection title="Lightness">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <SliderWithInput
                    label="Start"
                    value={activePalette.lightness.start}
                    onChange={(v) => updateActivePalette({ lightness: { ...activePalette.lightness, start: v } })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <SliderWithInput
                    label="End"
                    value={activePalette.lightness.end}
                    onChange={(v) => updateActivePalette({ lightness: { ...activePalette.lightness, end: v } })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
              <BezierCurveEditor
                value={activePalette.lightness.curve}
                onChange={(curve) => updateCurve('lightness', curve)}
                width={340}
                height={160}
                xLabel="Step"
                yLabel="Lightness"
                showPresets={false}
              />
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {/* All palettes overview */}
            <div className="space-y-6">
              {palettes.map((palette, pidx) => (
                <div key={config.palettes[pidx]?.id ?? pidx}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-text-primary">{palette.name}</h3>
                    <span className="text-xs text-text-tertiary">{palette.steps.length} steps</span>
                  </div>
                  {/* Continuous swatch strip */}
                  <div className="flex rounded-lg overflow-hidden h-14">
                    {palette.steps.map((step) => (
                      <div
                        key={step.index}
                        className="flex-1 relative group cursor-crosshair"
                        style={{ backgroundColor: toHex(step.gamutMapped) }}
                        title={`${step.label}: ${toHex(step.gamutMapped)}`}
                      >
                        <div className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-mono px-1 rounded bg-black/50 text-white">
                            {step.label}
                          </span>
                        </div>
                        {!step.inGamut && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-warning" />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Individual swatches with hex values */}
                  <div className="flex gap-0.5 mt-2">
                    {palette.steps.map((step) => (
                      <div key={step.index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full aspect-square rounded-md cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all"
                          style={{ backgroundColor: toHex(step.gamutMapped) }}
                          onClick={() => {
                            navigator.clipboard.writeText(toHex(step.gamutMapped));
                          }}
                          title="Click to copy hex"
                        />
                        <span className="text-[9px] text-text-tertiary mt-1 font-mono">{step.label}</span>
                        <span className="text-[8px] text-text-tertiary font-mono opacity-60">
                          {toHex(step.gamutMapped)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Token output preview */}
            {activeGenerated && (
              <div className="mt-8 border-t border-border-subtle pt-6">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Generated Tokens
                </h3>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                  <pre>{JSON.stringify(
                    Object.fromEntries(
                      activeGenerated.steps.map((s) => [
                        `color.${activeGenerated.name}.${s.label}`,
                        toCssString(s.gamutMapped),
                      ]),
                    ),
                    null,
                    2,
                  )}</pre>
                </div>
              </div>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
