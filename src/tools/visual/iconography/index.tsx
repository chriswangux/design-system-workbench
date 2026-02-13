import { useState, useEffect, useMemo } from 'react';
import { ToolLayout, SplitPanel, ParameterSection } from '@/components/shell';
import { SliderWithInput } from '@/components/controls';
import { useTokenStore } from '@/core/store/tokenStore';

type KeyShape = 'circle' | 'square' | 'landscape' | 'portrait';

interface IconographyConfig {
  gridSize: number;
  strokeWeight: number;
  cornerRadius: number;
  opticalPadding: number;
  keyShape: KeyShape;
}

const DEFAULT_CONFIG: IconographyConfig = {
  gridSize: 24,
  strokeWeight: 1.5,
  cornerRadius: 2,
  opticalPadding: 2,
  keyShape: 'square',
};

const KEY_SHAPES: KeyShape[] = ['circle', 'square', 'landscape', 'portrait'];

const PREVIEW_GRID_SIZES = [16, 20, 24, 32, 48];

// Simple SVG icon paths rendered relative to a 24x24 viewBox
const SAMPLE_ICONS: Array<{ name: string; path: string }> = [
  { name: 'Arrow', path: 'M5 12h14m-7-7 7 7-7 7' },
  { name: 'Check', path: 'M5 13l4 4L19 7' },
  { name: 'Close', path: 'M6 6l12 12M18 6 6 18' },
  { name: 'Search', path: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm6.5 13.5L21 21' },
  { name: 'Heart', path: 'M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 9 0 4.5 4.5 0 0 1 9 0c0 5.5-8 11-8 11z' },
];

function getKeyShapeRect(gridSize: number, padding: number, shape: KeyShape) {
  const area = gridSize - padding * 2;
  switch (shape) {
    case 'circle':
      return { x: padding, y: padding, w: area, h: area, rx: area / 2 };
    case 'square':
      return { x: padding, y: padding, w: area, h: area, rx: 0 };
    case 'landscape': {
      const h = area * 0.75;
      const yOff = padding + (area - h) / 2;
      return { x: padding, y: yOff, w: area, h, rx: 0 };
    }
    case 'portrait': {
      const w = area * 0.75;
      const xOff = padding + (area - w) / 2;
      return { x: xOff, y: padding, w, h: area, rx: 0 };
    }
  }
}

function IconGridSVG({
  size,
  config,
  showIcon,
}: {
  size: number;
  config: IconographyConfig;
  showIcon?: { name: string; path: string };
}) {
  const scale = size / 24;
  const pad = config.opticalPadding * (size / config.gridSize);
  const shape = getKeyShapeRect(size, pad, config.keyShape);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid background */}
      <rect
        width={size}
        height={size}
        fill="var(--color-surface-2)"
        stroke="var(--color-border-subtle)"
        strokeWidth={0.5}
      />
      {/* Grid lines */}
      <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="var(--color-border)" strokeWidth={0.25} strokeDasharray="2 2" />
      <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="var(--color-border)" strokeWidth={0.25} strokeDasharray="2 2" />
      {/* Safe zone / optical padding */}
      <rect
        x={pad}
        y={pad}
        width={size - pad * 2}
        height={size - pad * 2}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={0.5}
        strokeDasharray="2 1"
        opacity={0.5}
      />
      {/* Key shape overlay */}
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={shape.rx}
        fill="var(--color-accent)"
        opacity={0.08}
        stroke="var(--color-accent)"
        strokeWidth={0.5}
        strokeDasharray="3 1.5"
      />
      {/* Sample icon */}
      {showIcon && (
        <g transform={`scale(${scale})`}>
          <path
            d={showIcon.path}
            fill="none"
            stroke="var(--color-text-primary)"
            strokeWidth={config.strokeWeight}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

export default function IconographyTool() {
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const setGeneratorConfig = useTokenStore((s) => s.setGeneratorConfig);
  const storedConfig = useTokenStore((s) => s.generatorConfigs['iconography']) as IconographyConfig | undefined;

  const [config, setConfig] = useState<IconographyConfig>(storedConfig ?? DEFAULT_CONFIG);

  useEffect(() => {
    const tokens = {
      $description: 'Icon system tokens',
      gridSize: {
        $value: { value: config.gridSize, unit: 'px' as const },
        $type: 'dimension' as const,
        $description: 'Base icon grid size',
      },
      strokeWeight: {
        $value: { value: config.strokeWeight, unit: 'px' as const },
        $type: 'dimension' as const,
        $description: 'Default icon stroke weight',
      },
      cornerRadius: {
        $value: { value: config.cornerRadius, unit: 'px' as const },
        $type: 'dimension' as const,
        $description: 'Icon corner radius',
      },
      opticalPadding: {
        $value: { value: config.opticalPadding, unit: 'px' as const },
        $type: 'dimension' as const,
        $description: 'Icon safe zone padding',
      },
    };
    setTokenGroup(['icon'], tokens);
    setGeneratorConfig('iconography', config);
  }, [config, setTokenGroup, setGeneratorConfig]);

  const update = (updates: Partial<IconographyConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const guidelines = useMemo(() => {
    const dos: string[] = [];
    const donts: string[] = [];

    if (config.strokeWeight <= 1) {
      dos.push('Thin strokes work well at larger sizes (32px+)');
      donts.push('Avoid thin strokes at small sizes - they may not render clearly');
    } else if (config.strokeWeight >= 2.5) {
      dos.push('Bold strokes ensure visibility at small sizes');
      donts.push('Bold strokes can feel heavy at larger sizes - consider reducing weight');
    } else {
      dos.push('This stroke weight provides good balance across sizes');
    }

    if (config.opticalPadding >= 2) {
      dos.push('Adequate padding prevents icons from feeling cramped');
    } else {
      donts.push('Very low padding can make icons touch the grid boundary');
    }

    if (config.cornerRadius > 0) {
      dos.push('Rounded corners add a friendly, approachable feel');
      if (config.cornerRadius > 4) {
        donts.push('Excessive rounding can make shapes ambiguous');
      }
    }

    dos.push('Align strokes to the pixel grid when possible');
    dos.push('Use the key shape as a guide for optical sizing');
    donts.push('Don\'t mix stroke and fill styles within one icon set');
    donts.push('Don\'t extend artwork beyond the safe zone');

    return { dos, donts };
  }, [config.strokeWeight, config.opticalPadding, config.cornerRadius]);

  const cssOutput = useMemo(() => {
    return [
      `--icon-grid-size: ${config.gridSize}px;`,
      `--icon-stroke-weight: ${config.strokeWeight}px;`,
      `--icon-corner-radius: ${config.cornerRadius}px;`,
      `--icon-optical-padding: ${config.opticalPadding}px;`,
    ].join('\n');
  }, [config]);

  return (
    <ToolLayout
      title="Iconography Guidelines"
      description="Icon grid, stroke weight, and key shape guidelines"
    >
      <SplitPanel
        leftWidth="340px"
        left={
          <div>
            <ParameterSection title="Grid">
              <SliderWithInput
                label="Grid Size"
                value={config.gridSize}
                onChange={(v) => update({ gridSize: v })}
                min={16}
                max={64}
                step={4}
                unit="px"
              />
              <SliderWithInput
                label="Optical Padding"
                value={config.opticalPadding}
                onChange={(v) => update({ opticalPadding: v })}
                min={0}
                max={6}
                step={0.5}
                unit="px"
                description="Safe area inside the grid boundary"
              />
            </ParameterSection>

            <ParameterSection title="Stroke">
              <SliderWithInput
                label="Stroke Weight"
                value={config.strokeWeight}
                onChange={(v) => update({ strokeWeight: v })}
                min={0.5}
                max={4}
                step={0.25}
                unit="px"
              />
              <SliderWithInput
                label="Corner Radius"
                value={config.cornerRadius}
                onChange={(v) => update({ cornerRadius: v })}
                min={0}
                max={8}
                step={0.5}
                unit="px"
              />
            </ParameterSection>

            <ParameterSection title="Key Shape">
              <div className="flex gap-1">
                {KEY_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    onClick={() => update({ keyShape: shape })}
                    className={`flex-1 px-2 py-1 text-xs rounded capitalize transition-colors ${
                      config.keyShape === shape
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">
                Defines the optical alignment region within the grid
              </p>
            </ParameterSection>
          </div>
        }
        right={
          <div className="p-6">
            {/* Multi-size grid comparison */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Grid Sizes
            </h3>
            <div className="flex gap-4 items-end flex-wrap mb-8">
              {PREVIEW_GRID_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <IconGridSVG size={size} config={config} />
                  <span className="text-[10px] text-text-tertiary font-mono">{size}px</span>
                </div>
              ))}
            </div>

            {/* Sample icons on grid */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Sample Icons at {config.gridSize}px
            </h3>
            <div className="flex gap-4 flex-wrap mb-8">
              {SAMPLE_ICONS.map((icon) => (
                <div key={icon.name} className="flex flex-col items-center gap-2">
                  <IconGridSVG size={config.gridSize} config={config} showIcon={icon} />
                  <span className="text-[10px] text-text-tertiary">{icon.name}</span>
                </div>
              ))}
            </div>

            {/* Sample icons at multiple sizes */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Size Scaling ({SAMPLE_ICONS[0].name})
            </h3>
            <div className="flex gap-4 items-end flex-wrap mb-8">
              {PREVIEW_GRID_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <IconGridSVG size={size} config={config} showIcon={SAMPLE_ICONS[0]} />
                  <span className="text-[10px] text-text-tertiary font-mono">{size}px</span>
                </div>
              ))}
            </div>

            {/* Guidelines */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Guidelines
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4">
                <div className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded-full bg-success/15 text-success text-[10px] flex items-center justify-center font-bold leading-none text-center">
                    &#10003;
                  </span>
                  Do
                </div>
                <ul className="space-y-1.5">
                  {guidelines.dos.map((item, i) => (
                    <li key={i} className="text-[11px] text-text-secondary leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface-2 rounded-lg border border-border-subtle p-4">
                <div className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded-full bg-error/15 text-error text-[10px] flex items-center justify-center font-bold leading-none text-center">
                    &#10005;
                  </span>
                  Don't
                </div>
                <ul className="space-y-1.5">
                  {guidelines.donts.map((item, i) => (
                    <li key={i} className="text-[11px] text-text-secondary leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Token output */}
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Generated CSS
            </h3>
            <div className="bg-surface-2 rounded-lg border border-border-subtle p-4 font-mono text-xs text-text-secondary overflow-x-auto">
              <pre>{cssOutput}</pre>
            </div>
          </div>
        }
      />
    </ToolLayout>
  );
}
