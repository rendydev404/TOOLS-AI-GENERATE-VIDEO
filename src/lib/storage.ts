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
  defaultVideoStyle: 'kartun-3d',
  defaultHookStyle: 'rahasia-pov',
  defaultVibe: 'minimalis',
  defaultMusic: 'santai',
  defaultCta: 'Menurut kamu gimana? Tulis di kolom komentar',
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
    id: 'lib-topic-fokus',
    kind: 'product',
    name: 'Kenapa Otak Cepat Lelah karena Notifikasi',
    subtitle: 'Topik edukasi & psikologi harian — meja kerja modern, layar HP menyala, suasana reflektif',
    lockText:
      'modern creator desk setup with a glowing smartphone notification screen, notebook, and clean ambient desk lamp illustrating digital distraction vs calm focus',
    advantages: ['Fakta jarang diketahui', 'Relatable sehari-hari', 'Penjelasan simpel'],
    hasPhoto: false,
    art: 'manfaat',
    createdAt: '2026-11-21T03:00:00.000Z',
  },
  {
    id: 'lib-char-sinta',
    kind: 'character',
    name: 'Sinta (Host Kreator)',
    subtitle: 'Perempuan Indonesia 25 thn, rambut hitam sebahu, sweter rajut krem rapi',
    lockText:
      'Sinta, a 25-year-old Indonesian woman, slender build, oval face, warm golden-tan complexion, expressive dark-brown almond eyes, sleek straight jet-black shoulder-length bob hair with a center part tucked behind her left ear, no glasses, wearing a solid cream crew-neck knit sweater over a crisp white shirt collar and dark charcoal trousers',
    art: 'char-1',
    createdAt: '2026-11-21T03:00:00.000Z',
  },
];

export function createSampleProject(): Project {
  const tpl = getTemplateById('storytelling-konten')!;
  const answers: Answers = {
    product: 'Kenapa Otak Cepat Lelah di Era Notifikasi',
    hasPhoto: false,
    advantages: ['Fakta jarang diketahui', 'Relatable sehari-hari', 'Solusi praktis'],
    cta: 'Menurut kamu gimana? Tulis di kolom komentar',
    story: 'Membahas efek berpindah-pindah aplikasi terhadap fokus harian dan cara mengatasinya dengan santai.',
    videoStyle: 'kartun-3d',
    hookStyle: 'rahasia-pov',
    vibe: 'minimalis',
    music: 'santai',
    cast: 'person',
    characterId: 'sinta',
    voice: 'dialog',
    durationS: 20,
    aspect: '9:16',
    quality: 'seimbang',
    seamlessChain: false,
  };
  const pack = generateOfflinePack(tpl, answers);
  const now = new Date().toISOString();
  return {
    id: 'proj-sample-creator',
    name: 'Kenapa Otak Cepat Lelah di Era Notifikasi',
    templateId: tpl.id,
    templateName: tpl.name,
    art: 'tpl-story',
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
    ? raw.library.map((item) =>
        item.id === 'lib-prod-kopi' || item.id === 'lib-prod-toolkit' ? DEFAULT_LIBRARY[0] : item
      )
    : DEFAULT_LIBRARY;

  const migratedBrand: BrandPreset = { ...DEFAULT_BRAND, ...(raw.brand ?? {}) };
  if (
    migratedBrand.defaultCta === 'Pesan sekarang, link di bio' ||
    migratedBrand.defaultCta === 'Cek info lengkapnya di link bio'
  ) {
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
