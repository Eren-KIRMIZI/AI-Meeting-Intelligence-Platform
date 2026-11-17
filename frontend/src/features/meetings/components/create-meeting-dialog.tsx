import { useEffect, useState } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
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
import { useCreateMeeting } from '@/hooks/use-workspace';
import type { MeetingPlatform } from '@/types';

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function localDate(daysFromNow = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
}: CreateMeetingDialogProps) {
  const createMeeting = useCreateMeeting();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [platform, setPlatform] = useState<MeetingPlatform>('google_meet');
  const [agenda, setAgenda] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDate(localDate());
    setTime('10:00');
    setDuration('45');
    setPlatform('google_meet');
    setAgenda('');
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('A meeting title is required');
      return;
    }

    const startsAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      toast.error('Choose a valid date and time');
      return;
    }

    const durationMinutes = Math.min(
      480,
      Math.max(15, Number(duration) || 30)
    );

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
      },
      {
        onSuccess: (meeting) => {
          toast.success(`“${meeting.title}” scheduled`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not schedule the meeting'
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription>
            Add the conversation and agenda so Nova can prepare the brief.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Meeting title" htmlFor="meeting-title">
            <Input
              id="meeting-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Weekly product sync"
              autoFocus
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Date" htmlFor="meeting-date">
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <Field label="Time" htmlFor="meeting-time">
              <Input
                id="meeting-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </Field>
            <Field label="Minutes" htmlFor="meeting-duration">
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

          <Field label="Platform" htmlFor="meeting-platform">
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
              <option value="in_person">In person</option>
              <option value="nova_live">Nova Live</option>
            </NativeSelect>
          </Field>

          <Field
            label="Agenda"
            htmlFor="meeting-agenda"
            hint="One agenda item per line. Nova uses these to prepare the brief."
          >
            <Textarea
              id="meeting-agenda"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              placeholder={'Launch readiness\nOpen decisions\nNext steps'}
              className="min-h-[92px]"
            />
          </Field>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              Schedule meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
