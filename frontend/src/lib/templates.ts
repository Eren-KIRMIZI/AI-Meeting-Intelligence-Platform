import type {
  CreateMeetingInput,
  MeetingTemplate,
  MeetingTemplatePhase,
  TemplateCategory,
} from '@/types';
import { normalizeText, tokenize } from '@/lib/search';

export const templateCategoryOrder: TemplateCategory[] = [
  'planning',
  'one_on_one',
  'standup',
  'retrospective',
  'customer',
  'sales',
  'interview',
  'custom',
];

export function totalPhaseMinutes(phases: MeetingTemplatePhase[]): number {
  return phases.reduce((total, phase) => total + phase.durationMinutes, 0);
}

/** The agenda a scheduled meeting inherits from its template. */
export function templateAgenda(template: MeetingTemplate): string[] {
  return template.phases.map((phase) => phase.title);
}

/**
 * Converts a playbook into the shape the scheduling dialog already accepts, so
 * starting from a template never needs a second meeting-creation path.
 */
export function templateToMeetingInput(
  template: MeetingTemplate,
  startsAt: string,
  participantIds: string[] = []
): CreateMeetingInput {
  return {
    title: template.name,
    startsAt,
    durationMinutes: template.durationMinutes,
    platform: 'nova_live',
    agenda: templateAgenda(template),
    participantIds,
    reminderMinutes: [15],
  };
}

function templateText(template: MeetingTemplate): string {
  return [
    template.name,
    template.description,
    template.owner.fullName,
    template.tags.join(' '),
    ...template.phases.flatMap((phase) => [phase.title, ...phase.prompts]),
  ].join(' ');
}

/** Every query token must match somewhere in the template. */
export function templateMatches(
  template: MeetingTemplate,
  query: string
): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const haystack = normalizeText(templateText(template));
  return tokens.every((token) => haystack.includes(token));
}

export interface TemplateFilters {
  query: string;
  category: TemplateCategory | 'all';
  favoritesOnly: boolean;
}

export function emptyTemplateFilters(): TemplateFilters {
  return { query: '', category: 'all', favoritesOnly: false };
}

export function filterTemplates(
  templates: MeetingTemplate[],
  filters: TemplateFilters
): MeetingTemplate[] {
  return templates.filter((template) => {
    if (filters.category !== 'all' && template.category !== filters.category) {
      return false;
    }
    if (filters.favoritesOnly && !template.isFavorite) return false;
    return templateMatches(template, filters.query);
  });
}

export interface PlaybookPrompt {
  phaseId: string;
  phaseTitle: string;
  prompt: string;
}

/** Flattens the phase prompts into a runnable playbook checklist. */
export function playbookPrompts(template: MeetingTemplate): PlaybookPrompt[] {
  return template.phases.flatMap((phase) =>
    phase.prompts.map((prompt) => ({
      phaseId: phase.id,
      phaseTitle: phase.title,
      prompt,
    }))
  );
}

export type TemplateSort = 'popular' | 'recent' | 'name';

export function sortTemplates(
  templates: MeetingTemplate[],
  sort: TemplateSort
): MeetingTemplate[] {
  const list = [...templates];
  if (sort === 'name') {
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sort === 'recent') {
    return list.sort(
      (a, b) =>
        new Date(b.lastUsedAt ?? b.updatedAt).getTime() -
        new Date(a.lastUsedAt ?? a.updatedAt).getTime()
    );
  }
  return list.sort((a, b) => b.usageCount - a.usageCount);
}
