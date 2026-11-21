import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AppSettings,
  BrandPreset,
  LibraryItem,
  Project,
} from '@shared/types';
import { fetchServerHealth, type ServerHealth } from '@/lib/api';
import {
  createSampleProject,
  DEFAULT_BRAND,
  DEFAULT_LIBRARY,
  DEFAULT_SETTINGS,
  loadStoredState,
  saveStoredState,
  type StoredState,
} from '@/lib/storage';

export interface ToastMessage {
  id: string;
  title: string;
  tone?: 'success' | 'info' | 'danger';
}

interface AppContextValue {
  ready: boolean;
  projects: Project[];
  library: LibraryItem[];
  brand: BrandPreset;
  settings: AppSettings;
  health: ServerHealth;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, tone?: ToastMessage['tone']) => void;
  copyText: (text: string, label?: string) => Promise<boolean>;
  upsertProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  toggleProjectStep: (projectId: string, stepId: string) => void;
  seedSampleProject: () => Project;
  upsertLibraryItem: (item: LibraryItem) => void;
  deleteLibraryItem: (id: string) => void;
  updateBrand: (patch: Partial<BrandPreset>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  importFullState: (incoming: Partial<StoredState>) => void;
  resetAllData: () => void;
  refreshHealth: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>(DEFAULT_LIBRARY);
  const [brand, setBrand] = useState<BrandPreset>(DEFAULT_BRAND);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [health, setHealth] = useState<ServerHealth>({
    ok: true,
    version: '0.4.0',
    llmAvailable: false,
    provider: null,
    model: 'offline-local',
  });
  const [commandOpen, setCommandOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((title: string, tone: ToastMessage['tone'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const copyText = useCallback(
    async (text: string, label = 'Prompt tersalin') => {
      try {
        await navigator.clipboard.writeText(text);
        pushToast(label, 'success');
        return true;
      } catch {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        pushToast(label, 'success');
        return true;
      }
    },
    [pushToast]
  );

  const refreshHealth = useCallback(async () => {
    const h = await fetchServerHealth();
    setHealth(h);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadStoredState().then((st) => {
      if (!mounted) return;
      setProjects(st.projects);
      setLibrary(st.library);
      setBrand(st.brand);
      setSettings(st.settings);
      setReady(true);
    });
    refreshHealth();
    return () => {
      mounted = false;
    };
  }, [refreshHealth]);

  // Persist changes automatically
  useEffect(() => {
    if (!ready) return;
    saveStoredState({ projects, library, brand, settings });
  }, [ready, projects, library, brand, settings]);

  // Apply theme class (Light / Dark / System)
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);
    };
    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.theme]);

  // Global keyboard shortcuts: Ctrl/Cmd+K for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const upsertProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      if (exists) {
        return prev.map((p) => (p.id === project.id ? project : p));
      }
      return [project, ...prev];
    });
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      pushToast('Proyek dihapus', 'info');
    },
    [pushToast]
  );

  const duplicateProject = useCallback(
    (id: string): Project | null => {
      let created: Project | null = null;
      setProjects((prev) => {
        const src = prev.find((p) => p.id === id);
        if (!src) return prev;
        const now = new Date().toISOString();
        created = {
          ...structuredClone(src),
          id: `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${src.name} (Salinan)`,
          completedStepIds: [],
          status: src.pack ? 'panduan' : 'draf',
          createdAt: now,
          updatedAt: now,
        };
        return [created, ...prev];
      });
      if (created) pushToast('Proyek berhasil diduplikat', 'success');
      return created;
    },
    [pushToast]
  );

  const toggleProjectStep = useCallback((projectId: string, stepId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const set = new Set(p.completedStepIds);
        if (set.has(stepId)) set.delete(stepId);
        else set.add(stepId);
        const completedStepIds = Array.from(set);
        const totalSteps = p.pack?.steps.length ?? 0;
        let status = p.status;
        if (totalSteps > 0) {
          status = completedStepIds.length >= totalSteps ? 'selesai' : 'panduan';
        }
        return {
          ...p,
          completedStepIds,
          status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const seedSampleProject = useCallback((): Project => {
    const sample = createSampleProject();
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== sample.id);
      return [sample, ...filtered];
    });
    pushToast('Contoh proyek siap dibuka', 'success');
    return sample;
  }, [pushToast]);

  const upsertLibraryItem = useCallback(
    (item: LibraryItem) => {
      setLibrary((prev) => {
        const exists = prev.some((x) => x.id === item.id);
        if (exists) return prev.map((x) => (x.id === item.id ? item : x));
        return [item, ...prev];
      });
      pushToast('Tersimpan di Pustaka', 'success');
    },
    [pushToast]
  );

  const deleteLibraryItem = useCallback(
    (id: string) => {
      setLibrary((prev) => prev.filter((x) => x.id !== id));
      pushToast('Item dihapus dari Pustaka', 'info');
    },
    [pushToast]
  );

  const updateBrand = useCallback((patch: Partial<BrandPreset>) => {
    setBrand((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const importFullState = useCallback(
    (incoming: Partial<StoredState>) => {
      if (Array.isArray(incoming.projects)) setProjects(incoming.projects);
      if (Array.isArray(incoming.library)) setLibrary(incoming.library);
      if (incoming.brand) setBrand((prev) => ({ ...prev, ...incoming.brand }));
      if (incoming.settings) setSettings((prev) => ({ ...prev, ...incoming.settings }));
      pushToast('Data berhasil diimpor', 'success');
    },
    [pushToast]
  );

  const resetAllData = useCallback(() => {
    setProjects([]);
    setLibrary(DEFAULT_LIBRARY);
    setBrand(DEFAULT_BRAND);
    setSettings(DEFAULT_SETTINGS);
    pushToast('Seluruh data lokal dikembalikan ke awal', 'info');
  }, [pushToast]);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      projects,
      library,
      brand,
      settings,
      health,
      commandOpen,
      setCommandOpen,
      toasts,
      pushToast,
      copyText,
      upsertProject,
      deleteProject,
      duplicateProject,
      toggleProjectStep,
      seedSampleProject,
      upsertLibraryItem,
      deleteLibraryItem,
      updateBrand,
      updateSettings,
      importFullState,
      resetAllData,
      refreshHealth,
    }),
    [
      ready,
      projects,
      library,
      brand,
      settings,
      health,
      commandOpen,
      toasts,
      pushToast,
      copyText,
      upsertProject,
      deleteProject,
      duplicateProject,
      toggleProjectStep,
      seedSampleProject,
      upsertLibraryItem,
      deleteLibraryItem,
      updateBrand,
      updateSettings,
      importFullState,
      resetAllData,
      refreshHealth,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
