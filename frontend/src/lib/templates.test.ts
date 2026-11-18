import { describe, expect, it } from 'vitest';
import type { MeetingTemplate, UserProfile } from '@/types';
import {
  emptyTemplateFilters,
  filterTemplates,
  playbookPrompts,
  sortTemplates,
  templateAgenda,
  templateMatches,
  templateToMeetingInput,
  totalPhaseMinutes,
} from './templates';

const owner: UserProfile = {
  id: 'u-ayse',
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@novalabs.io',
  initials: 'AY',
  avatarColor: '#5B8DEF',
};

function template(overrides: Partial<MeetingTemplate> = {}): MeetingTemplate {
  return {
    id: 'tpl-1',
    name: 'Weekly product sync',
    description: 'Align the product team on metrics, roadmap and risks.',
    category: 'planning',
    accent: 'blue',
    durationMinutes: 45,
    phases: [
      {
        id: 'ph-1',
        title: 'Metrics review',
        durationMinutes: 15,
        prompts: ['Which metric moved the most?'],
      },
      {
        id: 'ph-2',
        title: 'Risks',
        durationMinutes: 30,
        prompts: ['What could block the launch?', 'Who owns the mitigation?'],
      },
    ],
    tags: ['product', 'weekly'],
    usageCount: 12,
    isFavorite: true,
    lastUsedAt: '2026-02-01T10:00:00.000Z',
    owner,
    updatedAt: '2026-01-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('template helpers', () => {
  it('sums phase durations', () => {
    expect(totalPhaseMinutes(template().phases)).toBe(45);
    expect(totalPhaseMinutes([])).toBe(0);
  });

  it('derives the agenda from phase titles', () => {
    expect(templateAgenda(template())).toEqual(['Metrics review', 'Risks']);
  });

  it('builds a scheduling payload from a template', () => {
    const input = templateToMeetingInput(
      template(),
      '2026-03-02T09:00:00.000Z',
      ['u-emre']
    );

    expect(input).toEqual({
      title: 'Weekly product sync',
      startsAt: '2026-03-02T09:00:00.000Z',
      durationMinutes: 45,
      platform: 'nova_live',
      agenda: ['Metrics review', 'Risks'],
      participantIds: ['u-emre'],
      reminderMinutes: [15],
    });
  });

  it('matches Turkish queries without diacritics', () => {
    expect(templateMatches(template(), 'ayse')).toBe(true);
    expect(templateMatches(template(), 'risks launch')).toBe(true);
    expect(templateMatches(template(), 'pricing')).toBe(false);
  });

  it('filters by category, favourites and query', () => {
    const list = [
      template(),
      template({
        id: 'tpl-2',
        name: 'Customer discovery',
        category: 'customer',
        isFavorite: false,
        tags: ['sales'],
      }),
    ];

    expect(
      filterTemplates(list, {
        query: '',
        category: 'customer',
        favoritesOnly: false,
      }).map((item) => item.id)
    ).toEqual(['tpl-2']);

    expect(
      filterTemplates(list, {
        query: '',
        category: 'all',
        favoritesOnly: true,
      }).map((item) => item.id)
    ).toEqual(['tpl-1']);

    expect(
      filterTemplates(list, { ...emptyTemplateFilters(), query: 'pricing' })
    ).toEqual([]);
  });

  it('flattens phase prompts into a playbook', () => {
    expect(playbookPrompts(template())).toEqual([
      {
        phaseId: 'ph-1',
        phaseTitle: 'Metrics review',
        prompt: 'Which metric moved the most?',
      },
      {
        phaseId: 'ph-2',
        phaseTitle: 'Risks',
        prompt: 'What could block the launch?',
      },
      {
        phaseId: 'ph-2',
        phaseTitle: 'Risks',
        prompt: 'Who owns the mitigation?',
      },
    ]);
  });

  it('sorts by popularity, recency and name', () => {
    const list = [
      template({ id: 'a', name: 'Beta', usageCount: 2 }),
      template({
        id: 'b',
        name: 'Alpha',
        usageCount: 9,
        lastUsedAt: '2026-02-10T10:00:00.000Z',
      }),
    ];

    expect(sortTemplates(list, 'popular').map((item) => item.id)).toEqual([
      'b',
      'a',
    ]);
    expect(sortTemplates(list, 'recent').map((item) => item.id)).toEqual([
      'b',
      'a',
    ]);
    expect(sortTemplates(list, 'name').map((item) => item.name)).toEqual([
      'Alpha',
      'Beta',
    ]);
  });
});
