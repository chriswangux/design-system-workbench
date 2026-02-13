import { useState, useEffect } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import type { ShadowLabConfig } from '@/core/tokens/types';
import { DEFAULT_SHADOW_LAB_CONFIG } from '@/core/tokens/defaults';
import { generateShadows, shadowsToTokenGroup, type GeneratedShadow } from './shadowGenerator';

export default function ShadowLabTool() {
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['shadow-lab']) as ShadowLabConfig | undefined;

  const [config, setConfig] = useState<ShadowLabConfig>(storedConfig ?? DEFAULT_SHADOW_LAB_CONFIG);
  const [shadows, setShadows] = useState<GeneratedShadow[]>([]);

  useEffect(() => {
    const generated = generateShadows(config);
    setShadows(generated);
    setTokenGroup(['shadow'], shadowsToTokenGroup(generated));
    setGeneratorConfig('shadow-lab', config);
  }, [config, setTokenGroup, setGeneratorConfig]);

  const update = (updates: Partial<ShadowLabConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ToolLayout
      title="Shadow / Elevation Lab"
      description="Generate shadow systems from light source parameters"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Light Source">
              <SliderWithInput
                label="X Position"
                value={config.lightSource.x}
                onChange={(v) => update({ lightSource: { ...config.lightSource, x: v } })}
                min={-1}
                max={1}
                step={0.05}
              />
              <SliderWithInput
                label="Y Position"
                value={config.lightSource.y}
                onChange={(v) => update({ lightSource: { ...config.lightSource, y: v } })}
                min={-1}
                max={0}
                step={0.05}
              />
              {/* Visual light source indicator */}
              <div className="flex justify-center mt-2">
                <div className="w-24 h-24 rounded-full bg-surface-2 border border-border-subtle relative">
                  <div
                    className="absolute w-3 h-3 rounded-full bg-accent"
                    style={{
                      left: `${50 + config.lightSource.x * 40}%`,
                      top: `${50 + config.lightSource.y * 40}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded bg-surface-3 border border-border" />
                  </div>
                </div>
              </div>
            </ParameterSection>

            <ParameterSection title="Elevation">
              <SliderWithInput
                label="Steps"
                value={config.elevationSteps}
                onChange={(v) => update({ elevationSteps: v })}
                min={2}
                max={8}
                step={1}
              />
            </ParameterSection>

            <ParameterSection title="Blur">
              <SliderWithInput
                label="Base Blur"
                value={config.baseBlur}
                onChange={(v) => update({ baseBlur: v })}
                min={0.5}
                max={10}
                step={0.5}
                unit="px"
              />
              <SliderWithInput
                label="Blur Growth"
                value={config.blurRatio}
                onChange={(v) => update({ blurRatio: v })}
                min={1}
                max={4}
                step={0.1}
                unit="x"
              />
            </ParameterSection>

            <ParameterSection title="Offset">
              <SliderWithInput
                label="Base Offset"
                value={config.baseOffset}
                onChange={(v) => update({ baseOffset: v })}
                min={0.5}
                max={8}
                step={0.5}
                unit="px"
              />
              <SliderWithInput
                label="Offset Growth"
                value={config.offsetRatio}
                onChange={(v) => update({ offsetRatio: v })}
                min={1}
                max={3}
                step={0.1}
                unit="x"
              />
            </ParameterSection>

            <ParameterSection title="Opacity">
              <SliderWithInput
                label="Directional"
                value={config.directionalOpacity}
                onChange={(v) => update({ directionalOpacity: v })}
                min={0}
                max={0.5}
                step={0.01}
              />
              <SliderWithInput
                label="Ambient"
                value={config.ambientOpacity}
                onChange={(v) => update({ ambientOpacity: v })}
                min={0}
                max={0.3}
                step={0.01}
              />
            </ParameterSection>

            <ParameterSection title="Spread">
              <div className="flex gap-1">
                {(['none', 'shrink', 'grow'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => update({ spreadBehavior: mode })}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      config.spreadBehavior === mode
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {/* Elevation showcase */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Elevation Steps
            </h3>
            <div className="flex gap-6 flex-wrap mb-8">
              {shadows.map((shadow) => (
                <div key={shadow.name} className="flex flex-col items-center gap-2">
                  <div
                    className="w-24 h-24 rounded-xl bg-surface-1 border border-border-subtle/30 flex items-center justify-center"
                    style={{ boxShadow: shadow.cssValue }}
                  >
                    <span className="text-xs text-text-tertiary">{shadow.name}</span>
                  </div>
                  <span className="text-[10px] text-text-tertiary font-mono">
                    shadow.{shadow.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Side-by-side comparison on cards */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Card Preview
            </h3>
            <div className="space-y-4 mb-8">
              {shadows.map((shadow) => (
                <div
                  key={shadow.name}
                  className="p-4 rounded-xl bg-surface-1 border border-border-subtle/20"
                  style={{ boxShadow: shadow.cssValue }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">Elevation {shadow.elevation}</div>
                      <div className="text-xs text-text-tertiary mt-0.5">shadow.{shadow.name}</div>
                    </div>
                    <code className="text-[10px] text-text-tertiary font-mono bg-surface-2 px-2 py-1 rounded max-w-sm truncate">
                      {shadow.cssValue}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {/* Token output */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Generated CSS
            </h3>
            <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
              <pre>{shadows.map((s) => `--shadow-${s.name}: ${s.cssValue};`).join('\n')}</pre>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
