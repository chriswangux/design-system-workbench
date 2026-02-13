import { Undo2, Redo2, Download, FolderOpen, Save, Moon, Sun, Monitor } from 'lucide-react';
import { useTokenStore } from '@/core/store/tokenStore';
import { useUIStore } from '@/core/store/uiStore';
import { useTemporalStore } from '@/core/hooks/useUndoRedo';
import { useTheme } from '@/core/hooks/useTheme';

export function TopBar() {
  const projectName = useTokenStore((s) => s.projectName);
  const setProjectName = useTokenStore((s) => s.setProjectName);
  const exportSnapshot = useTokenStore((s) => s.exportSnapshot);
  const importSnapshot = useTokenStore((s) => s.importSnapshot);
  const setExportPanelOpen = useUIStore((s) => s.setExportPanelOpen);
  const cycleTheme = useUIStore((s) => s.cycleTheme);
  const { undo, redo, canUndo, canRedo } = useTemporalStore();
  const { theme, resolved } = useTheme();

  const ThemeIcon = theme === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;
  const themeLabel = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  const handleSave = () => {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.dsw.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.dsw.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      importSnapshot(data);
    };
    input.click();
  };

  return (
    <div className="h-11 bg-surface-1 border-b border-border-subtle flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-accent to-purple-500" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-sm font-medium text-text-primary border-none outline-none focus:ring-1 focus:ring-accent/50 rounded px-1 -mx-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={15} />
        </button>
        <div className="w-px h-4 bg-border-subtle mx-1" />
        <button
          onClick={handleLoad}
          className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
          title="Open project"
        >
          <FolderOpen size={15} />
        </button>
        <button
          onClick={handleSave}
          className="p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
          title="Save project"
        >
          <Save size={15} />
        </button>
        <div className="w-px h-4 bg-border-subtle mx-1" />
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
          title={`Theme: ${themeLabel} (click to cycle)`}
        >
          <ThemeIcon size={15} />
        </button>
        <div className="w-px h-4 bg-border-subtle mx-1" />
        <button
          onClick={() => setExportPanelOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
        >
          <Download size={13} />
          Export Tokens
        </button>
      </div>
    </div>
  );
}
