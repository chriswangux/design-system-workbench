import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { ToolLayout } from '@/components/shell/ToolLayout';
import { useTokenStore } from '@/core/store/tokenStore';
import { useStyleLibraryStore, getAllPresets, type StylePreset } from '@/core/store/styleLibraryStore';
import { toHex, createColor } from '@/core/engine/color/oklch';
import { createBezierEasing } from '@/core/engine/math/bezier';
import type { ColorLabConfig } from '@/core/tokens/types';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

// ---- Lazy-loaded custom site components ----

const SITE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'default': lazy(() => import('./sites/default')),
  'linear': lazy(() => import('./sites/linear')),
  'stripe': lazy(() => import('./sites/stripe')),
  'warm-earth': lazy(() => import('./sites/warm-earth')),
  'neon-cyber': lazy(() => import('./sites/neon-cyber')),
  'soft-pastel': lazy(() => import('./sites/soft-pastel')),
  'corporate': lazy(() => import('./sites/corporate')),
  'editorial': lazy(() => import('./sites/editorial')),
  'fintech-premium': lazy(() => import('./sites/fintech-premium')),
};

// ---- Helpers ----

function extractPreviewColors(configs: StylePreset['generatorConfigs']): string[] {
  const colorConfig = configs['color-lab'] as ColorLabConfig | undefined;
  if (!colorConfig || colorConfig.palettes.length === 0) {
    return ['#6366f1', '#818cf8', '#a5b4fc', '#27272a', '#09090b'];
  }
  const hexColors: string[] = [];
  for (const palette of colorConfig.palettes) {
    const lC = createBezierEasing(palette.lightness.curve);
    const cC = createBezierEasing(palette.chroma.curve);
    const hC = createBezierEasing(palette.hue.curve);
    const t = 0.5;
    const l = palette.lightness.start + (palette.lightness.end - palette.lightness.start) * lC(t);
    const c = palette.chroma.start + (palette.chroma.end - palette.chroma.start) * cC(t);
    const h = palette.hue.start + (palette.hue.end - palette.hue.start) * hC(t);
    hexColors.push(toHex(createColor(l, c, h)));
    if (hexColors.length >= 5) break;
  }
  if (hexColors.length < 5) {
    const p = colorConfig.palettes[0];
    const lC = createBezierEasing(p.lightness.curve);
    const cC = createBezierEasing(p.chroma.curve);
    const hC = createBezierEasing(p.hue.curve);
    for (const t of [0.15, 0.85, 0.0, 1.0]) {
      if (hexColors.length >= 5) break;
      hexColors.push(toHex(createColor(
        p.lightness.start + (p.lightness.end - p.lightness.start) * lC(t),
        p.chroma.start + (p.chroma.end - p.chroma.start) * cC(t),
        p.hue.start + (p.hue.end - p.hue.start) * hC(t),
      )));
    }
  }
  return hexColors.slice(0, 5);
}

// ---- Sidebar list item ----

function StyleListItem({ preset, isActive, onClick }: {
  preset: StylePreset; isActive: boolean; onClick: () => void;
}) {
  const colors = preset.colors.length >= 3 ? preset.colors : ['#6366f1', '#a5b4fc', '#27272a'];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors ${
        isActive
          ? 'bg-accent/10 text-accent'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
      }`}
    >
      <div className="flex gap-0.5 shrink-0">
        {colors.slice(0, 3).map((color, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full border border-border-subtle/50" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-xs font-medium truncate ${isActive ? 'text-accent' : ''}`}>{preset.name}</div>
      </div>
      {preset.siteComponent && (
        <div className="w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" title="Has custom site" />
      )}
    </button>
  );
}

// ---- Characteristic row ----

function CharRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-border-subtle/50 last:border-b-0">
      <dt className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-xs text-text-secondary leading-relaxed">{value}</dd>
    </div>
  );
}

// ---- Detail panel ----

function StyleDetail({ preset, onApply }: { preset: StylePreset; onApply: (p: StylePreset) => void }) {
  const [showChars, setShowChars] = useState(true);
  const [confirmApply, setConfirmApply] = useState(false);
  const [applied, setApplied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const SiteComponent = preset.siteComponent ? SITE_COMPONENTS[preset.siteComponent] : null;

  const handleApply = () => {
    if (!confirmApply) { setConfirmApply(true); return; }
    onApply(preset);
    setConfirmApply(false);
    setApplied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setApplied(false), 2000);
  };

  useEffect(() => { setConfirmApply(false); setApplied(false); }, [preset.id]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const openInNewTab = () => {
    if (preset.siteComponent) {
      window.open(`${window.location.pathname}${window.location.search}#/style-site/${preset.siteComponent}`, '_blank');
    }
  };

  const chars = preset.prompt.characteristics;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Site preview */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0f] relative" style={{ transform: 'translateZ(0)' }}>
        {SiteComponent ? (
          <>
            <Suspense fallback={<div className="flex items-center justify-center h-full text-text-tertiary text-xs">Loading preview...</div>}>
              <SiteComponent />
            </Suspense>
            <button
              onClick={openInNewTab}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-md bg-white/10 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-colors z-10"
            >
              <ExternalLink size={11} />
              Open in new tab
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <div className="flex gap-1 justify-center mb-3">
                {(preset.colors.length > 0 ? preset.colors : ['#6366f1', '#818cf8', '#a5b4fc', '#27272a', '#09090b']).map((c, i) => (
                  <div key={i} className="w-10 h-10 rounded-lg" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-xs text-white/30">Custom site preview coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Prompt + characteristics */}
      <div className="shrink-0 border-t border-border-subtle overflow-auto max-h-[50%]">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">Prompt</h3>
            <p className="text-sm text-text-primary leading-relaxed">{preset.prompt.overall}</p>
          </div>

          <div>
            <button
              onClick={() => setShowChars(!showChars)}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 hover:text-text-secondary transition-colors"
            >
              {showChars ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Key Design Characteristics
            </button>
            {showChars && (
              <dl className="pl-1">
                <CharRow label="Typography" value={chars.typography} />
                <CharRow label="Color Philosophy" value={chars.colorPhilosophy} />
                {chars.toneSystem && <CharRow label="Tone System" value={chars.toneSystem} />}
                {chars.darkMode && <CharRow label="Dark Mode" value={chars.darkMode} />}
                {chars.lightMode && <CharRow label="Light Mode" value={chars.lightMode} />}
                <CharRow label="Borders" value={chars.borders} />
                <CharRow label="Shadows" value={chars.shadows} />
                <CharRow label="Animations" value={chars.animations} />
                <CharRow label="Interactions" value={chars.interactions} />
                <CharRow label="Layout" value={chars.layout} />
              </dl>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-3">
            {applied ? (
              <span className="text-xs font-medium text-success px-4 py-2">Applied!</span>
            ) : confirmApply ? (
              <>
                <button onClick={handleApply} className="text-xs font-medium px-4 py-2 rounded-md bg-success/15 text-success hover:bg-success/25 transition-colors">Confirm</button>
                <button onClick={() => setConfirmApply(false)} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">Cancel</button>
              </>
            ) : (
              <button onClick={handleApply} className="text-xs font-medium px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors">Apply to Workbench</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Save dialog ----

function SaveDialog({ defaultName, onSave, onCancel }: {
  defaultName: string; onSave: (name: string, overall: string) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [overall, setOverall] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim(), overall.trim()); }}
        className="relative bg-surface-1 border border-border-subtle rounded-lg shadow-xl w-full max-w-md mx-4 p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Save Current Style</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Name</label>
            <input ref={ref} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Style"
              className="w-full px-3 py-2 text-sm bg-surface-0 border border-border-subtle rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Overall Aesthetic</label>
            <textarea value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="Describe the look and feel..."
              rows={4} className="w-full px-3 py-2 text-sm bg-surface-0 border border-border-subtle rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel} className="text-xs font-medium px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="text-xs font-medium px-4 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40">Save</button>
        </div>
      </form>
    </div>
  );
}

// ---- Main ----

export default function StyleLibraryTool() {
  const resetProject = useTokenStore((s) => s.resetProject);
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const generatorConfigs = useTokenStore((s) => s.generatorConfigs);
  const projectName = useTokenStore((s) => s.projectName);
  const { userPresets, addPreset } = useStyleLibraryStore();
  const allPresets = useMemo(() => getAllPresets(userPresets), [userPresets]);
  const [selectedId, setSelectedId] = useState<string>(allPresets[0]?.id ?? '');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [search, setSearch] = useState('');

  const filteredPresets = useMemo(() => {
    if (!search.trim()) return allPresets;
    const q = search.toLowerCase();
    return allPresets.filter((p) => p.name.toLowerCase().includes(q) || p.prompt.overall.toLowerCase().includes(q));
  }, [allPresets, search]);

  const selectedPreset = useMemo(() => allPresets.find((p) => p.id === selectedId) ?? allPresets[0], [allPresets, selectedId]);

  const handleApply = useCallback((preset: StylePreset) => {
    resetProject();
    for (const [toolId, config] of Object.entries(preset.generatorConfigs)) {
      if (config !== undefined) setGeneratorConfig(toolId, config);
    }
    // Reload to remount all tool components with the new config state
    setTimeout(() => window.location.reload(), 100);
  }, [resetProject, setGeneratorConfig]);

  const handleSave = useCallback((name: string, overall: string) => {
    addPreset({
      name,
      prompt: { overall: overall || 'Custom style.', characteristics: { typography: '', colorPhilosophy: '', borders: '', shadows: '', animations: '', interactions: '', layout: '' } },
      generatorConfigs: structuredClone(generatorConfigs),
      colors: extractPreviewColors(generatorConfigs),
    });
    setShowSaveDialog(false);
  }, [addPreset, generatorConfigs]);

  return (
    <ToolLayout title="Style Library" description="Browse, preview, and apply design system styles">
      <div className="flex h-full overflow-hidden">
        <div className="w-[220px] border-r border-border-subtle shrink-0 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border-subtle shrink-0">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search styles..."
              className="w-full px-2.5 py-1.5 text-xs bg-surface-0 border border-border-subtle rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/50" />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1.5">
            {filteredPresets.map((preset) => (
              <StyleListItem key={preset.id} preset={preset} isActive={selectedPreset?.id === preset.id} onClick={() => setSelectedId(preset.id)} />
            ))}
          </div>
          <div className="px-3 py-2.5 border-t border-border-subtle shrink-0">
            <button onClick={() => setShowSaveDialog(true)} className="w-full text-xs font-medium px-3 py-2 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
              + Save Current Style
            </button>
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          {selectedPreset ? <StyleDetail preset={selectedPreset} onApply={handleApply} /> : (
            <div className="flex items-center justify-center h-full text-sm text-text-tertiary">Select a style</div>
          )}
        </div>
      </div>
      {showSaveDialog && <SaveDialog defaultName={projectName || 'My Style'} onSave={handleSave} onCancel={() => setShowSaveDialog(false)} />}
    </ToolLayout>
  );
}
