import { useEffect, useRef, type RefObject } from 'react';
import { useTokenCSS } from './useTokenCSS';
import { broadcastTokenCSS } from './TokenBroadcast';

const STYLE_ID = 'dsw-tokens';

/**
 * Hook that bridges token CSS into an iframe's document.
 * Uses direct contentDocument access (same-origin) for synchronous injection.
 * Also broadcasts via BroadcastChannel for cross-tab demos.
 */
export function useTokenBridge(iframeRef: RefObject<HTMLIFrameElement | null>): void {
  const css = useTokenCSS();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Broadcast for cross-tab sync
    if (css) {
      broadcastTokenCSS(css);
    }
  }, [css]);

  useEffect(() => {
    // Debounce injection via rAF
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      injectCSS(iframeRef.current, css);
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [css, iframeRef]);
}

function injectCSS(iframe: HTMLIFrameElement | null, css: string): void {
  if (!iframe) return;

  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = STYLE_ID;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  } catch {
    // Cross-origin or iframe not ready -- fallback to postMessage
    try {
      iframe.contentWindow?.postMessage({ type: 'dsw-token-css', css }, '*');
    } catch {
      // Silent fail
    }
  }
}

/**
 * Inject CSS directly into an iframe once it loads.
 * Useful for initial load before the effect runs.
 */
export function injectTokenCSS(iframe: HTMLIFrameElement | null, css: string): void {
  injectCSS(iframe, css);
}
