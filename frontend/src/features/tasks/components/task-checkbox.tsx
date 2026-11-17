import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useToggleTask } from '@/hooks/use-workspace';
import type { Task } from '@/types';

export function TaskCheckbox({ task }: { task: Task }) {
  const toggle = useToggleTask();

  return (
    <Checkbox
      checked={task.status === 'done'}
      disabled={toggle.isPending}
      aria-label={`Mark “${task.title}” as ${task.status === 'done' ? 'open' : 'done'}`}
      onCheckedChange={(checked) => {
        const done = checked === true;
        toggle.mutate(
          { id: task.id, done },
          {
            onSuccess: () => {
              toast.success(
                done
                  ? `“${task.title}” completed`
                  : `“${task.title}” reopened`
              );
            },
            onError: (error) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Could not update the task'
              );
            },
          }
        );
      }}
    />
  );
}
