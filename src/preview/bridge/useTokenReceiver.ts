import { useState, useEffect, useCallback } from 'react';
import { onTokenBroadcast } from './TokenBroadcast';
import { generateFullCSS } from './useTokenCSS';
import type { TokenTree } from '@/core/tokens/types';

const STORE_KEY = 'dsw-token-store';
const STYLE_ID = 'dsw-tokens';

/**
 * Hook for standalone demo pages (opened in a separate tab).
 * Reads tokens from localStorage on mount, then listens for
 * BroadcastChannel updates and postMessage updates from the workbench.
 *
 * Returns [css, replayCounter] -- replayCounter increments when the
 * workbench sends a "replay-animations" event (e.g., user clicks Play).
 */
export function useTokenReceiver(): [string, number] {
  const [css, setCss] = useState<string>(() => loadCSSFromStorage());
  const [replayCounter, setReplayCounter] = useState(0);

  const handleReplay = useCallback(() => {
    setReplayCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    // Listen for BroadcastChannel updates (tokens + replay)
    const unsubBroadcast = onTokenBroadcast(
      (newCSS) => setCss(newCSS),
      handleReplay,
    );

    // Listen for postMessage updates (from parent iframe)
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'dsw-token-css' && typeof event.data.css === 'string') {
        setCss(event.data.css);
      }
      if (event.data?.type === 'dsw-replay-animations') {
        handleReplay();
      }
    }
    window.addEventListener('message', handleMessage);

    // Listen for storage changes (another tab updates localStorage)
    function handleStorage(event: StorageEvent) {
      if (event.key === STORE_KEY) {
        setCss(loadCSSFromStorage());
      }
    }
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubBroadcast();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [handleReplay]);

  // Inject CSS into the current document
  useEffect(() => {
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, [css]);

  return [css, replayCounter];
}

function loadCSSFromStorage(): string {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return '';

    const parsed = JSON.parse(raw);
    const tokens: TokenTree = parsed?.state?.tokens ?? {};

    return generateFullCSS(tokens);
  } catch {
    return '';
  }
}
