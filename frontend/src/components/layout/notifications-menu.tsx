import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  GitBranch,
  ListTodo,
  MessageSquare,
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
  useMarkNotificationRead,
  useMarkNotificationsRead,
  useNotifications,
} from '@/hooks/use-workspace';
import { toast } from 'sonner';
import type { AppNotification } from '@/types';

const notificationIcons = {
  meeting: CalendarDays,
  task: ListTodo,
  decision: GitBranch,
  mention: MessageSquare,
} as const;

const notificationTones = {
  meeting: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  task: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  decision: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  mention: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
} as const;

const notificationPaths: Record<AppNotification['type'], string> = {
  meeting: '/meetings',
  task: '/tasks',
  decision: '/decisions',
  mention: '/overview',
};

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
  const markAllRead = useMarkNotificationsRead();
  const markRead = useMarkNotificationRead();
  const unread = (data ?? []).filter((notification) => !notification.read).length;

  const openNotification = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    navigate(notificationPaths[notification.type]);
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
          ) : (data ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              You are all caught up.
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {(data ?? []).map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={openNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator className="m-0" />
        <button
          type="button"
          onClick={() => navigate('/overview')}
          className="flex w-full items-center justify-center gap-1 px-3 py-2.5 text-[11px] font-medium text-blue-400 transition-colors hover:bg-secondary/40"
        >
          View workspace activity
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
