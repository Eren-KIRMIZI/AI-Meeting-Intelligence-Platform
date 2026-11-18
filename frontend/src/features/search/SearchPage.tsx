import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  FileText,
  FolderKanban,
  GitBranch,
  ListTodo,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import {
  useGlobalSearch,
  useProjects,
  useTeam,
} from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import { emptySearchFilters, normalizeText, tokenize } from '@/lib/search';
import { cn, formatDate } from '@/lib/utils';
import type { SearchFilters, SearchResult, SearchResultKind } from '@/types';

const kindMeta: Record<SearchResultKind, { icon: LucideIcon; label: string }> = {
  meeting: { icon: CalendarDays, label: 'Meetings' },
  transcript: { icon: FileText, label: 'Transcripts' },
  decision: { icon: GitBranch, label: 'Decisions' },
  task: { icon: ListTodo, label: 'Tasks' },
  person: { icon: UserRound, label: 'People' },
  project: { icon: FolderKanban, label: 'Projects' },
  knowledge: { icon: BookOpen, label: 'Knowledge' },
};

const kindOrder: SearchResultKind[] = [
  'meeting',
  'transcript',
  'decision',
  'task',
  'person',
  'project',
  'knowledge',
];

function Highlighted({ text, tokens }: { text: string; tokens: string[] }) {
  if (tokens.length === 0) return <>{text}</>;

  // Compare on normalised words so `ayse` still highlights `Ayşe`.
  return (
    <>
      {text.split(/(\s+)/).map((part, index) => {
        const normalized = normalizeText(part);
        const matched = tokens.some((token) => normalized.includes(token));
        return matched ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-blue-500/20 px-0.5 text-blue-200"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

export function SearchPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [kinds, setKinds] = useState<SearchResultKind[]>([]);
  const [personId, setPersonId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const team = useTeam();
  const projects = useProjects();

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (debounced) next.set('q', debounced);
        else next.delete('q');
        return next;
      },
      { replace: true }
    );
  }, [debounced, setSearchParams]);

  const filters = useMemo<SearchFilters>(
    () => ({
      ...emptySearchFilters(),
      query: debounced,
      kinds,
      personId: personId || null,
      projectId: projectId || null,
      from: from || null,
      to: to || null,
    }),
    [debounced, kinds, personId, projectId, from, to]
  );

  const search = useGlobalSearch(filters);
  const results = useMemo(() => search.data ?? [], [search.data]);
  const tokens = useMemo(() => tokenize(debounced), [debounced]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResultKind, SearchResult[]>();
    for (const result of results) {
      const list = map.get(result.kind) ?? [];
      list.push(result);
      map.set(result.kind, list);
    }
    return kindOrder
      .map((kind) => [kind, map.get(kind) ?? []] as const)
      .filter(([, list]) => list.length > 0);
  }, [results]);

  const activeFilterCount =
    kinds.length +
    (personId ? 1 : 0) +
    (projectId ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  const toggleKind = (kind: SearchResultKind) => {
    setKinds((current) =>
      current.includes(kind)
        ? current.filter((item) => item !== kind)
        : [...current, kind]
    );
  };

  const clearFilters = () => {
    setKinds([]);
    setPersonId('');
    setProjectId('');
    setFrom('');
    setTo('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Global search')}
        description={t(
          'Search every meeting, transcript, decision, task, person and project, then jump straight to the source.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{count}} results', { count: results.length })}
          </Badge>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search meetings, transcripts, decisions, tasks and people...')}
              aria-label={t('Search the workspace')}
              className="h-11 pl-10 pr-10 text-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('Clear search')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-3 w-3" />
              {t('Filters')}
              {activeFilterCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-blue-500/20 px-1.5 text-[10px] text-blue-300">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>

            {kindOrder.map((kind) => {
              const Icon = kindMeta[kind].icon;
              const active = kinds.includes(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleKind(kind)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    active
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                      : 'border-border/70 bg-secondary/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {t(kindMeta[kind].label)}
                </button>
              );
            })}

            {activeFilterCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={clearFilters}
              >
                {t('Clear filters')}
              </Button>
            ) : null}
          </div>

          {showFilters ? (
            <div className="grid gap-3 rounded-lg border border-border/70 bg-secondary/20 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1 text-[11px] text-muted-foreground">
                <span>{t('Person')}</span>
                <NativeSelect
                  value={personId}
                  onChange={(event) => setPersonId(event.target.value)}
                  aria-label={t('Filter by person')}
                  className="h-8 text-xs"
                >
                  <option value="">{t('Anyone')}</option>
                  {(team.data ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="space-y-1 text-[11px] text-muted-foreground">
                <span>{t('Project')}</span>
                <NativeSelect
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  aria-label={t('Filter by project')}
                  className="h-8 text-xs"
                >
                  <option value="">{t('All projects')}</option>
                  {(projects.data ?? []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="space-y-1 text-[11px] text-muted-foreground">
                <span>{t('From date')}</span>
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  aria-label={t('From date')}
                  className="h-8 text-xs"
                />
              </label>

              <label className="space-y-1 text-[11px] text-muted-foreground">
                <span>{t('To date')}</span>
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  aria-label={t('To date')}
                  className="h-8 text-xs"
                />
              </label>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {search.isLoading ? (
        <PageSkeleton />
      ) : search.error ? (
        <ErrorState
          description={
            search.error instanceof Error
              ? search.error.message
              : t('Search could not be completed.')
          }
          onRetry={() => void search.refetch()}
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('No results match this search')}
          description={t(
            'Try a shorter phrase, remove a filter, or search for a person, project or decision.'
          )}
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t('Clear filters')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([kind, items]) => {
            const Icon = kindMeta[kind].icon;
            return (
              <section key={kind} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(kindMeta[kind].label)}
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/70">
                      {items.map((result) => (
                        <Link
                          key={result.id}
                          to={result.path}
                          className="group flex items-start gap-3 px-4 py-3 outline-none transition-colors hover:bg-secondary/25 focus-visible:bg-secondary/25"
                        >
                          <span className="icon-tile mt-0.5 h-8 w-8 border-border/70 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                <Highlighted text={result.title} tokens={tokens} />
                              </span>
                              {result.projectName ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {result.projectName}
                                </Badge>
                              ) : null}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              <Highlighted text={result.excerpt} tokens={tokens} />
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground">
                              {result.meta ? <span>{result.meta}</span> : null}
                              {result.date ? (
                                <span>
                                  {formatDate(result.date, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              ) : null}
                              <span>
                                {t('Match score {{score}}', {
                                  score: Math.round(result.score),
                                })}
                              </span>
                            </span>
                          </span>
                          <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
