import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Loader2,
  Lock,
  ListChecks,
  Sparkles,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/select-native';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/features/auth/use-auth';
import {
  useConvertInsightToDecision,
  useConvertInsightToTask,
  useProjects,
  useSetInsightStatus,
  useTeam,
} from '@/hooks/use-workspace';
import {
  canModifyInsight,
  insightActions,
  insightConversionLink,
  insightStatusMeta,
} from '@/lib/insights';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { Insight, TaskPriority } from '@/types';
import { insightKindMeta } from '../insight-meta';

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface InsightDetailDialogProps {
  insight: Insight | null;
  onOpenChange: (open: boolean) => void;
}

export function InsightDetailDialog({
  insight,
  onOpenChange,
}: InsightDetailDialogProps) {
  const { t } = useI18n();
  const { orgRole } = useAuth();
  const setStatus = useSetInsightStatus();
  const convertTask = useConvertInsightToTask();
  const convertDecision = useConvertInsightToDecision();
  const projects = useProjects({ enabled: Boolean(insight) });
  const team = useTeam({ enabled: Boolean(insight) });

  const [note, setNote] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('medium');

  const insightId = insight?.id;

  useEffect(() => {
    setNote('');
    setProjectId(insight?.projectId ?? '');
    setPriority('medium');
    setDueDate(insight?.dueDate ? insight.dueDate.slice(0, 10) : '');
    setAssigneeId(insight?.owner.id ?? '');
    setImpact('medium');
    // Reset the form only when a different insight is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightId]);

  if (!insight) return null;

  const meta = insightKindMeta[insight.kind];
  const Icon = meta.icon;
  const status = insightStatusMeta[insight.status];
  const editable = canModifyInsight(orgRole);
  const actions = insightActions(insight.status);
  const conversion = insightConversionLink(insight);
  const confidence = Math.round(insight.confidence * 100);
  const activeMembers = (team.data ?? []).filter(
    (member) => member.status === 'active'
  );
  const busy =
    setStatus.isPending || convertTask.isPending || convertDecision.isPending;

  const applyStatus = (target: 'open' | 'accepted' | 'dismissed') => {
    setStatus.mutate(
      { insightId: insight.id, input: { status: target, note } },
      {
        onSuccess: () => {
          setNote('');
          toast.success(t(insightStatusMeta[target].label), {
            description: t('“{{title}}” is now {{status}}.', {
              title: insight.title,
              status: t(target),
            }),
          });
        },
        onError: (error) => {
          toast.error(t('Insight could not be updated'), {
            description:
              error instanceof Error ? error.message : t('Try again in a moment.'),
          });
        },
      }
    );
  };

  const createTask = () => {
    convertTask.mutate(
      {
        insightId: insight.id,
        input: {
          projectId: projectId || null,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          assigneeId: assigneeId || null,
        },
      },
      {
        onSuccess: (updated) => {
          const link = insightConversionLink(updated);
          toast.success(t('Insight converted to task'), {
            description: link
              ? t('The new task is ready in the task board.')
              : t('The task was created.'),
          });
        },
        onError: (error) => {
          toast.error(t('Task could not be created'), {
            description:
              error instanceof Error ? error.message : t('Try again in a moment.'),
          });
        },
      }
    );
  };

  const createDecision = () => {
    convertDecision.mutate(
      { insightId: insight.id, input: { impact } },
      {
        onSuccess: () => {
          toast.success(t('Insight converted to decision'), {
            description: t(
              'It is now a proposed decision waiting for review.'
            ),
          });
        },
        onError: (error) => {
          toast.error(t('Decision could not be created'), {
            description:
              error instanceof Error ? error.message : t('Try again in a moment.'),
          });
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <header className="border-b border-border/70 px-5 py-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.badge}>
              <Icon className="h-3 w-3" />
              {t(meta.label)}
            </Badge>
            <Badge variant={status.tone}>{t(status.label)}</Badge>
            {insight.projectName ? (
              <Badge variant="outline">{insight.projectName}</Badge>
            ) : null}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {formatRelativeTime(insight.createdAt)}
            </span>
          </div>

          <DialogTitle className="mt-3 font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-foreground">
            {insight.title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {insight.summary}
          </DialogDescription>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('Owner')}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-foreground/85">
                <UserAvatar user={insight.owner} size="xs" />
                <span className="truncate">{insight.owner.fullName}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('Source')}
              </dt>
              <dd className="mt-1 truncate text-foreground/85">
                {insight.meetingId ? (
                  <Link
                    to={`/meetings/${insight.meetingId}`}
                    className="inline-flex items-center gap-1 truncate hover:text-primary"
                    onClick={() => onOpenChange(false)}
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{insight.meetingTitle}</span>
                  </Link>
                ) : (
                  <span className="truncate">{insight.meetingTitle}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('Due')}
              </dt>
              <dd className="mt-1 text-foreground/85">
                {insight.dueDate
                  ? formatDate(insight.dueDate, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : t('No date')}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('Confidence')}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-foreground/85">
                <Sparkles className="h-3 w-3 text-violet-400" />
                {confidence}%
              </dd>
            </div>
          </dl>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 px-5 py-4">
            {insight.sourceExcerpt ? (
              <section aria-label={t('Source excerpt')}>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Target className="h-3 w-3" />
                  {t('Source excerpt')}
                </div>
                <blockquote className="mt-2 rounded-lg border-l-2 border-violet-500/50 bg-secondary/25 px-3 py-2 text-xs leading-relaxed text-foreground/80">
                  {insight.sourceExcerpt}
                </blockquote>
              </section>
            ) : null}

            {insight.items.length > 0 ? (
              <section aria-label={t('Insight details')}>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  {t('What the signal says')}
                </div>
                <ul className="mt-2 space-y-1.5">
                  {insight.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <CheckCircle2
                        className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', meta.tone)}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {insight.status === 'converted' ? (
              <section
                aria-label={t('Conversion target')}
                className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-3"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('Converted')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                  {t(
                    'This insight already produced follow-up work. Open the record to keep working on it.'
                  )}
                </p>
                {conversion ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-[11px]"
                  >
                    <Link
                      to={conversion.href}
                      onClick={() => onOpenChange(false)}
                    >
                      {t(conversion.label)}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </Button>
                ) : null}
              </section>
            ) : !editable ? (
              <section
                aria-label={t('Read-only access')}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5"
              >
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t(
                    'Viewers can read the intelligence queue but cannot accept, dismiss or convert an insight. Ask an owner, admin or member to make the call.'
                  )}
                </p>
              </section>
            ) : (
              <>
                <section aria-label={t('Convert to task')}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <ListChecks className="h-3 w-3" />
                    {t('Turn into a task')}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="insight-task-project"
                        className="text-[10px] text-muted-foreground"
                      >
                        {t('Project')}
                      </Label>
                      <NativeSelect
                        id="insight-task-project"
                        className="mt-1 h-8 text-xs"
                        value={projectId}
                        onChange={(event) => setProjectId(event.target.value)}
                      >
                        <option value="">{t('No project')}</option>
                        {(projects.data ?? []).map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <Label
                        htmlFor="insight-task-assignee"
                        className="text-[10px] text-muted-foreground"
                      >
                        {t('Assignee')}
                      </Label>
                      <NativeSelect
                        id="insight-task-assignee"
                        className="mt-1 h-8 text-xs"
                        value={assigneeId}
                        onChange={(event) => setAssigneeId(event.target.value)}
                      >
                        <option value="">{t('Unassigned')}</option>
                        {activeMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <Label
                        htmlFor="insight-task-priority"
                        className="text-[10px] text-muted-foreground"
                      >
                        {t('Priority')}
                      </Label>
                      <NativeSelect
                        id="insight-task-priority"
                        className="mt-1 h-8 text-xs"
                        value={priority}
                        onChange={(event) =>
                          setPriority(event.target.value as TaskPriority)
                        }
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.label)}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div>
                      <Label
                        htmlFor="insight-task-due"
                        className="text-[10px] text-muted-foreground"
                      >
                        {t('Due date')}
                      </Label>
                      <Input
                        id="insight-task-due"
                        type="date"
                        className="mt-1 h-8 text-xs"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    disabled={busy}
                    onClick={createTask}
                  >
                    {convertTask.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ListChecks className="h-3.5 w-3.5" />
                    )}
                    {t('Create task')}
                  </Button>
                </section>

                <section aria-label={t('Convert to decision')}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    {t('Turn into a decision')}
                  </div>
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <div className="w-40">
                      <Label
                        htmlFor="insight-decision-impact"
                        className="text-[10px] text-muted-foreground"
                      >
                        {t('Impact')}
                      </Label>
                      <NativeSelect
                        id="insight-decision-impact"
                        className="mt-1 h-8 text-xs"
                        value={impact}
                        onChange={(event) =>
                          setImpact(
                            event.target.value as 'low' | 'medium' | 'high'
                          )
                        }
                      >
                        <option value="low">{t('Low')}</option>
                        <option value="medium">{t('Medium')}</option>
                        <option value="high">{t('High')}</option>
                      </NativeSelect>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={busy}
                      onClick={createDecision}
                    >
                      {convertDecision.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <GitBranch className="h-3.5 w-3.5" />
                      )}
                      {t('Propose decision')}
                    </Button>
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        {editable && insight.status !== 'converted' ? (
          <footer className="border-t border-border/70 bg-secondary/20 px-5 py-4">
            <Label
              htmlFor="insight-status-note"
              className="text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {t('Reason for the change')}
            </Label>
            <textarea
              id="insight-status-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t(
                'Optional, but useful when someone reviews this signal later.'
              )}
              rows={2}
              maxLength={280}
              className="mt-1.5 w-full resize-none rounded-md border border-border bg-transparent px-2.5 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />

            <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  variant={action.key === 'accept' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 text-xs',
                    action.key === 'dismiss' &&
                      'border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                  )}
                  disabled={busy}
                  onClick={() => applyStatus(action.target)}
                  title={t(action.description)}
                >
                  {setStatus.isPending &&
                  setStatus.variables?.input.status === action.target ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {t(action.label)}
                </Button>
              ))}
            </div>
          </footer>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
