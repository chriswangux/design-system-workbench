import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';

interface UIStore {
  sidebarCollapsed: boolean;
  expandedSections: string[];
  activeToolPath: string;
  exportPanelOpen: boolean;
  theme: Theme;

  toggleSidebar: () => void;
  toggleSection: (section: string) => void;
  setActiveTool: (path: string) => void;
  setExportPanelOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      expandedSections: ['Visual Design'],
      activeToolPath: '/visual/color-lab',
      exportPanelOpen: false,
      theme: 'dark' as Theme,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      toggleSection: (section) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(section)
            ? state.expandedSections.filter((s) => s !== section)
            : [...state.expandedSections, section],
        })),

      setActiveTool: (path) => set({ activeToolPath: path }),

      setExportPanelOpen: (open) => set({ exportPanelOpen: open }),

      setTheme: (theme) => set({ theme }),

      cycleTheme: () =>
        set((state) => {
          const order: Theme[] = ['dark', 'light', 'system'];
          const idx = order.indexOf(state.theme);
          return { theme: order[(idx + 1) % order.length] };
        }),
    }),
    {
      name: 'dsw-ui-store',
    },
  ),
);
