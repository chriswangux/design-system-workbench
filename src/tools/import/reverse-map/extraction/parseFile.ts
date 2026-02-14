import type { ExtractionResult } from './types';
import { emptyResult } from './types';
import { parseCSS } from './parseCSS';
import { parseHTML } from './parseHTML';
import { parseBookmarkletData } from './parseBookmarkletData';
import { parseDTCGJson } from './parseDTCGJson';

// ---------------------------------------------------------------------------
// File type detection
// ---------------------------------------------------------------------------

/**
 * Get the file extension from a filename, normalized to lowercase.
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Detect whether a JSON object is DTCG format (contains tokens with $value keys)
 * or bookmarklet output (has our bookmarklet payload shape).
 */
function isDTCGFormat(data: Record<string, unknown>): boolean {
  // Bookmarklet payloads have a known top-level shape
  if ('version' in data && ('colors' in data || 'fontFamilies' in data || 'fontSizes' in data)) {
    return false;
  }

  // DTCG tokens have $value at some level of nesting
  function hasTokens(obj: unknown, depth: number): boolean {
    if (depth > 5) return false;
    if (typeof obj !== 'object' || obj === null) return false;
    const record = obj as Record<string, unknown>;
    if ('$value' in record) return true;
    for (const [key, val] of Object.entries(record)) {
      if (key.startsWith('$')) continue;
      if (hasTokens(val, depth + 1)) return true;
    }
    return false;
  }

  return hasTokens(data, 0);
}

// ---------------------------------------------------------------------------
// Main file parser
// ---------------------------------------------------------------------------

/**
 * Parse an uploaded file based on its extension and content.
 *
 * @param file - The File object from a file input or drop
 * @returns ExtractionResult with source set to 'file'
 */
export async function parseFile(file: File): Promise<ExtractionResult> {
  const ext = getExtension(file.name);

  try {
    switch (ext) {
      case 'css': {
        const text = await file.text();
        const result = parseCSS(text);
        result.source = 'file';
        return result;
      }

      case 'html':
      case 'htm': {
        const text = await file.text();
        const result = await parseHTML(text);
        result.source = 'file';
        return result;
      }

      case 'json': {
        const text = await file.text();
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          return emptyResult('file'); // Invalid JSON
        }

        if (isDTCGFormat(data)) {
          const result = parseDTCGJson(data);
          result.source = 'file';
          return result;
        } else {
          const result = parseBookmarkletData(data as Parameters<typeof parseBookmarkletData>[0]);
          result.source = 'file';
          return result;
        }
      }

      default:
        // Unsupported file type, return empty
        return emptyResult('file');
    }
  } catch {
    // Any read/parse error, return empty
    return emptyResult('file');
  }
}
