import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataSourceBadge } from '@/components/common/data-source-badge';
import { SectionHeader } from '@/components/common/section-header';
import { MeetingStatusBadge } from '@/components/common/status-badges';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { NativeSelect } from '@/components/ui/select-native';
import { useInsights, useMeetings } from '@/hooks/use-workspace';
import { isSupabaseConfigured } from '@/lib/env';
import {
  insightConversionLink,
  insightKindLabels,
  insightStatusMeta,
} from '@/lib/insights';
import { aiBrief } from '@/mocks/data';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Insight, InsightKind, InsightStatus } from '@/types';
import { InsightDetailDialog } from './components/insight-detail-dialog';
import { insightKindMeta } from './insight-meta';

const pipeline = [
  {
    title: 'Capture',
    description:
      'Transcripts and agendas arrive from Meet, Teams or Zoom and are stored against the meeting record.',
    icon: Sparkles,
  },
  {
    title: 'Extract',
    description:
      'Summaries, decisions, risks and action items are separated with an owner and a confidence score.',
    icon: BrainCircuit,
  },
  {
    title: 'Act',
    description:
      'Owners confirm the output, tasks land in the project, and the decision log keeps the record.',
    icon: CheckCircle2,
  },
];

const kindFilters: Array<{ value: 'all' | InsightKind; label: string }> = [
  { value: 'all', label: 'All kinds' },
  { value: 'summary', label: insightKindLabels.summary },
  { value: 'decision', label: insightKindLabels.decision },
  { value: 'action', label: insightKindLabels.action },
  { value: 'risk', label: insightKindLabels.risk },
];

const statusFilters: Array<{ value: 'all' | InsightStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'converted', label: 'Converted' },
];

function InsightCard({
  insight,
  onOpen,
}: {
  insight: Insight;
  onOpen: () => void;
}) {
  const meta = insightKindMeta[insight.kind];
  const Icon = meta.icon;
  const status = insightStatusMeta[insight.status];
  const conversion = insightConversionLink(insight);
  const confidence = Math.round(insight.confidence * 100);

  return (
    <Card
      className="flex cursor-pointer flex-col transition-colors hover:border-primary/40 hover:bg-secondary/20"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={meta.badge}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
          <Badge variant={status.tone}>{status.label}</Badge>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {formatRelativeTime(insight.createdAt)}
          </span>
        </div>

        <p className="mt-3 text-sm font-semibold leading-snug text-foreground">
          {insight.title}
        </p>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {insight.summary}
        </p>

        {insight.items.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {insight.items.slice(0, 3).map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground"
              >
                <CheckCircle2
                  className={cn('mt-0.5 h-3 w-3 shrink-0', meta.tone)}
                />
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <UserAvatar user={insight.owner} size="xs" />
              <span className="truncate">{insight.owner.fullName}</span>
            </span>
            <span className="tabular text-foreground">{confidence}%</span>
          </div>
          <Progress value={confidence} className="mt-1.5" />

          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span className="truncate">{insight.meetingTitle}</span>
            {conversion ? (
              <Link
                to={conversion.href}
                className="inline-flex shrink-0 items-center gap-1 text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {conversion.label}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntelligencePage() {
  const meetings = useMeetings();
  const insights = useInsights();
  const [searchParams, setSearchParams] = useSearchParams();
  const [kindFilter, setKindFilter] = useState<'all' | InsightKind>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | InsightStatus>('all');
  const [query, setQuery] = useState('');

  const list = meetings.data ?? [];
  const insightList = useMemo(() => insights.data ?? [], [insights.data]);

  const analyzed = list.filter(
    (meeting) =>
      meeting.status === 'completed' || meeting.status === 'processing'
  );
  const briefMeeting =
    analyzed.find((meeting) => meeting.analysis) ?? analyzed[0] ?? null;
  const briefAnalysis = briefMeeting?.analysis;
  const briefTitle = briefMeeting?.title ?? aiBrief.meetingTitle;
  const briefSummary = briefAnalysis?.summary ?? aiBrief.summary;
  const briefUpdatedAt = briefAnalysis?.analyzedAt ?? aiBrief.updatedAt;
  const briefItems = briefAnalysis
    ? briefAnalysis.actions.slice(0, 3).map((action) => ({
        text: action.text,
        owner: action.owner,
        tag: 'Action',
      }))
    : aiBrief.items;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return insightList.filter((insight) => {
      if (kindFilter !== 'all' && insight.kind !== kindFilter) return false;
      if (statusFilter !== 'all' && insight.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        insight.title.toLowerCase().includes(needle) ||
        insight.summary.toLowerCase().includes(needle) ||
        insight.meetingTitle.toLowerCase().includes(needle) ||
        insight.owner.fullName.toLowerCase().includes(needle) ||
        (insight.projectName ?? '').toLowerCase().includes(needle)
      );
    });
  }, [insightList, kindFilter, statusFilter, query]);

  const openCount = insightList.filter(
    (insight) => insight.status === 'open'
  ).length;
  const acceptedCount = insightList.filter(
    (insight) => insight.status === 'accepted'
  ).length;
  const convertedCount = insightList.filter(
    (insight) => insight.status === 'converted'
  ).length;
  const averageConfidence =
    insightList.length === 0
      ? 0
      : Math.round(
          (insightList.reduce(
            (total, insight) => total + insight.confidence,
            0
          ) /
            insightList.length) *
            100
        );

  const kpis: Array<{
    label: string;
    value: string | number;
    tone: string;
    icon: LucideIcon;
  }> = [
    {
      label: 'Open queue',
      value: openCount,
      tone: 'text-amber-400',
      icon: Sparkles,
    },
    {
      label: 'Accepted',
      value: acceptedCount,
      tone: 'text-emerald-400',
      icon: CheckCircle2,
    },
    {
      label: 'Converted',
      value: convertedCount,
      tone: 'text-blue-400',
      icon: ArrowUpRight,
    },
    {
      label: 'Avg confidence',
      value: `${averageConfidence}%`,
      tone: 'text-violet-400',
      icon: BrainCircuit,
    },
  ];

  const selectedId = searchParams.get('insight');
  const selectedInsight =
    insightList.find((insight) => insight.id === selectedId) ?? null;

  const openInsight = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('insight', id);
    setSearchParams(next, { replace: true });
  };

  const handleInsightOpenChange = (open: boolean) => {
    if (open) return;
    const next = new URLSearchParams(searchParams);
    next.delete('insight');
    setSearchParams(next, { replace: true });
  };

  if (meetings.isLoading || insights.isLoading) return <PageSkeleton />;

  if (meetings.error || insights.error) {
    const error = meetings.error ?? insights.error;
    return (
      <ErrorState
        description={
          error instanceof Error
            ? error.message
            : 'Intelligence could not be loaded.'
        }
        onRetry={() => {
          void meetings.refetch();
          void insights.refetch();
        }}
      />
    );
  }

  const hasFilters =
    kindFilter !== 'all' || statusFilter !== 'all' || query.trim().length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Intelligence"
        description="The signal your meetings leave behind — summaries, decisions, risks and the actions that follow."
        badge={<DataSourceBadge />}
        actions={
          briefMeeting ? (
            <Button asChild size="sm">
              <Link to={`/meetings/${briefMeeting.id}`}>
                <FileText className="h-3.5 w-3.5" />
                Open latest brief
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-display text-2xl font-semibold leading-none tabular">
                    {kpi.value}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
                    {kpi.label}
                  </p>
                </div>
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/60 bg-secondary/30',
                    kpi.tone
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="icon-tile h-7 w-7 border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-medium text-foreground">
                  Latest brief
                </span>
                <Badge variant={briefAnalysis ? 'success' : 'info'}>
                  {briefAnalysis ? 'Analysis ready' : 'Sample brief'}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Updated {formatRelativeTime(briefUpdatedAt)}
              </span>
            </div>

            <div className="p-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {briefTitle}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
                {briefSummary}
              </p>

              <div className="mt-4 space-y-2">
                {briefItems.map((item) => (
                  <div
                    key={item.text}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-secondary/25 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <p className="text-xs leading-relaxed text-foreground">
                        {item.text}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-3.5 sm:pl-0">
                      <Badge variant="outline">{item.owner}</Badge>
                      <Badge
                        variant={item.tag === 'Blocker' ? 'danger' : 'neutral'}
                      >
                        {item.tag}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Extraction is a draft until an owner confirms it. Nothing is
                  written to the project automatically.
                </p>
                {briefMeeting ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                  >
                    <Link to={`/meetings/${briefMeeting.id}`}>
                      Review source
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Extraction quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Average confidence
                </span>
                <span className="font-display text-2xl font-semibold leading-none tabular">
                  {averageConfidence}%
                </span>
              </div>
              <Progress value={averageConfidence} className="mt-2" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Insights', value: insightList.length },
                {
                  label: 'Actions',
                  value: insightList.filter(
                    (insight) => insight.kind === 'action'
                  ).length,
                },
                {
                  label: 'Decisions',
                  value: insightList.filter(
                    (insight) => insight.kind === 'decision'
                  ).length,
                },
                {
                  label: 'Transcripts',
                  value: list.filter((meeting) => meeting.transcriptReady)
                    .length,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border/60 bg-secondary/25 px-3 py-2.5"
                >
                  <p className="font-display text-lg font-semibold leading-none tabular">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Source transcripts stay in your workspace. Extraction never
                crosses organization boundaries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Insight queue"
          description="Review the signal, accept what matters and turn the rest into owned work."
          action={
            <Badge variant="outline" className="bg-secondary/30">
              {filtered.length} of {insightList.length} signals
            </Badge>
          }
        />

        <Card>
          <CardContent className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, owner, meeting or project"
                aria-label="Search insights"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:w-80">
              <NativeSelect
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(event.target.value as 'all' | InsightKind)
                }
                aria-label="Filter by kind"
                className="h-8 text-xs"
              >
                {kindFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | InsightStatus)
                }
                aria-label="Filter by status"
                className="h-8 text-xs"
              >
                {statusFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-[11px]"
                onClick={() => {
                  setKindFilter('all');
                  setStatusFilter('all');
                  setQuery('');
                }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-5">
              <EmptyState
                icon={Sparkles}
                title={
                  insightList.length === 0
                    ? 'No insights yet'
                    : 'No insights match these filters'
                }
                description={
                  insightList.length === 0
                    ? 'Analyze a meeting and its summary, decisions, actions and risks will land here for review.'
                    : 'Clear the search or pick another kind or status to see the rest of the queue.'
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onOpen={() => openInsight(insight.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
            <CardTitle>Analyzed meetings</CardTitle>
            <Badge variant="outline" className="bg-secondary/30">
              {analyzed.length} ready
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {analyzed.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={BrainCircuit}
                  title="No analyzed meetings yet"
                  description="Once a meeting finishes processing, its brief and extracted signal will appear here."
                />
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {analyzed.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-xs font-medium text-foreground">
                          {meeting.title}
                        </p>
                        <MeetingStatusBadge status={meeting.status} />
                        {meeting.transcriptReady ? (
                          <Badge variant="success">Transcript</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                        {meeting.summary ??
                          'Processing — the brief will appear when extraction finishes.'}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 text-[11px]"
                    >
                      <Link to={`/meetings/${meeting.id}`}>
                        <FileText className="h-3 w-3" />
                        {meeting.analysis ? 'Open workspace' : 'Run analysis'}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>How intelligence works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipeline.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="icon-tile h-8 w-8 border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    {index < pipeline.length - 1 ? (
                      <span className="mt-1 h-5 w-px bg-border" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
            {!isSupabaseConfigured ? (
              <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
                This workspace is running in demo mode. The extraction layer
                uses prepared sample output until a provider is connected.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <InsightDetailDialog
        insight={selectedInsight}
        onOpenChange={handleInsightOpenChange}
      />
    </div>
  );
}
