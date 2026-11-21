import { useState } from 'react';
import { Package, Plus, Save, Trash2, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MODELS, MUSIC_LABELS, VIBES } from '@shared/director';
import type {
  AspectRatio,
  LibraryItem,
  MusicChoice,
  QualityTier,
  VibeId,
} from '@shared/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button, SegmentedControl, Switch, Tag } from '@/components/ui/Primitives';
import { ConfirmModal, CustomModal, CustomSelect } from '@/components/ui/CustomControls';

type SectionTab = 'produk' | 'karakter' | 'brand';

export function LibraryBrandPage() {
  const {
    library,
    brand,
    upsertLibraryItem,
    deleteLibraryItem,
    updateBrand,
    pushToast,
  } = useApp();

  const [tab, setTab] = useState<SectionTab>('produk');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [lockText, setLockText] = useState('');
  const [advText, setAdvText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null);

  const products = library.filter((x) => x.kind === 'product');
  const characters = library.filter((x) => x.kind === 'character');

  const openCreateModal = (kind: 'product' | 'character') => {
    setEditId(null);
    setName('');
    setSubtitle('');
    setLockText('');
    setAdvText('');
    setTab(kind === 'product' ? 'produk' : 'karakter');
    setModalOpen(true);
  };

  const openEditModal = (item: LibraryItem) => {
    setEditId(item.id);
    setName(item.name);
    setSubtitle(item.subtitle);
    setLockText(item.lockText);
    setAdvText((item.advantages || []).join(', '));
    setModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!name.trim() || !lockText.trim()) {
      pushToast('Nama dan ciri visual wajib diisi', 'danger');
      return;
    }
    const isProduct = tab === 'produk';
    const item: LibraryItem = {
      id: editId ?? `lib-${isProduct ? 'prod' : 'char'}-${Date.now().toString(36)}`,
      kind: isProduct ? 'product' : 'character',
      name: name.trim(),
      subtitle: subtitle.trim() || (isProduct ? 'Produk tersimpan' : 'Karakter tersimpan'),
      lockText: lockText.trim(),
      advantages: isProduct
        ? advText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      art: isProduct ? 'produk' : 'char-1',
      createdAt: new Date().toISOString(),
    };
    upsertLibraryItem(item);
    setModalOpen(false);
  };

  return (
    <AppShell
      actions={
        tab !== 'brand' ? (
          <Button
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => openCreateModal(tab === 'produk' ? 'product' : 'character')}
          >
            {tab === 'produk' ? 'Simpan Produk Baru' : 'Simpan Karakter Baru'}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            Pustaka & Pengaturan Brand
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Simpan ciri kemasan produk dan presenter langganan supaya bisa dipakai berulang kali dengan 1 klik.
          </p>
        </div>

        <SegmentedControl<SectionTab>
          value={tab}
          onChange={setTab}
          items={[
            { value: 'produk', label: 'Item / Produk', count: products.length },
            { value: 'karakter', label: 'Presenter / Karakter', count: characters.length },
            { value: 'brand', label: 'Setelan Default Brand' },
          ]}
        />

        {(tab === 'produk' || tab === 'karakter') && (
          <div className="grid gap-4 md:grid-cols-2">
            {(tab === 'produk' ? products : characters).map((item) => (
              <div
                key={item.id}
                className="neo-card flex flex-col justify-between gap-3.5 rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[16px] font-bold text-[var(--text-primary)]">
                      {item.name}
                    </span>
                    <Tag tone="brand">
                      {item.kind === 'product' ? 'Produk' : 'Presenter'}
                    </Tag>
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{item.subtitle}</p>
                </div>

                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 font-mono text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                  {item.lockText}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(item)}>
                    Ubah
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label="Hapus item"
                    className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger-fg)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {(tab === 'produk' ? products : characters).length === 0 && (
              <div className="col-span-full flex flex-col items-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-12 text-center">
                {tab === 'produk' ? (
                  <Package size={26} className="text-[var(--text-tertiary)]" />
                ) : (
                  <User size={26} className="text-[var(--text-tertiary)]" />
                )}
                <p className="mt-2 text-[14.5px] font-semibold text-[var(--text-primary)]">
                  Belum ada {tab === 'produk' ? 'produk' : 'presenter'} tersimpan
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => openCreateModal(tab === 'produk' ? 'product' : 'character')}
                >
                  Tambah Sekarang
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === 'brand' && (
          <div className="neo-card max-w-2xl rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
                Setelan Awal untuk Setiap Video Baru
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                Isian di bawah otomatis dipilih setiap kali kamu membuat video baru.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Nama Brand / Kreator · opsional
                </label>
                <input
                  type="text"
                  value={brand.brandName}
                  onChange={(e) => updateBrand({ brandName: e.target.value })}
                  placeholder="Contoh: Studio Kreatif / Nama Brand"
                  className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[14px] focus:border-[var(--brand-primary)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Kalimat Ajakan Default
                </label>
                <input
                  type="text"
                  value={brand.defaultCta}
                  onChange={(e) => updateBrand({ defaultCta: e.target.value })}
                  className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[14px] focus:border-[var(--brand-primary)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Suasana Warna Default
                </label>
                <CustomSelect<VibeId>
                  value={brand.defaultVibe}
                  onChange={(val) => updateBrand({ defaultVibe: val })}
                  options={Object.values(VIBES).map((v) => ({
                    value: v.id,
                    label: v.name,
                    description: v.shortDesc,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Musik Latar Default
                </label>
                <CustomSelect<MusicChoice>
                  value={brand.defaultMusic}
                  onChange={(val) => updateBrand({ defaultMusic: val })}
                  options={(Object.keys(MUSIC_LABELS) as MusicChoice[]).map((m) => ({
                    value: m,
                    label: MUSIC_LABELS[m],
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Ukuran Layar Default
                </label>
                <CustomSelect<AspectRatio>
                  value={brand.defaultAspect}
                  onChange={(val) => updateBrand({ defaultAspect: val })}
                  options={[
                    { value: '9:16', label: '9:16 Tegak (TikTok / Reels)' },
                    { value: '16:9', label: '16:9 Mendatar (YouTube)' },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Model Flow Default
                </label>
                <CustomSelect<QualityTier>
                  value={brand.defaultQuality}
                  onChange={(val) => updateBrand({ defaultQuality: val })}
                  options={Object.values(MODELS).map((m) => ({
                    value: m.id,
                    label: `${m.title} (${m.label})`,
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3.5">
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Default sambung mulus antar-klip (Frames)
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)]">
                  Otomatis menyalakan mode Frames Start pada proyek baru.
                </div>
              </div>
              <Switch
                checked={brand.defaultSeamlessChain}
                onChange={(v) => updateBrand({ defaultSeamlessChain: v })}
                label="Default sambung mulus"
              />
            </div>

            <div className="flex justify-end">
              <Button
                icon={<Save size={15} />}
                onClick={() => pushToast('Setelan brand tersimpan', 'success')}
              >
                Simpan Setelan
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editId
            ? 'Ubah data Pustaka'
            : tab === 'produk'
              ? 'Simpan Produk ke Pustaka'
              : 'Simpan Presenter ke Pustaka'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveItem}>Simpan</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-primary)]">
              {tab === 'produk' ? 'Nama Produk' : 'Nama Presenter'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                tab === 'produk' ? 'Misal: Workspace AI Toolkit / Earbuds Pro' : 'Misal: Dimas (Host Tech)'
              }
              className="h-9.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[13px] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-primary)]">
              Catatan ringkas (Bahasa Indonesia)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Misal: Desain minimalis hitam matte dengan aksen neon..."
              className="h-9.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[13px] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>

          {tab === 'produk' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[var(--text-primary)]">
                Keunggulan utama (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={advText}
                onChange={(e) => setAdvText(e.target.value)}
                placeholder="Praktis & cepat, Mudah dipakai, Fitur lengkap"
                className="h-9.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-[13px] focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-primary)]">
              Deskripsi Ciri Visual untuk Prompt (Bahasa Inggris paling akurat)
            </label>
            <textarea
              rows={3}
              value={lockText}
              onChange={(e) => setLockText(e.target.value)}
              placeholder={
                tab === 'produk'
                  ? 'a sleek matte-black wireless earbud charging case with subtle lime LED indicator'
                  : 'a cheerful Indonesian man in his late 20s wearing a clean navy casual overshirt over a white t-shirt'
              }
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 font-mono text-[12px] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>
        </div>
      </CustomModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteLibraryItem(deleteTarget.id);
        }}
        title="Hapus dari Pustaka?"
        description={`"${deleteTarget?.name}" akan dihapus dari daftar Pustaka.`}
      />
    </AppShell>
  );
}
