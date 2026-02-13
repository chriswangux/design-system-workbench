import { useState, useCallback } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';

interface VoiceAxis {
  id: string;
  label: string;
  low: string;
  high: string;
  value: number; // -1 to 1
  description: string;
}

const DEFAULT_AXES: VoiceAxis[] = [
  { id: 'formality', label: 'Formality', low: 'Casual', high: 'Formal', value: 0, description: 'How structured and professional the language feels' },
  { id: 'humor', label: 'Humor', low: 'Serious', high: 'Playful', value: 0, description: 'How much humor and levity is appropriate' },
  { id: 'enthusiasm', label: 'Enthusiasm', low: 'Reserved', high: 'Enthusiastic', value: 0, description: 'The energy level and excitement in the voice' },
  { id: 'authority', label: 'Authority', low: 'Peer', high: 'Expert', value: 0, description: 'Whether the voice feels like a peer or an authority' },
  { id: 'warmth', label: 'Warmth', low: 'Neutral', high: 'Warm', value: 0, description: 'How empathetic and personal the voice feels' },
  { id: 'directness', label: 'Directness', low: 'Suggestive', high: 'Direct', value: 0, description: 'How explicitly the voice states things' },
];

interface ToneContext {
  id: string;
  name: string;
  description: string;
  modifiers: Record<string, number>; // axis id -> modifier (-1 to 1)
  example: string;
}

const DEFAULT_CONTEXTS: ToneContext[] = [
  {
    id: 'success',
    name: 'Success',
    description: 'User completed an action successfully',
    modifiers: { humor: 0.3, enthusiasm: 0.5, warmth: 0.3 },
    example: '',
  },
  {
    id: 'error',
    name: 'Error',
    description: 'Something went wrong',
    modifiers: { humor: -0.5, formality: 0.2, directness: 0.4, warmth: 0.2 },
    example: '',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Guiding new users',
    modifiers: { warmth: 0.5, enthusiasm: 0.3, authority: -0.2 },
    example: '',
  },
  {
    id: 'empty-state',
    name: 'Empty State',
    description: 'No content to show yet',
    modifiers: { humor: 0.2, warmth: 0.3, enthusiasm: 0.1 },
    example: '',
  },
];

function VoiceCompassPlot({ axes }: { axes: VoiceAxis[] }) {
  const size = 300;
  const center = size / 2;
  const radius = size / 2 - 40;
  const count = axes.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = ((value + 1) / 2) * radius; // map -1..1 to 0..radius
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  };

  const polygon = axes.map((axis, i) => {
    const p = getPoint(i, axis.value);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            return `${center + Math.cos(angle) * radius * r},${center + Math.sin(angle) * radius * r}`;
          }).join(' ')}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * radius}
            y2={center + Math.sin(angle) * radius}
            stroke="var(--color-border-subtle)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Value polygon */}
      <polygon
        points={polygon}
        fill="var(--color-accent)"
        fillOpacity={0.15}
        stroke="var(--color-accent)"
        strokeWidth={2}
      />

      {/* Value dots */}
      {axes.map((axis, i) => {
        const p = getPoint(i, axis.value);
        return <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--color-accent)" />;
      })}

      {/* Labels */}
      {axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const lx = center + Math.cos(angle) * (radius + 25);
        const ly = center + Math.sin(angle) * (radius + 25);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text-secondary text-[10px] font-medium"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function VoiceToneCompassTool() {
  const [axes, setAxes] = useState<VoiceAxis[]>(DEFAULT_AXES);
  const [contexts, setContexts] = useState<ToneContext[]>(DEFAULT_CONTEXTS);
  const [activeContext, setActiveContext] = useState<string | null>(null);

  const updateAxis = useCallback((id: string, value: number) => {
    setAxes((prev) => prev.map((a) => a.id === id ? { ...a, value } : a));
  }, []);

  // Compute effective axes when a context is active
  const effectiveAxes = activeContext
    ? axes.map((axis) => {
        const ctx = contexts.find((c) => c.id === activeContext);
        const modifier = ctx?.modifiers[axis.id] ?? 0;
        return { ...axis, value: Math.max(-1, Math.min(1, axis.value + modifier)) };
      })
    : axes;

  return (
    <ToolLayout
      title="Voice & Tone Compass"
      description="Define and visualize your brand voice across multiple dimensions"
    >
      <SplitPanel
        leftWidth="360px"
        left={
          <div>
            <ParameterSection title="Base Voice">
              <p className="text-[10px] text-text-tertiary mb-3">
                Set your brand's baseline voice. These values represent the default tone across all contexts.
              </p>
              {axes.map((axis) => (
                <div key={axis.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">{axis.label}</label>
                    <span className="text-[10px] text-text-tertiary font-mono">
                      {axis.value > 0.3 ? axis.high : axis.value < -0.3 ? axis.low : 'Balanced'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-text-tertiary w-16 text-right">{axis.low}</span>
                    <input
                      type="range"
                      value={axis.value}
                      onChange={(e) => updateAxis(axis.id, parseFloat(e.target.value))}
                      min={-1}
                      max={1}
                      step={0.05}
                      className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--color-surface-3) 0%, var(--color-surface-3) ${((axis.value + 1) / 2) * 100}%, var(--color-surface-3) 100%)`,
                      }}
                    />
                    <span className="text-[9px] text-text-tertiary w-16">{axis.high}</span>
                  </div>
                </div>
              ))}
            </ParameterSection>

            <ParameterSection title="Tone Contexts">
              <p className="text-[10px] text-text-tertiary mb-2">
                Select a context to see how tone shifts from the base voice.
              </p>
              <div className="space-y-1">
                {contexts.map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => setActiveContext(activeContext === ctx.id ? null : ctx.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                      activeContext === ctx.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    <span className="font-medium">{ctx.name}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5">{ctx.description}</span>
                  </button>
                ))}
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Radar chart */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 text-center">
                Voice Profile {activeContext && `— ${contexts.find((c) => c.id === activeContext)?.name}`}
              </h3>
              <VoiceCompassPlot axes={effectiveAxes} />
            </div>

            {/* Copy guidance */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Writing Guidelines
              </h3>
              <div className="space-y-3">
                {effectiveAxes.map((axis) => {
                  const intensity = Math.abs(axis.value);
                  const direction = axis.value > 0 ? axis.high : axis.low;
                  let guidance = '';
                  if (intensity < 0.2) guidance = `Neutral ${axis.label.toLowerCase()}. Balance ${axis.low.toLowerCase()} and ${axis.high.toLowerCase()} elements.`;
                  else if (intensity < 0.5) guidance = `Lean ${direction.toLowerCase()}. Subtle ${direction.toLowerCase()} tone is appropriate.`;
                  else guidance = `Strongly ${direction.toLowerCase()}. This should be a clear characteristic of the voice.`;

                  return (
                    <div key={axis.id} className="flex gap-3">
                      <div className={`w-1.5 rounded-full shrink-0 ${intensity > 0.5 ? 'bg-accent' : intensity > 0.2 ? 'bg-accent/50' : 'bg-surface-3'}`} />
                      <div>
                        <div className="text-xs font-medium text-text-primary">{axis.label}</div>
                        <div className="text-[10px] text-text-tertiary">{guidance}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Example copy for each context */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Example Copy by Context
              </h3>
              <div className="space-y-3">
                {contexts.map((ctx) => {
                  const voiceProfile = axes.reduce((acc, axis) => {
                    const mod = ctx.modifiers[axis.id] ?? 0;
                    const effective = Math.max(-1, Math.min(1, axis.value + mod));
                    acc[axis.id] = effective;
                    return acc;
                  }, {} as Record<string, number>);

                  // Generate example based on voice profile
                  const formal = (voiceProfile.formality ?? 0) > 0.3;
                  const playful = (voiceProfile.humor ?? 0) > 0.3;
                  const warm = (voiceProfile.warmth ?? 0) > 0.3;

                  const examples: Record<string, string> = {
                    success: formal
                      ? 'Your changes have been saved successfully.'
                      : playful
                        ? 'All done! Your changes are saved and ready to go.'
                        : warm
                          ? 'Great job! Everything has been saved.'
                          : 'Changes saved.',
                    error: formal
                      ? 'We encountered an error processing your request. Please try again.'
                      : warm
                        ? "Something went wrong on our end. We're looking into it."
                        : 'An error occurred. Please try again.',
                    onboarding: formal
                      ? 'Welcome. Follow the steps below to configure your account.'
                      : playful
                        ? "Welcome aboard! Let's get you set up in just a few steps."
                        : warm
                          ? "Welcome! We're excited to help you get started."
                          : 'Welcome. Complete the setup steps below.',
                    'empty-state': formal
                      ? 'No items to display. Create your first item to get started.'
                      : playful
                        ? "It's a bit empty here. Let's change that!"
                        : warm
                          ? "Nothing here yet — but that's okay! Start by adding your first item."
                          : 'No items found. Create one to get started.',
                  };

                  return (
                    <div
                      key={ctx.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        activeContext === ctx.id ? 'border-accent/30 bg-accent/5' : 'border-border-subtle bg-surface-2'
                      }`}
                    >
                      <div className="text-xs font-medium text-text-primary mb-1">{ctx.name}</div>
                      <div className="text-xs text-text-secondary italic">
                        "{examples[ctx.id] ?? 'Example copy for this context.'}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
