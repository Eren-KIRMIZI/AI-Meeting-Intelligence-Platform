import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  Gauge,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { StatCard } from '@/components/common/stat-card';
import { ChartTooltip } from '@/components/common/chart-tooltip';
import { ProjectStatusBadge } from '@/components/common/status-badges';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  useDecisions,
  useMeetings,
  useProjects,
  useTasks,
  useTeam,
} from '@/hooks/use-workspace';
import { executionSeries } from '@/mocks/data';
import { cn, downloadCsv } from '@/lib/utils';
import type { DecisionStatus } from '@/types';
import {
  ANALYTICS_RANGES,
  RANGE_DAYS,
  buildAnalyticsKpis,
  buildExecutionSeries,
  buildProjectHealth,
  buildWorkload,
  decisionsInRange,
  formatRangeLabel,
  type AnalyticsRange,
} from './analytics-insights';

const decisionColors: Record<DecisionStatus, string> = {
  accepted: '#34D399',
  proposed: '#F59E0B',
  rejected: '#F87171',
  superseded: '#94A3B8',
};

const decisionLabels: Record<DecisionStatus, string> = {
  accepted: 'Accepted',
  proposed: 'Proposed',
  rejected: 'Rejected',
  superseded: 'Superseded',
};

type Range = AnalyticsRange;

export function AnalyticsPage() {
  const projects = useProjects();
  const tasks = useTasks();
  const team = useTeam();
  const decisions = useDecisions();
  const meetings = useMeetings();
  const [range, setRange] = useState<Range>('14d');

  const projectList = useMemo(() => projects.data ?? [], [projects.data]);
  const taskList = useMemo(() => tasks.data ?? [], [tasks.data]);
  const teamList = useMemo(() => team.data ?? [], [team.data]);
  const decisionList = useMemo(() => decisions.data ?? [], [decisions.data]);
  const meetingList = useMemo(() => meetings.data ?? [], [meetings.data]);

  const series = useMemo(
    () => buildExecutionSeries(executionSeries, range),
    [range]
  );

  const kpis = useMemo(
    () =>
      buildAnalyticsKpis(
        { meetings: meetingList, tasks: taskList, decisions: decisionList },
        range
      ),
    [decisionList, meetingList, range, taskList]
  );

  const scopedDecisions = useMemo(
    () => decisionsInRange(decisionList, range),
    [decisionList, range]
  );

  const workload = useMemo(
    () => buildWorkload(teamList, taskList, range),
    [range, taskList, teamList]
  );

  const projectHealth = useMemo(
    () => buildProjectHealth(projectList, taskList, range),
    [projectList, range, taskList]
  );

  const decisionMix = useMemo(
    () =>
      (Object.keys(decisionColors) as DecisionStatus[])
        .map((status) => ({
          status,
          name: decisionLabels[status],
          value: scopedDecisions.filter(
            (decision) => decision.status === status
          ).length,
          color: decisionColors[status],
        }))
        .filter((item) => item.value > 0),
    [scopedDecisions]
  );

  const isLoading =
    projects.isLoading ||
    tasks.isLoading ||
    team.isLoading ||
    decisions.isLoading ||
    meetings.isLoading;

  const error =
    projects.error ?? tasks.error ?? team.error ?? decisions.error ?? meetings.error;

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <ErrorState
        description={
          error instanceof Error ? error.message : 'Analytics did not load.'
        }
        onRetry={() => {
          void projects.refetch();
          void tasks.refetch();
          void team.refetch();
          void decisions.refetch();
          void meetings.refetch();
        }}
      />
    );
  }

  const totalDecisions = scopedDecisions.length;
  const accepted = scopedDecisions.filter(
    (decision) => decision.status === 'accepted'
  ).length;
  const averageUtilization = Math.round(
    workload.reduce((total, item) => total + item.utilization, 0) /
      Math.max(1, workload.length)
  );
  const completedTotal = series.reduce(
    (total, point) => total + point.completed,
    0
  );
  const createdTotal = series.reduce((total, point) => total + point.created, 0);
  const rangeLabel = formatRangeLabel(range);
  const rangeDays = RANGE_DAYS[range];

  const exportAnalytics = () => {
    downloadCsv(
      'nova-execution-analytics.csv',
      series.map((point) => ({
        Date: point.label,
        Completed: point.completed,
        Created: point.created,
        Net: point.completed - point.created,
      }))
    );
    toast.success('Execution analytics exported');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Execution velocity, meeting output and the capacity behind every commitment."
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            Last {rangeDays} days
          </Badge>
        }
        actions={
          <>
            <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/30 p-0.5">
              {ANALYTICS_RANGES.map((item) => (
                <Button
                  key={item.value}
                  variant={range === item.value ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  onClick={() => setRange(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportAnalytics}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
            <div>
              <CardTitle>Execution velocity</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Tasks completed against tasks created each day.
              </p>
            </div>
            <Badge variant={completedTotal >= createdTotal ? 'success' : 'warning'}>
              <TrendingUp className="h-3 w-3" />
              Net {completedTotal - createdTotal >= 0 ? '+' : ''}
              {completedTotal - createdTotal}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={series}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="completed-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.26} />
                      <stop offset="100%" stopColor="#5B8DEF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="created-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B7CF6" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#8B7CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke="#8B7CF6"
                    strokeWidth={1.5}
                    fill="url(#created-fill)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#5B8DEF"
                    strokeWidth={2}
                    fill="url(#completed-fill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Completed {completedTotal}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Created {createdTotal}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Decision mix</CardTitle>
            <p className="text-xs text-muted-foreground">
              {accepted} of {totalDecisions} decisions accepted.
            </p>
          </CardHeader>
          <CardContent>
            {decisionMix.length === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Decisions will appear once the log has entries.
                </p>
              </div>
            ) : (
              <>
                <div className="relative h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={decisionMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={82}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {decisionMix.map((entry) => (
                          <Cell key={entry.status} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-semibold leading-none tabular">
                      {totalDecisions}
                    </span>
                    <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Decisions
                    </span>
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {decisionMix.map((entry) => (
                    <div
                      key={entry.status}
                      className="flex items-center justify-between rounded-md border border-border/60 bg-secondary/25 px-2 py-1.5 text-[10px]"
                    >
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="tabular text-foreground">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div>
              <CardTitle>Team workload</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Open assignments created in the selected window, against an
                8-task planning capacity.
              </p>
            </div>
            <Badge variant={averageUtilization > 85 ? 'warning' : 'neutral'}>
              <Users className="h-3 w-3" />
              {averageUtilization}% avg
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload.map((item) => (
              <div key={item.member.id} className="flex items-center gap-3">
                <UserAvatar user={item.member} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-foreground">
                      {item.member.fullName}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 text-[10px] tabular',
                        item.utilization > 85
                          ? 'text-amber-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.assigned}/{item.capacity}
                    </span>
                  </div>
                  <Progress
                    value={item.utilization}
                    aria-label={`${item.member.fullName} workload`}
                    className="mt-1.5 h-1"
                    indicatorClassName={cn(
                      item.utilization > 85
                        ? 'bg-amber-400'
                        : item.utilization > 60
                          ? 'bg-blue-500'
                          : 'bg-emerald-400'
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div>
              <CardTitle>Project health</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Delivery progress for work due inside the selected window.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
              <Link to="/projects">
                All projects
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectHealth.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No project work is due in this window.
              </p>
            ) : (
              projectHealth.map((item) => (
                <div
                  key={item.project.id}
                  className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-foreground">
                      {item.project.name}
                    </p>
                    <ProjectStatusBadge status={item.project.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress
                      value={item.progress}
                      aria-label={`${item.project.name} progress`}
                      className="h-1"
                    />
                    <span className="w-9 shrink-0 text-right text-[10px] tabular text-muted-foreground">
                      {item.progress}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {item.completed} of {item.total} due tasks complete
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-3 w-3" />
          Metrics are derived from workspace records for {rangeLabel}.
        </span>
        <span className="tabular">
          {taskList.length} tasks · {projectList.length} projects ·{' '}
          {teamList.length} members
        </span>
      </div>
    </div>
  );
}
