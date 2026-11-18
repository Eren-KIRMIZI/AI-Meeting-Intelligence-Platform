import type {
  SearchFilters,
  SearchIndexInput,
  SearchResult,
  SearchResultKind,
} from '@/types';

const DIACRITICS: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

const KIND_WEIGHT: Record<SearchResultKind, number> = {
  meeting: 3,
  decision: 2.6,
  task: 2.2,
  person: 1.8,
  project: 1.7,
  knowledge: 1.3,
  transcript: 1.1,
};

/** Lowercases and folds Turkish characters so `ayşe` matches `ayse`. */
export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıİöşüâîû]/g, (character) => DIACRITICS[character] ?? character);
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function join(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function excerptOf(text: string, length = 180): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > length ? `${compact.slice(0, length - 1).trimEnd()}…` : compact;
}

/** Returns a window of text around the first query token, for result snippets. */
export function snippetFor(text: string, tokens: string[], length = 160): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= length) return compact;

  const normalized = normalizeText(compact);
  const firstMatch = tokens
    .map((token) => normalized.indexOf(token))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (firstMatch === undefined) return excerptOf(compact, length);

  const start = Math.max(0, firstMatch - Math.floor(length / 3));
  const end = Math.min(compact.length, start + length);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < compact.length ? '…' : '';
  return `${prefix}${compact.slice(start, end).trim()}${suffix}`;
}

export function emptySearchFilters(): SearchFilters {
  return {
    query: '',
    kinds: [],
    personId: null,
    projectId: null,
    from: null,
    to: null,
  };
}

/**
 * Flattens every searchable workspace entity into a single index. Meeting
 * transcripts become their own results so a phrase match can deep-link to the
 * exact meeting transcript tab.
 */
export function buildSearchIndex(input: SearchIndexInput): SearchResult[] {
  const results: SearchResult[] = [];
  const projectNameById = new Map(
    input.projects.map((project) => [project.id, project.name])
  );

  for (const meeting of input.meetings) {
    const participantIds = meeting.participants.map((participant) => participant.id);
    const participantNames = meeting.participants.map(
      (participant) => participant.fullName
    );
    const content = join(
      meeting.title,
      meeting.projectName,
      meeting.agenda.join(' '),
      meeting.summary,
      participantNames.join(' '),
      meeting.actionItems.join(' '),
      meeting.decisions.join(' ')
    );

    results.push({
      id: `meeting-${meeting.id}`,
      kind: 'meeting',
      title: meeting.title,
      excerpt: excerptOf(meeting.summary ?? meeting.agenda.join(' · ')),
      content,
      path: `/meetings/${meeting.id}`,
      projectId: meeting.projectId,
      projectName: meeting.projectName,
      participantIds,
      date: meeting.startsAt,
      score: 0,
      meta: meeting.projectName,
    });

    const transcript = meeting.analysis?.transcript ?? [];
    if (transcript.length > 0) {
      const transcriptText = transcript
        .map((line) => `${line.speaker}: ${line.text}`)
        .join(' ');
      results.push({
        id: `transcript-${meeting.id}`,
        kind: 'transcript',
        title: meeting.title,
        excerpt: excerptOf(transcriptText),
        content: transcriptText,
        path: `/meetings/${meeting.id}?tab=transcript`,
        projectId: meeting.projectId,
        projectName: meeting.projectName,
        participantIds,
        date: meeting.startsAt,
        score: 0,
        meta: meeting.projectName,
      });
    }
  }

  for (const decision of input.decisions) {
    results.push({
      id: `decision-${decision.id}`,
      kind: 'decision',
      title: decision.title,
      excerpt: excerptOf(decision.context),
      content: join(
        decision.title,
        decision.context,
        decision.owner.fullName,
        decision.meetingTitle,
        decision.projectName
      ),
      path: `/decisions?decision=${decision.id}`,
      projectName: decision.projectName,
      participantIds: [decision.owner.id],
      date: decision.decidedAt,
      score: 0,
      meta: decision.owner.fullName,
    });
  }

  for (const task of input.tasks) {
    results.push({
      id: `task-${task.id}`,
      kind: 'task',
      title: task.title,
      excerpt: excerptOf(task.description ?? task.projectName),
      content: join(
        task.title,
        task.description,
        task.projectName,
        task.assignee?.fullName,
        task.tags.join(' ')
      ),
      path: `/tasks?task=${task.id}`,
      projectId: task.projectId,
      projectName: task.projectName,
      participantIds: task.assignee ? [task.assignee.id] : [],
      date: task.dueDate ?? task.createdAt,
      score: 0,
      meta: task.assignee?.fullName ?? task.projectName,
    });
  }

  for (const member of input.team) {
    const projectNames = member.projectIds
      .map((id) => projectNameById.get(id))
      .filter((name): name is string => Boolean(name));

    results.push({
      id: `person-${member.id}`,
      kind: 'person',
      title: member.fullName,
      excerpt: join(member.jobTitle, projectNames.join(' · ')),
      content: join(
        member.fullName,
        member.email,
        member.jobTitle,
        projectNames.join(' ')
      ),
      path: `/team?member=${member.id}`,
      participantIds: [member.id],
      date: member.joinedAt ?? '',
      score: 0,
      meta: member.jobTitle,
    });
  }

  for (const project of input.projects) {
    const memberNames = project.members.map((member) => member.fullName);
    results.push({
      id: `project-${project.id}`,
      kind: 'project',
      title: project.name,
      excerpt: excerptOf(project.description),
      content: join(
        project.name,
        project.description,
        project.category,
        project.owner.fullName,
        memberNames.join(' ')
      ),
      path: `/projects/${project.id}`,
      projectId: project.id,
      projectName: project.name,
      participantIds: [
        project.owner.id,
        ...project.members.map((member) => member.id),
      ],
      date: project.updatedAt,
      score: 0,
      meta: project.category,
    });
  }

  for (const document of input.knowledge) {
    results.push({
      id: `knowledge-${document.id}`,
      kind: 'knowledge',
      title: document.title,
      excerpt: excerptOf(document.excerpt),
      content: join(
        document.title,
        document.excerpt,
        document.content,
        document.tags.join(' '),
        document.author.fullName,
        document.sourceMeeting
      ),
      path: `/knowledge?doc=${document.id}`,
      participantIds: [document.author.id],
      date: document.updatedAt,
      score: 0,
      meta: document.sourceMeeting,
    });
  }

  return results;
}

function scoreResult(result: SearchResult, tokens: string[], phrase: string): number {
  const title = normalizeText(result.title);
  const content = normalizeText(result.content);
  let score = KIND_WEIGHT[result.kind];

  for (const token of tokens) {
    const titleMatches = title.split(token).length - 1;
    const contentMatches = content.split(token).length - 1;
    if (titleMatches === 0 && contentMatches === 0) return 0;

    score += titleMatches * 12 + Math.min(contentMatches, 6) * 2;
  }

  if (phrase.length > 1) {
    if (title.includes(phrase)) score += 24;
    else if (content.includes(phrase)) score += 10;
  }

  if (result.date) {
    const ageDays =
      (Date.now() - new Date(result.date).getTime()) / 86_400_000;
    if (Number.isFinite(ageDays)) {
      score += Math.max(0, 6 - Math.abs(ageDays) / 30);
    }
  }

  return score;
}

function withinRange(date: string, from: string | null, to: string | null): boolean {
  if (!from && !to) return true;
  if (!date) return false;

  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return false;
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

/**
 * Applies type/person/project/date filters and ranks matches. Every query token
 * must appear somewhere in the record, so `onboarding sarah` narrows instead of
 * widening the result set.
 */
export function searchWorkspace(
  index: SearchResult[],
  filters: SearchFilters
): SearchResult[] {
  const tokens = tokenize(filters.query);
  const phrase = normalizeText(filters.query).trim();
  const activeKinds = new Set(filters.kinds);

  return index
    .filter((result) => {
      if (activeKinds.size > 0 && !activeKinds.has(result.kind)) return false;
      if (filters.personId && !result.participantIds.includes(filters.personId)) {
        return false;
      }
      if (filters.projectId && result.projectId !== filters.projectId) return false;
      return withinRange(result.date, filters.from, filters.to);
    })
    .map((result) => {
      const score =
        tokens.length === 0 ? 1 : scoreResult(result, tokens, phrase);
      return {
        ...result,
        score,
        excerpt:
          tokens.length > 0
            ? snippetFor(result.content, tokens)
            : result.excerpt,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export function countByKind(
  results: SearchResult[]
): Record<SearchResultKind, number> {
  return results.reduce(
    (counts, result) => {
      counts[result.kind] += 1;
      return counts;
    },
    {
      meeting: 0,
      transcript: 0,
      decision: 0,
      task: 0,
      person: 0,
      project: 0,
      knowledge: 0,
    } satisfies Record<SearchResultKind, number>
  );
}
