import { describe, expect, it } from 'vitest';
import type { KnowledgeDocument, UserProfile } from '@/types';
import {
  countMatches,
  highlightSegments,
  parseKnowledgeContent,
  relatedDocuments,
} from './knowledge-content';

const author: UserProfile = {
  id: 'u-1',
  fullName: 'Sarah Chen',
  email: 'sarah@nova.test',
  initials: 'SC',
  avatarColor: '#5B8DEF',
};

function doc(
  id: string,
  overrides: Partial<KnowledgeDocument> = {}
): KnowledgeDocument {
  return {
    id,
    title: id,
    excerpt: '',
    content: 'Body',
    kind: 'meeting_note',
    tags: [],
    author,
    updatedAt: '2026-11-10T10:00:00.000Z',
    readMinutes: 2,
    ...overrides,
  };
}

describe('parseKnowledgeContent', () => {
  it('parses headings, bullets, ordered lists and paragraphs', () => {
    const blocks = parseKnowledgeContent(
      [
        '## Decisions',
        'We agreed to ship the cohort flag.',
        '- Launch to 10%',
        '- Keep QA as the blocker',
        '',
        '## Next steps',
        '1. Review retention',
        '2. Widen access',
        '',
        'First paragraph line',
        'continues here.',
      ].join('\n')
    );

    expect(blocks).toEqual([
      { type: 'heading', text: 'Decisions' },
      { type: 'paragraph', text: 'We agreed to ship the cohort flag.' },
      { type: 'bullets', items: ['Launch to 10%', 'Keep QA as the blocker'] },
      { type: 'heading', text: 'Next steps' },
      { type: 'ordered', items: ['Review retention', 'Widen access'] },
      {
        type: 'paragraph',
        text: 'First paragraph line continues here.',
      },
    ]);
  });

  it('treats unknown markup as body text', () => {
    const blocks = parseKnowledgeContent('# Title\n> quote\n\nplain');

    expect(blocks).toEqual([
      { type: 'paragraph', text: '# Title > quote' },
      { type: 'paragraph', text: 'plain' },
    ]);
  });

  it('returns an empty list for blank content', () => {
    expect(parseKnowledgeContent('   \n\n')).toEqual([]);
  });
});

describe('highlightSegments', () => {
  it('returns a single segment when the query is empty', () => {
    expect(highlightSegments('hello', '  ')).toEqual([
      { text: 'hello', match: false },
    ]);
  });

  it('marks every case-insensitive match', () => {
    expect(highlightSegments('Owner owns the owner', 'owner')).toEqual([
      { text: 'Owner', match: true },
      { text: ' owns the ', match: false },
      { text: 'owner', match: true },
    ]);
  });

  it('escapes regular expression characters in the query', () => {
    expect(highlightSegments('Cost is 1.5x (est.)', '1.5x (est.)')).toEqual([
      { text: 'Cost is ', match: false },
      { text: '1.5x (est.)', match: true },
    ]);
  });

  it('handles empty text', () => {
    expect(highlightSegments('', 'owner')).toEqual([]);
  });
});

describe('countMatches', () => {
  it('counts non-overlapping matches', () => {
    expect(countMatches('aaaa', 'aa')).toBe(2);
    expect(countMatches('Owner owns', 'OWNER')).toBe(1);
    expect(countMatches('Owner owns', '')).toBe(0);
  });
});

describe('relatedDocuments', () => {
  const current = doc('current', {
    kind: 'meeting_note',
    tags: ['product', 'launch'],
  });

  it('ranks shared kind and tags above a single signal', () => {
    const sameKind = doc('same-kind', {
      kind: 'meeting_note',
      updatedAt: '2026-11-01T10:00:00.000Z',
    });
    const sameTag = doc('same-tag', {
      kind: 'insight',
      tags: ['launch'],
      updatedAt: '2026-11-15T10:00:00.000Z',
    });
    const both = doc('both', {
      kind: 'meeting_note',
      tags: ['launch'],
      updatedAt: '2026-10-01T10:00:00.000Z',
    });
    const unrelated = doc('unrelated', { kind: 'document' });

    const related = relatedDocuments(
      [current, sameKind, sameTag, both, unrelated],
      current
    );

    expect(related.map((item) => item.id)).toEqual(['both', 'same-kind', 'same-tag']);
  });

  it('excludes the current document and respects the limit', () => {
    const others = Array.from({ length: 5 }, (_, index) =>
      doc(`note-${index}`, { kind: 'meeting_note' })
    );

    const related = relatedDocuments([current, ...others], current, 2);

    expect(related).toHaveLength(2);
    expect(related.every((item) => item.id !== current.id)).toBe(true);
  });

  it('returns nothing when no document shares a kind or tag', () => {
    const unrelated = doc('unrelated', { kind: 'document', tags: ['security'] });

    expect(relatedDocuments([current, unrelated], current)).toEqual([]);
  });
});
