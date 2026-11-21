export type ContentMode = 'creator' | 'marketing';
export type QualityTier = 'hemat' | 'seimbang' | 'terbaik';
export type AspectRatio = '9:16' | '16:9';
export type VibeId = 'hangat' | 'mewah' | 'ceria' | 'sinematik' | 'minimalis' | 'retro';
export type MusicChoice = 'santai' | 'upbeat' | 'akustik' | 'none';
export type CastChoice = 'product' | 'person';
export type VoiceChoice = 'none' | 'dialog' | 'narasi';
export type DurationChoice = 15 | 20 | 30;

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
}

export interface Bible {
  contentMode: ContentMode;
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
