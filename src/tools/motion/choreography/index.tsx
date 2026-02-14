import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { BEZIER_PRESETS } from '@/core/engine/math/bezier';
import { broadcastReplay } from '@/preview/bridge/TokenBroadcast';

// ---- Types ----

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
type StaggerMode = 'linear' | 'ease-in' | 'ease-out';

interface AnimElement {
  id: string;
  name: string;
  delay: number;
  duration: number;
  easing: string;
  direction: Direction;
}

interface Preset {
  label: string;
  elements: Omit<AnimElement, 'id'>[];
  staggerDelay: number;
  staggerMode: StaggerMode;
}

// ---- Presets ----

const PRESETS: Preset[] = [
  {
    label: 'Card List Entrance',
    staggerDelay: 60,
    staggerMode: 'ease-out',
    elements: [
      { name: 'Card 1', delay: 0, duration: 400, easing: 'ease-out', direction: 'up' },
      { name: 'Card 2', delay: 60, duration: 400, easing: 'ease-out', direction: 'up' },
      { name: 'Card 3', delay: 120, duration: 400, easing: 'ease-out', direction: 'up' },
      { name: 'Card 4', delay: 180, duration: 400, easing: 'ease-out', direction: 'up' },
      { name: 'Card 5', delay: 240, duration: 400, easing: 'ease-out', direction: 'up' },
    ],
  },
  {
    label: 'Modal Open',
    staggerDelay: 0,
    staggerMode: 'linear',
    elements: [
      { name: 'Backdrop', delay: 0, duration: 300, easing: 'ease-out', direction: 'fade' },
      { name: 'Modal', delay: 100, duration: 350, easing: 'material-decelerate', direction: 'scale' },
      { name: 'Title', delay: 200, duration: 300, easing: 'ease-out', direction: 'up' },
      { name: 'Content', delay: 260, duration: 300, easing: 'ease-out', direction: 'fade' },
      { name: 'Actions', delay: 320, duration: 250, easing: 'ease-out', direction: 'up' },
    ],
  },
  {
    label: 'Page Transition',
    staggerDelay: 40,
    staggerMode: 'linear',
    elements: [
      { name: 'Old Page', delay: 0, duration: 250, easing: 'ease-in', direction: 'left' },
      { name: 'New Header', delay: 200, duration: 350, easing: 'ease-out', direction: 'down' },
      { name: 'New Hero', delay: 280, duration: 400, easing: 'material-decelerate', direction: 'fade' },
      { name: 'New Content', delay: 360, duration: 350, easing: 'ease-out', direction: 'up' },
      { name: 'New Footer', delay: 440, duration: 300, easing: 'ease-out', direction: 'up' },
    ],
  },
  {
    label: 'Menu Expand',
    staggerDelay: 40,
    staggerMode: 'ease-out',
    elements: [
      { name: 'Menu BG', delay: 0, duration: 250, easing: 'ease-out', direction: 'scale' },
      { name: 'Item 1', delay: 60, duration: 200, easing: 'ease-out', direction: 'right' },
      { name: 'Item 2', delay: 100, duration: 200, easing: 'ease-out', direction: 'right' },
      { name: 'Item 3', delay: 140, duration: 200, easing: 'ease-out', direction: 'right' },
      { name: 'Item 4', delay: 180, duration: 200, easing: 'ease-out', direction: 'right' },
    ],
  },
  {
    label: 'Notification Stack',
    staggerDelay: 80,
    staggerMode: 'ease-in',
    elements: [
      { name: 'Toast 1', delay: 0, duration: 350, easing: 'material-decelerate', direction: 'right' },
      { name: 'Toast 2', delay: 80, duration: 350, easing: 'material-decelerate', direction: 'right' },
      { name: 'Toast 3', delay: 160, duration: 350, easing: 'material-decelerate', direction: 'right' },
    ],
  },
];

const EASING_NAMES = Object.keys(BEZIER_PRESETS);
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right', 'fade', 'scale'];

// ---- Helpers ----

function easingToCss(name: string): string {
  const preset = BEZIER_PRESETS[name];
  if (!preset) return 'ease';
  if (name === 'linear') return 'linear';
  return `cubic-bezier(${preset.join(', ')})`;
}

function directionToTransform(dir: Direction, progress: number): string {
  const inv = 1 - progress;
  switch (dir) {
    case 'up':
      return `translateY(${inv * 24}px)`;
    case 'down':
      return `translateY(${inv * -24}px)`;
    case 'left':
      return `translateX(${inv * 24}px)`;
    case 'right':
      return `translateX(${inv * -24}px)`;
    case 'scale':
      return `scale(${0.8 + progress * 0.2})`;
    case 'fade':
    default:
      return 'none';
  }
}

function directionToKeyframe(dir: Direction): { from: string; to: string } {
  switch (dir) {
    case 'up':
      return { from: 'translateY(24px)', to: 'translateY(0)' };
    case 'down':
      return { from: 'translateY(-24px)', to: 'translateY(0)' };
    case 'left':
      return { from: 'translateX(24px)', to: 'translateX(0)' };
    case 'right':
      return { from: 'translateX(-24px)', to: 'translateX(0)' };
    case 'scale':
      return { from: 'scale(0.8)', to: 'scale(1)' };
    case 'fade':
      return { from: 'none', to: 'none' };
  }
}

// ---- Color for timeline tracks ----

const TRACK_COLORS = [
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-info, var(--color-accent))',
];

export default function TransitionChoreographyTool() {
  const [elements, setElements] = useState<AnimElement[]>([]);
  const [staggerDelay, setStaggerDelay] = useState(60);
  const [staggerMode, setStaggerMode] = useState<StaggerMode>('linear');
  const [globalMultiplier, setGlobalMultiplier] = useState(1);

  // Animation playback
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  // Compute effective elements with multiplier applied
  const effectiveElements = useMemo(
    () =>
      elements.map((el) => ({
        ...el,
        delay: Math.round(el.delay * globalMultiplier),
        duration: Math.round(el.duration * globalMultiplier),
      })),
    [elements, globalMultiplier],
  );

  // Total animation duration
  const totalDuration = useMemo(() => {
    if (effectiveElements.length === 0) return 0;
    return Math.max(...effectiveElements.map((el) => el.delay + el.duration));
  }, [effectiveElements]);

  // ---- Playback ----

  const play = useCallback(() => {
    setPlaying(true);
    broadcastReplay(); // Replay animations in all open demo tabs
    setElapsed(0);
    startRef.current = performance.now();
    const animate = (now: number) => {
      const t = now - startRef.current;
      setElapsed(t);
      if (t < totalDuration + 200) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
        setElapsed(totalDuration);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [totalDuration]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setElapsed(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- Element actions ----

  const addElement = useCallback(() => {
    const lastDelay = elements.length > 0 ? elements[elements.length - 1].delay + staggerDelay : 0;
    setElements((prev) => [
      ...prev,
      {
        id: nanoid(6),
        name: `Element ${prev.length + 1}`,
        delay: lastDelay,
        duration: 300,
        easing: 'ease-out',
        direction: 'up',
      },
    ]);
  }, [elements, staggerDelay]);

  const removeElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<AnimElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const loadPreset = useCallback((preset: Preset) => {
    reset();
    setElements(preset.elements.map((e) => ({ ...e, id: nanoid(6) })));
    setStaggerDelay(preset.staggerDelay);
    setStaggerMode(preset.staggerMode);
  }, [reset]);

  // Recompute stagger delays
  const applyStagger = useCallback(() => {
    setElements((prev) =>
      prev.map((el, i) => {
        let factor: number;
        switch (staggerMode) {
          case 'ease-in':
            factor = (i / Math.max(prev.length - 1, 1)) ** 2;
            break;
          case 'ease-out':
            factor = 1 - (1 - i / Math.max(prev.length - 1, 1)) ** 2;
            break;
          default:
            factor = i / Math.max(prev.length - 1, 1);
        }
        return { ...el, delay: Math.round(factor * staggerDelay * (prev.length - 1)) };
      }),
    );
  }, [staggerDelay, staggerMode]);

  // ---- CSS output ----

  const cssOutput = useMemo(() => {
    if (effectiveElements.length === 0) return '';
    const keyframesSet = new Set<string>();
    const rules: string[] = [];

    for (const el of effectiveElements) {
      const kfName = `enter-${el.direction}`;
      if (!keyframesSet.has(kfName)) {
        keyframesSet.add(kfName);
        const kf = directionToKeyframe(el.direction);
        const hasTransform = kf.from !== 'none';
        rules.push(
          `@keyframes ${kfName} {\n  from {\n    opacity: 0;${hasTransform ? `\n    transform: ${kf.from};` : ''}\n  }\n  to {\n    opacity: 1;${hasTransform ? `\n    transform: ${kf.to};` : ''}\n  }\n}`,
        );
      }
    }

    rules.push('');

    for (const el of effectiveElements) {
      const safeName = el.name.toLowerCase().replace(/\s+/g, '-');
      const kfName = `enter-${el.direction}`;
      rules.push(
        `.${safeName} {\n  animation: ${kfName} ${el.duration}ms ${easingToCss(el.easing)} ${el.delay}ms both;\n}`,
      );
    }

    return rules.join('\n\n');
  }, [effectiveElements]);

  // ---- Framer Motion output ----

  const framerOutput = useMemo(() => {
    if (effectiveElements.length === 0) return '';
    const variants: Record<string, unknown> = {};

    for (const el of effectiveElements) {
      const safeName = el.name.toLowerCase().replace(/\s+/g, '-');
      const kf = directionToKeyframe(el.direction);
      const hasTransform = kf.from !== 'none';
      const initial: Record<string, number | string> = { opacity: 0 };
      const animate: Record<string, number | string> = { opacity: 1 };

      if (hasTransform) {
        if (el.direction === 'up') { initial.y = 24; animate.y = 0; }
        else if (el.direction === 'down') { initial.y = -24; animate.y = 0; }
        else if (el.direction === 'left') { initial.x = 24; animate.x = 0; }
        else if (el.direction === 'right') { initial.x = -24; animate.x = 0; }
        else if (el.direction === 'scale') { initial.scale = 0.8; animate.scale = 1; }
      }

      variants[safeName] = {
        initial,
        animate: {
          ...animate,
          transition: {
            duration: el.duration / 1000,
            delay: el.delay / 1000,
            ease: BEZIER_PRESETS[el.easing] ?? [0, 0, 0.58, 1],
          },
        },
      };
    }

    return JSON.stringify(variants, null, 2);
  }, [effectiveElements]);

  return (
    <ToolLayout
      title="Transition Choreography"
      description="Multi-element animation sequencer for coordinated transitions"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            {/* Presets */}
            <ParameterSection title="Presets">
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => loadPreset(p)}
                    className="px-2.5 py-1 text-xs rounded-md bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-subtle hover:border-accent/30 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </ParameterSection>

            {/* Stagger controls */}
            <ParameterSection title="Stagger">
              <SliderWithInput
                label="Delay"
                value={staggerDelay}
                onChange={setStaggerDelay}
                min={0}
                max={200}
                step={10}
                unit="ms"
              />
              <div>
                <label className="text-[10px] text-text-tertiary mb-1 block">Mode</label>
                <div className="flex gap-1">
                  {(['linear', 'ease-in', 'ease-out'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setStaggerMode(mode)}
                      className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                        staggerMode === mode
                          ? 'bg-accent/10 text-accent border border-accent/30'
                          : 'bg-surface-2 text-text-secondary border border-transparent'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={applyStagger}
                disabled={elements.length === 0}
                className="w-full px-2 py-1.5 text-xs rounded-md bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-subtle transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Apply Stagger to All
              </button>
            </ParameterSection>

            {/* Global multiplier */}
            <ParameterSection title="Timing">
              <SliderWithInput
                label="Speed"
                value={globalMultiplier}
                onChange={setGlobalMultiplier}
                min={0.5}
                max={3}
                step={0.1}
                unit="x"
                description="Multiplier for all delays and durations"
              />
            </ParameterSection>

            {/* Element list */}
            <ParameterSection title="Elements">
              <div className="space-y-2">
                {elements.map((el) => (
                  <div
                    key={el.id}
                    className="bg-surface-2 rounded-lg border border-border-subtle p-2 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={el.name}
                        onChange={(e) => updateElement(el.id, { name: e.target.value })}
                        className="flex-1 bg-transparent text-xs font-medium text-text-primary outline-none min-w-0"
                      />
                      <button
                        onClick={() => removeElement(el.id)}
                        className="p-0.5 text-text-tertiary hover:text-error transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] text-text-tertiary block">Delay</label>
                        <input
                          type="number"
                          value={el.delay}
                          onChange={(e) =>
                            updateElement(el.id, { delay: Math.max(0, parseInt(e.target.value) || 0) })
                          }
                          className="w-full bg-surface-3 border border-border-subtle rounded px-1.5 py-0.5 text-[10px] text-text-primary outline-none focus:ring-1 focus:ring-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min={0}
                          step={10}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-tertiary block">Duration</label>
                        <input
                          type="number"
                          value={el.duration}
                          onChange={(e) =>
                            updateElement(el.id, { duration: Math.max(50, parseInt(e.target.value) || 50) })
                          }
                          className="w-full bg-surface-3 border border-border-subtle rounded px-1.5 py-0.5 text-[10px] text-text-primary outline-none focus:ring-1 focus:ring-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min={50}
                          step={10}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] text-text-tertiary block">Easing</label>
                        <select
                          value={el.easing}
                          onChange={(e) => updateElement(el.id, { easing: e.target.value })}
                          className="w-full bg-surface-3 border border-border-subtle rounded px-1 py-0.5 text-[10px] text-text-primary outline-none"
                        >
                          {EASING_NAMES.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-text-tertiary block">Direction</label>
                        <select
                          value={el.direction}
                          onChange={(e) => updateElement(el.id, { direction: e.target.value as Direction })}
                          className="w-full bg-surface-3 border border-border-subtle rounded px-1 py-0.5 text-[10px] text-text-primary outline-none"
                        >
                          {DIRECTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addElement}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 mt-1 text-xs text-text-tertiary hover:text-accent rounded-md hover:bg-surface-2 transition-colors"
              >
                <Plus size={12} />
                Add Element
              </button>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Preview area */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Animation Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={playing ? reset : play}
                    disabled={elements.length === 0}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {playing ? <RotateCcw size={12} /> : <Play size={12} />}
                    {playing ? 'Reset' : 'Play'}
                  </button>
                  {playing && (
                    <button
                      onClick={reset}
                      className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {totalDuration}ms total
                  </span>
                </div>
              </div>

              <div
                className="rounded-lg border border-border-subtle p-4 min-h-[160px] flex flex-wrap items-start gap-3 content-start overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-1)' }}
              >
                {effectiveElements.length === 0 ? (
                  <div className="w-full h-32 flex items-center justify-center">
                    <span className="text-xs text-text-tertiary">
                      Load a preset or add elements to preview
                    </span>
                  </div>
                ) : (
                  effectiveElements.map((el) => {
                    // Calculate element progress
                    const elStart = el.delay;
                    const elEnd = el.delay + el.duration;
                    let progress: number;
                    if (!playing && elapsed === 0) {
                      progress = 0;
                    } else if (elapsed < elStart) {
                      progress = 0;
                    } else if (elapsed >= elEnd) {
                      progress = 1;
                    } else {
                      progress = (elapsed - elStart) / el.duration;
                    }

                    const transform = directionToTransform(el.direction, progress);

                    return (
                      <div
                        key={el.id}
                        className="rounded-lg border border-border-subtle p-3 min-w-[100px]"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          opacity: progress,
                          transform: transform !== 'none' ? transform : undefined,
                          transition: !playing && elapsed === 0 ? 'none' : undefined,
                        }}
                      >
                        <div
                          className="h-6 w-16 rounded mb-1.5"
                          style={{ backgroundColor: 'var(--color-surface-3)' }}
                        />
                        <div className="text-[10px] font-mono text-text-secondary">{el.name}</div>
                        <div className="text-[8px] text-text-tertiary">{el.delay}ms + {el.duration}ms</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Timeline visualization */}
            {effectiveElements.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <div className="space-y-1.5">
                  {effectiveElements.map((el, i) => {
                    const maxT = totalDuration || 1;
                    const leftPct = (el.delay / maxT) * 100;
                    const widthPct = (el.duration / maxT) * 100;
                    const color = TRACK_COLORS[i % TRACK_COLORS.length];

                    return (
                      <div key={el.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-text-tertiary w-20 text-right truncate shrink-0">
                          {el.name}
                        </span>
                        <div className="flex-1 h-5 bg-surface-2 rounded relative overflow-hidden">
                          <div
                            className="absolute top-0.5 bottom-0.5 rounded"
                            style={{
                              left: `${leftPct}%`,
                              width: `${Math.max(widthPct, 1)}%`,
                              backgroundColor: color,
                              opacity: 0.7,
                            }}
                          />
                          {/* Playhead */}
                          {(playing || elapsed > 0) && (
                            <div
                              className="absolute top-0 bottom-0 w-px"
                              style={{
                                left: `${Math.min((elapsed / maxT) * 100, 100)}%`,
                                backgroundColor: 'var(--color-text-primary)',
                              }}
                            />
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-text-tertiary w-20 shrink-0">
                          {el.delay}-{el.delay + el.duration}ms
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline scale markers */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-20 shrink-0" />
                  <div className="flex-1 relative h-3">
                    {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                      <span
                        key={frac}
                        className="absolute text-[8px] text-text-tertiary font-mono"
                        style={{
                          left: `${frac * 100}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {Math.round(frac * totalDuration)}
                      </span>
                    ))}
                  </div>
                  <div className="w-20 shrink-0" />
                </div>
              </div>
            )}

            {/* CSS output */}
            {effectiveElements.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  CSS Output
                </h3>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-56 overflow-y-auto">
                  <pre>{cssOutput}</pre>
                </div>
              </div>
            )}

            {/* Framer Motion output */}
            {effectiveElements.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Framer Motion Variants
                </h3>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-56 overflow-y-auto">
                  <pre>{framerOutput}</pre>
                </div>
              </div>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
