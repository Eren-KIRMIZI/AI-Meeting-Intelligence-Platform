import {
  CalendarClock,
  CheckCircle2,
  FileText,
  GitBranch,
  ListTodo,
  Video,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AvatarStack } from '@/components/common/user-avatar';
import { MeetingStatusBadge } from '@/components/common/status-badges';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, formatTime } from '@/lib/utils';
import type { Meeting } from '@/types';

const platformLabels: Record<Meeting['platform'], string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
  in_person: 'In person',
};

export function MeetingBriefDialog({
  meeting,
  open,
  onOpenChange,
}: {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {meeting ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <MeetingStatusBadge status={meeting.status} />
                {meeting.transcriptReady ? (
                  <Badge variant="success">
                    <FileText className="h-3 w-3" />
                    Transcript ready
                  </Badge>
                ) : (
                  <Badge variant="outline">Transcript pending</Badge>
                )}
              </div>
              <DialogTitle className="mt-1 text-xl">{meeting.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                  <Video className="h-3 w-3" />
                  {platformLabels[meeting.platform]}
                </span>
                <span>{meeting.durationMinutes} minutes</span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[62vh] pr-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-secondary/25 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Participants
                    </p>
                    <p className="mt-0.5 truncate text-xs text-foreground">
                      {meeting.participants
                        .map((participant) => participant.fullName)
                        .join(', ') || 'No participants yet'}
                    </p>
                  </div>
                  <AvatarStack users={meeting.participants} max={4} />
                </div>

                {meeting.projectName ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Linked to {meeting.projectName}
                  </div>
                ) : null}

                <section>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ListTodo className="h-3.5 w-3.5 text-blue-400" />
                    Agenda
                  </h4>
                  {meeting.agenda.length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      No agenda was added for this meeting.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {meeting.agenda.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/20 px-2.5 py-2 text-xs text-foreground"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    Summary
                  </h4>
                  {meeting.summary ? (
                    <p className="mt-1.5 rounded-lg border border-border/70 bg-secondary/20 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                      {meeting.summary}
                    </p>
                  ) : (
                    <p className="mt-1.5 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                      The brief appears after the meeting is processed.
                    </p>
                  )}
                </section>

                {meeting.decisions.length > 0 ? (
                  <section>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <GitBranch className="h-3.5 w-3.5 text-violet-400" />
                      Decisions captured
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {meeting.decisions.map((decision) => (
                        <li
                          key={decision}
                          className="rounded-md border border-violet-500/20 bg-violet-500/5 px-2.5 py-2 text-xs text-foreground"
                        >
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {meeting.actionItems.length > 0 ? (
                  <section>
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Action items
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {meeting.actionItems.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/20 px-2.5 py-2 text-xs text-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
