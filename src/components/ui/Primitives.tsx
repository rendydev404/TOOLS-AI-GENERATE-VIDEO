import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { ToastMessage } from '@/context/AppContext';
import { StudioFlowLogo } from './StudioFlowLogos';

export function RangkaiLogo({ size = 30 }: { size?: number }) {
  return <StudioFlowLogo size={size} />;
}

export function Kbd({ children, onBrand = false }: { children: React.ReactNode; onBrand?: boolean }) {
  return (
    <kbd
      className={`inline-flex items-center rounded border-[1.5px] border-[var(--border-strong)] px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none ${
        onBrand
          ? 'bg-white text-[#111111]'
          : 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
      }`}
    >
      {children}
    </kbd>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'purple' | 'dark' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  hint?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  hint,
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const heights = {
    sm: 'h-9 px-3 text-[12.5px] rounded-lg gap-1.5',
    md: 'h-10.5 px-4 text-[13.5px] rounded-lg gap-2',
    lg: 'h-12 px-5 text-[14.5px] rounded-xl gap-2.5',
  }[size];

  const variants = {
    primary: 'neo-btn bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#111111] font-bold',
    purple: 'neo-btn bg-[var(--accent-purple)] hover:opacity-95 text-white font-bold',
    dark: 'neo-btn bg-[var(--bg-inverse)] text-[var(--bg-surface)] font-bold',
    secondary: 'neo-btn bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold',
    ghost:
      'border-2 border-transparent hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold',
    danger: 'neo-btn bg-[var(--danger-soft)] hover:opacity-90 text-[var(--danger-fg)] font-bold',
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-45 ${heights} ${variants} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin shrink-0" /> : icon}
      {children && <span className="truncate">{children}</span>}
      {!loading && iconRight}
      {hint && <Kbd onBrand={variant === 'primary'}>{hint}</Kbd>}
    </button>
  );
}

export function CopyButton({
  text,
  onCopy,
  label = 'Salin Prompt',
  copiedLabel = 'Tersalin!',
  variant = 'primary',
  size = 'sm',
  className = '',
}: {
  text: string;
  onCopy: (text: string, toastMsg?: string) => Promise<boolean>;
  label?: string;
  copiedLabel?: string;
  variant?: 'primary' | 'purple' | 'dark' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await onCopy(text, 'Teks berhasil disalin ke clipboard');
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <Button
      variant={copied ? 'secondary' : variant}
      size={size}
      onClick={handleClick}
      className={`${
        copied
          ? '!bg-[var(--success-soft)] !text-[var(--success-fg)] font-bold'
          : ''
      } ${className}`}
      icon={copied ? <Check size={15} strokeWidth={2.8} /> : <Copy size={14} strokeWidth={2.2} />}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}

export function Chip({
  label,
  selected = false,
  onClick,
  icon,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border-2 border-[var(--border-strong)] px-3 text-[13px] transition-all ${
        selected
          ? 'bg-[var(--brand-primary)] text-[#111111] font-bold shadow-[2px_2px_0_var(--border-strong)] -translate-y-[1px]'
          : 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-subtle)]'
      }`}
    >
      {selected ? <Check size={14} strokeWidth={2.8} /> : icon}
      <span>{label}</span>
    </button>
  );
}

export interface SegmentItem<T extends string | number> {
  value: T;
  label: string;
  sub?: string;
  count?: number;
}

export function SegmentedControl<T extends string | number>({
  items,
  value,
  onChange,
  fullWidth = false,
  tall = false,
}: {
  items: SegmentItem<T>[];
  value: T;
  onChange: (val: T) => void;
  fullWidth?: boolean;
  tall?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex max-w-full overflow-x-auto rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-subtle)] p-1 gap-1 ${
        fullWidth ? 'w-full flex' : 'flex-nowrap'
      }`}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={String(it.value)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={`flex flex-col items-center justify-center rounded-lg px-3 transition-all ${
              tall ? 'min-h-[48px] py-1.5' : 'h-9'
            } ${
              // Full-width options share the row and wrap their text, so none is pushed off-screen on phones.
              fullWidth ? 'min-w-0 flex-1 basis-0 whitespace-normal text-center' : 'shrink-0 whitespace-nowrap'
            } ${
              active
                ? 'border-2 border-[var(--border-strong)] bg-[var(--brand-primary)] text-[#111111] shadow-[2px_2px_0_var(--border-strong)] font-bold'
                : 'border-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 text-[13px] leading-tight">
              <span>{it.label}</span>
              {it.count !== undefined && (
                <span
                  className={`rounded px-1.5 py-0.2 font-mono text-[10.5px] font-bold tnum ${
                    active
                      ? 'bg-[#111111] text-[var(--brand-primary)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)]'
                  }`}
                >
                  {it.count}
                </span>
              )}
            </span>
            {it.sub && (
              <span
                className={`text-[11px] leading-tight mt-0.5 ${
                  active ? 'text-[#111111]/80 font-medium' : 'text-[var(--text-tertiary)] font-normal'
                }`}
              >
                {it.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function RadioOption({
  title,
  description,
  selected,
  onClick,
  icon,
  right,
  disabled = false,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 rounded-xl border-2 border-[var(--border-strong)] px-4 py-3.5 text-left transition-all ${
        selected
          ? 'bg-[var(--brand-soft)] shadow-[4px_4px_0_var(--border-strong)] -translate-y-[1px]'
          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[var(--border-strong)] ${
          selected ? 'bg-[var(--brand-primary)] text-[#111111]' : 'bg-[var(--bg-surface)]'
        }`}
      >
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold text-[var(--text-primary)] leading-snug">
          {title}
        </div>
        {description && (
          <div className="text-[13px] text-[var(--text-secondary)] leading-snug mt-0.5">
            {description}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-[var(--border-strong)] transition-colors ${
        checked ? 'bg-[var(--brand-primary)]' : 'bg-[var(--bg-muted)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-[#111111] transition-transform ${
          checked ? 'translate-x-[21px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-[var(--border-strong)] transition-colors ${
        checked
          ? 'bg-[var(--brand-primary)] text-[#111111] shadow-[2px_2px_0_var(--border-strong)]'
          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
      }`}
    >
      {checked && <Check size={14} strokeWidth={3} />}
    </button>
  );
}

export function Tag({
  children,
  tone = 'neutral',
  icon,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'purple' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}) {
  const tones = {
    neutral: 'bg-[var(--bg-subtle)] text-[var(--text-primary)]',
    brand: 'bg-[var(--brand-primary)] text-[#111111]',
    purple: 'bg-[var(--accent-purple-soft)] text-[var(--accent-purple-fg)]',
    success: 'bg-[var(--success-soft)] text-[var(--success-fg)]',
    warning: 'bg-[var(--warning-soft)] text-[var(--warning-fg)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger-fg)]',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border-[1.5px] border-[var(--border-strong)] px-2 py-0.5 font-mono text-[11px] font-bold leading-4 ${tones}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  customLabel,
}: {
  status: 'draf' | 'panduan' | 'selesai';
  customLabel?: string;
}) {
  const map = {
    draf: {
      dot: 'bg-[var(--bg-muted)]',
      label: 'Draf',
    },
    panduan: {
      dot: 'bg-[var(--accent-purple)]',
      label: 'Sedang Dikerjakan',
    },
    selesai: {
      dot: 'bg-[var(--brand-primary)]',
      label: 'Selesai',
    },
  }[status];

  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--text-primary)]">
      <span className={`h-3 w-3 rounded-sm border-[1.5px] border-[var(--border-strong)] ${map.dot}`} />
      <span>{customLabel ?? map.label}</span>
    </span>
  );
}

export function Notice({
  kind = 'info',
  title,
  children,
  action,
}: {
  kind?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const cfg = {
    info: {
      bg: 'bg-[var(--accent-purple-soft)]',
      icon: <Info size={18} className="text-[var(--accent-purple-fg)] shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-[var(--brand-soft)]',
      icon: <CheckCircle2 size={18} className="text-[#111111] shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-[var(--warning-soft)]',
      icon: <ShieldAlert size={18} className="text-[var(--warning-fg)] shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-[var(--danger-soft)]',
      icon: <AlertCircle size={18} className="text-[var(--danger-fg)] shrink-0 mt-0.5" />,
    },
  }[kind];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border-2 border-[var(--border-strong)] ${cfg.bg} px-4 py-3 shadow-[var(--shadow-xs)]`}
    >
      {cfg.icon}
      <div className="min-w-0 flex-1">
        {title && (
          <div className="text-[13.5px] font-bold text-[var(--text-primary)] mb-0.5">{title}</div>
        )}
        <div className="text-[13px] font-medium text-[var(--text-primary)] leading-relaxed">
          {children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ProgressBar({
  fraction,
  height = 12,
}: {
  fraction: number;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-full border-2 border-[var(--border-strong)] bg-[var(--bg-surface)]"
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: 'var(--brand-primary)',
        }}
        className={`transition-all duration-300 ${
          pct > 0 && pct < 100 ? 'border-r-2 border-[var(--border-strong)]' : ''
        }`}
      />
    </div>
  );
}

export function ToastViewport({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-sm)] text-[13.5px] font-bold text-[var(--text-primary)]"
        >
          {t.tone === 'danger' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-md border-[1.5px] border-[var(--border-strong)] bg-[var(--danger-soft)] text-[var(--danger-fg)]">
              <AlertCircle size={14} />
            </span>
          ) : t.tone === 'info' ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-md border-[1.5px] border-[var(--border-strong)] bg-[var(--accent-purple)] text-white">
              <Info size={14} />
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-md border-[1.5px] border-[var(--border-strong)] bg-[var(--brand-primary)] text-[#111111]">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
          <span>{t.title}</span>
        </div>
      ))}
    </div>
  );
}
