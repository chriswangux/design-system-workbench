import type { ColorValue, PaletteConfig, DesignToken, TokenGroup } from '@/core/tokens/types';
import { createColor, gamutMap } from '@/core/engine/color/oklch';
import { createBezierEasing } from '@/core/engine/math/bezier';

export interface GeneratedPalette {
  name: string;
  steps: Array<{
    index: number;
    label: string;
    color: ColorValue;
    gamutMapped: ColorValue;
    inGamut: boolean;
  }>;
}

const STEP_LABELS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

function getStepLabels(count: number): string[] {
  if (count === 11) return STEP_LABELS;
  if (count <= 11) {
    // Pick evenly spaced labels from the standard set
    const indices = Array.from({ length: count }, (_, i) =>
      Math.round((i * 10) / (count - 1)),
    );
    return indices.map((idx) => STEP_LABELS[Math.min(idx, 10)]);
  }
  return Array.from({ length: count }, (_, i) => String(Math.round((i / (count - 1)) * 1000)));
}

export function generatePalette(config: PaletteConfig): GeneratedPalette {
  const hueCurve = createBezierEasing(config.hue.curve);
  const chromaCurve = createBezierEasing(config.chroma.curve);
  const lightnessCurve = createBezierEasing(config.lightness.curve);

  const labels = getStepLabels(config.steps);

  const steps = Array.from({ length: config.steps }, (_, i) => {
    const t = config.steps === 1 ? 0.5 : i / (config.steps - 1);

    const h = config.hue.start + (config.hue.end - config.hue.start) * hueCurve(t);
    const c = config.chroma.start + (config.chroma.end - config.chroma.start) * chromaCurve(t);
    const l = config.lightness.start + (config.lightness.end - config.lightness.start) * lightnessCurve(t);

    const color = createColor(l, c, h);

    // Check for lock points near this step
    if (config.lockPoints) {
      for (const lock of config.lockPoints) {
        if (lock.step === i) {
          return {
            index: i,
            label: labels[i],
            color: lock.color,
            gamutMapped: gamutMap(lock.color),
            inGamut: true,
          };
        }
      }
    }

    const mapped = gamutMap(color);
    const inGamut =
      Math.abs(color.channels[0] - mapped.channels[0]) < 0.001 &&
      Math.abs(color.channels[1] - mapped.channels[1]) < 0.001;

    return {
      index: i,
      label: labels[i],
      color,
      gamutMapped: mapped,
      inGamut,
    };
  });

  return { name: config.name, steps };
}

export function paletteToTokenGroup(palette: GeneratedPalette): TokenGroup {
  const group: TokenGroup = { $type: 'color' };
  for (const step of palette.steps) {
    const token: DesignToken = {
      $value: {
        colorSpace: 'oklch',
        channels: [...step.gamutMapped.channels],
        alpha: 1,
      } as ColorValue,
      $type: 'color',
      $extensions: {
        'com.dsw.generator': {
          toolId: 'color-lab',
          generatedAt: new Date().toISOString(),
          configHash: '',
        },
        'com.dsw.tier': 'primitive',
      },
    };
    group[step.label] = token;
  }
  return group;
}
