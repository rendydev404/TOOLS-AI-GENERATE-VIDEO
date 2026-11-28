// Video hasil AI yang tampil di landing page.
//
// Video tampil sebagai pratinjau tanpa suara dan tidak bisa diklik.
// Setiap video punya 2 file di public/showcase/ dengan nama dasar yang sama:
//   <id>-preview.mp4  video kecil tanpa suara, diputar otomatis saat terlihat
//   <id>.webp         gambar sampul
// Perintah ffmpeg yang dipakai:
//   ffmpeg -i in.mp4 -vf scale=432:768 -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -an -movflags +faststart <id>-preview.mp4
//   ffmpeg -ss 0.6 -i in.mp4 -frames:v 1 -vf scale=432:768 -c:v libwebp -quality 72 <id>.webp

export type ShowcaseStyle = 'UGC' | 'Clay' | 'Minecraft' | 'Miniatur';

export interface ShowcaseVideo {
  id: string;
  /** Style visual, juga dipakai sebagai filter dan label kartu. */
  style: ShowcaseStyle;
  /** Satu kalimat pendek tentang isi video. */
  title: string;
  /** Bawaan 9:16. */
  aspect?: '9:16' | '16:9';
  /** Isi false untuk slot yang videonya belum ada. */
  ready?: boolean;
}

export const SHOWCASE_STYLES: ShowcaseStyle[] = ['UGC', 'Clay', 'Minecraft', 'Miniatur'];

// Urutan selang-seling antar style supaya tampilan "Semua" terlihat beragam.
export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  { id: 'ugc-ngobrol-kamar', style: 'UGC', title: 'Ngobrol santai dari kamar' },
  { id: 'ugc-ngobrol-kamera', style: 'UGC', title: 'Ngobrol langsung ke kamera' },
  { id: 'clay-studio-sains', style: 'Clay', title: 'Presentasi di studio sains' },
  { id: 'minecraft-studio-blok', style: 'Minecraft', title: 'Menyapa dari studio blok' },
  { id: 'miniatur-gunung-api', style: 'Miniatur', title: 'Presentasi gunung api mini' },
  { id: 'ugc-perpustakaan', style: 'UGC', title: 'Cerita dari perpustakaan' },
  { id: 'ugc-demo-aplikasi', style: 'UGC', title: 'Demo aplikasi di HP' },
  { id: 'clay-lubang-hitam', style: 'Clay', title: 'Menjelaskan lubang hitam' },
  { id: 'minecraft-dunia-voxel', style: 'Minecraft', title: 'Menunjuk dunia voxel' },
  { id: 'miniatur-aliran-lava', style: 'Miniatur', title: 'Mengamati aliran lava mini' },
  { id: 'ugc-latar-polos', style: 'UGC', title: 'Talking head berlatar polos' },
  { id: 'ugc-kerja-meja', style: 'UGC', title: 'Sibuk kerja di meja' },
  { id: 'clay-model-planet', style: 'Clay', title: 'Membedah model planet' },
  { id: 'minecraft-presentasi', style: 'Minecraft', title: 'Presentasi ide video' },
  { id: 'miniatur-raksasa', style: 'Miniatur', title: 'Raksasa di atas gunung api' },
  { id: 'ugc-mencatat', style: 'UGC', title: 'Menjelaskan sambil mencatat' },
  { id: 'minecraft-ruang-voxel', style: 'Minecraft', title: 'Bercerita di ruang voxel' },
];

/** Video yang tampil di hero, satu per style. */
export const HERO_VIDEO_IDS = ['clay-studio-sains', 'ugc-ngobrol-kamera', 'minecraft-studio-blok'];

export function showcaseFiles(id: string) {
  return {
    preview: `/showcase/${id}-preview.mp4`,
    poster: `/showcase/${id}.webp`,
  };
}
