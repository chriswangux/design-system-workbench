import { useState, useMemo } from 'react';
import { ToolLayout } from '@/components/shell';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import { contrastRatio, wcagLevel, apcaContrast, type WCAGLevel } from '@/core/engine/color/contrast';
import { toHex } from '@/core/engine/color/oklch';
import type { ColorValue, TokenGroup } from '@/core/tokens/types';

// ---- Types ----

interface ColorEntry {
  path: string;
  label: string;
  group: string;
  color: ColorValue;
  hex: string;
}

interface CellData {
  ratio: number;
  level: WCAGLevel;
  apca: number;
}

type ContrastMode = 'wcag' | 'apca';

// ---- Helpers ----

function isColorValue(value: unknown): value is ColorValue {
  return (
    value !== null &&
    typeof value === 'object' &&
    'colorSpace' in (value as Record<string, unknown>) &&
    (value as Record<string, unknown>).colorSpace === 'oklch' &&
    'channels' in (value as Record<string, unknown>) &&
    Array.isArray((value as Record<string, unknown>).channels)
  );
}

function badgeClasses(level: WCAGLevel): string {
  switch (level) {
    case 'AAA':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'AA':
      return 'bg-lime-500/20 text-lime-400 border-lime-500/30';
    case 'AA-large':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'fail':
      return 'bg-error/20 text-error border-error/30';
  }
}

function cellBgClass(level: WCAGLevel): string {
  switch (level) {
    case 'AAA':
      return 'bg-emerald-500/5';
    case 'AA':
      return 'bg-lime-500/5';
    case 'AA-large':
      return 'bg-orange-500/5';
    case 'fail':
      return 'bg-error/5';
  }
}

function apcaBgClass(apca: number): string {
  const abs = Math.abs(apca);
  if (abs >= 75) return 'bg-emerald-500/5';
  if (abs >= 60) return 'bg-lime-500/5';
  if (abs >= 45) return 'bg-orange-500/5';
  return 'bg-error/5';
}

function apcaBadgeClasses(apca: number): string {
  const abs = Math.abs(apca);
  if (abs >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (abs >= 60) return 'bg-lime-500/20 text-lime-400 border-lime-500/30';
  if (abs >= 45) return 'bg-warning/20 text-warning border-warning/30';
  return 'bg-error/20 text-error border-error/30';
}

function apcaLabel(apca: number): string {
  const abs = Math.abs(apca);
  if (abs >= 75) return 'Preferred';
  if (abs >= 60) return 'Body text';
  if (abs >= 45) return 'Large text';
  if (abs >= 30) return 'Non-text';
  return 'Fail';
}

// ---- Component ----

export default function ContrastMatrixTool() {
  const colorGroup = useTokenStore((s) => s.tokens.color);

  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [contrastMode, setContrastMode] = useState<ContrastMode>('wcag');
  const [showPreview, setShowPreview] = useState(true);

  // Extract all color entries from the token store
  const allColors = useMemo<ColorEntry[]>(() => {
    if (!colorGroup) return [];
    const flat = flattenTokenGroup(colorGroup as TokenGroup, ['color']);
    const entries: ColorEntry[] = [];

    for (const { path, token } of flat) {
      const value = token.$value;
      if (isColorValue(value)) {
        entries.push({
          path: path.join('.'),
          label: path[path.length - 1],
          group: path.length > 2 ? path.slice(1, -1).join('.') : path[1] ?? '',
          color: value,
          hex: toHex(value),
        });
      }
    }

    return entries;
  }, [colorGroup]);

  // Unique groups for filtering
  const groups = useMemo<string[]>(() => {
    const set = new Set(allColors.map((c) => c.group));
    return Array.from(set).sort();
  }, [allColors]);

  // Filtered color list
  const colors = useMemo<ColorEntry[]>(() => {
    if (selectedGroups.size === 0) return allColors;
    return allColors.filter((c) => selectedGroups.has(c.group));
  }, [allColors, selectedGroups]);

  // Precompute the NxN contrast data
  const matrix = useMemo<CellData[][]>(() => {
    const n = colors.length;
    const grid: CellData[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => ({ ratio: 1, level: 'fail' as WCAGLevel, apca: 0 })),
    );

    for (let fg = 0; fg < n; fg++) {
      for (let bg = 0; bg < n; bg++) {
        if (fg === bg) continue;
        const ratio = contrastRatio(colors[fg].color, colors[bg].color);
        grid[fg][bg] = {
          ratio: Math.round(ratio * 100) / 100,
          level: wcagLevel(ratio),
          apca: apcaContrast(colors[fg].color, colors[bg].color),
        };
      }
    }

    return grid;
  }, [colors]);

  // Summary statistics
  const stats = useMemo(() => {
    let total = 0;
    let aaa = 0;
    let aa = 0;
    let aaLarge = 0;
    let fail = 0;

    const n = colors.length;
    for (let fg = 0; fg < n; fg++) {
      for (let bg = 0; bg < n; bg++) {
        if (fg === bg) continue;
        total++;
        const cell = matrix[fg][bg];
        switch (cell.level) {
          case 'AAA':
            aaa++;
            break;
          case 'AA':
            aa++;
            break;
          case 'AA-large':
            aaLarge++;
            break;
          case 'fail':
            fail++;
            break;
        }
      }
    }

    return { total, aaa, aa, aaLarge, fail };
  }, [colors, matrix]);

  const toggleGroup = (group: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const selectAllGroups = () => setSelectedGroups(new Set());

  // ---- Empty State ----

  if (allColors.length === 0) {
    return (
      <ToolLayout
        title="Contrast Matrix"
        description="Automatic contrast ratio checking across all color tokens"
      >
        <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
          <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">No color tokens found</p>
          <p className="text-xs text-text-tertiary max-w-md text-center">
            Generate color palettes in the Color Lab to see contrast ratios between all color pairs.
          </p>
        </div>
      </ToolLayout>
    );
  }

  // ---- Main Render ----

  return (
    <ToolLayout
      title="Contrast Matrix"
      description="Automatic contrast ratio checking across all color tokens"
      actions={
        <div className="flex items-center gap-3">
          {/* Contrast mode toggle */}
          <div className="flex items-center bg-surface-2 rounded-md border border-border-subtle p-0.5">
            <button
              onClick={() => setContrastMode('wcag')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                contrastMode === 'wcag'
                  ? 'bg-surface-3 text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              WCAG 2.1
            </button>
            <button
              onClick={() => setContrastMode('apca')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                contrastMode === 'apca'
                  ? 'bg-surface-3 text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              APCA
            </button>
          </div>
          {/* Preview toggle */}
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded border-border-subtle"
            />
            Preview
          </label>
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Filter bar */}
        {groups.length > 1 && (
          <div className="px-4 py-2.5 border-b border-border-subtle shrink-0 bg-surface-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">
                Filter
              </span>
              <button
                onClick={selectAllGroups}
                className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                  selectedGroups.size === 0
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-surface-2 text-text-tertiary border-border-subtle hover:bg-surface-3'
                }`}
              >
                All
              </button>
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => toggleGroup(group)}
                  className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                    selectedGroups.has(group)
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : selectedGroups.size === 0
                        ? 'bg-surface-2 text-text-secondary border-border-subtle hover:bg-surface-3'
                        : 'bg-surface-2 text-text-tertiary border-border-subtle hover:bg-surface-3'
                  }`}
                >
                  {group}
                </button>
              ))}
              {selectedGroups.size > 0 && (
                <button
                  onClick={selectAllGroups}
                  className="px-2 py-0.5 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Clear filters
                </button>
              )}
              <span className="text-[11px] text-text-tertiary ml-auto">
                {colors.length} colors, {colors.length * (colors.length - 1)} pairs
              </span>
            </div>
          </div>
        )}

        {/* Matrix grid */}
        <div className="flex-1 overflow-auto">
          {colors.length > 0 && (
            <div className="inline-block min-w-full">
              <table className="border-collapse">
                <thead>
                  <tr>
                    {/* Top-left corner */}
                    <th className="sticky top-0 left-0 z-30 bg-surface-1 border-b border-r border-border-subtle min-w-[120px]">
                      <div className="px-2 py-1.5 text-[10px] text-text-tertiary font-normal">
                        <span className="block">FG ↓ / BG →</span>
                      </div>
                    </th>
                    {/* Column headers (background colors) */}
                    {colors.map((col) => (
                      <th
                        key={`col-${col.path}`}
                        className="sticky top-0 z-20 bg-surface-1 border-b border-border-subtle px-0"
                        style={{ minWidth: showPreview ? '88px' : '72px' }}
                      >
                        <div className="flex flex-col items-center gap-1 py-1.5 px-1">
                          <div
                            className="w-5 h-5 rounded-sm border border-white/10 shrink-0"
                            style={{ backgroundColor: col.hex }}
                            title={col.hex}
                          />
                          <span
                            className="text-[9px] text-text-tertiary font-mono leading-tight text-center truncate w-full"
                            title={col.path}
                          >
                            {col.label}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colors.map((row, fgIdx) => (
                    <tr key={`row-${row.path}`}>
                      {/* Row header (foreground/text color) */}
                      <td className="sticky left-0 z-10 bg-surface-1 border-r border-b border-border-subtle">
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <div
                            className="w-5 h-5 rounded-sm border border-white/10 shrink-0"
                            style={{ backgroundColor: row.hex }}
                            title={row.hex}
                          />
                          <div className="min-w-0">
                            <span
                              className="text-[10px] text-text-secondary font-mono truncate block"
                              title={row.path}
                            >
                              {row.label}
                            </span>
                            <span className="text-[8px] text-text-tertiary font-mono block opacity-60">
                              {row.hex}
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Contrast cells */}
                      {colors.map((col, bgIdx) => {
                        const isSame = fgIdx === bgIdx;
                        const cell = matrix[fgIdx][bgIdx];

                        if (isSame) {
                          return (
                            <td
                              key={`cell-${fgIdx}-${bgIdx}`}
                              className="border-b border-border-subtle bg-surface-2/50"
                            >
                              <div className="flex items-center justify-center h-full min-h-[48px]">
                                <span className="text-[10px] text-text-tertiary opacity-30">--</span>
                              </div>
                            </td>
                          );
                        }

                        const bgClass = contrastMode === 'wcag' ? cellBgClass(cell.level) : apcaBgClass(cell.apca);

                        return (
                          <td
                            key={`cell-${fgIdx}-${bgIdx}`}
                            className={`border-b border-border-subtle ${bgClass} hover:brightness-125 transition-all`}
                          >
                            <div className="flex flex-col items-center gap-0.5 py-1 px-1">
                              {/* Contrast value */}
                              <span className="text-[11px] font-mono font-medium text-text-primary tabular-nums">
                                {contrastMode === 'wcag'
                                  ? `${cell.ratio.toFixed(2)}`
                                  : `${cell.apca >= 0 ? '' : ''}${cell.apca.toFixed(1)}`}
                              </span>

                              {/* Level badge */}
                              {contrastMode === 'wcag' ? (
                                <span
                                  className={`text-[8px] font-semibold px-1.5 py-0 rounded border leading-relaxed ${badgeClasses(cell.level)}`}
                                >
                                  {cell.level}
                                </span>
                              ) : (
                                <span
                                  className={`text-[8px] font-semibold px-1.5 py-0 rounded border leading-relaxed ${apcaBadgeClasses(cell.apca)}`}
                                >
                                  {apcaLabel(cell.apca)}
                                </span>
                              )}

                              {/* Text-on-background preview */}
                              {showPreview && (
                                <div
                                  className="w-full mt-0.5 rounded-sm flex items-center justify-center py-0.5"
                                  style={{ backgroundColor: col.hex }}
                                >
                                  <span
                                    className="text-[9px] font-semibold leading-none"
                                    style={{ color: row.hex }}
                                  >
                                    Aa
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary statistics */}
        {colors.length > 0 && (
          <div className="px-4 py-3 border-t border-border-subtle shrink-0 bg-surface-1">
            <div className="flex items-center gap-6">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Summary
              </span>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-text-secondary">
                    AAA: <span className="font-mono font-medium text-text-primary">{stats.aaa}</span>
                  </span>
                  <span className="text-text-tertiary">
                    ({stats.total > 0 ? ((stats.aaa / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-lime-500" />
                  <span className="text-text-secondary">
                    AA: <span className="font-mono font-medium text-text-primary">{stats.aa}</span>
                  </span>
                  <span className="text-text-tertiary">
                    ({stats.total > 0 ? ((stats.aa / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-text-secondary">
                    AA-large: <span className="font-mono font-medium text-text-primary">{stats.aaLarge}</span>
                  </span>
                  <span className="text-text-tertiary">
                    ({stats.total > 0 ? ((stats.aaLarge / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-text-secondary">
                    Fail: <span className="font-mono font-medium text-text-primary">{stats.fail}</span>
                  </span>
                  <span className="text-text-tertiary">
                    ({stats.total > 0 ? ((stats.fail / stats.total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-text-tertiary ml-auto">
                {stats.total} total pairs across {colors.length} colors
              </span>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
