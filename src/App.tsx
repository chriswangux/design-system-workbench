import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { allRoutes, LazyTool } from '@/router/routes';
import { useUndoRedoKeyboard } from '@/core/hooks/useUndoRedo';

function AppShell() {
  useUndoRedoKeyboard();

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

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppShell />
    </BrowserRouter>
  );
}
