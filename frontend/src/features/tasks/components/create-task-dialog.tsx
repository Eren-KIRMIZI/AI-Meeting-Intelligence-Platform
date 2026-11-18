import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Field } from '@/components/common/field';
import { useCreateTask } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import type { Project, TaskPriority, TaskStatus } from '@/types';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  defaultProjectId?: string;
}

function localDate(daysFromNow = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projects,
  defaultProjectId,
}: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState(localDate());

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setProjectId(defaultProjectId ?? projects[0]?.id ?? '');
    setPriority('medium');
    setStatus('todo');
    setDueDate(localDate());
  }, [open, defaultProjectId, projects]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(t('A task title is required'));
      return;
    }

    createTask.mutate(
      {
        title: trimmedTitle,
        projectId,
        priority,
        status,
        dueDate,
      },
      {
        onSuccess: (task) => {
          toast.success(
            t('“{{title}}” added to {{project}}', {
              title: task.title,
              project: task.projectName,
            })
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t('Could not create task')
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create a task')}</DialogTitle>
          <DialogDescription>
            {t('Turn the next commitment into a clear, owned piece of work.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('Task title')} htmlFor="task-title">
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('e.g. Finalize the launch cohort list')}
              autoFocus
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('Project')} htmlFor="task-project">
              <NativeSelect
                id="task-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">{t('No project')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('Status')} htmlFor="task-status">
              <NativeSelect
                id="task-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
              >
                <option value="backlog">{t('Backlog')}</option>
                <option value="todo">{t('To do')}</option>
                <option value="in_progress">{t('In progress')}</option>
                <option value="in_review">{t('In review')}</option>
              </NativeSelect>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('Priority')} htmlFor="task-priority">
              <NativeSelect
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
              >
                <option value="low">{t('Low')}</option>
                <option value="medium">{t('Medium')}</option>
                <option value="high">{t('High')}</option>
                <option value="urgent">{t('Urgent')}</option>
              </NativeSelect>
            </Field>

            <Field label={t('Due date')} htmlFor="task-due-date">
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </Field>
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('Create task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
