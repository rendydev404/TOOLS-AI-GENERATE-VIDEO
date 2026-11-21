import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FolderPlus,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  exportBatchPacksAsCsv,
  generateOfflinePack,
  HOOK_STRATEGIES,
  MODELS,
  VIDEO_STYLES,
} from '@shared/director';
import { getAllTemplates, getTemplateById } from '@shared/templates';
import type {
  AspectRatio,
  BatchRow,
  DurationChoice,
  HookStrategyId,
  Pack,
  Project,
  QualityTier,
  VideoStyleId,
} from '@shared/types';
import { downloadTextFile } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Tag } from '@/components/ui/Primitives';
import { CustomSelect } from '@/components/ui/CustomControls';

const INITIAL_ROWS: BatchRow[] = [
  {
    id: 'row-1',
    product: 'Kopi Susu Gula Aren',
    advantages: 'Manis pas, Gula aren asli, Segar',
    cta: 'Pesan sekarang, link di bio',
    story: '',
    hasPhoto: false,
  },
  {
    id: 'row-2',
    product: 'Matcha Latte Creamy',
    advantages: 'Creamy, Wangi, Segar',
    cta: 'Cek keranjang kuning sekarang',
    story: '',
    hasPhoto: false,
  },
  {
    id: 'row-3',
    product: 'Roti Bakar Cokelat Lumer',
    advantages: 'Lumer, Hangat, Porsi besar',
    cta: 'Mampir ke toko kami hari ini',
    story: '',
    hasPhoto: false,
  },
];

function parseCsvText(csv: string): BatchRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === ',' || ch === ';') && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const firstCols = splitLine(lines[0]).map((x) => x.toLowerCase());
  const hasHeader =
    firstCols.some((c) => c.includes('produk') || c.includes('product') || c.includes('nama'));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.slice(0, 100).map((ln, idx) => {
    const cols = splitLine(ln);
    return {
      id: `csv-${Date.now()}-${idx}`,
      product: cols[0] ?? '',
      advantages: cols[1] ?? '',
      cta: cols[2] || 'Pesan sekarang, link di bio',
      story: cols[3] ?? '',
      hasPhoto: false,
    };
  });
}

export function BatchPage() {
  const navigate = useNavigate();
  const { brand, upsertProject, pushToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = useMemo(() => getAllTemplates(), []);
  const [templateId, setTemplateId] = useState('iklan-produk');
  const [videoStyle, setVideoStyle] = useState<VideoStyleId>(
    brand.defaultVideoStyle || 'real-live'
  );
  const [hookStyle, setHookStyle] = useState<HookStrategyId>(
    brand.defaultHookStyle || 'visual-kejutan'
  );
  const [durationS, setDurationS] = useState<DurationChoice>(20);
  const [aspect, setAspect] = useState<AspectRatio>(brand.defaultAspect || '9:16');
  const [quality] = useState<QualityTier>(brand.defaultQuality || 'seimbang');
  const [rows, setRows] = useState<BatchRow[]>(INITIAL_ROWS);
  const [generatedResults, setGeneratedResults] = useState<
    Array<{ row: BatchRow; pack: Pack }>
  >([]);

  const validRows = useMemo(
    () => rows.filter((r) => r.product.trim().length > 0),
    [rows]
  );

  const updateRow = (id: string, patch: Partial<BatchRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    if (rows.length >= 100) {
      pushToast('Maksimal 100 produk dalam satu batch', 'info');
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        product: '',
        advantages: '',
        cta: brand.defaultCta || 'Pesan sekarang, link di bio',
        story: '',
        hasPhoto: false,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDownloadSampleCsv = () => {
    const sample = [
      'nama_produk,keunggulan,cta,catatan',
      '"Kopi Susu Gula Aren","Manis pas, Gula aren asli, Segar","Pesan sekarang, link di bio","Cocok diminum sore hari"',
      '"Sambal Bawang Bu Rini","Pedas nampol, Wangi, Tanpa pengawet","Cek keranjang kuning","Kemasan botol segel"',
      '"Roti Bakar Cokelat","Lumer, Lembut, Porsi besar","Mampir ke outlet kami","Hangat baru matang"',
    ].join('\n');
    downloadTextFile('contoh-massal-rangkai.csv', sample, 'text/csv;charset=utf-8');
    pushToast('Contoh CSV berhasil diunduh', 'success');
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsvText(String(reader.result || ''));
      if (parsed.length === 0) {
        pushToast('File CSV kosong atau format tidak dikenali', 'danger');
        return;
      }
      setRows(parsed);
      setGeneratedResults([]);
      pushToast(`${parsed.length} baris berhasil diimpor dari CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGenerateBatch = () => {
    const tpl = getTemplateById(templateId);
    if (!tpl || validRows.length === 0) {
      pushToast('Isi minimal 1 nama produk yang valid', 'danger');
      return;
    }
    const results: Array<{ row: BatchRow; pack: Pack }> = [];
    for (const row of validRows) {
      const pack = generateOfflinePack(tpl, {
        product: row.product.trim(),
        hasPhoto: row.hasPhoto,
        advantages: row.advantages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        cta: row.cta.trim() || brand.defaultCta || 'Pesan sekarang, link di bio',
        story: row.story.trim(),
        videoStyle,
        hookStyle,
        vibe: brand.defaultVibe || 'hangat',
        music: brand.defaultMusic || 'santai',
        cast: tpl.cast,
        voice: tpl.cast === 'person' ? 'dialog' : 'none',
        durationS,
        aspect,
        quality,
        seamlessChain: false,
      });
      results.push({ row, pack });
    }
    setGeneratedResults(results);
    pushToast(`${results.length} paket prompt berhasil disusun`, 'success');
  };

  const handleSaveAllToProjects = () => {
    const tpl = getTemplateById(templateId);
    if (!tpl || generatedResults.length === 0) return;
    const now = new Date().toISOString();
    generatedResults.forEach(({ row, pack }, idx) => {
      const proj: Project = {
        id: `proj-batch-${Date.now().toString(36)}-${idx}`,
        name: row.product.trim(),
        templateId: tpl.id,
        templateName: tpl.name,
        art: tpl.art,
        status: 'panduan',
        answers: {
          product: row.product.trim(),
          hasPhoto: row.hasPhoto,
          advantages: row.advantages
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          cta: row.cta.trim() || 'Pesan sekarang, link di bio',
          story: row.story.trim(),
          videoStyle,
          hookStyle,
          vibe: brand.defaultVibe || 'hangat',
          music: brand.defaultMusic || 'santai',
          cast: tpl.cast,
          voice: tpl.cast === 'person' ? 'dialog' : 'none',
          durationS,
          aspect,
          quality,
        },
        pack,
        completedStepIds: [],
        createdAt: now,
        updatedAt: now,
      };
      upsertProject(proj);
    });
    pushToast(`${generatedResults.length} paket disimpan ke menu Proyek`, 'success');
    navigate('/proyek');
  };

  const handleExportBatchCsv = () => {
    if (generatedResults.length === 0) return;
    const csv = exportBatchPacksAsCsv(
      generatedResults.map((x) => ({ product: x.row.product, pack: x.pack }))
    );
    downloadTextFile('paket-prompt-massal-rangkai.csv', csv, 'text/csv;charset=utf-8');
    pushToast('CSV seluruh paket prompt diunduh', 'success');
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Mode Massal' }]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleDownloadSampleCsv}
          >
            Contoh CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvFileChange}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Impor CSV
          </Button>
        </div>
      }
      bottomBar={
        <>
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-primary)] tnum">
              {rows.length} baris · {validRows.length} siap disusun ·{' '}
              {rows.length - validRows.length} kosong
            </div>
            <div className="text-[12px] text-[var(--text-tertiary)]">
              Maksimal 100 produk per CSV. Semua memakai template & gaya yang dipilih di atas.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            {generatedResults.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Download size={16} />}
                  onClick={handleExportBatchCsv}
                >
                  Unduh Hasil CSV ({generatedResults.length})
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<FolderPlus size={16} />}
                  onClick={handleSaveAllToProjects}
                >
                  Simpan ke Proyek
                </Button>
              </>
            )}
            <Button
              size="lg"
              iconRight={<ArrowRight size={16} />}
              onClick={handleGenerateBatch}
            >
              Susun {validRows.length} Paket Prompt
            </Button>
          </div>
        </>
      }
    >
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">
            Buat banyak paket prompt sekaligus
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Satu baris = satu video lengkap. Cocok untuk katalog toko online, menu kuliner, atau agensi sosmed.
          </p>
        </div>

        {/* Shared Settings Row (All CustomSelect, zero native <select>) */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Alur Konten
            </label>
            <CustomSelect
              value={templateId}
              onChange={setTemplateId}
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Style Video
            </label>
            <CustomSelect<VideoStyleId>
              value={videoStyle}
              onChange={setVideoStyle}
              options={Object.values(VIDEO_STYLES).map((vs) => ({
                value: vs.id,
                label: vs.name,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Jurus Hook Pembuka
            </label>
            <CustomSelect<HookStrategyId>
              value={hookStyle}
              onChange={setHookStyle}
              options={Object.values(HOOK_STRATEGIES).map((hk) => ({
                value: hk.id,
                label: hk.name,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Durasi & Layar ({MODELS[quality].label})
            </label>
            <CustomSelect<string>
              value={`${durationS}|${aspect}`}
              onChange={(val) => {
                const [d, a] = val.split('|');
                setDurationS(Number(d) as DurationChoice);
                setAspect(a as AspectRatio);
              }}
              options={[
                { value: '15|9:16', label: '15 dtk · 9:16 Tegak' },
                { value: '20|9:16', label: '20 dtk · 9:16 Tegak' },
                { value: '30|9:16', label: '30 dtk · 9:16 Tegak' },
                { value: '20|16:9', label: '20 dtk · 16:9 Mendatar' },
                { value: '30|16:9', label: '30 dtk · 16:9 Mendatar' },
              ]}
            />
          </div>
        </div>

        {/* Interactive Sheet Table */}
        <div className="neo-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)] text-[12px] font-semibold text-[var(--text-tertiary)]">
                <th className="w-10 px-3.5 py-2.5">#</th>
                <th className="w-60 px-3.5 py-2.5">Nama produk</th>
                <th className="w-64 px-3.5 py-2.5">Keunggulan (pisahkan koma)</th>
                <th className="w-56 px-3.5 py-2.5">Ajakan (CTA)</th>
                <th className="w-32 px-3.5 py-2.5">Status</th>
                <th className="w-12 px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-[13px]">
              {rows.map((row, idx) => {
                const valid = row.product.trim().length > 0;
                return (
                  <tr
                    key={row.id}
                    className={valid ? '' : 'bg-[var(--danger-soft)]/35'}
                  >
                    <td className="px-3.5 py-2 text-[var(--text-tertiary)] tnum">{idx + 1}</td>
                    <td className="px-3.5 py-2">
                      <input
                        type="text"
                        value={row.product}
                        onChange={(e) => updateRow(row.id, { product: e.target.value })}
                        placeholder="Isi nama produk..."
                        className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[var(--text-primary)] placeholder:text-[var(--danger-fg)]/70 focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] focus:outline-none"
                      />
                    </td>
                    <td className="px-3.5 py-2">
                      <input
                        type="text"
                        value={row.advantages}
                        onChange={(e) => updateRow(row.id, { advantages: e.target.value })}
                        placeholder="Segar, Murah, Praktis"
                        className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] focus:outline-none"
                      />
                    </td>
                    <td className="px-3.5 py-2">
                      <input
                        type="text"
                        value={row.cta}
                        onChange={(e) => updateRow(row.id, { cta: e.target.value })}
                        className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] focus:outline-none"
                      />
                    </td>
                    <td className="px-3.5 py-2">
                      {valid ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--success-fg)]">
                          <CheckCircle2 size={14} /> Siap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--danger-fg)]">
                          <AlertCircle size={14} /> Kosong
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label="Hapus baris"
                          className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger-fg)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <Button variant="ghost" size="sm" icon={<Plus size={15} />} onClick={addRow}>
            Tambah baris produk
          </Button>
        </div>

        {/* Generated Preview Summary */}
        {generatedResults.length > 0 && (
          <section className="flex flex-col gap-3 rounded-xl border border-[var(--brand-primary)]/40 bg-[var(--brand-soft)]/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
                  Hasil Susunan Massal ({generatedResults.length} Produk)
                </h2>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Klik "Simpan ke Proyek" untuk membuka panduan langkah per produk, atau "Unduh Hasil CSV" untuk spreadsheet.
                </p>
              </div>
              <Tag tone="brand">Siap Diekspor</Tag>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {generatedResults.slice(0, 9).map(({ row, pack }, idx) => (
                <div
                  key={`${row.id}-${idx}`}
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5"
                >
                  <div className="font-semibold text-[14px] text-[var(--text-primary)] truncate">
                    {row.product}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                    {pack.summary}
                  </div>
                  <p className="mt-2 line-clamp-2 font-mono text-[11px] text-[var(--text-secondary)]">
                    {pack.scenes[0]?.prompt}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
