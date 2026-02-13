import { useTokenStore } from '@/core/store/tokenStore';
import type { TemporalState } from 'zundo';
import type { TokenStore } from '@/core/store/tokenStore';
import { useEffect } from 'react';

type StoreWithTemporal = typeof useTokenStore & {
  temporal: {
    getState: () => TemporalState<TokenStore>;
  };
};

export function useTemporalStore() {
  const store = useTokenStore as StoreWithTemporal;
  const temporal = store.temporal.getState();

  const pastLength = temporal.pastStates.length;
  const futureLength = temporal.futureStates.length;

  return {
    undo: temporal.undo,
    redo: temporal.redo,
    canUndo: pastLength > 0,
    canRedo: futureLength > 0,
  };
}

export function useUndoRedoKeyboard() {
  const { undo, redo } = useTemporalStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);
}
