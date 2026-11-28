export type ContentMode = 'creator' | 'marketing';
export type SellingStyle = 'soft' | 'hard';
export type QualityTier = 'hemat' | 'seimbang' | 'terbaik';
export type AspectRatio = '9:16' | '16:9';
export type VibeId = 'hangat' | 'mewah' | 'ceria' | 'sinematik' | 'minimalis' | 'retro';
export type MusicChoice = 'santai' | 'upbeat' | 'akustik' | 'none';
export type CastChoice = 'product' | 'person';
export type VoiceChoice = 'none' | 'dialog' | 'narasi';
export type DurationChoice = 15 | 20 | 30 | 60;
/** 'single' = video sekali jadi, 'series' = video berseri yang bisa dilanjut per episode. */
export type SeriesMode = 'single' | 'series';

/** Ringkasan satu episode yang sudah dibuat, dipakai sebagai "story so far" episode berikutnya. */
export interface EpisodeRecap {
  number: number;
  title: string;
  /** Kejadian utama episode itu menurut pengguna (boleh kosong). */
  goalId?: string;
  /** Ringkasan isi episode dalam Bahasa Indonesia (1-2 kalimat). */
  summaryId: string;
  /** Kejadian / kalimat penutup terakhir yang menggantung (cliffhanger). */
  cliffhangerId: string;
  /** Keadaan visual adegan terakhir (English), untuk menyambung adegan pembuka episode berikutnya. */
  endStateEn: string;
}

/** Kunci dunia cerita dari episode sebelumnya supaya karakter, latar & cahaya tidak berubah. */
export interface SeriesContinuity {
  characterName?: string;
  characterLock?: string;
  characterVoiceLock?: string;
  productLock: string;
  setting: string;
  lighting: string;
  palette: string;
  style: string;
}

export type VideoStyleId =
  | 'real-live'
  | 'real-ugc'
  | 'kartun-3d'
  | 'animasi-2d'
  | 'minecraft-voxel'
  | 'clay-stopmotion'
  | 'miniatur-diorama'
  | 'iklan-studio';

export type HookStrategyId =
  | 'visual-kejutan'
  | 'masalah-relatable'
  | 'transformasi-instan'
  | 'rahasia-pov'
  | 'skala-unik'
  | 'bukti-langsung';

export interface Answers {
  contentMode?: ContentMode;
  sellingStyle?: SellingStyle;
  product: string;
  category?: string;
  hasPhoto: boolean;
  productLockCustom?: string;
  advantages: string[];
  cta: string;
  story?: string;
  videoStyle?: VideoStyleId;
  hookStyle?: HookStrategyId;
  customHookLine?: string;
  vibe: VibeId;
  music: MusicChoice;
  cast: CastChoice;
  characterId?: string;
  characterCustom?: string;
  voice: VoiceChoice;
  durationS: DurationChoice;
  aspect: AspectRatio;
  quality: QualityTier;
  seamlessChain?: boolean;
  /** Bawaan 'single'. */
  seriesMode?: SeriesMode;
  /** Judul seri, mis. "Cerita Anak Kos". Bawaan: nama topik/produk. */
  seriesTitle?: string;
  /** Nomor episode yang sedang dibuat (mulai 1). */
  episodeNumber?: number;
  /** Apa yang terjadi di episode ini (opsional, dari pengguna). */
  episodeGoal?: string;
  /** Rekap episode sebelumnya, terbaru di akhir (maks 3 disimpan). */
  previousEpisodes?: EpisodeRecap[];
  /** Kunci dunia cerita dari episode 1; diisi otomatis saat membuat lanjutan. */
  continuity?: SeriesContinuity;
}

export interface EpisodeInfo {
  seriesTitle: string;
  number: number;
  /** Rekap singkat "sebelumnya" yang dibacakan di adegan 1 (kosong untuk episode 1). */
  previouslyId: string;
  /** Cliffhanger penutup episode ini. */
  cliffhangerId: string;
  /** Ringkasan episode ini untuk dipakai episode berikutnya. */
  summaryId: string;
  endStateEn: string;
}

export interface Bible {
  contentMode: ContentMode;
  sellingStyle?: SellingStyle;
  product: string;
  productLock: string;
  characterName?: string;
  characterLock?: string;
  characterVoiceLock?: string;
  videoStyleName: string;
  videoStyleLock: string;
  hookStrategyName: string;
  styleName: string;
  style: string;
  lighting: string;
  palette: string;
  setting: string;
  music: string;
  source: 'offline' | 'llm';
  /** Arahan realisme tambahan (mis. UGC kamera HP), disisipkan di setiap prompt adegan. */
  realismLock?: string;
  /** Cara bicara yang natural untuk realisme (mis. UGC). */
  speechRealism?: string;
  /** Larangan tambahan khusus style (mis. kulit plastik, CGI). */
  negativeExtra?: string;
  /** Kunci kesinambungan seri (episode ke-N dari judul seri). */
  seriesLock?: string;
}

export interface Asset {
  id: 'product' | 'character';
  name: string;
  purpose: string;
  prompt: string;
  upload: boolean;
}

export interface Scene {
  id: string;
  idx: number;
  role: string;
  label: string;
  art: string;
  description: string;
  actionEn: string;
  prompt: string;
  dialogue?: string;
  shot: string;
  camera: string;
  cameraId: string;
  durationS: number;
  mode: 'ingredients' | 'frames';
  chainFromPrev: boolean;
  assets: string[];
  credits: number;
  tips: string[];
  sfx: string;
}

export interface PackSettings {
  aspect: AspectRatio;
  model: string;
  modelNote: string;
  imageModel: string;
  creditsScene: number;
  creditsTotal: number;
  durationS: number;
  clipSeconds: number;
}

export interface FlowButtonBadge {
  label: string;
  kind?: 'button' | 'radio' | 'menu' | 'tab';
}

export interface GuideStep {
  id: string;
  phase: 'persiapan' | 'aset' | 'scene' | 'rakit';
  sceneIdx?: number;
  title: string;
  instruction: string;
  substeps: string[];
  buttons: FlowButtonBadge[];
  prompt?: string;
  promptLabel?: string;
  credits: number;
  tips: string[];
}

export interface Pack {
  title: string;
  summary: string;
  bible: Bible;
  settings: PackSettings;
  assets: Asset[];
  scenes: Scene[];
  cta: string;
  caption: string;
  hashtags: string[];
  steps: GuideStep[];
  guideUpdatedAt: string;
  /** Ada hanya untuk video berseri. */
  episode?: EpisodeInfo;
}

export interface TemplateRole {
  role: string;
  label: string;
  art: string;
  descId: string;
  action: string;
  shot: string;
  camera: string;
  cameraId: string;
  dialogue?: string;
  sfx: string;
}

export interface TemplatePlan {
  roles: string[];
  durations: number[];
}

export interface Template {
  id: string;
  mode: ContentMode;
  sellingStyle?: SellingStyle;
  name: string;
  description: string;
  category: string;
  badge?: string;
  available: boolean;
  art: string;
  cast: CastChoice;
  roles: TemplateRole[];
  plans: Record<string, TemplatePlan>;
}

export type ProjectStatus = 'draf' | 'panduan' | 'selesai';

export interface Project {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  art: string;
  status: ProjectStatus;
  answers: Answers;
  pack: Pack | null;
  completedStepIds: string[];
  createdAt: string;
  updatedAt: string;
  /** Semua episode dalam satu seri berbagi seriesId yang sama. */
  seriesId?: string;
  episodeNumber?: number;
}

export interface LibraryItem {
  id: string;
  kind: 'product' | 'character';
  name: string;
  subtitle: string;
  lockText: string;
  advantages?: string[];
  hasPhoto?: boolean;
  art: string;
  createdAt: string;
}

export interface BrandPreset {
  brandName: string;
  defaultContentMode?: ContentMode;
  defaultVideoStyle?: VideoStyleId;
  defaultHookStyle?: HookStrategyId;
  defaultVibe: VibeId;
  defaultMusic: MusicChoice;
  defaultCta: string;
  defaultAspect: AspectRatio;
  defaultQuality: QualityTier;
  defaultSeamlessChain: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  useLlmWhenAvailable: boolean;
  onboardingDismissed: boolean;
  flowLanguageHint: boolean;
}

export interface BatchRow {
  id: string;
  product: string;
  advantages: string;
  cta: string;
  story: string;
  hasPhoto: boolean;
}
