import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { getAllTemplates } from '@shared/templates';
import { AppShell } from '@/components/layout/AppShell';
import { Button, SegmentedControl, Tag } from '@/components/ui/Primitives';
import { TemplateSequenceStrip } from '@/components/ui/StoryVisuals';

type ModeFilter = 'semua' | 'creator' | 'soft' | 'hard';

export function TemplatesPage() {
  const navigate = useNavigate();
  const templates = useMemo(() => getAllTemplates(), []);
  const [filter, setFilter] = useState<ModeFilter>('semua');

  const filtered = useMemo(() => {
    if (filter === 'semua') return templates;
    if (filter === 'creator') return templates.filter((t) => t.mode === 'creator');
    return templates.filter((t) => t.mode === 'marketing' && t.sellingStyle === filter);
  }, [templates, filter]);

  return (
    <AppShell breadcrumbs={[{ label: 'Mulai Buat', to: '/buat' }, { label: 'Semua Format Video' }]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            {templates.length} Format Alur Video Siap Pakai
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Pilih format <strong>Konten Biasa (Kreator)</strong>, <strong>Soft Selling (Halus)</strong>, atau <strong>Hard Selling (Langsung)</strong>.
          </p>
        </div>

        <SegmentedControl<ModeFilter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'semua', label: 'Semua', count: templates.length },
            {
              value: 'creator',
              label: 'Konten Biasa',
              count: templates.filter((t) => t.mode === 'creator').length,
            },
            {
              value: 'soft',
              label: 'Soft Selling',
              count: templates.filter((t) => t.sellingStyle === 'soft').length,
            },
            {
              value: 'hard',
              label: 'Hard Selling',
              count: templates.filter((t) => t.sellingStyle === 'hard').length,
            },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="neo-card flex flex-col justify-between gap-4 rounded-2xl p-5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[17px] font-bold text-[var(--text-primary)]">{tpl.name}</h2>
                  <Tag tone={tpl.mode === 'marketing' ? 'purple' : 'brand'}>
                    {tpl.mode === 'marketing'
                      ? tpl.sellingStyle === 'hard'
                        ? 'Hard Selling'
                        : 'Soft Selling'
                      : tpl.category}
                  </Tag>
                </div>
                <p className="text-[13.5px] text-[var(--text-secondary)]">{tpl.description}</p>
                <TemplateSequenceStrip template={tpl} durationKey="20" />
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-3.5">
                <span className="text-[12.5px] text-[var(--text-tertiary)]">
                  {tpl.cast === 'person' ? (
                    <span className="inline-flex items-center gap-1">
                      <User size={13} /> Menampilkan karakter konsisten
                    </span>
                  ) : (
                    'Fokus visual / objek'
                  )}
                </span>
                <Button
                  size="sm"
                  iconRight={<ArrowRight size={14} />}
                  onClick={() => navigate(`/buat?template=${tpl.id}`)}
                >
                  Pakai Format Ini
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
