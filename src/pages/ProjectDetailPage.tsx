import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  FileText,
  HelpCircle,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  buildCustomCharacterLock,
  CAMERA_PRESETS,
  CHARACTERS,
  cleanSingleLinePrompt,
  exportPackAsMarkdown,
  exportPackAsText,
  recalculatePack,
  VIBES,
  VIDEO_STYLES,
} from '@shared/director';
import type { Scene } from '@shared/types';
import { downloadTextFile, generateVariationSmart } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Chip,
  CopyButton,
  ProgressBar,
  SegmentedControl,
  Switch,
  Tag,
} from '@/components/ui/Primitives';
import { ConfirmModal, CustomSelect } from '@/components/ui/CustomControls';

type WorkspaceTab = 'panduan' | 'adegan';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    projects,
    settings,
    health,
    copyText,
    upsertProject,
    toggleProjectStep,
    pushToast,
  } = useApp();

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  const initialTab: WorkspaceTab = searchParams.get('tab') === 'adegan' ? 'adegan' : 'panduan';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [varyingSceneId, setVaryingSceneId] = useState<string | null>(null);
  const [deleteSceneTarget, setDeleteSceneTarget] = useState<Scene | null>(null);
  const [editingCharacterLock, setEditingCharacterLock] = useState(false);
  const [charDraft, setCharDraft] = useState('');

  useEffect(() => {
    if (!project?.pack) return;
    const firstIdx = project.pack.steps.findIndex(
      (s) => !project.completedStepIds.includes(s.id)
    );
    setCurrentStepIdx(firstIdx >= 0 ? firstIdx : 0);
  }, [project?.id]);

  if (!project || !project.pack) {
    return (
      <AppShell>
        <div className="neo-card mx-auto max-w-md rounded-2xl p-8 text-center">
          <h1 className="font-display text-[19px] font-bold text-[var(--text-primary)]">
            Proyek tidak ditemukan
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
            Proyek ini mungkin sudah dihapus dari browser ini.
          </p>
          <div className="mt-5 flex justify-center gap-2.5">
            <Button variant="secondary" onClick={() => navigate('/proyek')}>
              Proyek Saya
            </Button>
            <Button onClick={() => navigate('/')}>Buat Video Baru</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const pack = project.pack;
  const totalSteps = pack.steps.length;
  const completedCount = pack.steps.filter((s) => project.completedStepIds.includes(s.id)).length;
  const progressFraction = totalSteps > 0 ? completedCount / totalSteps : 0;
  const allFinished = completedCount >= totalSteps;

  const safeStepIdx = Math.min(Math.max(0, currentStepIdx), totalSteps - 1);
  const activeStep = pack.steps[safeStepIdx];
  const isStepDone = activeStep ? project.completedStepIds.includes(activeStep.id) : false;

  const switchTab = (next: WorkspaceTab) => {
    setActiveTab(next);
    setSearchParams(next === 'adegan' ? { tab: 'adegan' } : {});
  };

  const handleMarkAndNext = () => {
    if (!activeStep) return;
    if (!isStepDone) {
      toggleProjectStep(project.id, activeStep.id);
    }
    setTipsOpen(false);
    if (safeStepIdx < totalSteps - 1) {
      setCurrentStepIdx(safeStepIdx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      pushToast('Selamat! Semua langkah pembuatan video selesai!', 'success');
    }
  };

  const updateScene = (idx: number, patch: Partial<Scene>) => {
    const nextScenes = pack.scenes.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    const nextPack = recalculatePack({ ...pack, scenes: nextScenes }, project.answers);
    upsertProject({
      ...project,
      pack: nextPack,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddScene = () => {
    const last = pack.scenes[pack.scenes.length - 1];
    const newScene: Scene = {
      id: `sc-${Date.now().toString(36)}`,
      idx: pack.scenes.length,
      role: 'detail',
      label: `Adegan ${pack.scenes.length + 1}`,
      art: 'produk',
      description: `Close-up tambahan produk ${project.answers.product}.`,
      actionEn: `clean close-up showcase of ${project.answers.product} highlighting fine details and craftsmanship`,
      prompt: '',
      shot: 'macro close-up, 85mm lens, shallow depth of field',
      camera: 'slow push-in',
      cameraId: 'Push-in',
      durationS: 5,
      mode: 'ingredients',
      chainFromPrev: false,
      assets: last?.assets ?? ['product'],
      credits: pack.settings.creditsScene,
      tips: [],
      sfx: 'subtle crisp room tone',
    };
    const nextPack = recalculatePack(
      { ...pack, scenes: [...pack.scenes, newScene] },
      project.answers
    );
    upsertProject({
      ...project,
      pack: nextPack,
      updatedAt: new Date().toISOString(),
    });
    setEditingSceneId(newScene.id);
    pushToast('Adegan baru ditambahkan', 'success');
  };

  const handleConfirmDeleteScene = () => {
    if (!deleteSceneTarget || pack.scenes.length <= 1) return;
    const filtered = pack.scenes.filter((s) => s.id !== deleteSceneTarget.id);
    const nextPack = recalculatePack({ ...pack, scenes: filtered }, project.answers);
    upsertProject({
      ...project,
      pack: nextPack,
      updatedAt: new Date().toISOString(),
    });
    pushToast('Adegan dihapus', 'info');
  };

  const handleVariateScene = async (sc: Scene, idx: number) => {
    setVaryingSceneId(sc.id);
    try {
      const { scene: varied } = await generateVariationSmart(
        sc,
        pack.bible,
        project.answers,
        Boolean(settings.useLlmWhenAvailable && health.llmAvailable),
        Date.now() + idx
      );
      const nextScenes = pack.scenes.map((item, i) => (i === idx ? varied : item));
      const nextPack = recalculatePack({ ...pack, scenes: nextScenes }, project.answers);
      upsertProject({
        ...project,
        pack: nextPack,
        updatedAt: new Date().toISOString(),
      });
      pushToast(`Variasi Adegan ${idx + 1} diperbarui`, 'success');
    } finally {
      setVaryingSceneId(null);
    }
  };

  const slug =
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'studioflow';

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[700px] flex-col gap-5">
        {/* Neo-Brutalist Project Header Card */}
        <div className="neo-card rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <Tag tone="brand">{pack.bible.videoStyleName || 'Realistis'}</Tag>
                {pack.bible.hookStrategyName && (
                  <Tag tone="purple">Hook: {pack.bible.hookStrategyName}</Tag>
                )}
                {pack.bible.characterLock && (
                  <Tag tone="success">Karakter: {pack.bible.characterName || 'Terkunci'}</Tag>
                )}
                <Tag>
                  {pack.settings.aspect} · ±{pack.settings.creditsTotal} cr
                </Tag>
              </div>
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-[var(--text-primary)]">
                {project.name}
              </h1>
            </div>

            <a
              href="https://flow.google.com/?hl=en"
              target="_blank"
              rel="noreferrer"
              className="neo-btn inline-flex h-10.5 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-[13.5px] font-bold text-[#111111]"
            >
              <span>Buka Google Flow</span>
              <ExternalLink size={15} strokeWidth={2.5} />
            </a>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="font-bold text-[var(--text-secondary)]">Progres Panduan</span>
              <span className="font-mono font-bold text-[var(--text-primary)] tnum">
                {completedCount}/{totalSteps} selesai
              </span>
            </div>
            <ProgressBar fraction={progressFraction} height={11} />
          </div>

          <div className="mt-4 pt-4 border-t-2 border-[var(--border-strong)] flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl<WorkspaceTab>
              value={activeTab}
              onChange={switchTab}
              items={[
                { value: 'panduan', label: 'Panduan Urut' },
                { value: 'adegan', label: `Semua Prompt (${pack.scenes.length})` },
              ]}
            />

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                icon={<FileText size={14} />}
                onClick={() => {
                  downloadTextFile(`${slug}-prompt.txt`, exportPackAsText(pack));
                  pushToast('File .txt diunduh', 'success');
                }}
              >
                .txt
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadTextFile(
                    `${slug}-prompt.md`,
                    exportPackAsMarkdown(pack),
                    'text/markdown;charset=utf-8'
                  );
                  pushToast('File .md diunduh', 'success');
                }}
              >
                .md
              </Button>
            </div>
          </div>
        </div>

        {/* ==================== TAB 1: ONE-STEP-AT-A-TIME FOCUS GUIDE ==================== */}
        {activeTab === 'panduan' && activeStep && (
          <div className="flex flex-col gap-4">
            {/* Clickable Neo-Brutalist Numbered Step Rail */}
            <div className="neo-card flex items-center gap-2 overflow-x-auto rounded-2xl p-3">
              {pack.steps.map((st, idx) => {
                const done = project.completedStepIds.includes(st.id);
                const active = idx === safeStepIdx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setCurrentStepIdx(idx);
                      setTipsOpen(false);
                    }}
                    className={`flex h-10 min-w-[42px] flex-1 items-center justify-center rounded-xl border-2 border-[var(--border-strong)] font-mono text-[13px] font-bold transition-all ${
                      active
                        ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[2px_2px_0_var(--border-strong)] -translate-y-[1px]'
                        : done
                          ? 'bg-[var(--accent-purple)] text-white'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                    }`}
                  >
                    {done && !active ? <Check size={15} strokeWidth={3} /> : idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active Step Hero Card */}
            <div className="neo-card rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Tag tone="purple">
                  LANGKAH {safeStepIdx + 1} DARI {totalSteps}
                </Tag>
                <span className="rounded-md border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-0.5 font-mono text-[11.5px] font-bold text-[var(--text-primary)] tnum">
                  {activeStep.credits === 0
                    ? '0 CREDIT (GRATIS)'
                    : `±${activeStep.credits} CREDIT FLOW`}
                </span>
              </div>

              <div>
                <h2 className="font-display text-[21px] sm:text-[24px] font-bold leading-snug text-[var(--text-primary)]">
                  {activeStep.title}
                </h2>
                <p className="mt-1.5 text-[14.5px] font-medium text-[var(--text-secondary)] leading-relaxed">
                  {activeStep.instruction}
                </p>
              </div>

              {activeStep.buttons.length > 0 && (
                <div className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4">
                  <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    TOMBOL YANG DIKLIK DI GOOGLE FLOW:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeStep.buttons.map((b, bIdx) => (
                      <React.Fragment key={`${b.label}-${bIdx}`}>
                        {bIdx > 0 && (
                          <ArrowRight size={14} strokeWidth={2.5} className="text-[var(--text-primary)]" />
                        )}
                        <span className="rounded-lg border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-[12px] font-bold text-[var(--text-primary)] shadow-[2px_2px_0_var(--border-strong)]">
                          {b.label}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="text-[13px] font-bold uppercase tracking-wide text-[var(--text-primary)]">
                  Ikuti urutan ini:
                </div>
                <ol className="space-y-2.5">
                  {activeStep.substeps.map((sub, sIdx) => (
                    <li
                      key={sIdx}
                      className="flex items-start gap-3 text-[14px] font-medium text-[var(--text-primary)] leading-relaxed"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[var(--border-strong)] bg-[var(--brand-primary)] font-mono text-[11.5px] font-bold text-[#111111]">
                        {sIdx + 1}
                      </span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {activeStep.prompt && (
                <div className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[12px] font-bold uppercase text-[var(--text-primary)]">
                      {activeStep.promptLabel || 'PROMPT SIAP TEMPEL'}
                    </span>
                    <CopyButton
                      text={activeStep.prompt}
                      onCopy={copyText}
                      variant="primary"
                      size="md"
                      label="Salin Prompt Ini"
                      copiedLabel="Tersalin! Tempel di Flow"
                    />
                  </div>
                  <p className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 font-mono text-[12px] font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words select-all">
                    {activeStep.prompt}
                  </p>
                </div>
              )}

              {activeStep.tips.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setTipsOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--accent-purple)] hover:underline"
                  >
                    <HelpCircle size={15} strokeWidth={2.5} />
                    <span>Kendala / ditolak Flow? Buka tips solusi</span>
                    {tipsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {tipsOpen && (
                    <div className="mt-2.5 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--accent-purple-soft)] p-3.5 text-[13px] font-medium text-[var(--text-primary)] space-y-1.5">
                      {activeStep.tips.map((tip, tIdx) => (
                        <p key={tIdx}>• {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--border-strong)] pt-5">
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={safeStepIdx === 0}
                  icon={<ArrowLeft size={16} strokeWidth={2.5} />}
                  onClick={() => {
                    setCurrentStepIdx(Math.max(0, safeStepIdx - 1));
                    setTipsOpen(false);
                  }}
                >
                  Sebelumnya
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<CheckCircle2 size={18} strokeWidth={2.5} />}
                  iconRight={
                    safeStepIdx < totalSteps - 1 ? (
                      <ArrowRight size={17} strokeWidth={2.6} />
                    ) : undefined
                  }
                  onClick={handleMarkAndNext}
                >
                  {safeStepIdx < totalSteps - 1
                    ? `Selesai, Lanjut Langkah ${safeStepIdx + 2}`
                    : allFinished
                      ? 'Semua Selesai'
                      : 'Tandai Selesai Semua'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: SEMUA PROMPT & EDIT ==================== */}
        {activeTab === 'adegan' && (
          <div className="flex flex-col gap-4">
            <div className="neo-card rounded-2xl px-4 py-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Cukup <strong>1x Salin & Tempel</strong> per adegan — kunci karakter sudah otomatis menyatu di dalam setiap prompt.
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={editingCharacterLock ? 'purple' : 'secondary'}
                    size="sm"
                    icon={<Edit3 size={13} strokeWidth={2.4} />}
                    onClick={() => {
                      setCharDraft(pack.bible.characterLock || '');
                      setEditingCharacterLock((v) => !v);
                    }}
                  >
                    {editingCharacterLock ? 'Tutup' : 'Ganti Karakter'}
                  </Button>
                  <CopyButton
                    text={exportPackAsText(pack)}
                    onCopy={copyText}
                    variant="secondary"
                    size="sm"
                    label="Salin Semua"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} strokeWidth={2.5} />}
                    onClick={handleAddScene}
                  >
                    Adegan Baru
                  </Button>
                </div>
              </div>

              {editingCharacterLock && (
                <div className="space-y-3 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                      Pilih cepat preset karakter:
                    </label>
                    <CustomSelect<string>
                      value=""
                      placeholder="Ganti dengan preset karakter..."
                      options={Object.values(CHARACTERS).map((ch) => ({
                        value: ch.id,
                        label: `${ch.name} — ${ch.desc}`,
                      }))}
                      onChange={(cid) => {
                        const preset = CHARACTERS[cid];
                        if (!preset) return;
                        const vStyle = VIDEO_STYLES[project.answers.videoStyle || 'real-live'];
                        setCharDraft(`${preset.lock}, ${vStyle.characterAdapterEn}`);
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                      Atau tulis ciri karakter sendiri (otomatis digabungkan ke dalam semua prompt adegan):
                    </label>
                    <textarea
                      rows={3}
                      value={charDraft}
                      onChange={(e) => setCharDraft(e.target.value)}
                      placeholder="Contoh: Cowok 24 thn rambut ikal pendek, kacamata bulat tipis, pakai hoodie hitam..."
                      className="w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 font-mono text-[12px] font-medium focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const raw = charDraft.trim();
                        if (!raw) {
                          pushToast('Isi deskripsi karakter terlebih dahulu', 'danger');
                          return;
                        }
                        const vStyle = VIDEO_STYLES[project.answers.videoStyle || 'real-live'];
                        const vibe = VIBES[project.answers.vibe] ?? VIBES.minimalis;
                        const isAlreadyDetailedEn =
                          raw.length > 90 && /\b(wearing|hair|face|eyes)\b/i.test(raw);
                        const built = isAlreadyDetailedEn
                          ? {
                              lock: raw,
                              voiceLock:
                                pack.bible.characterVoiceLock ||
                                'consistent natural Indonesian voice timbre',
                            }
                          : buildCustomCharacterLock(raw, vStyle);

                        const nextBible = {
                          ...pack.bible,
                          characterName: pack.bible.characterName || 'Karakter Utama',
                          characterLock: built.lock,
                          characterVoiceLock: built.voiceLock,
                        };

                        const hasCharAsset = pack.assets.some((a) => a.id === 'character');
                        const nextAssets = hasCharAsset
                          ? pack.assets
                          : [
                              {
                                id: 'character' as const,
                                name: `Gambar Patokan Karakter (${nextBible.characterName})`,
                                upload: false,
                                purpose: `Buat 1 potret patokan karakter bergaya "${vStyle.name}" (gratis 0 credit) agar wajah & pakaian 100% sama.`,
                                prompt: cleanSingleLinePrompt(
                                  `Clean character model reference portrait of ${built.lock}, rendered in ${vStyle.assetStyleEn}, waist-up front-facing natural pose, solid clean neutral background matching ${vibe.palette}, no text, no watermark.`
                                ),
                              },
                              ...pack.assets,
                            ];

                        const nextAnswers = { ...project.answers, cast: 'person' as const };
                        const nextPack = recalculatePack(
                          { ...pack, bible: nextBible, assets: nextAssets },
                          nextAnswers
                        );
                        upsertProject({
                          ...project,
                          answers: nextAnswers,
                          pack: nextPack,
                          updatedAt: new Date().toISOString(),
                        });
                        setEditingCharacterLock(false);
                        pushToast(
                          `Karakter diperbarui & otomatis menyatu di dalam semua ${nextPack.scenes.length} prompt adegan!`,
                          'success'
                        );
                      }}
                    >
                      Simpan ke Semua Adegan
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {pack.scenes.map((sc, idx) => {
              const isEditing = editingSceneId === sc.id;
              return (
                <div key={sc.id} className="neo-card rounded-2xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone={idx === 0 ? 'purple' : 'brand'}>ADEGAN 0{idx + 1}</Tag>
                      <span className="font-display text-[16px] font-bold text-[var(--text-primary)]">
                        {sc.label}
                      </span>
                      <span className="font-mono text-[12px] font-bold text-[var(--text-tertiary)]">
                        ({sc.durationS}s · {sc.cameraId})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={varyingSceneId === sc.id}
                        icon={<RefreshCw size={13} strokeWidth={2.4} />}
                        onClick={() => handleVariateScene(sc, idx)}
                      >
                        Variasi
                      </Button>
                      <Button
                        variant={isEditing ? 'purple' : 'secondary'}
                        size="sm"
                        icon={<Edit3 size={13} strokeWidth={2.4} />}
                        onClick={() =>
                          setEditingSceneId((curr) => (curr === sc.id ? null : sc.id))
                        }
                      >
                        {isEditing ? 'Tutup' : 'Ubah'}
                      </Button>
                      <CopyButton text={sc.prompt} onCopy={copyText} size="sm" label="Salin" />
                    </div>
                  </div>

                  <p className="text-[13.5px] font-medium text-[var(--text-secondary)]">
                    {sc.description}
                  </p>

                  {isEditing && (
                    <div className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4 space-y-3.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                          Catatan alur (Bahasa Indonesia)
                        </label>
                        <input
                          type="text"
                          value={sc.description}
                          onChange={(e) => updateScene(idx, { description: e.target.value })}
                          className="h-10.5 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[13px] font-medium focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                          Gerakan kamera
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {CAMERA_PRESETS.slice(0, 7).map((cam) => (
                            <Chip
                              key={cam.id}
                              label={cam.label}
                              selected={sc.cameraId === cam.id}
                              onClick={() =>
                                updateScene(idx, { cameraId: cam.id, camera: cam.en })
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                            Durasi klip
                          </label>
                          <SegmentedControl<number>
                            fullWidth
                            value={sc.durationS}
                            onChange={(d) => updateScene(idx, { durationS: d })}
                            items={[
                              { value: 4, label: '4 dtk' },
                              { value: 6, label: '6 dtk' },
                              { value: 8, label: '8 dtk' },
                            ]}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                            Dialog / Narasi (opsional)
                          </label>
                          <input
                            type="text"
                            value={sc.dialogue || ''}
                            onChange={(e) => updateScene(idx, { dialogue: e.target.value })}
                            placeholder="Tanpa suara bicara..."
                            className="h-10.5 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[13px] font-medium focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {idx > 0 ? (
                          <div className="flex items-center gap-2.5 text-[12.5px] font-semibold">
                            <Switch
                              checked={sc.chainFromPrev}
                              onChange={(v) => updateScene(idx, { chainFromPrev: v })}
                              label="Sambung mulus dari adegan sebelumnya"
                            />
                            <span>Sambung mulus dari Adegan {idx}</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        {pack.scenes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDeleteSceneTarget(sc)}
                            className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--danger-fg)] hover:underline"
                          >
                            <Trash2 size={14} />
                            <span>Hapus adegan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3.5 font-mono text-[11.5px] font-medium text-[var(--text-primary)] leading-relaxed">
                    {sc.prompt}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteSceneTarget)}
        onClose={() => setDeleteSceneTarget(null)}
        onConfirm={handleConfirmDeleteScene}
        title="Hapus adegan ini?"
        description={`Adegan "${deleteSceneTarget?.label}" akan dihapus dari urutan video.`}
        confirmLabel="Hapus"
      />
    </AppShell>
  );
}
