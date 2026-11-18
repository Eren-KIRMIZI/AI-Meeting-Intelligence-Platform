import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CircleCheck,
  CircleCheckBig,
  Clock3,
  FolderKanban,
  Gauge,
  GitBranch,
  Minus,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { accentConfig } from '@/lib/status';
import { useI18n } from '@/i18n';
import type { DashboardStat } from '@/types';

const statIcons: Record<string, LucideIcon> = {
  'active-projects': FolderKanban,
  'completed-tasks': CircleCheck,
  'upcoming-tasks': Clock3,
  'overdue-tasks': TriangleAlert,
  'meeting-hours': CalendarClock,
  'action-completion': CircleCheckBig,
  'decision-velocity': GitBranch,
  'on-time-delivery': Gauge,
};

interface StatCardProps {
  stat: DashboardStat;
  className?: string;
}

const toneClasses = {
  positive: 'text-emerald-400',
  negative: 'text-rose-400',
  neutral: 'text-muted-foreground',
} as const;

export function StatCard({ stat, className }: StatCardProps) {
  const { t } = useI18n();
  const accent = accentConfig[stat.accent];
  const tone = stat.tone ?? 'neutral';
  const Icon = statIcons[stat.id] ?? Activity;
  const TrendIcon =
    stat.direction === 'up'
      ? ArrowUpRight
      : stat.direction === 'down'
        ? ArrowDownRight
        : Minus;

  const data = stat.trend.map((value, index) => ({ index, value }));
  const gradientId = `spark-${stat.id.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-colors hover:border-border/90',
        className
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'icon-tile h-8 w-8 border',
                accent.bg,
                accent.border,
                accent.text
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate text-xs font-medium text-muted-foreground">
              {t(stat.label)}
            </span>
          </div>
          <span className={cn('h-1.5 w-1.5 rounded-full', accent.solidBg)} />
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-[30px] font-semibold leading-none tracking-[-0.04em] tabular">
              {stat.value}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  toneClasses[tone]
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {t(stat.change, stat.changeVars)}
              </span>
              <span className="text-muted-foreground">{t(stat.period)}</span>
            </div>
          </div>

          <div className="h-10 w-20 shrink-0 sm:w-24" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                accessibilityLayer={false}
                margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent.chart} stopOpacity={0.24} />
                    <stop offset="100%" stopColor={accent.chart} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accent.chart}
                  strokeWidth={1.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
