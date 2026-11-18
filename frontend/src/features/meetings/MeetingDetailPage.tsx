import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  GitBranch,
  ListChecks,
  Loader2,
  MessageSquareText,
  ScanText,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { AvatarStack, UserAvatar } from '@/components/common/user-avatar';
import { MeetingStatusBadge } from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useCommitMeetingAnalysis,
  useMeeting,
  useTeam,
} from '@/hooks/use-workspace';
import { cn, formatDate, formatRelativeTime, formatTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { AnalyzeMeetingDialog } from './components/analyze-meeting-dialog';
import { MeetingRecordingCard } from './components/meeting-recording-card';
import type { Meeting, UserProfile } from '@/types';

const platformLabels: Record<Meeting['platform'], string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
  in_person: 'In person',
  nova_live: 'Nova Live',
};

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function confidenceVariant(value: number) {
  if (value >= 0.9) return 'success' as const;
  if (value >= 0.8) return 'warning' as const;
  return 'neutral' as const;
}

function ownerProfile(
  meeting: Meeting,
  name: string,
  id?: string | null,
  roster: UserProfile[] = []
) {
  const matches = (profile: UserProfile) =>
    profile.fullName.toLowerCase() === name.toLowerCase() ||
    profile.fullName.toLowerCase().split(/\s+/)[0] === name.toLowerCase();

  return (
    meeting.participants.find((participant) => participant.id === id) ??
    meeting.participants.find(matches) ??
    roster.find((member) => member.id === id) ??
    roster.find(matches) ??
    null
  );
}

function StepIcon({ status }: { status: 'pending' | 'running' | 'done' | 'failed' }) {
  if (status === 'done') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (status === 'running') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />;
  }
  if (status === 'failed') {
    return <TriangleAlert className="h-3.5 w-3.5 text-rose-400" />;
  }
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />;
}

export function MeetingDetailPage() {
  const { t, plural } = useI18n();
  const { meetingId } = useParams();
  const meetingQuery = useMeeting(meetingId);
  const teamQuery = useTeam();
  const commit = useCommitMeetingAnalysis();
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<string[]>([]);

  const meeting = meetingQuery.data;
  const analysis = meeting?.analysis;

  useEffect(() => {
    if (!analysis) {
      setSelectedActionIds([]);
      setSelectedDecisionIds([]);
      return;
    }

    setSelectedActionIds(
      analysis.actions.filter((action) => !action.taskId).map((action) => action.id)
    );
    setSelectedDecisionIds(
      analysis.decisions
        .filter((decision) => !decision.decisionId)
        .map((decision) => decision.id)
    );
  }, [analysis]);

  const pendingActions = useMemo(
    () => analysis?.actions.filter((action) => !action.taskId) ?? [],
    [analysis]
  );
  const pendingDecisions = useMemo(
    () => analysis?.decisions.filter((decision) => !decision.decisionId) ?? [],
    [analysis]
  );

  if (meetingQuery.isLoading) return <PageSkeleton />;

  if (meetingQuery.error || !meeting) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
          <Link to="/meetings">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Back to meetings')}
          </Link>
        </Button>
        <ErrorState
          title={t('Meeting not found')}
          description={t(
            'This meeting may have been removed, or the link is out of date.'
          )}
          onRetry={() => void meetingQuery.refetch()}
        />
      </div>
    );
  }

  const toggleAction = (id: string, checked: boolean) => {
    setSelectedActionIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  };

  const toggleDecision = (id: string, checked: boolean) => {
    setSelectedDecisionIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  };

  const commitSelected = () => {
    if (!analysis) return;

    const actionIds = selectedActionIds.filter((id) =>
      pendingActions.some((action) => action.id === id)
    );
    const decisionIds = selectedDecisionIds.filter((id) =>
      pendingDecisions.some((decision) => decision.id === id)
    );

    if (actionIds.length === 0 && decisionIds.length === 0) {
      toast.error(t('Select at least one action item or decision.'));
      return;
    }

    commit.mutate(
      { meetingId: meeting.id, actionIds, decisionIds },
      {
        onSuccess: (result) => {
          const tasks = plural(
            result.tasks.length,
            '{{count}} task',
            '{{count}} tasks'
          );
          const decisions = plural(
            result.decisions.length,
            '{{count}} decision',
            '{{count}} decisions'
          );

          if (result.tasks.length > 0 && result.decisions.length > 0) {
            toast.success(
              t('Created {{tasks}} and {{decisions}} from this meeting.', {
                tasks,
                decisions,
              })
            );
          } else if (result.tasks.length > 0 || result.decisions.length > 0) {
            toast.success(
              t('Created {{items}} from this meeting.', {
                items: result.tasks.length > 0 ? tasks : decisions,
              })
            );
          } else {
            toast.success(t('Follow-ups were already created.'));
          }
          setSelectedActionIds([]);
          setSelectedDecisionIds([]);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('Could not create the follow-ups.')
          );
        },
      }
    );
  };

  const confidence = analysis ? Math.round(analysis.confidence * 100) : 0;
  const selectedCount =
    selectedActionIds.filter((id) =>
      pendingActions.some((action) => action.id === id)
    ).length +
    selectedDecisionIds.filter((id) =>
      pendingDecisions.some((decision) => decision.id === id)
    ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
          <Link to="/meetings">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Meetings')}
          </Link>
        </Button>
        <span className="text-border">/</span>
        <span className="truncate text-foreground">{meeting.title}</span>
        {meeting.projectId ? (
          <>
            <span className="text-border">/</span>
            <Link
              to={`/projects/${meeting.projectId}`}
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {meeting.projectName}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
                  {meeting.title}
                </h1>
                <MeetingStatusBadge status={meeting.status} />
                {analysis ? (
                  <Badge variant="success">
                    <Sparkles className="h-3 w-3" />
                    {t('Analyzed')}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  {formatDate(meeting.startsAt, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {formatTime(meeting.startsAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {t('{{count}} min', { count: meeting.durationMinutes })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {t(platformLabels[meeting.platform])}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {t('{{count}} participants', {
                    count: meeting.participants.length,
                  })}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AvatarStack users={meeting.participants} max={5} size="sm" />
                <span className="text-[11px] text-muted-foreground">
                  {meeting.participants.map((participant) => participant.fullName).join(', ')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {meeting.projectId ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/projects/${meeting.projectId}`}>
                    <Target className="h-3.5 w-3.5" />
                    {t('Open project')}
                  </Link>
                </Button>
              ) : null}
              {!analysis ? (
                <Button size="sm" onClick={() => setAnalyzeOpen(true)}>
                  <BrainCircuit className="h-3.5 w-3.5" />
                  {t('Analyze transcript')}
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/tasks?project=${meeting.projectId ?? ''}`}>
                    <ListChecks className="h-3.5 w-3.5" />
                    {t('Project tasks')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {meeting.recordings && meeting.recordings.length > 0 ? (
        <MeetingRecordingCard recordings={meeting.recordings} />
      ) : null}

      {analysis ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  {t('Summary')}
                </CardTitle>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(analysis.analyzedAt)} · {analysis.model}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {analysis.summary}
                </p>

                {analysis.keyPoints.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t('Key points')}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {analysis.keyPoints.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {analysis.topics.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {analysis.topics.map((topic) => (
                      <Badge key={topic} variant="outline" className="bg-secondary/30">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5 text-blue-400" />
                  {t('Action items')}
                </CardTitle>
                <Badge variant="outline" className="bg-secondary/30">
                  {t('{{count}} extracted', { count: analysis.actions.length })}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.actions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    {t('No action items were detected in this transcript.')}
                  </p>
                ) : (
                  analysis.actions.map((action) => {
                    const owner = ownerProfile(
                      meeting,
                      action.owner,
                      action.ownerId,
                      teamQuery.data ?? []
                    );
                    const committed = Boolean(action.taskId);
                    return (
                      <label
                        key={action.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 transition-colors',
                          committed
                            ? 'cursor-default opacity-70'
                            : 'hover:border-border hover:bg-secondary/30'
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={
                            committed || selectedActionIds.includes(action.id)
                          }
                          disabled={committed || commit.isPending}
                          onCheckedChange={(checked) =>
                            toggleAction(action.id, checked === true)
                          }
                          aria-label={t('Select action: {{text}}', {
                            text: action.text,
                          })}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-xs leading-relaxed',
                              committed
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                            )}
                          >
                            {action.text}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <UserAvatar user={owner} size="xs" />
                              {action.owner}
                            </span>
                            <span>·</span>
                            <span>
                              {action.dueDate
                                ? t('Due {{date}}', {
                                    date: formatDate(action.dueDate, {
                                      month: 'short',
                                      day: 'numeric',
                                    }),
                                  })
                                : t('No due date')}
                            </span>
                            <Badge variant={confidenceVariant(action.confidence)}>
                              {Math.round(action.confidence * 100)}%
                            </Badge>
                            {committed ? (
                              <Badge variant="success">{t('Task created')}</Badge>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-violet-400" />
                  {t('Decisions')}
                </CardTitle>
                <Badge variant="outline" className="bg-secondary/30">
                  {t('{{count}} detected', { count: analysis.decisions.length })}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.decisions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    {t(
                      'No explicit decisions were detected. Add one from the transcript when the team confirms it.'
                    )}
                  </p>
                ) : (
                  analysis.decisions.map((decision) => {
                    const committed = Boolean(decision.decisionId);
                    return (
                      <label
                        key={decision.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5 transition-colors',
                          committed
                            ? 'cursor-default opacity-70'
                            : 'hover:border-border hover:bg-secondary/30'
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={
                            committed || selectedDecisionIds.includes(decision.id)
                          }
                          disabled={committed || commit.isPending}
                          onCheckedChange={(checked) =>
                            toggleDecision(decision.id, checked === true)
                          }
                          aria-label={t('Select decision: {{title}}', {
                            title: decision.title,
                          })}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-relaxed text-foreground">
                            {decision.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                            {decision.context}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{decision.owner}</span>
                            <Badge variant={confidenceVariant(decision.confidence)}>
                              {Math.round(decision.confidence * 100)}%
                            </Badge>
                            {committed ? (
                              <Badge variant="success">{t('In decision log')}</Badge>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {analysis.risks.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <TriangleAlert className="h-3.5 w-3.5 text-amber-400" />
                    {t('Risks to watch')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.risks.map((risk) => (
                    <div
                      key={risk}
                      className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/90"
                    >
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      {risk}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="h-3.5 w-3.5 text-cyan-400" />
                  {t('Transcript')}
                </CardTitle>
                <Badge variant="outline" className="bg-secondary/30">
                  {t('{{count}} lines', { count: analysis.transcript.length })}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <div className="divide-y divide-border/50 px-4">
                    {analysis.transcript.map((line, index) => (
                      <div
                        key={`${line.at}-${index}`}
                        className="flex gap-3 py-2.5"
                      >
                        <span className="w-10 shrink-0 pt-0.5 text-right font-mono text-[10px] text-muted-foreground">
                          {formatTimestamp(line.at)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-foreground">
                            {line.speaker}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                            {line.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Follow-through')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t('Extraction confidence')}
                    </span>
                    <span className="font-display text-xl font-semibold leading-none tabular">
                      {confidence}%
                    </span>
                  </div>
                  <Progress
                    value={confidence}
                    aria-label={t('Extraction confidence')}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('Actions'), value: analysis.actions.length },
                    { label: t('Decisions'), value: analysis.decisions.length },
                    { label: t('Risks'), value: analysis.risks.length },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-border/60 bg-secondary/25 px-2 py-2 text-center"
                    >
                      <p className="font-display text-sm font-semibold leading-none tabular">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t('Pipeline')}
                  </p>
                  {analysis.steps.map((step) => (
                    <div key={step.key} className="flex items-start gap-2">
                      <StepIcon status={step.status} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground">
                          {t(step.label)}
                        </p>
                        <p className="text-[10px] leading-snug text-muted-foreground">
                          {step.detail ? t(step.detail) : null}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t('Selected follow-ups')}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {selectedCount === 0
                      ? t(
                          'Select actions or decisions to write them into the workspace.'
                        )
                      : t('{{count}} item ready to create.', {
                          count: selectedCount,
                        })}
                  </p>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={commitSelected}
                    disabled={
                      commit.isPending ||
                      (selectedActionIds.length === 0 &&
                        selectedDecisionIds.length === 0)
                    }
                  >
                    {commit.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {commit.isPending ? t('Creating…') : t('Create follow-ups')}
                  </Button>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    {t(
                      'Tasks land in the project. Decisions go to the decision log. Nothing is written until you confirm.'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Meeting context')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t('Agenda')}
                  </p>
                  {meeting.agenda.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t('No agenda was added.')}
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1">
                      {meeting.agenda.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground"
                        >
                          <Circle className="mt-1 h-2 w-2 shrink-0 text-blue-400/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t('Participants')}
                  </p>
                  <div className="mt-2 space-y-2">
                    {meeting.participants.map((participant: UserProfile) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2"
                      >
                        <UserAvatar user={participant} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-foreground">
                            {participant.fullName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {participant.jobTitle ?? participant.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="icon-tile h-12 w-12 border-blue-500/20 bg-blue-500/10 text-blue-400">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <h2 className="mt-3 font-display text-base font-semibold text-foreground">
                {meeting.status === 'processing'
                  ? t('Transcript is ready for analysis')
                  : t('No analysis yet')}
              </h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {meeting.status === 'processing'
                  ? t(
                      'This meeting finished recording. Run the extractor to turn the transcript into a summary, decisions and owned action items.'
                    )
                  : t(
                      'Paste a transcript to preview the full intelligence flow. Nothing is written to the workspace until you confirm the extracted follow-ups.'
                    )}
              </p>
              <Button className="mt-4" size="sm" onClick={() => setAnalyzeOpen(true)}>
                <BrainCircuit className="h-3.5 w-3.5" />
                {t('Analyze transcript')}
              </Button>
              <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 text-left sm:grid-cols-3">
                {[
                  {
                    icon: ScanText,
                    title: t('Normalize'),
                    detail: t('Speakers and timestamps'),
                  },
                  {
                    icon: Sparkles,
                    title: t('Extract'),
                    detail: t('Summary, risks, decisions'),
                  },
                  {
                    icon: CheckCircle2,
                    title: t('Commit'),
                    detail: t('Tasks and decision log'),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5"
                    >
                      <Icon className="h-3.5 w-3.5 text-blue-400" />
                      <p className="mt-1.5 text-[11px] font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('Meeting context')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('Agenda')}
                </p>
                {meeting.agenda.length === 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t('No agenda was added.')}
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {meeting.agenda.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground"
                      >
                        <Circle className="mt-1 h-2 w-2 shrink-0 text-blue-400/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('Participants')}
                </p>
                <div className="mt-2 space-y-2">
                  {meeting.participants.map((participant: UserProfile) => (
                    <div key={participant.id} className="flex items-center gap-2">
                      <UserAvatar user={participant} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-foreground">
                          {participant.fullName}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {participant.jobTitle ?? participant.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AnalyzeMeetingDialog
        meeting={meeting}
        open={analyzeOpen}
        onOpenChange={setAnalyzeOpen}
      />
    </div>
  );
}
