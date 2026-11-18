import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKnowledge } from '@/hooks/use-workspace';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { KnowledgeDocument, KnowledgeKind } from '@/types';
import { KnowledgeReader } from './components/knowledge-reader';
import { kindMeta, knowledgeFilters } from './knowledge-meta';

export function KnowledgePage() {
  const { t } = useI18n();
  const knowledge = useKnowledge();
  const [filter, setFilter] = useState<'all' | KnowledgeKind>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<KnowledgeDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const list = useMemo(() => knowledge.data ?? [], [knowledge.data]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return list.filter((document) => {
      if (filter !== 'all' && document.kind !== filter) return false;
      if (!normalized) return true;
      return `${document.title} ${document.excerpt} ${document.tags.join(' ')} ${
        document.author.fullName
      }`
        .toLowerCase()
        .includes(normalized);
    });
  }, [filter, list, query]);

  if (knowledge.isLoading) return <PageSkeleton />;

  if (knowledge.error) {
    return (
      <ErrorState
        description={
          knowledge.error instanceof Error
            ? knowledge.error.message
            : t('Knowledge documents could not be loaded.')
        }
        onRetry={() => void knowledge.refetch()}
      />
    );
  }

  const totalMinutes = list.reduce(
    (total, document) => total + document.readMinutes,
    0
  );

  const openDocument = (document: KnowledgeDocument) => {
    setSelected(document);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Knowledge')}
        description={t(
          'The searchable memory of the workspace — meeting notes, transcripts and the playbooks that follow.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{documents}} documents · {{minutes}} min read', {
              documents: list.length,
              minutes: totalMinutes,
            })}
          </Badge>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {knowledgeFilters.map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setFilter(item.value)}
              >
                {t(item.label)}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-[300px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search notes, transcripts, tags...')}
              className="h-8 pl-8 text-xs"
              aria-label={t('Search knowledge')}
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t('No documents match this view')}
          description={t(
            'Try another type or search term. Meeting notes and transcripts appear here after a call is processed.'
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((document) => {
            const meta = kindMeta[document.kind];
            const Icon = meta.icon;
            return (
              <button
                key={document.id}
                type="button"
                onClick={() => openDocument(document)}
                className="text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Card className="h-full transition-colors hover:border-border/90">
                  <CardContent className="flex h-full flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn('icon-tile h-9 w-9 border', meta.tone)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <Badge variant="outline">{t(meta.label)}</Badge>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                      {document.title}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {document.excerpt}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {document.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/70 bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={document.author} size="xs" />
                        <span className="truncate text-[10px] text-muted-foreground">
                          {document.author.fullName}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {t('{{minutes}} min read · {{time}}', {
                          minutes: document.readMinutes,
                          time: formatRelativeTime(document.updatedAt),
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          {selected ? (
            <>
              <DialogTitle className="sr-only">{selected.title}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('{{kind}} by {{author}}, updated {{date}}.', {
                  kind: t(kindMeta[selected.kind].label),
                  author: selected.author.fullName,
                  date: formatDate(selected.updatedAt, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                })}
              </DialogDescription>
              <KnowledgeReader
                key={selected.id}
                document={selected}
                documents={list}
                query={query}
                onSelect={setSelected}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
