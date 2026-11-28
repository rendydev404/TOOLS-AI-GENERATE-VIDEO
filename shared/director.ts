import flowGuideData from './flow-guide.json';
import { getPlanForDuration, getTemplateRole } from './templates';
import type {
  Answers,
  Asset,
  Bible,
  ContentMode,
  EpisodeRecap,
  GuideStep,
  HookStrategyId,
  Pack,
  PackSettings,
  QualityTier,
  Scene,
  SellingStyle,
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
  previewImage: string;
  previewCaption: string;
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
    previewImage: '/style-previews/real-live.webp',
    previewCaption: 'Contoh Matahari: cahaya optik kamera sinema asli, awan & lembah fotorealistis.',
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
    previewImage: '/style-previews/real-ugc.webp',
    previewCaption: 'Contoh Matahari: rekaman jujur kamera HP dari balkon rumah sehari-hari.',
    mediumLock:
      'Genuine unedited vertical smartphone video filmed by a real person, not a production: phone camera at arm\'s length with a 24-26mm wide smartphone lens look, deep phone-sensor depth of field, auto-exposure and auto white balance that shift slightly with movement, faint sensor noise in shadows, organic handheld micro-jitter, raw believable everyday social-media realism',
    assetStyleEn:
      'candid unretouched smartphone photo taken in soft window daylight inside a real lived-in room, true-to-life skin texture with visible pores, no beauty filter, no studio lighting',
    characterAdapterEn: 'real everyday Indonesian person filmed on a phone camera, no makeup glamour',
  },
  'kartun-3d': {
    id: 'kartun-3d',
    name: '3D Video Kartun',
    badge: 'Animasi 3D',
    shortDesc: 'Animasi 3D halus, ekspresif, dan cerah ala film animasi modern.',
    previewImage: '/style-previews/kartun-3d.webp',
    previewCaption: 'Contoh Matahari: karakter 3D halus, bulat ekspresif, dan warna cerah ala film animasi.',
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
    previewImage: '/style-previews/animasi-2d.webp',
    previewCaption: 'Contoh Matahari: ilustrasi 2D anime cel-shading dengan garis tegas & langit dramatis.',
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
    previewImage: '/style-previews/minecraft-voxel.webp',
    previewCaption: 'Contoh Matahari: dunia serba kubus 3D voxel piksel lengkap dengan blok awan & pohon.',
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
    previewImage: '/style-previews/clay-stopmotion.webp',
    previewCaption: 'Contoh Matahari: bentuk lilin plastisin buatan tangan dengan tekstur sidik jari.',
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
    previewImage: '/style-previews/miniatur-diorama.webp',
    previewCaption: 'Contoh Matahari: panggung maket diorama skala mungil dengan efek lensa makro.',
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
    previewImage: '/style-previews/iklan-studio.webp',
    previewCaption: 'Contoh Matahari: tata cahaya panggung studio mewah dengan pantulan emas dramatis.',
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
  softSellingName: string;
  marketingName: string;
  tag: string;
  shortDesc: string;
  softSellingShortDesc: string;
  marketingShortDesc: string;
  whyItWorks: string;
  shotOverride: string;
  cameraOverride: string;
  cameraIdOverride: string;
  visualHookEn: string;
  descHookId: string;
  spokenHookId: string;
  spokenHookSoftId: string;
  spokenHookMarketingId: string;
  sfxOverride: string;
}

export const HOOK_STRATEGIES: Record<HookStrategyId, HookStrategyPreset> = {
  'rahasia-pov': {
    id: 'rahasia-pov',
    name: 'Curiosity Gap ("99% Belum Sadar")',
    softSellingName: 'Cerita Rahasia ("Jarang yang Sadar")',
    marketingName: 'POV Rekomendasi ("Wajib Tahu Ini")',
    tag: 'Paling Viral',
    shortDesc: 'Memicu rasa penasaran penonton dengan fakta atau sisi tersembunyi dari topikmu.',
    softSellingShortDesc: 'Membuka dengan insight menarik sehari-hari sebelum mengenalkan produk secara halus di akhir.',
    marketingShortDesc: 'Membuka langsung dengan alasan kuat kenapa banyak orang memilih produkmu.',
    whyItWorks: 'Otak manusia sulit mengabaikan informasi yang terasa eksklusif atau belum lengkap (curiosity gap).',
    shotOverride: 'intimate creator medium close-up, 35mm prime lens, shallow depth of field',
    cameraOverride: 'engaging push-in as the scene reveals the key visual clue of {product}',
    cameraIdOverride: 'Push-in',
    visualHookEn:
      'SCROLL-STOPPING 0.0s CURIOSITY HOOK: immediate expressive lean-in toward the camera as visual clues illustrating "{product}" come into sharp focus, creating instant intrigue like sharing an untold insight',
    descHookId:
      'Detik pertama langsung memancing rasa ingin tahu penonton lewat sisi menarik dari {product}.',
    spokenHookId:
      'Jarang banget yang sadar kalau soal {product}, bagian paling pentingnya justru sering terlewat. Makanya simak sebentar, karena detail kecil ini bakal ubah cara pandangmu.',
    spokenHookSoftId:
      'Jarang yang nyangka kalau kebiasaan kecil sehari-hari ini ternyata bikin semuanya jauh lebih gampang. Awalnya aku juga ragu, sampai akhirnya nemuin pola simpelnya sendiri.',
    spokenHookMarketingId:
      'Wajib tahu soal {product} ini kalau kamu lagi cari solusi yang beneran {adv1}. Biar nggak salah pilih lagi, lihat langsung kenapa banyak orang pindah ke sini.',
    sfxOverride: 'subtle intriguing whoosh and crisp studio focus tone',
  },
  'masalah-relatable': {
    id: 'masalah-relatable',
    name: 'Situasi Relatable ("Pernah Nggak Sih?")',
    softSellingName: 'Curhat Relatable ("Pernah Ngalamin?")',
    marketingName: 'Pain-Point Pembeli -> Solusi Cepat',
    tag: 'Tinggi Share',
    shortDesc: 'Membuka dengan situasi sehari-hari yang langsung bikin penonton merasa "wah gue banget".',
    softSellingShortDesc: 'Curhat masalah harian tanpa terlihat jualan agar penonton betah menyimak sampai akhir.',
    marketingShortDesc: 'Sentuh masalah utama calon pembeli lalu langsung perlihatkan produkmu sebagai jawaban.',
    whyItWorks: 'Konten yang relevan dengan pengalaman pribadi atau keluhan penonton menahan perhatian lebih lama.',
    shotOverride: 'expressive medium close-up, 35mm lens, immediate eye-level creator connection',
    cameraOverride: 'natural handheld snap-focus capturing a relatable everyday moment around {product}',
    cameraIdOverride: 'Handheld',
    visualHookEn:
      'SCROLL-STOPPING 0.0s RELATABLE HOOK: authentic everyday slice-of-life moment illustrating the real situation around "{product}" in the very first second, expressive natural reaction that viewers immediately relate to',
    descHookId:
      'Dibuka dengan situasi keseharian seputar {product} yang dekat dengan pengalaman penonton.',
    spokenHookId:
      'Pernah nggak sih kamu lagi ngadepin urusan {product}, terus bingung kenapa hasilnya selalu mentok? Tenang, kamu nggak sendirian, dan ternyata penyebab utamanya simpel banget.',
    spokenHookSoftId:
      'Pernah nggak sih ngerasa capek sendiri tiap kali harus beresin urusan harian yang itu-itu terus? Dulu aku juga sering stres di situ, sebelum tahu trik simpelnya.',
    spokenHookMarketingId:
      'Stop buang waktu pakai cara lama yang bikin ribet tiap hari. Saatnya kenalan sama {product} yang bikin urusanmu jauh lebih cepat dan {adv1}.',
    sfxOverride: 'crisp everyday foley beat into natural creator room tone',
  },
  'visual-kejutan': {
    id: 'visual-kejutan',
    name: 'Visual Kejutan Detik 0.0 (Pattern Interrupt)',
    softSellingName: 'Momen Visual Estetik Bikin Berhenti Scroll',
    marketingName: 'Close-Up Produk Menggoda Detik 0.0',
    tag: 'Tahan Jempol',
    shortDesc: 'Detik 0.0 langsung dibuka gerakan visual unik & dekat supaya jempol berhenti scroll.',
    softSellingShortDesc: 'Visual pembuka estetik yang memanjakan mata sambil masuk ke alur cerita dengan halus.',
    marketingShortDesc: 'Detik 0.0 langsung memamerkan detail tajam & kualitas unggulan dari produkmu.',
    whyItWorks: 'Gerakan kontras di 1 detik pertama memutus pola scroll otomatis penonton di feed.',
    shotOverride: 'dynamic close-up perspective, 50mm lens, shallow depth of field',
    cameraOverride: 'rapid punchy push-in decelerating into crisp slow-motion focus',
    cameraIdOverride: 'Push-in',
    visualHookEn:
      'SCROLL-STOPPING 0.0s PATTERN-INTERRUPT HOOK: immediate kinetic visual motion right in front of the lens illustrating "{product}" with dramatic light and crisp detail in the first second before settling cleanly into focus',
    descHookId:
      'Detik pertama langsung menyuguhkan visual dinamis seputar {product} agar penonton otomatis berhenti scroll.',
    spokenHookId:
      'Tunggu, jangan di-scroll dulu, coba perhatiin apa yang sebenernya terjadi di balik {product} ini. Begitu lihat detailnya dari dekat, kamu pasti langsung kaget sendiri.',
    spokenHookSoftId:
      'Tunggu sebentar, kadang justru hal kecil yang kelihatannya sederhana ini yang paling ngubah mood seharian. Lihat deh gimana suasana langsung terasa beda dari awal.',
    spokenHookMarketingId:
      'Lihat langsung detail kualitas {product} ini dari dekat, beneran kelihatan {adv1} sejak pandangan pertama. Ini alasan kenapa stoknya selalu cepat habis dicari orang.',
    sfxOverride: 'crisp tactile micro-impact and subtle cinematic whoosh',
  },
  'transformasi-instan': {
    id: 'transformasi-instan',
    name: 'Patahkan Mitos / Sudut Pandang Baru',
    softSellingName: 'Edukasi Cara Lama vs Cara Cerdas',
    marketingName: 'Bukti Sebelum vs Sesudah Instan',
    tag: 'Kontras Kuat',
    shortDesc: 'Membuka dengan mematahkan anggapan umum supaya penonton penasaran mendengar alasannya.',
    softSellingShortDesc: 'Mengedukasi perbedaan cara lama yang melelahkan dibanding pendekatan baru yang lebih santai.',
    marketingShortDesc: 'Kontras hasil nyata begitu produk/layananmu dipakai langsung di layar.',
    whyItWorks: 'Kontras kuat membuat otak penonton penasaran menunggu penjelasan sampai akhir.',
    shotOverride: 'confident creator medium shot, 35mm lens, centered framing',
    cameraOverride: 'whip-reveal camera motion snapping into a crisp focused frame',
    cameraIdOverride: 'Whip pan',
    visualHookEn:
      'SCROLL-STOPPING 0.0s CONTRARIAN HOOK: starts for one beat on a conventional ordinary moment, then snaps cleanly into a vibrant fresh visual perspective on "{product}"',
    descHookId:
      'Membuka dengan kontras perubahan sudut pandang atau hasil nyata seputar {product}.',
    spokenHookId:
      'Banyak orang masih salah paham soal {product}, padahal kenyataan di lapangannya beda jauh banget. Kalau kamu tahu sisi aslinya, kamu nggak bakal kejebak pola lama lagi.',
    spokenHookSoftId:
      'Ternyata selama ini kita sering salah langkah waktu ngatur rutinitas sehari-hari kayak gini. Begitu ganti pendekatannya sedikit aja, bedanya langsung kerasa jauh lebih ringan.',
    spokenHookMarketingId:
      'Cuma butuh hitungan detik buat lihat bedanya sebelum dan sesudah pakai {product} ini. Hasilnya langsung rapi, terasa {adv1}, dan jauh lebih hemat tenaga.',
    sfxOverride: 'energetic snap transition into clean studio ambience',
  },
  'skala-unik': {
    id: 'skala-unik',
    name: 'Pembuka Sinematik Bikin Melirik',
    softSellingName: 'Vibes Sinematik & Mood Cerita',
    marketingName: 'Hero Shot Iklan Kelas Brand Besar',
    tag: 'Visual Mahal',
    shortDesc: 'Kamera meluncur dramatis menembus ruang untuk membangun atmosfer cerita yang kuat.',
    softSellingShortDesc: 'Membangun mood cerita sinematik yang hangat sebelum produk muncul alami di tengah cerita.',
    marketingShortDesc: 'Kamera meluncur rendah sinematik langsung menyorot produk secara megah & meyakinkan.',
    whyItWorks: 'Komposisi sinematik membuat video terlihat bernilai tinggi dan meningkatkan kepercayaan.',
    shotOverride: 'dramatic low-angle cinematic perspective, 24mm wide cinema lens',
    cameraOverride: 'sweeping low-altitude glide moving smoothly into the world of {product}',
    cameraIdOverride: 'Dolly-in',
    visualHookEn:
      'SCROLL-STOPPING 0.0s CINEMATIC HOOK: sweeping cinema camera glides smoothly through the environment into the core scene of "{product}", creating an iconic, immersive opening',
    descHookId:
      'Kamera meluncur sinematik membangun atmosfer ikonik seputar {product} sejak detik pertama.',
    spokenHookId:
      'Bayangin gimana jadinya kalau kita melihat {product} dari sudut pandang yang jauh lebih dekat dan utuh. Di balik suasananya, ada cerita menarik yang jarang dibahas.',
    spokenHookSoftId:
      'Ada satu momen tenang di tengah hari yang akhirnya bikin aku sadar pentingnya punya ritme yang pas. Semua berawal dari perubahan kecil yang terasa sederhana banget.',
    spokenHookMarketingId:
      'Kenalan lebih dekat sama {product}, dirancang khusus buat kamu yang mengutamakan kualitas {adv1}. Setiap detailnya dibuat rapi supaya pengalaman pakainya terasa berkelas.',
    sfxOverride: 'cinematic smooth air glide and warm atmospheric swell',
  },
  'bukti-langsung': {
    id: 'bukti-langsung',
    name: 'To The Point Tanpa Basa-Basi',
    softSellingName: 'Tips Praktis Langsung ke Inti',
    marketingName: 'Demo Keunggulan & Promo Tanpa Intro',
    tag: 'To The Point',
    shortDesc: 'Tanpa sapaan bertele-tele, detik pertama langsung masuk ke inti bahasan utama.',
    softSellingShortDesc: 'Langsung bagikan tips praktis yang bermanfaat bagi penonton sebelum menyentuh produk.',
    marketingShortDesc: 'Tanpa intro bertele-tele, detik pertama langsung mendemonstrasikan produk & keunggulannya.',
    whyItWorks: 'Penonton TikTok/Reels menyukai video yang langsung memberi bukti & isi sejak detik pertama.',
    shotOverride: 'crisp 45-degree creator framing, 50mm prime lens',
    cameraOverride: 'steady precision tracking focused tightly on the main subject',
    cameraIdOverride: 'Slow motion',
    visualHookEn:
      'SCROLL-STOPPING 0.0s VALUE-FIRST HOOK: zero-delay visual illustration right from frame one demonstrating {advantages_en} of "{product}" with crisp clarity',
    descHookId:
      'Tanpa intro panjang, detik pertama langsung masuk ke inti {product} ({advantages}).',
    spokenHookId:
      'Tanpa basa-basi, ini poin paling penting soal {product} yang wajib kamu pahami sekarang juga. Begitu tahu intinya, kamu langsung paham kenapa ini sering dibahas.',
    spokenHookSoftId:
      'Langsung ke intinya, ada satu tips praktis buat kamu yang pengen urusan harian beres lebih cepat. Caranya gampang banget dan bisa langsung kamu coba hari ini.',
    spokenHookMarketingId:
      'Tanpa intro panjang, langsung buktiin sendiri kenapa {product} jadi andalan utama soal {adv1}. Dari tampilan sampai performanya, semua dibuat buat hasil yang nyata.',
    sfxOverride: 'clean modern creator pop and crisp room tone',
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
  voiceLock: string;
}

export const CHARACTERS: Record<string, CharacterPreset> = {
  sinta: {
    id: 'sinta',
    name: 'Sinta',
    desc: 'Perempuan 25 thn, rambut hitam sebahu belah tengah, sweter rajut krem',
    art: 'char-1',
    lock: 'Sinta, a 25-year-old Indonesian woman, slender build, oval face, warm golden-tan complexion, expressive dark-brown almond eyes, neat arched dark eyebrows, sleek straight jet-black shoulder-length bob hair with a clean center part tucked behind her left ear, no bangs, no glasses, wearing a solid cream crew-neck knit sweater over a crisp white shirt collar, dark charcoal tailored trousers, and a small silver wristwatch on her left wrist',
    voiceLock: 'consistent warm friendly 25-year-old female Indonesian voice timbre',
  },
  raka: {
    id: 'raka',
    name: 'Raka',
    desc: 'Laki-laki 27 thn, rambut pendek rapi, jaket kasual biru dongker & kaos putih',
    art: 'char-2',
    lock: 'Raka, a 27-year-old Indonesian man, lean athletic build, clean-shaven defined jawline, warm tan skin, short neat tapered black hair parted cleanly on the left, thick neat eyebrows, no glasses, wearing a solid navy-blue casual overshirt unbuttoned over a plain crisp white crew-neck t-shirt, dark slate chinos, and a matte-black watch on his left wrist',
    voiceLock: 'consistent energetic clear 27-year-old male Indonesian voice timbre',
  },
  laras: {
    id: 'laras',
    name: 'Laras',
    desc: 'Perempuan 24 thn, hijab biru muda rapi, kemeja putih panjang',
    art: 'char-3',
    lock: 'Laras, a 24-year-old Indonesian woman, gentle oval face, fair-warm complexion, bright dark-brown eyes, no glasses, wearing a neatly draped pastel sky-blue matte chiffon hijab covering her shoulders cleanly, paired with a crisp white long-sleeve button-up tunic shirt and light-beige tailored trousers',
    voiceLock: 'consistent soft articulate 24-year-old female Indonesian voice timbre',
  },
  arjuna: {
    id: 'arjuna',
    name: 'Arjuna',
    desc: 'Kreator muda 22 thn, kacamata bulat tipis, rambut ikal rapi, hoodie hitam',
    art: 'char-2',
    lock: 'Arjuna, a 22-year-old Indonesian male creator, slim build, warm tan skin, clean-shaven, neat wavy textured black hair with light forehead fringe, wearing thin round black-rimmed eyeglasses, a solid matte-black pullover hoodie, and dark charcoal cargo pants',
    voiceLock: 'consistent casual enthusiastic 22-year-old male Indonesian voice timbre',
  },
  nadia: {
    id: 'nadia',
    name: 'Nadia',
    desc: 'Profesional 29 thn, kacamata tipis emas, rambut ikat rapi, blazer abu modern',
    art: 'char-1',
    lock: 'Nadia, a 29-year-old Indonesian professional woman, defined oval face, warm olive skin, sleek jet-black hair tied in a neat low ponytail, wearing thin gold-rimmed round eyeglasses, a tailored stone-grey blazer over a solid black crew-neck top, and dark trousers',
    voiceLock: 'consistent confident crisp 29-year-old female Indonesian voice timbre',
  },
  bima: {
    id: 'bima',
    name: 'Bima',
    desc: 'Laki-laki 40 thn, kacamata kotak tipis, rambut pendek rapi, kemeja cokelat',
    art: 'char-4',
    lock: 'Bima, a 40-year-old Indonesian man, approachable warm smile, oval clean-shaven face, neatly combed short black hair with subtle silver at the temples, wearing thin black rectangular eyeglasses and a neat modern earth-brown collared casual shirt with dark trousers',
    voiceLock: 'consistent calm trustworthy 40-year-old male Indonesian voice timbre',
  },
};

const ID_TRAIT_MAP: Array<[RegExp, string]> = [
  [/\bcowok\b|\bpria\b|\blaki[- ]?laki\b/gi, 'young Indonesian man'],
  [/\bcewek\b|\bwanita\b|\bperempuan\b/gi, 'young Indonesian woman'],
  [/\banak kecil\b|\bocil\b|\banak[- ]?anak\b/gi, ' cheerful 8-year-old Indonesian child'],
  [/\bbapak[- ]?bapak\b/gi, 'friendly 42-year-old Indonesian man'],
  [/\bibu[- ]?ibu\b/gi, 'friendly 38-year-old Indonesian woman'],
  [/\bberhijab\b|\bhijab\b|\bkerudung\b/gi, 'wearing a neat solid-colored hijab'],
  [/\bkacamata bulat\b/gi, 'wearing thin round eyeglasses'],
  [/\bkacamata\b|\bberkacamata\b/gi, 'wearing neat thin-framed eyeglasses'],
  [/\brambut ikal\b|\brambut keriting\b/gi, 'neat wavy curly black hair'],
  [/\brambut pendek\b/gi, 'short neat black hair'],
  [/\brambut panjang\b/gi, 'long straight black hair'],
  [/\brambut sebahu\b/gi, 'shoulder-length straight black hair'],
  [/\bhoodie hitam\b/gi, 'wearing a solid matte-black pullover hoodie'],
  [/\bhoodie\b/gi, 'wearing a clean solid pullover hoodie'],
  [/\bjaket hitam\b/gi, 'wearing a sleek black casual jacket'],
  [/\bjaket\b/gi, 'wearing a neat casual jacket'],
  [/\bkaos putih\b/gi, 'wearing a crisp plain white crew-neck t-shirt'],
  [/\bkaos hitam\b/gi, 'wearing a plain matte-black crew-neck t-shirt'],
  [/\bkemeja putih\b/gi, 'wearing a crisp white collared shirt'],
];

export function buildCustomCharacterLock(
  rawCustom: string,
  vStyle: VideoStylePreset
): { lock: string; voiceLock: string } {
  const clean = rawCustom.trim();
  let translated = clean;
  for (const [pattern, replacement] of ID_TRAIT_MAP) {
    translated = translated.replace(pattern, replacement);
  }
  const lower = clean.toLowerCase();
  const isFemale =
    /\b(cewek|wanita|perempuan|ibu|hijab|kerudung|woman|girl|female|she)\b/.test(lower);
  const hasGlasses = /\b(kacamata|glasses|eyeglasses|spectacles)\b/.test(lower);
  const eyewearAnchor = hasGlasses ? 'keep exact same eyeglasses frame in every shot' : 'no glasses';

  return {
    lock: `Main Character (${translated}; ${eyewearAnchor}; keep exact same facial bone structure, eye shape, skin tone, hairstyle, and identical clothing colors unchanged across every scene), ${vStyle.characterAdapterEn}`,
    voiceLock: isFemale
      ? 'consistent clear natural female Indonesian voice timbre'
      : 'consistent clear natural male Indonesian voice timbre',
  };
}

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

export const CREATOR_ANGLE_SUGGESTIONS = [
  'Fakta jarang diketahui',
  'Relatable sehari-hari',
  'Penjelasan simpel',
  'Mudah dipraktikkan',
  'Sudut pandang baru',
  'Contoh nyata',
  'Langkah demi langkah',
  'Bikin penasaran',
  'Solusi praktis',
  'Logis & mudah paham',
  'Cocok buat pemula',
];

export const MARKETING_ADVANTAGE_SUGGESTIONS = [
  'Praktis & cepat',
  'Mudah dipakai',
  'Hemat biaya',
  'Hasil instan',
  'Fitur lengkap',
  'Kualitas premium',
  'Terbukti efektif',
  'Hemat waktu',
  'Desain modern',
  'Tahan lama',
  'Garansi aman',
  'Harga terjangkau',
];

export const CREATOR_CTA_SUGGESTIONS = [
  'Menurut kamu gimana? Tulis di kolom komentar',
  'Save video ini biar gampang dicari lagi nanti',
  'Follow buat bahasan seru lainnya setiap hari',
  'Share ke temanmu yang butuh bahasan ini',
];

export const SOFT_SELLING_CTA_SUGGESTIONS = [
  'Yang penasaran sama yang aku pakai, infonya aku taruh di bio ya',
  'Kalau kamu lagi butuh juga, boleh intip detailnya di bio',
  'Save dulu videonya siapa tahu nanti kepakai',
  'Ada yang udah pernah coba juga? Cerita di komentar ya',
];

export const HARD_SELLING_CTA_SUGGESTIONS = [
  'Klik keranjang kuning sekarang mumpung masih promo',
  'Checkout hari ini lewat link di bio sebelum kehabisan',
  'Ambil promonya sekarang juga di link bio',
  'Hubungi kami di link bio untuk pesan sekarang',
];

export const MARKETING_CTA_SUGGESTIONS = HARD_SELLING_CTA_SUGGESTIONS;

export const ADVANTAGE_SUGGESTIONS = CREATOR_ANGLE_SUGGESTIONS;
export const CTA_SUGGESTIONS = CREATOR_CTA_SUGGESTIONS;

const ADV_EN: Record<string, string> = {
  'fakta jarang diketahui': 'surprising lesser-known facts and insights',
  'relatable sehari-hari': 'relatable everyday real-life context',
  'penjelasan simpel': 'simple, crystal-clear visual explanation',
  'mudah dipraktikkan': 'easy-to-apply practical actionability',
  'sudut pandang baru': 'fresh eye-opening perspective',
  'contoh nyata': 'concrete real-world illustration',
  'langkah demi langkah': 'clear step-by-step progression',
  'bikin penasaran': 'high-curiosity narrative tension',
  'solusi praktis': 'practical everyday solution',
  'logis & mudah paham': 'clear logical breakdown that is easy to grasp',
  'cocok buat pemula': 'beginner-friendly clarity',
  'praktis & cepat': 'fast, practical, and effortless workflow',
  'mudah dipakai': 'intuitive and easy to use',
  'hemat biaya': 'cost-effective great value',
  'hasil instan': 'instant visible results',
  'fitur lengkap': 'complete all-in-one features',
  'kualitas premium': 'premium build and craftsmanship',
  'terbukti efektif': 'proven effective performance',
  'hemat waktu': 'time-saving efficiency',
  'desain modern': 'sleek modern design',
  'aman & terpercaya': 'safe, reliable, and trustworthy',
  'garansi aman': 'backed by reliable warranty and trust',
  'harga terjangkau': 'accessible great-value pricing',
  'cocok untuk pemula': 'beginner-friendly accessibility',
  gratis: 'free and accessible',
  otomatis: 'smart automated workflow',
  akurat: 'high accuracy and precision',
  serbaguna: 'versatile multi-purpose utility',
  'manis pas': 'perfectly balanced sweetness',
  'gula aren asli': 'made with real palm sugar',
  segar: 'refreshing and fresh',
  murah: 'great value',
  praktis: 'convenient and easy to use',
  premium: 'premium quality craftsmanship',
  sehat: 'wholesome and healthy',
  renyah: 'crispy texture',
  pedas: 'bold spicy kick',
  'pedas nampol': 'bold spicy kick',
  lembut: 'soft and smooth finish',
  wangi: 'pleasant aroma',
  'tahan lama': 'long-lasting durability',
  halal: 'clean certified preparation',
  creamy: 'smooth rich consistency',
  gurih: 'savory flavor',
  lumer: 'smooth rich texture',
  hangat: 'warm and inviting',
  kental: 'rich consistency',
  'porsi besar': 'generous capacity',
  enak: 'pleasant experience',
  original: 'authentic original quality',
  alami: 'natural materials',
  awet: 'long-lasting quality',
};

// ---------- UGC Realism (kamera HP asli, kulit & perilaku manusia nyata) ----------
const UGC_CAMERA_REALISM =
  'UGC REALISM LOCK — a real person\'s own phone video, never an ad shoot: phone held or propped on a shelf, slightly off-center framing with small reframing; only available real-world light (window daylight or a ceiling lamp), no studio lights; a real lived-in Indonesian room with ordinary believable clutter';
const UGC_HUMAN_REALISM =
  'HUMAN REALISM: true-to-life skin with visible pores, faint blemishes, natural shine and stray baby hairs; natural asymmetric face; normal blinking, small head tilts, glancing at the product or away while thinking, spontaneous small smiles; anatomically correct hands';
const UGC_SPEECH_REALISM =
  'unscripted casual delivery like a voice note to a friend, natural micro-pauses and breaths, light Indonesian fillers (eh, jujur, nah), recorded by the phone\'s built-in mic with soft room reverb, never an announcer voice';
const UGC_NEGATIVES_FULL =
  'AVOID: CGI or 3D-render look, waxy airbrushed skin, beauty filter, doll-like symmetrical face, studio or rim light, cinematic color grade, cinema bokeh, slow motion, lens flares, gimbal or drone moves, model posing, warped hands, morphing product logo.';
const UGC_NEGATIVES_HUMAN =
  'AVOID: waxy plastic or airbrushed skin, beauty-filter smoothing, perfectly symmetrical doll face, model-like posing, warped hands or extra fingers, morphing product logo.';

const PHOTOREAL_STYLES: VideoStyleId[] = ['real-live', 'real-ugc', 'iklan-studio'];

/**
 * Realism for UGC: the phone-camera style gets the full lock; the UGC template filmed in another
 * photoreal style gets human/skin/speech realism only (its camera look stays as chosen).
 */
export function resolveRealism(
  videoStyle: VideoStyleId,
  templateId?: string
): Pick<Bible, 'realismLock' | 'speechRealism' | 'negativeExtra'> {
  if (videoStyle === 'real-ugc') {
    return {
      realismLock: `${UGC_CAMERA_REALISM}. ${UGC_HUMAN_REALISM}`,
      speechRealism: UGC_SPEECH_REALISM,
      negativeExtra: UGC_NEGATIVES_FULL,
    };
  }
  if (templateId === 'ugc-affiliate' && PHOTOREAL_STYLES.includes(videoStyle)) {
    return {
      realismLock: UGC_HUMAN_REALISM,
      speechRealism: UGC_SPEECH_REALISM,
      negativeExtra: UGC_NEGATIVES_HUMAN,
    };
  }
  return {};
}

export function buildCharacterAssetPrompt(
  characterLock: string,
  vStyle: VideoStylePreset,
  palette?: string
): string {
  if (vStyle.id === 'real-ugc') {
    return cleanSingleLinePrompt(
      `Candid unretouched smartphone photo of ${characterLock}, rendered as ${vStyle.assetStyleEn}, waist-up facing the phone camera naturally with full face, hair, and upper outfit clearly visible, plain lived-in room background, true-to-life skin with visible pores, no text, no watermark.`
    );
  }
  const bg = palette ? `solid clean neutral background matching ${palette}` : 'solid clean neutral background';
  return cleanSingleLinePrompt(
    `Clean character model reference portrait of ${characterLock}, rendered in ${vStyle.assetStyleEn}, waist-up front-facing natural pose showing full face, hair, and upper outfit clearly, ${bg}, sharp consistent character sheet details, no text, no watermark.`
  );
}

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
  if (clean.length === 0) return 'isi bahasan utamanya';
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
  return out.length > 0 ? joinEn(out) : 'clear, engaging creator storytelling and visual clarity';
}

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizeAnswers(input: Answers): Answers {
  const a: Answers = { ...input };
  a.contentMode = a.contentMode === 'marketing' ? 'marketing' : 'creator';
  if (a.contentMode === 'marketing') {
    a.sellingStyle = a.sellingStyle === 'hard' ? 'hard' : 'soft';
  } else {
    a.sellingStyle = undefined;
  }
  a.product = (a.product || '').trim();
  if (!a.videoStyle || !VIDEO_STYLES[a.videoStyle]) {
    a.videoStyle = 'real-live';
  }
  if (!a.hookStyle || !HOOK_STRATEGIES[a.hookStyle]) {
    a.hookStyle = 'rahasia-pov';
  }
  if (a.durationS !== 15 && a.durationS !== 20 && a.durationS !== 30 && a.durationS !== 60) {
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
  if (a.voice !== 'dialog' && a.voice !== 'narasi') {
    a.voice = 'none';
  }
  if (a.voice === 'dialog') {
    a.cast = 'person';
  }
  if (a.cast !== 'person') {
    a.cast = 'product';
  }
  if (!a.cta || !a.cta.trim()) {
    if (a.contentMode === 'marketing') {
      a.cta =
        a.sellingStyle === 'hard'
          ? 'Klik keranjang kuning sekarang mumpung masih promo'
          : 'Yang penasaran sama yang aku pakai, infonya aku taruh di bio ya';
    } else {
      a.cta = 'Menurut kamu gimana? Tulis di kolom komentar';
    }
  } else {
    a.cta = a.cta.trim();
  }
  a.advantages = (a.advantages || []).map((x) => x.trim()).filter(Boolean);
  if (a.seriesMode === 'series') {
    a.seriesTitle = (a.seriesTitle || '').trim() || a.product;
    const n = Math.floor(Number(a.episodeNumber) || 1);
    a.episodeNumber = Math.min(Math.max(n, 1), 99);
    a.episodeGoal = (a.episodeGoal || '').trim();
    a.previousEpisodes = (a.previousEpisodes || []).slice(-MAX_RECAPS);
  } else {
    a.seriesMode = 'single';
    a.seriesTitle = undefined;
    a.episodeNumber = undefined;
    a.episodeGoal = undefined;
    a.previousEpisodes = undefined;
    a.continuity = undefined;
  }
  return a;
}

const MAX_RECAPS = 3;

function limitWords(text: string, max: number): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length <= max) return words.join(' ');
  return `${words.slice(0, max).join(' ').replace(/[,;:]+$/, '')}...`;
}

function firstSentence(text: string): string {
  const m = text.trim().match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
}

function stripTrailingPunct(text: string): string {
  return text.trim().replace(/[.!?…]+$/, '');
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** First `max` words without ellipsis or trailing punctuation, for building spoken lines. */
function clipWords(text: string, max: number): string {
  return stripTrailingPunct(limitWords(stripTrailingPunct(text), max).replace(/\.\.\.$/, ''));
}

/** Lower-cases the first letter for mid-sentence use, except when the text starts with a name. */
function lowerFirst(s: string, keepNames: Array<string | undefined> = []): string {
  if (!s) return s;
  const firstWord = s.split(/\s+/)[0].toLowerCase();
  const names = keepNames.filter(Boolean).map((n) => n!.split(/\s+/)[0].toLowerCase());
  if (names.includes(firstWord)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Final visual moment of an episode, with the long character lock shortened to the name. */
export function describeEndState(actionEn: string, bible: Pick<Bible, 'characterLock' | 'characterName'>): string {
  let text = actionEn;
  if (bible.characterLock) {
    text = text.split(bible.characterLock).join(bible.characterName || 'the main character');
  }
  return limitWords(text, 45);
}

/**
 * Episodes after the first rotate through the template's other middle beats so each part says
 * something new even without the AI server; the opening hook and closing beat stay in place.
 */
function rotateMiddleRoles(template: Template, roles: string[], episodeNumber?: number): string[] {
  if (!episodeNumber || episodeNumber <= 1 || roles.length < 3) return roles;
  const first = roles[0];
  const last = roles[roles.length - 1];
  const pool = template.roles.map((r) => r.role).filter((r) => r !== first && r !== last);
  const middleCount = roles.length - 2;
  if (pool.length <= middleCount) return roles;
  const start = ((episodeNumber - 1) * middleCount) % pool.length;
  const middle = Array.from({ length: middleCount }, (_, k) => pool[(start + k) % pool.length]);
  return [first, ...middle, last];
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

export interface ScenePacingContext {
  sceneIdx: number;
  totalScenes: number;
  prevLabel?: string;
  nextLabel?: string;
  /** Nomor episode bila video berseri. */
  episodeNumber?: number;
}

function buildPacingAndToneDirectives(ctx?: ScenePacingContext): {
  visualPacing: string;
  vocalTone: string;
} {
  const idx = ctx?.sceneIdx ?? 0;
  const total = Math.max(ctx?.totalScenes ?? 1, 1);
  const isFirst = idx === 0;
  const isLast = total > 1 && idx >= total - 1;
  const prevNote = ctx?.prevLabel ? ` from previous beat "${ctx.prevLabel}"` : '';
  const nextNote = ctx?.nextLabel ? ` into next beat "${ctx.nextLabel}"` : '';
  const ep = ctx?.episodeNumber;

  if (isFirst && ep && ep > 1) {
    return {
      visualPacing: `8-Second Clip Pacing (Episode ${ep} Cold Open, Scene 1 of ${total}): 0.0s-2.0s picks up instantly where the previous episode ended with the same pose, wardrobe and location, no re-introduction; 2.0s-6.5s a fresh complication or reveal pushes the story forward with lively expressive motion; 6.5s-8.0s forward-leaning handoff${nextNote} with no freeze.`,
      vocalTone: `8-second spoken cadence (starts cleanly at 0.3s, fills 0.3s-7.4s with zero dead air, final word lands by 7.5s); OPENING TONE: quick confident "previously" recap in one breath as if the viewer already knows the character, never a fresh greeting; CLOSING TONE: curious forward-leaning intonation${nextNote} that keeps the story open`,
    };
  }

  if (isLast && ep) {
    return {
      visualPacing: `8-Second Clip Pacing (Episode ${ep} Ending, Scene ${idx + 1} of ${total}): 0.0s-2.0s seamless continuation${prevNote}; 2.0s-6.0s small payoff of this episode, then a sudden unresolved twist, discovery or interruption; 6.0s-8.0s hold on a tense or surprised reaction looking toward the twist so the episode ends on an open loop.`,
      vocalTone: `8-second spoken cadence (starts cleanly at 0.3s, fills 0.3s-7.3s, final word lands by 7.4s with a short charged pause until 8.0s); OPENING TONE: seamless continuation${prevNote} with the exact same voice and zero restart greeting; CLOSING TONE: suspenseful rising cliffhanger cadence that leaves the question unanswered and invites the viewer to the next part, never a finished resolved ending`,
    };
  }

  if (isFirst) {
    return {
      visualPacing: `8-Second Clip Pacing (Scene 1 of ${total}, Opening Hook): 0.0s-2.5s immediate scroll-stopping entry with crisp eye contact and expressive gesture; 2.5s-6.5s rich substantive visual development maintaining lively motion; 6.5s-8.0s smooth forward-leaning beat transition${nextNote} with live expressive gaze and no abrupt freeze.`,
      vocalTone: `8-second spoken cadence (starts cleanly at 0.3s, steady articulate conversational pace filling 0.3s-7.4s with zero dead air, finishes the final word cleanly by 7.5s with 0.5s natural breath tail so nothing is ever cut off at 8.0s); OPENING TONE: bright, energetic, curiosity-sparking hook voice from the first syllable; CLOSING TONE: warm forward-leaning bridging intonation${nextNote} so the clip stays open and pulls naturally into Scene 2 without sounding finished`,
    };
  }

  if (isLast) {
    return {
      visualPacing: `8-Second Clip Pacing (Scene ${idx + 1} of ${total}, Final Closing): 0.0s-2.0s seamless visual continuation${prevNote} with warm settled confidence; 2.0s-6.8s clear decisive payoff gesture reinforcing the takeaway and call-to-action; 6.8s-8.0s natural warm smile and gentle nod hold so the video ends gracefully.`,
      vocalTone: `8-second spoken cadence (starts cleanly at 0.3s, steady warm conversational pace filling 0.3s-7.3s without rushing, lands the final word cleanly by 7.4s with 0.6s relaxed quiet room tail until 8.0s); OPENING TONE: seamless confident continuation${prevNote} carrying the exact same voice pitch and warmth with zero restart greeting; CLOSING TONE: clear, warm, resolved downward closing cadence on the final phrase so the ending feels complete and satisfying`,
    };
  }

  return {
    visualPacing: `8-Second Clip Pacing (Scene ${idx + 1} of ${total}, Continuous Story Beat): 0.0s-2.0s seamless visual entry continuing naturally${prevNote} with matching energy and posture; 2.0s-6.5s substantive expressive explanation and concrete visual demonstration filling the frame with purposeful movement; 6.5s-8.0s smooth anticipatory beat handoff${nextNote} keeping eye contact and motion fluid.`,
    vocalTone: `8-second spoken cadence (starts cleanly at 0.3s, steady rich conversational Indonesian pace filling 0.3s-7.4s with zero awkward silence, finishes the last word cleanly by 7.5s with 0.5s natural breath room so no syllable is clipped at 8.0s); OPENING TONE: seamless mid-story continuation${prevNote} matching the exact prior voice timbre, pitch, and flow with zero restart greeting; CLOSING TONE: open connective cadence${nextNote} that hands off smoothly to the next clip without dropping dead or sounding final`,
  };
}

export function buildSceneVideoPrompt(
  bible: Bible,
  scene: Pick<Scene, 'shot' | 'camera' | 'dialogue' | 'sfx' | 'chainFromPrev'> & { idx?: number },
  actionEn: string,
  voice: Answers['voice'],
  pacingCtx?: ScenePacingContext
): string {
  const parts: string[] = [NEGATIVES_START];
  const resolvedPacingCtx: ScenePacingContext | undefined =
    pacingCtx ??
    (typeof scene.idx === 'number'
      ? { sceneIdx: scene.idx, totalScenes: Math.max(scene.idx + 2, 3) }
      : undefined);
  const { visualPacing, vocalTone } = buildPacingAndToneDirectives(resolvedPacingCtx);

  // 1. Medium / Video Style Lock comes FIRST so Veo 3.1 immediately locks 2D/3D/Minecraft/Live-Action medium
  parts.push(`Visual Medium & Render Style: ${bible.videoStyleLock}.`);
  if (bible.realismLock) {
    parts.push(`${bible.realismLock}.`);
  }

  // 2. Forensic Character DNA Anchor placed at TOP HIGH-ATTENTION ZONE of EVERY SINGLE SCENE PROMPT!
  if (bible.characterLock) {
    parts.push(
      `LOCKED CHARACTER IDENTITY (SAME EXACT PERSON IN EVERY SCENE — KEEP IDENTICAL FACE, HAIR, AGE, EYEWEAR, SKIN TONE, AND OUTFIT): ${bible.characterLock}.`
    );
  }
  if (bible.seriesLock) {
    parts.push(`${bible.seriesLock}.`);
  }

  if (scene.chainFromPrev) {
    parts.push(
      'Seamless continuation from the attached Start frame: preserve exact subject position, character face & clothing, visual style, lighting continuity, and environment.'
    );
  }

  // 3. Ensure action explicitly binds to the locked character if active so no random person/hands appear
  let boundAction = actionEn.replace(/\.+$/, '');
  if (bible.characterLock) {
    const cName = (bible.characterName || '').toLowerCase();
    const lowerAct = boundAction.toLowerCase();
    const mentionsCharacter =
      (cName && lowerAct.includes(cName)) ||
      lowerAct.includes('main character') ||
      lowerAct.includes(bible.characterLock.slice(0, 24).toLowerCase());
    if (!mentionsCharacter) {
      boundAction = `Featuring the exact same locked character ${bible.characterName || 'Main Character'} (with identical face, hair, and outfit locked above) in the scene: ${boundAction}`;
    }
  }

  parts.push(`${capFirst(scene.shot)}. ${capFirst(boundAction)}.`);
  parts.push(visualPacing);
  parts.push(`Environment: ${bible.setting}.`);
  parts.push(`Lighting & Color: ${bible.lighting}; ${bible.style}; color palette of ${bible.palette}.`);
  parts.push(`Camera Choreography: ${scene.camera}, one fluid continuous 8-second shot.`);
  parts.push(`${bible.productLock}.`);

  const audio: string[] = [];
  if (scene.sfx) audio.push(scene.sfx);
  if (bible.music) {
    audio.push(bible.speechRealism ? `${bible.music} kept barely audible under the voice` : bible.music);
  }
  const speechStyle = bible.speechRealism ? `; ${bible.speechRealism}` : '';
  if (scene.dialogue) {
    if (voice === 'narasi') {
      audio.push(
        `a consistent clear engaging Indonesian narrator voice-over (${vocalTone}${speechStyle}) says in natural Bahasa Indonesia: "${scene.dialogue}"`
      );
    } else {
      const voiceAnchor =
        bible.characterVoiceLock || 'consistent natural Indonesian voice timbre across all clips';
      audio.push(
        `the exact same character ${bible.characterName || ''} speaks naturally in fluent Bahasa Indonesia (${voiceAnchor}; ${vocalTone}${speechStyle}) with accurate lip sync and matching facial expressions: "${scene.dialogue}"`
      );
    }
  }
  if (audio.length > 0) {
    parts.push(`Audio: ${audio.join('; ')}.`);
  }

  if (bible.characterLock) {
    parts.push(
      `${NEGATIVES_END} ZERO CHARACTER DRIFT: never change the character's face geometry, hairstyle, glasses/hijab, skin tone, or outfit colors between shots.`
    );
  } else {
    parts.push(NEGATIVES_END);
  }
  if (bible.negativeExtra) {
    parts.push(bible.negativeExtra);
  }

  return cleanSingleLinePrompt(parts.join(' '));
}

function defaultNarration(role: string, a: Answers, advId: string, mode: ContentMode): string {
  const cleanCta = a.cta.replace(/[.!]+$/, '');
  if (mode === 'marketing') {
    switch (role) {
      case 'produk':
      case 'kemasan':
      case 'buka':
      case 'transisi':
      case 'keluhan':
      case 'tips':
        return `Nah, kenalan langsung sama ${a.product}, solusi yang dirancang rapi supaya aktivitas harianmu jauh lebih praktis. Begitu dipakai pertama kali, bedanya langsung kerasa nyata.`;
      case 'manfaat':
      case 'pakai':
      case 'sesudah':
      case 'isi':
      case 'keunggulan':
      case 'jembatan':
        return `Keunggulan utamanya langsung kelihatan jelas karena ${a.product} ini ${advId}. Makanya banyak orang yang begitu coba sekali langsung betah pakai terus setiap hari.`;
      case 'detail':
      case 'rekomendasi':
      case 'bukti':
        return `Kalau diperhatiin dari dekat, detail kualitas ${a.product} ini beneran rapi dan konsisten. Nggak heran ini jadi pilihan paling aman buat kebutuhanmu sekarang.`;
      case 'ajakan':
        return `Jadi daripada terus pakai cara lama yang bikin ribet, mending langsung rasain sendiri bedanya ${a.product} sekarang juga. ${cleanCta}!`;
      default:
        return `Menariknya lagi, ${a.product} hadir membawa kualitas ${advId} yang bikin urusan sehari-hari jauh lebih tenang dan tertata.`;
    }
  }

  switch (role) {
    case 'latar':
    case 'miskonsepsi':
    case 'realita':
    case 'ekspektasi':
    case 'poin1':
    case 'alasan':
    case 'produk':
    case 'suasana':
    case 'transisi':
      return `Nah, kalau kita perhatiin lebih dekat, bahasan soal ${a.product} ini punya sisi penting yang sering banget dilewatin orang. Padahal dari sinilah semua alurnya bermula.`;
    case 'konflik':
    case 'inti':
    case 'perspektif':
    case 'poin2':
    case 'uji':
    case 'manfaat':
    case 'sesudah':
      return `Intinya justru ada di bagian ${advId} yang bikin semuanya langsung masuk akal. Begitu kamu paham pola utamanya, cara melihat ${a.product} bakal terasa jauh lebih jernih.`;
    case 'puncak':
    case 'contoh':
    case 'dampak':
    case 'solusi':
    case 'hasil':
    case 'nilai':
    case 'detail':
      return `Begitu pola soal ${a.product} ini kamu terapin langsung di keseharian, perubahannya langsung kerasa signifikan. Hal kecil yang konsisten ternyata dampaknya jauh lebih besar.`;
    case 'penutup':
    case 'diskusi':
    case 'outro':
    case 'simpan':
    case 'ajakan':
      return `Nah, itu dia gambaran utuh soal ${a.product} yang semoga bisa langsung kasih sudut pandang baru buat kamu hari ini. ${cleanCta}!`;
    default:
      return `Terus kalau kita telusuri lebih jauh, topik ${a.product} ini selalu menarik karena menyentuh sisi ${advId} yang dekat dengan keseharian kita.`;
  }
}

function buildAssets(bible: Bible, a: Answers, vibe: VibePreset, vStyle: VideoStylePreset): Asset[] {
  const out: Asset[] = [];
  const isMarketing = bible.contentMode === 'marketing';

  if (bible.characterLock) {
    out.push({
      id: 'character',
      name: `Gambar Patokan Karakter (${bible.characterName || 'Kreator'})`,
      upload: false,
      purpose: `Buat 1 potret patokan karakter "${bible.characterName || 'Kreator'}" bergaya "${vStyle.name}" (gratis 0 credit), lalu lampirkan terus sebagai Ingredients di setiap adegan agar wajah & pakaian 100% konsisten.`,
      prompt: buildCharacterAssetPrompt(bible.characterLock, vStyle, vibe.palette),
    });
  }

  out.push({
    id: 'product',
    name: isMarketing ? 'Gambar Patokan Produk / Layanan' : 'Gambar Patokan Visual Topik / Latar',
    upload: a.hasPhoto,
    purpose: a.hasPhoto
      ? isMarketing
        ? 'Unggah foto produk/layanan aslimu ke Google Flow supaya bentuk dan warnanya dipakai konsisten di setiap klip.'
        : 'Unggah gambar referensi topikmu ke Google Flow supaya nuansa visualnya dipakai konsisten di setiap klip.'
      : isMarketing
        ? `Buat 1 gambar patokan produk "${bible.product}" bergaya "${vStyle.name}" (gratis 0 credit) supaya wujud produk konsisten di semua adegan.`
        : `Buat 1 gambar patokan visual topik "${bible.product}" bergaya "${vStyle.name}" (gratis 0 credit) agar suasana & elemen visual konsisten di semua adegan.`,
    prompt: isMarketing
      ? cleanSingleLinePrompt(
          `Hero commercial reference sheet of "${bible.product}", rendered in ${vStyle.assetStyleEn}, centered composition on ${vibe.surface}, ${vibe.lighting}, color palette of ${vibe.palette}, exact consistent shape, colors, and clean details, no text overlays, no watermark.`
        )
      : cleanSingleLinePrompt(
          `Key visual concept & scene reference illustrating the topic "${bible.product}", rendered in ${vStyle.assetStyleEn}, set in ${vibe.setting}, ${vibe.lighting}, color palette of ${vibe.palette}, coherent props and visual details, no text overlays, no watermark.`
        ),
  });

  return out;
}

function buildSceneTips(
  scene: Pick<Scene, 'idx' | 'role' | 'dialogue' | 'chainFromPrev'>,
  a: Answers
): string[] {
  const tips: string[] = [];
  const ep = a.seriesMode === 'series' ? (a.episodeNumber ?? 1) : 0;
  if (scene.idx === 0 && ep > 1) {
    tips.push(
      `Biar sambungannya mulus dari Part ${ep - 1}: buka klip terakhir Part ${ep - 1}, simpan frame paling akhirnya (Save frame), lalu pakai sebagai gambar Start di mode Frames untuk adegan ini.`
    );
  }
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

function buildCaption(
  a: Answers,
  advId: string,
  mode: ContentMode
): { caption: string; hashtags: string[] } {
  const cleanCta = a.cta.replace(/[.!]+$/, '');
  const extraContext = a.story?.trim() ? ` ${a.story.trim().replace(/[.!]+$/, '')}.` : '';
  const slug = a.product.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hashtags: string[] = [];
  if (slug) hashtags.push(`#${slug.slice(0, 24)}`);

  if (mode === 'marketing') {
    const caption = `Kenalin ${a.product} — solusi dengan ${advId}.${extraContext} ${cleanCta}!`;
    hashtags.push('#rekomendasi', '#reviewjujur', '#worthit', '#infopromo');
    return { caption, hashtags };
  }

  const caption = `Bahas ${a.product} — mulai dari ${advId}.${extraContext} ${cleanCta}!`;
  hashtags.push('#kontenkreator', '#bahasanseru', '#edukasisingkat', '#fypindonesia');
  return { caption, hashtags };
}

export function buildFlowSteps(
  pack: Omit<Pack, 'steps' | 'guideUpdatedAt'>,
  a: Answers
): GuideStep[] {
  const L = flowGuideData.labels;
  const steps: GuideStep[] = [];
  const ep = pack.episode;
  const isNextEpisode = Boolean(ep && ep.number > 1);

  // 1. Persiapan proyek di Google Flow (episode lanjutan memakai proyek seri yang sama)
  if (ep && isNextEpisode) {
    steps.push({
      id: 'step-prep-project',
      phase: 'persiapan',
      title: `Buka Proyek Seri "${ep.seriesTitle}" di Google Flow`,
      instruction: `Part ${ep.number} dibuat di proyek Flow yang sama dengan part sebelumnya, supaya gambar patokan karakter & latar bisa dipakai ulang dan hasilnya tetap konsisten.`,
      substeps: [
        `Klik tombol "Buka Google Flow" di atas untuk membuka halaman Flow dalam Bahasa Inggris.`,
        `Buka proyek "${ep.seriesTitle}" yang dulu dipakai untuk Part 1. Jangan buat proyek baru.`,
        `Di kotak ketik bawah, pastikan tombol "${L.agentToggle}" posisi MATI (tidak biru).`,
      ],
      buttons: [{ label: L.agentToggle, kind: 'button' }],
      credits: 0,
      tips: [
        'Kalau proyek lama sudah terhapus, buat proyek baru bernama sama lalu buat ulang gambar patokan di langkah berikutnya.',
        flowGuideData.commonTips.agentOff,
      ],
    });
  } else {
    steps.push({
      id: 'step-prep-project',
      phase: 'persiapan',
      title: 'Buka Google Flow & Buat Proyek Baru',
      instruction: ep
        ? 'Langkah pertama: buat satu proyek khusus untuk seri ini. Semua part berikutnya akan dibuat di proyek yang sama.'
        : 'Langkah pertama: siapkan ruang kerja kosong di Google Flow supaya semua gambar patokan dan video terkumpul rapi.',
      substeps: [
        `Klik tombol "Buka Google Flow" di atas untuk membuka halaman Flow dalam Bahasa Inggris.`,
        `Klik tombol "${L.newProject}".`,
        `Klik judul proyek di pojok kiri atas (${L.projectTitle}), ketik "${ep ? ep.seriesTitle : pack.title}", lalu tekan Enter.`,
        `Di kotak ketik bawah, pastikan tombol "${L.agentToggle}" posisi MATI (tidak biru).`,
      ],
      buttons: [
        { label: L.newProject, kind: 'button' },
        { label: L.agentToggle, kind: 'button' },
      ],
      credits: 0,
      tips: [flowGuideData.commonTips.agentOff],
    });
  }

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
        tips: isNextEpisode
          ? [
              'Kalau gambar patokan ini sudah ada di proyek seri dari part sebelumnya, LEWATI langkah ini dan pakai gambar yang sama. Gambar baru bisa membuat wajah atau latar sedikit berbeda.',
              flowGuideData.commonTips.policyRejected,
            ]
          : [
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
          ? 'gambar patokan karakter DAN gambar patokan visual topik'
          : 'gambar patokan visual tadi';
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
      ep
        ? `Tambahkan tulisan "Part ${ep.number}" di awal dan "Bersambung ke Part ${ep.number + 1}" di akhir, lalu posting dengan caption di bawah.`
        : `Tambahkan tulisan penutup "${pack.cta}" pada klip terakhir, lalu posting dengan caption di bawah.`,
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
  const resolvedMode: ContentMode = rawAnswers.contentMode ?? template.mode ?? 'creator';
  const resolvedSelling: SellingStyle | undefined =
    resolvedMode === 'marketing'
      ? (rawAnswers.sellingStyle ?? template.sellingStyle ?? 'soft')
      : undefined;
  const a = normalizeAnswers({
    ...rawAnswers,
    contentMode: resolvedMode,
    sellingStyle: resolvedSelling,
  });
  if (!a.product) {
    throw new Error(
      resolvedMode === 'marketing' ? 'Nama produk/layanan wajib diisi.' : 'Topik konten wajib diisi.'
    );
  }
  if (template.cast === 'person') {
    a.cast = 'person';
    if (a.voice === 'none') {
      a.voice = 'dialog';
    }
  }

  const vStyle = VIDEO_STYLES[a.videoStyle || 'real-live'];
  const hookPreset = HOOK_STRATEGIES[a.hookStyle || 'rahasia-pov'];
  const vibe = VIBES[a.vibe];
  const model = MODELS[a.quality];
  const activeHookTitle =
    resolvedMode === 'marketing'
      ? resolvedSelling === 'hard'
        ? hookPreset.marketingName
        : hookPreset.softSellingName
      : hookPreset.name;

  let productLock =
    a.productLockCustom?.trim() ||
    (resolvedMode === 'marketing'
      ? `Hero Product / Service Lock: the promoted subject is "${a.product}" rendered consistently in ${vStyle.name} aesthetic; keep its exact geometry, colors, proportions, packaging/interface, and design 100% identical in every shot`
      : `Core Topic & Visual Motif: every scene visually illustrates the topic "${a.product}" rendered consistently in ${vStyle.name} aesthetic; keep visual props, environment motifs, and world design coherent across all shots`);
  if (a.hasPhoto && !productLock.toLowerCase().includes('reference image')) {
    productLock += ', matching the attached visual reference image faithfully';
  }

  const bible: Bible = {
    contentMode: resolvedMode,
    sellingStyle: resolvedSelling,
    product: a.product,
    productLock,
    videoStyleName: vStyle.name,
    videoStyleLock: vStyle.mediumLock,
    hookStrategyName: activeHookTitle,
    styleName: vibe.name,
    style: vibe.style,
    lighting: vibe.lighting,
    palette: vibe.palette,
    setting: vibe.setting,
    music: MUSIC_EN[a.music] ?? '',
    source: 'offline',
    ...resolveRealism(vStyle.id, template.id),
  };

  if (a.cast === 'person') {
    if (a.characterCustom?.trim()) {
      const built = buildCustomCharacterLock(a.characterCustom, vStyle);
      bible.characterName = 'Karakter Utama';
      bible.characterLock = built.lock;
      bible.characterVoiceLock = built.voiceLock;
    } else if (a.characterId && CHARACTERS[a.characterId]) {
      const preset = CHARACTERS[a.characterId];
      bible.characterName = preset.name;
      bible.characterLock = `${preset.lock}, ${vStyle.characterAdapterEn}`;
      bible.characterVoiceLock = preset.voiceLock;
    } else {
      bible.characterName = CHARACTERS.sinta.name;
      bible.characterLock = `${CHARACTERS.sinta.lock}, ${vStyle.characterAdapterEn}`;
      bible.characterVoiceLock = CHARACTERS.sinta.voiceLock;
    }
  }

  // ---------- Video berseri: kunci dunia cerita & arah episode ----------
  const isSeries = a.seriesMode === 'series';
  const episodeNumber = isSeries ? (a.episodeNumber ?? 1) : undefined;
  const seriesTitle = isSeries ? a.seriesTitle || a.product : '';
  const isContinuation = Boolean(episodeNumber && episodeNumber > 1);
  const prevRecap = isContinuation ? a.previousEpisodes?.[a.previousEpisodes.length - 1] : undefined;
  const episodeGoal = isSeries ? a.episodeGoal?.trim() || '' : '';

  if (isSeries && a.continuity) {
    const c = a.continuity;
    bible.productLock = c.productLock || bible.productLock;
    bible.setting = c.setting || bible.setting;
    bible.lighting = c.lighting || bible.lighting;
    bible.palette = c.palette || bible.palette;
    bible.style = c.style || bible.style;
    if (c.characterLock) {
      bible.characterName = c.characterName || bible.characterName;
      bible.characterLock = c.characterLock;
      bible.characterVoiceLock = c.characterVoiceLock || bible.characterVoiceLock;
    }
  }
  if (isSeries) {
    bible.seriesLock = isContinuation
      ? `SERIES CONTINUITY (Episode ${episodeNumber} of the ongoing series "${seriesTitle}"): the exact same established world, location layout, props, wardrobe, time-of-day, lighting and color grade as the earlier episodes; the story moves forward from where it left off and never restarts or re-introduces the character`
      : `SERIES CONTINUITY (Episode 1 of the series "${seriesTitle}"): clearly establish the character, location layout, wardrobe, props and lighting so every later episode can continue in the identical world`;
  }

  const advId = joinId(a.advantages);
  const advEn = translateAdvantages(a.advantages);
  const adv1 = a.advantages[0]?.trim().toLowerCase() || 'menarik buat dibahas';
  const charRef = bible.characterLock || 'the creator';
  const charId = bible.characterName || 'Kreator';

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

  const planRoles = rotateMiddleRoles(template, plan.roles, episodeNumber);
  planRoles.forEach((roleName, i) => {
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
      ? `[Hook: ${activeHookTitle}] ${applyPlaceholders(hookPreset.descHookId, replacements)}`
      : applyPlaceholders(r.descId, replacements);

    let actionEn = isOpeningHook
      ? `${applyPlaceholders(hookPreset.visualHookEn, replacements)}. Context: ${applyPlaceholders(r.action, replacements)}`
      : applyPlaceholders(r.action, replacements);

    const isClosing = i === planRoles.length - 1 && planRoles.length > 1;

    if (!isOpeningHook && i < plan.roles.length - 1 && a.story?.trim()) {
      actionEn += ` (narrative context: "${a.story.trim()}")`;
    }
    if (!isOpeningHook && !isClosing && episodeGoal) {
      actionEn += ` (this episode's story beat: "${episodeGoal}")`;
    }

    if (isOpeningHook && isContinuation) {
      const endState = prevRecap?.endStateEn
        ? ` (${limitWords(prevRecap.endStateEn, 40)})`
        : '';
      actionEn = `Cold open that continues directly from the final moment of the previous episode${endState}, same location and wardrobe, no re-introduction. ${applyPlaceholders(hookPreset.visualHookEn, replacements)}. Context: ${applyPlaceholders(r.action, replacements)}`;
      if (episodeGoal) actionEn += ` (new story beat for this episode: "${episodeGoal}")`;
      description = `[Lanjutan Part ${episodeNumber! - 1}] Membuka langsung dari akhir episode sebelumnya, lalu ${
        episodeGoal ? `masuk ke kejadian baru: ${stripTrailingPunct(episodeGoal)}.` : 'cerita bergerak maju.'
      }`;
    }
    if (isClosing && isSeries) {
      actionEn += `, then a sudden unresolved twist, discovery or interruption appears and the character reacts with genuine surprise toward it, ending on an open cliffhanger`;
      description += ` Ditutup cliffhanger yang menggantung menuju Part ${episodeNumber! + 1}.`;
    }

    let dialogue: string | undefined;
    if (a.voice !== 'none') {
      if (isOpeningHook) {
        const hookLineTemplate =
          resolvedMode === 'marketing'
            ? resolvedSelling === 'hard'
              ? hookPreset.spokenHookMarketingId
              : hookPreset.spokenHookSoftId
            : hookPreset.spokenHookId;
        dialogue = a.customHookLine?.trim() || applyPlaceholders(hookLineTemplate, replacements);
        if (isContinuation) {
          const keepNames = [bible.characterName, a.product];
          const prevGoal = prevRecap?.goalId?.trim();
          const recap = prevGoal
            ? `Buat yang ketinggalan, di part ${episodeNumber! - 1} ${lowerFirst(clipWords(prevGoal, 12), keepNames)}.`
            : `Lanjut dari part ${episodeNumber! - 1} kemarin ya.`;
          const next = a.customHookLine?.trim()
            ? a.customHookLine.trim()
            : episodeGoal
              ? `Nah sekarang, ${lowerFirst(clipWords(episodeGoal, 14), keepNames)}.`
              : 'Dan ternyata yang terjadi selanjutnya bikin aku kaget banget.';
          dialogue = `${recap} ${next}`;
        }
      } else if (r.dialogue) {
        dialogue = applyPlaceholders(r.dialogue, replacements);
      } else {
        dialogue = defaultNarration(r.role, a, advId, resolvedMode);
      }
      if (isClosing && isSeries && dialogue) {
        // Keep the episode's own payoff only when it is a complete short sentence, then a cliffhanger.
        const payoff = firstSentence(dialogue);
        const tease = `Lanjut di part ${episodeNumber! + 1} ya!`;
        dialogue =
          wordCount(payoff) <= 11
            ? `${payoff} Tapi tunggu, ada satu hal yang bikin aku kaget banget. ${tease}`
            : `Tapi tunggu dulu, barusan ada kejadian yang bikin aku kaget banget dan ini penting. ${tease}`;
      }
    }

    const chainFromPrev = Boolean(a.seamlessChain && scenes.length > 0);
    const scBase: Scene = {
      id: `sc-${scenes.length + 1}`,
      idx: scenes.length,
      role: r.role,
      label: isOpeningHook ? `Hook (${activeHookTitle})` : r.label,
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

    scBase.tips = buildSceneTips(scBase, a);
    scenes.push(scBase);
  });

  if (scenes.length === 0) {
    throw new Error('Template belum memiliki susunan scene untuk durasi ini.');
  }

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    sc.prompt = buildSceneVideoPrompt(bible, sc, sc.actionEn, a.voice, {
      sceneIdx: i,
      totalScenes: scenes.length,
      prevLabel: i > 0 ? scenes[i - 1].label : undefined,
      nextLabel: i < scenes.length - 1 ? scenes[i + 1].label : undefined,
      episodeNumber,
    });
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

  const built = buildCaption(a, advId, resolvedMode);
  let caption = built.caption;
  let hashtags = built.hashtags;
  const modeLabel =
    resolvedMode === 'marketing'
      ? resolvedSelling === 'hard'
        ? 'Hard Selling'
        : 'Soft Selling'
      : 'Konten Kreator';
  const durationLabel = a.durationS === 60 ? '1 menit' : `±${a.durationS} dtk`;
  const seriesLabel = isSeries ? `Seri Part ${episodeNumber} · ` : '';
  const summary = `${seriesLabel}${modeLabel} · ${scenes.length} klip · ${durationLabel} · ${a.aspect} · ${vStyle.name}.`;

  let episode: Pack['episode'];
  if (isSeries && episodeNumber) {
    const first = scenes[0];
    const last = scenes[scenes.length - 1];
    const cleanDesc = (s: string) => s.replace(/^\[[^\]]*\]\s*/, '').trim();
    episode = {
      seriesTitle,
      number: episodeNumber,
      previouslyId: isContinuation ? firstSentence(first.dialogue || first.description) : '',
      cliffhangerId: last.dialogue || cleanDesc(last.description),
      summaryId: limitWords(
        episodeGoal
          ? `Part ${episodeNumber}: ${stripTrailingPunct(episodeGoal)}.`
          : `Part ${episodeNumber}: ${cleanDesc(first.description)}`,
        40
      ),
      endStateEn: describeEndState(last.actionEn, bible),
    };
    caption = `Part ${episodeNumber} · ${seriesTitle} — ${caption} Lanjut ke part ${episodeNumber + 1}, follow biar nggak ketinggalan!`;
    hashtags = [...hashtags.slice(0, 3), `#part${episodeNumber}`, '#bersambung'];
  }

  const basePack: Omit<Pack, 'steps' | 'guideUpdatedAt'> = {
    title: isSeries ? `${seriesTitle} · Part ${episodeNumber}` : a.product,
    summary,
    bible,
    settings,
    assets,
    scenes,
    cta: a.cta,
    caption,
    hashtags,
    episode,
  };

  return {
    ...basePack,
    steps: buildFlowSteps(basePack, a),
    guideUpdatedAt: flowGuideData.updatedAt,
  };
}

export function recalculatePack(pack: Pack, answers: Answers): Pack {
  const model = MODELS[answers.quality] ?? MODELS.seimbang;
  const vStyle = VIDEO_STYLES[answers.videoStyle || 'real-live'];
  const vibe = VIBES[answers.vibe] ?? VIBES.minimalis;

  const updatedAssets = pack.assets.map((asset) => {
    if (asset.id === 'character' && pack.bible.characterLock) {
      return {
        ...asset,
        prompt: buildCharacterAssetPrompt(pack.bible.characterLock, vStyle, vibe.palette),
      };
    }
    return asset;
  });

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
    updated.prompt = buildSceneVideoPrompt(pack.bible, updated, updated.actionEn, answers.voice, {
      sceneIdx: idx,
      totalScenes: pack.scenes.length,
      prevLabel: idx > 0 ? pack.scenes[idx - 1].label : undefined,
      nextLabel: idx < pack.scenes.length - 1 ? pack.scenes[idx + 1].label : undefined,
      episodeNumber: pack.episode?.number,
    });
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

  const durationLabel = totalDuration === 60 ? '1 menit' : `±${totalDuration} dtk`;
  const seriesLabel = pack.episode ? `Seri Part ${pack.episode.number} · ` : '';
  const summary = `${seriesLabel}${normalizedScenes.length} klip · ${durationLabel} · ${settings.aspect} · ${pack.bible.videoStyleName}.`;

  // Keep the episode hand-off in sync when the last scene is edited, deleted or added.
  const lastScene = normalizedScenes[normalizedScenes.length - 1];
  const episode: Pack['episode'] =
    pack.episode && lastScene
      ? {
          ...pack.episode,
          cliffhangerId:
            lastScene.dialogue || lastScene.description.replace(/^\[[^\]]*\]\s*/, '').trim(),
          endStateEn: describeEndState(lastScene.actionEn, pack.bible),
        }
      : pack.episode;

  const basePack: Omit<Pack, 'steps' | 'guideUpdatedAt'> = {
    ...pack,
    assets: updatedAssets,
    summary,
    settings,
    scenes: normalizedScenes,
    episode,
  };

  return {
    ...basePack,
    steps: buildFlowSteps(basePack, answers),
    guideUpdatedAt: flowGuideData.updatedAt,
  };
}

/**
 * Answers for the next episode of a series: same template, style, character and world (locked from
 * the finished episode's bible), episode number + 1, and the story so far for the cold-open recap.
 */
export function buildNextEpisodeAnswers(answers: Answers, pack: Pack, episodeGoal = ''): Answers {
  const current = pack.episode?.number ?? answers.episodeNumber ?? 1;
  const recap: EpisodeRecap = {
    number: current,
    title: pack.title,
    goalId: answers.episodeGoal?.trim() || undefined,
    summaryId: pack.episode?.summaryId || pack.scenes.map((s) => s.description).join(' ').slice(0, 280),
    cliffhangerId: pack.episode?.cliffhangerId || '',
    endStateEn:
      pack.episode?.endStateEn ||
      describeEndState(pack.scenes[pack.scenes.length - 1]?.actionEn || '', pack.bible),
  };
  const b = pack.bible;
  return {
    ...answers,
    seriesMode: 'series',
    seriesTitle: pack.episode?.seriesTitle || answers.seriesTitle || answers.product,
    episodeNumber: current + 1,
    episodeGoal: episodeGoal.trim(),
    customHookLine: '',
    previousEpisodes: [...(answers.previousEpisodes || []), recap].slice(-MAX_RECAPS),
    continuity: {
      characterName: b.characterName,
      characterLock: b.characterLock,
      characterVoiceLock: b.characterVoiceLock,
      productLock: b.productLock,
      setting: b.setting,
      lighting: b.lighting,
      palette: b.palette,
      style: b.style,
    },
  };
}

export type CharacterSwapSelection =
  | { mode: 'preset'; presetId: string }
  | { mode: 'library'; id: string; name: string; lockText: string }
  | { mode: 'custom'; name: string; customTraits: string }
  | { mode: 'none' };

function detectGenderFromLock(text: string): 'female' | 'male' {
  if (/\b(woman|female|girl|hijab|she|her|perempuan|wanita|cewek|ibu)\b/i.test(text)) {
    return 'female';
  }
  return 'male';
}

function escapeRegExpStr(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteCharacterMentions(
  text: string,
  oldName: string | undefined,
  newName: string,
  oldGender: 'female' | 'male' | null,
  newGender: 'female' | 'male'
): string {
  if (!text) return text;
  let out = text;

  if (oldName && oldName.trim() && oldName !== 'Karakter Utama') {
    const escapedOld = escapeRegExpStr(oldName.trim());
    out = out.replace(new RegExp(`\\b${escapedOld}'s\\b`, 'g'), `${newName}'s`);
    out = out.replace(new RegExp(`\\b${escapedOld}\\b`, 'g'), newName);
  }

  if (oldGender && oldGender !== newGender) {
    if (oldGender === 'female' && newGender === 'male') {
      out = out
        .replace(/\bShe\b/g, 'He')
        .replace(/\bshe\b/g, 'he')
        .replace(/\bHerself\b/g, 'Himself')
        .replace(/\bherself\b/g, 'himself')
        // Object pronouns after common prepositions/verbs -> him
        .replace(
          /\b(behind|around|toward|towards|beside|near|with|follows|following|passes|around|at|to|for)\s+her\b/gi,
          (_, prep: string) => `${prep} him`
        )
        // Remaining "her" in visual descriptions are possessives (her face, her outfit, her left wrist) -> his
        .replace(/\bHer\b/g, 'His')
        .replace(/\bher\b/g, 'his');
    } else if (oldGender === 'male' && newGender === 'female') {
      out = out
        .replace(/\bHe\b/g, 'She')
        .replace(/\bhe\b/g, 'she')
        .replace(/\bHimself\b/g, 'Herself')
        .replace(/\bhimself\b/g, 'herself')
        .replace(/\bHis\b/g, 'Her')
        .replace(/\bhis\b/g, 'her')
        .replace(/\bHim\b/g, 'Her')
        .replace(/\bhim\b/g, 'her');
    }
  }

  return out;
}

export function swapPackCharacter(
  pack: Pack,
  answers: Answers,
  selection: CharacterSwapSelection
): { pack: Pack; answers: Answers } {
  const vStyle = VIDEO_STYLES[answers.videoStyle || 'real-live'];
  const vibe = VIBES[answers.vibe] ?? VIBES.minimalis;

  const oldName = pack.bible.characterName;
  const hadCharacter = Boolean(pack.bible.characterLock);
  const oldGender: 'female' | 'male' | null = hadCharacter
    ? detectGenderFromLock(`${pack.bible.characterLock} ${pack.bible.characterVoiceLock || ''}`)
    : null;

  if (selection.mode === 'none') {
    const nextAnswers: Answers = {
      ...answers,
      cast: 'product',
      characterId: undefined,
      characterCustom: '',
      voice: answers.voice === 'dialog' ? 'narasi' : answers.voice,
    };
    const nextBible: Bible = {
      ...pack.bible,
      characterName: '',
      characterLock: '',
      characterVoiceLock: '',
    };
    const nextAssets = pack.assets.filter((a) => a.id !== 'character');
    const nextScenes = pack.scenes.map((sc) => {
      let cleanAction = sc.actionEn;
      if (oldName && oldName.trim()) {
        const escapedOld = escapeRegExpStr(oldName.trim());
        cleanAction = cleanAction.replace(new RegExp(`\\b${escapedOld}\\b`, 'g'), 'the presenter');
      }
      return { ...sc, actionEn: cleanAction };
    });
    const nextPack = recalculatePack(
      { ...pack, bible: nextBible, assets: nextAssets, scenes: nextScenes },
      nextAnswers
    );
    return { pack: nextPack, answers: nextAnswers };
  }

  let newName = 'Karakter Utama';
  let newLock = '';
  let newVoiceLock = 'consistent natural Indonesian voice timbre';
  let nextCharId: string | undefined = answers.characterId;
  let nextCharCustom = answers.characterCustom || '';

  if (selection.mode === 'preset') {
    const preset = CHARACTERS[selection.presetId] ?? CHARACTERS.sinta;
    newName = preset.name;
    newLock = `${preset.lock}, ${vStyle.characterAdapterEn}`;
    newVoiceLock = preset.voiceLock;
    nextCharId = preset.id;
    nextCharCustom = '';
  } else if (selection.mode === 'library') {
    newName = selection.name.trim() || 'Karakter Pustaka';
    const raw = selection.lockText.trim();
    newLock = raw.includes(vStyle.characterAdapterEn)
      ? raw
      : `${raw}, ${vStyle.characterAdapterEn}`;
    const g = detectGenderFromLock(raw);
    newVoiceLock =
      g === 'female'
        ? 'consistent warm friendly female Indonesian voice timbre'
        : 'consistent clear natural male Indonesian voice timbre';
    nextCharId = selection.id;
    nextCharCustom = raw;
  } else {
    newName = selection.name.trim() || 'Karakter Utama';
    const raw = selection.customTraits.trim();
    const isAlreadyDetailedEn =
      raw.length > 90 && /\b(wearing|hair|face|eyes)\b/i.test(raw);
    if (isAlreadyDetailedEn) {
      newLock = raw;
      const g = detectGenderFromLock(raw);
      newVoiceLock =
        g === 'female'
          ? 'consistent warm friendly female Indonesian voice timbre'
          : 'consistent clear natural male Indonesian voice timbre';
    } else {
      const built = buildCustomCharacterLock(
        raw.toLowerCase().includes(newName.toLowerCase()) ? raw : `${newName}, ${raw}`,
        vStyle
      );
      newLock = built.lock;
      newVoiceLock = built.voiceLock;
    }
    nextCharId = 'custom';
    nextCharCustom = raw;
  }

  const newGender = detectGenderFromLock(`${newLock} ${newVoiceLock}`);

  const updatedLighting = rewriteCharacterMentions(
    pack.bible.lighting,
    oldName,
    newName,
    oldGender,
    newGender
  );

  const nextBible: Bible = {
    ...pack.bible,
    lighting: updatedLighting,
    characterName: newName,
    characterLock: newLock,
    characterVoiceLock: newVoiceLock,
  };

  const charAsset: Asset = {
    id: 'character',
    name: `Gambar Patokan Karakter (${newName})`,
    upload: false,
    purpose: `Buat 1 potret patokan karakter "${newName}" bergaya "${vStyle.name}" (gratis 0 credit di Nano Banana) agar wajah & pakaian 100% konsisten di semua adegan.`,
    prompt: buildCharacterAssetPrompt(newLock, vStyle, vibe.palette),
  };

  const hasCharAsset = pack.assets.some((a) => a.id === 'character');
  const nextAssets = hasCharAsset
    ? pack.assets.map((a) => (a.id === 'character' ? charAsset : a))
    : [charAsset, ...pack.assets];

  const nextScenes = pack.scenes.map((sc) => {
    if (!hadCharacter) {
      // Project originally had no character -> inject newName seamlessly while keeping exact scene action & setting!
      const injectedAction = cleanSingleLinePrompt(
        `${newName}, wearing ${newGender === 'female' ? 'her' : 'his'} exact locked outfit, appears naturally in the scene with expressive engagement while ${sc.actionEn.charAt(0).toLowerCase()}${sc.actionEn.slice(1)}`
      );
      return {
        ...sc,
        description: `${newName} hadir membawakan adegan: ${sc.description}`,
        actionEn: injectedAction,
      };
    }

    return {
      ...sc,
      description: rewriteCharacterMentions(sc.description, oldName, newName, oldGender, newGender),
      shot: rewriteCharacterMentions(sc.shot, oldName, newName, oldGender, newGender),
      camera: rewriteCharacterMentions(sc.camera, oldName, newName, oldGender, newGender),
      actionEn: rewriteCharacterMentions(sc.actionEn, oldName, newName, oldGender, newGender),
    };
  });

  const nextAnswers: Answers = {
    ...answers,
    cast: 'person',
    characterId: nextCharId,
    characterCustom: nextCharCustom,
    voice: answers.voice === 'none' ? 'dialog' : answers.voice,
  };

  const nextPack = recalculatePack(
    { ...pack, bible: nextBible, assets: nextAssets, scenes: nextScenes },
    nextAnswers
  );

  return { pack: nextPack, answers: nextAnswers };
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
  seed: number,
  pacingCtx?: ScenePacingContext
): Scene {
  const v = VARIATION_ANGLES[Math.abs(seed) % VARIATION_ANGLES.length];
  const baseVariation = scene.actionEn.split(' [angle variation:')[0];
  const nextAction = `${baseVariation} [angle variation: ${v.nuance}]`;
  const updated: Scene = {
    ...scene,
    shot: v.shot,
    actionEn: nextAction,
  };
  updated.prompt = buildSceneVideoPrompt(bible, updated, updated.actionEn, answers.voice, pacingCtx);
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
