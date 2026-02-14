import { useRef, useState, useCallback } from 'react';
import { ToolLayout } from '@/components/shell/ToolLayout';
import { useTokenBridge } from '@/preview/bridge/useTokenBridge';
import { useTokenCSS } from '@/preview/bridge/useTokenCSS';
import { Monitor, Tablet, Smartphone, Maximize2, ExternalLink } from 'lucide-react';

interface ViewportPreset {
  label: string;
  width: number | 'full';
  icon: typeof Monitor;
}

const VIEWPORT_PRESETS: ViewportPreset[] = [
  { label: 'Desktop', width: 1280, icon: Monitor },
  { label: 'Tablet', width: 768, icon: Tablet },
  { label: 'Mobile', width: 375, icon: Smartphone },
  { label: 'Full Width', width: 'full', icon: Maximize2 },
];

interface PreviewToolProps {
  demoPath: string;
  title: string;
  description: string;
}

export default function PreviewTool({ demoPath, title, description }: PreviewToolProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<number | 'full'>('full');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const css = useTokenCSS();

  // Bridge tokens to iframe
  useTokenBridge(iframeRef);

  // Re-inject CSS when iframe loads
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    // Inject CSS immediately on load
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      let styleEl = doc.getElementById('dsw-tokens') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = 'dsw-tokens';
        doc.head.appendChild(styleEl);
      }
      styleEl.textContent = css;
    }
  }, [css]);

  // Build the iframe src URL (same origin, different hash route)
  const base = window.location.pathname + window.location.search;
  const iframeSrc = `${base}#/demo/${demoPath}`;

  const openInNewTab = () => {
    window.open(`${base}#/demo/${demoPath}`, '_blank');
  };

  return (
    <ToolLayout
      title={title}
      description={description}
      actions={
        <button
          onClick={openInNewTab}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
        >
          <ExternalLink size={13} />
          Open in new tab
        </button>
      }
    >
      <div className="flex h-full overflow-hidden">
        {/* Controls panel */}
        <div className="w-[200px] border-r border-border-subtle shrink-0 overflow-y-auto">
          <div className="px-3 py-3 border-b border-border-subtle">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Viewport
            </h3>
            <div className="space-y-1">
              {VIEWPORT_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isActive = viewport === preset.width;
                return (
                  <button
                    key={preset.label}
                    onClick={() => setViewport(preset.width)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{preset.label}</span>
                    {preset.width !== 'full' && (
                      <span className="ml-auto text-text-tertiary text-[10px]">
                        {preset.width}px
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Status
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className={`w-1.5 h-1.5 rounded-full ${css ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-text-tertiary">
                  {css ? 'Tokens connected' : 'No tokens yet'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className={`w-1.5 h-1.5 rounded-full ${iframeLoaded ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-text-tertiary">
                  {iframeLoaded ? 'Preview loaded' : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Iframe container */}
        <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-start justify-center p-4">
          <div
            className="bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
            style={{
              width: viewport === 'full' ? '100%' : `${viewport}px`,
              maxWidth: '100%',
              height: viewport === 'full' ? '100%' : 'calc(100% - 2rem)',
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              title={`${title} Preview`}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
