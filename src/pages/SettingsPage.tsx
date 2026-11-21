import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  RefreshCw,
  Server,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { AppSettings } from '@shared/types';
import { downloadTextFile } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button, Notice, SegmentedControl, Switch, Tag } from '@/components/ui/Primitives';
import { ConfirmModal } from '@/components/ui/CustomControls';

export function SettingsPage() {
  const {
    projects,
    library,
    brand,
    settings,
    health,
    updateSettings,
    importFullState,
    resetAllData,
    refreshHealth,
    pushToast,
  } = useApp();

  const importRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [pingingAi, setPingingAi] = useState(false);

  const handlePingGateway = async () => {
    setPingingAi(true);
    try {
      const res = await fetch('/api/director/ping', { method: 'POST' });
      const data = (await res.json()) as {
        ok?: boolean;
        latencyMs?: number;
        model?: string;
        message?: string;
      };
      if (res.ok && data.ok) {
        pushToast(`Terhubung ke ${data.model} (${data.latencyMs} ms)`, 'success');
      } else {
        pushToast(data.message || 'Gateway 9Router belum terhubung', 'danger');
      }
      await refreshHealth();
    } catch {
      pushToast('Gagal menghubungi endpoint server', 'danger');
    } finally {
      setPingingAi(false);
    }
  };

  const handleExportBackup = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'StudioFlow',
        version: '1.0.0',
        projects,
        library,
        brand,
        settings,
      },
      null,
      2
    );
    downloadTextFile('studioflow-cadangan.json', payload, 'application/json;charset=utf-8');
    pushToast('File cadangan JSON berhasil diunduh', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        importFullState(parsed);
      } catch {
        pushToast('File JSON tidak dapat dibaca', 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCheckHealth = async () => {
    setCheckingHealth(true);
    await refreshHealth();
    setCheckingHealth(false);
    pushToast('Status server diperbarui', 'info');
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[760px] flex-col gap-6">
        <div>
          <h1 className="font-display text-[25px] font-bold text-[var(--text-primary)]">
            Pengaturan StudioFlow
          </h1>
          <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
            Atur warna tampilan, tes koneksi AI Hermes 9Router, dan kelola cadangan data browser.
          </p>
        </div>

        {/* Appearance & AI Switch */}
        <section className="neo-card rounded-2xl divide-y-2 divide-[var(--border-strong)]">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="font-display text-[15.5px] font-bold text-[var(--text-primary)]">
                Mode Warna Layar
              </div>
              <div className="text-[13px] font-medium text-[var(--text-secondary)]">
                Putih Neo-Brutalism, Gelap Kontras, atau Ikuti Sistem.
              </div>
            </div>
            <SegmentedControl<AppSettings['theme']>
              value={settings.theme}
              onChange={(val) => updateSettings({ theme: val })}
              items={[
                { value: 'light', label: 'Putih' },
                { value: 'dark', label: 'Gelap' },
                { value: 'system', label: 'Sistem' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <div className="font-display text-[15.5px] font-bold text-[var(--text-primary)]">
                Gunakan AI Server (Hermes · 9Router)
              </div>
              <div className="text-[13px] font-medium text-[var(--text-secondary)]">
                Otomatis meracik kalimat Hook & adegan dengan model combo di VPS 3.
              </div>
            </div>
            <Switch
              checked={settings.useLlmWhenAvailable}
              onChange={(v) => updateSettings({ useLlmWhenAvailable: v })}
              label="Gunakan AI server"
            />
          </div>
        </section>

        {/* Gateway Status */}
        <section className="neo-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Server size={19} strokeWidth={2.5} className="text-[var(--accent-purple)]" />
              <h2 className="font-display text-[16px] font-bold text-[var(--text-primary)]">
                Gateway AI: Hermes · 9Router (VPS 3)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone={health.llmAvailable ? 'brand' : 'neutral'}>
                {health.llmAvailable ? `Terhubung · ${health.model}` : 'Menunggu .env'}
              </Tag>
              <Button
                variant="secondary"
                size="sm"
                loading={checkingHealth}
                icon={<RefreshCw size={13} strokeWidth={2.5} />}
                onClick={handleCheckHealth}
              >
                Segarkan
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={pingingAi}
                onClick={handlePingGateway}
              >
                Tes Koneksi 9Router
              </Button>
            </div>
          </div>

          <Notice kind="info">
            Isi <code>AI_BASE_URL</code>, <code>AI_API_KEY</code>, dan <code>AI_MODEL</code> (nama model combo 9Router) di file <code>.env</code> server StudioFlow.
          </Notice>

          <div className="flex items-center gap-2 font-mono text-[12px] font-bold text-[var(--text-secondary)]">
            <CheckCircle2 size={15} strokeWidth={2.5} className="text-[var(--success-fg)]" />
            <span>
              StudioFlow v{health.version} · model aktif: {health.model}
            </span>
          </div>
        </section>

        {/* Backup & Restore */}
        <section className="neo-card rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[var(--text-primary)]">
              Cadangan Data Browser ({projects.length} Proyek, {library.length} Pustaka)
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[var(--text-secondary)]">
              Unduh file JSON bila ingin memindahkan seluruh proyek ke perangkat lain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              icon={<Download size={15} strokeWidth={2.4} />}
              onClick={handleExportBackup}
            >
              Unduh Cadangan (.json)
            </Button>

            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportBackup}
            />
            <Button
              variant="secondary"
              icon={<Upload size={15} strokeWidth={2.4} />}
              onClick={() => importRef.current?.click()}
            >
              Muat Cadangan (.json)
            </Button>

            <Button
              variant="danger"
              className="sm:ml-auto"
              icon={<Trash2 size={15} strokeWidth={2.4} />}
              onClick={() => setConfirmReset(true)}
            >
              Hapus Data Browser
            </Button>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetAllData}
        title="Hapus semua data di browser ini?"
        description="Seluruh proyek dan pustaka yang tersimpan di browser ini akan dikembalikan ke setelan awal."
        confirmLabel="Ya, Hapus Semua"
      />
    </AppShell>
  );
}
