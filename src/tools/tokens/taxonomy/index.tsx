import { useState, useMemo, useCallback } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenTree } from '@/core/tokens/resolve';
import { isAlias, type Token, type TokenType, type TokenTier, type TokenTree, type TokenGroup } from '@/core/tokens/types';

const TOKEN_TYPES: TokenType[] = [
  'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier',
  'number', 'shadow', 'border', 'transition', 'gradient', 'strokeStyle',
  'typography', 'spacing', 'opacity', 'lineHeight', 'letterSpacing', 'breakpoint', 'grid',
];

const TIERS: TokenTier[] = ['semantic', 'component'];

interface AliasFormState {
  path: string;
  type: TokenType;
  reference: string;
  tier: TokenTier;
  description: string;
}

const DEFAULT_FORM: AliasFormState = {
  path: '',
  type: 'color',
  reference: '',
  tier: 'semantic',
  description: '',
};

function getTier(token: Token): TokenTier {
  return (token.$extensions?.['com.dsw.tier'] as TokenTier) ?? 'primitive';
}

function tierColor(tier: TokenTier): string {
  switch (tier) {
    case 'primitive': return 'bg-surface-3 text-text-tertiary';
    case 'semantic': return 'bg-blue-500/15 text-blue-600';
    case 'component': return 'bg-purple-500/15 text-purple-600';
  }
}

function typeIcon(type: TokenType): string {
  switch (type) {
    case 'color': return '\u25CF';       // filled circle
    case 'dimension':
    case 'spacing': return '\u2195';     // up-down arrow (ruler)
    case 'duration': return '\u23F1';    // stopwatch
    case 'typography':
    case 'fontFamily':
    case 'fontWeight':
    case 'lineHeight':
    case 'letterSpacing': return 'Aa';
    case 'shadow': return '\u2592';      // medium shade
    case 'cubicBezier': return '\u223F'; // sine wave
    case 'number':
    case 'opacity': return '#';
    case 'border':
    case 'strokeStyle': return '\u25A1'; // white square
    case 'gradient': return '\u25C8';    // diamond in circle
    case 'transition': return '\u21C4';  // right-left arrows
    case 'grid':
    case 'breakpoint': return '\u2637';  // trigram for earth
    default: return '\u2022';            // bullet
  }
}

// Build a nested tree structure from flat token entries for visualization
interface TreeNode {
  name: string;
  fullPath: string;
  children: TreeNode[];
  token?: Token;
  isGroup: boolean;
}

function buildTree(tokens: TokenTree): TreeNode[] {
  const flat = flattenTokenTree(tokens);
  const root: TreeNode = { name: 'root', fullPath: '', children: [], isGroup: true };

  for (const { path, token } of flat) {
    let current = root;
    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const fullPath = path.slice(0, i + 1).join('.');
      let child = current.children.find((c) => c.name === segment);
      if (!child) {
        child = {
          name: segment,
          fullPath,
          children: [],
          isGroup: i < path.length - 1,
        };
        current.children.push(child);
      }
      if (i === path.length - 1) {
        child.token = token;
        child.isGroup = false;
      }
      current = child;
    }
  }

  return root.children;
}

function detectPatterns(tokens: Array<{ path: string[]; token: Token }>): string[] {
  const patternMap = new Map<string, number>();

  for (const { path } of tokens) {
    if (path.length >= 2) {
      // Replace the last segment with a placeholder
      const pattern = [...path.slice(0, -1), `{${inferPlaceholder(path)}}`].join('.');
      patternMap.set(pattern, (patternMap.get(pattern) ?? 0) + 1);
    }
  }

  // Keep patterns with more than one token
  return Array.from(patternMap.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([pattern, count]) => `${pattern} (${count})`);
}

function inferPlaceholder(path: string[]): string {
  const last = path[path.length - 1];
  if (/^\d+$/.test(last)) return 'step';
  if (/^(xs|sm|md|lg|xl|2xl|3xl)$/.test(last)) return 'scale';
  if (/^\d{2,3}$/.test(last)) return 'weight';
  return 'name';
}

function TreeNodeView({
  node,
  depth,
  expanded,
  onToggle,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onDelete?: (path: string) => void;
}) {
  const isOpen = expanded.has(node.fullPath);
  const hasChildren = node.children.length > 0;
  const isGroup = node.isGroup || hasChildren;
  const tier = node.token ? getTier(node.token) : null;
  const alias = node.token && isAlias(node.token);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 hover:bg-surface-2/50 rounded px-1 group"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        {/* Expand/collapse toggle */}
        {isGroup ? (
          <button
            onClick={() => onToggle(node.fullPath)}
            className="w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-text-primary text-[10px] shrink-0"
          >
            {isOpen ? '\u25BE' : '\u25B8'}
          </button>
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {/* Icon */}
        {isGroup && !node.token ? (
          <span className="text-[11px] text-text-tertiary shrink-0">{isOpen ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}</span>
        ) : node.token ? (
          <span className="text-[10px] text-text-tertiary shrink-0 w-4 text-center font-mono">
            {typeIcon(node.token.$type)}
          </span>
        ) : null}

        {/* Name */}
        <span className={`text-[11px] truncate ${node.token ? 'text-text-primary' : 'text-text-secondary font-medium'}`}>
          {node.name}
        </span>

        {/* Tier badge */}
        {tier && (
          <span className={`px-1 py-0 rounded text-[8px] font-semibold shrink-0 ${tierColor(tier)}`}>
            {tier}
          </span>
        )}

        {/* Alias indicator */}
        {alias && (
          <span className="text-[9px] text-text-tertiary font-mono truncate max-w-[140px]" title={node.token!.$value as string}>
            {'\u2192'} {(node.token!.$value as string).replace(/[{}]/g, '')}
          </span>
        )}

        {/* Delete button for alias tokens */}
        {alias && onDelete && (
          <button
            onClick={() => onDelete(node.fullPath)}
            className="opacity-0 group-hover:opacity-100 text-[10px] text-text-tertiary hover:text-error transition-all ml-auto shrink-0 px-1"
            title="Remove alias token"
          >
            {'\u2715'}
          </button>
        )}
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeView
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TokenTaxonomyBuilderTool() {
  const tokens = useTokenStore((s) => s.tokens);
  const setToken = useTokenStore((s) => s.setToken);
  const removeToken = useTokenStore((s) => s.removeToken);

  const [form, setForm] = useState<AliasFormState>(DEFAULT_FORM);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const flatTokens = useMemo(() => flattenTokenTree(tokens), [tokens]);

  const tokenPaths = useMemo(
    () => flatTokens.map(({ path }) => path.join('.')),
    [flatTokens],
  );

  const tree = useMemo(() => buildTree(tokens), [tokens]);

  const stats = useMemo(() => {
    let primitives = 0;
    let semantics = 0;
    let components = 0;
    let aliases = 0;

    for (const { token } of flatTokens) {
      const tier = getTier(token);
      if (tier === 'primitive') primitives++;
      else if (tier === 'semantic') semantics++;
      else if (tier === 'component') components++;
      if (isAlias(token)) aliases++;
    }

    return { total: flatTokens.length, primitives, semantics, components, aliases };
  }, [flatTokens]);

  const patterns = useMemo(() => detectPatterns(flatTokens), [flatTokens]);

  const aliasTokens = useMemo(
    () => flatTokens.filter(({ token }) => isAlias(token)),
    [flatTokens],
  );

  const updateForm = (updates: Partial<AliasFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleCreate = useCallback(() => {
    if (!form.path.trim() || !form.reference) return;

    const path = form.path.trim().split('.');
    const aliasToken = {
      $value: `{${form.reference}}`,
      $type: form.type,
      $description: form.description || undefined,
      $extensions: {
        'com.dsw.tier': form.tier,
      },
    };

    setToken(path, aliasToken);
    setForm(DEFAULT_FORM);
  }, [form, setToken]);

  const handleDelete = useCallback(
    (fullPath: string) => {
      removeToken(fullPath.split('.'));
    },
    [removeToken],
  );

  const handleToggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0 || node.isGroup) {
          allPaths.add(node.fullPath);
        }
        walk(node.children);
      }
    };
    walk(tree);
    setExpanded(allPaths);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const hasTokens = flatTokens.length > 0;
  const canCreate = form.path.trim() !== '' && form.reference !== '';

  return (
    <ToolLayout
      title="Token Taxonomy Builder"
      description="Design token naming hierarchy and create semantic/component aliases"
    >
      <SplitPanel
        leftWidth="380px"
        left={
          <div>
            <ParameterSection title="Create Alias Token">
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1 block">Token Path</label>
                  <input
                    type="text"
                    value={form.path}
                    onChange={(e) => updateForm({ path: e.target.value })}
                    placeholder="color.surface.primary"
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-text-tertiary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1 block">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => updateForm({ type: e.target.value as TokenType })}
                      className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50"
                    >
                      {TOKEN_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1 block">Tier</label>
                    <div className="flex gap-1">
                      {TIERS.map((tier) => (
                        <button
                          key={tier}
                          onClick={() => updateForm({ tier })}
                          className={`flex-1 px-2 py-1.5 text-[10px] rounded capitalize transition-colors ${
                            form.tier === tier
                              ? 'bg-accent/10 text-accent border border-accent/30'
                              : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1 block">References</label>
                  <select
                    value={form.reference}
                    onChange={(e) => updateForm({ reference: e.target.value })}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50"
                  >
                    <option value="">Select a token...</option>
                    {tokenPaths.map((p) => (
                      <option key={p} value={p}>{`{${p}}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full bg-surface-3 border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-text-tertiary/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!canCreate}
                  className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
                    canCreate
                      ? 'bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25'
                      : 'bg-surface-3 text-text-tertiary border border-transparent cursor-not-allowed'
                  }`}
                >
                  Create Alias
                </button>
              </div>
            </ParameterSection>

            <ParameterSection title={`Alias Tokens (${aliasTokens.length})`}>
              {aliasTokens.length === 0 ? (
                <p className="text-[11px] text-text-tertiary">No alias tokens created yet.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {aliasTokens.map(({ path, token }) => (
                    <div
                      key={path.join('.')}
                      className="flex items-center justify-between gap-1 bg-surface-2 rounded px-2 py-1.5 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-text-primary truncate font-mono">
                          {path.join('.')}
                        </div>
                        <div className="text-[9px] text-text-tertiary truncate font-mono">
                          {'\u2192'} {(token.$value as string).replace(/[{}]/g, '')}
                        </div>
                      </div>
                      <span className={`px-1 py-0 rounded text-[8px] font-semibold shrink-0 ${tierColor(getTier(token))}`}>
                        {getTier(token)}
                      </span>
                      <button
                        onClick={() => removeToken(path)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-text-tertiary hover:text-error transition-all shrink-0"
                        title="Delete"
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ParameterSection>

            <ParameterSection title="Naming Convention">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-text-tertiary">Separator:</span>
                  <code className="bg-surface-3 px-1.5 py-0.5 rounded text-text-primary font-mono text-[10px]">.</code>
                  <span className="text-text-tertiary">(dot notation)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-text-tertiary">Tiers:</span>
                  <span className={`px-1 py-0 rounded text-[8px] font-semibold ${tierColor('primitive')}`}>primitive</span>
                  <span className={`px-1 py-0 rounded text-[8px] font-semibold ${tierColor('semantic')}`}>semantic</span>
                  <span className={`px-1 py-0 rounded text-[8px] font-semibold ${tierColor('component')}`}>component</span>
                </div>
                <p className="text-[10px] text-text-tertiary leading-snug">
                  Primitives are raw values. Semantic tokens reference primitives with
                  purpose-based names. Component tokens reference semantics for specific UI elements.
                </p>
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {!hasTokens ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-sm text-text-secondary mb-2">No tokens in the project</div>
                <p className="text-xs text-text-tertiary max-w-xs">
                  Generate tokens using the Color Lab, Spacing Lab, Typography Lab, or other
                  generator tools. The taxonomy builder will visualize and organize them.
                </p>
              </div>
            ) : (
              <>
                {/* Statistics */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Statistics
                </h3>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {([
                    ['Total', stats.total, 'bg-surface-2 text-text-primary'],
                    ['Primitive', stats.primitives, 'bg-surface-2 text-text-tertiary'],
                    ['Semantic', stats.semantics, 'bg-blue-500/10 text-blue-600'],
                    ['Component', stats.components, 'bg-purple-500/10 text-purple-600'],
                    ['Aliases', stats.aliases, 'bg-surface-2 text-text-secondary'],
                  ] as const).map(([label, count, cls]) => (
                    <div key={label} className={`rounded-lg border border-border-subtle p-2 text-center ${cls}`}>
                      <div className="text-lg font-semibold font-mono">{count}</div>
                      <div className="text-[9px] uppercase tracking-wider opacity-70">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Token Tree */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Token Tree
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={expandAll}
                      className="px-2 py-0.5 text-[10px] text-text-tertiary hover:text-text-secondary bg-surface-2 rounded border border-border-subtle transition-colors"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAll}
                      className="px-2 py-0.5 text-[10px] text-text-tertiary hover:text-text-secondary bg-surface-2 rounded border border-border-subtle transition-colors"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-2 mb-6 max-h-[400px] overflow-y-auto">
                  {tree.map((node) => (
                    <TreeNodeView
                      key={node.fullPath}
                      node={node}
                      depth={0}
                      expanded={expanded}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                {/* Naming Patterns */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Detected Naming Patterns
                </h3>
                {patterns.length > 0 ? (
                  <div className="bg-surface-2 rounded-lg border border-border-subtle p-3 mb-6">
                    <div className="space-y-1">
                      {patterns.map((pattern, i) => (
                        <div key={i} className="text-[11px] font-mono text-text-secondary">
                          {pattern}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary mb-6">
                    Not enough tokens to detect naming patterns.
                  </p>
                )}

                {/* Token Legend */}
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Type Legend
                </h3>
                <div className="bg-surface-2 rounded-lg border border-border-subtle p-3">
                  <div className="flex flex-wrap gap-3">
                    {(['color', 'dimension', 'typography', 'shadow', 'duration', 'cubicBezier', 'number', 'border'] as TokenType[]).map((type) => (
                      <div key={type} className="flex items-center gap-1">
                        <span className="text-[10px] text-text-tertiary font-mono w-4 text-center">
                          {typeIcon(type)}
                        </span>
                        <span className="text-[10px] text-text-secondary">{type}</span>
                      </div>
                    ))}
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
