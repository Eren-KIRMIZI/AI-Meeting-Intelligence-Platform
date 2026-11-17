import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Captions,
  Copy,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Send,
  Sparkles,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDuration } from '@/lib/live/room';
import { cn } from '@/lib/utils';
import type { LiveRoomController } from '@/hooks/use-live-room';

export type LivePanelTab = 'transcript' | 'chat' | 'assistant' | 'people';

interface LiveSidePanelProps {
  controller: LiveRoomController;
  tab: LivePanelTab;
  onTabChange: (tab: LivePanelTab) => void;
  onInvite: () => void;
  remoteMuted: Set<string>;
  onToggleRemoteMute: (peerId: string) => void;
}

const suggestions = [
  'Summarize the meeting so far',
  'What decisions were made?',
  'What are my action items?',
  'What is still unresolved?',
];

export function LiveSidePanel({
  controller,
  tab,
  onTabChange,
  onInvite,
  remoteMuted,
  onToggleRemoteMute,
}: LiveSidePanelProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [question, setQuestion] = useState('');

  const { segments, chat, answers, insights, self } = controller;

  useEffect(() => {
    if (tab !== 'transcript') return;
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [segments, controller.captionInterim, tab]);

  useEffect(() => {
    if (tab !== 'chat') return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat, tab]);

  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    controller.sendChat(message);
    setMessage('');
  };

  const askQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    controller.ask(question);
    setQuestion('');
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as LivePanelTab)}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="border-b border-border/70 px-3 py-2">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transcript" className="gap-1 text-[11px]">
            <Captions className="h-3.5 w-3.5" />
            Live
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1 text-[11px]">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
            {chat.length > 0 ? (
              <span className="text-[10px] text-muted-foreground">{chat.length}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-1 text-[11px]">
            <Bot className="h-3.5 w-3.5" />
            AI
          </TabsTrigger>
          <TabsTrigger value="people" className="gap-1 text-[11px]">
            <Users className="h-3.5 w-3.5" />
            {controller.participants.length}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="transcript"
        className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                controller.captionsListening || controller.demoPlaying
                  ? 'animate-pulse bg-rose-400'
                  : 'bg-muted-foreground/50'
              )}
            />
            {controller.demoPlaying
              ? 'Demo dialogue'
              : controller.captionsActive
                ? controller.captionsListening
                  ? 'Listening'
                  : 'Captions on'
                : 'Captions off'}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {segments.length} segments
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {segments.length === 0 && !controller.captionInterim ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="icon-tile h-10 w-10 text-primary">
                <Captions className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium">No speech captured yet</p>
                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  Turn on live captions to transcribe your microphone, or play the
                  scripted demo dialogue to see the AI pipeline without a mic.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!controller.captionsSupported}
                  onClick={controller.toggleCaptions}
                >
                  <Captions className="h-3.5 w-3.5" />
                  Start captions
                </Button>
                {controller.demoAvailable ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={controller.toggleDemo}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Demo dialogue
                  </Button>
                ) : null}
              </div>
              {!controller.captionsSupported ? (
                <p className="text-[10px] text-amber-300/80">
                  Live captions need Chrome or Edge. The demo dialogue works everywhere.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {segments.map((segment) => (
                <div key={segment.id} className="flex gap-2.5">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[9px] font-semibold"
                    style={{
                      backgroundColor: `${segment.source === 'demo' ? '#8B5CF6' : '#5B8DEF'}26`,
                      borderColor: `${segment.source === 'demo' ? '#8B5CF6' : '#5B8DEF'}59`,
                      color: segment.source === 'demo' ? '#A78BFA' : '#7BA7FF',
                    }}
                  >
                    {segment.speaker
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[11px] font-medium text-foreground">
                        {segment.speaker}
                      </span>
                      <span className="text-[10px] tabular text-muted-foreground">
                        {formatDuration(segment.at)}
                      </span>
                      {segment.source === 'demo' ? (
                        <span className="rounded border border-violet-500/30 bg-violet-500/10 px-1 text-[9px] uppercase tracking-wide text-violet-300">
                          Demo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/85">
                      {segment.text}
                    </p>
                  </div>
                </div>
              ))}

              {controller.captionInterim ? (
                <div className="flex gap-2.5 opacity-70">
                  <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-border bg-secondary" />
                  <p className="text-xs italic leading-relaxed text-muted-foreground">
                    {controller.captionInterim}
                  </p>
                </div>
              ) : null}
            </>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {controller.captionError ? (
          <p className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[10px] text-amber-300">
            {controller.captionError}
          </p>
        ) : null}
      </TabsContent>

      <TabsContent
        value="chat"
        className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {chat.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="icon-tile h-10 w-10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium">Room chat</p>
              <p className="max-w-[230px] text-xs text-muted-foreground">
                Messages stay with the room and are saved with the meeting report.
              </p>
            </div>
          ) : (
            chat.map((entry) => {
              const mine = entry.authorId === self?.userId;
              return (
                <div
                  key={entry.id}
                  className={cn('flex flex-col gap-1', mine && 'items-end')}
                >
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {mine ? 'You' : entry.author}
                    </span>
                    <span className="tabular">
                      {new Date(entry.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'max-w-[90%] rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed',
                      mine
                        ? 'border-primary/25 bg-primary/10 text-foreground'
                        : 'border-border/70 bg-secondary/50 text-foreground/90'
                    )}
                  >
                    {entry.text}
                  </p>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2 border-t border-border/70 p-3"
        >
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message everyone…"
            className="h-8 text-xs"
            aria-label="Room chat message"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!message.trim()}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </TabsContent>

      <TabsContent
        value="assistant"
        className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium">Nova copilot</p>
              <span className="ml-auto text-[9px] uppercase tracking-wide text-primary/70">
                {controller.demoAvailable ? 'Demo' : 'Live'}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Grounded in this transcript only. Ask about decisions, owners,
              deadlines or what is still open.
            </p>
          </div>

          {answers.length === 0 ? (
            <div className="space-y-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => controller.ask(suggestion)}
                  className="flex w-full items-center gap-2 rounded-md border border-border/70 bg-secondary/30 px-2.5 py-2 text-left text-[11px] text-foreground/85 transition-colors hover:border-primary/30 hover:bg-secondary"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            answers.map((turn, index) => (
              <div
                key={`${turn.question}-${index}`}
                className="rounded-lg border border-border/70 bg-secondary/30 p-3"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {turn.question}
                </p>
                <p className="mt-1 text-xs font-medium leading-relaxed">
                  {turn.answer}
                </p>
                {turn.items.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {turn.items.map((item, itemIndex) => (
                      <li
                        key={`${item}-${itemIndex}`}
                        className="flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          )}

          <div className="rounded-lg border border-border/60 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Signals so far
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
              <span className="rounded border border-border/60 bg-secondary/30 px-2 py-1">
                {insights.actions.length} actions
              </span>
              <span className="rounded border border-border/60 bg-secondary/30 px-2 py-1">
                {insights.decisions.length} decisions
              </span>
              <span className="rounded border border-border/60 bg-secondary/30 px-2 py-1">
                {insights.risks.length} risks
              </span>
              <span className="rounded border border-border/60 bg-secondary/30 px-2 py-1">
                {insights.topics.length} topics
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={askQuestion}
          className="flex items-center gap-2 border-t border-border/70 p-3"
        >
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this meeting…"
            className="h-8 text-xs"
            aria-label="Ask the meeting copilot"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!question.trim()}
            aria-label="Ask copilot"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </TabsContent>

      <TabsContent
        value="people"
        className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {controller.participants.map((participant) => (
            <div
              key={participant.peerId}
              className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/25 px-2.5 py-2"
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-semibold"
                style={{
                  backgroundColor: `${participant.avatarColor}26`,
                  borderColor: `${participant.avatarColor}59`,
                  color: participant.avatarColor,
                }}
              >
                {participant.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {participant.fullName}
                  {participant.isSelf ? ' (you)' : ''}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {participant.connection === 'connecting' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Connecting
                    </>
                  ) : (
                    <>
                      {participant.micOn ? (
                        <Mic className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <MicOff className="h-3 w-3 text-rose-400" />
                      )}
                      {participant.cameraOn ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <VideoOff className="h-3 w-3" />
                      )}
                      {participant.sharing ? (
                        <MonitorUp className="h-3 w-3 text-primary" />
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {!participant.isSelf && participant.connection === 'connected' ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onToggleRemoteMute(participant.peerId)}
                  title={
                    remoteMuted.has(participant.peerId)
                      ? `Unmute ${participant.fullName} for me`
                      : `Mute ${participant.fullName} for me`
                  }
                  aria-label={
                    remoteMuted.has(participant.peerId)
                      ? 'Unmute participant for me'
                      : 'Mute participant for me'
                  }
                >
                  {remoteMuted.has(participant.peerId) ? (
                    <VolumeX className="h-3.5 w-3.5 text-rose-300" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-border/70 p-3">
          <Button variant="secondary" size="sm" className="w-full" onClick={onInvite}>
            <Copy className="h-3.5 w-3.5" />
            Copy invite link
          </Button>
          <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
            Demo rooms connect tabs in this browser. Add LiveKit credentials for
            real devices.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
