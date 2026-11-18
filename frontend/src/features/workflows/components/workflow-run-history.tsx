import {
  CheckCircle2,
  CircleSlash,
  History,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkflowRuns } from '@/hooks/use-workspace';
import { cn, formatDuration, formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { WorkflowRunStatus } from '@/types';

const runStatus = {
  success: {
    label: 'Succeeded',
    icon: CheckCircle2,
    tone: 'text-emerald-400',
    badge: 'success',
    step: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300/90',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    tone: 'text-rose-400',
    badge: 'danger',
    step: 'border-rose-500/20 bg-rose-500/5 text-rose-300/90',
  },
  skipped: {
    label: 'Skipped',
    icon: CircleSlash,
    tone: 'text-slate-400',
    badge: 'neutral',
    step: 'border-border/70 bg-secondary/30 text-muted-foreground',
  },
} as const satisfies Record<
  WorkflowRunStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    tone: string;
    badge: 'success' | 'danger' | 'neutral';
    step: string;
  }
>;

export function WorkflowRunHistory({ workflowId }: { workflowId: string }) {
  const { t } = useI18n();
  const runs = useWorkflowRuns(workflowId);
  const list = runs.data ?? [];
  const succeeded = list.filter((run) => run.status === 'success').length;

  if (runs.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (runs.error) {
    return (
      <p className="text-[11px] text-rose-400">
        {t('Run history could not be loaded.')}
      </p>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 text-[11px] text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        {t('No runs recorded yet. The next trigger will appear here.')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <History className="h-3 w-3" />
          {t('Last {{count}} runs', { count: list.length })}
        </span>
        <Badge variant={succeeded === list.length ? 'success' : 'warning'}>
          {t('{{succeeded}}/{{total}} succeeded', {
            succeeded,
            total: list.length,
          })}
        </Badge>
      </div>

      {list.map((run) => {
        const config = runStatus[run.status];
        const Icon = config.icon;

        return (
          <div
            key={run.id}
            className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <span
                  className={cn(
                    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/60 bg-secondary/30',
                    config.tone
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-medium text-foreground">
                      {t(run.trigger)}
                    </p>
                    <Badge variant={config.badge}>{t(config.label)}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {t(run.summary)}
                  </p>
                  {run.steps.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {run.steps.map((step) => (
                        <span
                          key={step.label}
                          className={cn(
                            'rounded border px-1.5 py-0.5 text-[10px]',
                            runStatus[step.status].step
                          )}
                        >
                          {t(step.label)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 text-right text-[10px] text-muted-foreground">
                <p className="tabular">{formatRelativeTime(run.startedAt)}</p>
                <p className="mt-0.5 tabular">{formatDuration(run.durationMs)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
