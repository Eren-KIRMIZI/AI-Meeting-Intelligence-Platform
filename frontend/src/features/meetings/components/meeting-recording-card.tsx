import { Download, Film, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatBytes,
  formatRecordingLength,
  isVideoRecording,
} from '@/lib/recordings';
import { formatDateTime } from '@/lib/utils';
import type { MeetingRecording } from '@/types';

interface MeetingRecordingCardProps {
  recordings: MeetingRecording[];
}

/**
 * Plays back archived recordings on the meeting detail page. Demo recordings
 * stay in the browser session, so the storage badge is explicit about it.
 */
export function MeetingRecordingCard({ recordings }: MeetingRecordingCardProps) {
  if (recordings.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Film className="h-3.5 w-3.5 text-rose-400" />
          Recording
        </CardTitle>
        <Badge variant="outline" className="bg-secondary/30">
          {recordings.length} file{recordings.length === 1 ? '' : 's'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="rounded-xl border border-border/60 bg-secondary/20 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {recording.filename}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatBytes(recording.sizeBytes)}
                  </span>
                  <span>·</span>
                  <span>{formatRecordingLength(recording.durationSeconds)}</span>
                  <span>·</span>
                  <span>{formatDateTime(recording.createdAt)}</span>
                  <Badge
                    variant={recording.storage === 'workspace' ? 'success' : 'neutral'}
                  >
                    {recording.storage === 'workspace'
                      ? 'Workspace storage'
                      : 'This browser only'}
                  </Badge>
                </div>
              </div>

              {recording.url ? (
                <Button asChild variant="outline" size="sm" className="h-7 text-[10px]">
                  <a href={recording.url} download={recording.filename}>
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                </Button>
              ) : null}
            </div>

            {recording.url ? (
              isVideoRecording(recording.mimeType) ? (
                <video
                  controls
                  preload="metadata"
                  src={recording.url}
                  aria-label={`Recording ${recording.filename}`}
                  className="mt-3 aspect-video w-full rounded-lg border border-border/60 bg-black"
                />
              ) : (
                <audio
                  controls
                  preload="metadata"
                  src={recording.url}
                  aria-label={`Recording ${recording.filename}`}
                  className="mt-3 w-full"
                />
              )
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-2 text-[10px] text-muted-foreground">
                The playback link has expired. Reload the page to request a fresh
                signed link.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
