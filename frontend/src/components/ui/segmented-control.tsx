import { cn } from '@/lib/utils';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Array<SegmentedControlOption<T>>;
  label: string;
  className?: string;
}

/**
 * A filter-style toggle group. Unlike `Tabs`, no panel is associated with each
 * option, so this avoids dangling `aria-controls` references while still
 * exposing the current selection through `aria-pressed`.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-border/70 bg-secondary/40 p-1 text-muted-foreground',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'hover:text-foreground'
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <>
                {' '}
                <span className="text-[10px] text-muted-foreground">
                  {option.count}
                </span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
