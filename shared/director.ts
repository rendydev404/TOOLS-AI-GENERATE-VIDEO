import flowGuideData from './flow-guide.json';
import { getPlanForDuration, getTemplateRole } from './templates';
import type {
  Answers,
  Asset,
  Bible,
  GuideStep,
  HookStrategyId,
  Pack,
  PackSettings,
  QualityTier,
  Scene,
  Template,
  VibeId,
  VideoStyleId,
} from './types';

// ---------- 1. Gaya Visual Video (Render & Medium Style) ----------
export interface VideoStylePreset {
  id: VideoStyleId;
  name: string;
  badge: string;
  shortDesc: string;
  mediumLock: string;
  assetStyleEn: string;
  characterAdapterEn: string;
}

export const VIDEO_STYLES: Record<VideoStyleId, VideoStylePreset> = {
  'real-live': {
    id: 'real-live',
    name: 'Orang & Objek Realistis',
    badge: 'Paling Laris',
    shortDesc: 'Tampilan nyata seperti rekaman kamera profesional asli.',
    mediumLock:
      'Photorealistic live-action footage shot on ARRI Alexa Mini LF with prime cinema lenses, authentic physical materials, true optical depth of field, natural motion blur, realistic skin pores and lighting physics',
    assetStyleEn:
      'photorealistic studio reference photography, shot on full-frame 85mm prime lens, true-to-life physical materials and textures',
    characterAdapterEn: 'photorealistic real human appearance, natural skin texture',
  },
  'real-ugc': {
    id: 'real-ugc',
    name: 'Rekaman HP Kreator (UGC)',
    badge: 'Natural',
    shortDesc: 'Gaya kamera HP jujur ala review TikTok & Reels sehari-hari.',
    mediumLock:
      'Authentic casual smartphone video recording aesthetic, iPhone front/rear camera natural lens look, genuine everyday indoor daylight, organic handheld micro-shake, raw believable social media creator realism',
    assetStyleEn:
      'clean natural smartphone reference photo in soft window daylight, authentic unretouched everyday realism',
    characterAdapterEn: 'natural everyday creator appearance captured on smartphone camera',
  },
  'kartun-3d': {
    id: 'kartun-3d',
    name: '3D Video Kartun',
    badge: 'Animasi 3D',
    shortDesc: 'Animasi 3D halus, ekspresif, dan cerah ala film animasi modern.',
    mediumLock:
      'High-end stylized 3D CGI feature animation in Pixar and DreamWorks aesthetic, appealing rounded proportions, soft subsurface scattering, tactile stylized 3D shaders, expressive squash-and-stretch smooth 3D keyframe animation',
    assetStyleEn:
      'stylized 3D CGI animated character/object reference render, Pixar-grade clean 3D modeling and soft studio shaders',
    characterAdapterEn: 'appealing stylized 3D animated cartoon character with expressive eyes',
  },
  'animasi-2d': {
    id: 'animasi-2d',
    name: '2D Video / Anime',
    badge: 'Ilustrasi 2D',
    shortDesc: 'Gambar animasi 2D garis tajam dan warna hidup ala anime.',
    mediumLock:
      'High-budget modern 2D cel-shaded anime animation, crisp hand-drawn keyframe linework, lush painted background art in Makoto Shinkai aesthetic, expressive 2D sakuga motion and cel highlights',
    assetStyleEn:
      'clean 2D anime cel-shaded model sheet illustration, crisp line art, vibrant flat-and-cel shading',
    characterAdapterEn: '2D anime illustrated character with clean cel-shaded linework',
  },
  'minecraft-voxel': {
    id: 'minecraft-voxel',
    name: 'Style Minecraft (Voxel)',
    badge: 'Unik & Viral',
    shortDesc: 'Dunia serba kotak 3D blok piksel ala game Minecraft.',
    mediumLock:
      'Authentic Minecraft-style 3D cubic voxel block world animation, everything built from crisp 3D pixel-art blocks and cubic geometry, blocky voxel props and characters, RTX voxel path-traced sunlight, crisp blocky particle physics',
    assetStyleEn:
      '3D cubic voxel block model in authentic Minecraft aesthetic, crisp 16x16 pixel-art block textures, isometric clean render',
    characterAdapterEn: 'blocky 3D Minecraft-style cubic voxel character avatar',
  },
  'clay-stopmotion': {
    id: 'clay-stopmotion',
    name: 'Stop-Motion Clay (Lilin)',
    badge: 'Kreatif',
    shortDesc: 'Tekstur kerajinan plastisin / tanah liat bergerak yang unik.',
    mediumLock:
      'Charming handcrafted claymation stop-motion video, sculpted matte plasticine clay surfaces with subtle artisan fingerprint textures, miniature tabletop studio lighting, tactile 12fps stop-motion animation feel',
    assetStyleEn:
      'handcrafted sculpted plasticine clay model reference photo on a clean miniature tabletop stage',
    characterAdapterEn: 'hand-sculpted cute claymation stop-motion figurine character',
  },
  'miniatur-diorama': {
    id: 'miniatur-diorama',
    name: 'Dunia Miniatur Mungil',
    badge: 'Bikin Melirik',
    shortDesc: 'Efek dunia serba kecil (diorama makro) yang memanjakan mata.',
    mediumLock:
      'Hyper-detailed tilt-shift macro miniature diorama world, tiny 1:87 scale artisan figures working around the hero object, ultra-shallow macro lens depth of field, crisp miniature craftsmanship',
    assetStyleEn:
      'macro tilt-shift miniature studio photography with ultra-shallow depth of field and crisp scale detail',
    characterAdapterEn: 'tiny detailed miniature diorama scale figure',
  },
  'iklan-studio': {
    id: 'iklan-studio',
    name: 'Iklan TV Sinematik',
    badge: 'Premium',
    shortDesc: 'Visual dramatis kelas iklan brand besar dengan gerak presisi.',
    mediumLock:
      'Flagship global brand TV commercial cinematography shot on Phantom Flex4K high-speed cinema camera, precision motorized motion-control rig, sculpted specular rim lighting, razor-sharp commercial clarity',
    assetStyleEn:
      'flagship commercial hero product studio photography, dramatic sculpted rim light, flawless optical sharpness',
    characterAdapterEn: 'polished commercial talent under cinematic studio lighting',
  },
};

// ---------- 2. Jurus Hook 3 Detik Pertama (Scroll-Stopper Architecture) ----------
export interface HookStrategyPreset {
  id: HookStrategyId;
  name: string;
  tag: string;
  shortDesc: string;
  whyItWorks: string;
  shotOverride: string;
  cameraOverride: string;
  cameraIdOverride: string;
  visualHookEn: string;
  descHookId: string;
  spokenHookId: string;
  sfxOverride: string;
}

export const HOOK_STRATEGIES: Record<HookStrategyId, HookStrategyPreset> = {
  'visual-kejutan': {
    id: 'visual-kejutan',
    name: 'Kejutan Detail Dekat',
    tag: 'Tahan Jempol',
    shortDesc: 'Detik 0.0 langsung dibuka gerakan tekstur super dekat yang memuaskan mata.',
    whyItWorks: 'Mata manusia otomatis berhenti saat melihat gerakan tajam jarak dekat di 1 detik pertama.',
    shotOverride: 'extreme macro close-up, 100mm probe lens, razor-thin depth of field',
    cameraOverride: 'rapid punchy push-in decelerating into crisp slow-motion focus',
    cameraIdOverride: 'Push-in',
    visualHookEn:
      'SCROLL-STOPPING 0.0s OPENING HOOK: immediate kinetic micro-action right in front of the lens as {product} catches a dramatic glint of light with crisp physical motion in the first second before settling cleanly into sharp hero focus',
    descHookId:
      'Detik pertama langsung menyuguhkan close-up tajam {product} yang bergerak memikat mata supaya penonton berhenti scroll.',
    spokenHookId: 'Tunggu, lihat dulu detail {product} ini dari dekat!',
    sfxOverride: 'crisp tactile ASMR micro-impact and subtle whoosh',
  },
  'masalah-relatable': {
    id: 'masalah-relatable',
    name: 'Masalah yang Sering Dialami',
    tag: 'Relatable',
    shortDesc: 'Membuka dengan situasi menjengkelkan sehari-hari sebelum produk muncul.',
    whyItWorks: 'Penonton merasa "wah ini gue banget" sehingga penasaran menonton solusinya.',
    shotOverride: 'expressive medium close-up, 35mm lens, immediate eye-level connection',
    cameraOverride: 'quick handheld snap-focus onto the situation then revealing {product}',
    cameraIdOverride: 'Handheld',
    visualHookEn:
      'SCROLL-STOPPING 0.0s PROBLEM HOOK: immediate relatable everyday frustration moment in the first two seconds, quickly interrupted as {product} enters the foreground cleanly as the clear hero solution',
    descHookId:
      'Dibuka dengan situasi masalah yang sering dialami pembeli, lalu {product} langsung masuk sebagai penyelamat.',
    spokenHookId: 'Masih sering kesel gara-gara susah nemu yang beneran {adv1}?',
    sfxOverride: 'subtle record-scratch pause into crisp upbeat reveal sound',
  },
  'transformasi-instan': {
    id: 'transformasi-instan',
    name: 'Perubahan Drastis Cepat',
    tag: 'Kontras Kuat',
    shortDesc: 'Dari kondisi biasa langsung berubah total begitu produk masuk ke layar.',
    whyItWorks: 'Otak penasaran membandingkan kondisi sebelum dan sesudah dalam hitungan detik.',
    shotOverride: 'dynamic medium shot, 35mm lens, centered subject framing',
    cameraOverride: 'whip-reveal camera motion snapping into a crisp hero lock',
    cameraIdOverride: 'Whip pan',
    visualHookEn:
      'SCROLL-STOPPING 0.0s TRANSFORMATION HOOK: starts for one beat on a dull flat scene, then as {product} lands squarely onto {surface}, warm light and rich color sweep across the entire frame instantly',
    descHookId:
      'Suasana yang tadinya biasa langsung berubah hidup seketika saat {product} hadir di layar.',
    spokenHookId: 'Cuma butuh sedetik buat ubah semuanya lewat {product} ini.',
    sfxOverride: 'energetic snap transition into rich room ambience',
  },
  'rahasia-pov': {
    id: 'rahasia-pov',
    name: 'POV "Jarang yang Tahu"',
    tag: 'Bikin Penasaran',
    shortDesc: 'Sudut pandang mata penonton sendiri seperti sedang diberi bocoran rahasia.',
    whyItWorks: 'Memicu rasa takut ketinggalan info penting (curiosity gap) sejak detik pertama.',
    shotOverride: 'first-person POV shot looking down at hands, 28mm wide natural lens',
    cameraOverride: 'natural first-person POV tilt-up revealing {product} clearly',
    cameraIdOverride: 'Tracking',
    visualHookEn:
      'SCROLL-STOPPING 0.0s FIRST-PERSON POV HOOK: authentic first-person point-of-view as hands bring {product} close into the light, turning it slightly to reveal {advantages_en} like sharing an insider secret',
    descHookId:
      'Sudut pandang mata penonton (POV) memegang {product} secara dekat sambil memicu rasa penasaran.',
    spokenHookId: 'Jarang banget yang tahu kenapa banyak orang pindah ke {product} ini.',
    sfxOverride: 'intimate close-mic handling foley',
  },
  'skala-unik': {
    id: 'skala-unik',
    name: 'Sudut Kamera Spektakuler',
    tag: 'Viral Visual',
    shortDesc: 'Kamera meluncur rendah atau menembus ruang secara sinematik ke arah produk.',
    whyItWorks: 'Gerakan kamera yang tidak biasa membuat video terlihat mahal dan ditonton ulang.',
    shotOverride: 'dramatic low-angle hero perspective, 24mm cinema wide lens',
    cameraOverride: 'sweeping low-altitude FPV-style glide stopping right in front of {product}',
    cameraIdOverride: 'Dolly-in',
    visualHookEn:
      'SCROLL-STOPPING 0.0s SPECTACLE HOOK: sweeping low-angle camera glides smoothly across {surface} straight toward {product}, making it look monumental, iconic, and impossible to ignore',
    descHookId:
      'Kamera meluncur rendah secara dramatis langsung menuju {product} sehingga terlihat ikonik sejak detik awal.',
    spokenHookId: 'Jangan lewatkan yang satu ini kalau kamu cari yang beneran {adv1}!',
    sfxOverride: 'cinematic smooth air glide and crisp bass settle',
  },
  'bukti-langsung': {
    id: 'bukti-langsung',
    name: 'Bukti Nyata Tanpa Intro',
    tag: 'To The Point',
    shortDesc: 'Tanpa basa-basi, detik pertama langsung mendemonstrasikan keunggulan utama.',
    whyItWorks: 'Penonton TikTok/Reels suka bukti instan tanpa pembukaan yang bertele-tele.',
    shotOverride: 'crisp 45-degree hero demonstration close-up, 50mm prime lens',
    cameraOverride: 'steady precision tracking focused tightly on the action',
    cameraIdOverride: 'Slow motion',
    visualHookEn:
      'SCROLL-STOPPING 0.0s DIRECT PROOF HOOK: zero-delay visual demonstration right from frame one proving {advantages_en} of {product} in crisp high-detail slow motion',
    descHookId:
      'Tanpa intro panjang, detik pertama langsung membuktikan keunggulan {product} ({advantages}) di depan mata.',
    spokenHookId: 'Langsung buktiin sendiri kenapa {product} ini juara soal {adv1}.',
    sfxOverride: 'clean satisfying demonstration foley',
  },
};

// ---------- 3. Kamus Suasana Cahaya, Musik, Model, Karakter ----------
export interface VibePreset {
  id: VibeId;
  name: string;
  shortDesc: string;
  art: string;
  style: string;
  lighting: string;
  palette: string;
  setting: string;
  settingId: string;
  surface: string;
}

export const VIBES: Record<VibeId, VibePreset> = {
  hangat: {
    id: 'hangat',
    name: 'Hangat Sore',
    shortDesc: 'Cahaya keemasan akrab',
    art: 'vibe-hangat',
    style: 'warm inviting color grade, soft natural contrast',
    lighting: 'golden-hour sunlight streaming from the side, soft natural shadows, warm 3200K tone',
    palette: 'caramel, cream, warm wood and soft amber tones',
    setting: 'a cozy sunlit space with warm wooden textures',
    settingId: 'cahaya sore yang hangat',
    surface: 'a warm oak wooden table',
  },
  mewah: {
    id: 'mewah',
    name: 'Gelap Elegan',
    shortDesc: 'Mewah & berkelas',
    art: 'vibe-mewah',
    style: 'refined luxury contrast, deep rich blacks, controlled highlights',
    lighting: 'low-key lighting with crisp rim light and clean specular reflections',
    palette: 'matte black, deep charcoal and warm champagne gold accents',
    setting: 'a minimalist dark marble studio environment',
    settingId: 'latar gelap yang elegan',
    surface: 'a polished dark marble surface',
  },
  ceria: {
    id: 'ceria',
    name: 'Cerah Segar',
    shortDesc: 'Terang penuh energi',
    art: 'vibe-ceria',
    style: 'bright punchy vibrant colors, clean energetic commercial feel',
    lighting: 'high-key soft daylight, bright and even, minimal shadows',
    palette: 'sunny yellow, coral, fresh mint and crisp white',
    setting: 'a bright sunlit modern tabletop set',
    settingId: 'latar cerah segar',
    surface: 'a clean bright pastel surface',
  },
  sinematik: {
    id: 'sinematik',
    name: 'Sinematik Film',
    shortDesc: 'Dramatis & kontras',
    art: 'vibe-sinematik',
    style: 'anamorphic cinema grade, high dynamic range, subtle film grain',
    lighting: 'dramatic side key light with soft atmospheric depth and rich shadows',
    palette: 'deep slate teal shadows with warm tungsten highlights',
    setting: 'a moody architectural space with dramatic side light',
    settingId: 'cahaya dramatis ala film',
    surface: 'a dark textured stone surface',
  },
  minimalis: {
    id: 'minimalis',
    name: 'Studio Bersih',
    shortDesc: 'Latar polos rapi',
    art: 'vibe-minimalis',
    style: 'ultra-clean modern minimalist aesthetic, generous negative space',
    lighting: 'large soft diffused overhead studio light, smooth clean shadows',
    palette: 'pure white, soft warm grey and natural neutral accents',
    setting: 'a seamless clean light-grey studio backdrop',
    settingId: 'latar studio bersih',
    surface: 'a clean matte white studio surface',
  },
  retro: {
    id: 'retro',
    name: 'Klasik 80-an',
    shortDesc: 'Nostalgia hangat',
    art: 'vibe-retro',
    style: 'nostalgic 1980s analog film color grade, gentle halation, warm grain',
    lighting: 'warm nostalgic tungsten practical light',
    palette: 'warm peach, muted teal, mustard and vintage cream',
    setting: 'a charming retro counter with classic tiles',
    settingId: 'nuansa klasik hangat',
    surface: 'a vintage formica counter',
  },
};

export const MUSIC_EN: Record<string, string> = {
  santai: 'soft relaxed lo-fi acoustic background music',
  upbeat: 'upbeat modern rhythmic pop background music',
  akustik: 'warm acoustic guitar background music',
  none: '',
};

export const MUSIC_LABELS: Record<string, string> = {
  santai: 'Santai',
  upbeat: 'Ceria',
  akustik: 'Akustik',
  none: 'Tanpa Musik',
};

export interface ModelSpec {
  id: QualityTier;
  title: string;
  label: string;
  note: string;
  credits: number;
  clipS: number;
}

export const MODELS: Record<QualityTier, ModelSpec> = {
  hemat: {
    id: 'hemat',
    title: 'Hemat',
    label: 'Veo 3.1 - Lite',
    note: 'Paling irit credit, cocok untuk coba-coba dulu.',
    credits: 10,
    clipS: 8,
  },
  seimbang: {
    id: 'seimbang',
    title: 'Seimbang (Disarankan)',
    label: 'Veo 3.1 - Fast',
    note: 'Cepat jadi & kualitas gambar tajam untuk konten jualan.',
    credits: 20,
    clipS: 8,
  },
  terbaik: {
    id: 'terbaik',
    title: 'Detail Tertinggi',
    label: 'Veo 3.1 - Quality',
    note: 'Kualitas paling halus, memakai kuota credit paling besar.',
    credits: 100,
    clipS: 8,
  },
};

export interface CharacterPreset {
  id: string;
  name: string;
  desc: string;
  art: string;
  lock: string;
}

export const CHARACTERS: Record<string, CharacterPreset> = {
  sinta: {
    id: 'sinta',
    name: 'Sinta',
    desc: 'Perempuan 20-an, rambut sebahu, sweter krem',
    art: 'char-1',
    lock: 'a friendly Indonesian woman in her mid-20s with warm skin, shoulder-length straight black hair, wearing a neat cream knit sweater',
  },
  raka: {
    id: 'raka',
    name: 'Raka',
    desc: 'Laki-laki 20-an, rambut pendek rapi, celemek biru',
    art: 'char-2',
    lock: 'a cheerful Indonesian man in his late 20s with short neat black hair, wearing a navy apron over a plain white t-shirt',
  },
  laras: {
    id: 'laras',
    name: 'Laras',
    desc: 'Perempuan 20-an berhijab biru muda, kemeja putih',
    art: 'char-3',
    lock: 'a young Indonesian woman in her early 20s wearing a neat light-blue hijab and a clean white shirt, warm friendly smile',
  },
  bima: {
    id: 'bima',
    name: 'Bima',
    desc: 'Laki-laki 40-an, ramah, kemeja batik cokelat',
    art: 'char-4',
    lock: 'a friendly Indonesian man in his 40s with neat short hair, wearing a casual brown batik shirt',
  },
};

export interface CameraPreset {
  id: string;
  label: string;
  en: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'Push-in', label: 'Maju Dekat (Push-in)', en: 'slow smooth push-in toward the subject' },
  { id: 'Orbit', label: 'Memutar (Orbit)', en: 'smooth 180-degree orbit around the subject' },
  { id: 'Slow motion', label: 'Gerak Lambat (Slow-mo)', en: 'high-frame-rate slow-motion glide across the detail' },
  { id: 'Tracking', label: 'Mengikuti (Tracking)', en: 'gentle tracking movement following the action' },
  { id: 'Slide', label: 'Geser Samping (Slide)', en: 'slow lateral slider movement' },
  { id: 'Dolly-in', label: 'Mendekat Halus', en: 'slow dolly-in ending in a steady hero hold' },
  { id: 'Dolly-out', label: 'Mundur Luas', en: 'slow reveal dolly-out' },
  { id: 'Whip pan', label: 'Transisi Cepat', en: 'energetic smooth whip-pan landing cleanly on the subject' },
  { id: 'Crane', label: 'Turun dari Atas', en: 'smooth crane-down movement' },
  { id: 'Selfie', label: 'Kamera Depan (Selfie)', en: 'natural steady handheld selfie perspective' },
  { id: 'Handheld', label: 'Genggam Natural', en: 'subtle organic handheld movement' },
  { id: 'Statis', label: 'Diam Stabil (Tripod)', en: 'locked-off steady tripod camera' },
];

export const ADVANTAGE_SUGGESTIONS = [
  'Manis pas',
  'Gula aren asli',
  'Segar',
  'Murah',
  'Praktis',
  'Premium',
  'Renyah',
  'Pedas nampol',
  'Lembut',
  'Wangi',
  'Tahan lama',
  'Halal',
  'Creamy',
  'Alami',
];

export const CTA_SUGGESTIONS = [
  'Pesan sekarang, link di bio',
  'Cek keranjang kuning sekarang',
  'Mampir ke toko kami hari ini',
  'Klik link di bio mumpung promo',
];

const ADV_EN: Record<string, string> = {
  'manis pas': 'perfectly balanced sweetness',
  'gula aren asli': 'made with real palm sugar',
  segar: 'refreshing and fresh',
  murah: 'great value',
  praktis: 'convenient and easy to use',
  premium: 'premium quality craftsmanship',
  sehat: 'made with wholesome healthy ingredients',
  renyah: 'crispy and crunchy texture',
  pedas: 'bold spicy kick',
  'pedas nampol': 'bold mouthwatering spicy kick',
  lembut: 'soft and smooth texture',
  wangi: 'inviting fragrant aroma',
  'tahan lama': 'long-lasting durability',
  halal: 'clean halal preparation',
  creamy: 'rich and creamy consistency',
  gurih: 'savory and rich flavor',
  lumer: 'melty and rich interior',
  hangat: 'warm and comforting',
  kental: 'rich thick consistency',
  'porsi besar': 'generous satisfying portion',
  enak: 'delicious taste',
  original: 'authentic original recipe',
  alami: 'natural ingredients',
  awet: 'long-lasting quality',
};

const NEGATIVES_START = 'NO SUBTITLES, NO CAPTIONS, NO TEXT OF ANY KIND ON SCREEN.';
const NEGATIVES_END =
  'NO TEXT ON SCREEN: never add subtitles, captions, titles, watermarks, words or letters anywhere in the frame; keep product geometry, style consistency, and proportions locked.';

function joinEn(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function joinId(items: string[]): string {
  const clean = items.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (clean.length === 0) return 'kualitas terbaiknya';
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} dan ${clean[clean.length - 1]}`;
}

export function translateAdvantages(items: string[]): string {
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const mapped = ADV_EN[s.toLowerCase()];
    out.push(mapped ?? `"${s}"`);
  }
  return out.length > 0 ? joinEn(out) : 'its standout quality and appeal';
}

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizeAnswers(input: Answers): Answers {
  const a: Answers = { ...input };
  a.product = (a.product || '').trim();
  if (!a.videoStyle || !VIDEO_STYLES[a.videoStyle]) {
    a.videoStyle = 'real-live';
  }
  if (!a.hookStyle || !HOOK_STRATEGIES[a.hookStyle]) {
    a.hookStyle = 'visual-kejutan';
  }
  if (a.durationS !== 15 && a.durationS !== 20 && a.durationS !== 30) {
    a.durationS = 20;
  }
  if (a.aspect !== '16:9') {
    a.aspect = '9:16';
  }
  if (!MODELS[a.quality]) {
    a.quality = 'seimbang';
  }
  if (!VIBES[a.vibe]) {
    a.vibe = 'hangat';
  }
  if (!(a.music in MUSIC_EN)) {
    a.music = 'santai';
  }
  if (a.cast !== 'person') {
    a.cast = 'product';
  }
  if (a.voice !== 'dialog' && a.voice !== 'narasi') {
    a.voice = 'none';
  }
  if (!a.cta || !a.cta.trim()) {
    a.cta = 'Pesan sekarang, link di bio';
  } else {
    a.cta = a.cta.trim();
  }
  a.advantages = (a.advantages || []).map((x) => x.trim()).filter(Boolean);
  return a;
}

function applyPlaceholders(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

export function cleanSingleLinePrompt(prompt: string): string {
  return prompt.replace(/\s*\n+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export function buildSceneVideoPrompt(
  bible: Bible,
  scene: Pick<Scene, 'shot' | 'camera' | 'dialogue' | 'sfx' | 'chainFromPrev'>,
  actionEn: string,
  voice: Answers['voice']
): string {
  const parts: string[] = [NEGATIVES_START];

  // Medium / Video Style Lock comes FIRST so Veo 3.1 immediately locks 2D/3D/Minecraft/Live-Action medium
  parts.push(`Visual Medium & Render Style: ${bible.videoStyleLock}.`);

  if (scene.chainFromPrev) {
    parts.push(
      'Seamless continuation from the attached Start frame: preserve exact subject position, visual style, lighting continuity, and environment.'
    );
  }

  parts.push(`${capFirst(scene.shot)}. ${capFirst(actionEn.replace(/\.+$/, ''))}.`);
  parts.push(`Environment: ${bible.setting}.`);
  parts.push(`Lighting & Color: ${bible.lighting}; ${bible.style}; color palette of ${bible.palette}.`);
  parts.push(`Camera Choreography: ${scene.camera}, one fluid continuous shot.`);
  parts.push(`${bible.productLock}.`);

  if (bible.characterLock) {
    parts.push(`Character Lock (keep identical in every shot): ${bible.characterLock}.`);
  }

  const audio: string[] = [];
  if (scene.sfx) audio.push(scene.sfx);
  if (bible.music) audio.push(bible.music);
  if (scene.dialogue) {
    if (voice === 'narasi') {
      audio.push(`a clear engaging Indonesian voice-over says in Indonesian: "${scene.dialogue}"`);
    } else {
      audio.push(`the character speaks naturally in casual Indonesian with accurate lip sync: "${scene.dialogue}"`);
    }
  }
  if (audio.length > 0) {
    parts.push(`Audio: ${audio.join('; ')}.`);
  }

  parts.push(NEGATIVES_END);
  return cleanSingleLinePrompt(parts.join(' '));
}

function defaultNarration(role: string, a: Answers, advId: string): string {
  switch (role) {
    case 'produk':
    case 'sajian':
    case 'transisi':
    case 'buka':
    case 'temuan':
    case 'penjelasan':
      return `Kenalan sama ${a.product} yang digarap serius buat kamu.`;
    case 'manfaat':
    case 'gigitan':
    case 'sesudah':
    case 'isi':
    case 'keunggulan':
    case 'solusi':
    case 'nikmati':
      return `Keunggulannya langsung kerasa: ${advId}.`;
    case 'ajakan':
      return `${a.cta.replace(/[.!]+$/, '')}!`;
    default:
      return '';
  }
}

function buildAssets(bible: Bible, a: Answers, vibe: VibePreset, vStyle: VideoStylePreset): Asset[] {
  const out: Asset[] = [
    {
      id: 'product',
      name: 'Gambar Patokan Produk',
      upload: a.hasPhoto,
      purpose: a.hasPhoto
        ? 'Unggah foto produk aslimu ke Google Flow supaya bentuk dan warnanya dipakai terus di setiap klip.'
        : `Buat 1 gambar patokan produk bergaya "${vStyle.name}" (gratis 0 credit di Flow) supaya bentuk produk konsisten di semua adegan.`,
      prompt: cleanSingleLinePrompt(
        `Reference sheet / hero visual of ${bible.product}, rendered in ${vStyle.assetStyleEn}, centered composition on ${vibe.surface}, ${vibe.lighting}, color palette of ${vibe.palette}, ultra-clean geometry and consistent details, no text overlays, no watermark.`
      ),
    },
  ];

  if (bible.characterLock) {
    out.push({
      id: 'character',
      name: `Gambar Patokan Karakter (${bible.characterName || 'Utama'})`,
      upload: false,
      purpose: `Buat 1 potret karakter bergaya "${vStyle.name}" (gratis 0 credit) agar wajah dan pakaian tidak berubah antar-adegan.`,
      prompt: cleanSingleLinePrompt(
        `Character reference portrait of ${bible.characterLock}, rendered in ${vStyle.assetStyleEn}, waist-up front-facing friendly pose, clean neutral background matching ${vibe.palette}, sharp consistent details, no text, no watermark.`
      ),
    });
  }

  return out;
}

function buildSceneTips(
  scene: Pick<Scene, 'idx' | 'role' | 'dialogue' | 'chainFromPrev'>,
  a: Answers
): string[] {
  const tips: string[] = [];
  if (scene.idx === 0) {
    tips.push(
      'Ini adalah Adegan Hook (3 detik penentu). Pilih hasil video yang gerakannya paling langsung menangkap mata sejak detik pertama.'
    );
  }
  tips.push(
    'Kalau hasil pertama kurang sreg, cukup klik "Start generation" sekali lagi tanpa perlu mengubah prompt.'
  );
  if (scene.chainFromPrev) {
    tips.push(
      'Karena memakai sambung mulus (Frames), pastikan kamu melampirkan potongan gambar paling akhir dari adegan sebelumnya di tombol Start.'
    );
  } else if (a.hasPhoto) {
    tips.push(
      'Pastikan foto produk sudah dipilih lewat tombol "Add ingredients to the prompt box" sebelum generate.'
    );
  }
  if (scene.role === 'ajakan') {
    tips.push(flowGuideData.commonTips.textInVideo);
  }
  if (scene.dialogue) {
    tips.push(
      'Jika pengucapan Bahasa Indonesia kurang pas di percobaan pertama, ulangi generate sekali lagi di Veo 3.1 Fast/Quality.'
    );
  }
  return tips;
}

function buildCaption(a: Answers, advId: string): { caption: string; hashtags: string[] } {
  const cleanCta = a.cta.replace(/[.!]+$/, '');
  const caption = `${a.product}, ${advId}. ${cleanCta}.`;
  const slug = a.product.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hashtags: string[] = [];
  if (slug) hashtags.push(`#${slug}`);
  hashtags.push('#rekomendasi', '#produklokal', '#videoproduk', '#umkmindonesia');
  return { caption, hashtags };
}

export function buildFlowSteps(
  pack: Omit<Pack, 'steps' | 'guideUpdatedAt'>,
  a: Answers
): GuideStep[] {
  const L = flowGuideData.labels;
  const steps: GuideStep[] = [];

  // 1. Persiapan proyek baru di Google Flow
  steps.push({
    id: 'step-prep-project',
    phase: 'persiapan',
    title: 'Buka Google Flow & Buat Proyek Baru',
    instruction:
      'Langkah pertama: siapkan ruang kerja kosong di Google Flow supaya semua gambar patokan dan video terkumpul rapi.',
    substeps: [
      `Klik tombol "Buka Google Flow" di atas untuk membuka halaman Flow dalam Bahasa Inggris.`,
      `Klik tombol "${L.newProject}".`,
      `Klik judul proyek di pojok kiri atas (${L.projectTitle}), ketik "${pack.title}", lalu tekan Enter.`,
      `Di kotak ketik bawah, pastikan tombol "${L.agentToggle}" posisi MATI (tidak biru).`,
    ],
    buttons: [
      { label: L.newProject, kind: 'button' },
      { label: L.agentToggle, kind: 'button' },
    ],
    credits: 0,
    tips: [flowGuideData.commonTips.agentOff],
  });

  // 2. Aset konsistensi (Produk & Karakter)
  for (const asset of pack.assets) {
    if (asset.id === 'product' && asset.upload) {
      steps.push({
        id: 'step-asset-product-upload',
        phase: 'aset',
        title: 'Unggah Foto Produk Asli ke Proyek Flow',
        instruction:
          'Foto ini dipakai Google Flow sebagai patokan supaya bentuk produkmu tidak berubah-ubah di setiap adegan.',
        substeps: [
          `Klik tombol tanda tambah "+" (${L.addMediaMenu}) di layar proyek Flow.`,
          `Pilih "${L.menuUpload}", lalu pilih foto ${a.product} dari HP atau laptopmu.`,
          'Tunggu sebentar sampai foto selesai muncul di layar proyek.',
        ],
        buttons: [
          { label: L.addMediaMenu, kind: 'button' },
          { label: L.menuUpload, kind: 'menu' },
        ],
        credits: 0,
        tips: [
          'Gunakan foto produk yang terang dan jelas tanpa stiker tulisan ramai agar hasil video bersih.',
        ],
      });
    } else {
      steps.push({
        id: `step-asset-${asset.id}`,
        phase: 'aset',
        title: `Buat ${asset.name} (Gratis · 0 Credit)`,
        instruction: asset.purpose,
        substeps: [
          `Klik ikon pengaturan "${L.settingsTrigger}" di dekat kotak ketik bawah.`,
          `Pilih "${L.radioImage}" → pilih ukuran "${pack.settings.aspect}" → pastikan model "${pack.settings.imageModel}" dan variasi "x1".`,
          'Klik tombol hijau "Salin Prompt Ini" di bawah, lalu tempel (Ctrl+V / Tempel) ke kotak ketik Google Flow.',
          `Klik "${L.startGeneration}" dan tunggu sekitar 20 detik sampai gambarnya jadi.`,
        ],
        buttons: [
          { label: L.settingsTrigger, kind: 'button' },
          { label: L.radioImage, kind: 'radio' },
          { label: pack.settings.aspect, kind: 'radio' },
          { label: L.startGeneration, kind: 'button' },
        ],
        prompt: asset.prompt,
        promptLabel: `Prompt ${asset.name} (${pack.bible.videoStyleName})`,
        credits: 0,
        tips: [
          'Pembuatan gambar ini 0 credit (gratis). Kalau belum sreg, klik Start generation sekali lagi sampai pas.',
          flowGuideData.commonTips.policyRejected,
        ],
      });
    }
  }

  // 3. Langkah per Scene
  for (const sc of pack.scenes) {
    const n = sc.idx + 1;
    const isHook = sc.idx === 0;
    const isFrames = sc.chainFromPrev && sc.idx > 0;
    const substeps: string[] = [];
    const buttons: GuideStep['buttons'] = [{ label: L.settingsTrigger, kind: 'button' }];

    if (isFrames) {
      substeps.push(
        `Simpan potongan gambar paling akhir dari klip Adegan ${n - 1} (buka klip Adegan ${n - 1} → geser ke ujung akhir → klik Save frame).`,
        `Klik "${L.settingsTrigger}" → pilih "${L.radioVideo}" → pilih "${L.radioFrames}" → ukuran "${pack.settings.aspect}" → model "${pack.settings.model}".`,
        `Klik tombol "${L.frameStart}" lalu pilih gambar ujung Adegan ${n - 1} tadi.`,
        `Salin prompt di bawah, tempel ke kotak ketik Flow, lalu klik "${L.startGeneration}".`
      );
      buttons.push(
        { label: L.radioVideo, kind: 'radio' },
        { label: L.radioFrames, kind: 'radio' },
        { label: L.frameStart, kind: 'button' },
        { label: L.startGeneration, kind: 'button' }
      );
    } else {
      const refList =
        pack.assets.length > 1
          ? 'gambar patokan produk DAN gambar patokan karakter'
          : 'gambar patokan produk tadi';
      substeps.push(
        `Klik "${L.settingsTrigger}" → pilih "${L.radioVideo}" → pilih "${L.radioIngredients}" → ukuran "${pack.settings.aspect}" → pada "${L.selectModel}" pilih "${pack.settings.model}" → jumlah "x1".`,
        `Klik tombol "${L.addIngredients}" di kotak bawah, lalu pilih ${refList} (klik "${L.addToPrompt}" bila muncul konfirmasi).`,
        `Klik tombol hijau "Salin Prompt Ini" di bawah, tempel ke kotak ketik Flow, lalu klik "${L.startGeneration}".`,
        'Tunggu 1–3 menit sampai klip video selesai dibuat.'
      );
      buttons.push(
        { label: L.radioVideo, kind: 'radio' },
        { label: L.radioIngredients, kind: 'radio' },
        { label: pack.settings.model, kind: 'menu' },
        { label: L.addIngredients, kind: 'button' },
        { label: L.startGeneration, kind: 'button' }
      );
    }

    steps.push({
      id: `step-scene-${sc.id}`,
      phase: 'scene',
      sceneIdx: sc.idx,
      title: isHook
        ? `Buat Adegan 1 (HOOK PEMBUKA · ${pack.bible.hookStrategyName})`
        : `Buat Adegan ${n}: ${sc.label} (${sc.durationS} detik)`,
      instruction: sc.description,
      substeps,
      buttons,
      prompt: sc.prompt,
      promptLabel: isHook
        ? `Prompt Video HOOK Adegan 1 · Gaya ${pack.bible.videoStyleName}`
        : `Prompt Video Adegan ${n} (${sc.label})`,
      credits: sc.credits,
      tips: sc.tips,
    });
  }

  // 4. Rakit & Unduh
  steps.push({
    id: 'step-assemble-download',
    phase: 'rakit',
    title: 'Unduh Semua Klip Video & Gabungkan',
    instruction:
      'Semua klip adegan sudah jadi! Terakhir, unduh file videonya dari Google Flow dan gabungkan berurutan.',
    substeps: [
      `Arahkan kursor ke setiap klip video yang sudah selesai di layar proyek Flow.`,
      `Klik titik tiga "${L.moreOptions}" → pilih "${L.menuDownload}" → pilih "${L.download720p}" (langsung cepat terunduh).`,
      'Masukkan semua klip secara berurutan (Adegan 1 sampai akhir) ke CapCut, Canva, atau fitur Scenebuilder Flow.',
      `Tambahkan tulisan penutup "${pack.cta}" pada klip terakhir, lalu posting dengan caption di bawah.`,
    ],
    buttons: [
      { label: L.moreOptions, kind: 'button' },
      { label: L.menuDownload, kind: 'menu' },
      { label: L.download720p, kind: 'menu' },
    ],
    prompt: `${pack.caption}\n\n${pack.hashtags.join(' ')}`,
    promptLabel: 'Caption & Hashtag Siap Posting',
    credits: 0,
    tips: [flowGuideData.commonTips.upscaleSlow, flowGuideData.commonTips.textInVideo],
  });

  return steps;
}

export function generateOfflinePack(template: Template, rawAnswers: Answers): Pack {
  const a = normalizeAnswers(rawAnswers);
  if (!a.product) {
    throw new Error('Nama produk wajib diisi.');
  }
  if (template.cast === 'person') {
    a.cast = 'person';
    if (a.voice === 'none') {
      a.voice = 'dialog';
    }
  }

  const vStyle = VIDEO_STYLES[a.videoStyle || 'real-live'];
  const hookPreset = HOOK_STRATEGIES[a.hookStyle || 'visual-kejutan'];
  const vibe = VIBES[a.vibe];
  const model = MODELS[a.quality];

  let productLock =
    a.productLockCustom?.trim() ||
    `The hero product is "${a.product}" rendered consistently in ${vStyle.name} aesthetic; keep its exact geometry, colors, proportions, packaging and design identical in every shot`;
  if (a.hasPhoto && !productLock.toLowerCase().includes('reference image')) {
    productLock += ', matching the attached product reference image faithfully';
  }

  const bible: Bible = {
    product: a.product,
    productLock,
    videoStyleName: vStyle.name,
    videoStyleLock: vStyle.mediumLock,
    hookStrategyName: hookPreset.name,
    styleName: vibe.name,
    style: vibe.style,
    lighting: vibe.lighting,
    palette: vibe.palette,
    setting: vibe.setting,
    music: MUSIC_EN[a.music] ?? '',
    source: 'offline',
  };

  if (a.cast === 'person') {
    if (a.characterCustom?.trim()) {
      bible.characterName = 'Karakter Utama';
      bible.characterLock = `${a.characterCustom.trim()}, ${vStyle.characterAdapterEn}`;
    } else if (a.characterId && CHARACTERS[a.characterId]) {
      bible.characterName = CHARACTERS[a.characterId].name;
      bible.characterLock = `${CHARACTERS[a.characterId].lock}, ${vStyle.characterAdapterEn}`;
    } else {
      bible.characterName = CHARACTERS.sinta.name;
      bible.characterLock = `${CHARACTERS.sinta.lock}, ${vStyle.characterAdapterEn}`;
    }
  }

  const advId = joinId(a.advantages);
  const advEn = translateAdvantages(a.advantages);
  const adv1 = a.advantages[0]?.trim().toLowerCase() || 'berkualitas';
  const charRef = bible.characterLock || 'the presenter';
  const charId = bible.characterName || 'Presenter';

  const replacements: Record<string, string> = {
    '{product}': a.product,
    '{advantages}': advId,
    '{advantages_en}': advEn,
    '{adv1}': adv1,
    '{adv_all}': advId,
    '{cta}': a.cta.replace(/[.!]+$/, ''),
    '{setting_id}': vibe.settingId,
    '{setting}': vibe.setting,
    '{vibe_id}': vibe.name.toLowerCase(),
    '{surface}': vibe.surface,
    '{character}': charRef,
    '{character_id}': charId,
  };

  const plan = getPlanForDuration(template, a.durationS);
  const assetIds = bible.characterLock ? ['product', 'character'] : ['product'];
  const scenes: Scene[] = [];

  plan.roles.forEach((roleName, i) => {
    const r = getTemplateRole(template, roleName);
    if (!r) return;
    const durationS = plan.durations[i] ?? 5;
    const isOpeningHook = i === 0;

    // Scene 1 uses our High-Converting Scroll-Stopper Hook Architecture!
    let shot = isOpeningHook ? hookPreset.shotOverride : r.shot;
    let camera = isOpeningHook
      ? applyPlaceholders(hookPreset.cameraOverride, replacements)
      : r.camera;
    let cameraId = isOpeningHook ? hookPreset.cameraIdOverride : r.cameraId;
    let sfx = isOpeningHook ? hookPreset.sfxOverride : r.sfx;
    let description = isOpeningHook
      ? `[Hook: ${hookPreset.name}] ${applyPlaceholders(hookPreset.descHookId, replacements)}`
      : applyPlaceholders(r.descId, replacements);

    let actionEn = isOpeningHook
      ? `${applyPlaceholders(hookPreset.visualHookEn, replacements)}. Context: ${applyPlaceholders(r.action, replacements)}`
      : applyPlaceholders(r.action, replacements);

    if (
      !isOpeningHook &&
      a.story?.trim() &&
      (r.role === 'produk' || r.role === 'suasana' || r.role === 'sajian' || r.role === 'isi')
    ) {
      actionEn += ` (context nuance: "${a.story.trim()}")`;
    }

    let dialogue: string | undefined;
    if (a.voice !== 'none') {
      if (isOpeningHook) {
        dialogue =
          a.customHookLine?.trim() ||
          applyPlaceholders(hookPreset.spokenHookId, replacements);
      } else if (r.dialogue) {
        dialogue = applyPlaceholders(r.dialogue, replacements);
      } else if (a.voice === 'narasi') {
        dialogue = defaultNarration(r.role, a, advId);
      }
    }

    const chainFromPrev = Boolean(a.seamlessChain && scenes.length > 0);
    const scBase: Scene = {
      id: `sc-${scenes.length + 1}`,
      idx: scenes.length,
      role: r.role,
      label: isOpeningHook ? `Hook (${hookPreset.name})` : r.label,
      art: r.art || template.art,
      description,
      actionEn,
      prompt: '',
      dialogue,
      shot,
      camera,
      cameraId,
      durationS,
      mode: chainFromPrev ? 'frames' : 'ingredients',
      chainFromPrev,
      assets: assetIds,
      credits: model.credits,
      tips: [],
      sfx,
    };

    scBase.prompt = buildSceneVideoPrompt(bible, scBase, scBase.actionEn, a.voice);
    scBase.tips = buildSceneTips(scBase, a);
    scenes.push(scBase);
  });

  if (scenes.length === 0) {
    throw new Error('Template belum memiliki susunan scene untuk durasi ini.');
  }

  const assets = buildAssets(bible, a, vibe, vStyle);
  const settings: PackSettings = {
    aspect: a.aspect,
    model: model.label,
    modelNote: model.note,
    imageModel: 'Nano Banana',
    creditsScene: model.credits,
    creditsTotal: model.credits * scenes.length,
    durationS: a.durationS,
    clipSeconds: model.clipS,
  };

  const { caption, hashtags } = buildCaption(a, advId);
  const summary = `${scenes.length} klip · ±${a.durationS} dtk · ${a.aspect} · ${vStyle.name} · Hook ${hookPreset.name}.`;

  const basePack: Omit<Pack, 'steps' | 'guideUpdatedAt'> = {
    title: a.product,
    summary,
    bible,
    settings,
    assets,
    scenes,
    cta: a.cta,
    caption,
    hashtags,
  };

  return {
    ...basePack,
    steps: buildFlowSteps(basePack, a),
    guideUpdatedAt: flowGuideData.updatedAt,
  };
}

export function recalculatePack(pack: Pack, answers: Answers): Pack {
  const model = MODELS[answers.quality] ?? MODELS.seimbang;
  const normalizedScenes = pack.scenes.map((sc, idx) => {
    const chainFromPrev = idx === 0 ? false : sc.chainFromPrev;
    const mode: Scene['mode'] = chainFromPrev ? 'frames' : 'ingredients';
    const updated: Scene = {
      ...sc,
      idx,
      chainFromPrev,
      mode,
      credits: model.credits,
    };
    updated.prompt = buildSceneVideoPrompt(pack.bible, updated, updated.actionEn, answers.voice);
    updated.tips = buildSceneTips(updated, answers);
    return updated;
  });

  const totalDuration = normalizedScenes.reduce((acc, s) => acc + s.durationS, 0);
  const settings: PackSettings = {
    ...pack.settings,
    aspect: answers.aspect,
    model: model.label,
    modelNote: model.note,
    creditsScene: model.credits,
    creditsTotal: model.credits * normalizedScenes.length,
    durationS: totalDuration,
  };

  const summary = `${normalizedScenes.length} klip · ±${totalDuration} dtk · ${settings.aspect} · ${pack.bible.videoStyleName}.`;

  const basePack: Omit<Pack, 'steps' | 'guideUpdatedAt'> = {
    ...pack,
    summary,
    settings,
    scenes: normalizedScenes,
  };

  return {
    ...basePack,
    steps: buildFlowSteps(basePack, answers),
    guideUpdatedAt: flowGuideData.updatedAt,
  };
}

const VARIATION_ANGLES = [
  {
    shot: 'dynamic 45-degree close-up, 50mm prime lens, shallow depth of field',
    nuance: 'subtle light reflection glides across the hero surface with crisp tactile clarity',
  },
  {
    shot: 'low-angle hero framing, 35mm lens, clean foreground depth',
    nuance: 'confident commercial framing emphasizing stature, proportions, and clean silhouette',
  },
  {
    shot: 'intimate macro-medium framing, 85mm lens, creamy bokeh background',
    nuance: 'focused attention on fine craftsmanship, authentic texture, and inviting atmosphere',
  },
  {
    shot: 'overhead tabletop perspective, 50mm lens, balanced geometric composition',
    nuance: 'curated props arranged cleanly around the hero product without clutter',
  },
];

export function createOfflineSceneVariation(
  scene: Scene,
  bible: Bible,
  answers: Answers,
  seed: number
): Scene {
  const v = VARIATION_ANGLES[Math.abs(seed) % VARIATION_ANGLES.length];
  const baseVariation = scene.actionEn.split(' [angle variation:')[0];
  const nextAction = `${baseVariation} [angle variation: ${v.nuance}]`;
  const updated: Scene = {
    ...scene,
    shot: v.shot,
    actionEn: nextAction,
  };
  updated.prompt = buildSceneVideoPrompt(bible, updated, updated.actionEn, answers.voice);
  return updated;
}

export function exportPackAsText(pack: Pack): string {
  const lines: string[] = [
    `PAKET PROMPT STUDIOFLOW — ${pack.title.toUpperCase()}`,
    `${pack.summary}`,
    `Gaya Visual: ${pack.bible.videoStyleName} | Strategi Hook: ${pack.bible.hookStrategyName}`,
    `Diperbarui untuk UI Google Flow: ${pack.guideUpdatedAt}`,
    '============================================================',
    '',
    '1. PENGATURAN GOOGLE FLOW',
    `- URL: ${flowGuideData.flowUrl}`,
    `- Rasio: ${pack.settings.aspect}`,
    `- Model Video: ${pack.settings.model} (${pack.settings.creditsScene} credit/klip)`,
    `- Model Gambar Patokan: ${pack.settings.imageModel} (0 credit)`,
    `- Total Estimasi: ${pack.settings.creditsTotal} credit`,
    '',
    '2. GAMBAR PATOKAN KONSISTENSI (INGREDIENTS)',
  ];

  for (const asset of pack.assets) {
    lines.push(`- ${asset.name}: ${asset.purpose}`);
    if (!asset.upload) {
      lines.push(`  Prompt Gambar: ${asset.prompt}`);
    } else {
      lines.push('  Tindakan: Unggah foto produk asli melalui menu "+" -> Upload di Google Flow.');
    }
    lines.push('');
  }

  lines.push('3. PROMPT VIDEO PER ADEGAN');
  for (const sc of pack.scenes) {
    lines.push(
      `[Adegan ${sc.idx + 1} · ${sc.label} · ${sc.durationS} dtk · Kamera: ${sc.cameraId} · Mode: ${sc.mode === 'frames' ? 'Frames (Sambung Mulus)' : 'Ingredients'}]`
    );
    lines.push(`Alur: ${sc.description}`);
    if (sc.dialogue) {
      lines.push(`Dialog/Narasi: "${sc.dialogue}"`);
    }
    lines.push(`Prompt Flow:`);
    lines.push(sc.prompt);
    lines.push('');
  }

  lines.push('4. CAPTION & HASHTAG');
  lines.push(pack.caption);
  lines.push(pack.hashtags.join(' '));
  lines.push('');
  lines.push(`Teks Penutup di Video: ${pack.cta}`);

  return lines.join('\n');
}

export function exportPackAsMarkdown(pack: Pack): string {
  const lines: string[] = [
    `# Paket Prompt StudioFlow — ${pack.title}`,
    '',
    `> ${pack.summary}`,
    '',
    '## Pengaturan Google Flow',
    `- **URL**: ${flowGuideData.flowUrl}`,
    `- **Gaya Visual**: ${pack.bible.videoStyleName}`,
    `- **Jurus Hook Pembuka**: ${pack.bible.hookStrategyName}`,
    `- **Rasio**: \`${pack.settings.aspect}\``,
    `- **Model Video**: \`${pack.settings.model}\` (±${pack.settings.creditsScene} credit/klip)`,
    `- **Estimasi Total**: **${pack.settings.creditsTotal} credit**`,
    '',
    '## Gambar Patokan Konsistensi (Ingredients)',
  ];

  for (const asset of pack.assets) {
    lines.push(`### ${asset.name}`);
    lines.push(asset.purpose);
    if (!asset.upload) {
      lines.push('```text');
      lines.push(asset.prompt);
      lines.push('```');
    }
    lines.push('');
  }

  lines.push('## Prompt Video per Adegan');
  for (const sc of pack.scenes) {
    lines.push(
      `### Adegan ${sc.idx + 1}: ${sc.label} (${sc.durationS} dtk · ${sc.cameraId} · ${sc.mode === 'frames' ? 'Frames' : 'Ingredients'})`
    );
    lines.push(`**Alur**: ${sc.description}`);
    if (sc.dialogue) {
      lines.push(`**Dialog/Narasi**: "${sc.dialogue}"`);
    }
    lines.push('');
    lines.push('```text');
    lines.push(sc.prompt);
    lines.push('```');
    lines.push('');
  }

  lines.push('## Caption & Teks Penutup');
  lines.push(`- **Teks Penutup di Video**: ${pack.cta}`);
  lines.push('');
  lines.push('```text');
  lines.push(pack.caption);
  lines.push(pack.hashtags.join(' '));
  lines.push('```');

  return lines.join('\n');
}

function escapeCsvCell(val: string): string {
  const clean = val.replace(/"/g, '""');
  return `"${clean}"`;
}

export function exportBatchPacksAsCsv(items: Array<{ product: string; pack: Pack }>): string {
  const maxScenes = items.reduce((m, it) => Math.max(m, it.pack.scenes.length), 0);
  const headers = [
    'Produk',
    'Gaya_Video',
    'Hook_Pembuka',
    'Model_Flow',
    'Estimasi_Credit',
    'Prompt_Gambar_Produk',
    ...Array.from({ length: maxScenes }, (_, i) => `Adegan_${i + 1}_Prompt`),
    'Caption',
    'Hashtags',
  ];

  const rows = [headers.map(escapeCsvCell).join(',')];
  for (const { product, pack } of items) {
    const prodAsset = pack.assets.find((a) => a.id === 'product')?.prompt ?? '';
    const cols = [
      product,
      pack.bible.videoStyleName,
      pack.bible.hookStrategyName,
      pack.settings.model,
      String(pack.settings.creditsTotal),
      prodAsset,
      ...Array.from({ length: maxScenes }, (_, i) => pack.scenes[i]?.prompt ?? ''),
      pack.caption,
      pack.hashtags.join(' '),
    ];
    rows.push(cols.map(escapeCsvCell).join(','));
  }
  return rows.join('\n');
}
