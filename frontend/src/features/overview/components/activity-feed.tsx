import {
  CalendarDays,
  FolderKanban,
  GitBranch,
  ListTodo,
  MessageSquare,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { Activity, ActivityType } from '@/types';

const activityIcons: Record<ActivityType, LucideIcon> = {
  task: ListTodo,
  comment: MessageSquare,
  meeting: CalendarDays,
  decision: GitBranch,
  assignment: UserRound,
  project: FolderKanban,
  insight: Sparkles,
};

const activityTones: Record<ActivityType, string> = {
  task: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  comment: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  meeting: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  decision: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  assignment: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
  project: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  insight: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400',
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle>{t('Recent activity')}</CardTitle>
          <CardDescription className="mt-1">
            {t('What changed across the workspace')}
          </CardDescription>
        </div>
        <Badge variant="outline" className="shrink-0">
          {t('Live')}
        </Badge>
      </CardHeader>

      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
            {t('No activity yet. New work will appear here.')}
          </p>
        ) : (
          <div className="space-y-1">
            {activities.slice(0, 5).map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex gap-2.5 rounded-md px-1 py-2 transition-colors hover:bg-secondary/30"
                >
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border ${activityTones[activity.type]}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-medium text-foreground">
                        {activity.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <UserAvatar user={activity.actor} size="xs" />
                      <span className="truncate text-[10px] text-muted-foreground">
                        {activity.actor.fullName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
