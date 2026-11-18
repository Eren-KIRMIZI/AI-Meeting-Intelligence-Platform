import { useEffect, useState } from 'react';
import { CalendarPlus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Field } from '@/components/common/field';
import { UserAvatar } from '@/components/common/user-avatar';
import { useCreateMeeting, useTeam } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import { templateAgenda } from '@/lib/templates';
import { cn } from '@/lib/utils';
import type { Meeting, MeetingPlatform, MeetingTemplate } from '@/types';

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the date and time, e.g. from a free calendar slot. */
  initialStartsAt?: string | null;
  /** Pre-fills title, duration and agenda from a meeting template. */
  template?: MeetingTemplate | null;
  onScheduled?: (meeting: Meeting) => void;
}

function localDate(daysFromNow = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localTime(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
  initialStartsAt,
  template,
  onScheduled,
}: CreateMeetingDialogProps) {
  const createMeeting = useCreateMeeting();
  const team = useTeam({ enabled: open });
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [platform, setPlatform] = useState<MeetingPlatform>('google_meet');
  const [agenda, setAgenda] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [reminder, setReminder] = useState('15');

  useEffect(() => {
    if (!open) return;
    setTitle(template?.name ?? '');
    setDate(
      initialStartsAt ? initialStartsAt.slice(0, 10) : localDate()
    );
    setTime(initialStartsAt ? localTime(initialStartsAt) : '10:00');
    setDuration(template ? String(template.durationMinutes) : '45');
    setPlatform('google_meet');
    setAgenda(template ? templateAgenda(template).join('\n') : '');
    setParticipantIds([]);
    setReminder('15');
  }, [open, initialStartsAt, template]);

  const toggleParticipant = (memberId: string) => {
    setParticipantIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(t('A meeting title is required'));
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      toast.error(t('Choose a valid date and time'));
      return;
    }

    const durationMinutes = Math.min(
      480,
      Math.max(15, Number(duration) || 30)
    );
    const reminderMinutes = Number(reminder);

    createMeeting.mutate(
      {
        title: trimmedTitle,
        startsAt: startsAt.toISOString(),
        durationMinutes,
        platform,
        agenda: agenda
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        participantIds,
        reminderMinutes:
          reminderMinutes > 0 ? [reminderMinutes] : [],
      },
      {
        onSuccess: (meeting) => {
          toast.success(t('“{{title}}” scheduled', { title: meeting.title }));
          onScheduled?.(meeting);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('Could not schedule the meeting')
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Schedule a meeting')}</DialogTitle>
          <DialogDescription>
            {t(
              'Add the conversation and agenda so Nova can prepare the brief.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('Meeting title')} htmlFor="meeting-title">
            <Input
              id="meeting-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('e.g. Weekly product sync')}
              autoFocus
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t('Date')} htmlFor="meeting-date">
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <Field label={t('Time')} htmlFor="meeting-time">
              <Input
                id="meeting-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </Field>
            <Field label={t('Minutes')} htmlFor="meeting-duration">
              <Input
                id="meeting-duration"
                type="number"
                min={15}
                max={480}
                step={5}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </Field>
          </div>

          <Field label={t('Platform')} htmlFor="meeting-platform">
            <NativeSelect
              id="meeting-platform"
              value={platform}
              onChange={(event) =>
                setPlatform(event.target.value as MeetingPlatform)
              }
            >
              <option value="google_meet">Google Meet</option>
              <option value="microsoft_teams">Microsoft Teams</option>
              <option value="zoom">Zoom</option>
              <option value="in_person">{t('In person')}</option>
              <option value="nova_live">Nova Live</option>
            </NativeSelect>
          </Field>

          <Field
            label={t('Participants')}
            hint={t('Invite teammates and send the calendar event to everyone.')}
          >
            <div className="grid max-h-[132px] gap-1 overflow-y-auto rounded-md border border-border/70 bg-secondary/20 p-1.5 sm:grid-cols-2">
              {(team.data ?? []).map((member) => {
                const selected = participantIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleParticipant(member.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring',
                      selected
                        ? 'bg-blue-500/15 text-blue-100'
                        : 'text-muted-foreground hover:bg-secondary/60'
                    )}
                  >
                    <UserAvatar user={member} size="xs" />
                    <span className="min-w-0 flex-1 truncate">
                      {member.fullName}
                    </span>
                    <span
                      className={cn(
                        'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border',
                        selected
                          ? 'border-blue-400/60 bg-blue-500/30 text-blue-100'
                          : 'border-border'
                      )}
                    >
                      {selected ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label={t('Reminder')} htmlFor="meeting-reminder">
            <NativeSelect
              id="meeting-reminder"
              value={reminder}
              onChange={(event) => setReminder(event.target.value)}
            >
              <option value="0">{t('No reminder')}</option>
              <option value="5">{t('5 minutes before')}</option>
              <option value="15">{t('15 minutes before')}</option>
              <option value="30">{t('30 minutes before')}</option>
              <option value="60">{t('1 hour before')}</option>
            </NativeSelect>
          </Field>

          <Field
            label={t('Agenda')}
            htmlFor="meeting-agenda"
            hint={t(
              'One agenda item per line. Nova uses these to prepare the brief.'
            )}
          >
            <Textarea
              id="meeting-agenda"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              placeholder={t('Launch readiness\nOpen decisions\nNext steps')}
              className="min-h-[92px]"
            />
          </Field>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              {t('Schedule meeting')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
