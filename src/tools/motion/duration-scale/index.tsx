import { useState, useEffect, useMemo, useRef } from 'react';
import { Play } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import type { MotionConfig, DesignToken, TokenGroup } from '@/core/tokens/types';
import { DEFAULT_MOTION_CONFIG } from '@/core/tokens/defaults';
import { generateDurationScale } from '@/core/engine/math/scales';

const DURATION_NAMES = ['instant', 'fast', 'normal', 'slow', 'slower', 'slowest', 'glacial', 'eternal'];

function DurationBar({ name, duration, maxDuration }: { name: string; duration: number; maxDuration: number }) {
  const [animating, setAnimating] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const playAnimation = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), duration + 100);
  };

  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs font-mono text-text-tertiary w-16 text-right shrink-0">{name}</span>
      <div className="flex-1 h-8 bg-surface-2 rounded relative overflow-hidden">
        <div
          className="h-full bg-accent/30 rounded"
          style={{ width: `${Math.max((duration / maxDuration) * 100, 2)}%` }}
        />
        {/* Animated indicator */}
        <div
          ref={barRef}
          className="absolute top-1 left-1 bottom-1 w-5 rounded bg-accent"
          style={{
            transform: animating ? `translateX(calc(${(duration / maxDuration) * 100}% * 3))` : 'translateX(0)',
            transition: animating ? `transform ${duration}ms ease-out` : 'none',
            opacity: animating ? 1 : 0,
          }}
        />
      </div>
      <span className="text-xs font-mono text-text-primary w-16 text-right shrink-0">{duration}ms</span>
      <button
        onClick={playAnimation}
        className="p-1 rounded hover:bg-surface-3 text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
        title="Play animation"
      >
        <Play size={12} />
      </button>
    </div>
  );
}

function TransitionDemo({ duration }: { duration: number }) {
  const [active, setActive] = useState(false);

  return (
    <button
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className="w-full h-10 rounded-lg border border-border-subtle relative overflow-hidden"
      style={{
        transition: `all ${duration}ms ease-out`,
        backgroundColor: active ? 'var(--color-accent)' : 'var(--color-surface-2)',
      }}
    >
      <span
        className="text-xs font-mono"
        style={{
          transition: `color ${duration}ms ease-out`,
          color: active ? 'white' : 'var(--color-text-tertiary)',
        }}
      >
        {duration}ms — hover me
      </span>
    </button>
  );
}

export default function DurationScaleTool() {
  const initialConfig = useRef(
    (useTokenStore.getState().generatorConfigs['motion'] as MotionConfig | undefined) ?? DEFAULT_MOTION_CONFIG,
  );
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);

  const [baseDuration, setBaseDuration] = useState(initialConfig.current.baseDuration);
  const [ratio, setRatio] = useState(initialConfig.current.durationRatio);
  const [steps, setSteps] = useState(initialConfig.current.durationSteps);

  const durations = useMemo(() => generateDurationScale(baseDuration, ratio, steps), [baseDuration, ratio, steps]);
  const maxDuration = durations[durations.length - 1] ?? 1;

  useEffect(() => {
    // Write duration tokens
    const durationGroup: TokenGroup = { $type: 'duration' };
    for (let i = 0; i < durations.length; i++) {
      const name = DURATION_NAMES[i] ?? `step-${i + 1}`;
      const token: DesignToken = {
        $value: { value: durations[i], unit: 'ms' },
        $type: 'duration',
        $extensions: {
          'com.dsw.generator': { toolId: 'motion', generatedAt: new Date().toISOString(), configHash: '' },
          'com.dsw.tier': 'primitive',
        },
      };
      durationGroup[name] = token;
    }

    setTokenGroup(['motion', 'duration'], durationGroup);

    // Read current config snapshot to avoid subscribing to store changes
    const currentConfig = (useTokenStore.getState().generatorConfigs['motion'] as MotionConfig | undefined) ?? DEFAULT_MOTION_CONFIG;
    setGeneratorConfig('motion', {
      ...currentConfig,
      baseDuration,
      durationRatio: ratio,
      durationSteps: steps,
    });
  }, [baseDuration, ratio, steps, durations, setTokenGroup, setGeneratorConfig]);

  return (
    <ToolLayout
      title="Duration Scale"
      description="Generate a consistent duration scale for animation timing"
    >
      <SplitPanel
        leftWidth="320px"
        left={
          <div>
            <ParameterSection title="Base Duration">
              <SliderWithInput
                label="Base"
                value={baseDuration}
                onChange={setBaseDuration}
                min={50}
                max={500}
                step={10}
                unit="ms"
                description="The fastest meaningful animation duration"
              />
            </ParameterSection>

            <ParameterSection title="Growth">
              <SliderWithInput
                label="Ratio"
                value={ratio}
                onChange={setRatio}
                min={1.1}
                max={3}
                step={0.1}
                unit="x"
                description="Multiplier between consecutive steps"
              />
            </ParameterSection>

            <ParameterSection title="Steps">
              <SliderWithInput
                label="Count"
                value={steps}
                onChange={setSteps}
                min={3}
                max={8}
                step={1}
              />
            </ParameterSection>

            {/* Quick info */}
            <div className="px-4 py-3 border-t border-border-subtle">
              <div className="text-[10px] text-text-tertiary space-y-1">
                <p>Range: {durations[0]}ms — {maxDuration}ms</p>
                <p>Formula: {baseDuration} x {ratio}^n</p>
                <p>Use faster durations for micro-interactions (hover, focus) and slower for layout transitions (page, modal).</p>
              </div>
            </div>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Duration bars */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Duration Scale
              </h3>
              <div className="space-y-2">
                {durations.map((d, i) => (
                  <DurationBar
                    key={i}
                    name={DURATION_NAMES[i] ?? `${i + 1}`}
                    duration={d}
                    maxDuration={maxDuration}
                  />
                ))}
              </div>
            </div>

            {/* Interactive hover demos */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Hover Transition Preview
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {durations.map((d, i) => (
                  <TransitionDemo key={i} duration={d} />
                ))}
              </div>
            </div>

            {/* Usage guidance */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Recommended Usage
              </h3>
              <div className="space-y-2">
                {durations.map((d, i) => {
                  const name = DURATION_NAMES[i] ?? `step-${i + 1}`;
                  const usages: Record<string, string> = {
                    instant: 'Micro-feedback: button press, checkbox toggle, ripple',
                    fast: 'Hover states, focus rings, tooltip show/hide',
                    normal: 'Menu open/close, dropdown, accordion expand',
                    slow: 'Modal entrance, sidebar slide, page section reveal',
                    slower: 'Full page transitions, complex layout shifts',
                    slowest: 'Onboarding sequences, skeleton loading states',
                  };
                  return (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="font-mono text-accent w-16 text-right shrink-0">{name}</span>
                      <span className="text-text-tertiary">{usages[name] ?? 'Extended animations'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Token output */}
            <div className="border-t border-border-subtle pt-6">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Generated Tokens
              </h3>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary">
                <pre>{durations.map((d, i) => {
                  const name = DURATION_NAMES[i] ?? `step-${i + 1}`;
                  return `--duration-${name}: ${d}ms;`;
                }).join('\n')}</pre>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
