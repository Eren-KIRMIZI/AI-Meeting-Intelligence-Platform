import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import {
  buildLiveInsights,
  formatTranscript,
  answerLiveQuestion,
} from '@/lib/live/intelligence';
import { demoDialogue } from '@/lib/live/demo-dialogue';
import {
  colorFor,
  createLiveMediaAdapter,
  initialsFor,
  newPeerId,
  resolveLiveTransport,
  type LiveIdentity,
  type LiveMediaAdapter,
  type LiveMediaSnapshot,
} from '@/lib/live/media';
import { useLiveCaptions } from './use-live-captions';
import type {
  LiveChatMessage,
  LiveConnectionState,
  LiveMeetingInput,
  LiveRoomMode,
  LiveTransport,
  TranscriptSegment,
} from '@/types';

export type LiveRoomPhase = 'prejoin' | 'live' | 'ended';

export interface LiveAssistantTurn {
  question: string;
  answer: string;
  items: string[];
}

export interface JoinRoomOptions {
  displayName: string;
  micOn: boolean;
  cameraOn: boolean;
  stream: MediaStream | null;
}

interface UseLiveRoomOptions {
  roomId: string;
  title: string;
  mode: LiveRoomMode;
  projectId?: string;
  projectName?: string;
}

function initialSnapshot(transport: LiveTransport): LiveMediaSnapshot {
  return {
    participants: [],
    localStream: null,
    remoteStreams: {},
    connection: 'idle' as LiveConnectionState,
    transport,
    screenSharing: false,
    error: null,
  };
}

/**
 * Owns the Nova Live room state. The media adapter is the only thing that knows
 * whether the room is a demo mesh or LiveKit; the page and panels consume the
 * same snapshot, transcript and chat shapes in both modes.
 */
export function useLiveRoom({
  roomId,
  title,
  mode,
  projectId,
  projectName,
}: UseLiveRoomOptions) {
  const { user, session, isDemo } = useAuth();
  const peerIdRef = useRef(newPeerId());
  const identityRef = useRef<LiveIdentity | null>(null);
  const adapterRef = useRef<LiveMediaAdapter | null>(null);
  const demoIndexRef = useRef(0);

  const [phase, setPhase] = useState<LiveRoomPhase>('prejoin');
  const [snapshot, setSnapshot] = useState<LiveMediaSnapshot>(() =>
    initialSnapshot(resolveLiveTransport())
  );
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [chat, setChat] = useState<LiveChatMessage[]>([]);
  const [answers, setAnswers] = useState<LiveAssistantTurn[]>([]);
  const [captionsActive, setCaptionsActive] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [endedAtMs, setEndedAtMs] = useState<number | null>(null);
  const [endedByHost, setEndedByHost] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const addSegment = useCallback((segment: TranscriptSegment) => {
    setSegments((current) => {
      if (current.some((item) => item.id === segment.id)) return current;
      return [...current, segment].sort((a, b) => a.at - b.at);
    });
  }, []);

  const publishSegment = useCallback(
    (segment: TranscriptSegment) => {
      const adapter = adapterRef.current;
      if (adapter) {
        adapter.sendSegment(segment);
      } else {
        addSegment(segment);
      }
    },
    [addSegment]
  );

  const addChat = useCallback((message: LiveChatMessage) => {
    setChat((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message]
    );
  }, []);

  const handleRoomEnded = useCallback(() => {
    adapterRef.current?.disconnect();
    adapterRef.current = null;
    setCaptionsActive(false);
    setDemoPlaying(false);
    setEndedAtMs(Date.now());
    setEndedByHost(true);
    setPhase('ended');
  }, []);

  const join = useCallback(
    async ({ displayName, micOn, cameraOn, stream }: JoinRoomOptions) => {
      if (!user) return;

      const name = displayName.trim() || user.fullName;
      const identity: LiveIdentity = {
        peerId: peerIdRef.current,
        userId: user.id,
        fullName: name,
        initials: initialsFor(name),
        avatarColor: colorFor(name),
      };
      identityRef.current = identity;

      const adapter = createLiveMediaAdapter({
        roomId,
        identity,
        accessToken: session?.access_token ?? null,
        handlers: {
          onChange: (next) => setSnapshot(next),
          onChat: addChat,
          onSegment: addSegment,
          onRoomEnded: handleRoomEnded,
        },
      });
      adapterRef.current = adapter;

      setSnapshot(initialSnapshot(adapter.transport));
      setStartedAtMs(Date.now());
      setEndedAtMs(null);
      setEndedByHost(false);
      setPhase('live');

      await adapter.connect({ mode, stream });
      await adapter.setMicEnabled(micOn);
      if (mode === 'video') {
        await adapter.setCameraEnabled(cameraOn);
      }
    },
    [addChat, addSegment, handleRoomEnded, mode, roomId, session, user]
  );

  const self = snapshot.participants.find((participant) => participant.isSelf) ?? null;
  const micOn = self?.micOn ?? false;
  const cameraOn = self?.cameraOn ?? false;

  const toggleMic = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    void adapter.setMicEnabled(!micOn);
  }, [micOn]);

  const toggleCamera = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter || mode !== 'video') return;
    void adapter.setCameraEnabled(!cameraOn);
  }, [cameraOn, mode]);

  const toggleScreenShare = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    void adapter.setScreenShare(!snapshot.screenSharing);
  }, [snapshot.screenSharing]);

  const sendChat = useCallback((text: string) => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    adapter.sendChat(text);
  }, []);

  const toggleCaptions = useCallback(() => {
    setCaptionsActive((value) => !value);
  }, []);

  const toggleDemo = useCallback(() => {
    setDemoPlaying((value) => !value);
  }, []);

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const result = answerLiveQuestion(
        trimmed,
        insights,
        segments,
        identityRef.current?.fullName ?? user?.fullName ?? 'you'
      );
      setAnswers((current) => [
        { question: trimmed, ...result },
        ...current,
      ]);
    },
    // `insights` is derived from segments, so segments is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, user]
  );

  const clearAnswers = useCallback(() => setAnswers([]), []);

  const captions = useLiveCaptions({
    active: phase === 'live' && captionsActive,
    speakerId: identityRef.current?.userId ?? user?.id ?? 'self',
    speaker: identityRef.current?.fullName ?? user?.fullName ?? 'You',
    startedAtMs,
    onSegment: publishSegment,
  });

  useEffect(() => {
    if (!demoPlaying || phase !== 'live' || !startedAtMs) return;

    const publishNext = () => {
      const index = demoIndexRef.current;
      demoIndexRef.current += 1;
      const line = demoDialogue[index % demoDialogue.length];
      const at = Math.max(0, (Date.now() - startedAtMs) / 1000);

      publishSegment({
        id: `demo-${roomId}-${index + 1}`,
        speakerId: `demo-${line.speaker.toLowerCase().replace(/\s+/g, '-')}`,
        speaker: line.speaker,
        text: line.text,
        at,
        createdAt: new Date().toISOString(),
        source: 'demo',
      });
    };

    const kickoff = window.setTimeout(publishNext, 700);
    const id = window.setInterval(publishNext, 6000);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(id);
    };
  }, [demoPlaying, phase, publishSegment, roomId, startedAtMs]);

  useEffect(() => {
    if (!startedAtMs) return;
    const tick = () => {
      const end = endedAtMs ?? Date.now();
      setElapsed(Math.max(0, Math.floor((end - startedAtMs) / 1000)));
    };
    tick();
    if (endedAtMs) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAtMs, endedAtMs]);

  useEffect(() => {
    return () => {
      adapterRef.current?.disconnect();
      adapterRef.current = null;
    };
  }, []);

  const participantKey = snapshot.participants
    .map((participant) => participant.fullName)
    .join('|');

  const insights = useMemo(
    () =>
      buildLiveInsights(
        title,
        segments,
        participantKey ? participantKey.split('|') : []
      ),
    [participantKey, segments, title]
  );

  const buildReport = useCallback((): LiveMeetingInput | null => {
    if (!startedAtMs) return null;

    const ended = endedAtMs ?? Date.now();
    return {
      title,
      roomId,
      transport: snapshot.transport,
      projectId,
      projectName,
      mode,
      startedAt: new Date(startedAtMs).toISOString(),
      endedAt: new Date(ended).toISOString(),
      durationSeconds: Math.max(0, Math.round((ended - startedAtMs) / 1000)),
      participants: snapshot.participants,
      segments,
      chat,
      insights,
      transcript: formatTranscript(segments),
    };
  }, [
    chat,
    endedAtMs,
    insights,
    mode,
    projectId,
    projectName,
    roomId,
    segments,
    snapshot.participants,
    snapshot.transport,
    startedAtMs,
    title,
  ]);

  const endMeeting = useCallback((): LiveMeetingInput | null => {
    const report = buildReport();
    const adapter = adapterRef.current;

    adapter?.endRoom();
    adapterRef.current = null;
    adapter?.disconnect();

    setCaptionsActive(false);
    setDemoPlaying(false);
    setEndedAtMs(Date.now());
    setEndedByHost(false);
    setPhase('ended');

    return report;
  }, [buildReport]);

  return {
    phase,
    title,
    roomId,
    mode,
    projectId,
    projectName,
    snapshot,
    participants: snapshot.participants,
    localStream: snapshot.localStream,
    remoteStreams: snapshot.remoteStreams,
    connection: snapshot.connection,
    transport: snapshot.transport,
    screenSharing: snapshot.screenSharing,
    mediaError: snapshot.error,
    segments,
    chat,
    answers,
    insights,
    elapsed,
    startedAtMs,
    endedAtMs,
    endedByHost,
    self,
    micOn,
    cameraOn,
    captionsSupported: captions.supported,
    captionsActive,
    captionsListening: captions.listening,
    captionInterim: captions.interim,
    captionError: captions.error,
    demoPlaying,
    demoAvailable: isDemo,
    join,
    endMeeting,
    buildReport,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleCaptions,
    toggleDemo,
    sendChat,
    ask,
    clearAnswers,
  };
}

export type LiveRoomController = ReturnType<typeof useLiveRoom>;
