import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
  UserCheck,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  buildNextEpisodeAnswers,
  CAMERA_PRESETS,
  CHARACTERS,
  type CharacterSwapSelection,
  exportPackAsMarkdown,
  exportPackAsText,
  recalculatePack,
  swapPackCharacter,
  VIDEO_STYLES,
} from '@shared/director';
import type { Project, Scene } from '@shared/types';
import { downloadTextFile, generatePackSmart, generateVariationSmart } from '@/lib/api';
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
import { ConfirmModal, CustomModal } from '@/components/ui/CustomControls';

type WorkspaceTab = 'panduan' | 'adegan';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    projects,
    library,
    health,
    copyText,
    upsertProject,
    toggleProjectStep,
    pushToast,
  } = useApp();

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const savedCharacters = useMemo(
    () => library.filter((item) => item.kind === 'character'),
    [library]
  );
  const seriesEpisodes = useMemo(
    () =>
      project?.seriesId
        ? projects
            .filter((p) => p.seriesId === project.seriesId)
            .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
        : [],
    [projects, project?.seriesId]
  );
  const [nextEpOpen, setNextEpOpen] = useState(false);
  const [nextEpGoal, setNextEpGoal] = useState('');
  const [nextEpBusy, setNextEpBusy] = useState(false);

  const initialTab: WorkspaceTab = searchParams.get('tab') === 'adegan' ? 'adegan' : 'panduan';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [varyingSceneId, setVaryingSceneId] = useState<string | null>(null);
  const [deleteSceneTarget, setDeleteSceneTarget] = useState<Scene | null>(null);

  const [charModalOpen, setCharModalOpen] = useState(false);
  const [charModalTab, setCharModalTab] = useState<'preset' | 'custom' | 'none'>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('raka');
  const [customCharName, setCustomCharName] = useState('Riko');
  const [customCharTraits, setCustomCharTraits] = useState('');

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
            <Button onClick={() => navigate('/buat')}>Buat Video Baru</Button>
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
        Boolean(health.llmAvailable),
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

  const openCharacterModal = () => {
    const hasChar = Boolean(pack.bible.characterLock);
    const currentId = project.answers.characterId;
    if (!hasChar) {
      setCharModalTab('preset');
      setSelectedPresetKey('sinta');
    } else if (currentId === 'custom') {
      setCharModalTab('custom');
      setCustomCharName(pack.bible.characterName || 'Karakter Utama');
      setCustomCharTraits(project.answers.characterCustom || pack.bible.characterLock || '');
    } else {
      setCharModalTab('preset');
      setSelectedPresetKey(currentId && CHARACTERS[currentId] ? currentId : 'raka');
    }
    setCharModalOpen(true);
  };

  const handleApplyCharacterSwap = () => {
    let selection: CharacterSwapSelection;
    if (charModalTab === 'none') {
      selection = { mode: 'none' };
    } else if (charModalTab === 'custom') {
      if (!customCharTraits.trim()) {
        pushToast('Tulis ciri fisik & pakaian karakter terlebih dahulu', 'danger');
        return;
      }
      selection = {
        mode: 'custom',
        name: customCharName.trim() || 'Karakter Utama',
        customTraits: customCharTraits.trim(),
      };
    } else if (selectedPresetKey.startsWith('lib:')) {
      const libId = selectedPresetKey.slice(4);
      const found = savedCharacters.find((c) => c.id === libId);
      if (!found) return;
      selection = {
        mode: 'library',
        id: found.id,
        name: found.name,
        lockText: found.lockText,
      };
    } else {
      selection = {
        mode: 'preset',
        presetId: selectedPresetKey,
      };
    }

    const res = swapPackCharacter(pack, project.answers, selection);
    upsertProject({
      ...project,
      answers: res.answers,
      pack: res.pack,
      updatedAt: new Date().toISOString(),
    });
    setCharModalOpen(false);
    if (selection.mode === 'none') {
      pushToast('Karakter dilepas — alur cerita & adegan tetap konsisten', 'info');
    } else {
      pushToast(
        `Karakter "${res.pack.bible.characterName}" diterapkan! Gambar patokan & semua ${res.pack.scenes.length} adegan tetap konsisten.`,
        'success'
      );
    }
  };

  const episode = pack.episode;
  const latestEpisode = seriesEpisodes[seriesEpisodes.length - 1];
  const isLatestEpisode = !latestEpisode || latestEpisode.id === project.id;
  const nextNumber = (episode?.number ?? 1) + 1;

  const handleCreateNextEpisode = async () => {
    setNextEpBusy(true);
    try {
      const nextAnswers = buildNextEpisodeAnswers(project.answers, pack, nextEpGoal);
      const { pack: nextPack } = await generatePackSmart(
        project.templateId,
        nextAnswers,
        Boolean(health.llmAvailable)
      );
      const now = new Date().toISOString();
      const seriesId = project.seriesId ?? `series-${Date.now().toString(36)}`;
      if (!project.seriesId) {
        upsertProject({ ...project, seriesId, episodeNumber: episode?.number ?? 1 });
      }
      const nextProject: Project = {
        id: `proj-${Date.now().toString(36)}`,
        name: nextPack.title,
        templateId: project.templateId,
        templateName: project.templateName,
        art: project.art,
        status: 'panduan',
        answers: nextAnswers,
        pack: nextPack,
        completedStepIds: [],
        createdAt: now,
        updatedAt: now,
        seriesId,
        episodeNumber: nextPack.episode?.number ?? nextNumber,
      };
      upsertProject(nextProject);
      setNextEpOpen(false);
      setNextEpGoal('');
      pushToast(`Part ${nextProject.episodeNumber} siap! Karakter & latar tetap sama.`, 'success');
      navigate(`/proyek/${nextProject.id}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Gagal membuat part berikutnya', 'danger');
    } finally {
      setNextEpBusy(false);
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
                {episode && <Tag tone="purple">Seri · Part {episode.number}</Tag>}
                <Tag tone="brand">{pack.bible.videoStyleName || 'Realistis'}</Tag>
                {pack.bible.hookStrategyName && (
                  <Tag tone="purple">Hook: {pack.bible.hookStrategyName}</Tag>
                )}
                {pack.bible.characterLock ? (
                  <Tag tone="success">Karakter: {pack.bible.characterName || 'Terkunci'}</Tag>
                ) : (
                  <Tag>Tanpa Karakter</Tag>
                )}
                <Tag>
                  {pack.settings.aspect} · ±{pack.settings.creditsTotal} cr
                </Tag>
              </div>
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-[var(--text-primary)]">
                {project.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                icon={<UserCheck size={15} strokeWidth={2.5} />}
                onClick={openCharacterModal}
              >
                {pack.bible.characterLock ? 'Ganti Karakter' : '+ Pasang Karakter'}
              </Button>
              <a
                href="https://flow.google.com/?hl=en"
                target="_blank"
                rel="noreferrer"
                className="neo-btn inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-[13.5px] font-bold text-[#111111]"
              >
                <span>Buka Google Flow</span>
                <ExternalLink size={15} strokeWidth={2.5} />
              </a>
            </div>
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

        {/* ==================== SERIES: EPISODE LIST & NEXT PART ==================== */}
        {episode && (
          <div className="neo-card rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--accent-purple)]">
                  <BookOpen size={14} strokeWidth={2.5} />
                  Video berseri
                </div>
                <h2 className="mt-1 font-display text-[18px] font-bold text-[var(--text-primary)]">
                  {episode.seriesTitle}
                </h2>
              </div>
              {isLatestEpisode ? (
                <Button
                  icon={<Plus size={15} strokeWidth={2.6} />}
                  onClick={() => setNextEpOpen(true)}
                >
                  Buat Part {nextNumber}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  icon={<ArrowRight size={15} strokeWidth={2.6} />}
                  onClick={() => navigate(`/proyek/${latestEpisode.id}`)}
                >
                  Ke Part {latestEpisode.episodeNumber}
                </Button>
              )}
            </div>

            {seriesEpisodes.length > 1 && (
              <nav aria-label="Daftar part" className="mt-3 flex flex-wrap gap-2">
                {seriesEpisodes.map((ep) => {
                  const current = ep.id === project.id;
                  return (
                    <Link
                      key={ep.id}
                      to={`/proyek/${ep.id}`}
                      aria-current={current ? 'page' : undefined}
                      className={`rounded-lg border-2 border-[var(--border-strong)] px-3 py-1.5 text-[13px] font-bold ${
                        current
                          ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[var(--shadow-xs)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      Part {ep.episodeNumber}
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="mt-3 grid gap-2 text-[13.5px] sm:grid-cols-2">
              {episode.previouslyId && (
                <div className="rounded-xl border-2 border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3">
                  <div className="text-[12px] font-bold text-[var(--text-tertiary)]">Pembuka (rekap)</div>
                  <p className="mt-1 leading-snug text-[var(--text-primary)]">{episode.previouslyId}</p>
                </div>
              )}
              <div
                className={`rounded-xl border-2 border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 ${
                  episode.previouslyId ? '' : 'sm:col-span-2'
                }`}
              >
                <div className="text-[12px] font-bold text-[var(--text-tertiary)]">Penutup (cliffhanger)</div>
                <p className="mt-1 leading-snug text-[var(--text-primary)]">{episode.cliffhangerId}</p>
              </div>
            </div>
          </div>
        )}

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
                    variant="secondary"
                    size="sm"
                    icon={<UserCheck size={13} strokeWidth={2.4} />}
                    onClick={openCharacterModal}
                  >
                    {pack.bible.characterLock ? 'Ganti Karakter' : '+ Pasang Karakter'}
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

      <CustomModal
        open={nextEpOpen}
        onClose={() => !nextEpBusy && setNextEpOpen(false)}
        title={`Buat Part ${nextNumber}${episode ? ` · ${episode.seriesTitle}` : ''}`}
        description="Karakter, pakaian, latar, cahaya, dan style dari part sebelumnya dikunci. Part baru dibuka dengan rekap singkat, lalu ditutup cliffhanger lagi."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" disabled={nextEpBusy} onClick={() => setNextEpOpen(false)}>
              Batal
            </Button>
            <Button
              icon={<ArrowRight size={15} strokeWidth={2.6} />}
              disabled={nextEpBusy}
              onClick={handleCreateNextEpisode}
            >
              {nextEpBusy ? 'Menyusun...' : `Buat Part ${nextNumber}`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {episode?.cliffhangerId && (
            <div className="rounded-xl border-2 border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 text-[13.5px]">
              <div className="text-[12px] font-bold text-[var(--text-tertiary)]">
                Part {episode.number} berakhir di
              </div>
              <p className="mt-1 leading-snug text-[var(--text-primary)]">{episode.cliffhangerId}</p>
            </div>
          )}
          <label htmlFor="next-ep-goal" className="text-[14px] font-bold text-[var(--text-primary)]">
            Apa yang terjadi di Part {nextNumber}? · opsional
          </label>
          <textarea
            id="next-ep-goal"
            rows={3}
            value={nextEpGoal}
            onChange={(e) => setNextEpGoal(e.target.value)}
            placeholder="Contoh: Ternyata tetangga kos sebelah orang yang dulu aku kenal"
            className="w-full resize-none rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-3 text-[14px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:shadow-[var(--focus-ring)]"
          />
          <p className="text-[12.5px] leading-snug text-[var(--text-secondary)]">
            Kosongkan kalau mau ceritanya dilanjutkan otomatis. Isi satu kalimat kejadian utama supaya
            alurnya sesuai keinginanmu.
          </p>
        </div>
      </CustomModal>

      <CustomModal
        open={charModalOpen}
        onClose={() => setCharModalOpen(false)}
        title={
          pack.bible.characterLock
            ? 'Ganti Karakter Utama (Alur Tetap Konsisten)'
            : 'Pasang Karakter Konsisten ke Semua Adegan'
        }
        description="Topik, cerita, latar ruangan, style visual, kamera, dan dialog tetap 100% sama — hanya pemeran utama yang diperbarui di Gambar Patokan & semua adegan."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCharModalOpen(false)}>
              Batal
            </Button>
            <Button
              icon={<Check size={15} strokeWidth={2.8} />}
              onClick={handleApplyCharacterSwap}
            >
              Terapkan ke Semua Adegan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--accent-purple-soft)] px-3.5 py-2.5 text-[12.5px] font-bold text-[var(--text-primary)]">
            <span>
              Style Terkunci:{' '}
              <strong>
                {VIDEO_STYLES[project.answers.videoStyle || 'real-live']?.name ||
                  pack.bible.videoStyleName}
              </strong>
            </span>
            <Tag tone="purple">{pack.scenes.length} Adegan Tetap Sama</Tag>
          </div>

          <SegmentedControl<'preset' | 'custom' | 'none'>
            fullWidth
            value={charModalTab}
            onChange={setCharModalTab}
            items={[
              { value: 'preset', label: 'Pilih Karakter Preset' },
              { value: 'custom', label: 'Tulis Karakter Sendiri' },
              { value: 'none', label: 'Tanpa Karakter' },
            ]}
          />

          {charModalTab === 'preset' && (
            <div className="grid max-h-[320px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {Object.values(CHARACTERS).map((ch) => {
                const selected = selectedPresetKey === ch.id;
                const isCurrent =
                  Boolean(pack.bible.characterLock) &&
                  pack.bible.characterName?.toLowerCase() === ch.name.toLowerCase();
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedPresetKey(ch.id)}
                    className={`flex flex-col justify-between gap-1.5 rounded-xl border-2 border-[var(--border-strong)] p-3 text-left transition-all ${
                      selected
                        ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[3px_3px_0_var(--border-strong)] -translate-y-[1px]'
                        : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-[14.5px] font-bold">{ch.name}</span>
                        {isCurrent && <Tag tone="purple">Aktif</Tag>}
                      </div>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[#111111] ${
                          selected ? 'bg-[#111111] text-[var(--brand-primary)]' : 'bg-[var(--bg-surface)]'
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                    </div>
                    <p
                      className={`text-[12px] leading-snug ${
                        selected
                          ? 'text-[#111111]/85 font-medium'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {ch.desc}
                    </p>
                  </button>
                );
              })}

              {savedCharacters
                .filter((c) => c.id !== 'lib-char-sinta')
                .map((libChar) => {
                  const key = `lib:${libChar.id}`;
                  const selected = selectedPresetKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPresetKey(key)}
                      className={`flex flex-col justify-between gap-1.5 rounded-xl border-2 border-[var(--border-strong)] p-3 text-left transition-all ${
                        selected
                          ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[3px_3px_0_var(--border-strong)] -translate-y-[1px]'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-[14.5px] font-bold">
                            {libChar.name}
                          </span>
                          <Tag>Pustaka</Tag>
                        </div>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-[#111111] ${
                            selected
                              ? 'bg-[#111111] text-[var(--brand-primary)]'
                              : 'bg-[var(--bg-surface)]'
                          }`}
                        >
                          {selected && <Check size={12} strokeWidth={3} />}
                        </span>
                      </div>
                      <p
                        className={`text-[12px] leading-snug ${
                          selected
                            ? 'text-[#111111]/85 font-medium'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {libChar.subtitle || libChar.lockText.slice(0, 70)}
                      </p>
                    </button>
                  );
                })}
            </div>
          )}

          {charModalTab === 'custom' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                  Nama panggilan karakter
                </label>
                <input
                  type="text"
                  value={customCharName}
                  onChange={(e) => setCustomCharName(e.target.value)}
                  placeholder="Contoh: Riko, Maya, atau Pak Budi"
                  className="h-10.5 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[13.5px] font-semibold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12.5px] font-bold text-[var(--text-primary)]">
                  Detail wajah, rambut, aksesoris & pakaian tetap
                </label>
                <textarea
                  rows={3}
                  value={customCharTraits}
                  onChange={(e) => setCustomCharTraits(e.target.value)}
                  placeholder="Contoh: Laki-laki 25 thn rambut ikal pendek, kacamata bulat tipis, pakai jaket hoodie biru tua & kaos putih..."
                  className="w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 text-[13px] font-medium focus:outline-none"
                />
              </div>
            </div>
          )}

          {charModalTab === 'none' && (
            <div className="rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4 text-[13px] font-medium text-[var(--text-secondary)] leading-relaxed">
              Kunci karakter manusia akan dilepas dari proyek ini. Semua topik, latar lokasi, pencahayaan, dan urutan adegan tetap terjaga utuh dengan fokus visual objek/suasana.
            </div>
          )}
        </div>
      </CustomModal>

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
