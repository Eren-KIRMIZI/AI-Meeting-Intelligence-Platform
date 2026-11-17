import type { KnowledgeDocument } from '@/types';

export type KnowledgeBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'ordered'; items: string[] };

const HEADING_PATTERN = /^#{2,4}\s+/;
const BULLET_PATTERN = /^[-*]\s+/;
const ORDERED_PATTERN = /^\d+[.)]\s+/;

/**
 * Parses the small markdown subset stored in `knowledge_documents.content`:
 * level 2-4 headings, `-`/`*` bullets, numbered lists and paragraphs.
 * Anything else is treated as body text so imported documents never break.
 */
export function parseKnowledgeContent(content: string): KnowledgeBlock[] {
  const blocks: KnowledgeBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
    if (bullets.length > 0) {
      blocks.push({ type: 'bullets', items: bullets });
      bullets = [];
    }
    if (ordered.length > 0) {
      blocks.push({ type: 'ordered', items: ordered });
      ordered = [];
    }
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flush();
      continue;
    }

    if (HEADING_PATTERN.test(line)) {
      flush();
      blocks.push({ type: 'heading', text: line.replace(HEADING_PATTERN, '') });
      continue;
    }

    if (BULLET_PATTERN.test(line)) {
      if (paragraph.length > 0 || ordered.length > 0) flush();
      bullets.push(line.replace(BULLET_PATTERN, ''));
      continue;
    }

    if (ORDERED_PATTERN.test(line)) {
      if (paragraph.length > 0 || bullets.length > 0) flush();
      ordered.push(line.replace(ORDERED_PATTERN, ''));
      continue;
    }

    if (bullets.length > 0 || ordered.length > 0) flush();
    paragraph.push(line);
  }

  flush();
  return blocks;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Splits text into segments so the reader can mark search hits safely. */
export function highlightSegments(
  text: string,
  query: string
): HighlightSegment[] {
  const needle = query.trim();
  if (!text) return [];
  if (!needle) return [{ text, match: false }];

  const pattern = new RegExp(escapeRegExp(needle), 'gi');
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), match: false });
    }
    segments.push({ text: match[0], match: true });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false });
  }

  return segments;
}

export function countMatches(text: string, query: string): number {
  const needle = query.trim();
  if (!needle) return 0;

  const pattern = new RegExp(escapeRegExp(needle), 'gi');
  return [...text.matchAll(pattern)].length;
}

/**
 * Surfaces up to `limit` documents that share a kind or a tag with the current
 * one, ranked by overlap and then recency.
 */
export function relatedDocuments(
  documents: KnowledgeDocument[],
  current: KnowledgeDocument,
  limit = 3
): KnowledgeDocument[] {
  return documents
    .filter((document) => document.id !== current.id)
    .map((document) => {
      const sharedTags = document.tags.filter((tag) =>
        current.tags.includes(tag)
      ).length;
      return {
        document,
        score: (document.kind === current.kind ? 2 : 0) + sharedTags,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.document.updatedAt).getTime() -
          new Date(a.document.updatedAt).getTime()
    )
    .slice(0, limit)
    .map((entry) => entry.document);
}
