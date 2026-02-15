import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { GeneratorConfigMap } from '@/core/tokens/types';
import { BUILT_IN_PRESETS } from './builtInPresets';

// ---- Types ----

export interface StyleCharacteristics {
  typography: string;
  colorPhilosophy: string;
  toneSystem?: string;
  darkMode?: string;
  lightMode?: string;
  borders: string;
  shadows: string;
  animations: string;
  interactions: string;
  layout: string;
}

export interface StylePrompt {
  overall: string;
  characteristics: StyleCharacteristics;
}

export interface StylePreset {
  id: string;
  name: string;
  prompt: StylePrompt;
  generatorConfigs: GeneratorConfigMap;
  /** Key for lazy-loading the custom site component (e.g., 'fintech-premium') */
  siteComponent?: string;
  colors: string[]; // 3-5 representative hex colors for thumbnail
  builtIn?: boolean;
  createdAt: string;
}

interface StyleLibraryStore {
  userPresets: StylePreset[];
  addPreset: (preset: Omit<StylePreset, 'id' | 'createdAt'>) => void;
  removePreset: (id: string) => void;
  updatePreset: (id: string, updates: Partial<Pick<StylePreset, 'name' | 'prompt'>>) => void;
  duplicatePreset: (id: string) => void;
}

// ---- Store ----

export const useStyleLibraryStore = create<StyleLibraryStore>()(
  persist(
    (set, get) => ({
      userPresets: [],

      addPreset: (preset) => {
        const newPreset: StylePreset = {
          ...preset,
          id: nanoid(8),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          userPresets: [newPreset, ...state.userPresets],
        }));
      },

      removePreset: (id) => {
        set((state) => ({
          userPresets: state.userPresets.filter((p) => p.id !== id),
        }));
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          userPresets: state.userPresets.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        }));
      },

      duplicatePreset: (id) => {
        const allPresets = [...BUILT_IN_PRESETS, ...get().userPresets];
        const source = allPresets.find((p) => p.id === id);
        if (!source) return;
        const copy: StylePreset = {
          ...source,
          id: nanoid(8),
          name: `${source.name} (copy)`,
          builtIn: false,
          siteComponent: undefined,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          userPresets: [copy, ...state.userPresets],
        }));
      },
    }),
    { name: 'dsw-style-library' },
  ),
);

/**
 * Get all presets: built-in + user presets.
 * Built-in presets always come first.
 */
export function getAllPresets(userPresets: StylePreset[]): StylePreset[] {
  return [...BUILT_IN_PRESETS, ...userPresets];
}
