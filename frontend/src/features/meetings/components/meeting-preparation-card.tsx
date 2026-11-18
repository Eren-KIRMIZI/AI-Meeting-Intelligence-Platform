import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Circle,
  Loader2,
  Sparkles,
  Target,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMeetingPreparation } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import type { Meeting } from '@/types';

function readinessVariant(readiness: number) {
  if (readiness >= 80) return 'success' as const;
  if (readiness >= 60) return 'warning' as const;
  return 'neutral' as const;
}

/**
 * The brief that runs before the meeting: what we want to leave with, the
 * questions worth asking, the context that matters and the risks to raise.
 */
export function MeetingPreparationCard({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const preparationQuery = useMeetingPreparation(meeting.id);

  if (preparationQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 px-5 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('Preparing the meeting brief…')}
        </CardContent>
      </Card>
    );
  }

  const preparation = preparationQuery.data;
  if (!preparation) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          {t('AI meeting preparation')}
        </CardTitle>
        <Badge variant={readinessVariant(preparation.readiness)}>
          {t('{{count}}% ready', { count: preparation.readiness })}
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <Progress
              value={preparation.readiness}
              aria-label={t('Preparation readiness')}
            />
            <p className="mt-2 text-xs font-medium text-foreground">
              {t(preparation.headline)}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {t(preparation.objective)}
            </p>
          </div>

          {preparation.questions.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('Questions to ask')}
              </p>
              <ul className="mt-2 space-y-1.5">
                {preparation.questions.map((question) => (
                  <li
                    key={question}
                    className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"
                  >
                    <Circle className="mt-1 h-2 w-2 shrink-0 text-blue-400/70" />
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {preparation.suggestedAgenda.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Target className="h-3 w-3" />
                {t('Suggested agenda')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preparation.suggestedAgenda.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="bg-secondary/30"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {preparation.context.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('Context from past meetings')}
              </p>
              <div className="mt-2 space-y-2">
                {preparation.context.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2"
                  >
                    <p className="text-[11px] font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                    {item.meetingId ? (
                      <Link
                        to={`/meetings/${item.meetingId}`}
                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-blue-400 hover:text-blue-300"
                      >
                        {t('Open meeting')}
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {preparation.risks.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <TriangleAlert className="h-3 w-3 text-amber-400" />
                {t('Risks to raise')}
              </p>
              <ul className="mt-2 space-y-1.5">
                {preparation.risks.map((risk) => (
                  <li
                    key={risk}
                    className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[10px] leading-relaxed text-amber-100/90"
                  >
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {preparation.attendeeNotes.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <UserRound className="h-3 w-3" />
                {t('Attendee focus')}
              </p>
              <div className="mt-2 space-y-2">
                {preparation.attendeeNotes.map((note) => (
                  <div key={note.userId} className="flex items-start gap-2">
                    <UserAvatar
                      user={{
                        id: note.userId,
                        fullName: note.name,
                        email: '',
                        initials: note.name.slice(0, 2).toUpperCase(),
                        avatarColor: '#64748B',
                      }}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-foreground">
                        {note.name}
                      </p>
                      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                        {note.focus}
                      </p>
                      {note.openTasks > 0 ? (
                        <p className="text-[10px] text-muted-foreground">
                          {t('{{count}} open follow-ups', {
                            count: note.openTasks,
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
