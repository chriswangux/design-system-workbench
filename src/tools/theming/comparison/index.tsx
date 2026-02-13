import { useState, useMemo } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { useTokenStore } from '@/core/store/tokenStore';
import { toHex } from '@/core/engine/color/oklch';
import { contrastRatio, wcagLevel, type WCAGLevel } from '@/core/engine/color/contrast';
import { flattenTokenGroup } from '@/core/tokens/resolve';
import type { ColorValue, TokenGroup, DesignToken } from '@/core/tokens/types';

// ---- Types ----

interface ColorEntry {
  path: string;
  color: ColorValue;
  hex: string;
}

interface ThemeColors {
  id: string;
  label: string;
  entries: ColorEntry[];
  surface: string;   // lightest hex
  text: string;      // darkest hex
  accent: string;    // mid-saturation hex
  muted: string;     // low-chroma mid-lightness hex
  surfaceColor: ColorValue;
  textColor: ColorValue;
}

type ComponentPreview = 'card' | 'form' | 'button-row' | 'navigation' | 'dashboard';

// ---- Helpers ----

function extractColors(group: TokenGroup | undefined, prefix: string): ColorEntry[] {
  if (!group) return [];
  const entries: ColorEntry[] = [];

  for (const [key, val] of Object.entries(group)) {
    if (key.startsWith('$') || !val || typeof val !== 'object') continue;

    if ('$value' in val && '$type' in val) {
      const token = val as unknown as DesignToken;
      if (token.$type === 'color' && typeof token.$value === 'object' && 'colorSpace' in (token.$value as object)) {
        const color = token.$value as ColorValue;
        entries.push({ path: `${prefix}.${key}`, color, hex: toHex(color) });
      }
      continue;
    }

    const flat = flattenTokenGroup(val as TokenGroup, [prefix, key]);
    for (const { path, token } of flat) {
      if (token.$type === 'color' && typeof token.$value === 'object' && 'colorSpace' in (token.$value as object)) {
        const color = token.$value as ColorValue;
        entries.push({ path: path.join('.'), color, hex: toHex(color) });
      }
    }
  }

  return entries;
}

function pickRepresentativeColors(entries: ColorEntry[]): Pick<ThemeColors, 'surface' | 'text' | 'accent' | 'muted' | 'surfaceColor' | 'textColor'> {
  if (entries.length === 0) {
    const fallback: ColorValue = { colorSpace: 'oklch', channels: [0.5, 0, 0], alpha: 1 };
    return { surface: '#888888', text: '#888888', accent: '#888888', muted: '#888888', surfaceColor: fallback, textColor: fallback };
  }

  const sorted = [...entries].sort((a, b) => a.color.channels[0] - b.color.channels[0]);
  const lightest = sorted[sorted.length - 1];
  const darkest = sorted[0];

  // Accent: highest chroma
  const byChroma = [...entries].sort((a, b) => b.color.channels[1] - a.color.channels[1]);
  const accent = byChroma[0];

  // Muted: lowest chroma with mid lightness
  const midEntries = entries.filter((e) => e.color.channels[0] > 0.3 && e.color.channels[0] < 0.7);
  const byChromaAsc = [...(midEntries.length > 0 ? midEntries : entries)].sort(
    (a, b) => a.color.channels[1] - b.color.channels[1],
  );
  const muted = byChromaAsc[0];

  return {
    surface: lightest.hex,
    text: darkest.hex,
    accent: accent.hex,
    muted: muted.hex,
    surfaceColor: lightest.color,
    textColor: darkest.color,
  };
}

function ContrastBadge({ level }: { level: WCAGLevel }) {
  const colorMap: Record<WCAGLevel, string> = {
    AAA: 'var(--color-success)',
    AA: 'var(--color-success)',
    'AA-large': 'var(--color-warning)',
    fail: 'var(--color-error)',
  };
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
      style={{
        backgroundColor: colorMap[level],
        color: 'var(--color-surface-0)',
        opacity: level === 'fail' ? 0.8 : 1,
      }}
    >
      {level}
    </span>
  );
}

// ---- Component Preview Renderers ----

function CardPreview({ theme }: { theme: ThemeColors }) {
  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: theme.surface, borderColor: theme.muted + '40' }}>
      <div className="h-16 rounded mb-2" style={{ backgroundColor: theme.muted + '20' }} />
      <div className="text-xs font-semibold mb-1" style={{ color: theme.text }}>Card Title</div>
      <div className="text-[10px] mb-2 leading-relaxed" style={{ color: theme.text, opacity: 0.7 }}>
        This is sample body text shown in the card component to demonstrate how text renders.
      </div>
      <div className="flex gap-2">
        <div
          className="rounded px-2.5 py-1 text-[10px] font-medium"
          style={{ backgroundColor: theme.accent, color: theme.surface }}
        >
          Primary
        </div>
        <div
          className="rounded px-2.5 py-1 text-[10px] font-medium border"
          style={{ color: theme.accent, borderColor: theme.accent }}
        >
          Secondary
        </div>
      </div>
    </div>
  );
}

function FormPreview({ theme }: { theme: ThemeColors }) {
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: theme.surface }}>
      <div className="text-xs font-semibold mb-1" style={{ color: theme.text }}>Sign In</div>
      {['Email', 'Password'].map((label) => (
        <div key={label}>
          <div className="text-[9px] mb-0.5" style={{ color: theme.text, opacity: 0.6 }}>{label}</div>
          <div
            className="h-6 rounded border px-2 flex items-center text-[10px]"
            style={{ borderColor: theme.muted + '60', color: theme.text, opacity: 0.4, backgroundColor: theme.surface }}
          >
            {label === 'Password' ? '********' : 'user@example.com'}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1.5 mt-1">
        <div className="w-3 h-3 rounded-sm border" style={{ borderColor: theme.accent, backgroundColor: theme.accent }}>
          <svg viewBox="0 0 12 12" className="w-full h-full">
            <path d="M3 6l2 2 4-4" fill="none" stroke={theme.surface} strokeWidth="1.5" />
          </svg>
        </div>
        <span className="text-[9px]" style={{ color: theme.text, opacity: 0.6 }}>Remember me</span>
      </div>
      <div
        className="rounded px-2 py-1.5 text-[10px] font-medium text-center mt-1"
        style={{ backgroundColor: theme.accent, color: theme.surface }}
      >
        Sign In
      </div>
    </div>
  );
}

function ButtonRowPreview({ theme }: { theme: ThemeColors }) {
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: theme.surface }}>
      <div className="text-[10px] mb-1" style={{ color: theme.text, opacity: 0.6 }}>Button Variants</div>
      <div className="flex flex-wrap gap-1.5">
        <div className="rounded px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: theme.accent, color: theme.surface }}>
          Primary
        </div>
        <div className="rounded px-2.5 py-1 text-[10px] font-medium border" style={{ color: theme.accent, borderColor: theme.accent }}>
          Outline
        </div>
        <div className="rounded px-2.5 py-1 text-[10px] font-medium" style={{ color: theme.accent }}>
          Ghost
        </div>
        <div className="rounded px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: theme.muted + '30', color: theme.text, opacity: 0.4 }}>
          Disabled
        </div>
      </div>
      <div className="text-[10px] mt-2 mb-1" style={{ color: theme.text, opacity: 0.6 }}>Sizes</div>
      <div className="flex items-end gap-1.5">
        <div className="rounded px-1.5 py-0.5 text-[8px] font-medium" style={{ backgroundColor: theme.accent, color: theme.surface }}>
          Small
        </div>
        <div className="rounded px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: theme.accent, color: theme.surface }}>
          Medium
        </div>
        <div className="rounded px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.accent, color: theme.surface }}>
          Large
        </div>
      </div>
    </div>
  );
}

function NavigationPreview({ theme }: { theme: ThemeColors }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: theme.surface }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: theme.muted + '30' }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.accent }} />
          <span className="text-[10px] font-semibold" style={{ color: theme.text }}>Brand</span>
        </div>
        <div className="flex gap-2">
          {['Home', 'Products', 'About'].map((item, i) => (
            <span
              key={item}
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                color: i === 0 ? theme.accent : theme.text,
                backgroundColor: i === 0 ? theme.accent + '15' : 'transparent',
                fontWeight: i === 0 ? 600 : 400,
                opacity: i === 0 ? 1 : 0.6,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      {/* Sidebar + content */}
      <div className="flex">
        <div className="w-16 p-1.5 border-r space-y-1" style={{ borderColor: theme.muted + '20' }}>
          {['Dash', 'Team', 'Settings'].map((item, i) => (
            <div
              key={item}
              className="text-[8px] px-1.5 py-1 rounded"
              style={{
                backgroundColor: i === 0 ? theme.accent + '15' : 'transparent',
                color: i === 0 ? theme.accent : theme.text,
                opacity: i === 0 ? 1 : 0.5,
              }}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 p-2">
          <div className="h-2 w-16 rounded mb-1.5" style={{ backgroundColor: theme.text, opacity: 0.15 }} />
          <div className="h-1.5 w-24 rounded mb-1" style={{ backgroundColor: theme.text, opacity: 0.08 }} />
          <div className="h-1.5 w-20 rounded" style={{ backgroundColor: theme.text, opacity: 0.08 }} />
        </div>
      </div>
    </div>
  );
}

function DashboardPreview({ theme }: { theme: ThemeColors }) {
  return (
    <div className="rounded-lg p-2 space-y-2" style={{ backgroundColor: theme.surface }}>
      <div className="text-[10px] font-semibold" style={{ color: theme.text }}>Dashboard</div>
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-1.5">
        {['Users', 'Revenue', 'Growth'].map((stat, i) => (
          <div key={stat} className="rounded p-1.5 border" style={{ borderColor: theme.muted + '30' }}>
            <div className="text-[7px]" style={{ color: theme.text, opacity: 0.5 }}>{stat}</div>
            <div className="text-[11px] font-bold" style={{ color: i === 2 ? theme.accent : theme.text }}>
              {['1,234', '$56k', '+12%'][i]}
            </div>
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="h-10 rounded flex items-end gap-0.5 px-1" style={{ backgroundColor: theme.muted + '10' }}>
        {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${h}%`,
              backgroundColor: theme.accent,
              opacity: 0.3 + (i / 7) * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const COMPONENT_PREVIEWS: Array<{ id: ComponentPreview; label: string }> = [
  { id: 'card', label: 'Card' },
  { id: 'form', label: 'Form' },
  { id: 'button-row', label: 'Button Row' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'dashboard', label: 'Dashboard' },
];

function renderComponentPreview(id: ComponentPreview, theme: ThemeColors) {
  switch (id) {
    case 'card':
      return <CardPreview theme={theme} />;
    case 'form':
      return <FormPreview theme={theme} />;
    case 'button-row':
      return <ButtonRowPreview theme={theme} />;
    case 'navigation':
      return <NavigationPreview theme={theme} />;
    case 'dashboard':
      return <DashboardPreview theme={theme} />;
  }
}

// ---- Main Component ----

export default function ThemeComparisonTool() {
  const colorTokens = useTokenStore((s) => s.tokens.color);
  const themeTokens = useTokenStore((s) => s.tokens.themes);

  const [themeAId, setThemeAId] = useState('base');
  const [themeBId, setThemeBId] = useState<string | null>(null);
  const [previewComponent, setPreviewComponent] = useState<ComponentPreview>('card');

  // Build available themes list
  const availableThemes = useMemo(() => {
    const themes: Array<{ id: string; label: string }> = [];

    // Base theme from color tokens
    const baseColors = extractColors(colorTokens, 'color');
    if (baseColors.length > 0) {
      themes.push({ id: 'base', label: 'Base' });
    }

    // Derived themes
    if (themeTokens) {
      for (const key of Object.keys(themeTokens)) {
        if (key.startsWith('$')) continue;
        const val = themeTokens[key];
        if (val && typeof val === 'object' && !('$value' in val)) {
          const label = key === 'dark' ? 'Dark' : key === 'high-contrast' ? 'High Contrast' : key === 'brand' ? 'Brand Variant' : key;
          themes.push({ id: `theme:${key}`, label });
        }
      }
    }

    return themes;
  }, [colorTokens, themeTokens]);

  // Effective theme B: user selection, or auto-pick second available theme
  const effectiveThemeBId = useMemo(() => {
    if (themeBId) return themeBId;
    if (availableThemes.length > 1) return availableThemes[1].id;
    return null;
  }, [themeBId, availableThemes]);

  // Resolve a theme by its id into ThemeColors
  const resolveTheme = useMemo(() => {
    return (id: string): ThemeColors | null => {
      let entries: ColorEntry[] = [];
      let label = 'Unknown';

      if (id === 'base') {
        entries = extractColors(colorTokens, 'color');
        label = 'Base';
      } else if (id.startsWith('theme:')) {
        const key = id.slice(6);
        label = key === 'dark' ? 'Dark' : key === 'high-contrast' ? 'High Contrast' : key === 'brand' ? 'Brand Variant' : key;
        if (themeTokens && themeTokens[key] && typeof themeTokens[key] === 'object') {
          entries = extractColors(themeTokens[key] as TokenGroup, `themes.${key}`);
        }
      }

      if (entries.length === 0) return null;

      const rep = pickRepresentativeColors(entries);
      return { id, label, entries, ...rep };
    };
  }, [colorTokens, themeTokens]);

  const themeA = useMemo(() => resolveTheme(themeAId), [resolveTheme, themeAId]);
  const themeB = useMemo(() => effectiveThemeBId ? resolveTheme(effectiveThemeBId) : null, [resolveTheme, effectiveThemeBId]);

  // Contrast comparison: key text/background pairs for each theme
  const contrastComparison = useMemo(() => {
    if (!themeA || !themeB) return [];

    const pairs = [
      { label: 'Text on Surface', fgKey: 'text', bgKey: 'surface' },
      { label: 'Accent on Surface', fgKey: 'accent', bgKey: 'surface' },
    ];

    return pairs.map((pair) => {
      const aFg = pair.fgKey === 'text' ? themeA.textColor : themeA.entries.find((e) => e.hex === themeA.accent)?.color ?? themeA.textColor;
      const aBg = themeA.surfaceColor;
      const bFg = pair.fgKey === 'text' ? themeB.textColor : themeB.entries.find((e) => e.hex === themeB.accent)?.color ?? themeB.textColor;
      const bBg = themeB.surfaceColor;

      const ratioA = contrastRatio(aFg, aBg);
      const ratioB = contrastRatio(bFg, bBg);

      return {
        label: pair.label,
        themeA: { ratio: Math.round(ratioA * 100) / 100, level: wcagLevel(ratioA) },
        themeB: { ratio: Math.round(ratioB * 100) / 100, level: wcagLevel(ratioB) },
      };
    });
  }, [themeA, themeB]);

  // Check if there are any themes at all
  const hasThemes = availableThemes.length > 0;
  const hasTwoThemes = availableThemes.length >= 2;

  // Empty state
  if (!hasThemes) {
    return (
      <ToolLayout
        title="Theme Comparison"
        description="Side-by-side preview of theme variants on reference UI components"
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
                <rect x="2" y="3" width="8" height="18" rx="1" />
                <rect x="14" y="3" width="8" height="18" rx="1" />
                <path d="M10 12h4" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              No theme variants available
            </h2>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Create color palettes in the Color Lab, then use the Theme Derivation Engine to generate
              dark, high contrast, or brand theme variants. They will appear here for comparison.
            </p>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Theme Comparison"
      description="Side-by-side preview of theme variants on reference UI components"
    >
      <SplitPanel
        leftWidth="300px"
        left={
          <div>
            {/* Theme A selector */}
            <ParameterSection title="Theme A (Left)">
              <div className="space-y-1">
                {availableThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeAId(t.id)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      themeAId === t.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </ParameterSection>

            {/* Theme B selector */}
            <ParameterSection title="Theme B (Right)">
              <div className="space-y-1">
                {availableThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeBId(t.id)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      effectiveThemeBId === t.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {!hasTwoThemes && (
                <p className="text-[10px] text-text-tertiary mt-2">
                  Create a theme variant in the Theme Derivation Engine to compare.
                </p>
              )}
            </ParameterSection>

            {/* Component preview selector */}
            <ParameterSection title="Component Preview">
              <div className="space-y-1">
                {COMPONENT_PREVIEWS.map((cp) => (
                  <button
                    key={cp.id}
                    onClick={() => setPreviewComponent(cp.id)}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      previewComponent === cp.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {cp.label}
                  </button>
                ))}
              </div>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-8">
            {/* Side-by-side preview */}
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Component Preview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Theme A */}
                <div>
                  <div className="text-[10px] font-medium text-text-secondary mb-2">
                    {themeA?.label ?? 'No theme selected'}
                  </div>
                  {themeA ? (
                    <div
                      className="rounded-lg p-3 border border-border-subtle"
                      style={{ backgroundColor: themeA.surface + '20' }}
                    >
                      {renderComponentPreview(previewComponent, themeA)}
                    </div>
                  ) : (
                    <div className="rounded-lg p-6 border border-border-subtle flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-2)' }}>
                      <span className="text-[10px] text-text-tertiary">Select a theme</span>
                    </div>
                  )}
                </div>

                {/* Theme B */}
                <div>
                  <div className="text-[10px] font-medium text-text-secondary mb-2">
                    {themeB?.label ?? 'No theme selected'}
                  </div>
                  {themeB ? (
                    <div
                      className="rounded-lg p-3 border border-border-subtle"
                      style={{ backgroundColor: themeB.surface + '20' }}
                    >
                      {renderComponentPreview(previewComponent, themeB)}
                    </div>
                  ) : (
                    <div className="rounded-lg p-6 border border-border-subtle flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-2)' }}>
                      <span className="text-[10px] text-text-tertiary">Select a theme</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contrast comparison table */}
            {contrastComparison.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Contrast Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left py-2 text-text-tertiary font-medium">Pair</th>
                        <th className="text-center py-2 text-text-tertiary font-medium">{themeA?.label ?? 'A'}</th>
                        <th className="text-center py-2 text-text-tertiary font-medium">{themeB?.label ?? 'B'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrastComparison.map((row) => (
                        <tr key={row.label} className="border-b border-border-subtle">
                          <td className="py-2 text-text-secondary">{row.label}</td>
                          <td className="py-2 text-center">
                            <span className="font-mono text-text-secondary mr-1.5">{row.themeA.ratio}:1</span>
                            <ContrastBadge level={row.themeA.level} />
                          </td>
                          <td className="py-2 text-center">
                            <span className="font-mono text-text-secondary mr-1.5">{row.themeB.ratio}:1</span>
                            <ContrastBadge level={row.themeB.level} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Color palette strips */}
            {(themeA || themeB) && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Color Palettes
                </h3>
                <div className="space-y-3">
                  {themeA && themeA.entries.length > 0 && (
                    <div>
                      <div className="text-[10px] text-text-tertiary mb-1">{themeA.label}</div>
                      <div className="flex rounded-md overflow-hidden h-8">
                        {themeA.entries.map((entry, i) => (
                          <div
                            key={i}
                            className="flex-1 relative group cursor-pointer"
                            style={{ backgroundColor: entry.hex }}
                            title={`${entry.path}: ${entry.hex}`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span
                                className="text-[7px] font-mono px-0.5 rounded"
                                style={{ backgroundColor: 'var(--color-surface-0)', color: 'var(--color-text-primary)', opacity: 0.9 }}
                              >
                                {entry.hex}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {themeB && themeB.entries.length > 0 && (
                    <div>
                      <div className="text-[10px] text-text-tertiary mb-1">{themeB.label}</div>
                      <div className="flex rounded-md overflow-hidden h-8">
                        {themeB.entries.map((entry, i) => (
                          <div
                            key={i}
                            className="flex-1 relative group cursor-pointer"
                            style={{ backgroundColor: entry.hex }}
                            title={`${entry.path}: ${entry.hex}`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span
                                className="text-[7px] font-mono px-0.5 rounded"
                                style={{ backgroundColor: 'var(--color-surface-0)', color: 'var(--color-text-primary)', opacity: 0.9 }}
                              >
                                {entry.hex}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
