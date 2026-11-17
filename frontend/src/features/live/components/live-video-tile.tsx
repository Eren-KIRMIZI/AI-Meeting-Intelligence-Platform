import { useEffect, useRef } from 'react';
import { Loader2, MicOff, MonitorUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveParticipant } from '@/types';

interface LiveVideoTileProps {
  participant: LiveParticipant;
  stream: MediaStream | null;
  muted?: boolean;
  featured?: boolean;
}

export function LiveVideoTile({
  participant,
  stream,
  muted = false,
  featured = false,
}: LiveVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(
    stream &&
      stream.getVideoTracks().length > 0 &&
      (participant.cameraOn || participant.sharing)
  );
  const mirrored = participant.isSelf && !participant.sharing;

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    element.srcObject = stream ?? null;
    if (stream) {
      void element.play().catch(() => undefined);
    }

    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  return (
    <div
      className={cn(
        'group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0b1018] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]',
        featured && 'ring-1 ring-primary/50',
        participant.connection === 'disconnected' && 'opacity-60'
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || participant.isSelf}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          hasVideo ? 'opacity-100' : 'opacity-0',
          mirrored && '-scale-x-100'
        )}
      />

      {!hasVideo ? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_30%,rgba(91,141,239,0.16),transparent_60%)]">
          <div className="flex flex-col items-center gap-2.5">
            <span
              className="grid h-16 w-16 place-items-center rounded-full border text-lg font-semibold"
              style={{
                backgroundColor: `${participant.avatarColor}26`,
                borderColor: `${participant.avatarColor}59`,
                color: participant.avatarColor,
              }}
            >
              {participant.initials}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {participant.cameraOn ? 'Camera starting…' : 'Camera off'}
            </span>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/25 to-transparent px-3 pb-2.5 pt-8">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-medium text-white/90">
            {participant.fullName}
            {participant.isSelf ? ' (you)' : ''}
          </span>
          {participant.connection === 'connecting' ? (
            <Loader2 className="h-3 w-3 animate-spin text-amber-300" />
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {participant.sharing ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              <MonitorUp className="h-3 w-3" />
              Sharing
            </span>
          ) : null}
          {!participant.micOn ? (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-rose-300">
              <MicOff className="h-3 w-3" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
