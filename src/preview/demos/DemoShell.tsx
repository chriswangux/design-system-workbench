import { Routes, Route, Navigate } from 'react-router';
import { lazy, Suspense, useEffect } from 'react';
import { useTokenReceiver } from '@/preview/bridge/useTokenReceiver';
import { ReplayProvider } from './shared/motion';

const SaaSLanding = lazy(() => import('./saas-landing'));
const Dashboard = lazy(() => import('./dashboard'));
const Blog = lazy(() => import('./blog'));

/**
 * CSS reset that ALSO neutralizes the workbench's dark theme.
 * The demos share the same index.css (Tailwind + dark theme variables),
 * so we must explicitly override html/body to a clean light baseline.
 * Uses !important to beat any specificity from the workbench CSS.
 */
const DEMO_RESET = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    background-color: var(--sem-background, #ffffff) !important;
    color: var(--sem-foreground, #111827) !important;
    font-family: var(--sem-font-body, Inter, system-ui, sans-serif) !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    min-height: 100vh;
    overflow: visible !important;
  }
  /* Kill all workbench dark theme classes */
  .theme-light, .theme-dark { all: unset; }
  img, picture, video, canvas, svg { display: block; max-width: 100%; }
  input, button, textarea, select { font: inherit; }
  a { color: inherit; }
  h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
  /* Override any Tailwind base colors leaking in */
  ::selection { background-color: var(--sem-primary, #3b82f6); color: white; }
`;

function DemoLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#888',
      backgroundColor: '#ffffff',
    }}>
      Loading preview...
    </div>
  );
}

/**
 * Standalone demo shell -- renders without workbench chrome.
 * Receives token CSS + replay events via BroadcastChannel, postMessage, or localStorage.
 */
export default function DemoShell() {
  // Inject token CSS into <head>, get replay counter
  const [, replayCounter] = useTokenReceiver();

  // Inject CSS reset (MUST come after token CSS to override workbench theme)
  useEffect(() => {
    const id = 'dsw-demo-reset';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = DEMO_RESET;

    // Neutralize the workbench's global styles
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.style.backgroundColor = 'var(--sem-background, #ffffff)';
    document.documentElement.style.color = 'var(--sem-foreground, #111827)';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root');
    if (root) root.style.height = 'auto';

    return () => {
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.color = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
      if (root) root.style.height = '';
    };
  }, []);

  return (
    <ReplayProvider replayKey={replayCounter}>
      <Suspense fallback={<DemoLoading />}>
        <Routes>
          <Route path="saas-landing" element={<SaaSLanding />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="blog" element={<Blog />} />
          <Route path="*" element={<Navigate to="saas-landing" replace />} />
        </Routes>
      </Suspense>
    </ReplayProvider>
  );
}
