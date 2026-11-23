import { createOfflineSceneVariation, generateOfflinePack } from '@shared/director';
import { getTemplateById } from '@shared/templates';
import type { Answers, Pack, Scene } from '@shared/types';

export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '');
export const APP_BASE = import.meta.env.BASE_URL || '/';
export const IS_MEMBER_EMBED = APP_BASE.startsWith('/member/');

export function resolveAssetUrl(assetPath: string): string {
  if (!assetPath || /^https?:\/\//i.test(assetPath) || assetPath.startsWith('data:') || assetPath.startsWith('blob:')) {
    return assetPath;
  }
  const cleanBase = APP_BASE.endsWith('/') ? APP_BASE : `${APP_BASE}/`;
  return `${cleanBase}${assetPath.replace(/^\/+/, '')}`;
}

export interface ServerHealth {
  ok: boolean;
  version: string;
  llmAvailable: boolean;
  provider: string | null;
  model: string;
}

export async function fetchServerHealth(): Promise<ServerHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', credentials: 'same-origin' });
    if (res.status === 401 && IS_MEMBER_EMBED) {
      window.location.href = '/member/masuk';
    }
    if (!res.ok) throw new Error('Health not ok');
    return (await res.json()) as ServerHealth;
  } catch {
    return {
      ok: false,
      version: '0.4.0',
      llmAvailable: false,
      provider: null,
      model: 'offline-local',
    };
  }
}

export async function generatePackSmart(
  templateId: string,
  answers: Answers,
  preferLlm: boolean
): Promise<{ pack: Pack; usedLlm: boolean }> {
  const tpl = getTemplateById(templateId);
  if (!tpl) throw new Error('Template tidak ditemukan.');

  const offlinePack = generateOfflinePack(tpl, answers);
  if (!preferLlm) {
    return { pack: offlinePack, usedLlm: false };
  }

  try {
    const res = await fetch(`${API_BASE}/director/enrich`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ templateId, answers }),
    });
    if (!res.ok) {
      return { pack: offlinePack, usedLlm: false };
    }
    const data = (await res.json()) as { pack?: Pack; enriched?: boolean };
    if (data.pack) {
      return { pack: data.pack, usedLlm: Boolean(data.enriched) };
    }
    return { pack: offlinePack, usedLlm: false };
  } catch {
    return { pack: offlinePack, usedLlm: false };
  }
}

export async function generateVariationSmart(
  scene: Scene,
  bible: Pack['bible'],
  answers: Answers,
  preferLlm: boolean,
  seed: number
): Promise<{ scene: Scene; source: 'offline' | 'llm' }> {
  const fallback = createOfflineSceneVariation(scene, bible, answers, seed);
  if (!preferLlm) {
    return { scene: fallback, source: 'offline' };
  }
  try {
    const res = await fetch(`${API_BASE}/director/variation`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scene, bible, answers, seed }),
    });
    if (!res.ok) return { scene: fallback, source: 'offline' };
    const data = (await res.json()) as { scene?: Scene; source?: 'offline' | 'llm' };
    if (data.scene) {
      return { scene: data.scene, source: data.source ?? 'offline' };
    }
    return { scene: fallback, source: 'offline' };
  } catch {
    return { scene: fallback, source: 'offline' };
  }
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
