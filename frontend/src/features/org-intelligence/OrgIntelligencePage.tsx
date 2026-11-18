import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  GitBranch,
  Network,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { DataSourceBadge } from '@/components/common/data-source-badge';
import { ErrorState } from '@/components/common/error-state';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { SectionHeader } from '@/components/common/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOrgIntelligence } from '@/hooks/use-workspace';
import { orgHealthTone } from '@/lib/org-intelligence';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { OrgSignalKind, OrgSignalTone } from '@/types';

const signalIcons: Record<OrgSignalKind, LucideIcon> = {
  risk: ShieldAlert,
  decision: GitBranch,
  load: Users,
  knowledge: BookOpen,
  collaboration: Network,
};

const toneVariant: Record<
  OrgSignalTone,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  positive: 'success',
  warning: 'warning',
  critical: 'danger',
  neutral: 'neutral',
};

export function OrgIntelligencePage() {
  const { t } = useI18n();
  const reportQuery = useOrgIntelligence();
  const report = reportQuery.data;

  if (reportQuery.isLoading) return <PageSkeleton />;
  if (reportQuery.isError || !report) {
    return (
      <ErrorState
        title={t('The organizational report could not be loaded.')}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  const healthTone = orgHealthTone(report.healthScore);
  const healthBadge =
    healthTone === 'success'
      ? 'success'
      : healthTone === 'warning'
        ? 'warning'
        : 'danger';

  const metrics = [
    {
      label: t('Decision latency'),
      value: t('{{count}} days', { count: report.decisionLatencyDays }),
      detail: t('Proposal to acceptance'),
    },
    {
      label: t('Follow-up completion'),
      value: `${report.followUpRate}%`,
      detail: t('Meeting tasks that closed'),
    },
    {
      label: t('Meeting load'),
      value: t('{{count}} hours', { count: report.meetingLoadHours }),
      detail: t('Last 30 days'),
    },
    {
      label: t('Analysed meetings'),
      value: String(report.analyzedMeetings),
      detail: t('Source of the signal'),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Organizational intelligence')}
        description={t(
          'See the patterns behind the meetings: repeated themes, decision speed and where follow-up work stalls.'
        )}
        badge={<DataSourceBadge />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reportQuery.refetch()}
              disabled={reportQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5',
                  reportQuery.isFetching && 'animate-spin'
                )}
              />
              {t('Refresh report')}
            </Button>
            <Button asChild size="sm">
              <Link to="/intelligence">
                <BrainCircuit className="h-3.5 w-3.5" />
                {t('Open AI intelligence')}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              {t('Workspace health')}
            </CardTitle>
            <Badge variant={healthBadge}>
              {t('{{count}} / 100', { count: report.healthScore })}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('Composite score')}
                </span>
                <span className="font-display text-2xl font-semibold leading-none tabular">
                  {report.healthScore}
                </span>
              </div>
              <Progress
                value={report.healthScore}
                aria-label={t('Workspace health')}
                className="mt-2"
              />
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-border/60 bg-secondary/25 px-2.5 py-2"
                >
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold leading-none tabular">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {t(
                'The score weights open risks, proposed decisions, unanalysed meetings and follow-up completion.'
              )}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SectionHeader
            title={t('Signals across the workspace')}
            description={t(
              'Each signal is derived from the same records the rest of Nova reads.'
            )}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {report.signals.map((signal) => {
              const Icon = signalIcons[signal.kind];
              return (
                <Card key={signal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <span className="icon-tile h-8 w-8 shrink-0 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground">
                            {t(signal.title)}
                          </p>
                          <Badge
                            variant={toneVariant[signal.tone]}
                            className="ml-auto"
                          >
                            {signal.metric}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {t(signal.detail)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              {t('Recurring themes')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.themes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                {t('Analyse a meeting to surface recurring themes.')}
              </p>
            ) : (
              report.themes.map((theme) => {
                const rising = theme.trend >= 0;
                return (
                  <div
                    key={theme.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-foreground">
                        {theme.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('{{count}} mentions in {{meetings}} meetings', {
                          count: theme.mentions,
                          meetings: theme.meetingCount,
                        })}
                      </p>
                    </div>
                    <Badge variant={rising ? 'success' : 'neutral'}>
                      {rising ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {t('{{count}}%', { count: Math.abs(theme.trend) })}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              {t('Risks that keep returning')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.topRisks.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-4 text-[11px] text-emerald-200/90">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {t('No open risk signals across the workspace.')}
              </div>
            ) : (
              report.topRisks.map((risk) => (
                <div
                  key={risk}
                  className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/90"
                >
                  <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  {risk}
                </div>
              ))
            )}

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/intelligence">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {t('Review the insight queue')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 text-cyan-400" />
            {t('How this report is built')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              title: t('Read the record'),
              detail: t('Meetings, analyses, decisions, tasks and insights.'),
            },
            {
              title: t('Find the pattern'),
              detail: t(
                'Repeated topics, decision latency, follow-up closure and load.'
              ),
            },
            {
              title: t('Keep it explainable'),
              detail: t(
                'Every number comes from a deterministic rule, never a hidden score.'
              ),
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5"
            >
              <p className="text-[11px] font-medium text-foreground">
                {step.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
