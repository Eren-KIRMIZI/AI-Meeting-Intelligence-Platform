import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useToggleTask } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import type { Task } from '@/types';

export function TaskCheckbox({ task }: { task: Task }) {
  const toggle = useToggleTask();
  const { t } = useI18n();

  return (
    <Checkbox
      checked={task.status === 'done'}
      disabled={toggle.isPending}
      aria-label={t('Mark “{{title}}” as {{state}}', {
        title: task.title,
        state: task.status === 'done' ? t('open') : t('done'),
      })}
      onCheckedChange={(checked) => {
        const done = checked === true;
        toggle.mutate(
          { id: task.id, done },
          {
            onSuccess: () => {
              toast.success(
                done
                  ? t('“{{title}}” completed', { title: task.title })
                  : t('“{{title}}” reopened', { title: task.title })
              );
            },
            onError: (error) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : t('Could not update the task')
              );
            },
          }
        );
      }}
    />
  );
}
