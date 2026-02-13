import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenTree, buildDependencyGraph } from '@/core/tokens/resolve';
import type { Token, TokenTier } from '@/core/tokens/types';

// ---- Types ----

interface GraphNode {
  id: string;
  group: string;
  tier: TokenTier | 'unknown';
  token: Token;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

// ---- Constants ----

const GROUP_COLORS: Record<string, string> = {
  color: 'var(--color-accent)',
  spacing: '#22c55e',
  typography: '#f59e0b',
  shadow: '#8b5cf6',
  motion: '#ec4899',
  grid: '#06b6d4',
  breakpoint: '#14b8a6',
  dataViz: '#f97316',
};

const GROUP_FALLBACK_COLOR = 'var(--color-text-tertiary)';

function getGroupColor(group: string): string {
  return GROUP_COLORS[group] ?? GROUP_FALLBACK_COLOR;
}

function getTier(token: Token): TokenTier | 'unknown' {
  if (token.$extensions && 'com.dsw.tier' in token.$extensions) {
    return token.$extensions['com.dsw.tier'] as TokenTier;
  }
  return 'unknown';
}

// ---- Force simulation ----

function runForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number,
): void {
  const repulsionStrength = 800;
  const attractionStrength = 0.005;
  const damping = 0.9;
  const centerX = width / 2;
  const centerY = height / 2;
  const centerGravity = 0.01;

  // Build adjacency for quick lookup
  const edgeMap = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, new Set());
    edgeMap.get(e.source)!.add(e.target);
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion: all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist2 = dx * dx + dy * dy;
        const dist = Math.sqrt(dist2) || 1;
        const force = repulsionStrength / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Attraction: connected pairs
    const nodeMap = new Map<string, GraphNode>();
    for (const n of nodes) nodeMap.set(n.id, n);

    for (const e of edges) {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attractionStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (centerX - n.x) * centerGravity;
      n.vy += (centerY - n.y) * centerGravity;
    }

    // Apply velocity and damping
    for (const n of nodes) {
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      // Keep in bounds
      n.x = Math.max(20, Math.min(width - 20, n.x));
      n.y = Math.max(20, Math.min(height - 20, n.y));
    }
  }
}

// ---- Main Tool ----

const ALL_GROUPS = ['color', 'spacing', 'typography', 'shadow', 'motion', 'grid', 'breakpoint', 'dataViz'];
const ALL_TIERS: Array<TokenTier | 'unknown'> = ['primitive', 'semantic', 'component', 'unknown'];

export default function TokenRelationshipGraphTool() {
  const tokens = useTokenStore((s) => s.tokens);

  const [filterGroups, setFilterGroups] = useState<Set<string>>(new Set(ALL_GROUPS));
  const [filterTiers, setFilterTiers] = useState<Set<string>>(new Set(ALL_TIERS));
  const [nodeSize, setNodeSize] = useState(6);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const svgWidth = 600;
  const svgHeight = 500;

  // Build graph data from token tree
  const { nodes, edges, tokenMap } = useMemo(() => {
    const allTokens = flattenTokenTree(tokens);
    const depGraph = buildDependencyGraph(tokens);

    const nodesList: GraphNode[] = [];
    const tMap = new Map<string, Token>();

    for (const { path, token } of allTokens) {
      const id = path.join('.');
      const group = path[0];
      const tier = getTier(token);
      if (!filterGroups.has(group)) continue;
      if (!filterTiers.has(tier)) continue;

      tMap.set(id, token);
      nodesList.push({
        id,
        group,
        tier,
        token,
        x: svgWidth / 2 + (Math.random() - 0.5) * svgWidth * 0.6,
        y: svgHeight / 2 + (Math.random() - 0.5) * svgHeight * 0.6,
        vx: 0,
        vy: 0,
      });
    }

    const nodeIds = new Set(nodesList.map((n) => n.id));
    const edgesList: GraphEdge[] = [];
    for (const [source, targets] of depGraph.entries()) {
      if (!nodeIds.has(source)) continue;
      for (const target of targets) {
        if (!nodeIds.has(target)) continue;
        edgesList.push({ source, target });
      }
    }

    // Run simulation
    if (nodesList.length > 0 && nodesList.length <= 500) {
      const iters = Math.max(50, Math.min(200, 200 - nodesList.length));
      runForceSimulation(nodesList, edgesList, svgWidth, svgHeight, iters);
    }

    return { nodes: nodesList, edges: edgesList, tokenMap: tMap };
  }, [tokens, filterGroups, filterTiers, svgWidth, svgHeight]);

  const toggleGroup = useCallback((group: string) => {
    setFilterGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
    setSelectedNode(null);
  }, []);

  const toggleTier = useCallback((tier: string) => {
    setFilterTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
    setSelectedNode(null);
  }, []);

  // Get details for selected node
  const selectedDetails = useMemo(() => {
    if (!selectedNode) return null;
    const token = tokenMap.get(selectedNode);
    if (!token) return null;
    const path = selectedNode.split('.');
    const group = path[0];
    const tier = getTier(token);
    const type = token.$type;
    const desc = token.$description ?? '';

    // Find references: edges where this node is source or target
    const referencesTo = edges.filter((e) => e.source === selectedNode).map((e) => e.target);
    const referencedBy = edges.filter((e) => e.target === selectedNode).map((e) => e.source);

    let valueStr: string;
    if (typeof token.$value === 'string') {
      valueStr = token.$value;
    } else if (typeof token.$value === 'number') {
      valueStr = String(token.$value);
    } else if (Array.isArray(token.$value)) {
      valueStr = JSON.stringify(token.$value);
    } else if (typeof token.$value === 'object' && token.$value !== null) {
      valueStr = JSON.stringify(token.$value, null, 1);
    } else {
      valueStr = String(token.$value);
    }

    return { path: selectedNode, group, tier, type, desc, valueStr, referencesTo, referencedBy };
  }, [selectedNode, tokenMap, edges]);

  // Get unique present groups from the data
  const presentGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const n of nodes) groups.add(n.group);
    return [...groups].sort();
  }, [nodes]);

  const hasTokens = nodes.length > 0;

  return (
    <ToolLayout
      title="Token Relationship Graph"
      description="Visualize how tokens reference each other through aliases"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Filter by Group">
              <div className="flex flex-wrap gap-1.5">
                {ALL_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                      filterGroups.has(g)
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-tertiary hover:bg-surface-3 border border-transparent line-through'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: getGroupColor(g) }}
                    />
                    {g}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Filter by Tier">
              <div className="flex flex-wrap gap-1.5">
                {ALL_TIERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTier(t)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors capitalize ${
                      filterTiers.has(t)
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-tertiary hover:bg-surface-3 border border-transparent line-through'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Display">
              <SliderWithInput
                label="Node Size"
                value={nodeSize}
                onChange={setNodeSize}
                min={3}
                max={14}
                step={1}
                unit="px"
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">Show labels</label>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${
                    showLabels ? 'bg-accent' : 'bg-surface-3'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface-0 transition-transform ${
                      showLabels ? 'left-[16px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </ParameterSection>

            <ParameterSection title="Summary">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Nodes</span>
                  <span className="text-text-secondary font-mono">{nodes.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Edges (aliases)</span>
                  <span className="text-text-secondary font-mono">{edges.length}</span>
                </div>
              </div>
            </ParameterSection>

            {selectedDetails && (
              <ParameterSection title="Selected Token">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-text-tertiary block text-[10px]">Path</span>
                    <span className="text-text-primary font-mono break-all">{selectedDetails.path}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Type</span>
                      <span className="text-text-secondary">{selectedDetails.type}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Tier</span>
                      <span className="text-text-secondary capitalize">{selectedDetails.tier}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Group</span>
                      <span className="text-text-secondary">{selectedDetails.group}</span>
                    </div>
                  </div>
                  {selectedDetails.desc && (
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Description</span>
                      <span className="text-text-secondary">{selectedDetails.desc}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-text-tertiary block text-[10px]">Value</span>
                    <pre className="text-text-secondary font-mono text-[10px] bg-surface-2 rounded p-1.5 overflow-x-auto max-h-20 border border-border-subtle">
                      {selectedDetails.valueStr}
                    </pre>
                  </div>
                  {selectedDetails.referencesTo.length > 0 && (
                    <div>
                      <span className="text-text-tertiary block text-[10px]">References to</span>
                      {selectedDetails.referencesTo.map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedNode(r)}
                          className="block text-accent text-[10px] font-mono hover:underline"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedDetails.referencedBy.length > 0 && (
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Referenced by</span>
                      {selectedDetails.referencedBy.map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedNode(r)}
                          className="block text-accent text-[10px] font-mono hover:underline"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ParameterSection>
            )}
          </div>
        }
        right={
          <div className="p-6 space-y-4">
            {!hasTokens ? (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mb-3">
                  <span className="text-text-tertiary text-lg">&#8644;</span>
                </div>
                <p className="text-sm text-text-secondary">No Tokens Found</p>
                <p className="text-xs text-text-tertiary mt-1 max-w-xs">
                  Generate tokens using the design tools (Color Lab, Spacing Lab, etc.) to see their relationships visualized here.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-hidden">
                  <svg
                    width={svgWidth}
                    height={svgHeight}
                    className="block w-full"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  >
                    {/* Edges */}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="6"
                        markerHeight="4"
                        refX="6"
                        refY="2"
                        orient="auto"
                      >
                        <polygon points="0 0, 6 2, 0 4" fill="var(--color-text-tertiary)" fillOpacity={0.5} />
                      </marker>
                    </defs>
                    {edges.map((e, i) => {
                      const source = nodes.find((n) => n.id === e.source);
                      const target = nodes.find((n) => n.id === e.target);
                      if (!source || !target) return null;
                      const isHighlighted = selectedNode === e.source || selectedNode === e.target;
                      return (
                        <line
                          key={i}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke={isHighlighted ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                          strokeOpacity={isHighlighted ? 0.6 : 0.15}
                          strokeWidth={isHighlighted ? 1.5 : 0.75}
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })}

                    {/* Nodes */}
                    {nodes.map((n) => {
                      const isSelected = selectedNode === n.id;
                      const isConnected =
                        selectedNode !== null &&
                        (edges.some(
                          (e) =>
                            (e.source === selectedNode && e.target === n.id) ||
                            (e.target === selectedNode && e.source === n.id),
                        ));
                      const dimmed = selectedNode !== null && !isSelected && !isConnected;
                      return (
                        <g key={n.id} onClick={() => setSelectedNode(selectedNode === n.id ? null : n.id)} className="cursor-pointer">
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={isSelected ? nodeSize + 2 : nodeSize}
                            fill={getGroupColor(n.group)}
                            fillOpacity={dimmed ? 0.15 : 0.8}
                            stroke={isSelected ? 'var(--color-text-primary)' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                          {showLabels && !dimmed && (
                            <text
                              x={n.x}
                              y={n.y - nodeSize - 3}
                              textAnchor="middle"
                              className="fill-text-secondary"
                              fontSize={8}
                              style={{ pointerEvents: 'none' }}
                            >
                              {n.id.split('.').slice(-1)[0]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Legend
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {presentGroups.map((g) => (
                      <div key={g} className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: getGroupColor(g) }}
                        />
                        <span className="text-[10px] text-text-tertiary capitalize">{g}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2 border-l border-border-subtle pl-3">
                      <svg width="20" height="8">
                        <line x1="0" y1="4" x2="16" y2="4" stroke="var(--color-text-tertiary)" strokeWidth="1" strokeOpacity="0.4" />
                        <polygon points="14,2 18,4 14,6" fill="var(--color-text-tertiary)" fillOpacity="0.5" />
                      </svg>
                      <span className="text-[10px] text-text-tertiary">Alias reference</span>
                    </div>
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
