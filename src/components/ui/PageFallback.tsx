import { Loader2 } from 'lucide-react';

export function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-secondary)]">
      <Loader2 size={22} className="animate-spin text-[var(--brand-primary)]" />
    </div>
  );
}
