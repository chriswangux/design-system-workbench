import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';

const DefaultSite = lazy(() => import('./sites/default'));
const LinearSite = lazy(() => import('./sites/linear'));
const StripeSite = lazy(() => import('./sites/stripe'));
const WarmEarthSite = lazy(() => import('./sites/warm-earth'));
const NeonCyberSite = lazy(() => import('./sites/neon-cyber'));
const SoftPastelSite = lazy(() => import('./sites/soft-pastel'));
const CorporateSite = lazy(() => import('./sites/corporate'));
const EditorialSite = lazy(() => import('./sites/editorial'));
const FintechPremiumSite = lazy(() => import('./sites/fintech-premium'));

function Loading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', backgroundColor: '#0a0a0f', color: '#666',
      fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px',
    }}>
      Loading...
    </div>
  );
}

/**
 * Standalone shell for viewing style sites in a new tab.
 * Route: #/style-site/{siteId}
 */
export default function StyleSiteShell() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="default" element={<DefaultSite />} />
        <Route path="linear" element={<LinearSite />} />
        <Route path="stripe" element={<StripeSite />} />
        <Route path="warm-earth" element={<WarmEarthSite />} />
        <Route path="neon-cyber" element={<NeonCyberSite />} />
        <Route path="soft-pastel" element={<SoftPastelSite />} />
        <Route path="corporate" element={<CorporateSite />} />
        <Route path="editorial" element={<EditorialSite />} />
        <Route path="fintech-premium" element={<FintechPremiumSite />} />
        <Route path="*" element={
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', backgroundColor: '#0a0a0f', color: '#666',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px',
          }}>
            Style site not found
          </div>
        } />
      </Routes>
    </Suspense>
  );
}
