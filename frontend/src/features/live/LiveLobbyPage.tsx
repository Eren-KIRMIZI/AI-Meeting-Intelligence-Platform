import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarDays,
  Captions,
  CheckCircle2,
  Copy,
  GitBranch,
  Keyboard,
  Loader2,
  Lock,
  MonitorUp,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Mic,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { DataSourceBadge } from '@/components/common/data-source-badge';
import { AvatarStack } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { NativeSelect } from '@/components/ui/select-native';
import { useMeetings, useProjects } from '@/hooks/use-workspace';
import { useAuth } from '@/features/auth/auth-provider';
import { newRoomId, parseRoomCode } from '@/lib/live/room';
import { formatDate, formatTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { LiveRoomMode } from '@/types';

const capabilities = [
  {
    icon: Video,
    title: 'Video & audio rooms',
    text: 'Peer-to-peer mesh in demo mode, LiveKit SFU in production. One adapter, no changes to the rest of the workspace.',
    tone: 'text-blue-400',
  },
  {
    icon: MonitorUp,
    title: 'Screen sharing',
    text: 'Present a screen or window without losing the transcript, chat or AI copilot.',
    tone: 'text-violet-400',
  },
  {
    icon: Captions,
    title: 'Live captions',
    text: 'Speaker, text and timestamp are captured as you talk, with a scripted demo dialogue for mic-free testing.',
    tone: 'text-amber-400',
  },
  {
    icon: Bot,
    title: 'Meeting copilot',
    text: 'Ask about decisions, action items, owners, deadlines, risks and speaking time while the room is live.',
    tone: 'text-emerald-400',
  },
];

export function LiveLobbyPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isDemo } = useAuth();
  const projects = useProjects();
  const meetings = useMeetings();

  const [title, setTitle] = useState('Weekly product sync');
  const [mode, setMode] = useState<LiveRoomMode>('video');
  const [projectId, setProjectId] = useState('');
  const [code, setCode] = useState('');
  const [starting, setStarting] = useState(false);

  const projectList = projects.data ?? [];
  const liveMeetings = (meetings.data ?? [])
    .filter((meeting) => meeting.platform === 'nova_live')
    .sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    )
    .slice(0, 3);

  const startRoom = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error(t('Give the room a title'));
      return;
    }

    const project = projectList.find((item) => item.id === projectId);
    const search = new URLSearchParams({ title: trimmed, mode });
    if (project) {
      search.set('project', project.id);
      search.set('projectName', project.name);
    }

    setStarting(true);
    navigate(`/live/${newRoomId()}?${search.toString()}`);
  };

  const joinRoom = () => {
    const parsed = parseRoomCode(code);
    if (!parsed) {
      toast.error(t('Paste a valid room link or room code'));
      return;
    }
    navigate(`/live/${parsed}`);
  };

  const copySampleLink = async () => {
    const link = `${window.location.origin}/live/${newRoomId()}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t('Sample room link copied'), {
        description: t(
          'Open it in another tab to test the mesh as a second participant.'
        ),
      });
    } catch {
      toast.message(t('Sample room link'), { description: link });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Nova Live')}
        description={t(
          'Run the meeting inside Nova: video, screen share, live captions and a copilot that turns the conversation into owned follow-ups.'
        )}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 bg-secondary/30">
              <Radio className="h-3 w-3 text-rose-400" />
              {t('Real-time')}
            </Badge>
            <DataSourceBadge />
          </div>
        }
        actions={
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            {t('Consent-first')}
          </Badge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="relative overflow-hidden border-border/80">
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-violet-500/10 blur-[90px]" />

          <CardContent className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col justify-between gap-5">
              <div>
                <Badge variant="outline" className="gap-1 bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                  {t('Meet · decide · remember')}
                </Badge>
                <h2 className="mt-3 max-w-md font-display text-2xl font-semibold leading-tight tracking-[-0.02em]">
                  {t('Start a room that leaves a brief, not a pile of notes.')}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t(
                    'Nova listens for decisions and action items while you talk, then writes the report, the tasks and the Knowledge note when you end the call.'
                  )}
                </p>
              </div>

              <div className="grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  {t('Private workspace room')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
                  <Wifi className="h-3.5 w-3.5 text-blue-400" />
                  {isDemo ? t('Mesh across tabs') : t('LiveKit SFU')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
                  <Keyboard className="h-3.5 w-3.5 text-violet-400" />
                  {t('No install required')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  {t('KVKK/GDPR notice')}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('New room')}
              </p>
              <div className="mt-3 space-y-3">
                <Field label={t('Meeting title')} htmlFor="live-lobby-title">
                  <Input
                    id="live-lobby-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t('e.g. Launch readiness review')}
                    maxLength={90}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') startRoom();
                    }}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  {(['video', 'audio'] as const).map((option) => {
                    const active = mode === option;
                    const Icon = option === 'video' ? Video : Mic;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMode(option)}
                        aria-pressed={active}
                        className={
                          active
                            ? 'flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-left text-xs font-medium text-primary'
                            : 'flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground'
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span>
                          {option === 'video' ? t('Video room') : t('Audio room')}
                          <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                            {option === 'video' ? t('Camera + mic') : t('Mic only')}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Field
                  label={t('Link to a project')}
                  htmlFor="live-lobby-project"
                  hint={t(
                    'Follow-ups inherit the project when you create them.'
                  )}
                >
                  <NativeSelect
                    id="live-lobby-project"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                  >
                    <option value="">{t('No project')}</option>
                    {projectList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Button className="w-full" onClick={startRoom} disabled={starting}>
                  {starting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                  {t('Start Nova Live room')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span className="icon-tile h-8 w-8 text-primary">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{t('Join a room')}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Paste a room code or the full invite link.')}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={t('nova-abc123 or https://…/live/nova-abc123')}
                  className="h-9 text-xs"
                  aria-label={t('Room code or invite link')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') joinRoom();
                  }}
                />
                <Button variant="secondary" onClick={joinRoom} disabled={!code.trim()}>
                  {t('Join')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => void copySampleLink()}
                className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary transition-colors hover:text-primary/80"
              >
                <Copy className="h-3 w-3" />
                {t('Copy a sample room link for a second tab')}
              </button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">
                  {t('What happens when you end')}
                </p>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {t(
                    'Meeting saved as a completed Nova Live record with the full transcript.'
                  )}
                </li>
                <li className="flex gap-2">
                  <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                  {t('Decisions and tasks created only after you review the owners.')}
                </li>
                <li className="flex gap-2">
                  <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  {t(
                    'A Knowledge note links the summary and transcript back to company memory.'
                  )}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          return (
            <Card key={capability.title} className="bg-card/60">
              <CardContent className="p-4">
                <span className={`icon-tile h-8 w-8 ${capability.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2.5 text-sm font-medium">{t(capability.title)}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {t(capability.text)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="icon-tile h-7 w-7 text-rose-400">
                <Radio className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-medium">
                  {t('Recent Nova Live meetings')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t('Reports and transcripts from this workspace')}
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
              <Link to="/meetings">
                {t('All meetings')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {meetings.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Loading live meetings')}
            </div>
          ) : liveMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <span className="icon-tile h-9 w-9 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium">{t('No live meetings yet')}</p>
              <p className="max-w-sm text-[11px] text-muted-foreground">
                {t(
                  'Start a room, run the demo dialogue and end it to see the report, tasks, decisions and Knowledge note land here.'
                )}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {liveMeetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  to={`/meetings/${meeting.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{meeting.title}</p>
                      <Badge variant="outline" className="text-[9px]">
                        Nova Live
                      </Badge>
                      {meeting.transcriptReady ? (
                        <Badge variant="outline" className="gap-1 text-[9px]">
                          <Captions className="h-2.5 w-2.5" />
                          {t('Transcript')}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDate(meeting.startsAt, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {formatTime(meeting.startsAt)} ·{' '}
                      {t('{{count}} min', { count: meeting.durationMinutes })}
                      {meeting.projectName ? ` · ${meeting.projectName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      {t('{{actions}} actions · {{decisions}} decisions', {
                        actions: meeting.analysis?.actions.length ?? 0,
                        decisions: meeting.analysis?.decisions.length ?? 0,
                      })}
                    </span>
                    <AvatarStack users={meeting.participants} max={3} size="xs" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
