import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Film,
  Info,
  Loader2,
  Lock,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-provider';
import { useLiveRoom } from '@/hooks/use-live-room';
import { useLocalRecording } from '@/hooks/use-local-recording';
import { useCommitMeetingAnalysis, useSaveLiveMeeting, useSaveMeetingRecording } from '@/hooks/use-workspace';
import { formatDuration, roomLink } from '@/lib/live/room';
import { formatBytes, formatRecordingLength } from '@/lib/recordings';
import { cn } from '@/lib/utils';
import type {
  CommitMeetingResult,
  LiveMeetingInput,
  LiveRoomMode,
  Meeting,
  MeetingRecording,
} from '@/types';
import { LiveControls } from './components/live-controls';
import { LiveReportDialog } from './components/live-report-dialog';
import {
  LiveSidePanel,
  type LivePanelTab,
} from './components/live-side-panel';
import { LiveVideoTile } from './components/live-video-tile';

function mediaMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera or microphone permission was denied. You can still join in listen-only mode.';
    }
    if (error.name === 'NotFoundError') {
      return 'No camera or microphone was found on this device. You can still join in listen-only mode.';
    }
  }
  return error instanceof Error
    ? error.message
    : 'The camera or microphone could not be started.';
}

export function LiveRoomPage() {
  const { roomId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();

  const mode: LiveRoomMode = params.get('mode') === 'audio' ? 'audio' : 'video';
  const projectId = params.get('project') ?? undefined;
  const projectName = params.get('projectName') ?? undefined;

  const [roomTitle, setRoomTitle] = useState(
    params.get('title')?.trim() || 'Nova Live meeting'
  );
  const [displayName, setDisplayName] = useState(user?.fullName ?? '');
  const [deviceMic, setDeviceMic] = useState(true);
  const [deviceCam, setDeviceCam] = useState(mode === 'video');
  const [consent, setConsent] = useState(false);
  const [joining, setJoining] = useState(false);
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [panel, setPanel] = useState<LivePanelTab | null>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'transcript' : null
  );
  const [remoteMuted, setRemoteMuted] = useState<Set<string>>(new Set());
  const [report, setReport] = useState<LiveMeetingInput | null>(null);
  const [savedMeeting, setSavedMeeting] = useState<Meeting | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [committed, setCommitted] = useState<CommitMeetingResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewRef = useRef<MediaStream | null>(null);
  const handedOffRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const controller = useLiveRoom({
    roomId,
    title: roomTitle,
    mode,
    projectId,
    projectName,
  });

  const saveLive = useSaveLiveMeeting();
  const commit = useCommitMeetingAnalysis();
  const archiveRecording = useSaveMeetingRecording();
  const recording = useLocalRecording(controller.localStream);
  const [archived, setArchived] = useState<MeetingRecording | null>(null);

  useEffect(() => {
    if (controller.phase !== 'prejoin') return;

    let cancelled = false;
    let stream: MediaStream | null = null;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPreviewError(
          'This browser cannot access camera or microphone. You can still join in listen-only mode.'
        );
        return;
      }

      try {
        const next = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === 'video' ? { facingMode: 'user' } : false,
        });
        if (cancelled) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = next;
        previewRef.current = next;
        setPreview(next);
        setPreviewError(null);
      } catch (error) {
        if (!cancelled) setPreviewError(mediaMessage(error));
      }
    };

    void start();

    return () => {
      cancelled = true;
      const current = stream ?? previewRef.current;
      if (current && current !== handedOffRef.current) {
        current.getTracks().forEach((track) => track.stop());
      }
      previewRef.current = null;
      setPreview(null);
    };
  }, [controller.phase, mode]);

  useEffect(() => {
    const element = previewVideoRef.current;
    if (!element) return;
    element.srcObject = preview;
    if (preview) void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [preview]);

  useEffect(() => {
    preview?.getAudioTracks().forEach((track) => {
      track.enabled = deviceMic;
    });
  }, [preview, deviceMic]);

  useEffect(() => {
    preview?.getVideoTracks().forEach((track) => {
      track.enabled = deviceCam;
    });
  }, [preview, deviceCam]);

  const persist = (input: LiveMeetingInput) => {
    setReport(input);
    setSavedMeeting(null);
    setCommitted(null);
    setSaveError(null);
    setReportOpen(true);

    saveLive.mutate(input, {
      onSuccess: (meeting) => {
        setSavedMeeting(meeting);
        toast.success('Meeting report saved to the workspace');
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : 'The report could not be saved.';
        setSaveError(message);
        toast.error(message);
      },
    });
  };

  const handleJoin = () => {
    if (!displayName.trim()) {
      toast.error('Add the name you want the room to show');
      return;
    }
    if (!consent) {
      toast.error('Confirm the transcription and recording notice before joining');
      return;
    }

    handedOffRef.current = preview;
    setJoining(true);
    void controller
      .join({
        displayName,
        micOn: deviceMic,
        cameraOn: deviceCam,
        stream: preview,
      })
      .finally(() => setJoining(false));
  };

  const handleEnd = () => {
    setConfirmEnd(false);
    if (recording.recording) recording.stop();
    const input = controller.endMeeting();
    if (input) {
      persist(input);
    } else {
      toast.error('The meeting could not be finalised.');
    }
  };

  const handleArchiveRecording = () => {
    const clip = recording.clip;
    const meeting = savedMeeting;
    if (!clip || !meeting) return;

    archiveRecording.mutate(
      {
        meetingId: meeting.id,
        recording: {
          blob: clip.blob,
          filename: clip.filename,
          mimeType: clip.mimeType,
          durationSeconds: clip.durationSeconds,
          localUrl: clip.url,
        },
      },
      {
        onSuccess: (saved) => {
          setArchived(saved);
          toast.success('Recording archived on the meeting');
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'The recording could not be archived.'
          );
        },
      }
    );
  };

  const handleHostEndedSave = () => {
    const input = controller.buildReport();
    if (input) persist(input);
  };

  const invite = async () => {
    const link = roomLink(roomId);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied');
    } catch {
      toast.message('Room link', { description: link });
    }
  };

  const handleCommit = () => {
    const meeting = savedMeeting;
    const analysis = meeting?.analysis;
    if (!meeting || !analysis) return;

    commit.mutate(
      {
        meetingId: meeting.id,
        actionIds: analysis.actions.map((action) => action.id),
        decisionIds: analysis.decisions.map((decision) => decision.id),
      },
      {
        onSuccess: (result) => {
          setCommitted(result);
          toast.success(
            `Created ${result.tasks.length} task${
              result.tasks.length === 1 ? '' : 's'
            } and ${result.decisions.length} decision${
              result.decisions.length === 1 ? '' : 's'
            }`
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Follow-ups could not be created.'
          );
        },
      }
    );
  };

  const toggleRemoteMute = (peerId: string) => {
    setRemoteMuted((current) => {
      const next = new Set(current);
      if (next.has(peerId)) next.delete(peerId);
      else next.add(peerId);
      return next;
    });
  };

  const openMeeting = () => {
    if (!savedMeeting) return;
    setReportOpen(false);
    navigate(`/meetings/${savedMeeting.id}`);
  };

  if (controller.phase === 'prejoin') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#05070c] text-foreground">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[120px]" />

        <header className="relative flex h-[60px] items-center justify-between border-b border-white/5 px-4 sm:px-6">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Nova Live
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Lock className="h-3 w-3" />
              {isDemo ? 'Demo room' : 'Live room'}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              {roomId}
            </Badge>
          </div>
        </header>

        <main className="relative mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1.35fr_1fr] lg:px-8 lg:py-10">
          <section className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f17] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
              <div className="relative aspect-video">
                {preview && deviceCam && mode === 'video' ? (
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full -scale-x-100 object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(91,141,239,0.18),transparent_65%)]">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="grid h-20 w-20 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xl font-semibold text-primary">
                        {(displayName.trim() || 'You')
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join('') || 'NV'}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {mode === 'audio' ? 'Audio room' : 'Camera is off'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {previewError
                            ? 'Join in listen-only mode'
                            : 'Your preview appears here before you join.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10">
                  <span className="text-xs font-medium text-white/85">
                    {displayName.trim() || 'You'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeviceMic((value) => !value)}
                      aria-pressed={deviceMic}
                      className={cn(
                        'grid h-9 w-9 place-items-center rounded-full border transition-colors',
                        deviceMic
                          ? 'border-white/15 bg-black/50 text-white/85 hover:bg-black/70'
                          : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                      )}
                      title={deviceMic ? 'Mute microphone' : 'Unmute microphone'}
                    >
                      {deviceMic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={mode === 'audio'}
                      onClick={() => setDeviceCam((value) => !value)}
                      aria-pressed={deviceCam}
                      className={cn(
                        'grid h-9 w-9 place-items-center rounded-full border transition-colors',
                        deviceCam
                          ? 'border-white/15 bg-black/50 text-white/85 hover:bg-black/70'
                          : 'border-rose-500/40 bg-rose-500/20 text-rose-300',
                        mode === 'audio' && 'cursor-not-allowed opacity-40'
                      )}
                      title={deviceCam ? 'Turn camera off' : 'Turn camera on'}
                    >
                      {deviceCam ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {previewError ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {previewError}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: 'Live intelligence',
                  text: 'Captions become decisions, owners and deadlines while you talk.',
                },
                {
                  icon: MonitorUp,
                  title: 'Screen sharing',
                  text: 'Present the work without leaving the room or losing the transcript.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Consent first',
                  text: 'Transcription and recording are announced before anyone joins.',
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-white/8 bg-white/[0.02] p-3"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-[11px] font-medium">{feature.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      {feature.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card/80 p-4 shadow-panel backdrop-blur sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Ready to join
                </p>
                <h1 className="mt-1 font-display text-lg font-semibold leading-tight">
                  {roomTitle}
                </h1>
              </div>
              <Badge variant="outline">
                {mode === 'video' ? <Video className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {mode === 'video' ? 'Video' : 'Audio'}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <Field label="Room title" htmlFor="live-title">
                <Input
                  id="live-title"
                  value={roomTitle}
                  onChange={(event) => setRoomTitle(event.target.value)}
                  maxLength={90}
                />
              </Field>

              <Field
                label="Display name"
                htmlFor="live-name"
                hint="Each tab can join with a different name, which makes testing the room easy."
              >
                <Input
                  id="live-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                />
              </Field>

              {projectName ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Linked to {projectName}
                </div>
              ) : null}

              <div className="rounded-lg border border-border/70 bg-secondary/25 p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Transcription & recording notice
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  Nova can transcribe speech with the browser speech service and
                  generate an AI brief. Pressing Record stores a local file in this
                  browser only. Tell every participant before joining — this is
                  required for KVKK/GDPR consent.
                </p>
                <label className="mt-2.5 flex cursor-pointer items-start gap-2 text-[10px] leading-relaxed text-foreground/80">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-background accent-primary"
                  />
                  I have informed everyone in the room and they agree to
                  transcription and optional recording.
                </label>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                Join Nova Live
              </Button>

              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {isDemo ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                  {isDemo ? 'WebRTC mesh · this browser' : 'LiveKit media server'}
                </span>
                <button
                  type="button"
                  onClick={() => void invite()}
                  className="inline-flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
                >
                  <Copy className="h-3 w-3" />
                  Copy invite link
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (controller.phase === 'ended') {
    const insights = savedMeeting?.analysis ?? report?.insights ?? controller.insights;
    const segmentCount = report?.segments.length ?? controller.segments.length;
    const chatCount = report?.chat.length ?? controller.chat.length;
    const participantNames =
      report?.participants.map((participant) => participant.fullName) ?? [];
    const anotherHostEnded = controller.endedByHost && !report;

    return (
      <div className="relative min-h-screen overflow-hidden bg-[#05070c] text-foreground">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
        <div className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />

        <header className="relative flex h-[60px] items-center justify-between border-b border-white/5 px-4 sm:px-6">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Nova Live
          </Link>
          <Badge variant="outline" className="font-mono text-[10px]">
            {roomId}
          </Badge>
        </header>

        <main className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 text-center sm:py-16">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>

          <h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em]">
            {anotherHostEnded ? 'The room has ended' : 'Meeting captured'}
          </h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {anotherHostEnded
              ? 'Another participant ended the room. Save your copy of the transcript and report, or leave without saving.'
              : 'Nova saved the meeting, the transcript and a Knowledge note. Review the owners and deadlines before creating follow-ups.'}
          </p>

          {!anotherHostEnded ? (
            <>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-4">
                {[
                  {
                    label: 'Duration',
                    value: formatDuration(
                      report?.durationSeconds ?? controller.elapsed
                    ),
                  },
                  { label: 'Segments', value: String(segmentCount) },
                  { label: 'Actions', value: String(insights.actions.length) },
                  { label: 'Decisions', value: String(insights.decisions.length) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3"
                  >
                    <p className="font-display text-lg font-semibold tabular">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 w-full rounded-xl border border-white/8 bg-card/70 p-4 text-left">
                <p className="text-xs font-medium">
                  {savedMeeting?.title ?? report?.title ?? controller.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {participantNames.length > 0
                    ? participantNames.join(', ')
                    : 'Only you were in the room'}
                  {chatCount > 0
                    ? ` · ${chatCount} chat message${chatCount === 1 ? '' : 's'} saved`
                    : ''}
                </p>
                {saveLive.isPending ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Writing the brief and Knowledge note…
                  </p>
                ) : saveError ? (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {saveError}
                  </p>
                ) : savedMeeting ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved to Meetings and Knowledge
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (report) setReportOpen(true);
                    else if (savedMeeting) navigate(`/meetings/${savedMeeting.id}`);
                  }}
                  disabled={!report && !savedMeeting}
                >
                  <Sparkles className="h-4 w-4" />
                  Open meeting report
                </Button>
                <Button asChild variant="outline">
                  <Link to="/live">Back to lobby</Link>
                </Button>
              </div>

              {saveError && report ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => persist(report)}
                  disabled={saveLive.isPending}
                >
                  Try saving again
                </Button>
              ) : null}
            </>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/live">Back to lobby</Link>
              </Button>
              <Button onClick={handleHostEndedSave}>
                <Sparkles className="h-4 w-4" />
                Save my report
              </Button>
            </div>
          )}
        </main>

        {recording.clip ? (
          <section className="relative mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
            <div className="rounded-xl border border-white/8 bg-card/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 text-xs font-medium">
                    <Film className="h-3.5 w-3.5 text-rose-400" />
                    Recording ready
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {formatBytes(recording.clip.sizeBytes)} ·{' '}
                    {formatRecordingLength(recording.clip.durationSeconds)} ·{' '}
                    {recording.clip.filename}
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/80">
                    {archived
                      ? 'Archived on the meeting. Everyone with workspace access can play it there.'
                      : savedMeeting
                        ? 'The file is still only in this browser. Archiving uploads it to private workspace storage.'
                        : 'Save the meeting first, then archive the recording on it.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={recording.clip.url} download={recording.clip.filename}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleArchiveRecording}
                    disabled={
                      !savedMeeting ||
                      Boolean(archived) ||
                      archiveRecording.isPending
                    }
                  >
                    {archiveRecording.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : archived ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {archiveRecording.isPending
                      ? 'Archiving…'
                      : archived
                        ? 'Archived'
                        : 'Save to meeting'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <LiveReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          report={report}
          meeting={savedMeeting}
          saving={saveLive.isPending}
          saveError={saveError}
          onRetry={() => {
            if (report) persist(report);
          }}
          onCommit={handleCommit}
          committing={commit.isPending}
          committed={committed}
          onOpenMeeting={openMeeting}
        />
      </div>
    );
  }

  const featured = controller.participants.find((participant) => participant.sharing);
  const ordered = featured
    ? [
        featured,
        ...controller.participants.filter(
          (participant) => participant.peerId !== featured.peerId
        ),
      ]
    : controller.participants;
  const lastSegments = controller.segments.slice(-2);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#05070c] text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

      <header className="relative z-10 flex h-[56px] shrink-0 items-center gap-2 border-b border-white/8 bg-[#070b12]/85 px-3 backdrop-blur sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{controller.title}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {roomId} · {controller.mode === 'video' ? 'Video' : 'Audio'} room
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {recording.recording ? (
            <Badge variant="danger" className="gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              REC {formatDuration(recording.seconds)}
            </Badge>
          ) : null}

          <Badge variant="outline" className="hidden tabular sm:inline-flex">
            {formatDuration(controller.elapsed)}
          </Badge>

          <Badge
            variant={controller.connection === 'connected' ? 'success' : 'outline'}
            className="hidden gap-1 sm:inline-flex"
          >
            {controller.connection === 'connected' ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {controller.connection === 'connected'
              ? controller.transport === 'livekit'
                ? 'LiveKit'
                : 'Mesh'
              : 'Connecting'}
          </Badge>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void invite()}
            title="Copy invite link"
            aria-label="Copy invite link"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3.5">
            {ordered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Connecting to the room…</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {isDemo
                    ? 'Demo rooms use a peer-to-peer mesh. Open the invite link in a second tab to see another participant.'
                    : 'Waiting for the media server to publish your tracks.'}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  'mx-auto grid max-w-[1400px] gap-2.5 sm:gap-3',
                  ordered.length === 1
                    ? 'max-w-4xl grid-cols-1'
                    : ordered.length <= 4
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                )}
              >
                {ordered.map((participant) => (
                  <div
                    key={participant.peerId}
                    className={cn(
                      participant.sharing && ordered.length > 1 && 'sm:col-span-2'
                    )}
                  >
                    <LiveVideoTile
                      participant={participant}
                      stream={
                        participant.isSelf
                          ? controller.localStream
                          : controller.remoteStreams[participant.peerId] ?? null
                      }
                      muted={remoteMuted.has(participant.peerId)}
                      featured={participant.sharing}
                    />
                  </div>
                ))}
              </div>
            )}

            {(controller.captionsActive || controller.demoPlaying) &&
            (lastSegments.length > 0 || controller.captionInterim) ? (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 mx-auto max-w-3xl rounded-lg border border-white/10 bg-black/70 px-3 py-2 backdrop-blur">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-primary/80">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                  Live captions
                  {controller.demoPlaying ? ' · demo' : ''}
                </div>
                <div className="mt-1 space-y-0.5">
                  {lastSegments.map((segment) => (
                    <p key={segment.id} className="text-xs leading-snug text-white/90">
                      <span className="font-medium text-primary">{segment.speaker}:</span>{' '}
                      {segment.text}
                    </p>
                  ))}
                  {controller.captionInterim ? (
                    <p className="text-xs italic leading-snug text-white/60">
                      {controller.captionInterim}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {recording.clip ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/8 bg-white/[0.03] px-3 py-2 text-[11px]">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Local recording saved
              <Button asChild variant="outline" size="sm" className="h-7 text-[10px]">
                <a href={recording.clip.url} download={recording.clip.filename}>
                  <Download className="h-3 w-3" />
                  Download .webm
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={recording.clearClip}
                aria-label="Dismiss recording"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <span className="ml-auto text-[10px] text-muted-foreground">
                Stays in this browser
              </span>
            </div>
          ) : null}

          {recording.error ? (
            <p className="border-t border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[10px] text-amber-300">
              {recording.error}
            </p>
          ) : null}

          <LiveControls
            controller={controller}
            panel={panel}
            onTogglePanel={(tab) =>
              setPanel((current) => (current === tab ? null : tab))
            }
            recording={recording.recording}
            recordingSupported={recording.supported}
            recordingSeconds={recording.seconds}
            onToggleRecording={() => {
              if (recording.recording) recording.stop();
              else recording.start();
            }}
            onEnd={() => setConfirmEnd(true)}
          />
        </main>

        {panel ? (
          <aside className="fixed inset-x-0 bottom-[68px] top-[56px] z-40 flex min-h-0 flex-col border-l border-border/70 bg-card/95 backdrop-blur lg:static lg:inset-auto lg:z-auto lg:w-[380px] lg:bg-card/70">
            <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5 lg:hidden">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Meeting panel
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPanel(null)}
                aria-label="Close panel"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <LiveSidePanel
                controller={controller}
                tab={panel}
                onTabChange={setPanel}
                onInvite={() => void invite()}
                remoteMuted={remoteMuted}
                onToggleRemoteMute={toggleRemoteMute}
              />
            </div>
          </aside>
        ) : null}
      </div>

      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End the meeting?</DialogTitle>
            <DialogDescription>
              Nova will stop the media, save the transcript and generate the
              meeting report. Follow-ups are created after you review the report.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              {controller.segments.length} transcript segments ·{' '}
              {controller.chat.length} chat messages ·{' '}
              {formatDuration(controller.elapsed)}
            </div>
            {controller.segments.length === 0 ? (
              <p className="mt-1.5 text-amber-300/90">
                No speech has been captured yet. The meeting will still be saved
                with an empty transcript.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmEnd(false)}>
              Keep talking
            </Button>
            <Button variant="destructive" onClick={handleEnd}>
              <PhoneOff className="h-4 w-4" />
              End & save report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
