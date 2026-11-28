import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clapperboard,
  Film,
  Layers,
  MousePointerClick,
  Play,
  ShieldCheck,
  Table2,
  UserRoundCheck,
  Zap,
} from 'lucide-react';
import { StudioFlowLogo } from '@/components/ui/StudioFlowLogos';
import {
  HERO_VIDEO_IDS,
  SHOWCASE_STYLES,
  SHOWCASE_VIDEOS,
  showcaseFiles,
  type ShowcaseStyle,
  type ShowcaseVideo,
} from '@/content/showcase';
import { resolveAssetUrl } from '@/lib/paths';

const APP_PATH = '/buat';

const NAV_LINKS = [
  { href: '#hasil', label: 'Hasil Video' },
  { href: '#cara-kerja', label: 'Cara Kerja' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#faq', label: 'FAQ' },
];

const HERO_FACTS = [
  { value: '14', label: 'format konten' },
  { value: '8', label: 'style visual' },
  { value: '6', label: 'jurus hook' },
  { value: '15–60', label: 'detik per video' },
];

const STEPS = [
  { title: 'Pilih format', desc: 'Storytelling, edukasi, POV, iklan, UGC affiliate, dan lainnya.' },
  { title: 'Pilih style', desc: 'Realistis, rekaman HP, kartun 3D, anime, clay, sampai iklan TV.' },
  { title: 'Pasang hook', desc: 'Pembuka 3 detik pertama supaya penonton berhenti scroll.' },
  { title: 'Isi topik & karakter', desc: 'Tulis topik atau produk, lalu kunci wajah karakternya.' },
  { title: 'Salin ke Google Flow', desc: 'Prompt per adegan siap ditempel, lengkap dengan panduan kliknya.' },
];

const FEATURES = [
  {
    icon: UserRoundCheck,
    title: 'Karakter konsisten',
    desc: 'Ciri wajah dan pakaian karakter ditanam di setiap prompt adegan, jadi orangnya tidak berganti di tengah video.',
  },
  {
    icon: Zap,
    title: 'Hook 3 detik',
    desc: 'Enam jurus pembuka, dari curiosity gap sampai pattern interrupt, disusun otomatis di adegan pertama.',
  },
  {
    icon: Clapperboard,
    title: 'Mode Kreator & Jualan',
    desc: 'Konten biasa untuk kreator, atau mode marketing dengan pilihan soft selling dan hard selling.',
  },
  {
    icon: MousePointerClick,
    title: 'Panduan klik Google Flow',
    desc: 'Urutan langkah di Google Flow ditulis jelas, jadi pemula tidak bingung mau klik apa.',
  },
  {
    icon: Table2,
    title: 'Buat massal dari CSV',
    desc: 'Susun banyak video sekaligus dari satu tabel, cocok untuk stok konten satu minggu.',
  },
  {
    icon: ShieldCheck,
    title: 'Tanpa API key',
    desc: 'Video digenerate di Google Flow memakai akun Google kamu sendiri. Tidak ada token tambahan dari StudioFlow.',
  },
];

const STYLES = [
  { file: 'real-live', name: 'Orang & Objek Realistis' },
  { file: 'real-ugc', name: 'Rekaman HP Kreator' },
  { file: 'iklan-studio', name: 'Iklan TV Sinematik' },
  { file: 'kartun-3d', name: '3D Video Kartun' },
  { file: 'animasi-2d', name: '2D Video / Anime' },
  { file: 'clay-stopmotion', name: 'Stop-Motion Clay' },
  { file: 'miniatur-diorama', name: 'Dunia Miniatur' },
  { file: 'minecraft-voxel', name: 'Style Minecraft' },
];

const FAQS = [
  {
    q: 'Apakah StudioFlow langsung membuat videonya?',
    a: 'Tidak. StudioFlow menyusun prompt per adegan beserta panduan langkahnya. Videonya kamu generate sendiri di Google Flow, cukup salin dan tempel prompt yang sudah jadi.',
  },
  {
    q: 'Saya perlu akun apa saja?',
    a: 'Akun Google yang bisa membuka Google Flow. Kuota generate video mengikuti akun Google Flow kamu, StudioFlow tidak menjual kredit atau token.',
  },
  {
    q: 'Harus jago menulis prompt?',
    a: 'Tidak perlu. Kamu cukup memilih format, style, dan hook, lalu menulis topik atau nama produk. Kamera, pencahayaan, gerakan, dan dialog disusun otomatis.',
  },
  {
    q: 'Durasi dan ukuran video apa saja yang didukung?',
    a: 'Durasi 15, 20, 30, atau 60 detik, dengan ukuran 9:16 untuk TikTok, Reels, dan Shorts, atau 16:9 untuk YouTube.',
  },
  {
    q: 'Bisa dipakai lewat HP?',
    a: 'Bisa. Semua langkah dibuat nyaman di layar HP, dan prompt bisa disalin satu per satu dengan sekali ketuk.',
  },
];

/**
 * Silent preview: plays muted only while on screen, not clickable, and nothing
 * downloads before it scrolls into view.
 */
function VideoTile({ video, className = '' }: { video: ShowcaseVideo; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const isWide = video.aspect === '16:9';
  const ready = video.ready !== false;
  const files = showcaseFiles(video.id);

  // Load the poster only once the tile is close to the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  const frame = `relative overflow-hidden rounded-2xl border-2 border-[var(--border-strong)] bg-[var(--bg-inverse)] shadow-[var(--shadow-sm)] ${
    isWide ? 'aspect-video' : 'aspect-[9/16]'
  } ${className}`;

  if (!ready) {
    return (
      <div className={`${frame} !bg-[var(--bg-subtle)]`}>
        <div className="absolute inset-2.5 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-soft)] p-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
            <Film size={18} strokeWidth={2.4} />
          </span>
          <span className="text-[12px] font-bold text-[var(--text-secondary)]">Video menyusul</span>
        </div>
        <span className="absolute left-2.5 top-2.5 rounded-md border-[1.5px] border-[#111111] bg-[var(--brand-primary)] px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-[#111111]">
          {video.style}
        </span>
      </div>
    );
  }

  return (
    <div className={frame}>
      <video
        ref={ref}
        src={resolveAssetUrl(files.preview)}
        poster={near ? resolveAssetUrl(files.poster) : undefined}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        aria-label={video.title}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute left-2.5 top-2.5 rounded-md border-[1.5px] border-[#111111] bg-[var(--brand-primary)] px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-[#111111]">
        {video.style}
      </span>
    </div>
  );
}

function SectionHeading({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-[680px] text-center">
      <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--accent-purple)]">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-[30px] font-bold leading-[1.1] sm:text-[40px]">{title}</h2>
      {desc && (
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-secondary)] sm:text-[17px]">{desc}</p>
      )}
    </div>
  );
}

function PrimaryCta({ label = 'Mulai Buat Video', size = 'lg' }: { label?: string; size?: 'md' | 'lg' }) {
  return (
    <Link
      to={APP_PATH}
      className={`neo-btn inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] font-bold text-[#111111] ${
        size === 'lg' ? 'h-14 px-7 text-[16px]' : 'h-10 px-4 text-[14px]'
      }`}
    >
      {label}
      <ArrowRight size={size === 'lg' ? 19 : 16} strokeWidth={2.6} />
    </Link>
  );
}

export function LandingPage() {
  const [styleFilter, setStyleFilter] = useState<ShowcaseStyle | null>(null);
  const heroVideos = HERO_VIDEO_IDS.map((id) => SHOWCASE_VIDEOS.find((v) => v.id === id)!);
  const gridVideos = styleFilter ? SHOWCASE_VIDEOS.filter((v) => v.style === styleFilter) : SHOWCASE_VIDEOS;
  const filterOptions: Array<{ value: ShowcaseStyle | null; label: string; count: number }> = [
    { value: null, label: 'Semua', count: SHOWCASE_VIDEOS.length },
    ...SHOWCASE_STYLES.map((s) => ({
      value: s,
      label: s,
      count: SHOWCASE_VIDEOS.filter((v) => v.style === s).length,
    })),
  ];

  useEffect(() => {
    const prev = document.title;
    document.title = 'StudioFlow — Bikin Video AI dari Prompt Siap Pakai untuk Google Flow';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-40 border-b-2 border-[var(--border-strong)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <StudioFlowLogo size={32} />
            <span className="font-display text-[18px] font-bold tracking-tight">StudioFlow</span>
          </a>
          <nav aria-label="Navigasi halaman" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg border-2 border-transparent px-3 py-1.5 text-[14px] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <PrimaryCta label="Buka Aplikasi" size="md" />
        </div>
      </header>

      <main id="top">
        {/* ==================== HERO ==================== */}
        <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1 font-mono text-[11.5px] font-bold uppercase tracking-wider shadow-[var(--shadow-xs)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-purple)]" />
              Prompt director untuk Google Flow
            </span>
            <h1 className="mt-6 text-[40px] font-bold leading-[1.16] sm:text-[54px] lg:text-[62px]">
              Dari ide jadi{' '}
              <span className="inline-block whitespace-nowrap rounded-lg border-2 border-[#111111] bg-[var(--brand-primary)] px-2 pb-[0.06em] leading-[1] text-[#111111] shadow-[var(--shadow-xs)]">
                video AI
              </span>{' '}
              tanpa pusing nulis prompt
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-relaxed text-[var(--text-secondary)] sm:text-[18px]">
              StudioFlow menyusun prompt per adegan lengkap dengan hook 3 detik, style visual, dan
              karakter yang konsisten. Tinggal salin ke Google Flow, ikuti panduan kliknya, videonya jadi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryCta />
              <a
                href="#hasil"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 text-[16px] font-bold hover:bg-[var(--bg-subtle)]"
              >
                <Play size={17} strokeWidth={2.6} /> Lihat hasil video
              </a>
            </div>
            <dl className="mt-10 grid max-w-[560px] grid-cols-2 gap-3 sm:grid-cols-4">
              {HERO_FACTS.map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2.5"
                >
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="font-display text-[24px] font-bold leading-none tnum">{f.value}</dd>
                  <dd className="mt-1 text-[12.5px] font-semibold text-[var(--text-tertiary)]">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero video stack */}
          <div className="relative mx-auto grid w-full max-w-[520px] grid-cols-3 items-center gap-3 sm:gap-4">
            <VideoTile video={heroVideos[0]} className="-rotate-3" />
            <VideoTile video={heroVideos[1]} className="z-10 scale-[1.12]" />
            <VideoTile video={heroVideos[2]} className="rotate-3" />
          </div>
        </section>

        {/* ==================== SHOWCASE ==================== */}
        <section id="hasil" className="scroll-mt-20 border-y-2 border-[var(--border-strong)] bg-[var(--bg-surface)] py-16 sm:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <SectionHeading
              eyebrow="Hasil video"
              title="Wajah tetap sama, gaya bebas pilih"
              desc="Tanpa syuting dan tanpa kru. Semua video di bawah digenerate di Google Flow memakai prompt StudioFlow, dan wajah karakternya tidak berubah meski ganti style atau lokasi."
            />
            <div
              role="group"
              aria-label="Filter style video"
              className="mt-10 flex flex-wrap justify-center gap-2"
            >
              {filterOptions.map((o) => {
                const active = styleFilter === o.value;
                return (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStyleFilter(o.value)}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border-2 border-[var(--border-strong)] px-4 text-[14px] font-bold transition-transform ${
                      active
                        ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[var(--shadow-xs)] -translate-y-[1px]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {o.label}
                    <span className="font-mono text-[12px] opacity-60 tnum">{o.count}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {gridVideos.map((v) => (
                <VideoTile
                  key={v.id}
                  video={v}
                  className={v.aspect === '16:9' ? 'col-span-2' : ''}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section id="cara-kerja" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
          <SectionHeading
            eyebrow="Cara kerja"
            title="Lima langkah, prompt langsung jadi"
            desc="Jawab pertanyaan singkat, StudioFlow yang menyusun naskah, kamera, dan gerakan di setiap adegan."
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="neo-card rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#111111] bg-[var(--brand-primary)] font-mono text-[16px] font-bold text-[#111111]">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-[18px] font-bold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section id="fitur" className="scroll-mt-20 border-y-2 border-[var(--border-strong)] bg-[var(--bg-inverse)] py-16 text-[var(--bg-surface)] sm:py-24">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="mx-auto max-w-[680px] text-center">
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                Fitur
              </div>
              <h2 className="mt-3 text-[30px] font-bold leading-[1.1] sm:text-[40px]">
                Yang bikin videonya terasa digarap, bukan asal jadi
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-2xl border-2 border-[var(--bg-surface)] p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#111111] bg-[var(--brand-primary)] text-[#111111]">
                      <Icon size={20} strokeWidth={2.4} />
                    </span>
                    <h3 className="mt-4 text-[19px] font-bold">{f.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed opacity-75">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== STYLES ==================== */}
        <section className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 sm:py-24">
          <SectionHeading
            eyebrow="8 style visual"
            title="Satu ide, banyak gaya"
            desc="Pilih tampilan yang cocok dengan konten kamu. Gaya yang dipilih ikut terkunci di setiap adegan."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {STYLES.map((s) => (
              <figure key={s.file} className="neo-card overflow-hidden rounded-2xl">
                <img
                  src={resolveAssetUrl(`/style-previews/${s.file}.webp`)}
                  alt={`Contoh style ${s.name}`}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full border-b-2 border-[var(--border-strong)] object-cover"
                />
                <figcaption className="flex items-start gap-2 px-3 py-2.5 text-[13.5px] font-bold leading-snug">
                  <Layers size={14} strokeWidth={2.4} className="mt-[3px] shrink-0 text-[var(--accent-purple)]" />
                  <span>{s.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <section id="faq" className="scroll-mt-20 border-t-2 border-[var(--border-strong)] bg-[var(--bg-surface)] py-16 sm:py-24">
          <div className="mx-auto max-w-[780px] px-4 sm:px-6">
            <SectionHeading eyebrow="FAQ" title="Yang sering ditanyakan" />
            <div className="mt-10 space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] open:shadow-[var(--shadow-sm)]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-bold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border-strong)] group-open:bg-[var(--brand-primary)] group-open:text-[#111111]">
                      <span className="font-mono text-[16px] leading-none transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-[var(--text-secondary)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA ==================== */}
        <section className="border-y-2 border-[#111111] bg-[var(--brand-primary)] text-[#111111]">
          <div className="mx-auto flex max-w-[1180px] flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[30px] font-bold leading-[1.1] sm:text-[38px]">Video pertamamu bisa jadi hari ini.</h2>
              <p className="mt-2 text-[16px] font-semibold opacity-80">
                Buka aplikasinya, jawab lima pertanyaan, salin prompt ke Google Flow.
              </p>
            </div>
            <Link
              to={APP_PATH}
              className="inline-flex h-14 shrink-0 items-center gap-2 rounded-xl border-2 border-[#111111] bg-[#111111] px-7 text-[16px] font-bold text-[var(--brand-primary)] shadow-[4px_4px_0_#ffffff] transition-transform hover:-translate-y-[1px]"
            >
              Mulai Buat Video <ArrowRight size={19} strokeWidth={2.6} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-4 py-8 text-[13px] font-semibold text-[var(--text-tertiary)] sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <StudioFlowLogo size={22} />
          <span>StudioFlow · Prompt director untuk Google Flow</span>
        </div>
        <span>Google Flow adalah layanan milik Google.</span>
      </footer>

    </div>
  );
}
