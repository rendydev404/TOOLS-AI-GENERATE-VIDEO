import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BookmarkPlus,
  Box,
  Camera,
  Check,
  Compass,
  Eye,
  Film,
  Flame,
  HelpCircle,
  Layers,
  Monitor,
  PenTool,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Target,
  Zap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  ADVANTAGE_SUGGESTIONS,
  CHARACTERS,
  CTA_SUGGESTIONS,
  HOOK_STRATEGIES,
  MODELS,
  MUSIC_LABELS,
  VIBES,
  VIDEO_STYLES,
} from '@shared/director';
import {
  getAllTemplates,
  getPlanForDuration,
  getTemplateById,
} from '@shared/templates';
import type {
  Answers,
  AspectRatio,
  CastChoice,
  DurationChoice,
  HookStrategyId,
  MusicChoice,
  Project,
  QualityTier,
  VibeId,
  VideoStyleId,
  VoiceChoice,
} from '@shared/types';
import { generatePackSmart } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Chip,
  ProgressBar,
  RadioOption,
  SegmentedControl,
  Tag,
} from '@/components/ui/Primitives';
import { CustomSelect } from '@/components/ui/CustomControls';
import { VibePalettePreview } from '@/components/ui/StoryVisuals';

const GUIDED_STEPS = [
  { num: 1, label: 'Tujuan' },
  { num: 2, label: 'Style Video' },
  { num: 3, label: 'Hook Pembuka' },
  { num: 4, label: 'Produk' },
  { num: 5, label: 'Ukuran & Buat' },
];

const VIDEO_STYLE_ICONS: Record<VideoStyleId, React.ReactNode> = {
  'real-live': <Camera size={20} strokeWidth={2.3} />,
  'kartun-3d': <Box size={20} strokeWidth={2.3} />,
  'minecraft-voxel': <Blocks size={20} strokeWidth={2.3} />,
  'animasi-2d': <PenTool size={20} strokeWidth={2.3} />,
  'real-ugc': <Smartphone size={20} strokeWidth={2.3} />,
  'clay-stopmotion': <Layers size={20} strokeWidth={2.3} />,
  'miniatur-diorama': <Compass size={20} strokeWidth={2.3} />,
  'iklan-studio': <Film size={20} strokeWidth={2.3} />,
};

const VIDEO_STYLE_ORDER: VideoStyleId[] = [
  'real-live',
  'kartun-3d',
  'minecraft-voxel',
  'animasi-2d',
  'real-ugc',
  'clay-stopmotion',
  'miniatur-diorama',
  'iklan-studio',
];

const HOOK_ICONS: Record<HookStrategyId, React.ReactNode> = {
  'visual-kejutan': <Zap size={19} strokeWidth={2.4} />,
  'masalah-relatable': <HelpCircle size={19} strokeWidth={2.4} />,
  'transformasi-instan': <RefreshCw size={19} strokeWidth={2.4} />,
  'rahasia-pov': <Eye size={19} strokeWidth={2.4} />,
  'skala-unik': <Flame size={19} strokeWidth={2.4} />,
  'bukti-langsung': <ShieldCheck size={19} strokeWidth={2.4} />,
};

const HOOK_ORDER: HookStrategyId[] = [
  'visual-kejutan',
  'masalah-relatable',
  'transformasi-instan',
  'rahasia-pov',
  'skala-unik',
  'bukti-langsung',
];

export function WizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    projects,
    library,
    brand,
    settings,
    health,
    upsertProject,
    upsertLibraryItem,
    seedSampleProject,
    pushToast,
  } = useApp();

  const templates = useMemo(() => getAllTemplates(), []);
  const draftId = searchParams.get('draft');
  const initialTemplateParam = searchParams.get('template');

  const existingDraft = useMemo(
    () => (draftId ? projects.find((p) => p.id === draftId) : undefined),
    [draftId, projects]
  );

  const [step, setStep] = useState<number>(() => (initialTemplateParam ? 2 : 1));
  const [templateId, setTemplateId] = useState<string>(() => {
    if (existingDraft) return existingDraft.templateId;
    if (initialTemplateParam && getTemplateById(initialTemplateParam)) return initialTemplateParam;
    return 'iklan-produk';
  });

  const [answers, setAnswers] = useState<Answers>(() => {
    if (existingDraft) return existingDraft.answers;
    return {
      product: brand.brandName ? `${brand.brandName} ` : '',
      hasPhoto: false,
      productLockCustom: '',
      advantages: ['Manis pas', 'Gula aren asli', 'Segar'],
      cta: brand.defaultCta || 'Pesan sekarang, link di bio',
      story: '',
      videoStyle: brand.defaultVideoStyle || 'real-live',
      hookStyle: brand.defaultHookStyle || 'visual-kejutan',
      customHookLine: '',
      vibe: brand.defaultVibe || 'hangat',
      music: brand.defaultMusic || 'santai',
      cast: 'product',
      characterId: 'sinta',
      characterCustom: '',
      voice: 'none',
      durationS: 20,
      aspect: brand.defaultAspect || '9:16',
      quality: brand.defaultQuality || 'seimbang',
      seamlessChain: brand.defaultSeamlessChain ?? false,
    };
  });

  const [customAdvInput, setCustomAdvInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const activeTemplate = useMemo(
    () => getTemplateById(templateId) ?? templates[0],
    [templateId, templates]
  );

  useEffect(() => {
    if (activeTemplate.cast === 'person') {
      setAnswers((prev) => ({
        ...prev,
        cast: 'person',
        voice: prev.voice === 'none' ? 'dialog' : prev.voice,
      }));
    }
  }, [activeTemplate]);

  const savedProducts = useMemo(
    () => library.filter((x) => x.kind === 'product'),
    [library]
  );

  const plan = useMemo(
    () => getPlanForDuration(activeTemplate, answers.durationS),
    [activeTemplate, answers.durationS]
  );

  const estimatedCredits = plan.roles.length * MODELS[answers.quality].credits;
  const latestProject = projects[0];

  const updateAnswer = <K extends keyof Answers>(key: K, val: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const toggleAdvantage = (adv: string) => {
    setAnswers((prev) => {
      const exists = prev.advantages.includes(adv);
      const next = exists
        ? prev.advantages.filter((x) => x !== adv)
        : [...prev.advantages, adv];
      return { ...prev, advantages: next };
    });
  };

  const addCustomAdvantage = () => {
    const clean = customAdvInput.trim();
    if (!clean) return;
    if (!answers.advantages.includes(clean)) {
      updateAnswer('advantages', [...answers.advantages, clean]);
    }
    setCustomAdvInput('');
  };

  const handleSaveProductToLibrary = () => {
    if (!answers.product.trim()) {
      pushToast('Isi nama produk terlebih dahulu', 'danger');
      return;
    }
    upsertLibraryItem({
      id: `lib-prod-${Date.now().toString(36)}`,
      kind: 'product',
      name: answers.product.trim(),
      subtitle: answers.advantages.join(', ') || 'Produk tersimpan',
      lockText: `The product is "${answers.product.trim()}"; keep its exact shape, colors, packaging and label identical in every shot`,
      advantages: answers.advantages,
      hasPhoto: answers.hasPhoto,
      art: activeTemplate.art,
      createdAt: new Date().toISOString(),
    });
  };

  const handleGeneratePack = async () => {
    if (!answers.product.trim()) {
      setStep(4);
      pushToast('Isi nama produk terlebih dahulu di Langkah 4', 'danger');
      return;
    }
    setGenerating(true);
    try {
      const { pack } = await generatePackSmart(
        activeTemplate.id,
        answers,
        Boolean(settings.useLlmWhenAvailable && health.llmAvailable)
      );
      const now = new Date().toISOString();
      const id = existingDraft?.id ?? `proj-${Date.now().toString(36)}`;
      const project: Project = {
        id,
        name: answers.product.trim(),
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
        art: activeTemplate.art,
        status: 'panduan',
        answers,
        pack,
        completedStepIds: [],
        createdAt: existingDraft?.createdAt ?? now,
        updatedAt: now,
      };
      upsertProject(project);
      pushToast('Urutan prompt & panduan langkah sudah siap!', 'success');
      navigate(`/proyek/${project.id}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal membuat panduan', 'danger');
    } finally {
      setGenerating(false);
    }
  };

  const goNext = () => {
    if (step === 4 && !answers.product.trim()) {
      pushToast('Ketik nama produk atau topik videomu dulu', 'danger');
      return;
    }
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleGeneratePack();
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenSample = () => {
    const sample = seedSampleProject();
    navigate(`/proyek/${sample.id}`);
  };

  const allAdvantageChips = useMemo(() => {
    const merged = new Set([...ADVANTAGE_SUGGESTIONS, ...answers.advantages]);
    return Array.from(merged);
  }, [answers.advantages]);

  const currentVideoStyle = VIDEO_STYLES[answers.videoStyle || 'real-live'];
  const currentHook = HOOK_STRATEGIES[answers.hookStyle || 'visual-kejutan'];

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[680px] flex-col gap-5">
        {/* Top Context Banner (Only on Step 1) */}
        {step === 1 && latestProject && !existingDraft && (
          <Link
            to={
              latestProject.pack
                ? `/proyek/${latestProject.id}`
                : `/buat?draft=${latestProject.id}`
            }
            className="neo-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-transform hover:-translate-y-[1px]"
          >
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-md border-[1.5px] border-[#111111] bg-[var(--accent-purple)] px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase text-white">
                PROYEK TERAKHIR
              </span>
              <div className="mt-1 truncate font-display text-[16px] font-bold text-[var(--text-primary)]">
                {latestProject.name}
              </div>
            </div>

            {latestProject.pack && (
              <div className="hidden sm:block w-32">
                <ProgressBar
                  fraction={
                    latestProject.completedStepIds.length /
                    Math.max(1, latestProject.pack.steps.length)
                  }
                  height={10}
                />
                <div className="mt-1 text-right font-mono text-[11px] font-bold text-[var(--text-primary)] tnum">
                  {latestProject.completedStepIds.length}/{latestProject.pack.steps.length} selesai
                </div>
              </div>
            )}

            <span className="neo-btn inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 text-[13px] font-bold text-[#111111]">
              <span>Lanjutkan</span>
              <ArrowRight size={14} strokeWidth={2.6} />
            </span>
          </Link>
        )}

        {step === 1 && !latestProject && (
          <div className="neo-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5">
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
              Ikuti 5 langkah simpel di bawah, atau coba lihat contoh panduan jadi.
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={<Eye size={14} />}
              onClick={handleOpenSample}
            >
              Contoh Jadi
            </Button>
          </div>
        )}

        {/* Neo-Brutalist 5-Step Progress Card */}
        <div className="neo-card rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <Tag tone="purple">
              LANGKAH {step} DARI 5 · {GUIDED_STEPS[step - 1].label.toUpperCase()}
            </Tag>
            <span className="font-mono text-[12px] font-bold text-[var(--text-primary)] tnum">
              {Math.round((step / 5) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {GUIDED_STEPS.map((gs) => {
              const isCurrent = step === gs.num;
              const isDone = step > gs.num;
              const canJump = gs.num <= step || answers.product.trim().length > 0 || gs.num <= 4;

              return (
                <button
                  key={gs.num}
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && setStep(gs.num)}
                  className="flex flex-col gap-1.5 text-left disabled:opacity-40"
                >
                  <div
                    className={`h-2.5 w-full rounded-full border-[1.5px] border-[var(--border-strong)] transition-colors ${
                      isCurrent
                        ? 'bg-[var(--brand-primary)]'
                        : isDone
                          ? 'bg-[var(--accent-purple)]'
                          : 'bg-[var(--bg-subtle)]'
                    }`}
                  />
                  <span
                    className={`truncate text-[11px] sm:text-[12px] ${
                      isCurrent
                        ? 'font-bold text-[var(--text-primary)]'
                        : 'font-semibold text-[var(--text-secondary)]'
                    }`}
                  >
                    {gs.num}. {gs.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================== MAIN FOCUS STEP CARD ==================== */}
        <div className="neo-card rounded-2xl p-6">
          {/* STEP 1: TUJUAN */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-display text-[22px] sm:text-[25px] font-bold text-[var(--text-primary)]">
                  1. Mau bikin video seperti apa?
                </h1>
                <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
                  Pilih tujuan konten di bawah, lalu tekan tombol hijau Lanjut.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((tpl) => {
                  const selected = templateId === tpl.id;
                  const roleLabels = (tpl.plans['20']?.roles ?? [])
                    .map((rKey) => tpl.roles.find((r) => r.role === rKey)?.label)
                    .filter(Boolean);

                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id)}
                      className={`flex min-h-[100px] w-full min-w-0 flex-col justify-between gap-2.5 overflow-hidden rounded-xl border-2 border-[var(--border-strong)] p-4 text-left transition-all ${
                        selected
                          ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[4px_4px_0_var(--border-strong)] -translate-y-[2px]'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display text-[15.5px] font-bold">
                            {tpl.name}
                          </div>
                          <p
                            className={`mt-1 text-[12.5px] leading-snug ${
                              selected ? 'text-[#111111]/85 font-medium' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {tpl.description}
                          </p>
                        </div>
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-[#111111] ${
                            selected ? 'bg-[#111111] text-[var(--brand-primary)]' : 'bg-[var(--bg-surface)]'
                          }`}
                        >
                          {selected && <Check size={14} strokeWidth={3} />}
                        </span>
                      </div>

                      <div
                        className={`truncate font-mono text-[11px] font-bold ${
                          selected ? 'text-[#111111]' : 'text-[var(--text-tertiary)]'
                        }`}
                      >
                        {roleLabels.join(' -> ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: STYLE VIDEO */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-display text-[22px] sm:text-[25px] font-bold text-[var(--text-primary)]">
                  2. Pilih style visual videonya
                </h1>
                <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
                  Mulai dari orang asli, animasi 3D kartun, 2D anime, sampai kotak ala Minecraft.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {VIDEO_STYLE_ORDER.map((styleId) => {
                  const st = VIDEO_STYLES[styleId];
                  const selected = (answers.videoStyle || 'real-live') === styleId;
                  return (
                    <button
                      key={styleId}
                      type="button"
                      onClick={() => updateAnswer('videoStyle', styleId)}
                      className={`flex min-h-[96px] w-full min-w-0 items-start gap-3.5 overflow-hidden rounded-xl border-2 border-[var(--border-strong)] p-4 text-left transition-all ${
                        selected
                          ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[4px_4px_0_var(--border-strong)] -translate-y-[2px]'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#111111] ${
                          selected
                            ? 'bg-[#111111] text-[var(--brand-primary)]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                        }`}
                      >
                        {VIDEO_STYLE_ICONS[styleId]}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-display text-[15px] font-bold">
                            {st.name}
                          </span>
                          <Tag tone={selected ? 'purple' : 'neutral'}>{st.badge}</Tag>
                        </div>
                        <p
                          className={`mt-1 text-[12.5px] leading-snug ${
                            selected ? 'text-[#111111]/85 font-medium' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {st.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: HOOK PEMBUKA JAGO */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-display text-[22px] sm:text-[25px] font-bold text-[var(--text-primary)]">
                  3. Pilih jurus Hook 3 detik pertama
                </h1>
                <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
                  Hook yang kuat menahan jempol penonton supaya tidak langsung skip videomu.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {HOOK_ORDER.map((hookId) => {
                  const hk = HOOK_STRATEGIES[hookId];
                  const selected = (answers.hookStyle || 'visual-kejutan') === hookId;

                  return (
                    <button
                      key={hookId}
                      type="button"
                      onClick={() => updateAnswer('hookStyle', hookId)}
                      className={`flex items-start gap-3.5 rounded-xl border-2 border-[var(--border-strong)] p-4 text-left transition-all ${
                        selected
                          ? 'bg-[var(--brand-soft)] shadow-[4px_4px_0_var(--border-strong)] -translate-y-[1px]'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border-strong)] ${
                          selected
                            ? 'bg-[var(--brand-primary)] text-[#111111]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                        }`}
                      >
                        {HOOK_ICONS[hookId]}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-display text-[15.5px] font-bold text-[var(--text-primary)]">
                            {hk.name}
                          </span>
                          <Tag tone={selected ? 'purple' : 'neutral'}>{hk.tag}</Tag>
                        </div>
                        <p className="mt-1 text-[13.5px] font-semibold text-[var(--text-primary)] leading-snug">
                          {hk.shortDesc}
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-[var(--text-secondary)]">
                          Alasan berhasil: {hk.whyItWorks}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4">
                <label className="text-[13px] font-bold text-[var(--text-primary)]">
                  Kalimat pembuka sendiri · opsional
                </label>
                <input
                  type="text"
                  value={answers.customHookLine || ''}
                  onChange={(e) => updateAnswer('customHookLine', e.target.value)}
                  placeholder="Kosongkan bila ingin kalimat Hook diracik otomatis..."
                  className="h-11 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[13.5px] font-medium focus:outline-none focus:shadow-[var(--focus-ring)]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: PRODUK */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Tag tone="brand">{currentVideoStyle.name}</Tag>
                  <Tag tone="purple">Hook: {currentHook.name}</Tag>
                </div>
                <h1 className="font-display text-[22px] sm:text-[25px] font-bold text-[var(--text-primary)]">
                  4. Apa produk atau topik videonya?
                </h1>
              </div>

              {savedProducts.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[var(--text-secondary)]">
                    Ambil cepat dari Pustaka (opsional)
                  </label>
                  <CustomSelect
                    value=""
                    placeholder="Pilih produk tersimpan..."
                    options={savedProducts.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    onChange={(id) => {
                      const found = savedProducts.find((x) => x.id === id);
                      if (!found) return;
                      setAnswers((prev) => ({
                        ...prev,
                        product: found.name,
                        productLockCustom: found.lockText,
                        advantages:
                          found.advantages && found.advantages.length > 0
                            ? found.advantages
                            : prev.advantages,
                        hasPhoto: Boolean(found.hasPhoto),
                      }));
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] font-bold text-[var(--text-primary)]">
                    Nama produk / topik utama (wajib)
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveProductToLibrary}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--accent-purple)] hover:underline"
                  >
                    <BookmarkPlus size={14} strokeWidth={2.5} />
                    <span>Simpan ke Pustaka</span>
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={answers.product}
                  onChange={(e) => updateAnswer('product', e.target.value)}
                  placeholder="Contoh: Kopi Susu Gula Aren Senja"
                  className="h-12 w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-[15px] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] placeholder:font-normal placeholder:text-[var(--text-tertiary)] focus:outline-none focus:shadow-[var(--focus-ring)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[var(--text-primary)]">
                  Klik 2–3 keunggulan utama
                </label>
                <div className="flex flex-wrap gap-2">
                  {allAdvantageChips.map((adv) => (
                    <Chip
                      key={adv}
                      label={adv}
                      selected={answers.advantages.includes(adv)}
                      onClick={() => toggleAdvantage(adv)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={customAdvInput}
                    onChange={(e) => setCustomAdvInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAdvantage();
                      }
                    }}
                    placeholder="Tambah kelebihan lain..."
                    className="h-10.5 flex-1 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[13.5px] font-medium focus:outline-none focus:shadow-[var(--focus-ring)]"
                  />
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Plus size={15} strokeWidth={2.5} />}
                    onClick={addCustomAdvantage}
                  >
                    Tambah
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-[var(--text-primary)]">
                  Kalimat ajakan di penutup video
                </label>
                <input
                  type="text"
                  value={answers.cta}
                  onChange={(e) => updateAnswer('cta', e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] font-semibold focus:outline-none focus:shadow-[var(--focus-ring)]"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CTA_SUGGESTIONS.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateAnswer('cta', s)}
                      className="rounded-lg border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--brand-soft)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-[var(--text-primary)]">
                  Gambar patokan konsistensi di Google Flow
                </label>
                <SegmentedControl<'buatkan' | 'punya'>
                  fullWidth
                  tall
                  value={answers.hasPhoto ? 'punya' : 'buatkan'}
                  onChange={(v) => updateAnswer('hasPhoto', v === 'punya')}
                  items={[
                    {
                      value: 'buatkan',
                      label: 'Buatkan Gambar Patokan',
                      sub: `Gaya ${currentVideoStyle.name} · Gratis`,
                    },
                    {
                      value: 'punya',
                      label: 'Pakai Foto Sendiri',
                      sub: 'Unggah foto asli ke Flow',
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 5: UKURAN, SUASANA & SELESAI */}
          {step === 5 && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-display text-[22px] sm:text-[25px] font-bold text-[var(--text-primary)]">
                  5. Pilih ukuran layar & suasana
                </h1>
                <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
                  Langkah terakhir! Tekan tombol hijau di bawah untuk membuka panduan salin prompt.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-[var(--text-primary)]">
                  Ukuran layar video
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RadioOption
                    selected={answers.aspect === '9:16'}
                    onClick={() => updateAnswer('aspect', '9:16' as AspectRatio)}
                    title="9:16 Tegak (HP)"
                    description="TikTok, Reels, Shorts"
                    icon={<Smartphone size={19} strokeWidth={2.3} />}
                  />
                  <RadioOption
                    selected={answers.aspect === '16:9'}
                    onClick={() => updateAnswer('aspect', '16:9' as AspectRatio)}
                    title="16:9 Mendatar"
                    description="YouTube, Website"
                    icon={<Monitor size={19} strokeWidth={2.3} />}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-[var(--text-primary)]">
                  Panjang total video
                </label>
                <SegmentedControl<DurationChoice>
                  fullWidth
                  tall
                  value={answers.durationS}
                  onChange={(val) => updateAnswer('durationS', val)}
                  items={([15, 20, 30] as DurationChoice[]).map((d) => ({
                    value: d,
                    label: `${d} detik`,
                    sub: `${getPlanForDuration(activeTemplate, d).roles.length} klip adegan`,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[var(--text-primary)]">
                  Suasana pencahayaan & warna
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {(Object.keys(VIBES) as VibeId[]).map((vId) => {
                    const v = VIBES[vId];
                    const selected = answers.vibe === vId;
                    return (
                      <button
                        key={vId}
                        type="button"
                        onClick={() => updateAnswer('vibe', vId)}
                        className={`flex flex-col gap-2 rounded-xl border-2 border-[var(--border-strong)] p-3 text-left transition-all ${
                          selected
                            ? 'bg-[var(--brand-soft)] shadow-[3px_3px_0_var(--border-strong)] -translate-y-[1px]'
                            : 'bg-[var(--bg-surface)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-[var(--text-primary)]">
                            {v.name}
                          </span>
                          {selected && <Check size={15} strokeWidth={3} />}
                        </div>
                        <VibePalettePreview vibeId={vId} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-bold text-[var(--text-primary)]">
                    Suara bicara Bahasa Indonesia
                  </label>
                  <CustomSelect<VoiceChoice>
                    value={answers.voice}
                    onChange={(val) => updateAnswer('voice', val)}
                    options={[
                      { value: 'none', label: 'Tanpa Suara Bicara' },
                      { value: 'narasi', label: 'Suara Narator (Voice-Over)' },
                      { value: 'dialog', label: 'Karakter / Presenter Bicara' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-bold text-[var(--text-primary)]">
                    Musik latar
                  </label>
                  <CustomSelect<MusicChoice>
                    value={answers.music}
                    onChange={(val) => updateAnswer('music', val)}
                    options={(Object.keys(MUSIC_LABELS) as MusicChoice[]).map((m) => ({
                      value: m,
                      label: MUSIC_LABELS[m],
                    }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-bold text-[var(--text-primary)]">
                    Pemeran di layar
                  </label>
                  <CustomSelect<CastChoice>
                    value={answers.cast}
                    onChange={(val) => {
                      if (activeTemplate.cast === 'person' && val === 'product') {
                        pushToast('Alur video ini membutuhkan presenter/karakter', 'info');
                        return;
                      }
                      updateAnswer('cast', val);
                    }}
                    options={[
                      { value: 'product', label: 'Fokus Objek / Produk Saja' },
                      { value: 'person', label: 'Tampilkan Karakter / Presenter' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-bold text-[var(--text-primary)]">
                    Model Veo di Google Flow
                  </label>
                  <CustomSelect<QualityTier>
                    value={answers.quality}
                    onChange={(val) => updateAnswer('quality', val)}
                    options={Object.values(MODELS).map((m) => ({
                      value: m.id,
                      label: `${m.title} (${m.credits * plan.roles.length} cr)`,
                    }))}
                  />
                </div>
              </div>

              {answers.cast === 'person' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13.5px] font-bold text-[var(--text-primary)]">
                    Pilih karakter tetap
                  </label>
                  <CustomSelect<string>
                    value={answers.characterId || 'sinta'}
                    onChange={(val) => updateAnswer('characterId', val)}
                    options={Object.values(CHARACTERS).map((ch) => ({
                      value: ch.id,
                      label: `${ch.name} — ${ch.desc}`,
                    }))}
                  />
                </div>
              )}

              {/* Neo-Brutalist Summary Callout with Purple Accent */}
              <div className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--accent-purple-soft)] p-4 space-y-1 text-[13.5px]">
                <div className="flex items-center gap-2 font-display font-bold text-[var(--text-primary)]">
                  <Target size={16} strokeWidth={2.5} className="text-[var(--accent-purple-fg)]" />
                  <span>Ringkasan StudioFlow: {answers.product || 'Produk Kamu'}</span>
                </div>
                <div className="font-medium text-[var(--text-primary)]">
                  Style: <strong>{currentVideoStyle.name}</strong> · Hook:{' '}
                  <strong>{currentHook.name}</strong> · {plan.roles.length} klip ({answers.durationS}s ·{' '}
                  {answers.aspect}) · Estimasi <strong>±{estimatedCredits} credit Flow</strong>
                </div>
              </div>
            </div>
          )}

          {/* Step Footer */}
          <div className="mt-7 flex items-center justify-between gap-3 border-t-2 border-[var(--border-strong)] pt-5">
            {step > 1 ? (
              <Button
                variant="secondary"
                size="lg"
                icon={<ArrowLeft size={16} strokeWidth={2.5} />}
                onClick={goBack}
              >
                Kembali
              </Button>
            ) : (
              <span className="font-mono text-[12px] font-bold text-[var(--text-tertiary)]">
                STEP 01 / 05
              </span>
            )}

            {step < 5 ? (
              <Button
                size="lg"
                iconRight={<ArrowRight size={17} strokeWidth={2.6} />}
                onClick={goNext}
              >
                Lanjut: {GUIDED_STEPS[step].label}
              </Button>
            ) : (
              <Button
                size="lg"
                loading={generating}
                iconRight={<ArrowRight size={17} strokeWidth={2.6} />}
                onClick={handleGeneratePack}
              >
                {generating ? 'Menyusun Panduan...' : 'Buat Panduan Sekarang'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
