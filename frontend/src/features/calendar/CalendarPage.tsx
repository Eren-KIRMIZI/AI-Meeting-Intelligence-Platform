import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/select-native';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  useCalendarEvents,
  useIntegrations,
  useProjects,
} from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import {
  addDays,
  buildReminders,
  conflictsForEvent,
  dayKey,
  detectConflicts,
  eventsInRange,
  findFreeSlots,
  groupEventsByDay,
  monthGrid,
  weekDays,
} from '@/lib/scheduling';
import { cn, formatDate, formatTime } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/preferences-store';
import { CreateMeetingDialog } from '@/features/meetings/components/create-meeting-dialog';
import type { CalendarEvent } from '@/types';

type CalendarView = 'week' | 'month';

const kindTone: Record<CalendarEvent['kind'], string> = {
  meeting: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
  external: 'border-violet-500/30 bg-violet-500/10 text-violet-100',
  focus: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
};

function EventChip({
  event,
  conflict,
  compact = false,
}: {
  event: CalendarEvent;
  conflict: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const className = cn(
    'block rounded-md border px-1.5 py-1 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring',
    kindTone[event.kind],
    conflict && 'ring-1 ring-rose-400/70',
    compact ? 'text-[10px]' : 'text-[11px]'
  );

  const content = (
    <>
      <span className="flex items-center gap-1 font-medium">
        {conflict ? (
          <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-rose-300" />
        ) : null}
        <span className="truncate">{event.title}</span>
      </span>
      {!compact ? (
        <span className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
          <Clock3 className="h-2.5 w-2.5" />
          {formatTime(event.startsAt)}
        </span>
      ) : null}
    </>
  );

  if (event.meetingId) {
    return (
      <Link to={`/meetings/${event.meetingId}`} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} title={t('External calendar event')}>
      {content}
    </div>
  );
}

export function CalendarPage() {
  const { t } = useI18n();
  const weekStart = usePreferencesStore((state) => state.weekStart);
  const calendar = useCalendarEvents();
  const integrations = useIntegrations();
  const projects = useProjects();
  const [view, setView] = useState<CalendarView>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [projectId, setProjectId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [initialStartsAt, setInitialStartsAt] = useState<string | null>(null);

  const events = useMemo(() => calendar.data ?? [], [calendar.data]);
  const filtered = useMemo(
    () =>
      projectId
        ? events.filter((event) => event.projectId === projectId)
        : events,
    [events, projectId]
  );

  const days = useMemo(
    () =>
      view === 'week'
        ? weekDays(anchor, weekStart)
        : monthGrid(anchor, weekStart),
    [anchor, view, weekStart]
  );

  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];
  const rangeEvents = useMemo(
    () => eventsInRange(filtered, rangeStart, rangeEnd),
    [filtered, rangeStart, rangeEnd]
  );
  const grouped = useMemo(() => groupEventsByDay(rangeEvents), [rangeEvents]);
  const conflicts = useMemo(() => detectConflicts(filtered), [filtered]);
  const reminders = useMemo(
    () => buildReminders(filtered).slice(0, 6),
    [filtered]
  );
  const connectedCalendars = (integrations.data ?? []).filter(
    (integration) =>
      integration.category === 'Calendar' && integration.status === 'connected'
  ).length;

  const upcoming = eventsInRange(
    filtered,
    new Date(),
    addDays(new Date(), 7)
  ).length;
  const pendingReminders = reminders.filter(
    (reminder) => reminder.status === 'pending'
  ).length;
  const freeSlot = findFreeSlots(filtered, anchor, 30)[0];

  const navigate = (direction: -1 | 1) => {
    setAnchor((current) => {
      if (view === 'week') return addDays(current, direction * 7);
      const next = new Date(current);
      next.setDate(1);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  const rangeLabel =
    view === 'week'
      ? t('{{start}} – {{end}}', {
          start: formatDate(rangeStart, { month: 'short', day: 'numeric' }),
          end: formatDate(rangeEnd, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        })
      : formatDate(anchor, { month: 'long', year: 'numeric' });

  if (calendar.isLoading) return <PageSkeleton />;

  if (calendar.error) {
    return (
      <ErrorState
        description={
          calendar.error instanceof Error
            ? calendar.error.message
            : t('The calendar could not be loaded.')
        }
        onRetry={() => void calendar.refetch()}
      />
    );
  }

  const conflictFor = (event: CalendarEvent): boolean =>
    conflictsForEvent(conflicts, event.id).length > 0;

  const summary = [
    {
      label: t('Next 7 days'),
      value: upcoming,
      icon: CalendarDays,
      tone: 'text-blue-400',
    },
    {
      label: t('Conflicts'),
      value: conflicts.length,
      icon: AlertTriangle,
      tone: 'text-rose-400',
    },
    {
      label: t('Reminders'),
      value: pendingReminders,
      icon: BellRing,
      tone: 'text-amber-400',
    },
    {
      label: t('Connected calendars'),
      value: connectedCalendars,
      icon: CalendarRange,
      tone: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Calendar & scheduling')}
        description={t(
          'Plan meetings, invite participants, catch conflicts and keep reminders in one calendar.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{count}} events', { count: events.length })}
          </Badge>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/integrations">
                <CalendarRange className="h-3.5 w-3.5" />
                {t('Sync calendars')}
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setInitialStartsAt(null);
                setCreateOpen(true);
              }}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              {t('Schedule meeting')}
            </Button>
          </>
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
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={view}
            onValueChange={setView}
            label={t('Calendar view')}
            options={[
              { value: 'week', label: t('Week') },
              { value: 'month', label: t('Month') },
            ]}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => navigate(-1)}
              aria-label={t('Previous period')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px]"
              onClick={() => setAnchor(new Date())}
            >
              {t('Today')}
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => navigate(1)}
              aria-label={t('Next period')}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="text-xs font-medium text-foreground">{rangeLabel}</span>
        </div>

        <div className="w-full sm:max-w-[220px]">
          <NativeSelect
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            aria-label={t('Filter by project')}
            className="h-8 text-xs"
          >
            <option value="">{t('All projects')}</option>
            {(projects.data ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {view === 'week' ? (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <div className="grid min-w-[760px] grid-cols-7 divide-x divide-border/70">
                  {days.map((day) => {
                    const dayEvents = grouped.get(dayKey(day)) ?? [];
                    const today = dayKey(day) === dayKey(new Date());
                    return (
                      <div key={dayKey(day)} className="min-h-[280px]">
                        <div
                          className={cn(
                            'border-b border-border/70 px-2 py-2 text-center',
                            today && 'bg-blue-500/10'
                          )}
                        >
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {formatDate(day, { weekday: 'short' })}
                          </p>
                          <p
                            className={cn(
                              'font-display text-sm font-semibold',
                              today ? 'text-blue-300' : 'text-foreground'
                            )}
                          >
                            {day.getDate()}
                          </p>
                        </div>
                        <div className="space-y-1 p-1.5">
                          {dayEvents.map((event) => (
                            <EventChip
                              key={event.id}
                              event={event}
                              conflict={conflictFor(event)}
                            />
                          ))}
                          {dayEvents.length === 0 ? (
                            <p className="px-1 pt-2 text-center text-[10px] text-muted-foreground">
                              {t('No events')}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-7 border-b border-border/70 bg-secondary/20">
                    {weekDays(anchor, weekStart).map((day) => (
                      <div
                        key={`head-${dayKey(day)}`}
                        className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {formatDate(day, { weekday: 'short' })}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {days.map((day) => {
                      const dayEvents = grouped.get(dayKey(day)) ?? [];
                      const outside = day.getMonth() !== anchor.getMonth();
                      const today = dayKey(day) === dayKey(new Date());
                      return (
                        <div
                          key={dayKey(day)}
                          className={cn(
                            'min-h-[96px] border-b border-r border-border/60 p-1.5',
                            outside && 'bg-secondary/10 opacity-60'
                          )}
                        >
                          <p
                            className={cn(
                              'mb-1 text-[11px] font-medium',
                              today
                                ? 'inline-grid h-5 w-5 place-items-center rounded-full bg-blue-500/25 text-blue-200'
                                : 'text-muted-foreground'
                            )}
                          >
                            {day.getDate()}
                          </p>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <EventChip
                                key={event.id}
                                event={event}
                                conflict={conflictFor(event)}
                                compact
                              />
                            ))}
                            {dayEvents.length > 2 ? (
                              <p className="px-1 text-[10px] text-muted-foreground">
                                {t('+{{count}} more', {
                                  count: dayEvents.length - 2,
                                })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t('Agenda')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rangeEvents.length === 0 ? (
                <div className="px-4 pb-4">
                  <EmptyState
                    icon={CalendarDays}
                    title={t('Nothing scheduled in this period')}
                    description={t(
                      'Schedule a meeting or move to another week to see the agenda.'
                    )}
                    action={
                      <Button
                        size="sm"
                        onClick={() => {
                          setInitialStartsAt(null);
                          setCreateOpen(true);
                        }}
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        {t('Schedule meeting')}
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {[...grouped.entries()].map(([key, dayEvents]) => (
                    <div key={key} className="px-4 py-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {formatDate(dayEvents[0].startsAt, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="space-y-1.5">
                        {dayEvents.map((event) => {
                          const conflictCount = conflictsForEvent(
                            conflicts,
                            event.id
                          ).length;
                          return (
                            <div
                              key={event.id}
                              className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-secondary/20 px-2.5 py-1.5"
                            >
                              <span className="w-10 shrink-0 text-[11px] tabular text-muted-foreground">
                                {formatTime(event.startsAt)}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                                {event.meetingId ? (
                                  <Link
                                    to={`/meetings/${event.meetingId}`}
                                    className="outline-none hover:underline focus-visible:ring-1 focus-visible:ring-ring"
                                  >
                                    {event.title}
                                  </Link>
                                ) : (
                                  event.title
                                )}
                              </span>
                              {event.projectName ? (
                                <Badge variant="outline" className="text-[10px]">
                                  {event.projectName}
                                </Badge>
                              ) : null}
                              {conflictCount > 0 ? (
                                <Badge variant="danger" className="text-[10px]">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {t('{{count}} conflicts', {
                                    count: conflictCount,
                                  })}
                                </Badge>
                              ) : null}
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Users className="h-2.5 w-2.5" />
                                {event.participantIds.length}
                              </span>
                              {event.location ? (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {event.location}
                                </span>
                              ) : null}
                              {event.platform ? (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Video className="h-2.5 w-2.5" />
                                  {t('Online')}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                {t('Conflict detection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {conflicts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('No overlapping meetings in this calendar.')}
                </p>
              ) : (
                conflicts.slice(0, 5).map((conflict) => {
                  const first = events.find(
                    (event) => event.id === conflict.eventId
                  );
                  const second = events.find(
                    (event) => event.id === conflict.withEventId
                  );
                  return (
                    <div
                      key={`${conflict.eventId}-${conflict.withEventId}`}
                      className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-2"
                    >
                      <p className="text-[11px] font-medium text-rose-100">
                        {first?.title ?? t('Meeting')} ·{' '}
                        {second?.title ?? t('Meeting')}
                      </p>
                      <p className="mt-0.5 text-[10px] text-rose-200/80">
                        {t('{{count}} min overlap · {{severity}}', {
                          count: conflict.overlapMinutes,
                          severity: t(
                            conflict.severity === 'full'
                              ? 'full overlap'
                              : 'partial overlap'
                          ),
                        })}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BellRing className="h-4 w-4 text-amber-400" />
                {t('Upcoming reminders')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reminders.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('No reminders in the next 72 hours.')}
                </p>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={`${reminder.eventId}-${reminder.minutesBefore}`}
                    className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/20 px-2.5 py-2"
                  >
                    <Clock3 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-foreground">
                        {reminder.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t('{{minutes}} min before · {{time}}', {
                          minutes: reminder.minutesBefore,
                          time: formatDate(reminder.remindAt, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        reminder.status === 'pending' ? 'outline' : 'secondary'
                      }
                      className="text-[9px]"
                    >
                      {t(reminder.status === 'pending' ? 'Pending' : 'Sent')}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-blue-400" />
                {t('Next free slot')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {freeSlot ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t('A 30-minute opening is available on this day.')}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatTime(freeSlot.startsAt)} –{' '}
                    {formatTime(freeSlot.endsAt)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setInitialStartsAt(freeSlot.startsAt);
                      setCreateOpen(true);
                    }}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    {t('Use this slot')}
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('This day is fully booked inside working hours.')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateMeetingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialStartsAt={initialStartsAt}
      />
    </div>
  );
}
