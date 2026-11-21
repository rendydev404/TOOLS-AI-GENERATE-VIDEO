import type { Template, VibeId } from '@shared/types';

export function TemplateSequenceStrip({
  template,
  durationKey = '20',
  compact = false,
}: {
  template: Template;
  durationKey?: '15' | '20' | '30';
  compact?: boolean;
}) {
  const plan = template.plans[durationKey] ?? template.plans['20'];
  const roles = plan?.roles ?? [];
  const durations = plan?.durations ?? [];

  return (
    <div
      className={`rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-canvas)] ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        <span>URUTAN ADEGAN</span>
        <span className="tnum">{roles.length} KLIP · {durationKey} DTK</span>
      </div>

      <div className="flex items-stretch gap-1.5">
        {roles.map((rKey, idx) => {
          const roleObj = template.roles.find((r) => r.role === rKey);
          const dur = durations[idx] ?? 5;
          const isFirst = idx === 0;

          return (
            <div
              key={`${rKey}-${idx}`}
              style={{ flex: dur }}
              className={`flex min-w-0 flex-col justify-between rounded-lg border-[1.5px] border-[var(--border-strong)] px-2 py-1.5 ${
                isFirst
                  ? 'bg-[var(--brand-primary)] text-[#111111]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
              }`}
            >
              <span className="font-mono text-[10px] font-bold opacity-80 tnum">
                0{idx + 1} · {dur}s
              </span>
              <span className="mt-1 truncate text-[11.5px] font-bold leading-tight">
                {roleObj?.label ?? rKey}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VIBE_SPECS: Record<
  VibeId,
  { swatches: [string, string, string, string]; temp: string }
> = {
  hangat: {
    swatches: ['#3D2616', '#B98157', '#E6C7A6', '#FAF3EB'],
    temp: '3200K · Cahaya Sore',
  },
  mewah: {
    swatches: ['#0F0E0C', '#29221B', '#9E7B42', '#EAE2D3'],
    temp: 'Low-Key · Rim Light',
  },
  ceria: {
    swatches: ['#FF6B4A', '#FFD166', '#4ECDC4', '#FFFDF7'],
    temp: '5600K · Terang Merata',
  },
  sinematik: {
    swatches: ['#121E29', '#264653', '#D97B43', '#EDE7DF'],
    temp: 'Kontras Film · Samping',
  },
  minimalis: {
    swatches: ['#1F2429', '#9AA1A9', '#E5E7EB', '#FFFFFF'],
    temp: 'Studio Halus · Bersih',
  },
  retro: {
    swatches: ['#2C5E52', '#D97941', '#E9C46A', '#F6E8D5'],
    temp: 'Tungsten · Nuansa 80-an',
  },
};

export function VibePalettePreview({ vibeId }: { vibeId: VibeId }) {
  const spec = VIBE_SPECS[vibeId];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-9 w-full overflow-hidden rounded-lg border-2 border-[var(--border-strong)]">
        {spec.swatches.map((hex) => (
          <div key={hex} style={{ backgroundColor: hex }} className="flex-1 h-full" />
        ))}
      </div>
      <div className="font-mono text-[10.5px] font-bold text-[var(--text-secondary)]">
        {spec.temp}
      </div>
    </div>
  );
}

export function formatTimecodeRange(startSec: number, durSec: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const endSec = startSec + durSec;
  return `00:${pad(startSec)} - 00:${pad(endSec)}`;
}
