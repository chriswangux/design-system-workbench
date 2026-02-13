import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput, BezierCurveEditor } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import type { MotionConfig, EasingCurveConfig, CubicBezierValue, SpringConfig, DesignToken, TokenGroup } from '@/core/tokens/types';
import { DEFAULT_MOTION_CONFIG } from '@/core/tokens/defaults';
import { simulateSpring, springToBezier, springDuration, SPRING_PRESETS } from '@/core/engine/math/spring';
import { generateDurationScale } from '@/core/engine/math/scales';
import { nanoid } from 'nanoid';

function easingToTokenGroup(config: MotionConfig): TokenGroup {
  const easing: TokenGroup = { $type: 'cubicBezier' };
  for (const curve of config.easingCurves) {
    const bezierValue: CubicBezierValue = curve.type === 'bezier'
      ? curve.bezier ?? [0, 0, 1, 1]
      : springToBezier(curve.spring ?? { stiffness: 200, damping: 20, mass: 1 });
    const token: DesignToken = {
      $value: bezierValue,
      $type: 'cubicBezier',
      $extensions: {
        'com.dsw.generator': { toolId: 'motion', generatedAt: new Date().toISOString(), configHash: '' },
        'com.dsw.tier': 'primitive',
        ...(curve.type === 'spring' && curve.spring ? { 'com.dsw.spring': curve.spring } : {}),
      },
    };
    easing[curve.name.toLowerCase().replace(/\s+/g, '-')] = token;
  }

  const duration: TokenGroup = { $type: 'duration' };
  const durations = generateDurationScale(config.baseDuration, config.durationRatio, config.durationSteps);
  const durationNames = ['instant', 'fast', 'normal', 'slow', 'slower', 'slowest', 'glacial', 'eternal'];
  for (let i = 0; i < durations.length; i++) {
    const name = durationNames[i] ?? `${i + 1}`;
    const token: DesignToken = {
      $value: { value: durations[i], unit: 'ms' },
      $type: 'duration',
      $extensions: {
        'com.dsw.generator': { toolId: 'motion', generatedAt: new Date().toISOString(), configHash: '' },
        'com.dsw.tier': 'primitive',
      },
    };
    duration[name] = token;
  }

  return { easing, duration };
}

function AnimationPreview({ bezier: _bezier, springConfig, type }: { bezier: CubicBezierValue; springConfig?: SpringConfig; type: 'bezier' | 'spring' }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const springFrames = useRef<number[]>([]);

  const duration = type === 'spring' && springConfig
    ? springDuration(springConfig)
    : 600;

  useEffect(() => {
    if (type === 'spring' && springConfig) {
      const keyframes = simulateSpring(springConfig, 1);
      springFrames.current = keyframes.map((kf) => kf.position);
    }
  }, [type, springConfig]);

  const play = () => {
    setPlaying(true);
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      setProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setProgress(0);
  };

  // Calculate eased progress
  let easedProgress: number;
  if (type === 'spring' && springFrames.current.length > 0) {
    const idx = Math.floor(progress * (springFrames.current.length - 1));
    easedProgress = springFrames.current[Math.min(idx, springFrames.current.length - 1)];
  } else {
    // Simple fallback - real bezier applied via CSS
    easedProgress = progress;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={playing ? reset : play}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
          {playing ? 'Stop' : 'Play'}
        </button>
        <button
          onClick={reset}
          className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <RotateCcw size={14} />
        </button>
        <span className="text-[10px] text-text-tertiary self-center">{Math.round(duration)}ms</span>
      </div>

      {/* Translation preview */}
      <div className="space-y-2">
        <div className="text-[10px] text-text-tertiary">Translate X</div>
        <div className="h-8 bg-surface-2 rounded relative overflow-hidden">
          <div
            className="absolute top-1 left-0 w-6 h-6 rounded bg-accent"
            style={{
              transform: `translateX(${easedProgress * 200}px)`,
              transition: playing ? 'none' : undefined,
            }}
          />
        </div>
      </div>

      {/* Scale preview */}
      <div className="space-y-2">
        <div className="text-[10px] text-text-tertiary">Scale</div>
        <div className="h-12 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-lg bg-accent/80"
            style={{
              transform: `scale(${0.5 + easedProgress * 0.5})`,
              transition: playing ? 'none' : undefined,
            }}
          />
        </div>
      </div>

      {/* Opacity preview */}
      <div className="space-y-2">
        <div className="text-[10px] text-text-tertiary">Opacity</div>
        <div className="h-8 flex items-center">
          <div
            className="w-full h-6 rounded bg-accent"
            style={{
              opacity: easedProgress,
              transition: playing ? 'none' : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function EasingCurveEditorTool() {
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['motion']) as MotionConfig | undefined;

  const [config, setConfig] = useState<MotionConfig>(storedConfig ?? DEFAULT_MOTION_CONFIG);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const tokenGroup = easingToTokenGroup(config);
    setTokenGroup(['motion'], tokenGroup);
    setGeneratorConfig('motion', config);
  }, [config, setTokenGroup, setGeneratorConfig]);

  const activeCurve = config.easingCurves[activeIdx];

  const updateCurve = (updates: Partial<EasingCurveConfig>) => {
    setConfig((prev) => ({
      ...prev,
      easingCurves: prev.easingCurves.map((c, i) =>
        i === activeIdx ? { ...c, ...updates } : c,
      ),
    }));
  };

  const addCurve = () => {
    const newCurve: EasingCurveConfig = {
      id: nanoid(8),
      name: `Curve ${config.easingCurves.length + 1}`,
      type: 'bezier',
      bezier: [0.25, 0.1, 0.25, 1],
    };
    setConfig((prev) => ({
      ...prev,
      easingCurves: [...prev.easingCurves, newCurve],
    }));
    setActiveIdx(config.easingCurves.length);
  };

  if (!activeCurve) return null;

  const durations = generateDurationScale(config.baseDuration, config.durationRatio, config.durationSteps);

  return (
    <ToolLayout
      title="Easing Curve Editor"
      description="Define cubic bezier and spring easing curves for animation"
    >
      <SplitPanel
        leftWidth="380px"
        left={
          <div>
            {/* Curve selector */}
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Curves</h3>
                <button
                  onClick={addCurve}
                  className="text-xs text-accent hover:text-accent-hover"
                >+ Add</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {config.easingCurves.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveIdx(i)}
                    className={`group flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      i === activeIdx
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.type === 'spring' ? 'bg-success' : 'bg-accent'}`} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <ParameterSection title="Curve Settings">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={activeCurve.name}
                  onChange={(e) => updateCurve({ name: e.target.value })}
                  className="flex-1 bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div className="flex gap-1 mb-3">
                {(['bezier', 'spring'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateCurve({
                      type,
                      ...(type === 'spring' && !activeCurve.spring
                        ? { spring: SPRING_PRESETS.default }
                        : {}),
                      ...(type === 'bezier' && !activeCurve.bezier
                        ? { bezier: [0.25, 0.1, 0.25, 1] as CubicBezierValue }
                        : {}),
                    })}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors capitalize ${
                      activeCurve.type === type
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </ParameterSection>

            {activeCurve.type === 'bezier' && (
              <ParameterSection title="Bezier Curve">
                <BezierCurveEditor
                  value={activeCurve.bezier ?? [0.25, 0.1, 0.25, 1]}
                  onChange={(bezier) => updateCurve({ bezier })}
                  width={340}
                  height={240}
                  xLabel="Time"
                  yLabel="Progress"
                  showPresets
                />
              </ParameterSection>
            )}

            {activeCurve.type === 'spring' && (
              <ParameterSection title="Spring Physics">
                <SliderWithInput
                  label="Stiffness"
                  value={activeCurve.spring?.stiffness ?? 200}
                  onChange={(v) => updateCurve({ spring: { ...(activeCurve.spring ?? SPRING_PRESETS.default), stiffness: v } })}
                  min={50}
                  max={1000}
                  step={10}
                />
                <SliderWithInput
                  label="Damping"
                  value={activeCurve.spring?.damping ?? 20}
                  onChange={(v) => updateCurve({ spring: { ...(activeCurve.spring ?? SPRING_PRESETS.default), damping: v } })}
                  min={1}
                  max={100}
                  step={1}
                />
                <SliderWithInput
                  label="Mass"
                  value={activeCurve.spring?.mass ?? 1}
                  onChange={(v) => updateCurve({ spring: { ...(activeCurve.spring ?? SPRING_PRESETS.default), mass: v } })}
                  min={0.1}
                  max={10}
                  step={0.1}
                />
                {/* Spring presets */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(SPRING_PRESETS).map(([name, preset]) => (
                    <button
                      key={name}
                      onClick={() => updateCurve({ spring: preset })}
                      className="px-1.5 py-0.5 text-[10px] rounded border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border transition-colors capitalize"
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {/* Spring visualization */}
                <div className="mt-3">
                  <SpringCurveViz config={activeCurve.spring ?? SPRING_PRESETS.default} />
                </div>
              </ParameterSection>
            )}

            <ParameterSection title="Duration Scale">
              <SliderWithInput
                label="Base Duration"
                value={config.baseDuration}
                onChange={(v) => setConfig((prev) => ({ ...prev, baseDuration: v }))}
                min={50}
                max={500}
                step={10}
                unit="ms"
              />
              <SliderWithInput
                label="Ratio"
                value={config.durationRatio}
                onChange={(v) => setConfig((prev) => ({ ...prev, durationRatio: v }))}
                min={1.1}
                max={3}
                step={0.1}
                unit="x"
              />
              <SliderWithInput
                label="Steps"
                value={config.durationSteps}
                onChange={(v) => setConfig((prev) => ({ ...prev, durationSteps: v }))}
                min={3}
                max={8}
                step={1}
              />
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Animation preview */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Animation Preview — {activeCurve.name}
              </h3>
              <AnimationPreview
                bezier={activeCurve.bezier ?? [0.25, 0.1, 0.25, 1]}
                springConfig={activeCurve.spring}
                type={activeCurve.type}
              />
            </div>

            {/* Duration scale visualization */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Duration Scale
              </h3>
              <div className="space-y-2">
                {durations.map((d, i) => {
                  const names = ['instant', 'fast', 'normal', 'slow', 'slower', 'slowest', 'glacial', 'eternal'];
                  const name = names[i] ?? `${i + 1}`;
                  const maxDur = durations[durations.length - 1];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-text-tertiary w-16 text-right">{name}</span>
                      <div className="flex-1 h-4 bg-surface-2 rounded overflow-hidden">
                        <div
                          className="h-full bg-accent/60 rounded"
                          style={{ width: `${(d / maxDur) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-text-tertiary w-16">{d}ms</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All curves overview */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                All Easing Curves
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {config.easingCurves.map((curve) => {
                  const b = curve.type === 'bezier'
                    ? curve.bezier ?? [0, 0, 1, 1]
                    : springToBezier(curve.spring ?? SPRING_PRESETS.default);
                  return (
                    <div key={curve.id} className="bg-surface-2 rounded-lg p-3 border border-border-subtle">
                      <div className="text-xs font-medium text-text-primary mb-1">{curve.name}</div>
                      <div className="text-[10px] text-text-tertiary font-mono">
                        {curve.type === 'bezier'
                          ? `cubic-bezier(${b.map((v) => v.toFixed(2)).join(', ')})`
                          : `spring(${curve.spring?.stiffness}, ${curve.spring?.damping}, ${curve.spring?.mass})`
                        }
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5 capitalize">{curve.type}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Token output */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Generated Tokens
              </h3>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                <pre>{config.easingCurves.map((c) => {
                  const b = c.type === 'bezier'
                    ? c.bezier ?? [0, 0, 1, 1]
                    : springToBezier(c.spring ?? SPRING_PRESETS.default);
                  return `--ease-${c.name.toLowerCase().replace(/\s+/g, '-')}: cubic-bezier(${b.map((v) => v.toFixed(2)).join(', ')});`;
                }).join('\n')}{'\n'}{durations.map((d, i) => {
                  const names = ['instant', 'fast', 'normal', 'slow', 'slower', 'slowest', 'glacial', 'eternal'];
                  return `--duration-${names[i] ?? i + 1}: ${d}ms;`;
                }).join('\n')}</pre>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}

function SpringCurveViz({ config }: { config: SpringConfig }) {
  const keyframes = simulateSpring(config, 2, 0.001, 3000);
  const duration = keyframes[keyframes.length - 1].time;
  const maxTime = Math.max(duration, 300);

  return (
    <svg width={340} height={100} className="bg-surface-2 rounded-lg border border-border-subtle">
      {/* Grid */}
      <line x1={20} y1={80} x2={330} y2={80} stroke="var(--color-border-subtle)" strokeWidth={0.5} />
      <line x1={20} y1={20} x2={330} y2={20} stroke="var(--color-border-subtle)" strokeWidth={0.5} strokeDasharray="2 2" />

      {/* Target line */}
      <line x1={20} y1={25} x2={330} y2={25} stroke="var(--color-accent)" strokeWidth={0.5} strokeOpacity={0.3} />

      {/* Curve */}
      <path
        d={keyframes
          .map((kf, i) => {
            const x = 20 + (kf.time / maxTime) * 310;
            const y = 80 - kf.position * 55;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          })
          .join(' ')}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
      />

      {/* Labels */}
      <text x={25} y={95} className="fill-text-tertiary text-[8px]">0ms</text>
      <text x={320} y={95} textAnchor="end" className="fill-text-tertiary text-[8px]">{Math.round(duration)}ms</text>
    </svg>
  );
}
