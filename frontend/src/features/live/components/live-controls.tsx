import {
  Bot,
  Captions,
  Circle,
  MessageSquare,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/live/room';
import { useI18n } from '@/i18n';
import type { LiveRoomController } from '@/hooks/use-live-room';
import type { LivePanelTab } from './live-side-panel';

interface LiveControlsProps {
  controller: LiveRoomController;
  panel: LivePanelTab | null;
  onTogglePanel: (tab: LivePanelTab) => void;
  recording: boolean;
  recordingSupported: boolean;
  recordingSeconds: number;
  onToggleRecording: () => void;
  onEnd: () => void;
}

interface ControlButtonProps {
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function ControlButton({
  label,
  active = false,
  danger = false,
  disabled = false,
  onClick,
  children,
  className,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'group flex h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-lg border px-2 text-[9px] font-medium transition-all sm:min-w-[54px] sm:px-2.5',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/20 hover:bg-white/[0.08] hover:text-foreground',
        danger &&
          'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:border-rose-500/60 hover:bg-rose-500/25 hover:text-rose-200',
        disabled && 'cursor-not-allowed opacity-40 hover:border-white/10 hover:bg-white/[0.04]',
        className
      )}
    >
      {children}
      <span className="hidden leading-none sm:block">{label}</span>
    </button>
  );
}

export function LiveControls({
  controller,
  panel,
  onTogglePanel,
  recording,
  recordingSupported,
  recordingSeconds,
  onToggleRecording,
  onEnd,
}: LiveControlsProps) {
  const { t } = useI18n();
  const audioRoom = controller.mode === 'audio';

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-white/10 bg-[#070b12]/90 px-2 py-2.5 backdrop-blur sm:gap-2">
      <ControlButton
        label={controller.micOn ? t('Mute') : t('Unmute')}
        active={!controller.micOn}
        danger={!controller.micOn}
        onClick={controller.toggleMic}
      >
        {controller.micOn ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
      </ControlButton>

      <ControlButton
        label={controller.cameraOn ? t('Camera off') : t('Camera on')}
        active={!controller.cameraOn && !audioRoom}
        danger={!controller.cameraOn && !audioRoom}
        disabled={audioRoom}
        onClick={controller.toggleCamera}
      >
        {controller.cameraOn ? (
          <Video className="h-4 w-4" />
        ) : (
          <VideoOff className="h-4 w-4" />
        )}
      </ControlButton>

      <ControlButton
        label={controller.screenSharing ? t('Stop share') : t('Share')}
        active={controller.screenSharing}
        disabled={audioRoom}
        onClick={controller.toggleScreenShare}
      >
        {controller.screenSharing ? (
          <MonitorOff className="h-4 w-4" />
        ) : (
          <MonitorUp className="h-4 w-4" />
        )}
      </ControlButton>

      <ControlButton
        label={t('Captions')}
        active={controller.captionsActive}
        disabled={!controller.captionsSupported}
        onClick={controller.toggleCaptions}
      >
        <Captions className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        label={recording ? formatDuration(recordingSeconds) : t('Record')}
        danger={recording}
        disabled={!recordingSupported || !controller.localStream}
        onClick={onToggleRecording}
      >
        <Circle
          className={cn('h-4 w-4', recording && 'animate-pulse fill-current')}
        />
      </ControlButton>

      <span className="mx-0.5 hidden h-6 w-px bg-white/10 sm:block" />

      <ControlButton
        label={t('Chat')}
        active={panel === 'chat'}
        onClick={() => onTogglePanel('chat')}
      >
        <MessageSquare className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        label={t('Copilot')}
        active={panel === 'assistant'}
        onClick={() => onTogglePanel('assistant')}
      >
        <Bot className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        label={t('People')}
        active={panel === 'people'}
        onClick={() => onTogglePanel('people')}
      >
        <Users className="h-4 w-4" />
      </ControlButton>

      <button
        type="button"
        onClick={onEnd}
        className="ml-1 flex h-11 items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 text-xs font-medium text-rose-200 transition-colors hover:border-rose-500/60 hover:bg-rose-500/25 sm:px-4"
      >
        <PhoneOff className="h-4 w-4" />
        <span className="hidden sm:inline">{t('End meeting')}</span>
        <span className="sm:hidden">{t('End')}</span>
      </button>
    </div>
  );
}
