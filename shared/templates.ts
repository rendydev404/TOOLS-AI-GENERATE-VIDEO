import rawTemplates from './templates.json';
import type { ContentMode, SellingStyle, Template, TemplatePlan, TemplateRole } from './types';

const templates = rawTemplates as Template[];

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  'cerita-pendek': 'storytelling-konten',
  'edukasi-singkat': 'edukasi-tips',
  'transformasi-perbandingan': 'before-after-produk',
  'review-jujur': 'ugc-affiliate',
  'iklan-produk': 'iklan-konversi',
  'ugc-testimoni': 'ugc-affiliate',
  'before-after': 'before-after-produk',
  'unboxing': 'unboxing-detail',
  'promo-diskon': 'promo-penawaran',
  'promo-makanan': 'iklan-konversi',
};

export function getAllTemplates(): Template[] {
  return templates;
}

export function getTemplatesByMode(mode: ContentMode, sellingStyle?: SellingStyle): Template[] {
  if (mode === 'marketing' && sellingStyle) {
    return templates.filter((t) => t.mode === 'marketing' && t.sellingStyle === sellingStyle);
  }
  return templates.filter((t) => t.mode === mode);
}

export function getTemplateById(id: string): Template | undefined {
  const direct = templates.find((t) => t.id === id);
  if (direct) return direct;
  const mapped = LEGACY_TEMPLATE_ALIASES[id];
  return mapped ? templates.find((t) => t.id === mapped) : undefined;
}

export function getTemplateRole(template: Template, roleName: string): TemplateRole | undefined {
  return template.roles.find((r) => r.role === roleName);
}

export function getPlanForDuration(template: Template, durationS: number): TemplatePlan {
  for (const d of [durationS, 20, 15, 30, 60]) {
    const plan = template.plans[String(d)];
    if (plan) return plan;
  }
  return { roles: [], durations: [] };
}
