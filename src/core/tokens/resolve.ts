import type { TokenTree, TokenGroup, Token, TokenValue, DesignToken } from './types';
import { isAlias } from './types';

const ALIAS_PATTERN = /^\{(.+)\}$/;
const MAX_DEPTH = 10;

/**
 * Parse an alias reference string like "{color.blue.500}" into a path array.
 */
export function parseAliasPath(ref: string): string[] | null {
  const match = ref.match(ALIAS_PATTERN);
  if (!match) return null;
  return match[1].split('.');
}

/**
 * Get a token value from the tree by dot-delimited path.
 */
export function getTokenByPath(tree: TokenTree, path: string[]): Token | undefined {
  let current: TokenTree | TokenGroup | Token | undefined = tree;
  for (const segment of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment] as typeof current;
  }
  if (current && typeof current === 'object' && '$value' in current) {
    return current as Token;
  }
  return undefined;
}

/**
 * Resolve a token's value, following alias chains.
 * Returns the resolved DesignToken value, or null if resolution fails.
 */
export function resolveToken(
  tree: TokenTree,
  token: Token,
  depth = 0,
): TokenValue | null {
  if (depth > MAX_DEPTH) return null;

  if (!isAlias(token)) {
    return token.$value;
  }

  const path = parseAliasPath(token.$value);
  if (!path) return null;

  const target = getTokenByPath(tree, path);
  if (!target) return null;

  return resolveToken(tree, target, depth + 1);
}

/**
 * Resolve a reference string directly against the tree.
 */
export function resolveReference(tree: TokenTree, ref: string): TokenValue | null {
  const path = parseAliasPath(ref);
  if (!path) return null;

  const token = getTokenByPath(tree, path);
  if (!token) return null;

  return resolveToken(tree, token);
}

/**
 * Collect all tokens from a group recursively as flat [path, token] pairs.
 */
export function flattenTokenGroup(
  group: TokenGroup,
  prefix: string[] = [],
): Array<{ path: string[]; token: Token }> {
  const results: Array<{ path: string[]; token: Token }> = [];

  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    if (value && typeof value === 'object' && '$value' in value) {
      results.push({ path: [...prefix, key], token: value as Token });
    } else if (value && typeof value === 'object' && !('$value' in value)) {
      results.push(...flattenTokenGroup(value as TokenGroup, [...prefix, key]));
    }
  }

  return results;
}

/**
 * Collect all tokens from the entire tree as flat [path, token] pairs.
 */
export function flattenTokenTree(tree: TokenTree): Array<{ path: string[]; token: Token }> {
  const results: Array<{ path: string[]; token: Token }> = [];

  for (const [groupName, group] of Object.entries(tree)) {
    if (!group) continue;
    results.push(...flattenTokenGroup(group, [groupName]));
  }

  return results;
}

/**
 * Find all tokens that reference a given path.
 */
export function findReferencesTo(
  tree: TokenTree,
  targetPath: string[],
): Array<{ path: string[]; token: Token }> {
  const targetRef = `{${targetPath.join('.')}}`;
  const allTokens = flattenTokenTree(tree);

  return allTokens.filter(
    ({ token }) => isAlias(token) && token.$value === targetRef,
  );
}

/**
 * Build a dependency graph of token references.
 * Returns a map of source path -> referenced paths.
 */
export function buildDependencyGraph(
  tree: TokenTree,
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const allTokens = flattenTokenTree(tree);

  for (const { path, token } of allTokens) {
    const key = path.join('.');
    if (isAlias(token)) {
      const refPath = parseAliasPath(token.$value);
      if (refPath) {
        const deps = graph.get(key) ?? [];
        deps.push(refPath.join('.'));
        graph.set(key, deps);
      }
    }
  }

  return graph;
}
