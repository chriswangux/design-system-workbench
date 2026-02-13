import { useState, useMemo } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import type { BreakpointValue, GridValue, TokenGroup } from '@/core/tokens/types';

interface ParsedBreakpoint {
  name: string;
  minWidth: number;
  label: string;
}

interface ParsedGrid {
  name: string;
  columns: number;
  gutter: number;
  margin: number;
  maxWidth?: number;
}

const SEGMENT_COLORS = [
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-info, var(--color-accent))',
];

const PREVIEW_MIN = 320;
const PREVIEW_MAX = 1920;

export default function BreakpointExplorerTool() {
  const breakpointGroup = useTokenStore((s) => s.tokens.breakpoint);
  const gridGroup = useTokenStore((s) => s.tokens.grid);

  const [previewWidth, setPreviewWidth] = useState(1024);

  // Parse breakpoint tokens into a sorted list
  const breakpoints = useMemo<ParsedBreakpoint[]>(() => {
    if (!breakpointGroup) return [];
    const flat = flattenTokenGroup(breakpointGroup as TokenGroup);
    return flat
      .map(({ path, token }) => {
        const val = token.$value as BreakpointValue;
        return {
          name: path[path.length - 1],
          minWidth: val.minWidth.value,
          label: val.label,
        };
      })
      .sort((a, b) => a.minWidth - b.minWidth);
  }, [breakpointGroup]);

  // Parse grid tokens into a map by name
  const grids = useMemo<Map<string, ParsedGrid>>(() => {
    const map = new Map<string, ParsedGrid>();
    if (!gridGroup) return map;
    const flat = flattenTokenGroup(gridGroup as TokenGroup);
    for (const { path, token } of flat) {
      const val = token.$value as GridValue;
      const name = path[path.length - 1];
      map.set(name, {
        name,
        columns: val.columns,
        gutter: val.gutter.value,
        margin: val.margin.value,
        maxWidth: val.maxWidth?.value,
      });
    }
    return map;
  }, [gridGroup]);

  // Determine the active breakpoint for the current preview width
  const activeBreakpoint = useMemo(() => {
    const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
    return sorted.find((bp) => previewWidth >= bp.minWidth) ?? breakpoints[0] ?? null;
  }, [breakpoints, previewWidth]);

  // Get the active grid config
  const activeGrid = useMemo(() => {
    if (!activeBreakpoint) return null;
    return grids.get(activeBreakpoint.name) ?? null;
  }, [activeBreakpoint, grids]);

  // Build breakpoint ranges for timeline segments
  const segments = useMemo(() => {
    if (breakpoints.length === 0) return [];
    return breakpoints.map((bp, i) => {
      const nextMin = i < breakpoints.length - 1 ? breakpoints[i + 1].minWidth : PREVIEW_MAX;
      return {
        name: bp.name,
        start: bp.minWidth,
        end: nextMin,
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      };
    });
  }, [breakpoints]);

  // Generate CSS media queries
  const mediaQueries = useMemo(() => {
    if (breakpoints.length === 0) return '';
    return breakpoints
      .map((bp) => {
        const grid = grids.get(bp.name);
        const vars = [
          `  --grid-columns: ${grid?.columns ?? '/* not defined */'}; `,
          `  --grid-gutter: ${grid ? `${grid.gutter}px` : '/* not defined */'}; `,
          `  --grid-margin: ${grid ? `${grid.margin}px` : '/* not defined */'}; `,
          grid?.maxWidth ? `  --grid-max-width: ${grid.maxWidth}px;` : null,
        ]
          .filter(Boolean)
          .join('\n');
        return `@media (min-width: ${bp.minWidth}px) {\n  /* ${bp.name} */\n${vars}\n}`;
      })
      .join('\n\n');
  }, [breakpoints, grids]);

  // Determine layout mode for the sample layout
  const layoutMode = useMemo(() => {
    if (!activeBreakpoint) return 'xs';
    const idx = breakpoints.findIndex((bp) => bp.name === activeBreakpoint.name);
    if (idx <= 0) return 'xs';
    if (idx === 1) return 'sm';
    if (idx === 2) return 'md';
    if (idx === 3) return 'lg';
    return 'xl';
  }, [activeBreakpoint, breakpoints]);

  // Content card count derived from grid columns
  const contentCards = useMemo(() => {
    if (!activeGrid) {
      // Fallback based on layout mode
      if (layoutMode === 'xs') return 1;
      if (layoutMode === 'sm') return 1;
      if (layoutMode === 'md') return 2;
      if (layoutMode === 'lg') return 3;
      return 4;
    }
    return Math.min(activeGrid.columns, 6);
  }, [activeGrid, layoutMode]);

  // Empty state
  if (breakpoints.length === 0) {
    return (
      <ToolLayout
        title="Breakpoint Explorer"
        description="Visualize and explore responsive breakpoints"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-6">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface-2)' }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              No breakpoints defined yet
            </h2>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Visit the Grid System Builder to create your responsive breakpoints.
              Once defined, they will appear here for exploration and preview.
            </p>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Breakpoint Explorer"
      description="Visualize and explore responsive breakpoints"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Preview Width">
              <SliderWithInput
                label="Width"
                value={previewWidth}
                onChange={setPreviewWidth}
                min={PREVIEW_MIN}
                max={PREVIEW_MAX}
                step={1}
                unit="px"
              />
              {activeBreakpoint && (
                <p className="text-[10px] text-text-tertiary mt-1">
                  Active breakpoint:{' '}
                  <span className="text-accent font-medium">{activeBreakpoint.name}</span>
                  {' '}({activeBreakpoint.minWidth}px+)
                </p>
              )}
            </ParameterSection>

            <ParameterSection title="Breakpoints">
              <div className="space-y-1">
                {breakpoints.map((bp, i) => {
                  const isActive = activeBreakpoint?.name === bp.name;
                  const grid = grids.get(bp.name);
                  return (
                    <div
                      key={bp.name}
                      className={`rounded-lg px-3 py-2 transition-colors ${
                        isActive
                          ? 'bg-accent/10 border border-accent/30'
                          : 'bg-surface-2 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                          />
                          <span className="text-xs font-medium text-text-primary">
                            {bp.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary">
                          {bp.minWidth}px
                        </span>
                      </div>
                      {grid && (
                        <div className="mt-1.5 flex gap-3 ml-4">
                          <span className="text-[10px] text-text-tertiary">
                            {grid.columns} cols
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {grid.gutter}px gutter
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {grid.margin}px margin
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Breakpoint Timeline */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Breakpoint Timeline
              </h3>
              <div className="relative">
                {/* Segment bar */}
                <div className="flex h-8 rounded-lg overflow-hidden border border-border-subtle">
                  {segments.map((seg) => {
                    const totalRange = PREVIEW_MAX - PREVIEW_MIN;
                    const segStart = Math.max(seg.start, PREVIEW_MIN);
                    const segEnd = Math.min(seg.end, PREVIEW_MAX);
                    const widthPct = ((segEnd - segStart) / totalRange) * 100;
                    const isActive = activeBreakpoint?.name === seg.name;

                    return (
                      <div
                        key={seg.name}
                        className="relative flex items-center justify-center overflow-hidden"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: seg.color,
                          opacity: isActive ? 1 : 0.35,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <span
                          className="text-[10px] font-semibold truncate px-1"
                          style={{ color: 'var(--color-surface-0)' }}
                        >
                          {seg.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Current width indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
                  style={{
                    left: `${((previewWidth - PREVIEW_MIN) / (PREVIEW_MAX - PREVIEW_MIN)) * 100}%`,
                    backgroundColor: 'var(--color-text-primary)',
                    transition: 'left 0.1s ease-out',
                  }}
                >
                  <div
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--color-text-primary)',
                      color: 'var(--color-surface-0)',
                    }}
                  >
                    {previewWidth}px
                  </div>
                </div>

                {/* Breakpoint tick marks */}
                <div className="relative h-4 mt-1">
                  {breakpoints.map((bp) => {
                    const pct = ((bp.minWidth - PREVIEW_MIN) / (PREVIEW_MAX - PREVIEW_MIN)) * 100;
                    if (pct < 0 || pct > 100) return null;
                    return (
                      <div
                        key={bp.name}
                        className="absolute top-0 flex flex-col items-center"
                        style={{ left: `${pct}%` }}
                      >
                        <div className="w-px h-2" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
                        <span className="text-[8px] text-text-tertiary mt-0.5">{bp.minWidth}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sample Responsive Layout */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Sample Responsive Layout
              </h3>
              <div
                className="mx-auto border border-border-subtle rounded-lg overflow-hidden"
                style={{
                  maxWidth: layoutMode === 'xl' && activeGrid?.maxWidth
                    ? `${Math.min(activeGrid.maxWidth * 0.5, 800)}px`
                    : '100%',
                  transition: 'max-width 0.3s ease',
                }}
              >
                {/* Header */}
                <div
                  className="h-8 flex items-center px-3"
                  style={{ backgroundColor: 'var(--color-accent)', opacity: 0.8 }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: 'var(--color-surface-0)', opacity: 0.5 }}
                    />
                    <div
                      className="h-2 rounded-full flex-1 max-w-[80px]"
                      style={{ backgroundColor: 'var(--color-surface-0)', opacity: 0.4 }}
                    />
                    {layoutMode !== 'xs' && (
                      <div className="flex gap-1.5 ml-auto">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-2 w-8 rounded-full"
                            style={{ backgroundColor: 'var(--color-surface-0)', opacity: 0.3 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div
                  className="flex"
                  style={{ backgroundColor: 'var(--color-surface-1)' }}
                >
                  {/* Sidebar */}
                  {(layoutMode === 'md' || layoutMode === 'lg' || layoutMode === 'xl') && (
                    <div
                      className="shrink-0 p-2 border-r border-border-subtle"
                      style={{
                        width: layoutMode === 'md' ? '60px' : '80px',
                        backgroundColor: 'var(--color-surface-2)',
                      }}
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="h-2 rounded-full mb-2"
                          style={{ backgroundColor: 'var(--color-text-tertiary)', opacity: 0.3 }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Content grid */}
                  <div className="flex-1 p-3">
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${
                          layoutMode === 'xs' || layoutMode === 'sm'
                            ? 1
                            : layoutMode === 'md'
                              ? 2
                              : contentCards > 4
                                ? 4
                                : contentCards
                        }, 1fr)`,
                      }}
                    >
                      {Array.from({ length: contentCards }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded border border-border-subtle p-2"
                          style={{ backgroundColor: 'var(--color-surface-2)' }}
                        >
                          <div
                            className="h-10 rounded mb-2"
                            style={{ backgroundColor: 'var(--color-surface-3)' }}
                          />
                          <div
                            className="h-1.5 rounded-full mb-1 w-3/4"
                            style={{ backgroundColor: 'var(--color-text-tertiary)', opacity: 0.4 }}
                          />
                          <div
                            className="h-1.5 rounded-full w-1/2"
                            style={{ backgroundColor: 'var(--color-text-tertiary)', opacity: 0.25 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="h-6 flex items-center justify-center border-t border-border-subtle"
                  style={{ backgroundColor: 'var(--color-surface-2)' }}
                >
                  <div
                    className="h-1.5 w-20 rounded-full"
                    style={{ backgroundColor: 'var(--color-text-tertiary)', opacity: 0.2 }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-text-tertiary text-center mt-2">
                Layout: <span className="font-mono text-text-secondary">{layoutMode}</span>
                {activeGrid && (
                  <> &middot; {activeGrid.columns} columns &middot; {activeGrid.gutter}px gutter &middot; {activeGrid.margin}px margin</>
                )}
              </p>
            </div>

            {/* CSS Media Query Output */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                CSS Media Queries
              </h3>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                <pre>{mediaQueries}</pre>
              </div>
            </div>

            {/* Breakpoint Summary Table */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Breakpoint Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-2 text-text-tertiary font-medium">Name</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Min Width</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Columns</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Gutter</th>
                      <th className="text-right py-2 text-text-tertiary font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakpoints.map((bp) => {
                      const grid = grids.get(bp.name);
                      const isActive = activeBreakpoint?.name === bp.name;
                      return (
                        <tr
                          key={bp.name}
                          className={`border-b border-border-subtle transition-colors ${
                            isActive ? 'bg-accent/5' : ''
                          }`}
                        >
                          <td className="py-2">
                            <span className="font-mono text-text-primary">{bp.name}</span>
                            {isActive && (
                              <span className="ml-1.5 text-[9px] text-accent font-medium">ACTIVE</span>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono text-text-secondary">
                            {bp.minWidth}px
                          </td>
                          <td className="py-2 text-right font-mono text-text-secondary">
                            {grid?.columns ?? '-'}
                          </td>
                          <td className="py-2 text-right font-mono text-text-secondary">
                            {grid ? `${grid.gutter}px` : '-'}
                          </td>
                          <td className="py-2 text-right font-mono text-text-secondary">
                            {grid ? `${grid.margin}px` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
