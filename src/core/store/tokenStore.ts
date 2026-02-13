import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { TokenTree, TokenGroup, Token, TokenValue, GeneratorConfigMap, SerializedProject } from '@/core/tokens/types';
import { resolveReference as resolveRef, getTokenByPath } from '@/core/tokens/resolve';
import { DEFAULT_GENERATOR_CONFIGS } from '@/core/tokens/defaults';

export interface TokenStore {
  // ---- State ----
  projectName: string;
  tokens: TokenTree;
  generatorConfigs: GeneratorConfigMap;

  // ---- Token Actions ----
  setToken: (path: string[], token: Token) => void;
  setTokenGroup: (path: string[], group: TokenGroup) => void;
  removeToken: (path: string[]) => void;
  bulkSetTokens: (entries: Array<{ path: string[]; token: Token }>) => void;

  // ---- Generator Config Actions ----
  setGeneratorConfig: <T>(toolId: string, config: T) => void;
  getGeneratorConfig: <T>(toolId: string) => T | undefined;

  // ---- Resolution ----
  resolveReference: (ref: string) => TokenValue | null;
  getToken: (path: string[]) => Token | undefined;

  // ---- Project Actions ----
  setProjectName: (name: string) => void;
  exportSnapshot: () => SerializedProject;
  importSnapshot: (data: SerializedProject) => void;
  resetProject: () => void;
}

const INITIAL_STATE = {
  projectName: 'Untitled Design System',
  tokens: {} as TokenTree,
  generatorConfigs: { ...DEFAULT_GENERATOR_CONFIGS },
};

export const useTokenStore = create<TokenStore>()(
  persist(
    temporal(
      immer<TokenStore>((set, get) => ({
        ...INITIAL_STATE,

        setToken: (path, token) => {
          set((state) => {
            setNestedValue(state.tokens, path, token);
          });
        },

        setTokenGroup: (path, group) => {
          set((state) => {
            setNestedValue(state.tokens, path, group);
          });
        },

        removeToken: (path) => {
          set((state) => {
            removeNestedValue(state.tokens, path);
          });
        },

        bulkSetTokens: (entries) => {
          set((state) => {
            for (const { path, token } of entries) {
              setNestedValue(state.tokens, path, token);
            }
          });
        },

        setGeneratorConfig: (toolId, config) => {
          set((state) => {
            state.generatorConfigs[toolId] = config;
          });
        },

        getGeneratorConfig: <T,>(toolId: string) => {
          return get().generatorConfigs[toolId] as T | undefined;
        },

        resolveReference: (ref) => {
          return resolveRef(get().tokens, ref);
        },

        getToken: (path) => {
          return getTokenByPath(get().tokens, path);
        },

        setProjectName: (name) => {
          set((state) => {
            state.projectName = name;
          });
        },

        exportSnapshot: () => {
          const state = get();
          return {
            version: 1,
            name: state.projectName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tokens: structuredClone(state.tokens),
            generatorConfigs: structuredClone(state.generatorConfigs),
          };
        },

        importSnapshot: (data) => {
          set((state) => {
            state.projectName = data.name;
            state.tokens = data.tokens;
            state.generatorConfigs = data.generatorConfigs;
          });
        },

        resetProject: () => {
          set((state) => {
            state.projectName = INITIAL_STATE.projectName;
            state.tokens = {};
            state.generatorConfigs = { ...DEFAULT_GENERATOR_CONFIGS };
          });
        },
      })),
      { limit: 100 }, // undo history limit
    ),
    {
      name: 'dsw-token-store',
      partialize: (state) => ({
        projectName: state.projectName,
        tokens: state.tokens,
        generatorConfigs: state.generatorConfigs,
      }),
    },
  ),
);

// ---- Helper: set a nested value in the token tree ----

function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

function removeNestedValue(
  obj: Record<string, unknown>,
  path: string[],
): void {
  if (path.length === 0) return;
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object') return;
    current = current[key] as Record<string, unknown>;
  }
  delete current[path[path.length - 1]];
}
