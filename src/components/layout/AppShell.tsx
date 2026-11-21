import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bookmark,
  Clapperboard,
  ExternalLink,
  Folder,
  SlidersHorizontal,
  Table2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ToastViewport } from '@/components/ui/Primitives';
import { StudioFlowLogo } from '@/components/ui/StudioFlowLogos';

const NAV_ITEMS = [
  { to: '/', label: 'Buat Video', mobileLabel: 'Buat', icon: Clapperboard, exact: true },
  { to: '/proyek', label: 'Proyek Saya', mobileLabel: 'Proyek', icon: Folder, exact: false },
  { to: '/massal', label: 'Massal CSV', mobileLabel: 'Massal', icon: Table2, exact: false },
  { to: '/pustaka', label: 'Pustaka', mobileLabel: 'Pustaka', icon: Bookmark, exact: false },
  {
    to: '/pengaturan',
    label: 'Pengaturan',
    mobileLabel: 'Setelan',
    icon: SlidersHorizontal,
    exact: false,
  },
];

export function AppShell({
  actions,
  bottomBar,
  children,
}: {
  breadcrumbs?: Array<{ label: string; to?: string }>;
  actions?: React.ReactNode;
  bottomBar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { projects, toasts } = useApp();

  const isNavActive = (to: string, exact: boolean) => {
    if (exact) {
      return (
        location.pathname === '/' ||
        location.pathname.startsWith('/buat') ||
        location.pathname.startsWith('/template')
      );
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* ==================== DESKTOP NEO-BRUTALIST SIDEBAR ==================== */}
      <aside className="hidden md:flex md:w-[244px] md:shrink-0 md:flex-col md:fixed md:inset-y-0 md:left-0 border-r-2 border-[var(--border-strong)] bg-[var(--bg-surface)] z-30">
        <div className="flex h-full flex-col p-4">
          {/* StudioFlow Brand Header */}
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl border-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2.5 shadow-[var(--shadow-xs)] transition-transform hover:-translate-y-[1px]"
          >
            <StudioFlowLogo size={32} />
            <div className="min-w-0">
              <div className="font-display text-[17px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
                StudioFlow
              </div>
              <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-purple)]">
                PROMPT DIRECTOR
              </div>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="mt-6 flex flex-col gap-2" aria-label="Menu Utama">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.to, item.exact);
              const count =
                item.to === '/proyek' && projects.length > 0 ? projects.length : null;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-[14px] transition-all ${
                    active
                      ? 'border-2 border-[var(--border-strong)] bg-[var(--brand-primary)] font-bold text-[#111111] shadow-[3px_3px_0_var(--border-strong)] -translate-y-[1px]'
                      : 'border-2 border-transparent font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className={active ? 'text-[#111111]' : 'text-[var(--text-primary)]'}
                  />
                  <span className="truncate">{item.label}</span>
                  {count !== null && (
                    <span className="ml-auto rounded-md border-[1.5px] border-[#111111] bg-[var(--accent-purple)] px-2 py-0.5 font-mono text-[11px] font-bold text-white tnum">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Direct Flow Button */}
          <div className="mt-auto pt-4 border-t-2 border-[var(--border-strong)]">
            <a
              href="https://flow.google.com/?hl=en"
              target="_blank"
              rel="noreferrer"
              className="neo-btn flex h-11 w-full items-center justify-between rounded-xl bg-[var(--bg-surface)] px-3.5 text-[13.5px] font-bold text-[var(--text-primary)] hover:bg-[var(--brand-soft)]"
            >
              <span>Buka Google Flow</span>
              <ExternalLink size={15} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-[244px]">
        {/* Mobile Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 md:hidden">
          <Link to="/" className="flex items-center gap-2.5">
            <StudioFlowLogo size={28} />
            <span className="font-display text-[16px] font-bold tracking-tight">StudioFlow</span>
          </Link>

          <div className="flex items-center gap-2">
            {actions}
            <a
              href="https://flow.google.com/?hl=en"
              target="_blank"
              rel="noreferrer"
              className="neo-btn inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 text-[12px] font-bold text-[#111111]"
            >
              <span>Flow</span>
              <ExternalLink size={13} strokeWidth={2.5} />
            </a>
          </div>
        </header>

        {actions && (
          <div className="hidden md:flex mx-auto w-full max-w-[900px] justify-end px-8 pt-6">
            {actions}
          </div>
        )}

        <main
          className={`mx-auto w-full max-w-[900px] flex-1 px-4 py-6 sm:px-8 md:py-9 ${
            bottomBar ? 'pb-40 md:pb-28' : 'pb-24 md:pb-12'
          }`}
        >
          {children}
        </main>

        {bottomBar && (
          <div className="fixed bottom-16 left-0 right-0 z-20 border-t-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 md:bottom-0 md:left-[244px] sm:px-8">
            <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3">
              {bottomBar}
            </div>
          </div>
        )}
      </div>

      {/* ==================== MOBILE NEO-BRUTALIST BOTTOM BAR ==================== */}
      <nav
        aria-label="Navigasi Bawah"
        className="fixed bottom-0 left-0 right-0 z-30 grid h-16 grid-cols-5 border-t-2 border-[var(--border-strong)] bg-[var(--bg-surface)] px-1 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.to, item.exact);
          const count = item.to === '/proyek' && projects.length > 0 ? projects.length : null;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center gap-1"
            >
              <div
                className={`relative flex h-7 w-10 items-center justify-center rounded-lg transition-all ${
                  active
                    ? 'border-[1.5px] border-[#111111] bg-[var(--brand-primary)] text-[#111111] shadow-[2px_2px_0_#111111]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.6 : 2} />
                {count !== null && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded border border-[#111111] bg-[var(--accent-purple)] px-1 font-mono text-[9.5px] font-bold text-white tnum">
                    {count}
                  </span>
                )}
              </div>
              <span
                className={`text-[10.5px] leading-none ${
                  active ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-tertiary)]'
                }`}
              >
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <ToastViewport toasts={toasts} />
    </div>
  );
}
