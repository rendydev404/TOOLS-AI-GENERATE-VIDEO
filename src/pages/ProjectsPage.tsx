import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Copy,
  Edit3,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Project, ProjectStatus } from '@shared/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button, ProgressBar, SegmentedControl, StatusBadge, Tag } from '@/components/ui/Primitives';
import { ConfirmModal, CustomModal, CustomSearchBar } from '@/components/ui/CustomControls';

type FilterTab = 'semua' | ProjectStatus;

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, duplicateProject, deleteProject, upsertProject, pushToast } = useApp();

  const [filter, setFilter] = useState<FilterTab>('semua');
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'semua' && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.templateName.toLowerCase().includes(q) ||
        p.answers.product.toLowerCase().includes(q)
      );
    });
  }, [projects, filter, search]);

  const handleRenameSubmit = () => {
    if (!renameTarget || !renameValue.trim()) return;
    upsertProject({
      ...renameTarget,
      name: renameValue.trim(),
      updatedAt: new Date().toISOString(),
    });
    setRenameTarget(null);
    pushToast('Nama proyek diperbarui', 'success');
  };

  return (
    <AppShell
      actions={
        <Button size="sm" icon={<Plus size={15} strokeWidth={2.5} />} onClick={() => navigate('/buat')}>
          Buat Video Baru
        </Button>
      }
    >
      <div
        className="flex flex-col gap-6"
        onClick={() => {
          if (menuOpenId) setMenuOpenId(null);
        }}
      >
        <div>
          <h1 className="font-display text-[25px] font-bold text-[var(--text-primary)]">
            Proyek Saya
          </h1>
          <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
            Semua panduan video StudioFlow kamu tersimpan otomatis di browser ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl<FilterTab>
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'semua', label: 'Semua', count: projects.length },
              {
                value: 'panduan',
                label: 'Dikerjakan',
                count: projects.filter((p) => p.status === 'panduan').length,
              },
              {
                value: 'draf',
                label: 'Draf',
                count: projects.filter((p) => p.status === 'draf').length,
              },
              {
                value: 'selesai',
                label: 'Selesai',
                count: projects.filter((p) => p.status === 'selesai').length,
              },
            ]}
          />

          <CustomSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cari nama produk..."
            className="w-full sm:w-64"
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="neo-card flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
            <FolderPlus size={28} strokeWidth={2.3} className="text-[var(--accent-purple)]" />
            <h2 className="mt-3 font-display text-[18px] font-bold text-[var(--text-primary)]">
              {projects.length === 0 ? 'Belum ada proyek tersimpan' : 'Tidak ada proyek yang cocok'}
            </h2>
            <p className="mt-1 text-[13.5px] font-medium text-[var(--text-secondary)]">
              {projects.length === 0
                ? 'Mulai buat proyek pertamamu lewat 5 langkah simpel.'
                : 'Coba ganti kata kunci pencarian atau filter di atas.'}
            </p>
            {projects.length === 0 && (
              <Button className="mt-4" icon={<Plus size={15} />} onClick={() => navigate('/buat')}>
                Mulai Buat Video
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map((p) => {
              const totalSteps = p.pack?.steps.length ?? 0;
              const doneSteps = p.completedStepIds.length;
              const frac = totalSteps > 0 ? doneSteps / totalSteps : 0;
              const targetUrl = p.pack ? `/proyek/${p.id}` : `/buat?draft=${p.id}`;

              return (
                <div
                  key={p.id}
                  className="neo-card group relative flex flex-col justify-between gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-[2px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag tone="brand">{p.pack?.bible.videoStyleName || p.templateName}</Tag>
                        <Tag>{p.answers.aspect}</Tag>
                      </div>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          aria-label="Menu proyek"
                          onClick={() =>
                            setMenuOpenId((curr) => (curr === p.id ? null : p.id))
                          }
                          className="neo-btn rounded-lg bg-[var(--bg-surface)] p-1.5 text-[var(--text-primary)]"
                        >
                          <MoreHorizontal size={16} strokeWidth={2.5} />
                        </button>

                        {menuOpenId === p.id && (
                          <div className="absolute right-0 top-9 z-30 w-44 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-lg)]">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                setRenameTarget(p);
                                setRenameValue(p.name);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                            >
                              <Edit3 size={14} />
                              <span>Ubah nama</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                duplicateProject(p.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                            >
                              <Copy size={14} />
                              <span>Duplikat</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                setDeleteTarget(p);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-bold text-[var(--danger-fg)] hover:bg-[var(--danger-soft)]"
                            >
                              <Trash2 size={14} />
                              <span>Hapus proyek</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={targetUrl}
                      className="mt-2.5 block truncate font-display text-[18px] font-bold text-[var(--text-primary)]"
                    >
                      {p.name}
                    </Link>

                    {p.pack?.bible.hookStrategyName && (
                      <div className="mt-1 text-[12.5px] font-semibold text-[var(--accent-purple)]">
                        Hook: {p.pack.bible.hookStrategyName}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t-2 border-[var(--border-strong)] pt-3.5">
                    {p.pack && <ProgressBar fraction={frac} height={10} />}
                    <div className="flex items-center justify-between">
                      <StatusBadge
                        status={p.status}
                        customLabel={
                          p.status === 'selesai'
                            ? 'Semua selesai'
                            : p.status === 'panduan'
                              ? `${doneSteps}/${totalSteps} selesai`
                              : 'Draf'
                        }
                      />
                      <Link
                        to={targetUrl}
                        className="neo-btn inline-flex h-8.5 items-center gap-1 rounded-lg bg-[var(--brand-primary)] px-3 text-[12.5px] font-bold text-[#111111]"
                      >
                        <span>Buka</span>
                        <ArrowRight size={13} strokeWidth={2.6} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CustomModal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Ubah nama proyek"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Batal
            </Button>
            <Button onClick={handleRenameSubmit}>Simpan</Button>
          </>
        }
      >
        <input
          type="text"
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
          }}
          className="h-11 w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] font-semibold focus:outline-none focus:shadow-[var(--focus-ring)]"
        />
      </CustomModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteProject(deleteTarget.id);
        }}
        title="Hapus proyek ini?"
        description={`Proyek "${deleteTarget?.name}" akan dihapus dari browser ini.`}
        confirmLabel="Hapus Proyek"
      />
    </AppShell>
  );
}
