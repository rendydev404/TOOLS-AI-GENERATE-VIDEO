import React, { useRef, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { AppSettings } from '@shared/types';
import { downloadTextFile } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button, SegmentedControl } from '@/components/ui/Primitives';
import { ConfirmModal } from '@/components/ui/CustomControls';

export function SettingsPage() {
  const {
    projects,
    library,
    brand,
    settings,
    updateSettings,
    importFullState,
    resetAllData,
    pushToast,
  } = useApp();

  const importRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

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

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div>
          <h1 className="font-display text-[25px] font-bold text-[var(--text-primary)]">
            Pengaturan StudioFlow
          </h1>
          <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)]">
            Atur tema tampilan layar dan kelola cadangan data proyek di browser kamu.
          </p>
        </div>

        {/* Appearance */}
        <section className="neo-card rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
        </section>

        {/* Backup & Restore */}
        <section className="neo-card rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="font-display text-[16px] font-bold text-[var(--text-primary)]">
              Cadangan Data Browser ({projects.length} Proyek, {library.length} Pustaka)
            </h2>
            <p className="mt-0.5 text-[13px] font-medium text-[var(--text-secondary)]">
              Unduh file JSON bila ingin menyimpan cadangan atau memindahkan seluruh proyek ke perangkat lain.
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
