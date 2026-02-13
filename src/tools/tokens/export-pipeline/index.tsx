import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { useTokenStore } from '@/core/store/tokenStore';
import { flattenTokenTree } from '@/core/tokens/resolve';
import { exportTokens, downloadFile, type ExportFormat, type ExportOptions } from '@/core/export/pipeline';
import type { ColorFormat } from '@/core/export/transforms/colorTransform';
import type { DimensionUnit } from '@/core/export/transforms/dimensionTransform';

// ---- Constants ----

const FORMAT_OPTIONS: Array<{ id: ExportFormat; name: string; desc: string }> = [
  { id: 'css', name: 'CSS Custom Properties', desc: ':root { --token: value; }' },
  { id: 'dtcg-json', name: 'JSON (DTCG)', desc: 'W3C Design Token format' },
  { id: 'tailwind', name: 'Tailwind Config', desc: 'tailwind.config.js extend' },
];

const COLOR_FORMAT_OPTIONS: Array<{ id: ColorFormat; name: string }> = [
  { id: 'oklch', name: 'OKLCH' },
  { id: 'hex', name: 'Hex' },
  { id: 'rgb', name: 'RGB' },
  { id: 'hsl', name: 'HSL' },
];

const DIMENSION_UNIT_OPTIONS: Array<{ id: DimensionUnit; name: string }> = [
  { id: 'px', name: 'px' },
  { id: 'rem', name: 'rem' },
];

// ---- Syntax coloring helpers ----

function estimateFileSize(content: string): string {
  const bytes = new Blob([content]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ---- Main Tool ----

export default function TokenExportPipelineTool() {
  const tokens = useTokenStore((s) => s.tokens);

  const [format, setFormat] = useState<ExportFormat>('css');
  const [colorFormat, setColorFormat] = useState<ColorFormat>('oklch');
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>('rem');
  const [includeDescriptions, setIncludeDescriptions] = useState(true);
  const [copied, setCopied] = useState(false);

  const tokenCount = useMemo(() => flattenTokenTree(tokens).length, [tokens]);

  const options: ExportOptions = useMemo(
    () => ({ format, colorFormat, dimensionUnit, includeDescriptions }),
    [format, colorFormat, dimensionUnit, includeDescriptions],
  );

  const result = useMemo(() => {
    if (tokenCount === 0) return null;
    return exportTokens(tokens, options);
  }, [tokens, options, tokenCount]);

  const fileSize = useMemo(() => (result ? estimateFileSize(result.content) : '0 B'), [result]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadFile(result);
  }, [result]);

  // Count tokens per group
  const groupCounts = useMemo(() => {
    const allTokens = flattenTokenTree(tokens);
    const counts: Record<string, number> = {};
    for (const { path } of allTokens) {
      const group = path[0];
      counts[group] = (counts[group] ?? 0) + 1;
    }
    return counts;
  }, [tokens]);

  const hasTokens = tokenCount > 0;

  return (
    <ToolLayout
      title="Token Export Pipeline"
      description="Export your design tokens in multiple formats"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Export Format">
              <div className="space-y-1.5">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                      format === opt.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    <span className="font-medium block">{opt.name}</span>
                    <span className="text-[10px] opacity-60 block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Color Format">
              <div className="flex flex-wrap gap-1.5">
                {COLOR_FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setColorFormat(opt.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      colorFormat === opt.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Dimension Unit">
              <div className="flex gap-1.5">
                {DIMENSION_UNIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDimensionUnit(opt.id)}
                    className={`flex-1 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      dimensionUnit === opt.id
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-transparent'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </ParameterSection>

            <ParameterSection title="Options">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">Include descriptions</label>
                <button
                  onClick={() => setIncludeDescriptions(!includeDescriptions)}
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${
                    includeDescriptions ? 'bg-accent' : 'bg-surface-3'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface-0 transition-transform ${
                      includeDescriptions ? 'left-[16px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>
            </ParameterSection>

            <ParameterSection title="Token Overview">
              {!hasTokens ? (
                <div className="p-3 rounded-md bg-surface-2 border border-border-subtle text-center">
                  <p className="text-xs text-text-tertiary">No tokens in project.</p>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Use the design tools to generate tokens first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Total tokens</span>
                    <span className="text-text-secondary font-mono">{tokenCount}</span>
                  </div>
                  {Object.entries(groupCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([group, count]) => (
                      <div key={group} className="flex justify-between text-xs">
                        <span className="text-text-tertiary capitalize">{group}</span>
                        <span className="text-text-secondary font-mono">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6 space-y-4">
            {!hasTokens ? (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mb-3">
                  <Download size={18} className="text-text-tertiary" />
                </div>
                <p className="text-sm text-text-secondary">No Tokens to Export</p>
                <p className="text-xs text-text-tertiary mt-1 max-w-xs">
                  Generate tokens using the design tools (Color Lab, Spacing Lab, Typography Lab, etc.) to enable export.
                </p>
              </div>
            ) : (
              <>
                {/* File info + actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Output Preview
                    </h3>
                    {result && (
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {result.filename} &middot; {fileSize} &middot; {result.language}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-subtle"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-success" />
                          <span className="text-success">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20"
                      title="Download file"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </div>

                {/* Code preview */}
                <div className="bg-surface-2 rounded-lg border border-border-subtle overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
                    <span className="text-[10px] font-mono text-text-tertiary">
                      {result?.filename}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {result?.content.split('\n').length} lines
                    </span>
                  </div>
                  <div className="p-4 overflow-auto max-h-[500px]">
                    <pre className="font-mono text-xs text-text-secondary whitespace-pre leading-relaxed">
                      {result?.content}
                    </pre>
                  </div>
                </div>

                {/* Format info */}
                <div className="border-t border-border-subtle pt-4">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Format Details
                  </h3>
                  <div className="space-y-2">
                    {format === 'css' && (
                      <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                        <p className="text-[10px] font-medium text-text-primary mb-0.5">CSS Custom Properties</p>
                        <p className="text-[10px] text-text-tertiary">
                          Generates CSS variables under :root. Works natively in all modern browsers. Supports theming via cascade and specificity.
                        </p>
                      </div>
                    )}
                    {format === 'dtcg-json' && (
                      <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                        <p className="text-[10px] font-medium text-text-primary mb-0.5">W3C Design Token Community Group</p>
                        <p className="text-[10px] text-text-tertiary">
                          Standardized JSON format following the DTCG specification. Compatible with Style Dictionary, Token Studio, and other token tools.
                        </p>
                      </div>
                    )}
                    {format === 'tailwind' && (
                      <div className="p-2.5 rounded-md bg-surface-2 border border-border-subtle">
                        <p className="text-[10px] font-medium text-text-primary mb-0.5">Tailwind CSS Config</p>
                        <p className="text-[10px] text-text-tertiary">
                          Generates a theme.extend block for tailwind.config.js. Maps colors, spacing, shadows, and motion tokens to Tailwind utility classes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        }
      />
    </ToolLayout>
  );
}
