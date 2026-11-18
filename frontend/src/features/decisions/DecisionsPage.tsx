import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  GitBranch,
  Search,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import { DecisionStatusBadge } from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDecisions } from '@/hooks/use-workspace';
import { cn, downloadCsv, formatDate } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { DecisionStatus } from '@/types';
import { DecisionDetailDialog } from './components/decision-detail-dialog';
import { decisionFilters, decisionImpactVariant } from './decision-meta';

export function DecisionsPage() {
  const { t } = useI18n();
  const decisions = useDecisions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | DecisionStatus>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = decisions.data ?? [];
  const linkedId = searchParams.get('decision');
  const selected =
    list.find((decision) => decision.id === (selectedId ?? linkedId)) ?? null;

  const closeSelected = () => {
    setSelectedId(null);
    if (searchParams.has('decision')) {
      const next = new URLSearchParams(searchParams);
      next.delete('decision');
      setSearchParams(next, { replace: true });
    }
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return list.filter((decision) => {
      if (filter !== 'all' && decision.status !== filter) return false;
      if (!normalized) return true;
      return `${decision.title} ${decision.context} ${decision.owner.fullName} ${
        decision.projectName ?? ''
      } ${decision.meetingTitle}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [filter, list, query]);

  if (decisions.isLoading) return <PageSkeleton />;

  if (decisions.error) {
    return (
      <ErrorState
        description={
          decisions.error instanceof Error
            ? decisions.error.message
            : t('Decisions could not be loaded.')
        }
        onRetry={() => void decisions.refetch()}
      />
    );
  }

  const accepted = list.filter((decision) => decision.status === 'accepted').length;
  const proposed = list.filter((decision) => decision.status === 'proposed').length;
  const highImpact = list.filter((decision) => decision.impact === 'high').length;

  const summary = [
    { label: t('Total decisions'), value: list.length, icon: GitBranch, tone: 'text-blue-400' },
    { label: t('Accepted'), value: accepted, icon: CheckCircle2, tone: 'text-emerald-400' },
    { label: t('Awaiting review'), value: proposed, icon: Clock3, tone: 'text-amber-400' },
    { label: t('High impact'), value: highImpact, icon: Target, tone: 'text-rose-400' },
  ];

  const exportDecisions = () => {
    if (filtered.length === 0) {
      toast.error(t('There are no decisions to export'));
      return;
    }
    downloadCsv(
      'nova-decisions.csv',
      filtered.map((decision) => ({
        Decision: decision.title,
        Status: decision.status,
        Impact: decision.impact,
        Owner: decision.owner.fullName,
        Project: decision.projectName ?? '',
        Source: decision.meetingTitle,
        Decided: decision.decidedAt,
        Context: decision.context,
      }))
    );
    toast.success(t('Decision log exported'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Decisions')}
        description={t(
          'A durable log of what was decided, who owns it and which conversation it came from. Open a decision to change its status.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{count}} logged', { count: list.length })}
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={exportDecisions}>
            <Download className="h-3.5 w-3.5" />
            {t('Export CSV')}
          </Button>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 divide-x divide-border/70 p-0 sm:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5 px-4 py-3.5">
                <span className={cn('icon-tile h-8 w-8 border-border/70', item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold leading-none tabular">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {decisionFilters.map((item) => (
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
          <div className="relative w-full sm:max-w-[280px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search decisions...')}
              className="h-8 pl-8 text-xs"
              aria-label={t('Search decisions')}
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={t('No decisions match this view')}
          description={t(
            'Try another status or search term. Accepted decisions from meetings appear here automatically.'
          )}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Decision')}</TableHead>
                  <TableHead>{t('Status')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('Impact')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('Owner')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('Source')}</TableHead>
                  <TableHead className="text-right">{t('Decided')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((decision) => (
                  <TableRow key={decision.id}>
                    <TableCell className="max-w-[360px]">
                      <button
                        type="button"
                        onClick={() => setSelectedId(decision.id)}
                        className="group flex w-full items-start gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground">
                            {decision.title}
                          </span>
                          <span className="mt-0.5 block line-clamp-1 text-[10px] text-muted-foreground">
                            {decision.context}
                          </span>
                          {decision.projectName ? (
                            <span className="mt-1 block text-[10px] text-blue-400/80">
                              {decision.projectName}
                            </span>
                          ) : null}
                        </span>
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </button>
                    </TableCell>
                    <TableCell>
                      <DecisionStatusBadge status={decision.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={decisionImpactVariant[decision.impact]}>
                        {t(decision.impact)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={decision.owner} size="xs" />
                        <span className="text-[11px] text-muted-foreground">
                          {decision.owner.fullName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-[11px] text-muted-foreground">
                        {decision.meetingTitle}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(decision.decidedAt, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DecisionDetailDialog
        key={selected?.id ?? 'closed'}
        decision={selected}
        onOpenChange={(open) => {
          if (!open) closeSelected();
        }}
      />
    </div>
  );
}
