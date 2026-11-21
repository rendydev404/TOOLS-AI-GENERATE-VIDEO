import rawTemplates from './templates.json';
import type { Template, TemplatePlan, TemplateRole } from './types';

const templates = rawTemplates as Template[];

export function getAllTemplates(): Template[] {
  return templates;
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
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
