import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PageFallback } from '@/components/ui/PageFallback';
import { LandingPage } from '@/pages/LandingPage';
import { IS_MEMBER_EMBED } from '@/lib/paths';

const AppRoutes = lazy(() => import('@/AppRoutes'));

const ROUTER_BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '') || undefined;

export function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <Routes>
        {/* Members already own the tool, so the Member Area build opens straight into it. */}
        <Route
          path="/"
          element={IS_MEMBER_EMBED ? <Navigate to="/buat" replace /> : <LandingPage />}
        />
        <Route
          path="/*"
          element={
            <Suspense fallback={<PageFallback />}>
              <AppRoutes />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
