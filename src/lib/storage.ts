import { generateOfflinePack } from '@shared/director';
import { getTemplateById } from '@shared/templates';
import type {
  Answers,
  AppSettings,
  BrandPreset,
  LibraryItem,
  Project,
} from '@shared/types';

const DB_NAME = 'rangkai_local_db';
const DB_VERSION = 1;
const LS_FALLBACK_KEY = 'rangkai_state_v1';

export interface StoredState {
  projects: Project[];
  library: LibraryItem[];
  brand: BrandPreset;
  settings: AppSettings;
}

export const DEFAULT_BRAND: BrandPreset = {
  brandName: '',
  defaultVideoStyle: 'real-live',
  defaultHookStyle: 'visual-kejutan',
  defaultVibe: 'minimalis',
  defaultMusic: 'santai',
  defaultCta: 'Cek info lengkapnya di link bio',
  defaultAspect: '9:16',
  defaultQuality: 'seimbang',
  defaultSeamlessChain: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  useLlmWhenAvailable: true,
  onboardingDismissed: false,
  flowLanguageHint: true,
};

export const DEFAULT_LIBRARY: LibraryItem[] = [
  {
    id: 'lib-prod-toolkit',
    kind: 'product',
    name: 'Workspace AI Toolkit Pro',
    subtitle: 'Dashboard aplikasi modern minimalis di layar laptop tipis, antarmuka bersih hijau neon & hitam',
    lockText:
      'a sleek modern silver ultrabook laptop displaying a clean minimalist productivity dashboard interface with crisp lime-green and dark charcoal cards',
    advantages: ['Praktis & cepat', 'Mudah dipakai', 'Hemat waktu'],
    hasPhoto: false,
    art: 'produk',
    createdAt: '2026-11-21T03:00:00.000Z',
  },
  {
    id: 'lib-char-sinta',
    kind: 'character',
    name: 'Sinta (Host Kreator)',
    subtitle: 'Perempuan Indonesia 25 thn, rambut hitam sebahu, kemeja kasual krem rapi',
    lockText:
      'a friendly Indonesian woman in her mid-20s with warm skin, shoulder-length straight black hair, light natural makeup, wearing a neat cream casual overshirt',
    art: 'char-1',
    createdAt: '2026-11-21T03:00:00.000Z',
  },
];

export function createSampleProject(): Project {
  const tpl = getTemplateById('iklan-produk')!;
  const answers: Answers = {
    product: 'Workspace AI Toolkit Pro',
    hasPhoto: false,
    advantages: ['Praktis & cepat', 'Mudah dipakai', 'Hemat waktu'],
    cta: 'Coba sekarang, klik link di bio',
    story: 'Membantu pekerjaan harian selesai jauh lebih ringkas dan rapi.',
    videoStyle: 'kartun-3d',
    hookStyle: 'visual-kejutan',
    vibe: 'minimalis',
    music: 'upbeat',
    cast: 'product',
    voice: 'none',
    durationS: 20,
    aspect: '9:16',
    quality: 'seimbang',
    seamlessChain: false,
  };
  const pack = generateOfflinePack(tpl, answers);
  const now = new Date().toISOString();
  return {
    id: 'proj-sample-toolkit',
    name: 'Workspace AI Toolkit Pro',
    templateId: tpl.id,
    templateName: tpl.name,
    art: 'produk',
    status: 'panduan',
    answers,
    pack,
    completedStepIds: ['step-prep-project'],
    createdAt: now,
    updatedAt: now,
  };
}

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadStoredState(): Promise<StoredState> {
  const fallback: StoredState = {
    projects: [],
    library: DEFAULT_LIBRARY,
    brand: DEFAULT_BRAND,
    settings: DEFAULT_SETTINGS,
  };

  // Try localStorage first for instant sync check, then IDB
  let raw: Partial<StoredState> | null = null;
  const db = await openIdb();
  if (db) {
    raw = await new Promise<Partial<StoredState> | null>((resolve) => {
      try {
        const tx = db.transaction('kv', 'readonly');
        const req = tx.objectStore('kv').get('state');
        req.onsuccess = () => resolve((req.result as Partial<StoredState>) ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  if (!raw && typeof localStorage !== 'undefined') {
    try {
      const txt = localStorage.getItem(LS_FALLBACK_KEY);
      if (txt) raw = JSON.parse(txt) as Partial<StoredState>;
    } catch {
      raw = null;
    }
  }

  if (!raw) {
    return fallback;
  }

  const migratedLibrary = Array.isArray(raw.library)
    ? raw.library.map((item) => (item.id === 'lib-prod-kopi' ? DEFAULT_LIBRARY[0] : item))
    : DEFAULT_LIBRARY;

  const migratedBrand: BrandPreset = { ...DEFAULT_BRAND, ...(raw.brand ?? {}) };
  if (migratedBrand.defaultCta === 'Pesan sekarang, link di bio') {
    migratedBrand.defaultCta = DEFAULT_BRAND.defaultCta;
  }

  return {
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    library: migratedLibrary,
    brand: migratedBrand,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
  };
}

export async function saveStoredState(state: StoredState): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota exceeded if IDB succeeds
    }
  }
  const db = await openIdb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(state, 'state');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}
