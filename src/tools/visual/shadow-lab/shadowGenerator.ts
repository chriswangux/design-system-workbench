import type { ShadowLabConfig, ShadowValue, ShadowLayer, ColorValue, DesignToken, TokenGroup } from '@/core/tokens/types';

export interface GeneratedShadow {
  name: string;
  elevation: number;
  layers: ShadowLayer[];
  cssValue: string;
}

function formatDim(v: number): string {
  return `${Math.round(v * 10) / 10}px`;
}

export function generateShadows(config: ShadowLabConfig): GeneratedShadow[] {
  const shadows: GeneratedShadow[] = [];
  const names = ['sm', 'md', 'lg', 'xl', '2xl'];

  for (let e = 0; e < config.elevationSteps; e++) {
    const step = e + 1;
    const name = names[e] ?? `${e + 1}`;

    // Directional shadow (from light source)
    const dirBlur = config.baseBlur * Math.pow(config.blurRatio, e);
    const dirOffsetX = config.lightSource.x * step * config.baseOffset * Math.pow(config.offsetRatio, e);
    const dirOffsetY = Math.abs(config.lightSource.y) * step * config.baseOffset * Math.pow(config.offsetRatio, e);
    const dirOpacity = config.directionalOpacity * (1 - e / (config.elevationSteps * 2.5));

    const dirColor: ColorValue = {
      colorSpace: 'oklch',
      channels: [...config.shadowColor.channels],
      alpha: Math.max(0.01, dirOpacity),
    };

    const directional: ShadowLayer = {
      color: dirColor,
      offsetX: { value: Math.round(dirOffsetX * 10) / 10, unit: 'px' },
      offsetY: { value: Math.round(dirOffsetY * 10) / 10, unit: 'px' },
      blur: { value: Math.round(dirBlur * 10) / 10, unit: 'px' },
      spread: { value: config.spreadBehavior === 'shrink' ? -Math.round(dirBlur * 0.2) : config.spreadBehavior === 'grow' ? Math.round(dirBlur * 0.1) : 0, unit: 'px' },
    };

    // Ambient shadow (soft, centered)
    const ambBlur = dirBlur * 2.5;
    const ambOpacity = config.ambientOpacity * (1 - e / (config.elevationSteps * 3));

    const ambColor: ColorValue = {
      colorSpace: 'oklch',
      channels: [...config.shadowColor.channels],
      alpha: Math.max(0.01, ambOpacity),
    };

    const ambient: ShadowLayer = {
      color: ambColor,
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: Math.round(dirBlur * 0.3 * 10) / 10, unit: 'px' },
      blur: { value: Math.round(ambBlur * 10) / 10, unit: 'px' },
      spread: { value: 0, unit: 'px' },
    };

    const layers = [directional, ambient];

    // Generate CSS string
    const cssValue = layers.map((l) => {
      const c = l.color as ColorValue;
      return `${formatDim(l.offsetX.value)} ${formatDim(l.offsetY.value)} ${formatDim(l.blur.value)} ${formatDim(l.spread.value)} rgba(0,0,0,${c.alpha.toFixed(2)})`;
    }).join(', ');

    shadows.push({ name, elevation: step, layers, cssValue });
  }

  return shadows;
}

export function shadowsToTokenGroup(shadows: GeneratedShadow[]): TokenGroup {
  const group: TokenGroup = { $type: 'shadow' };
  for (const shadow of shadows) {
    const token: DesignToken = {
      $value: shadow.layers as ShadowValue,
      $type: 'shadow',
      $extensions: {
        'com.dsw.generator': {
          toolId: 'shadow-lab',
          generatedAt: new Date().toISOString(),
          configHash: '',
        },
        'com.dsw.tier': 'primitive',
      },
    };
    group[shadow.name] = token;
  }
  return group;
}
