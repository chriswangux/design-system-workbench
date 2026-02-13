import { useState, useCallback, useMemo, useRef } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { nanoid } from 'nanoid';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';

// ---- Types ----

interface StateNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface Transition {
  id: string;
  from: string;
  to: string;
  trigger: string;
}

interface StateMachineDefinition {
  states: Array<{ id: string; name: string }>;
  transitions: Array<{ from: string; to: string; trigger: string }>;
}

// ---- Presets ----

interface Preset {
  label: string;
  states: Array<{ name: string }>;
  transitions: Array<{ from: string; to: string; trigger: string }>;
}

const PRESETS: Preset[] = [
  {
    label: 'Button',
    states: [
      { name: 'default' },
      { name: 'hover' },
      { name: 'active' },
      { name: 'focus' },
      { name: 'disabled' },
      { name: 'loading' },
    ],
    transitions: [
      { from: 'default', to: 'hover', trigger: 'mouseenter' },
      { from: 'hover', to: 'default', trigger: 'mouseleave' },
      { from: 'hover', to: 'active', trigger: 'mousedown' },
      { from: 'active', to: 'hover', trigger: 'mouseup' },
      { from: 'default', to: 'focus', trigger: 'focus' },
      { from: 'focus', to: 'default', trigger: 'blur' },
      { from: 'default', to: 'disabled', trigger: 'disable' },
      { from: 'disabled', to: 'default', trigger: 'enable' },
      { from: 'default', to: 'loading', trigger: 'submit' },
      { from: 'loading', to: 'default', trigger: 'complete' },
    ],
  },
  {
    label: 'Input Field',
    states: [
      { name: 'empty' },
      { name: 'focus' },
      { name: 'filled' },
      { name: 'error' },
      { name: 'disabled' },
    ],
    transitions: [
      { from: 'empty', to: 'focus', trigger: 'focus' },
      { from: 'focus', to: 'empty', trigger: 'blur (empty)' },
      { from: 'focus', to: 'filled', trigger: 'blur (value)' },
      { from: 'filled', to: 'focus', trigger: 'focus' },
      { from: 'focus', to: 'error', trigger: 'validate fail' },
      { from: 'error', to: 'focus', trigger: 'focus' },
      { from: 'empty', to: 'disabled', trigger: 'disable' },
      { from: 'disabled', to: 'empty', trigger: 'enable' },
    ],
  },
  {
    label: 'Toggle',
    states: [
      { name: 'off' },
      { name: 'on' },
      { name: 'disabled' },
    ],
    transitions: [
      { from: 'off', to: 'on', trigger: 'toggle' },
      { from: 'on', to: 'off', trigger: 'toggle' },
      { from: 'off', to: 'disabled', trigger: 'disable' },
      { from: 'on', to: 'disabled', trigger: 'disable' },
      { from: 'disabled', to: 'off', trigger: 'enable' },
    ],
  },
  {
    label: 'Dropdown',
    states: [
      { name: 'closed' },
      { name: 'open' },
      { name: 'hover-item' },
      { name: 'selected' },
      { name: 'disabled' },
    ],
    transitions: [
      { from: 'closed', to: 'open', trigger: 'click' },
      { from: 'open', to: 'closed', trigger: 'blur' },
      { from: 'open', to: 'hover-item', trigger: 'mouseenter item' },
      { from: 'hover-item', to: 'open', trigger: 'mouseleave item' },
      { from: 'hover-item', to: 'selected', trigger: 'click item' },
      { from: 'selected', to: 'closed', trigger: 'select' },
      { from: 'closed', to: 'disabled', trigger: 'disable' },
      { from: 'disabled', to: 'closed', trigger: 'enable' },
    ],
  },
  {
    label: 'Modal',
    states: [
      { name: 'hidden' },
      { name: 'opening' },
      { name: 'open' },
      { name: 'closing' },
    ],
    transitions: [
      { from: 'hidden', to: 'opening', trigger: 'open' },
      { from: 'opening', to: 'open', trigger: 'anim-end' },
      { from: 'open', to: 'closing', trigger: 'close' },
      { from: 'closing', to: 'hidden', trigger: 'anim-end' },
      { from: 'open', to: 'closing', trigger: 'escape' },
      { from: 'open', to: 'closing', trigger: 'backdrop click' },
    ],
  },
];

// ---- Color mapping for state names ----

const STATE_COLORS: Record<string, string> = {
  default: 'var(--color-text-tertiary)',
  hover: 'var(--color-info, #5b9bd5)',
  active: 'var(--color-accent)',
  disabled: 'var(--color-text-tertiary)',
  loading: 'var(--color-warning)',
  error: 'var(--color-error)',
  focus: 'var(--color-success)',
};

function getStateColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(STATE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'var(--color-accent)';
}

// ---- Layout helper: arrange nodes in a circle ----

function arrangeInCircle(count: number, cx: number, cy: number, radius: number): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  if (count === 1) return [{ x: cx, y: cy }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

// ---- Constants ----

const NODE_W = 120;
const NODE_H = 40;
const CANVAS_W = 700;
const CANVAS_H = 480;

export default function StateMachineDesignerTool() {
  const [states, setStates] = useState<StateNode[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

  // Transition form state
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newTrigger, setNewTrigger] = useState('');

  // Drag state
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ---- State actions ----

  const addState = useCallback(() => {
    const positions = arrangeInCircle(
      states.length + 1,
      CANVAS_W / 2,
      CANVAS_H / 2,
      Math.min(160, 50 + states.length * 20),
    );
    const newName = `state-${states.length + 1}`;
    const id = nanoid(6);
    const pos = positions[positions.length - 1];
    setStates((prev) => [...prev, { id, name: newName, x: pos.x, y: pos.y }]);
  }, [states.length]);

  const removeState = useCallback((id: string) => {
    setStates((prev) => prev.filter((s) => s.id !== id));
    setTransitions((prev) => prev.filter((t) => t.from !== id && t.to !== id));
    setSelectedStateId((prev) => (prev === id ? null : prev));
  }, []);

  const renameState = useCallback((id: string, name: string) => {
    setStates((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  // ---- Transition actions ----

  const addTransition = useCallback(() => {
    if (!newFrom || !newTo || !newTrigger.trim()) return;
    setTransitions((prev) => [
      ...prev,
      { id: nanoid(6), from: newFrom, to: newTo, trigger: newTrigger.trim() },
    ]);
    setNewTrigger('');
  }, [newFrom, newTo, newTrigger]);

  const removeTransition = useCallback((id: string) => {
    setTransitions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Load preset ----

  const loadPreset = useCallback((preset: Preset) => {
    const positions = arrangeInCircle(
      preset.states.length,
      CANVAS_W / 2,
      CANVAS_H / 2,
      Math.min(180, 60 + preset.states.length * 18),
    );
    const newStates: StateNode[] = preset.states.map((s, i) => ({
      id: nanoid(6),
      name: s.name,
      x: positions[i].x,
      y: positions[i].y,
    }));
    const nameToId = new Map(newStates.map((s) => [s.name, s.id]));
    const newTransitions: Transition[] = preset.transitions
      .filter((t) => nameToId.has(t.from) && nameToId.has(t.to))
      .map((t) => ({
        id: nanoid(6),
        from: nameToId.get(t.from)!,
        to: nameToId.get(t.to)!,
        trigger: t.trigger,
      }));
    setStates(newStates);
    setTransitions(newTransitions);
    setSelectedStateId(null);
    setNewFrom('');
    setNewTo('');
    setNewTrigger('');
  }, []);

  // ---- Drag handlers ----

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const node = states.find((s) => s.id === id);
      if (!node) return;
      setDragging({
        id,
        offsetX: e.clientX - rect.left - node.x,
        offsetY: e.clientY - rect.top - node.y,
      });
      setSelectedStateId(id);
    },
    [states],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(NODE_W / 2, Math.min(CANVAS_W - NODE_W / 2, e.clientX - rect.left - dragging.offsetX));
      const y = Math.max(NODE_H / 2, Math.min(CANVAS_H - NODE_H / 2, e.clientY - rect.top - dragging.offsetY));
      setStates((prev) =>
        prev.map((s) => (s.id === dragging.id ? { ...s, x, y } : s)),
      );
    },
    [dragging],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ---- Export ----

  const exportJson = useMemo((): StateMachineDefinition => {
    return {
      states: states.map((s) => ({ id: s.id, name: s.name })),
      transitions: transitions.map((t) => {
        const fromName = states.find((s) => s.id === t.from)?.name ?? t.from;
        const toName = states.find((s) => s.id === t.to)?.name ?? t.to;
        return { from: fromName, to: toName, trigger: t.trigger };
      }),
    };
  }, [states, transitions]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(exportJson, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'state-machine.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJson]);

  // ---- Compute edge paths ----

  const stateMap = useMemo(() => new Map(states.map((s) => [s.id, s])), [states]);

  // Group transitions by from-to pair to offset parallel edges
  const edgeGroups = useMemo(() => {
    const groups = new Map<string, Transition[]>();
    for (const t of transitions) {
      const key = [t.from, t.to].sort().join('|');
      const existing = groups.get(key) ?? [];
      existing.push(t);
      groups.set(key, existing);
    }
    return groups;
  }, [transitions]);

  // ---- Render ----

  const selectClasses = 'w-full bg-surface-3 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50';
  const inputClasses = selectClasses;

  return (
    <ToolLayout
      title="State Machine Designer"
      description="Visual node-and-edge editor for component interaction states and transitions"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            {/* Preset templates */}
            <ParameterSection title="Templates">
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => loadPreset(preset)}
                    className="px-2.5 py-1 text-xs rounded-md bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-subtle hover:border-accent/30 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </ParameterSection>

            {/* States */}
            <ParameterSection title="States">
              <div className="space-y-1.5">
                {states.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                      selectedStateId === s.id
                        ? 'bg-accent/10 border border-accent/30'
                        : 'bg-surface-2 border border-transparent hover:bg-surface-3'
                    }`}
                    onClick={() => setSelectedStateId(s.id)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getStateColor(s.name) }}
                    />
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => renameState(s.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-xs text-text-primary outline-none min-w-0"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeState(s.id);
                      }}
                      className="p-0.5 text-text-tertiary hover:text-error transition-colors opacity-0 hover:opacity-100"
                      style={{ opacity: selectedStateId === s.id ? 1 : undefined }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addState}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 mt-1 text-xs text-text-tertiary hover:text-accent rounded-md hover:bg-surface-2 transition-colors"
              >
                <Plus size={12} />
                Add State
              </button>
            </ParameterSection>

            {/* Add Transition */}
            <ParameterSection title="Add Transition">
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-text-tertiary mb-0.5 block">Source</label>
                  <select
                    value={newFrom}
                    onChange={(e) => setNewFrom(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Select source...</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary mb-0.5 block">Target</label>
                  <select
                    value={newTo}
                    onChange={(e) => setNewTo(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Select target...</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-text-tertiary mb-0.5 block">Trigger</label>
                  <input
                    type="text"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTransition();
                    }}
                    placeholder="e.g. click, hover, focus"
                    className={inputClasses}
                  />
                </div>
                <button
                  onClick={addTransition}
                  disabled={!newFrom || !newTo || !newTrigger.trim()}
                  className="w-full px-2 py-1.5 text-xs rounded-md bg-accent text-surface-0 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  Add Transition
                </button>
              </div>
            </ParameterSection>

            {/* Transitions list */}
            <ParameterSection title="Transitions">
              {transitions.length === 0 ? (
                <p className="text-[10px] text-text-tertiary">No transitions yet.</p>
              ) : (
                <div className="space-y-1">
                  {transitions.map((t) => {
                    const fromNode = stateMap.get(t.from);
                    const toNode = stateMap.get(t.to);
                    const isHighlighted = selectedStateId === t.from;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                          isHighlighted ? 'bg-accent/5' : ''
                        }`}
                      >
                        <span className="text-text-secondary truncate">
                          {fromNode?.name ?? '?'}
                        </span>
                        <span className="text-text-tertiary shrink-0">&rarr;</span>
                        <span className="text-text-secondary truncate">
                          {toNode?.name ?? '?'}
                        </span>
                        <span className="text-[10px] text-accent font-mono truncate ml-auto">
                          {t.trigger}
                        </span>
                        <button
                          onClick={() => removeTransition(t.id)}
                          className="p-0.5 text-text-tertiary hover:text-error transition-colors shrink-0"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ParameterSection>

            {/* Export */}
            {states.length > 0 && (
              <div className="px-4 py-3">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs rounded-md bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-subtle transition-colors"
                >
                  <Download size={12} />
                  Export JSON
                </button>
              </div>
            )}
          </div>
        }
        right={
          <div className="p-6 space-y-6">
            {/* SVG Canvas */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                State Diagram
              </h3>
              <div
                className="border border-border-subtle rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-1)' }}
              >
                <svg
                  ref={svgRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="w-full"
                  viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => setSelectedStateId(null)}
                  style={{ cursor: dragging ? 'grabbing' : 'default' }}
                >
                  {/* Arrow marker definitions */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="6"
                      refX="8"
                      refY="3"
                      orient="auto"
                    >
                      <path
                        d="M0,0 L8,3 L0,6"
                        fill="var(--color-text-tertiary)"
                      />
                    </marker>
                    <marker
                      id="arrowhead-active"
                      markerWidth="8"
                      markerHeight="6"
                      refX="8"
                      refY="3"
                      orient="auto"
                    >
                      <path
                        d="M0,0 L8,3 L0,6"
                        fill="var(--color-accent)"
                      />
                    </marker>
                  </defs>

                  {/* Empty state message */}
                  {states.length === 0 && (
                    <text
                      x={CANVAS_W / 2}
                      y={CANVAS_H / 2}
                      textAnchor="middle"
                      fill="var(--color-text-tertiary)"
                      fontSize="13"
                    >
                      Add states or load a template to get started
                    </text>
                  )}

                  {/* Transition edges */}
                  {transitions.map((t) => {
                    const fromNode = stateMap.get(t.from);
                    const toNode = stateMap.get(t.to);
                    if (!fromNode || !toNode) return null;

                    const isHighlighted = selectedStateId === t.from;

                    // Determine offset for parallel edges
                    const pairKey = [t.from, t.to].sort().join('|');
                    const group = edgeGroups.get(pairKey) ?? [];
                    const idxInGroup = group.indexOf(t);
                    const totalInGroup = group.length;
                    const offsetMultiplier = idxInGroup - (totalInGroup - 1) / 2;

                    // Self-loop
                    if (t.from === t.to) {
                      const loopR = 30;
                      return (
                        <g key={t.id}>
                          <path
                            d={`M${fromNode.x + 10},${fromNode.y - NODE_H / 2} C${fromNode.x + 10 + loopR},${fromNode.y - NODE_H / 2 - loopR * 2} ${fromNode.x - 10 - loopR},${fromNode.y - NODE_H / 2 - loopR * 2} ${fromNode.x - 10},${fromNode.y - NODE_H / 2}`}
                            fill="none"
                            stroke={isHighlighted ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                            strokeWidth={isHighlighted ? 1.5 : 1}
                            markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                            opacity={isHighlighted ? 1 : 0.5}
                          />
                          <text
                            x={fromNode.x}
                            y={fromNode.y - NODE_H / 2 - loopR * 1.5}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fill={isHighlighted ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                          >
                            {t.trigger}
                          </text>
                        </g>
                      );
                    }

                    // Compute direction vector
                    const dx = toNode.x - fromNode.x;
                    const dy = toNode.y - fromNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Perpendicular offset for parallel edges
                    const perpX = -ny * offsetMultiplier * 15;
                    const perpY = nx * offsetMultiplier * 15;

                    // Midpoint for curve control and label
                    const midX = (fromNode.x + toNode.x) / 2 + perpX * 2;
                    const midY = (fromNode.y + toNode.y) / 2 + perpY * 2;

                    // Edge from node border
                    const startX = fromNode.x + nx * (NODE_W / 2) + perpX;
                    const startY = fromNode.y + ny * (NODE_H / 2) + perpY;
                    const endX = toNode.x - nx * (NODE_W / 2 + 8) + perpX;
                    const endY = toNode.y - ny * (NODE_H / 2 + 8) + perpY;

                    return (
                      <g key={t.id}>
                        <path
                          d={`M${startX},${startY} Q${midX},${midY} ${endX},${endY}`}
                          fill="none"
                          stroke={isHighlighted ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                          strokeWidth={isHighlighted ? 1.5 : 1}
                          markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                          opacity={isHighlighted ? 1 : 0.5}
                        />
                        {/* Trigger label */}
                        <text
                          x={midX}
                          y={midY - 5}
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                          fill={isHighlighted ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                        >
                          {t.trigger}
                        </text>
                      </g>
                    );
                  })}

                  {/* State nodes */}
                  {states.map((s) => {
                    const isSelected = selectedStateId === s.id;
                    const color = getStateColor(s.name);
                    return (
                      <g
                        key={s.id}
                        onMouseDown={(e) => handleMouseDown(e, s.id)}
                        style={{ cursor: dragging?.id === s.id ? 'grabbing' : 'grab' }}
                      >
                        {/* Selection ring */}
                        {isSelected && (
                          <rect
                            x={s.x - NODE_W / 2 - 3}
                            y={s.y - NODE_H / 2 - 3}
                            width={NODE_W + 6}
                            height={NODE_H + 6}
                            rx={12}
                            fill="none"
                            stroke="var(--color-accent)"
                            strokeWidth={2}
                            strokeDasharray="4 2"
                            opacity={0.6}
                          />
                        )}
                        {/* Node body */}
                        <rect
                          x={s.x - NODE_W / 2}
                          y={s.y - NODE_H / 2}
                          width={NODE_W}
                          height={NODE_H}
                          rx={8}
                          fill="var(--color-surface-2)"
                          stroke={isSelected ? 'var(--color-accent)' : 'var(--color-border-subtle)'}
                          strokeWidth={isSelected ? 1.5 : 1}
                        />
                        {/* Color dot */}
                        <circle
                          cx={s.x - NODE_W / 2 + 16}
                          cy={s.y}
                          r={4}
                          fill={color}
                        />
                        {/* State name */}
                        <text
                          x={s.x + 4}
                          y={s.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="11"
                          fontFamily="monospace"
                          fill="var(--color-text-primary)"
                          pointerEvents="none"
                        >
                          {s.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* JSON output */}
            {states.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  State Machine Definition
                </h3>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(exportJson, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
