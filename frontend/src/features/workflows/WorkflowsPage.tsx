import { useState } from 'react';
import {
  ArrowRight,
  Activity,
  ChevronDown,
  History,
  Plus,
  Workflow as WorkflowIcon,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  useToggleWorkflow,
  useWorkflows,
} from '@/hooks/use-workspace';
import { accentConfig } from '@/lib/status';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { CreateWorkflowDialog } from './components/create-workflow-dialog';
import { WorkflowRunHistory } from './components/workflow-run-history';
import type { Workflow } from '@/types';

function WorkflowRow({ workflow }: { workflow: Workflow }) {
  const { t } = useI18n();
  const toggle = useToggleWorkflow();
  const accent = accentConfig[workflow.accent];
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (active: boolean) => {
    toggle.mutate(
      { id: workflow.id, active },
      {
        onSuccess: () => {
          toast.success(
            active
              ? t('“{{name}}” is active', { name: workflow.name })
              : t('“{{name}}” paused', { name: workflow.name })
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t('Could not update workflow')
          );
        },
      }
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-secondary/15 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              'icon-tile h-9 w-9 border',
              accent.bg,
              accent.border,
              accent.text
            )}
          >
            <WorkflowIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {workflow.name}
              </p>
              <Badge variant={workflow.isActive ? 'success' : 'neutral'}>
                {workflow.isActive ? t('Active') : t('Paused')}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {workflow.description || t('No description yet.')}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/30 px-2 py-1 text-muted-foreground">
                <Zap className="h-3 w-3 text-amber-400" />
                {t(workflow.triggerLabel)}
              </span>
              {workflow.actionLabels.map((action) => (
                <span key={action} className="inline-flex items-center gap-1">
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="rounded-md border border-border/70 bg-secondary/30 px-2 py-1 text-muted-foreground">
                    {t(action)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 pl-12 lg:pl-0">
          <div className="text-right">
            <p className="text-xs font-medium tabular text-foreground">
              {t('{{count}} runs', { count: workflow.runCount })}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {workflow.lastRunAt
                ? t('Last run {{time}}', {
                    time: formatRelativeTime(workflow.lastRunAt),
                  })
                : t('Not run yet')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-[11px]"
              aria-expanded={expanded}
              aria-controls={`workflow-runs-${workflow.id}`}
              aria-label={t('{{action}} run history for {{name}}', {
                action: expanded ? t('Hide') : t('Show'),
                name: workflow.name,
              })}
              onClick={() => setExpanded((value) => !value)}
            >
              <History className="h-3.5 w-3.5" />
              {t('History')}
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform',
                  expanded && 'rotate-180'
                )}
              />
            </Button>
            <Switch
              checked={workflow.isActive}
              disabled={toggle.isPending}
              onCheckedChange={handleToggle}
              aria-label={t('{{action}} {{name}}', {
                action: workflow.isActive ? t('Pause') : t('Activate'),
                name: workflow.name,
              })}
            />
          </div>
        </div>
      </div>

      {expanded ? (
        <div
          id={`workflow-runs-${workflow.id}`}
          className="border-t border-border/60 bg-secondary/10 px-4 py-3 lg:pl-16"
        >
          <WorkflowRunHistory workflowId={workflow.id} />
        </div>
      ) : null}
    </div>
  );
}

export function WorkflowsPage() {
  const { t } = useI18n();
  const workflows = useWorkflows();
  const [dialogOpen, setDialogOpen] = useState(false);

  const list = workflows.data ?? [];

  if (workflows.isLoading) return <PageSkeleton />;

  if (workflows.error) {
    return (
      <ErrorState
        description={
          workflows.error instanceof Error
            ? workflows.error.message
            : t('Workflows could not be loaded.')
        }
        onRetry={() => void workflows.refetch()}
      />
    );
  }

  const active = list.filter((workflow) => workflow.isActive).length;
  const runs = list.reduce((total, workflow) => total + workflow.runCount, 0);

  const summary = [
    {
      label: t('Total workflows'),
      value: list.length,
      icon: WorkflowIcon,
      tone: 'text-blue-400',
    },
    { label: t('Active'), value: active, icon: Zap, tone: 'text-emerald-400' },
    {
      label: t('Paused'),
      value: list.length - active,
      icon: WorkflowIcon,
      tone: 'text-slate-400',
    },
    { label: t('Total runs'), value: runs, icon: Activity, tone: 'text-violet-400' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Workflows')}
        description={t(
          'Automations that move a meeting signal into a summary, a decision or an owned action.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{count}} active', { count: active })}
          </Badge>
        }
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t('New workflow')}
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

      {list.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title={t('No workflows yet')}
          description={t(
            'Create an automation that turns meeting outcomes into consistent follow-through.'
          )}
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t('New workflow')}
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/70">
              {list.map((workflow) => (
                <WorkflowRow key={workflow.id} workflow={workflow} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateWorkflowDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
