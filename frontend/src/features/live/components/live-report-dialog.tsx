import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Loader2,
  ListChecks,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/live/room';
import { formatDate } from '@/i18n/format';
import { useI18n } from '@/i18n';
import type {
  CommitMeetingResult,
  LiveMeetingInput,
  Meeting,
} from '@/types';

interface LiveReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: LiveMeetingInput | null;
  meeting: Meeting | null;
  saving: boolean;
  saveError: string | null;
  onRetry: () => void;
  onCommit: () => void;
  committing: boolean;
  committed: CommitMeetingResult | null;
  onOpenMeeting: () => void;
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-secondary/20 p-3.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {typeof count === 'number' ? (
          <span className="ml-auto text-[10px] tabular text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-xs leading-relaxed text-foreground/85">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LiveReportDialog({
  open,
  onOpenChange,
  report,
  meeting,
  saving,
  saveError,
  onRetry,
  onCommit,
  committing,
  committed,
  onOpenMeeting,
}: LiveReportDialogProps) {
  const { t } = useI18n();
  const insights = meeting?.analysis ?? report?.insights ?? null;
  const segments = report?.segments ?? [];
  const actions = insights?.actions ?? [];
  const decisions = insights?.decisions ?? [];
  const risks = insights?.risks ?? [];
  const unassigned = actions.filter(
    (action) => !action.owner || action.owner === 'Unassigned'
  );
  const unresolved = [
    ...risks,
    ...unassigned.map((action) =>
      t('{{text}} — no owner yet', { text: action.text })
    ),
  ];
  const hasFollowUps = actions.length > 0 || decisions.length > 0;
  const committedCount = committed
    ? committed.tasks.length + committed.decisions.length
    : 0;

  const dueLabel = (value?: string | null) => {
    if (!value) return t('No date');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('No date');
    return formatDate(date, { month: 'short', day: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <Sparkles className="h-3 w-3" />
              {t('Nova Live report')}
            </Badge>
            {report ? (
              <Badge variant="outline">{formatDuration(report.durationSeconds)}</Badge>
            ) : null}
          </div>
          <DialogTitle className="mt-1 pr-8">
            {meeting?.title ?? report?.title ?? t('Meeting report')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Transcript, decisions and follow-ups captured by Nova. Review the owners and deadlines before creating work.'
            )}
          </DialogDescription>
        </DialogHeader>

        {saving ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {t('Nova is writing the brief…')}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {t(
                'Saving the meeting, transcript, chat and a Knowledge note. This takes a moment in demo mode too.'
              )}
            </p>
          </div>
        ) : saveError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <p className="text-sm font-medium">
              {t('The report could not be saved')}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">{saveError}</p>
            <Button size="sm" variant="secondary" onClick={onRetry}>
              {t('Try again')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 px-5 py-4">
            {report && report.participants.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {report.participants.map((participant) => participant.fullName).join(', ')}
                <span className="text-muted-foreground/50">·</span>
                {t('{{count}} transcript segments', {
                  count: segments.length,
                })}
                <span className="text-muted-foreground/50">·</span>
                {t('{{count}} chat messages', { count: report.chat.length })}
              </div>
            ) : null}

            <Section icon={Sparkles} title={t('Summary')}>
              <p>{insights?.summary ?? t('No summary was generated.')}</p>
            </Section>

            <div className="grid gap-3 sm:grid-cols-2">
              <Section
                icon={ListChecks}
                title={t('Key points')}
                count={insights?.keyPoints.length}
              >
                <Bullets
                  items={insights?.keyPoints ?? []}
                  empty={t('No key points were captured.')}
                />
              </Section>

              <Section
                icon={GitBranch}
                title={t('Decisions')}
                count={decisions.length}
              >
                {decisions.length === 0 ? (
                  <p className="text-muted-foreground">
                    {t('No decisions were recorded.')}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {decisions.map((decision) => (
                      <li key={decision.id}>
                        <p className="font-medium text-foreground">{decision.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {t('Owner: {{owner}}', {
                            owner: decision.owner || t('Unassigned'),
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <Section
              icon={CheckCircle2}
              title={t('Action items, owners and deadlines')}
              count={actions.length}
            >
              {actions.length === 0 ? (
                <p className="text-muted-foreground">
                  {t('No action items were detected.')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {actions.map((action) => (
                    <li
                      key={action.id}
                      className="flex flex-col gap-1 rounded-md border border-border/60 bg-background/40 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-foreground/90">{action.text}</span>
                      <span className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded border border-border/60 bg-secondary/50 px-1.5 py-0.5">
                          {action.owner || t('Unassigned')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dueLabel(action.dueDate)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="grid gap-3 sm:grid-cols-2">
              <Section
                icon={AlertTriangle}
                title={t('Risks')}
                count={risks.length}
              >
                <Bullets items={risks} empty={t('No risks were flagged.')} />
              </Section>

              <Section
                icon={AlertTriangle}
                title={t('Unresolved topics')}
                count={unresolved.length}
              >
                <Bullets
                  items={unresolved}
                  empty={t('Nothing is left open in this transcript.')}
                />
              </Section>
            </div>

            <Section
              icon={ArrowRight}
              title={t('Follow-ups')}
              count={actions.length + decisions.length}
            >
              {hasFollowUps ? (
                <p>
                  {t('{{tasks}} and {{decisions}} are ready to become workspace records. Nova also writes a Knowledge note with the transcript.', {
                    tasks: t(
                      actions.length === 1
                        ? '{{count}} task'
                        : '{{count}} tasks',
                      { count: actions.length }
                    ),
                    decisions: t(
                      decisions.length === 1
                        ? '{{count}} decision'
                        : '{{count}} decisions',
                      { count: decisions.length }
                    ),
                  })}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {t(
                    'No follow-ups were detected. You can still keep the meeting and its transcript in the workspace.'
                  )}
                </p>
              )}
            </Section>

            {committed ? (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs">
                <div className="flex items-center gap-2 font-medium text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('Follow-ups created')}
                </div>
                <p className="mt-1 text-muted-foreground">
                  {t(
                    '{{tasks}}, {{decisions}}{{knowledge}} are linked to this meeting.',
                    {
                      tasks: t(
                        committed.tasks.length === 1
                          ? '{{count}} task'
                          : '{{count}} tasks',
                        { count: committed.tasks.length }
                      ),
                      decisions: t(
                        committed.decisions.length === 1
                          ? '{{count}} decision'
                          : '{{count}} decisions',
                        { count: committed.decisions.length }
                      ),
                      knowledge: committed.knowledge
                        ? t(' and a Knowledge note')
                        : '',
                    }
                  )}
                </p>
              </div>
            ) : null}

            {segments.length > 0 ? (
              <details className="rounded-lg border border-border/70 bg-secondary/20 p-3.5">
                <summary className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  {t('Full transcript')}
                  <span className="ml-auto text-[10px] normal-case tracking-normal">
                    {t('{{count}} segments', { count: segments.length })}
                  </span>
                </summary>
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {segments.map((segment) => (
                    <div key={segment.id} className="flex gap-2 text-xs">
                      <span className="w-10 shrink-0 tabular text-[10px] text-muted-foreground">
                        {formatDuration(segment.at)}
                      </span>
                      <span className="w-24 shrink-0 truncate text-[11px] font-medium text-foreground/80">
                        {segment.speaker}
                      </span>
                      <span className="min-w-0 flex-1 text-foreground/75">
                        {segment.text}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        )}

        {!saving && !saveError ? (
          <DialogFooter className="border-t border-border/70 px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {t('Close')}
            </Button>
            {hasFollowUps && !committed ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={onCommit}
                disabled={!meeting || committing}
              >
                {committing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
                {t('Create tasks, decisions & knowledge')}
              </Button>
            ) : null}
            <Button size="sm" onClick={onOpenMeeting} disabled={!meeting}>
              {t('Open meeting workspace')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        ) : null}

        {committedCount > 0 ? (
          <span className="sr-only">
            {t('{{count}} workspace records created.', {
              count: committedCount,
            })}
          </span>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
