import { useState } from 'react';
import { History, Link2, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/common/user-avatar';
import { DecisionStatusBadge } from '@/components/common/status-badges';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateDecision } from '@/hooks/use-workspace';
import { decisionActions, decisionActivityTitle, type DecisionActionKey } from '@/lib/decisions';
import { decisionStatusMeta } from '@/lib/status';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import type { Decision } from '@/types';

const impactVariant: Record<Decision['impact'], BadgeProps['variant']> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

const actionVariant: Record<DecisionActionKey, 'default' | 'outline' | 'ghost'> = {
  accept: 'default',
  reject: 'outline',
  supersede: 'outline',
  reopen: 'ghost',
};

interface DecisionDetailDialogProps {
  decision: Decision | null;
  onOpenChange: (open: boolean) => void;
}

export function DecisionDetailDialog({
  decision,
  onOpenChange,
}: DecisionDetailDialogProps) {
  const updateDecision = useUpdateDecision();
  const [note, setNote] = useState('');

  if (!decision) return null;

  const actions = decisionActions(decision.status);
  const history = [...decision.history].reverse();

  const applyStatus = (target: Decision['status'], description: string) => {
    updateDecision.mutate(
      { id: decision.id, input: { status: target, note } },
      {
        onSuccess: () => {
          setNote('');
          toast.success(decisionActivityTitle(target), { description });
        },
        onError: (error) => {
          toast.error('Decision could not be updated', {
            description:
              error instanceof Error ? error.message : 'Try again in a moment.',
          });
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <header className="border-b border-border/70 px-5 py-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <DecisionStatusBadge status={decision.status} />
            <Badge variant={impactVariant[decision.impact]}>
              {decision.impact} impact
            </Badge>
            {decision.projectName ? (
              <Badge variant="outline">{decision.projectName}</Badge>
            ) : null}
          </div>

          <DialogTitle className="mt-3 font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-foreground">
            {decision.title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {decision.context}
          </DialogDescription>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Owner
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-foreground/85">
                <UserAvatar user={decision.owner} size="xs" />
                <span className="truncate">{decision.owner.fullName}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Source
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 truncate text-foreground/85">
                <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{decision.meetingTitle}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Logged
              </dt>
              <dd className="mt-1 text-foreground/85">
                {formatDate(decision.decidedAt, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Updates
              </dt>
              <dd className="mt-1 text-foreground/85">
                {decision.history.length}
              </dd>
            </div>
          </dl>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <section className="px-5 py-4" aria-label="Decision status history">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <History className="h-3 w-3" />
              Status history
            </div>

            {history.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                No status changes have been recorded yet.
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
                {history.map((event, index) => (
                  <li key={event.id} className="relative flex gap-3">
                    {index < history.length - 1 ? (
                      <span className="absolute left-[6px] top-5 h-[calc(100%-8px)] w-px bg-border" />
                    ) : null}
                    <span
                      className={cn(
                        'relative mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-card',
                        decisionStatusMeta[event.status].dot
                      )}
                    />
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <DecisionStatusBadge status={event.status} />
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <UserRound className="h-3 w-3" />
                        {event.actor.fullName}
                      </p>
                      {event.note ? (
                        <p className="mt-1.5 rounded-lg border border-border/60 bg-secondary/20 px-2.5 py-1.5 text-xs leading-relaxed text-foreground/80">
                          {event.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </ScrollArea>

        <footer className="border-t border-border/70 bg-secondary/20 px-5 py-4">
          <label
            htmlFor="decision-status-note"
            className="text-[10px] uppercase tracking-wide text-muted-foreground"
          >
            Reason for the change
          </label>
          <textarea
            id="decision-status-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional, but useful when someone reads this decision later."
            rows={2}
            maxLength={280}
            className="mt-1.5 w-full resize-none rounded-md border border-border bg-transparent px-2.5 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5">
            {actions.map((action) => (
              <Button
                key={action.key}
                variant={actionVariant[action.key]}
                size="sm"
                className={cn(
                  'h-8 text-xs',
                  action.key === 'reject' &&
                    'border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                )}
                disabled={updateDecision.isPending}
                onClick={() =>
                  applyStatus(action.target, action.description)
                }
                title={action.description}
              >
                {updateDecision.isPending &&
                updateDecision.variables?.input.status === action.target ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {action.label}
              </Button>
            ))}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
