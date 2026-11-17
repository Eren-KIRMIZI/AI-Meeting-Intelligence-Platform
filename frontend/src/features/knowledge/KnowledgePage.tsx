import { useMemo, useState } from 'react';
import {
  BookOpen,
  FileText,
  Lightbulb,
  ScrollText,
  Search,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useKnowledge } from '@/hooks/use-workspace';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import type { KnowledgeDocument, KnowledgeKind } from '@/types';

const kindMeta: Record<
  KnowledgeKind,
  { label: string; icon: LucideIcon; tone: string }
> = {
  meeting_note: {
    label: 'Meeting note',
    icon: StickyNote,
    tone: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  },
  transcript: {
    label: 'Transcript',
    icon: ScrollText,
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
  playbook: {
    label: 'Playbook',
    icon: BookOpen,
    tone: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  },
  insight: {
    label: 'Insight',
    icon: Lightbulb,
    tone: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  },
  document: {
    label: 'Document',
    icon: FileText,
    tone: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  },
};

const filters: Array<{ value: 'all' | KnowledgeKind; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'meeting_note', label: 'Meeting notes' },
  { value: 'transcript', label: 'Transcripts' },
  { value: 'playbook', label: 'Playbooks' },
  { value: 'insight', label: 'Insights' },
  { value: 'document', label: 'Documents' },
];

export function KnowledgePage() {
  const knowledge = useKnowledge();
  const [filter, setFilter] = useState<'all' | KnowledgeKind>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<KnowledgeDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const list = knowledge.data ?? [];

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
            : 'Knowledge documents could not be loaded.'
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
        title="Knowledge"
        description="The searchable memory of the workspace — meeting notes, transcripts and the playbooks that follow."
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {list.length} documents · {totalMinutes} min read
          </Badge>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {filters.map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-[300px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes, transcripts, tags..."
              className="h-8 pl-8 text-xs"
              aria-label="Search knowledge"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No documents match this view"
          description="Try another type or search term. Meeting notes and transcripts appear here after a call is processed."
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
                      <Badge variant="outline">{meta.label}</Badge>
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
                        {document.readMinutes} min · {formatRelativeTime(document.updatedAt)}
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
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{kindMeta[selected.kind].label}</Badge>
                  {selected.sourceMeeting ? (
                    <Badge variant="info">{selected.sourceMeeting}</Badge>
                  ) : null}
                </div>
                <DialogTitle className="mt-1 text-xl">{selected.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <UserAvatar user={selected.author} size="xs" />
                    {selected.author.fullName}
                  </span>
                  <span>
                    Updated{' '}
                    {formatDate(selected.updatedAt, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>{selected.readMinutes} min read</span>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[56vh] pr-1">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selected.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border/70 bg-secondary/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                    This is a demo excerpt. In live mode the full document content
                    is loaded from Supabase and stays protected by workspace-level
                    row security.
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
