import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { getAllTemplates } from '@shared/templates';
import type { Template } from '@shared/types';
import { AppShell } from '@/components/layout/AppShell';
import { Button, SegmentedControl, Tag } from '@/components/ui/Primitives';
import { TemplateSequenceStrip } from '@/components/ui/StoryVisuals';

type CatFilter = 'Semua' | Template['category'];

export function TemplatesPage() {
  const navigate = useNavigate();
  const templates = useMemo(() => getAllTemplates(), []);
  const [cat, setCat] = useState<CatFilter>('Semua');

  const filtered = useMemo(
    () => (cat === 'Semua' ? templates : templates.filter((t) => t.category === cat)),
    [templates, cat]
  );

  return (
    <AppShell breadcrumbs={[{ label: 'Mulai Buat', to: '/' }, { label: 'Semua Jenis Video' }]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            8 Jenis Alur Video Siap Pakai
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Pilih salah satu struktur cerita di bawah untuk langsung mulai mengisi informasi produkmu.
          </p>
        </div>

        <SegmentedControl<CatFilter>
          value={cat}
          onChange={setCat}
          items={[
            { value: 'Semua', label: 'Semua', count: templates.length },
            { value: 'Jualan', label: 'Jualan' },
            { value: 'Makanan', label: 'Makanan' },
            { value: 'Cerita', label: 'Cerita' },
            { value: 'Edukasi', label: 'Edukasi' },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[17px] font-bold text-[var(--text-primary)]">{tpl.name}</h2>
                  <Tag tone="brand">{tpl.category}</Tag>
                </div>
                <p className="text-[13.5px] text-[var(--text-secondary)]">{tpl.description}</p>
                <TemplateSequenceStrip template={tpl} durationKey="20" />
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-3.5">
                <span className="text-[12.5px] text-[var(--text-tertiary)]">
                  {tpl.cast === 'person' ? (
                    <span className="inline-flex items-center gap-1">
                      <User size={13} /> Menampilkan karakter
                    </span>
                  ) : (
                    'Fokus produk'
                  )}
                </span>
                <Button
                  size="sm"
                  iconRight={<ArrowRight size={14} />}
                  onClick={() => navigate(`/buat?template=${tpl.id}`)}
                >
                  Pilih Jenis Ini
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
