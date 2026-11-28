import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { WizardPage } from '@/pages/WizardPage';
import { PageFallback } from '@/components/ui/PageFallback';

const ProjectDetailPage = lazy(() =>
  import('@/pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const TemplatesPage = lazy(() =>
  import('@/pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage }))
);
const LibraryBrandPage = lazy(() =>
  import('@/pages/LibraryBrandPage').then((m) => ({ default: m.LibraryBrandPage }))
);
const BatchPage = lazy(() =>
  import('@/pages/BatchPage').then((m) => ({ default: m.BatchPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

function GlobalShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'n' && location.pathname !== '/buat') {
        e.preventDefault();
        navigate('/buat');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, location.pathname]);

  return null;
}

/** The tool itself. Loaded on demand so landing-page visitors don't download it. */
export default function AppRoutes() {
  return (
    <AppProvider>
      <GlobalShortcuts />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/buat" element={<WizardPage />} />
          <Route path="/proyek" element={<ProjectsPage />} />
          <Route path="/proyek/:id" element={<ProjectDetailPage />} />
          <Route path="/template" element={<TemplatesPage />} />
          <Route path="/pustaka" element={<LibraryBrandPage />} />
          <Route path="/massal" element={<BatchPage />} />
          <Route path="/pengaturan" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppProvider>
  );
}
