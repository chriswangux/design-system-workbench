import type { TokenTree } from '@/core/tokens/types';

/**
 * Export tokens in W3C Design Tokens Community Group (DTCG) JSON format.
 * This is nearly a 1:1 serialization of the internal model.
 */
export function formatDTCGJson(tree: TokenTree): string {
  return JSON.stringify(tree, null, 2);
}
