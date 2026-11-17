import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function DateTile({
  date,
  className,
  muted = false,
}: {
  date: string;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border text-center',
        muted
          ? 'border-border/70 bg-secondary/40 text-muted-foreground'
          : 'border-border bg-secondary/60 text-foreground',
        className
      )}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {formatDate(date, { month: 'short' })}
      </span>
      <span className="font-display text-base font-semibold leading-tight tabular">
        {formatDate(date, { day: 'numeric' })}
      </span>
    </div>
  );
}
