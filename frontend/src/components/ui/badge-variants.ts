import { cva } from 'class-variance-authority';

// Variants live outside the component file so the component module only
// exports React components and keeps fast refresh working.
export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-strong text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-transparent text-muted-foreground',
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
        danger: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
        info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
        violet: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
        neutral: 'border-border bg-secondary/60 text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
