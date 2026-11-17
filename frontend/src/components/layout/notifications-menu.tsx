import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  GitBranch,
  ListTodo,
  MessageSquare,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  filterNotificationsByPreferences,
  notificationPath,
  unreadNotificationCount,
} from '@/lib/notifications';
import {
  useMarkNotificationRead,
  useMarkNotificationsRead,
  useNotifications,
} from '@/hooks/use-workspace';
import { usePreferencesStore } from '@/stores/preferences-store';
import { toast } from 'sonner';
import type { AppNotification } from '@/types';

const notificationIcons = {
  meeting: CalendarDays,
  task: ListTodo,
  decision: GitBranch,
  mention: MessageSquare,
  digest: Sparkles,
} as const;

const notificationTones = {
  meeting: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  task: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  decision: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  mention: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  digest: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
} as const;

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
}) {
  const Icon = notificationIcons[notification.type];
  return (
    <DropdownMenuItem
      onSelect={() => onOpen(notification)}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-none px-3 py-3 focus:bg-secondary/40 [&_svg]:!size-3.5 [&_svg]:!text-current',
        !notification.read && 'bg-primary/[0.035]'
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border',
          notificationTones[notification.type]
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-foreground">
            {notification.title}
          </p>
          {!notification.read ? (
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </DropdownMenuItem>
  );
}

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const preferences = usePreferencesStore((state) => state.notifications);
  const markAllRead = useMarkNotificationsRead();
  const markRead = useMarkNotificationRead();

  const all = data ?? [];
  const visible = filterNotificationsByPreferences(all, preferences);
  const hidden = all.length - visible.length;
  const unread = unreadNotificationCount(all, preferences);

  const openNotification = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    navigate(notificationPath(notification));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unread > 0 ? (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                {unread} new
              </span>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-[10px]"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() =>
              markAllRead.mutate(undefined, {
                onSuccess: () => toast.success('All notifications marked as read'),
              })
            }
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        </div>

        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">
                {all.length === 0
                  ? 'You are all caught up.'
                  : 'No notifications match your preferences.'}
              </p>
              {hidden > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-[10px]"
                  onClick={() => navigate('/settings?tab=notifications')}
                >
                  <Settings2 className="h-3 w-3" />
                  Review notification settings
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {visible.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={openNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {hidden > 0 && visible.length > 0 ? (
          <button
            type="button"
            onClick={() => navigate('/settings?tab=notifications')}
            className="flex w-full items-center gap-1.5 border-t border-border/70 px-3 py-2 text-left text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="h-3 w-3" />
            {hidden} notification{hidden === 1 ? '' : 's'} hidden by your
            preferences
          </button>
        ) : null}

        <DropdownMenuSeparator className="m-0" />
        <div className="flex items-center justify-between px-3 py-2">
          <button
            type="button"
            onClick={() => navigate('/settings?tab=notifications')}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="h-3 w-3" />
            Notification settings
          </button>
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="flex items-center gap-1 text-[10px] font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            View workspace activity
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
