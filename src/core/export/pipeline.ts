import type { TokenTree } from '@/core/tokens/types';
import { formatCSS, type CSSExportOptions } from './formatters/cssCustomProperties';
import { formatDTCGJson } from './formatters/jsonDTCG';
import { formatTailwindConfig, type TailwindExportOptions } from './formatters/tailwindConfig';
import type { ColorFormat } from './transforms/colorTransform';
import type { DimensionUnit } from './transforms/dimensionTransform';

export type ExportFormat = 'css' | 'dtcg-json' | 'tailwind';

export interface ExportOptions {
  format: ExportFormat;
  colorFormat: ColorFormat;
  dimensionUnit: DimensionUnit;
  includeDescriptions: boolean;
}

export interface ExportResult {
  filename: string;
  content: string;
  language: string;
}

export function exportTokens(tree: TokenTree, options: ExportOptions): ExportResult {
  switch (options.format) {
    case 'css':
      return {
        filename: 'tokens.css',
        content: formatCSS(tree, {
          colorFormat: options.colorFormat,
          dimensionUnit: options.dimensionUnit,
          includeDescriptions: options.includeDescriptions,
          selector: ':root',
        }),
        language: 'css',
      };

    case 'dtcg-json':
      return {
        filename: 'tokens.json',
        content: formatDTCGJson(tree),
        language: 'json',
      };

    case 'tailwind':
      return {
        filename: 'tailwind.config.js',
        content: formatTailwindConfig(tree, {
          colorFormat: options.colorFormat,
          dimensionUnit: options.dimensionUnit,
        }),
        language: 'javascript',
      };
  }
}

export function downloadFile(result: ExportResult): void {
  const blob = new Blob([result.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(content: string): Promise<void> {
  return navigator.clipboard.writeText(content);
}
