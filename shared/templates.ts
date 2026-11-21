import rawTemplates from './templates.json';
import type { Template, TemplatePlan, TemplateRole } from './types';

const templates = rawTemplates as Template[];

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  'cerita-pendek': 'storytelling-konten',
  'edukasi-singkat': 'edukasi-tips',
  'promo-diskon': 'opini-insight',
  'ugc-testimoni': 'review-jujur',
  'unboxing': 'review-jujur',
  'before-after': 'transformasi-perbandingan',
  'iklan-produk': 'showcase-sinematik',
  'promo-makanan': 'showcase-sinematik',
};

export function getAllTemplates(): Template[] {
  return templates;
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
  for (const d of [durationS, 20, 15, 30]) {
    const plan = template.plans[String(d)];
    if (plan) return plan;
  }
  return { roles: [], durations: [] };
}
