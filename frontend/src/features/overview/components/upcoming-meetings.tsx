import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateTile } from '@/components/common/date-tile';
import { AvatarStack } from '@/components/common/user-avatar';
import { MeetingStatusBadge } from '@/components/common/status-badges';
import { formatTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { Meeting } from '@/types';

const platformLabels: Record<Meeting['platform'], string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
  in_person: 'In person',
  nova_live: 'Nova Live',
};

export function UpcomingMeetings({
  meetings,
  onSchedule,
}: {
  meetings: Meeting[];
  onSchedule: () => void;
}) {
  const { t } = useI18n();
  const upcoming = meetings
    .filter((meeting) => meeting.status === 'scheduled' || meeting.status === 'live')
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle>{t('Upcoming meetings')}</CardTitle>
          <CardDescription className="mt-1">
            {t('Agendas and briefs for the next conversations')}
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/meetings">
            {t('View all')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center">
            <p className="text-xs font-medium text-foreground">
              {t('No meetings scheduled')}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t('Put the next conversation on the calendar.')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onSchedule}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              {t('Schedule meeting')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((meeting) => (
              <div
                key={meeting.id}
                className="flex gap-3 rounded-lg border border-border/70 bg-secondary/20 p-2.5"
              >
                <DateTile date={meeting.startsAt} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {meeting.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatTime(meeting.startsAt)} ·{' '}
                    {t('{{count}} min', { count: meeting.durationMinutes })}
                    {' · '}
                    {t(platformLabels[meeting.platform])}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <AvatarStack users={meeting.participants} max={4} size="xs" />
                    <MeetingStatusBadge status={meeting.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {upcoming.length > 0 ? (
          <Button
            variant="subtle"
            size="sm"
            className="mt-3 w-full"
            onClick={onSchedule}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {t('Schedule another meeting')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
