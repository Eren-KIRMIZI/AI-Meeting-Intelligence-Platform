import {
  CalendarDays,
  HardDrive,
  Mail,
  MessageSquare,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Integration } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  video: Video,
  chat: MessageSquare,
  mail: Mail,
  storage: HardDrive,
};

const providerAccent: Record<string, string> = {
  google_calendar: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  google_meet: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  microsoft_outlook: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  microsoft_teams: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  slack: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  zoom: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  google_drive: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
};

export function IntegrationIcon({
  integration,
  className,
}: {
  integration: Integration;
  className?: string;
}) {
  const Icon = iconMap[integration.icon] ?? Video;
  return (
    <span
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-lg border',
        providerAccent[integration.provider] ??
          'border-border bg-secondary text-muted-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
