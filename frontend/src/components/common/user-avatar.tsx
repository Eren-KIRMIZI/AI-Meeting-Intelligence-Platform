import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import type { UserProfile } from '@/types';
import { UserRound } from 'lucide-react';

const sizeMap = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-6 w-6 text-[9px]',
  md: 'h-8 w-8 text-[10px]',
  lg: 'h-10 w-10 text-xs',
  xl: 'h-14 w-14 text-sm',
} as const;

export type AvatarSize = keyof typeof sizeMap;

interface UserAvatarProps {
  user: UserProfile | null | undefined;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
}

export function UserAvatar({
  user,
  size = 'sm',
  className,
  ring = false,
}: UserAvatarProps) {
  const name = user?.fullName ?? 'Unassigned';
  const color = user?.avatarColor ?? '#64748B';

  return (
    <Avatar
      className={cn(sizeMap[size], ring && 'ring-2 ring-card', className)}
      title={name}
    >
      {user?.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt={name} />
      ) : null}
      <AvatarFallback
        style={{
          backgroundColor: `${color}26`,
          color,
          borderColor: `${color}40`,
        }}
        className="border"
      >
        {user ? getInitials(name) : <UserRound className="h-3 w-3" />}
      </AvatarFallback>
    </Avatar>
  );
}

interface AvatarStackProps {
  users: UserProfile[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarStack({
  users,
  max = 4,
  size = 'sm',
  className,
}: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <div className={cn('flex items-center -space-x-1.5', className)}>
      {visible.map((user) => (
        <UserAvatar
          key={user.id}
          user={user}
          size={size}
          ring
          className="transition-transform hover:z-10 hover:-translate-y-0.5"
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            'grid place-items-center rounded-full border border-border bg-secondary font-medium text-muted-foreground ring-2 ring-card',
            sizeMap[size]
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
