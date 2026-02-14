import { useState, useCallback, useMemo, useRef } from 'react';
import { ToolLayout } from '@/components/shell/ToolLayout';
import { useTokenStore } from '@/core/store/tokenStore';
import {
  parseCSS,
  parseHTML,
  parseBookmarkletData,
  parseFile,
} from './extraction';
import type { ExtractionResult } from './extraction/types';
import { clusterColors, type ColorCluster } from './clustering/colorClustering';
import { detectTypography, type TypographyAnalysis } from './clustering/typographyDetection';
import { detectSpacing, type SpacingAnalysis } from './clustering/spacingDetection';
import { analyzeShadows, type ShadowAnalysis } from './clustering/shadowParsing';
import { toColorLabConfig } from './mapping/toColorLabConfig';
import { toTypographyLabConfig } from './mapping/toTypographyLabConfig';
import { toSpacingLabConfig } from './mapping/toSpacingLabConfig';
import { toShadowLabConfig } from './mapping/toShadowLabConfig';

// ============================================================================
// Types
// ============================================================================

type WizardStep = 1 | 2 | 3 | 4;
type InputTab = 'css' | 'html' | 'file' | 'bookmarklet';

interface AnalysisResult {
  colorClusters: ColorCluster[];
  typography: TypographyAnalysis;
  spacing: SpacingAnalysis;
  shadows: ShadowAnalysis;
}

interface ClusterNames {
  [key: number]: string;
}

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Input',
  2: 'Extraction',
  3: 'Analysis',
  4: 'Import',
};

const ACCEPTED_EXTENSIONS = '.css,.html,.htm,.json';

// ============================================================================
// Utility helpers
// ============================================================================

function fitQualityBadge(quality: number) {
  const pct = Math.round(quality * 100);
  let colorClass: string;
  if (pct >= 80) colorClass = 'text-success bg-success/10 border-success/30';
  else if (pct >= 50) colorClass = 'text-warning bg-warning/10 border-warning/30';
  else colorClass = 'text-error bg-error/10 border-error/30';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}>
      {pct}% fit
    </span>
  );
}

function emptyState(message: string) {
  return (
    <div className="flex items-center justify-center py-8 px-4">
      <p className="text-xs text-text-tertiary italic">{message}</p>
    </div>
  );
}

function sectionHeading(title: string, badge?: React.ReactNode) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {title}
      </h3>
      {badge}
    </div>
  );
}

// ============================================================================
// Step Indicator
// ============================================================================

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}) {
  const steps: WizardStep[] = [1, 2, 3, 4];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((step, idx) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isClickable = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-1">
            <button
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : isCompleted
                    ? 'bg-surface-2 text-accent hover:bg-surface-3 border border-transparent cursor-pointer'
                    : 'bg-surface-2 text-text-tertiary border border-transparent cursor-default'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                  isActive
                    ? 'bg-accent text-white'
                    : isCompleted
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-3 text-text-tertiary'
                }`}
              >
                {isCompleted ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step
                )}
              </span>
              {STEP_LABELS[step]}
            </button>
            {idx < steps.length - 1 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary/40 shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Step 1: Input
// ============================================================================

function StepInput({
  onExtract,
}: {
  onExtract: (result: ExtractionResult) => void;
}) {
  const [tab, setTab] = useState<InputTab>('css');
  const [textValue, setTextValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: Array<{ id: InputTab; label: string }> = [
    { id: 'css', label: 'Paste CSS' },
    { id: 'html', label: 'Paste HTML' },
    { id: 'file', label: 'Upload File' },
    { id: 'bookmarklet', label: 'Bookmarklet' },
  ];

  const placeholders: Record<InputTab, string> = {
    css: `:root {
  --color-primary: #3b82f6;
  --color-secondary: #6366f1;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}

.button {
  font-size: 14px;
  padding: 8px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, sans-serif; font-size: 16px; }
    h1 { font-size: 32px; color: #1e293b; }
    .card { padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  </style>
</head>
<body>...</body>
</html>`,
    bookmarklet: `{
  "version": 1,
  "url": "https://example.com",
  "colors": ["#3b82f6", "#6366f1", "#1e293b"],
  "fontSizes": ["14px", "16px", "24px", "32px"],
  "spacings": ["4px", "8px", "16px", "24px", "32px"]
}`,
    file: '',
  };

  const handleExtract = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      let result: ExtractionResult;
      if (tab === 'css') {
        if (!textValue.trim()) {
          setError('Please paste some CSS to extract from.');
          setIsLoading(false);
          return;
        }
        result = parseCSS(textValue);
      } else if (tab === 'html') {
        if (!textValue.trim()) {
          setError('Please paste some HTML to extract from.');
          setIsLoading(false);
          return;
        }
        result = await parseHTML(textValue);
      } else if (tab === 'bookmarklet') {
        if (!textValue.trim()) {
          setError('Please paste the bookmarklet JSON output.');
          setIsLoading(false);
          return;
        }
        result = parseBookmarkletData(textValue);
      } else {
        setError('Please use the file upload area to select a file.');
        setIsLoading(false);
        return;
      }

      const isEmpty =
        result.colors.length === 0 &&
        result.fontSizes.length === 0 &&
        result.spacings.length === 0 &&
        result.shadows.length === 0 &&
        result.motion.durations.length === 0;

      if (isEmpty) {
        setError('No design values could be extracted from the provided input. Check that the content contains CSS declarations with color, spacing, typography, or shadow values.');
        setIsLoading(false);
        return;
      }

      onExtract(result);
    } catch (e) {
      setError(`Extraction failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [tab, textValue, onExtract]);

  const handleFileDrop = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      setIsLoading(true);
      try {
        const file = files[0];
        const result = await parseFile(file);

        const isEmpty =
          result.colors.length === 0 &&
          result.fontSizes.length === 0 &&
          result.spacings.length === 0 &&
          result.shadows.length === 0;

        if (isEmpty) {
          setError(`No design values found in "${file.name}". Supported formats: .css, .html, .htm, .json`);
          setIsLoading(false);
          return;
        }

        onExtract(result);
      } catch (e) {
        setError(`File parsing failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    },
    [onExtract],
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 p-1 bg-surface-2 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-surface-0 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'file' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileDrop(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 px-8 transition-colors ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-text-tertiary'
          }`}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary mb-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm text-text-secondary font-medium mb-1">
            Drop a file here or click to browse
          </p>
          <p className="text-xs text-text-tertiary mb-4">
            Accepts .css, .html, .htm, .json files
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-md text-xs font-medium bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border-subtle transition-colors"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => handleFileDrop(e.target.files)}
          />
        </div>
      ) : (
        <div>
          {tab === 'bookmarklet' && (
            <div className="mb-3 p-3 rounded-md bg-surface-2 border border-border-subtle">
              <p className="text-xs text-text-secondary font-medium mb-1">How to use the bookmarklet</p>
              <ol className="text-[11px] text-text-tertiary space-y-1 list-decimal list-inside">
                <li>Create a bookmarklet that extracts computed styles from any page</li>
                <li>Navigate to the website you want to reverse-engineer</li>
                <li>Run the bookmarklet -- it copies a JSON payload to your clipboard</li>
                <li>Paste the JSON output into the text area below</li>
              </ol>
            </div>
          )}
          <textarea
            value={textValue}
            onChange={(e) => { setTextValue(e.target.value); setError(null); }}
            placeholder={placeholders[tab]}
            spellCheck={false}
            className="w-full h-64 p-4 rounded-lg bg-surface-2 border border-border-subtle text-text-primary text-xs font-mono leading-relaxed placeholder:text-text-tertiary/50 resize-none focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 rounded-md bg-error/10 border border-error/30">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {/* Extract button */}
      {tab !== 'file' && (
        <div className="mt-4">
          <button
            onClick={handleExtract}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Extracting...
              </span>
            ) : (
              'Extract Design Values'
            )}
          </button>
        </div>
      )}

      {isLoading && tab === 'file' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          Parsing file...
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step 2: Extraction Results
// ============================================================================

function StepExtraction({
  result,
  onAnalyze,
}: {
  result: ExtractionResult;
  onAnalyze: () => void;
}) {
  const colorCount = result.colors.length;
  const fontSizeCount = result.fontSizes.length;
  const spacingCount = result.spacings.length;
  const shadowCount = result.shadows.length;
  const motionCount = result.motion.durations.length + result.motion.easings.length;
  const fontFamilyCount = result.fontFamilies.length;

  // Sorted for display
  const topColors = useMemo(() => result.colors.slice(0, 60), [result.colors]);
  const sortedFontSizes = useMemo(
    () => [...result.fontSizes].sort((a, b) => a.value - b.value),
    [result.fontSizes],
  );
  const sortedSpacings = useMemo(() => {
    const unique = new Map<number, { value: number; count: number }>();
    for (const s of result.spacings) {
      const existing = unique.get(s.value);
      if (existing) existing.count += s.count;
      else unique.set(s.value, { value: s.value, count: s.count });
    }
    return Array.from(unique.values()).sort((a, b) => a.value - b.value);
  }, [result.spacings]);
  const maxSpacingCount = useMemo(
    () => Math.max(1, ...sortedSpacings.map((s) => s.count)),
    [sortedSpacings],
  );

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Colors', value: colorCount },
          { label: 'Font Sizes', value: fontSizeCount },
          { label: 'Font Families', value: fontFamilyCount },
          { label: 'Spacings', value: spacingCount },
          { label: 'Shadows', value: shadowCount },
          { label: 'Motion', value: motionCount },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-lg bg-surface-2 border border-border-subtle text-center">
            <div className="text-lg font-semibold text-text-primary font-mono">{value}</div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Colors */}
      <div className="mb-6">
        {sectionHeading('Colors')}
        {colorCount === 0 ? (
          emptyState('No colors found')
        ) : (
          <div className="flex flex-wrap gap-2">
            {topColors.map((color, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2 border border-border-subtle">
                <div
                  className="w-5 h-5 rounded border border-border-subtle shrink-0"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-[10px] font-mono text-text-secondary">{color.value}</span>
                <span className="text-[10px] text-text-tertiary">&times;{color.count}</span>
              </div>
            ))}
            {colorCount > 60 && (
              <div className="flex items-center px-2 py-1 text-[10px] text-text-tertiary">
                +{colorCount - 60} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Typography */}
      <div className="mb-6">
        {sectionHeading('Typography')}
        {fontSizeCount === 0 && fontFamilyCount === 0 ? (
          emptyState('No typography values found')
        ) : (
          <div className="space-y-3">
            {fontSizeCount > 0 && (
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Font Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {sortedFontSizes.map((fs, i) => (
                    <div key={i} className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-border-subtle">
                      <span className="text-xs font-mono text-text-primary font-medium">{fs.value}px</span>
                      {fs.originalValue !== `${fs.value}px` && (
                        <span className="text-[10px] text-text-tertiary ml-1">({fs.originalValue})</span>
                      )}
                      <span className="text-[10px] text-text-tertiary ml-1">&times;{fs.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {fontFamilyCount > 0 && (
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Font Families</p>
                <div className="space-y-1">
                  {result.fontFamilies.map((ff, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-surface-2 border border-border-subtle">
                      <span className="text-xs text-text-primary truncate max-w-md" style={{ fontFamily: ff.value }}>
                        {ff.value}
                      </span>
                      <span className="text-[10px] text-text-tertiary shrink-0 ml-2">&times;{ff.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacing */}
      <div className="mb-6">
        {sectionHeading('Spacing')}
        {spacingCount === 0 ? (
          emptyState('No spacing values found')
        ) : (
          <div className="space-y-1.5">
            {sortedSpacings.map((sp, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-surface-2 border border-border-subtle">
                <span className="text-xs font-mono text-text-primary w-14 text-right shrink-0">{sp.value}px</span>
                <div className="flex-1 h-3 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(4, (sp.count / maxSpacingCount) * 100)}%`,
                      backgroundColor: 'var(--color-accent)',
                      opacity: 0.6,
                    }}
                  />
                </div>
                <span className="text-[10px] text-text-tertiary w-8 shrink-0">&times;{sp.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shadows */}
      <div className="mb-6">
        {sectionHeading('Shadows')}
        {shadowCount === 0 ? (
          emptyState('No shadows found')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.shadows.map((shadow, i) => (
              <div key={i} className="p-4 rounded-lg bg-surface-2 border border-border-subtle">
                <div
                  className="w-full h-16 rounded-md mb-3"
                  style={{
                    backgroundColor: 'var(--color-surface-1)',
                    boxShadow: shadow.original,
                  }}
                />
                <p className="text-[10px] font-mono text-text-tertiary truncate" title={shadow.original}>
                  {shadow.original}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motion */}
      <div className="mb-6">
        {sectionHeading('Motion')}
        {motionCount === 0 ? (
          emptyState('No motion values found')
        ) : (
          <div className="space-y-3">
            {result.motion.durations.length > 0 && (
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Durations</p>
                <div className="flex flex-wrap gap-2">
                  {result.motion.durations.map((d, i) => (
                    <div key={i} className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-border-subtle">
                      <span className="text-xs font-mono text-text-primary">{d.value}ms</span>
                      <span className="text-[10px] text-text-tertiary ml-1">&times;{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.motion.easings.length > 0 && (
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Easings</p>
                <div className="flex flex-wrap gap-2">
                  {result.motion.easings.map((e, i) => (
                    <div key={i} className="px-2.5 py-1.5 rounded-md bg-surface-2 border border-border-subtle">
                      <span className="text-[10px] font-mono text-text-secondary">{e.value}</span>
                      <span className="text-[10px] text-text-tertiary ml-1">&times;{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analyze button */}
      <div className="pt-2">
        <button
          onClick={onAnalyze}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover"
        >
          Analyze &amp; Cluster
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Step 3: Clustering & Analysis
// ============================================================================

function StepAnalysis({
  extraction,
  analysis,
  clusterNames,
  onClusterNameChange,
  onReview,
}: {
  extraction: ExtractionResult;
  analysis: AnalysisResult;
  clusterNames: ClusterNames;
  onClusterNameChange: (idx: number, name: string) => void;
  onReview: () => void;
}) {
  const { colorClusters, typography, spacing, shadows } = analysis;

  // Type scale preview: generate expected sizes from base + ratio
  const typeScalePreview = useMemo(() => {
    const sizes: Array<{ step: number; size: number }> = [];
    for (let i = -typography.stepsBelow; i <= typography.stepsAbove; i++) {
      sizes.push({
        step: i,
        size: Math.round(typography.baseFontSize * Math.pow(typography.ratio, i) * 10) / 10,
      });
    }
    return sizes;
  }, [typography]);

  // Spacing preview: generate expected values from the detected progression
  const spacingPreview = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i < spacing.steps; i++) {
      if (spacing.progression === 'geometric' && spacing.ratio) {
        values.push(Math.round(spacing.baseUnit * Math.pow(spacing.ratio, i) * 100) / 100);
      } else if (spacing.progression === 'arithmetic') {
        values.push(Math.round(spacing.baseUnit * (i + 1) * 100) / 100);
      } else if (spacing.progression === 'fibonacci') {
        const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
        values.push(Math.round(spacing.baseUnit * (fib[i] ?? fib[fib.length - 1]) * 100) / 100);
      } else if (spacing.customValues) {
        values.push(...spacing.customValues);
        break;
      } else {
        values.push(spacing.baseUnit * (i + 1));
      }
    }
    return values;
  }, [spacing]);

  const maxSpacingVal = Math.max(1, ...spacingPreview);

  return (
    <div>
      {/* Color Palettes */}
      <div className="mb-8">
        {sectionHeading('Color Palettes')}
        {colorClusters.length === 0 ? (
          emptyState('No color clusters detected')
        ) : (
          <div className="space-y-4">
            {colorClusters.map((cluster, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-surface-2 border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={clusterNames[idx] ?? cluster.name}
                      onChange={(e) => onClusterNameChange(idx, e.target.value)}
                      className="text-sm font-medium text-text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none transition-colors px-0.5 py-0 w-32"
                    />
                    <span className="text-[10px] text-text-tertiary">
                      {cluster.colors.length} colors &middot; hue {Math.round(cluster.hueCenter)}&deg;
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {cluster.colors.map((c, ci) => (
                    <div key={ci} className="flex-1 min-w-0">
                      <div
                        className="h-10 rounded-md border border-border-subtle"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.hex}\nL: ${c.l} C: ${c.c} H: ${c.h}`}
                      />
                      <p className="text-[9px] font-mono text-text-tertiary mt-1 text-center truncate">
                        {c.hex}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Type Scale */}
      <div className="mb-8">
        {sectionHeading('Type Scale', fitQualityBadge(typography.fitQuality))}
        <div className="p-4 rounded-lg bg-surface-2 border border-border-subtle">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Base Size</p>
              <p className="text-sm font-mono text-text-primary font-medium">{typography.baseFontSize}px</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Ratio</p>
              <p className="text-sm font-mono text-text-primary font-medium">{typography.ratio}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Steps</p>
              <p className="text-sm font-mono text-text-primary font-medium">
                -{typography.stepsBelow} / +{typography.stepsAbove}
              </p>
            </div>
          </div>
          {typography.fontFamilies.body.length > 0 && (
            <div className="mb-4 space-y-1">
              {typography.fontFamilies.body.length > 0 && (
                <p className="text-[10px] text-text-tertiary">
                  <span className="uppercase tracking-wider">Body:</span>{' '}
                  <span className="text-text-secondary">{typography.fontFamilies.body.join(', ')}</span>
                </p>
              )}
              {typography.fontFamilies.heading.length > 0 && (
                <p className="text-[10px] text-text-tertiary">
                  <span className="uppercase tracking-wider">Heading:</span>{' '}
                  <span className="text-text-secondary">{typography.fontFamilies.heading.join(', ')}</span>
                </p>
              )}
              {typography.fontFamilies.mono.length > 0 && (
                <p className="text-[10px] text-text-tertiary">
                  <span className="uppercase tracking-wider">Mono:</span>{' '}
                  <span className="text-text-secondary">{typography.fontFamilies.mono.join(', ')}</span>
                </p>
              )}
            </div>
          )}
          {/* Visual scale preview */}
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Scale Preview</p>
            {typeScalePreview.map(({ step, size }) => (
              <div key={step} className="flex items-baseline gap-3">
                <span className="text-[10px] font-mono text-text-tertiary w-8 text-right shrink-0">
                  {step === 0 ? 'base' : step > 0 ? `+${step}` : step}
                </span>
                <span
                  className="text-text-primary truncate"
                  style={{ fontSize: `${Math.min(size, 48)}px`, lineHeight: 1.2 }}
                >
                  Aa
                </span>
                <span className="text-[10px] font-mono text-text-tertiary shrink-0">{size}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div className="mb-8">
        {sectionHeading('Spacing Scale', fitQualityBadge(spacing.fitQuality))}
        <div className="p-4 rounded-lg bg-surface-2 border border-border-subtle">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Base Unit</p>
              <p className="text-sm font-mono text-text-primary font-medium">{spacing.baseUnit}px</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Progression</p>
              <p className="text-sm font-mono text-text-primary font-medium capitalize">{spacing.progression}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                {spacing.progression === 'geometric' ? 'Ratio' : 'Steps'}
              </p>
              <p className="text-sm font-mono text-text-primary font-medium">
                {spacing.progression === 'geometric' && spacing.ratio ? spacing.ratio : spacing.steps}
              </p>
            </div>
          </div>
          {/* Visual bar chart */}
          <div className="space-y-1.5 pt-2 border-t border-border-subtle">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Scale Preview</p>
            {spacingPreview.map((val, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-text-tertiary w-14 text-right shrink-0">{val}px</span>
                <div
                  className="h-4 rounded"
                  style={{
                    width: `${Math.max(4, (val / maxSpacingVal) * 100)}%`,
                    backgroundColor: 'var(--color-accent)',
                    opacity: 0.5,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shadows */}
      <div className="mb-8">
        {sectionHeading(
          `Shadow System (${shadows.elevationSteps} levels)`,
          fitQualityBadge(shadows.fitQuality),
        )}
        {extraction.shadows.length === 0 ? (
          emptyState('No shadows to analyze')
        ) : (
          <div className="p-4 rounded-lg bg-surface-2 border border-border-subtle">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Base Blur</p>
                <p className="text-sm font-mono text-text-primary font-medium">{shadows.baseBlur}px</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Blur Ratio</p>
                <p className="text-sm font-mono text-text-primary font-medium">{shadows.blurRatio}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Base Offset</p>
                <p className="text-sm font-mono text-text-primary font-medium">{shadows.baseOffset}px</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Spread</p>
                <p className="text-sm font-mono text-text-primary font-medium capitalize">{shadows.spreadBehavior}</p>
              </div>
            </div>
            {/* Shadow elevation previews */}
            <div className="pt-2 border-t border-border-subtle">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-3">Elevation Preview</p>
              <div className="flex gap-4 flex-wrap">
                {Array.from({ length: Math.min(shadows.elevationSteps, 6) }, (_, i) => {
                  const blur = shadows.baseBlur * Math.pow(shadows.blurRatio, i);
                  const offset = shadows.baseOffset * Math.pow(shadows.offsetRatio, i);
                  const opacity = shadows.directionalOpacity;
                  return (
                    <div key={i} className="text-center">
                      <div
                        className="w-16 h-16 rounded-lg"
                        style={{
                          backgroundColor: 'var(--color-surface-1)',
                          boxShadow: `0 ${offset.toFixed(1)}px ${blur.toFixed(1)}px rgba(0,0,0,${opacity})`,
                        }}
                      />
                      <p className="text-[9px] font-mono text-text-tertiary mt-1">Level {i + 1}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review button */}
      <div className="pt-2">
        <button
          onClick={onReview}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover"
        >
          Review &amp; Import
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Step 4: Review & Import
// ============================================================================

function StepImport({
  analysis,
  clusterNames,
  onImport,
}: {
  analysis: AnalysisResult;
  clusterNames: ClusterNames;
  onImport: (categories: Set<string>) => void;
}) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['color', 'typography', 'spacing', 'shadow']),
  );
  const [imported, setImported] = useState(false);

  const { colorClusters, typography, spacing, shadows } = analysis;

  const colorConfig = useMemo(() => {
    const renamedClusters = colorClusters.map((c, idx) => ({
      ...c,
      name: clusterNames[idx] ?? c.name,
    }));
    return toColorLabConfig(renamedClusters);
  }, [colorClusters, clusterNames]);

  const typographyConfig = useMemo(() => toTypographyLabConfig(typography), [typography]);
  const spacingConfig = useMemo(() => toSpacingLabConfig(spacing), [spacing]);
  const shadowConfig = useMemo(() => toShadowLabConfig(shadows), [shadows]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleImport = () => {
    onImport(selectedCategories);
    setImported(true);
  };

  const categories = [
    {
      id: 'color',
      label: 'Color Lab',
      toolId: 'color-lab',
      available: colorClusters.length > 0,
      config: colorConfig,
      summary: `${colorConfig.palettes.length} palettes with ${colorConfig.palettes.reduce((s, p) => s + p.steps, 0)} total colors`,
    },
    {
      id: 'typography',
      label: 'Typography Lab',
      toolId: 'typography-lab',
      available: typography.detectedSizes.length > 0,
      config: typographyConfig,
      summary: `Base ${typographyConfig.baseFontSize}px, ratio ${typographyConfig.ratio}, ${typographyConfig.stepsAbove + typographyConfig.stepsBelow + 1} steps`,
    },
    {
      id: 'spacing',
      label: 'Spacing Lab',
      toolId: 'spacing-lab',
      available: spacing.detectedValues.length > 0,
      config: spacingConfig,
      summary: `${spacingConfig.progression} progression, base ${spacingConfig.baseUnit}px, ${spacingConfig.steps} steps`,
    },
    {
      id: 'shadow',
      label: 'Shadow Lab',
      toolId: 'shadow-lab',
      available: shadows.elevationSteps > 0 && shadows.fitQuality > 0,
      config: shadowConfig,
      summary: `${shadowConfig.elevationSteps} elevation levels, blur ratio ${shadowConfig.blurRatio}`,
    },
  ];

  if (imported) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'color-mix(in oklch, var(--color-success) 15%, transparent)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Import Complete
        </h2>
        <p className="text-sm text-text-secondary mb-1 max-w-md">
          Generator configurations have been imported into the workbench.
        </p>
        <p className="text-xs text-text-tertiary max-w-md">
          Navigate to the individual lab tools (Color Lab, Typography Lab, Spacing Lab, Shadow Lab) to see
          and fine-tune the reverse-engineered configurations. Each tool will now use the imported parameters
          as its starting point.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {Array.from(selectedCategories).map((cat) => {
            const info = categories.find((c) => c.id === cat);
            if (!info) return null;
            return (
              <span
                key={cat}
                className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/30"
              >
                {info.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-text-secondary mb-6">
        Review the generated configurations below, then select which categories to import into the workbench.
      </p>

      <div className="space-y-4">
        {categories.map((cat) => {
          const isSelected = selectedCategories.has(cat.id);
          const isDisabled = !cat.available;

          return (
            <div
              key={cat.id}
              className={`rounded-lg border transition-colors ${
                isDisabled
                  ? 'bg-surface-2/50 border-border-subtle opacity-60'
                  : isSelected
                    ? 'bg-surface-2 border-accent/30'
                    : 'bg-surface-2 border-border-subtle'
              }`}
            >
              {/* Header with checkbox */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => !isDisabled && toggleCategory(cat.id)}
                  disabled={isDisabled}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isDisabled
                      ? 'bg-surface-3 border-border cursor-not-allowed'
                      : isSelected
                        ? 'bg-accent border-accent'
                        : 'bg-surface-1 border-border hover:border-text-tertiary'
                  }`}
                >
                  {isSelected && !isDisabled && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-text-primary">{cat.label}</h4>
                    {isDisabled && (
                      <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 rounded bg-surface-3">
                        No data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{cat.summary}</p>
                </div>
              </div>

              {/* Config details (expanded) */}
              {isSelected && !isDisabled && (
                <div className="px-4 pb-3 border-t border-border-subtle">
                  <div className="mt-3">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                      Configuration for <span className="font-mono text-text-secondary">{cat.toolId}</span>
                    </p>
                    <div className="bg-surface-1 rounded-md border border-border-subtle p-3 overflow-auto max-h-48">
                      <pre className="text-[10px] font-mono text-text-secondary whitespace-pre leading-relaxed">
                        {JSON.stringify(cat.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Import button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={selectedCategories.size === 0}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import {selectedCategories.size} {selectedCategories.size === 1 ? 'Category' : 'Categories'} to Workbench
        </button>
        <p className="text-xs text-text-tertiary">
          This will update the generator configurations in the token store.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Wizard
// ============================================================================

export default function ReverseMapTool() {
  const [step, setStep] = useState<WizardStep>(1);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [clusterNames, setClusterNames] = useState<ClusterNames>({});

  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);

  // Step 1 -> 2: Extract
  const handleExtract = useCallback((result: ExtractionResult) => {
    setExtraction(result);
    setStep(2);
  }, []);

  // Step 2 -> 3: Analyze
  const handleAnalyze = useCallback(() => {
    if (!extraction) return;
    const colorClusters = clusterColors(extraction.colors);
    const typography = detectTypography(extraction.fontSizes, extraction.fontFamilies);
    const spacingResult = detectSpacing(extraction.spacings);
    const shadowResult = analyzeShadows(extraction.shadows);

    setAnalysis({
      colorClusters,
      typography,
      spacing: spacingResult,
      shadows: shadowResult,
    });

    // Initialize cluster names from detected names
    const names: ClusterNames = {};
    colorClusters.forEach((c, i) => {
      names[i] = c.name;
    });
    setClusterNames(names);
    setStep(3);
  }, [extraction]);

  // Step 3 -> 4: Review
  const handleReview = useCallback(() => {
    setStep(4);
  }, []);

  // Step 4: Import
  const handleImport = useCallback(
    (categories: Set<string>) => {
      if (!analysis) return;

      const renamedClusters = analysis.colorClusters.map((c, idx) => ({
        ...c,
        name: clusterNames[idx] ?? c.name,
      }));

      if (categories.has('color') && analysis.colorClusters.length > 0) {
        setGeneratorConfig('color-lab', toColorLabConfig(renamedClusters));
      }
      if (categories.has('typography') && analysis.typography.detectedSizes.length > 0) {
        setGeneratorConfig('typography-lab', toTypographyLabConfig(analysis.typography));
      }
      if (categories.has('spacing') && analysis.spacing.detectedValues.length > 0) {
        setGeneratorConfig('spacing-lab', toSpacingLabConfig(analysis.spacing));
      }
      if (categories.has('shadow') && analysis.shadows.elevationSteps > 0 && analysis.shadows.fitQuality > 0) {
        setGeneratorConfig('shadow-lab', toShadowLabConfig(analysis.shadows));
      }
    },
    [analysis, clusterNames, setGeneratorConfig],
  );

  // Cluster name change
  const handleClusterNameChange = useCallback((idx: number, name: string) => {
    setClusterNames((prev) => ({ ...prev, [idx]: name }));
  }, []);

  // Step navigation
  const handleStepClick = useCallback(
    (targetStep: WizardStep) => {
      if (targetStep < step) {
        setStep(targetStep);
      }
    },
    [step],
  );

  // Back button
  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as WizardStep);
    }
  }, [step]);

  return (
    <ToolLayout
      title="Reverse Map"
      description="Extract design tokens from CSS, HTML, or bookmarklet data and map them into workbench configurations"
    >
      <div className="h-full overflow-y-auto">
        <div className="p-6 max-w-5xl">
          <StepIndicator currentStep={step} onStepClick={handleStepClick} />

          {/* Back button (steps 2-4) */}
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-4"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to {STEP_LABELS[(step - 1) as WizardStep]}
            </button>
          )}

          {/* Step content */}
          {step === 1 && <StepInput onExtract={handleExtract} />}

          {step === 2 && extraction && (
            <StepExtraction result={extraction} onAnalyze={handleAnalyze} />
          )}

          {step === 3 && extraction && analysis && (
            <StepAnalysis
              extraction={extraction}
              analysis={analysis}
              clusterNames={clusterNames}
              onClusterNameChange={handleClusterNameChange}
              onReview={handleReview}
            />
          )}

          {step === 4 && analysis && (
            <StepImport
              analysis={analysis}
              clusterNames={clusterNames}
              onImport={handleImport}
            />
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
