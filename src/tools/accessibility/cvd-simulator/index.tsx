import { useState, useMemo } from 'react';
import { Eye, EyeOff, AlertTriangle, Layers, Copy, Check } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import { simulateCVD, CVD_TYPES, type CVDType } from '@/core/engine/color/cvdSimulation';
import { toHex, toRgb } from '@/core/engine/color/oklch';
import type { ColorValue } from '@/core/tokens/types';

// ---- Constants ----

const DELTA_THRESHOLD = 30; // perceptual distance threshold for flagging differences

const CVD_DESCRIPTIONS: Record<CVDType, string> = {
  protanopia: 'Red-blind. Difficulty distinguishing red and green hues. Red appears darker and shifts toward brown/olive.',
  deuteranopia: 'Green-blind. Most common form. Red and green are confused, but brightness perception is normal.',
  tritanopia: 'Blue-blind. Blue and yellow are confused. Very rare. Blues shift toward cyan, yellows toward pink.',
  achromatopsia: 'Complete color blindness. Only lightness differences are perceived. All hue and chroma information is lost.',
};

// ---- Helpers ----

/** Compute a simple Euclidean distance in sRGB space as a rough perceptual delta. */
function colorDelta(a: ColorValue, b: ColorValue): number {
  const rgbA = toRgb(a);
  const rgbB = toRgb(b);
  return Math.sqrt(
    (rgbA.r - rgbB.r) ** 2 +
    (rgbA.g - rgbB.g) ** 2 +
    (rgbA.b - rgbB.b) ** 2,
  );
}

/** Check whether a token $value is a ColorValue object. */
function isColorValue(value: unknown): value is ColorValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'colorSpace' in value &&
    (value as ColorValue).colorSpace === 'oklch' &&
    'channels' in value &&
    Array.isArray((value as ColorValue).channels)
  );
}

interface GroupedColors {
  groupName: string;
  tokens: Array<{
    path: string[];
    label: string;
    color: ColorValue;
  }>;
}

// ---- Main Component ----

export default function CVDSimulatorTool() {
  const colorTokenGroup = useTokenStore((s) => s.tokens.color);
  const [selectedCVD, setSelectedCVD] = useState<CVDType>('deuteranopia');
  const [compareAll, setCompareAll] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Flatten, filter to ColorValues, and group by top-level key
  const groups: GroupedColors[] = useMemo(() => {
    if (!colorTokenGroup) return [];

    const flat = flattenTokenGroup(colorTokenGroup);
    const colorTokens = flat.filter((entry) => isColorValue(entry.token.$value));

    // Group by the first segment of the path (the palette name)
    const map = new Map<string, GroupedColors['tokens']>();
    for (const entry of colorTokens) {
      const groupName = entry.path[0] ?? 'ungrouped';
      if (!map.has(groupName)) {
        map.set(groupName, []);
      }
      map.get(groupName)!.push({
        path: entry.path,
        label: entry.path[entry.path.length - 1],
        color: entry.token.$value as ColorValue,
      });
    }

    return Array.from(map.entries())
      .map(([groupName, tokens]) => ({ groupName, tokens }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [colorTokenGroup]);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1200);
  };

  const isEmpty = groups.length === 0;

  return (
    <ToolLayout
      title="CVD Simulator"
      description="Simulate color vision deficiencies across your design token palette"
      actions={
        <button
          onClick={() => setCompareAll((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
            compareAll
              ? 'bg-accent/10 text-accent border-accent/30'
              : 'bg-surface-2 text-text-secondary border-border-subtle hover:bg-surface-3'
          }`}
        >
          <Layers size={13} />
          Compare All Types
        </button>
      }
    >
      <SplitPanel
        leftWidth="320px"
        left={
          <div>
            {/* CVD Type Selector */}
            <ParameterSection title="Vision Type">
              <div className="space-y-1.5">
                {CVD_TYPES.map(({ type, label, prevalence }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedCVD(type);
                      setCompareAll(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                      selectedCVD === type && !compareAll
                        ? 'bg-accent/10 border-accent/30 ring-1 ring-accent/20'
                        : 'bg-surface-2 border-border-subtle hover:bg-surface-3 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        selectedCVD === type && !compareAll ? 'text-accent' : 'text-text-primary'
                      }`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-text-tertiary font-mono">{prevalence}</span>
                    </div>
                    <p className="text-[11px] text-text-tertiary mt-1 leading-relaxed">
                      {CVD_DESCRIPTIONS[type]}
                    </p>
                  </button>
                ))}
              </div>
            </ParameterSection>

            {/* Legend */}
            <ParameterSection title="Legend">
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Eye size={12} className="text-text-tertiary shrink-0" />
                  <span className="text-text-secondary">Original color</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff size={12} className="text-text-tertiary shrink-0" />
                  <span className="text-text-secondary">Simulated perception</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-warning shrink-0" />
                  <span className="text-text-secondary">
                    High delta (colors appear very different under this CVD type)
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-border-subtle text-text-tertiary leading-relaxed">
                  Color pairs with a perceptual distance above the threshold are highlighted.
                  These may indicate accessibility concerns for users with this type of color
                  vision deficiency.
                </div>
              </div>
            </ParameterSection>

            {/* Stats */}
            {!isEmpty && (
              <ParameterSection title="Statistics">
                <SimulationStats groups={groups} cvdType={selectedCVD} />
              </ParameterSection>
            )}
          </div>
        }
        right={
          <div className="p-6">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <EyeOff size={40} className="text-text-tertiary mb-4 opacity-40" />
                <h3 className="text-sm font-medium text-text-secondary mb-1">No color tokens found</h3>
                <p className="text-xs text-text-tertiary max-w-xs">
                  Generate color palettes in the Color Lab tool first. Color tokens will
                  appear here for CVD simulation.
                </p>
              </div>
            ) : compareAll ? (
              <CompareAllView groups={groups} onCopyHex={handleCopyHex} copiedHex={copiedHex} />
            ) : (
              <SingleCVDView
                groups={groups}
                cvdType={selectedCVD}
                onCopyHex={handleCopyHex}
                copiedHex={copiedHex}
              />
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}

// ---- Stats Subcomponent ----

function SimulationStats({ groups, cvdType }: { groups: GroupedColors[]; cvdType: CVDType }) {
  const stats = useMemo(() => {
    let totalTokens = 0;
    let flaggedCount = 0;

    for (const group of groups) {
      for (const token of group.tokens) {
        totalTokens++;
        const simulated = simulateCVD(token.color, cvdType);
        if (colorDelta(token.color, simulated) > DELTA_THRESHOLD) {
          flaggedCount++;
        }
      }
    }

    return { totalTokens, flaggedCount, groupCount: groups.length };
  }, [groups, cvdType]);

  return (
    <div className="space-y-2 text-[11px]">
      <div className="flex justify-between">
        <span className="text-text-tertiary">Palette groups</span>
        <span className="text-text-primary font-mono">{stats.groupCount}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-tertiary">Total color tokens</span>
        <span className="text-text-primary font-mono">{stats.totalTokens}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-tertiary">High-delta pairs</span>
        <span className={`font-mono ${stats.flaggedCount > 0 ? 'text-warning' : 'text-text-primary'}`}>
          {stats.flaggedCount}
        </span>
      </div>
      {stats.flaggedCount > 0 && (
        <div className="mt-1 pt-2 border-t border-border-subtle">
          <div className="flex items-start gap-1.5 text-warning">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span className="text-text-tertiary leading-relaxed">
              {stats.flaggedCount} color{stats.flaggedCount !== 1 ? 's' : ''} shift significantly
              under {CVD_TYPES.find((t) => t.type === cvdType)?.label}.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Single CVD View ----

function SingleCVDView({
  groups,
  cvdType,
  onCopyHex,
  copiedHex,
}: {
  groups: GroupedColors[];
  cvdType: CVDType;
  onCopyHex: (hex: string) => void;
  copiedHex: string | null;
}) {
  const cvdInfo = CVD_TYPES.find((t) => t.type === cvdType)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-lg border border-border-subtle">
          <EyeOff size={14} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">{cvdInfo.label}</span>
          <span className="text-[10px] text-text-tertiary font-mono">{cvdInfo.prevalence}</span>
        </div>
      </div>

      {/* Palette groups */}
      {groups.map((group) => (
        <PaletteGroupComparison
          key={group.groupName}
          group={group}
          cvdType={cvdType}
          onCopyHex={onCopyHex}
          copiedHex={copiedHex}
        />
      ))}
    </div>
  );
}

// ---- Palette Group Comparison (single CVD type) ----

function PaletteGroupComparison({
  group,
  cvdType,
  onCopyHex,
  copiedHex,
}: {
  group: GroupedColors;
  cvdType: CVDType;
  onCopyHex: (hex: string) => void;
  copiedHex: string | null;
}) {
  const simulated = useMemo(
    () => group.tokens.map((t) => simulateCVD(t.color, cvdType)),
    [group.tokens, cvdType],
  );

  const deltas = useMemo(
    () => group.tokens.map((t, i) => colorDelta(t.color, simulated[i])),
    [group.tokens, simulated],
  );

  const flaggedCount = deltas.filter((d) => d > DELTA_THRESHOLD).length;

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-text-primary capitalize">{group.groupName}</h3>
        <span className="text-[10px] text-text-tertiary">{group.tokens.length} tokens</span>
        {flaggedCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">
            <AlertTriangle size={10} />
            {flaggedCount} high delta
          </span>
        )}
      </div>

      {/* Original row */}
      <div className="mb-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Eye size={11} className="text-text-tertiary" />
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">Original</span>
        </div>
        <div className="flex gap-0.5">
          {group.tokens.map((token, i) => {
            const hex = toHex(token.color);
            const flagged = deltas[i] > DELTA_THRESHOLD;
            return (
              <SwatchCell
                key={token.path.join('.')}
                hex={hex}
                label={token.label}
                flagged={flagged}
                onCopy={() => onCopyHex(hex)}
                isCopied={copiedHex === hex}
              />
            );
          })}
        </div>
      </div>

      {/* Simulated row */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <EyeOff size={11} className="text-text-tertiary" />
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">Simulated</span>
        </div>
        <div className="flex gap-0.5">
          {simulated.map((color, i) => {
            const hex = toHex(color);
            const flagged = deltas[i] > DELTA_THRESHOLD;
            return (
              <SwatchCell
                key={group.tokens[i].path.join('.') + '-sim'}
                hex={hex}
                label={`\u0394${Math.round(deltas[i])}`}
                flagged={flagged}
                onCopy={() => onCopyHex(hex)}
                isCopied={copiedHex === hex}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Compare All Types View ----

function CompareAllView({
  groups,
  onCopyHex,
  copiedHex,
}: {
  groups: GroupedColors[];
  onCopyHex: (hex: string) => void;
  copiedHex: string | null;
}) {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-lg border border-border-subtle">
          <Layers size={14} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">Compare All CVD Types</span>
        </div>
      </div>

      {groups.map((group) => (
        <CompareAllGroup
          key={group.groupName}
          group={group}
          onCopyHex={onCopyHex}
          copiedHex={copiedHex}
        />
      ))}
    </div>
  );
}

function CompareAllGroup({
  group,
  onCopyHex,
  copiedHex,
}: {
  group: GroupedColors;
  onCopyHex: (hex: string) => void;
  copiedHex: string | null;
}) {
  const simulations = useMemo(() => {
    return CVD_TYPES.map(({ type }) => ({
      type,
      colors: group.tokens.map((t) => simulateCVD(t.color, type)),
      deltas: group.tokens.map((t) => colorDelta(t.color, simulateCVD(t.color, type))),
    }));
  }, [group.tokens]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-text-primary capitalize">{group.groupName}</h3>
        <span className="text-[10px] text-text-tertiary">{group.tokens.length} tokens</span>
      </div>

      <div className="space-y-3">
        {/* Original */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Eye size={11} className="text-text-tertiary" />
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
              Original
            </span>
          </div>
          <div className="flex gap-0.5">
            {group.tokens.map((token) => {
              const hex = toHex(token.color);
              return (
                <SwatchCell
                  key={token.path.join('.')}
                  hex={hex}
                  label={token.label}
                  flagged={false}
                  onCopy={() => onCopyHex(hex)}
                  isCopied={copiedHex === hex}
                />
              );
            })}
          </div>
        </div>

        {/* Each CVD type */}
        {simulations.map(({ type, colors, deltas }) => {
          const info = CVD_TYPES.find((t) => t.type === type)!;
          const flaggedCount = deltas.filter((d) => d > DELTA_THRESHOLD).length;

          return (
            <div key={type}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <EyeOff size={11} className="text-text-tertiary" />
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
                  {info.label}
                </span>
                <span className="text-[9px] text-text-tertiary font-mono">({info.prevalence})</span>
                {flaggedCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-warning">
                    <AlertTriangle size={9} />
                    {flaggedCount}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5">
                {colors.map((color, i) => {
                  const hex = toHex(color);
                  const flagged = deltas[i] > DELTA_THRESHOLD;
                  return (
                    <SwatchCell
                      key={`${type}-${group.tokens[i].path.join('.')}`}
                      hex={hex}
                      label={`\u0394${Math.round(deltas[i])}`}
                      flagged={flagged}
                      onCopy={() => onCopyHex(hex)}
                      isCopied={copiedHex === hex}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Swatch Cell ----

function SwatchCell({
  hex,
  label,
  flagged,
  onCopy,
  isCopied,
}: {
  hex: string;
  label: string;
  flagged: boolean;
  onCopy: () => void;
  isCopied: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col items-center min-w-0">
      <button
        onClick={onCopy}
        className={`w-full aspect-square rounded-md border transition-all group relative ${
          flagged
            ? 'border-warning/50 ring-1 ring-warning/20'
            : 'border-border-subtle hover:border-border'
        } hover:ring-2 hover:ring-accent/30`}
        style={{ backgroundColor: hex }}
        title={`${hex} - Click to copy`}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isCopied ? (
            <Check size={12} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          ) : (
            <Copy size={10} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          )}
        </div>
        {flagged && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning border border-surface-0" />
        )}
      </button>
      <span className="text-[9px] text-text-tertiary mt-1 font-mono truncate w-full text-center">
        {label}
      </span>
      <span className="text-[8px] text-text-tertiary font-mono opacity-60 truncate w-full text-center">
        {hex}
      </span>
    </div>
  );
}
