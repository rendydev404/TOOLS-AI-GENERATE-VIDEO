import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Button, Kbd } from './Primitives';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  icon,
  placeholder = 'Pilih opsi',
  className = '',
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] font-bold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-all ${
          open ? 'bg-[var(--brand-soft)] shadow-[var(--focus-ring)]' : 'hover:bg-[var(--bg-subtle)]'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {icon && <span className="text-[var(--text-primary)] shrink-0">{icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2.5}
          className={`shrink-0 text-[var(--text-primary)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-lg)]"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-[#111111] font-bold border-[1.5px] border-[var(--border-strong)]'
                    : 'text-[var(--text-primary)] font-medium hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] leading-snug">{opt.label}</div>
                  {opt.description && (
                    <div
                      className={`text-[12px] leading-snug mt-0.5 ${
                        isSelected ? 'text-[#111111]/80' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {opt.description}
                    </div>
                  )}
                </div>
                {isSelected && <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CustomSearchBar({
  value,
  onChange,
  placeholder = 'Cari...',
  shortcutHint,
  className = '',
  autoFocus = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  shortcutHint?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 shadow-[var(--shadow-xs)] focus-within:shadow-[var(--focus-ring)] ${className}`}
    >
      <Search size={16} strokeWidth={2.5} className="shrink-0 text-[var(--text-primary)]" />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Bersihkan pencarian"
          className="rounded-md border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-0.5 text-[var(--text-primary)]"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      ) : (
        shortcutHint && <Kbd>{shortcutHint}</Kbd>
      )}
    </div>
  );
}

export function CustomModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} rounded-2xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-lg)]`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-[var(--text-primary)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[14px] text-[var(--text-secondary)] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="neo-btn rounded-lg bg-[var(--bg-surface)] p-1.5 text-[var(--text-primary)]"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {children && <div className="mt-5">{children}</div>}

        {footer && <div className="mt-6 flex items-center justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Hapus',
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
