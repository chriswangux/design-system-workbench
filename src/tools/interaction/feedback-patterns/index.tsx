import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import { evaluateBezier } from '@/core/engine/math/bezier';
import type { TokenGroup, BezierControlPoints } from '@/core/tokens/types';

// ---- Types ----

type PatternTemplate = 'button-click' | 'form-submit' | 'delete-action' | 'toggle-switch' | 'add-to-cart';
type AnimProperty = 'scale' | 'opacity' | 'color' | 'position';
type EasingPreset = 'ease' | 'ease-out' | 'ease-in-out' | 'spring';

interface AnimStep {
  id: string;
  property: AnimProperty;
  targetValue: number;
  duration: number;    // ms
  delay: number;       // ms
  easing: EasingPreset;
}

interface PatternDef {
  id: PatternTemplate;
  name: string;
  steps: AnimStep[];
}

// ---- Constants ----

const EASING_PRESETS: Record<EasingPreset, BezierControlPoints> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  spring: [0.175, 0.885, 0.32, 1.275],
};

const PROPERTY_RANGES: Record<AnimProperty, { min: number; max: number; step: number; unit: string; defaultVal: number }> = {
  scale: { min: 0, max: 2, step: 0.05, unit: 'x', defaultVal: 1 },
  opacity: { min: 0, max: 1, step: 0.05, unit: '', defaultVal: 1 },
  color: { min: 0, max: 100, step: 1, unit: '%', defaultVal: 100 },
  position: { min: -20, max: 20, step: 1, unit: 'px', defaultVal: 0 },
};

let _stepId = 0;
function newStepId(): string {
  return `step-${++_stepId}-${Date.now()}`;
}

function makeStep(property: AnimProperty, targetValue: number, duration: number, delay: number, easing: EasingPreset): AnimStep {
  return { id: newStepId(), property, targetValue, duration, delay, easing };
}

const DEFAULT_PATTERNS: PatternDef[] = [
  {
    id: 'button-click',
    name: 'Button Click',
    steps: [
      makeStep('scale', 0.95, 80, 0, 'ease'),
      makeStep('opacity', 0.8, 80, 0, 'ease'),
      makeStep('scale', 1, 200, 80, 'spring'),
      makeStep('opacity', 1, 200, 80, 'ease-out'),
    ],
  },
  {
    id: 'form-submit',
    name: 'Form Submit',
    steps: [
      makeStep('opacity', 0.6, 150, 0, 'ease'),
      makeStep('scale', 0.98, 150, 0, 'ease'),
      makeStep('opacity', 1, 300, 200, 'ease-out'),
      makeStep('scale', 1, 300, 200, 'spring'),
      makeStep('color', 50, 400, 500, 'ease-in-out'),
    ],
  },
  {
    id: 'delete-action',
    name: 'Delete Action',
    steps: [
      makeStep('scale', 1.02, 100, 0, 'ease'),
      makeStep('position', -5, 100, 100, 'ease'),
      makeStep('position', 5, 80, 200, 'ease'),
      makeStep('position', 0, 80, 280, 'ease-out'),
      makeStep('opacity', 0, 250, 360, 'ease-in-out'),
      makeStep('scale', 0.8, 250, 360, 'ease-in-out'),
    ],
  },
  {
    id: 'toggle-switch',
    name: 'Toggle Switch',
    steps: [
      makeStep('position', 18, 200, 0, 'spring'),
      makeStep('scale', 1.1, 100, 0, 'ease'),
      makeStep('scale', 1, 150, 100, 'spring'),
      makeStep('color', 100, 200, 0, 'ease-in-out'),
    ],
  },
  {
    id: 'add-to-cart',
    name: 'Add to Cart',
    steps: [
      makeStep('scale', 1.15, 150, 0, 'spring'),
      makeStep('scale', 1, 200, 150, 'spring'),
      makeStep('position', -3, 80, 0, 'ease'),
      makeStep('position', 0, 120, 80, 'ease-out'),
      makeStep('opacity', 0.5, 100, 350, 'ease'),
      makeStep('opacity', 1, 200, 450, 'ease-out'),
    ],
  },
];

// ---- Helpers ----

function getEasingTokenPresets(motionGroup: TokenGroup | undefined): Array<{ name: string; bezier: BezierControlPoints }> {
  if (!motionGroup) return [];
  const easingGroup = motionGroup['easing'];
  if (!easingGroup || typeof easingGroup !== 'object' || '$value' in easingGroup) return [];
  const tokens = flattenTokenGroup(easingGroup as TokenGroup);
  const results: Array<{ name: string; bezier: BezierControlPoints }> = [];
  for (const { path, token } of tokens) {
    const val = token.$value;
    if (Array.isArray(val) && val.length === 4 && typeof val[0] === 'number') {
      results.push({ name: path.join('.'), bezier: val as BezierControlPoints });
    }
  }
  return results;
}

function computeTotalDuration(steps: AnimStep[]): number {
  let max = 0;
  for (const step of steps) {
    const end = step.delay + step.duration;
    if (end > max) max = end;
  }
  return max;
}

function interpolateProperty(
  steps: AnimStep[],
  property: AnimProperty,
  timeMs: number,
): number | null {
  // Find the step that governs this property at the given time
  // Steps for the same property: use the last one whose [delay, delay+duration] contains timeMs
  const propSteps = steps.filter((s) => s.property === property);
  if (propSteps.length === 0) return null;

  let value: number | null = null;
  for (const step of propSteps) {
    const start = step.delay;
    if (timeMs < start) continue;
    const t = Math.min(1, (timeMs - start) / Math.max(step.duration, 1));
    const bezier = EASING_PRESETS[step.easing];
    const eased = evaluateBezier(bezier, t);
    // Interpolate from default to target
    const defaultVal = PROPERTY_RANGES[property].defaultVal;
    // Find the "from" value: the target of the previous step of the same property that ended before this one
    let from = defaultVal;
    for (const prev of propSteps) {
      if (prev === step) break;
      if (prev.delay + prev.duration <= step.delay) {
        from = prev.targetValue;
      }
    }
    value = from + (step.targetValue - from) * eased;
  }
  return value;
}

// ---- Preview elements for each pattern ----

function PatternPreviewElement({
  template,
  scaleVal,
  opacityVal,
  positionVal,
  colorVal,
}: {
  template: PatternTemplate;
  scaleVal: number;
  opacityVal: number;
  positionVal: number;
  colorVal: number;
}) {
  const style: React.CSSProperties = {
    transform: `scale(${scaleVal}) translateX(${positionVal}px)`,
    opacity: opacityVal,
    filter: `hue-rotate(${(1 - colorVal / 100) * 120}deg)`,
  };

  switch (template) {
    case 'button-click':
      return (
        <button className="px-6 py-2.5 rounded-lg text-sm font-medium text-surface-0" style={{ ...style, background: 'var(--color-accent)' }}>
          Click Me
        </button>
      );
    case 'form-submit':
      return (
        <div className="w-48 p-3 rounded-lg border border-border-subtle bg-surface-1 space-y-2" style={style}>
          <div className="h-6 rounded border border-border-subtle bg-surface-2 px-2 flex items-center">
            <span className="text-[10px] text-text-tertiary">email@example.com</span>
          </div>
          <div className="h-6 rounded text-[10px] font-medium text-surface-0 flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            Submit
          </div>
        </div>
      );
    case 'delete-action':
      return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-subtle bg-surface-1" style={style}>
          <span className="text-error text-sm">&#128465;</span>
          <span className="text-xs text-text-primary">Delete Item</span>
        </div>
      );
    case 'toggle-switch':
      return (
        <div className="flex items-center gap-2" style={{ opacity: opacityVal }}>
          <div className="relative w-10 h-5 rounded-full" style={{ background: 'var(--color-accent)', filter: style.filter }}>
            <div
              className="absolute top-[3px] w-[14px] h-[14px] rounded-full bg-surface-0"
              style={{ transform: `translateX(${positionVal}px) scale(${scaleVal})`, left: '3px' }}
            />
          </div>
          <span className="text-xs text-text-secondary">Enabled</span>
        </div>
      );
    case 'add-to-cart':
      return (
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-surface-0" style={{ ...style, background: 'var(--color-accent)' }}>
          <span>&#128722;</span>
          Add to Cart
        </button>
      );
  }
}

// ---- Timeline bar visualization ----

function TimelineVisualization({ steps, totalDuration }: { steps: AnimStep[]; totalDuration: number }) {
  const properties: AnimProperty[] = ['scale', 'opacity', 'color', 'position'];
  const propColors: Record<AnimProperty, string> = {
    scale: 'var(--color-accent)',
    opacity: 'var(--color-warning)',
    color: 'var(--color-accent)',
    position: 'var(--color-success)',
  };

  const usedProperties = properties.filter((p) => steps.some((s) => s.property === p));
  const maxMs = Math.max(totalDuration, 100);

  return (
    <div className="space-y-2">
      {usedProperties.map((prop) => {
        const propSteps = steps.filter((s) => s.property === prop);
        return (
          <div key={prop} className="flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary w-14 text-right shrink-0 capitalize">{prop}</span>
            <div className="flex-1 h-5 bg-surface-2 rounded relative overflow-hidden">
              {propSteps.map((step) => {
                const leftPct = (step.delay / maxMs) * 100;
                const widthPct = (step.duration / maxMs) * 100;
                return (
                  <div
                    key={step.id}
                    className="absolute top-0.5 bottom-0.5 rounded-sm"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 1)}%`,
                      background: propColors[prop],
                      opacity: 0.6,
                    }}
                    title={`${prop}: ${step.targetValue} | ${step.duration}ms @ ${step.delay}ms delay`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Time markers */}
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0" />
        <div className="flex-1 flex justify-between px-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <span key={frac} className="text-[8px] text-text-tertiary font-mono">
              {Math.round(frac * maxMs)}ms
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- CSS / Framer Motion output generation ----

function generateCSSKeyframes(steps: AnimStep[], totalDuration: number): string {
  if (steps.length === 0 || totalDuration === 0) return '/* No steps defined */';

  const lines: string[] = [];
  lines.push('@keyframes feedback-pattern {');

  // Collect time points
  const timePoints = new Set<number>([0]);
  for (const step of steps) {
    timePoints.add(step.delay);
    timePoints.add(step.delay + step.duration);
  }
  const sorted = [...timePoints].sort((a, b) => a - b);

  for (const t of sorted) {
    const pct = Math.round((t / totalDuration) * 100);
    const scale = interpolateProperty(steps, 'scale', t) ?? 1;
    const opacity = interpolateProperty(steps, 'opacity', t) ?? 1;
    const pos = interpolateProperty(steps, 'position', t) ?? 0;

    lines.push(`  ${pct}% {`);
    lines.push(`    transform: scale(${scale.toFixed(3)}) translateX(${pos.toFixed(1)}px);`);
    lines.push(`    opacity: ${opacity.toFixed(3)};`);
    lines.push('  }');
  }

  lines.push('}');
  lines.push('');
  lines.push(`.element {`);
  lines.push(`  animation: feedback-pattern ${totalDuration}ms ease forwards;`);
  lines.push('}');

  return lines.join('\n');
}

function generateFramerMotion(steps: AnimStep[], totalDuration: number): string {
  if (steps.length === 0) return '// No steps defined';

  const timePoints = new Set<number>([0]);
  for (const step of steps) {
    timePoints.add(step.delay + step.duration);
  }
  const sorted = [...timePoints].sort((a, b) => a - b);

  const scaleKeys: number[] = [];
  const opacityKeys: number[] = [];
  const xKeys: number[] = [];
  const times: number[] = [];

  for (const t of sorted) {
    const scale = interpolateProperty(steps, 'scale', t) ?? 1;
    const opacity = interpolateProperty(steps, 'opacity', t) ?? 1;
    const x = interpolateProperty(steps, 'position', t) ?? 0;

    times.push(Math.round((t / totalDuration) * 1000) / 1000);
    scaleKeys.push(Math.round(scale * 1000) / 1000);
    opacityKeys.push(Math.round(opacity * 1000) / 1000);
    xKeys.push(Math.round(x * 10) / 10);
  }

  const lines: string[] = [];
  lines.push('// Framer Motion animate config');
  lines.push('const feedbackAnimation = {');
  lines.push(`  scale: [${scaleKeys.join(', ')}],`);
  lines.push(`  opacity: [${opacityKeys.join(', ')}],`);
  lines.push(`  x: [${xKeys.join(', ')}],`);
  lines.push('  transition: {');
  lines.push(`    duration: ${(totalDuration / 1000).toFixed(2)},`);
  lines.push(`    times: [${times.join(', ')}],`);
  lines.push(`    ease: "easeInOut",`);
  lines.push('  },');
  lines.push('};');
  lines.push('');
  lines.push('// Usage: <motion.div animate={feedbackAnimation} />');

  return lines.join('\n');
}

// ---- Main Tool ----

export default function FeedbackPatternLabTool() {
  const motionGroup = useTokenStore((s) => s.tokens.motion);
  const storeEasings = useRef(getEasingTokenPresets(motionGroup));

  const [template, setTemplate] = useState<PatternTemplate>('button-click');
  const [steps, setSteps] = useState<AnimStep[]>(() => {
    const p = DEFAULT_PATTERNS.find((p) => p.id === 'button-click');
    return p ? p.steps.map((s) => ({ ...s, id: newStepId() })) : [];
  });
  const [playing, setPlaying] = useState(false);
  const [looping, setLooping] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [outputFormat, setOutputFormat] = useState<'css' | 'framer'>('css');
  const [copied, setCopied] = useState(false);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  const totalDuration = useMemo(() => computeTotalDuration(steps), [steps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const stopPlayback = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPlayTime(0);
  }, []);

  const startPlayback = useCallback(() => {
    if (totalDuration === 0) return;
    if (playing) {
      stopPlayback();
      return;
    }
    setPlaying(true);
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      if (elapsed >= totalDuration) {
        if (looping) {
          startTimeRef.current = now;
          setPlayTime(0);
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setPlayTime(totalDuration);
          setPlaying(false);
        }
      } else {
        setPlayTime(elapsed);
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [playing, totalDuration, looping, stopPlayback]);

  // Stop playback when steps change
  useEffect(() => {
    stopPlayback();
  }, [steps, stopPlayback]);

  const selectTemplate = useCallback((id: PatternTemplate) => {
    setTemplate(id);
    const pattern = DEFAULT_PATTERNS.find((p) => p.id === id);
    if (pattern) {
      setSteps(pattern.steps.map((s) => ({ ...s, id: newStepId() })));
    }
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<AnimStep>) => {
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, ...updates } : s));
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  }, []);

  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, makeStep('scale', 1, 200, computeTotalDuration(prev), 'ease-out')]);
  }, []);

  // Compute current animated values
  const currentScale = useMemo(() => interpolateProperty(steps, 'scale', playTime) ?? 1, [steps, playTime]);
  const currentOpacity = useMemo(() => interpolateProperty(steps, 'opacity', playTime) ?? 1, [steps, playTime]);
  const currentPosition = useMemo(() => interpolateProperty(steps, 'position', playTime) ?? 0, [steps, playTime]);
  const currentColor = useMemo(() => interpolateProperty(steps, 'color', playTime) ?? 100, [steps, playTime]);

  const output = useMemo(
    () => outputFormat === 'css' ? generateCSSKeyframes(steps, totalDuration) : generateFramerMotion(steps, totalDuration),
    [outputFormat, steps, totalDuration],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <ToolLayout
      title="Feedback Pattern Lab"
      description="Design and preview action feedback animation sequences"
    >
      <SplitPanel
        leftWidth="380px"
        left={
          <div>
            <ParameterSection title="Pattern Template">
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectTemplate(p.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      template === p.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Sequence Editor">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-text-tertiary">
                  {steps.length} step{steps.length !== 1 ? 's' : ''} &middot; {totalDuration}ms total
                </span>
                <button
                  onClick={addStep}
                  className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 transition-colors"
                >
                  <Plus size={10} />
                  Add Step
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {steps.map((step, i) => (
                  <div key={step.id} className="p-2.5 rounded-lg bg-surface-2 border border-border-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-text-secondary">
                        Step {i + 1}
                      </span>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-0.5 text-text-tertiary hover:text-error transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    {/* Property selector */}
                    <div className="flex gap-1">
                      {(['scale', 'opacity', 'color', 'position'] as AnimProperty[]).map((prop) => (
                        <button
                          key={prop}
                          onClick={() => updateStep(step.id, { property: prop, targetValue: PROPERTY_RANGES[prop].defaultVal })}
                          className={`flex-1 px-1 py-0.5 text-[10px] rounded transition-colors capitalize ${
                            step.property === prop
                              ? 'bg-accent/10 text-accent'
                              : 'bg-surface-3 text-text-tertiary hover:text-text-secondary'
                          }`}
                        >
                          {prop}
                        </button>
                      ))}
                    </div>
                    {/* Target value */}
                    <SliderWithInput
                      label="Target"
                      value={step.targetValue}
                      onChange={(v) => updateStep(step.id, { targetValue: v })}
                      min={PROPERTY_RANGES[step.property].min}
                      max={PROPERTY_RANGES[step.property].max}
                      step={PROPERTY_RANGES[step.property].step}
                      unit={PROPERTY_RANGES[step.property].unit}
                    />
                    {/* Duration */}
                    <SliderWithInput
                      label="Duration"
                      value={step.duration}
                      onChange={(v) => updateStep(step.id, { duration: v })}
                      min={50}
                      max={1000}
                      step={10}
                      unit="ms"
                    />
                    {/* Delay */}
                    <SliderWithInput
                      label="Delay"
                      value={step.delay}
                      onChange={(v) => updateStep(step.id, { delay: v })}
                      min={0}
                      max={500}
                      step={10}
                      unit="ms"
                    />
                    {/* Easing */}
                    <div>
                      <label className="text-[10px] text-text-tertiary mb-1 block">Easing</label>
                      <div className="flex gap-1">
                        {(Object.keys(EASING_PRESETS) as EasingPreset[]).map((e) => (
                          <button
                            key={e}
                            onClick={() => updateStep(step.id, { easing: e })}
                            className={`flex-1 px-1 py-0.5 text-[9px] rounded transition-colors ${
                              step.easing === e
                                ? 'bg-accent/10 text-accent'
                                : 'bg-surface-3 text-text-tertiary hover:text-text-secondary'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {steps.length === 0 && (
                  <div className="p-4 text-center text-xs text-text-tertiary">
                    No steps. Click "Add Step" to begin.
                  </div>
                )}
              </div>
            </ParameterSection>

            {storeEasings.current.length > 0 && (
              <ParameterSection title="Store Easings">
                <p className="text-[10px] text-text-tertiary mb-1">
                  Easing curves from your motion tokens:
                </p>
                <div className="flex flex-wrap gap-1">
                  {storeEasings.current.map((e) => (
                    <span key={e.name} className="px-1.5 py-0.5 rounded text-[9px] bg-surface-3 text-text-tertiary font-mono">
                      {e.name}
                    </span>
                  ))}
                </div>
              </ParameterSection>
            )}
          </div>
        }
        right={
          <div className="p-6 space-y-6">
            {/* Animated Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLooping(!looping)}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      looping
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-tertiary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    Loop
                  </button>
                  <button
                    onClick={startPlayback}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                      playing
                        ? 'bg-error/10 text-error border border-error/30'
                        : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
                    }`}
                  >
                    {playing ? <Pause size={11} /> : <Play size={11} />}
                    {playing ? 'Stop' : 'Play'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center h-32 rounded-lg border border-border-subtle bg-surface-1">
                <PatternPreviewElement
                  template={template}
                  scaleVal={currentScale}
                  opacityVal={currentOpacity}
                  positionVal={currentPosition}
                  colorVal={currentColor}
                />
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-none rounded-full"
                  style={{ width: totalDuration > 0 ? `${(playTime / totalDuration) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-text-tertiary font-mono">{Math.round(playTime)}ms</span>
                <span className="text-[9px] text-text-tertiary font-mono">{totalDuration}ms</span>
              </div>
            </div>

            {/* Timeline Visualization */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Timeline
              </h3>
              <TimelineVisualization steps={steps} totalDuration={totalDuration} />
            </div>

            {/* Code Output */}
            <div className="border-t border-border-subtle pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Generated Code
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-md overflow-hidden border border-border-subtle">
                    <button
                      onClick={() => setOutputFormat('css')}
                      className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        outputFormat === 'css'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      CSS
                    </button>
                    <button
                      onClick={() => setOutputFormat('framer')}
                      className={`px-2.5 py-1 text-[10px] font-medium transition-colors border-l border-border-subtle ${
                        outputFormat === 'framer'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      Framer Motion
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
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-64">
                <pre>{output}</pre>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
