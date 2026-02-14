import { HashRouter, Routes, Route, Navigate } from 'react-router';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { allRoutes, LazyTool } from '@/router/routes';
import { useUndoRedoKeyboard } from '@/core/hooks/useUndoRedo';
import { useTokenStore } from '@/core/store/tokenStore';
import { generateFullCSS } from '@/preview/bridge/useTokenCSS';
import { broadcastTokenCSS } from '@/preview/bridge/TokenBroadcast';
import type { MotionConfig, SpacingLabConfig, ShadowLabConfig, CubicBezierValue, DesignToken, DimensionValue, TokenGroup } from '@/core/tokens/types';
import { DEFAULT_MOTION_CONFIG, DEFAULT_SPACING_LAB_CONFIG, DEFAULT_SHADOW_LAB_CONFIG } from '@/core/tokens/defaults';
import { springToLinear } from '@/core/engine/math/spring';
import { generateDurationScale, generateSpacingScale } from '@/core/engine/math/scales';
import { generateShadows, shadowsToTokenGroup } from '@/tools/visual/shadow-lab/shadowGenerator';

const DemoShell = lazy(() => import('@/preview/demos/DemoShell'));

/**
 * Generate motion tokens from a MotionConfig.
 * Extracted from the easing editor's logic so we can pre-generate on init.
 */
function generateMotionTokens(config: MotionConfig): TokenGroup {
  const easing: TokenGroup = { $type: 'cubicBezier' };
  for (const curve of config.easingCurves) {
    const value: CubicBezierValue | string = curve.type === 'bezier'
      ? curve.bezier ?? [0, 0, 1, 1]
      : springToLinear(curve.spring ?? { stiffness: 200, damping: 20, mass: 1 });
    const token: DesignToken = {
      $value: value,
      $type: 'cubicBezier',
      $extensions: {
        'com.dsw.generator': { toolId: 'motion', generatedAt: new Date().toISOString(), configHash: '' },
        'com.dsw.tier': 'primitive',
        ...(curve.type === 'spring' && curve.spring ? { 'com.dsw.spring': curve.spring } : {}),
      },
    };
    easing[curve.name.toLowerCase().replace(/\s+/g, '-')] = token;
  }

  const duration: TokenGroup = { $type: 'duration' };
  const durations = generateDurationScale(config.baseDuration, config.durationRatio, config.durationSteps);
  const durationNames = ['instant', 'fast', 'normal', 'slow', 'slower', 'slowest', 'glacial', 'eternal'];
  for (let i = 0; i < durations.length; i++) {
    const name = durationNames[i] ?? `${i + 1}`;
    const token: DesignToken = {
      $value: { value: durations[i], unit: 'ms' },
      $type: 'duration',
      $extensions: {
        'com.dsw.generator': { toolId: 'motion', generatedAt: new Date().toISOString(), configHash: '' },
        'com.dsw.tier': 'primitive',
      },
    };
    duration[name] = token;
  }

  return { easing, duration };
}

/**
 * Ensures motion tokens exist in the store.
 * If tokens.motion is missing, generates from default (or current) motion config.
 * Runs on mount and whenever tokens.motion becomes undefined (e.g., after reset).
 */
function useEnsureMotionTokens() {
  const motionTokens = useTokenStore((s) => s.tokens.motion);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const getGeneratorConfig = useTokenStore((s) => s.getGeneratorConfig);

  useEffect(() => {
    if (!motionTokens) {
      const config = getGeneratorConfig<MotionConfig>('motion') ?? DEFAULT_MOTION_CONFIG;
      const tokens = generateMotionTokens(config);
      setTokenGroup(['motion'], tokens);
    }
  }, [motionTokens, setTokenGroup, getGeneratorConfig]);
}

/**
 * Ensures spacing tokens exist in the store.
 */
function useEnsureSpacingTokens() {
  const spacingTokens = useTokenStore((s) => s.tokens.spacing);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const getGeneratorConfig = useTokenStore((s) => s.getGeneratorConfig);

  useEffect(() => {
    if (!spacingTokens) {
      const config = getGeneratorConfig<SpacingLabConfig>('spacing-lab') ?? DEFAULT_SPACING_LAB_CONFIG;
      const values = generateSpacingScale(config.baseUnit, config.progression, config.steps, config.ratio, config.customValues);
      const group: TokenGroup = { $type: 'spacing' };
      values.forEach((px, i) => {
        const rounded = Math.round(px * 100) / 100;
        const key = String((i + 1) * 100);
        const dimensionValue: DimensionValue = { value: rounded, unit: 'px' };
        const token: DesignToken = {
          $value: dimensionValue,
          $type: 'dimension',
          $extensions: {
            'com.dsw.generator': { toolId: 'spacing-lab', generatedAt: new Date().toISOString(), configHash: '' },
            'com.dsw.tier': 'primitive',
          },
        };
        group[key] = token;
      });
      setTokenGroup(['spacing'], group);
    }
  }, [spacingTokens, setTokenGroup, getGeneratorConfig]);
}

/**
 * Ensures shadow tokens exist in the store.
 */
function useEnsureShadowTokens() {
  const shadowTokens = useTokenStore((s) => s.tokens.shadow);
  const setTokenGroup = useTokenStore((s) => s.setTokenGroup);
  const getGeneratorConfig = useTokenStore((s) => s.getGeneratorConfig);

  useEffect(() => {
    if (!shadowTokens) {
      const config = getGeneratorConfig<ShadowLabConfig>('shadow-lab') ?? DEFAULT_SHADOW_LAB_CONFIG;
      const shadows = generateShadows(config);
      const group = shadowsToTokenGroup(shadows);
      setTokenGroup(['shadow'], group);
    }
  }, [shadowTokens, setTokenGroup, getGeneratorConfig]);
}

/**
 * Global token broadcaster -- runs in the workbench shell,
 * broadcasts token CSS to all open demo tabs via BroadcastChannel
 * whenever the token store changes.
 */
function useGlobalTokenBroadcast() {
  const tokens = useTokenStore((s) => s.tokens);
  const rafRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const css = generateFullCSS(tokens);
      if (css) {
        broadcastTokenCSS(css);
      }
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [tokens]);
}

function AppShell() {
  useUndoRedoKeyboard();
  useGlobalTokenBroadcast();
  useEnsureMotionTokens();
  useEnsureSpacingTokens();
  useEnsureShadowTokens();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            {allRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<LazyTool component={route.component} />}
              />
            ))}
            <Route path="*" element={<Navigate to="/visual/color-lab" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Standalone demo routes -- no workbench chrome */}
        <Route
          path="/demo/*"
          element={
            <Suspense fallback={<div />}>
              <DemoShell />
            </Suspense>
          }
        />
        {/* All other routes -- full workbench shell */}
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </HashRouter>
  );
}
