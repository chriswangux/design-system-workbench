/**
 * BroadcastChannel wrapper for cross-tab token synchronization
 * and animation replay propagation.
 */

const CHANNEL_NAME = 'dsw-token-sync';

type BroadcastMessage =
  | { type: 'token-update'; css: string; timestamp: number }
  | { type: 'replay-animations'; timestamp: number };

export function broadcastTokenCSS(css: string): void {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    const message: BroadcastMessage = {
      type: 'token-update',
      css,
      timestamp: Date.now(),
    };
    bc.postMessage(message);
    bc.close();
  } catch {
    // BroadcastChannel not supported or other error -- silent fail
  }
}

/**
 * Broadcast a "replay animations" event to all open demo tabs.
 * Called when the user clicks Play in any motion tool.
 */
export function broadcastReplay(): void {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    const message: BroadcastMessage = {
      type: 'replay-animations',
      timestamp: Date.now(),
    };
    bc.postMessage(message);
    bc.close();
  } catch {
    // Silent fail
  }
}

export function onTokenBroadcast(callback: (css: string) => void, onReplay?: () => void): () => void {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      if (event.data?.type === 'token-update') {
        callback(event.data.css);
      } else if (event.data?.type === 'replay-animations' && onReplay) {
        onReplay();
      }
    };
    return () => bc.close();
  } catch {
    // BroadcastChannel not supported
    return () => {};
  }
}
