import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  Copy,
  FileSearch,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, copyToClipboard, formatDate, formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { KnowledgeDocument } from '@/types';
import {
  countMatches,
  highlightSegments,
  parseKnowledgeContent,
  relatedDocuments,
  type KnowledgeBlock,
} from '../knowledge-content';
import { kindMeta } from '../knowledge-meta';

function Highlighted({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query);

  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={`${segment.text}-${index}`}
            className="rounded bg-amber-400/20 px-0.5 text-amber-200"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        )
      )}
    </>
  );
}

function Block({
  block,
  query,
}: {
  block: KnowledgeBlock;
  query: string;
}) {
  if (block.type === 'heading') {
    return (
      <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground first:pt-0">
        <Highlighted text={block.text} query={query} />
      </h3>
    );
  }

  if (block.type === 'bullets') {
    return (
      <ul className="space-y-1.5">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/70" />
            <span>
              <Highlighted text={item} query={query} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'ordered') {
    return (
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85 marker:text-muted-foreground">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <Highlighted text={item} query={query} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-foreground/85">
      <Highlighted text={block.text} query={query} />
    </p>
  );
}

interface KnowledgeReaderProps {
  document: KnowledgeDocument;
  documents: KnowledgeDocument[];
  query: string;
  onSelect: (document: KnowledgeDocument) => void;
}

export function KnowledgeReader({
  document,
  documents,
  query,
  onSelect,
}: KnowledgeReaderProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const meta = kindMeta[document.kind];
  const Icon = meta.icon;

  const blocks = useMemo(
    () => parseKnowledgeContent(document.content),
    [document.content]
  );
  const related = useMemo(
    () => relatedDocuments(documents, document),
    [document, documents]
  );
  const matches = useMemo(
    () => countMatches(document.content, query),
    [document.content, query]
  );

  const copyDocument = async () => {
    const copiedOk = await copyToClipboard(
      `${document.title}\n\n${document.content}`
    );

    if (!copiedOk) {
      toast.error(t('Could not copy this document'));
      return;
    }

    setCopied(true);
    toast.success(t('Document copied to clipboard'));
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <header className="border-b border-border/70 px-5 py-4 pr-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('icon-tile h-8 w-8 border', meta.tone)}>
            <Icon className="h-4 w-4" />
          </span>
          <Badge variant="outline">{t(meta.label)}</Badge>
          {document.sourceMeeting ? (
            <Badge variant="info">{document.sourceMeeting}</Badge>
          ) : null}
        </div>

        <h2 className="mt-3 font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {document.title}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UserAvatar user={document.author} size="xs" />
            {document.author.fullName}
          </span>
          <span>
            {t('Updated {{date}}', {
              date: formatDate(document.updatedAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            })}
          </span>
          <span>
            {t('{{count}} min read', { count: document.readMinutes })}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-secondary/20 px-5 py-2">
        {query.trim() ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Search className="h-3 w-3" />
            {matches === 0
              ? t('No matches for “{{query}}” in this document', {
                  query: query.trim(),
                })
              : matches === 1
                ? t('{{count}} match for “{{query}}”', {
                    count: matches,
                    query: query.trim(),
                  })
                : t('{{count}} matches for “{{query}}”', {
                    count: matches,
                    query: query.trim(),
                  })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FileSearch className="h-3 w-3" />
            {t('Full document · {{count}} words', {
              count: document.content.split(/\s+/).filter(Boolean).length,
            })}
          </span>
        )}

        <div className="flex items-center gap-1">
          {document.sourceMeetingId ? (
            <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
              <Link to={`/meetings/${document.sourceMeetingId}`}>
                {t('Open meeting')}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => void copyDocument()}
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? t('Copied') : t('Copy')}
          </Button>
        </div>
      </div>

      <ScrollArea key={document.id} className="min-h-0 flex-1">
        <div className="space-y-3 px-5 py-4">
          {blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('This document has no content yet.')}
            </p>
          ) : (
            blocks.map((block, index) => (
              <Block
                key={`${block.type}-${index}`}
                block={block}
                query={query}
              />
            ))
          )}

          {document.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-4">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('Filed under')}
              </span>
              {document.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {related.length > 0 ? (
            <div className="border-t border-border/60 pt-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('Related documents')}
              </p>
              <div className="mt-2 space-y-1.5">
                {related.map((item) => {
                  const relatedMeta = kindMeta[item.kind];
                  const RelatedIcon = relatedMeta.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item)}
                      className="flex w-full items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-left transition-colors hover:border-border hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label={t('Open related document {{title}}', {
                        title: item.title,
                      })}
                    >
                      <span
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-md border',
                          relatedMeta.tone
                        )}
                      >
                        <RelatedIcon className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {t('{{kind}} · updated {{time}}', {
                            kind: t(relatedMeta.label),
                            time: formatRelativeTime(item.updatedAt),
                          })}
                        </span>
                      </span>
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
