import { useMemo } from 'react';
import { useTokenStore } from '@/core/store/tokenStore';
import { formatCSS } from '@/core/export/formatters/cssCustomProperties';
import { deriveSemanticCSS } from './deriveSemantics';
import type { TokenTree } from '@/core/tokens/types';

interface TokenCSSOptions {
  colorFormat?: 'oklch' | 'hex' | 'rgb' | 'hsl';
  dimensionUnit?: 'px' | 'rem';
  includeSemantics?: boolean;
  selector?: string;
}

/**
 * Hook that generates a CSS string from the current token store state.
 * Debounced at ~16ms via requestAnimationFrame to handle rapid slider changes.
 */
export function useTokenCSS(options: TokenCSSOptions = {}): string {
  const {
    colorFormat = 'hex',
    dimensionUnit = 'rem',
    includeSemantics = true,
    selector = ':root',
  } = options;

  const tokens = useTokenStore((s) => s.tokens);

  const css = useMemo(() => {
    return generateFullCSS(tokens, { colorFormat, dimensionUnit, includeSemantics, selector });
  }, [tokens, colorFormat, dimensionUnit, includeSemantics, selector]);

  return css;
}

/**
 * Generate the full CSS string from a token tree.
 * Exported for use outside React (e.g., in the broadcast channel).
 */
export function generateFullCSS(
  tokens: TokenTree,
  options: TokenCSSOptions = {},
): string {
  const {
    colorFormat = 'hex',
    dimensionUnit = 'rem',
    includeSemantics = true,
    selector = ':root',
  } = options;

  // Check if tree has any tokens
  const hasTokens = Object.keys(tokens).length > 0;
  if (!hasTokens) return '';

  // Generate primitive token CSS
  const primitiveCSS = formatCSS(tokens, {
    colorFormat,
    dimensionUnit,
    includeDescriptions: false,
    selector,
  });

  if (!includeSemantics) return primitiveCSS;

  // Generate semantic CSS and merge into the same selector block
  const semanticVars = deriveSemanticCSS(tokens, colorFormat, dimensionUnit);

  // Insert semantic vars before the closing brace
  const closingBrace = primitiveCSS.lastIndexOf('}');
  if (closingBrace === -1) return primitiveCSS;

  return (
    primitiveCSS.slice(0, closingBrace) +
    '\n' +
    semanticVars +
    '\n' +
    primitiveCSS.slice(closingBrace)
  );
}
