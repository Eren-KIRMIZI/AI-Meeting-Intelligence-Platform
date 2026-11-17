import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  FileText,
  GitBranch,
  Search,
  Video,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { DateTile } from '@/components/common/date-tile';
import { AvatarStack } from '@/components/common/user-avatar';
import { MeetingStatusBadge } from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMeetings } from '@/hooks/use-workspace';
import { buildMeetingStats, countUpcomingMeetings } from '@/lib/metrics';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { CreateMeetingDialog } from './components/create-meeting-dialog';
import { MeetingBriefDialog } from './components/meeting-brief-dialog';
import type { Meeting } from '@/types';

const platformLabels: Record<Meeting['platform'], string> = {
  google_meet: 'Google Meet',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
  in_person: 'In person',
};

type MeetingTab = 'upcoming' | 'past';

export function MeetingsPage() {
  const meetings = useMeetings();
  const [tab, setTab] = useState<MeetingTab>('upcoming');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  const list = meetings.data ?? [];
  const stats = buildMeetingStats(list);
  const upcomingCount = countUpcomingMeetings(list);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matching = list.filter((meeting) => {
      if (!normalized) return true;
      return `${meeting.title} ${meeting.projectName ?? ''} ${meeting.agenda.join(
        ' '
      )}`
        .toLowerCase()
        .includes(normalized);
    });

    return matching
      .filter((meeting) =>
        tab === 'upcoming'
          ? meeting.status === 'scheduled' || meeting.status === 'live'
          : meeting.status !== 'scheduled' && meeting.status !== 'live'
      )
      .sort((a, b) => {
        const diff =
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
        return tab === 'upcoming' ? diff : -diff;
      });
  }, [list, query, tab]);

  if (meetings.isLoading) return <PageSkeleton />;

  if (meetings.error) {
    return (
      <ErrorState
        description={
          meetings.error instanceof Error
            ? meetings.error.message
            : 'Meetings could not be loaded.'
        }
        onRetry={() => void meetings.refetch()}
      />
    );
  }

  const openBrief = (meeting: Meeting) => {
    setSelected(meeting);
    setBriefOpen(true);
  };

  const summary = [
    {
      label: 'Upcoming',
      value: upcomingCount,
      icon: CalendarDays,
      tone: 'text-blue-400',
    },
    {
      label: 'Analyzed',
      value: stats.analyzed,
      icon: FileText,
      tone: 'text-emerald-400',
    },
    {
      label: 'Action items',
      value: stats.actionItems,
      icon: CheckCircle2,
      tone: 'text-amber-400',
    },
    {
      label: 'Decisions',
      value: stats.decisions,
      icon: GitBranch,
      tone: 'text-violet-400',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Meetings"
        description="Schedule the conversation, capture the signal and leave with an owned brief."
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {list.length} total
          </Badge>
        }
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule meeting
          </Button>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 divide-x divide-border/70 p-0 sm:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5 px-4 py-3.5">
                <span className={cn('icon-tile h-8 w-8 border-border/70', item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold leading-none tabular">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as MeetingTab)}>
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming
              <span className="ml-1 text-[10px] text-muted-foreground">
                {list.filter((meeting) => meeting.status === 'scheduled' || meeting.status === 'live').length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="past">
              Past briefs
              <span className="ml-1 text-[10px] text-muted-foreground">
                {list.filter((meeting) => meeting.status !== 'scheduled' && meeting.status !== 'live').length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-[300px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search meetings or agenda..."
            className="h-8 pl-8 text-xs"
            aria-label="Search meetings"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={query ? 'No meetings match this search' : 'No meetings here yet'}
          description={
            query
              ? 'Try another title, project or agenda item.'
              : tab === 'upcoming'
                ? 'Schedule the next conversation to start building the brief.'
                : 'Completed meetings and their briefs will appear here.'
          }
          action={
            tab === 'upcoming' && !query ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <CalendarPlus className="h-3.5 w-3.5" />
                Schedule meeting
              </Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/70">
              {filtered.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-secondary/20 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <DateTile date={meeting.startsAt} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {meeting.title}
                        </p>
                        <MeetingStatusBadge status={meeting.status} />
                        {meeting.transcriptReady ? (
                          <Badge variant="outline">
                            <FileText className="h-3 w-3" />
                            Transcript
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
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
                        <span>{meeting.durationMinutes} min</span>
                        {meeting.projectName ? <span>{meeting.projectName}</span> : null}
                      </p>
                      {meeting.agenda.length > 0 ? (
                        <p className="mt-1.5 line-clamp-1 text-[10px] text-muted-foreground/80">
                          Agenda: {meeting.agenda.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-[60px] sm:pl-0">
                    <AvatarStack users={meeting.participants} max={3} size="xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => openBrief(meeting)}
                    >
                      <FileText className="h-3 w-3" />
                      View brief
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />
      <MeetingBriefDialog
        meeting={selected}
        open={briefOpen}
        onOpenChange={setBriefOpen}
      />
    </div>
  );
}
