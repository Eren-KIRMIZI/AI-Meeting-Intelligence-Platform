import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
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
import { Input, Textarea } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Field } from '@/components/common/field';
import { UserAvatar } from '@/components/common/user-avatar';
import { TaskStatusBadge } from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUpdateTask } from '@/hooks/use-workspace';
import { formatRelativeTime } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const update = useUpdateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
  }, [open, task]);

  if (!task) return null;

  const dirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    status !== task.status ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.slice(0, 10) : '');

  const save = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('A task title is required');
      return;
    }

    update.mutate(
      {
        id: task.id,
        input: {
          title: trimmedTitle,
          description,
          status,
          priority,
          dueDate: dueDate || null,
        },
      },
      {
        onSuccess: (updated) => {
          toast.success(`“${updated.title}” updated`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Could not update the task'
          );
        },
      }
    );
  };

  const quickToggle = () => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    update.mutate(
      { id: task.id, input: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(
            nextStatus === 'done'
              ? `“${task.title}” completed`
              : `“${task.title}” reopened`
          );
          setStatus(nextStatus);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Could not update the task'
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
            Task details
          </DialogTitle>
          <DialogDescription>
            {task.projectName}
            {task.assignee ? ` · ${task.assignee.fullName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Task title" htmlFor="task-detail-title">
            <Input
              id="task-detail-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Description" htmlFor="task-detail-description">
            <Textarea
              id="task-detail-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context, links or acceptance criteria..."
              className="min-h-[90px]"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Status" htmlFor="task-detail-status">
              <NativeSelect
                id="task-detail-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="in_review">In review</option>
                <option value="done">Done</option>
              </NativeSelect>
            </Field>

            <Field label="Priority" htmlFor="task-detail-priority">
              <NativeSelect
                id="task-detail-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </NativeSelect>
            </Field>
          </div>

          <Field label="Due date" htmlFor="task-detail-due">
            <Input
              id="task-detail-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <UserAvatar user={task.assignee} size="xs" />
              {task.assignee?.fullName ?? 'Unassigned'}
            </span>
            <span>Created {formatRelativeTime(task.createdAt)}</span>
            {task.sourceMeetingId ? (
              <Badge variant="outline" className="bg-secondary/30">
                <Sparkles className="h-3 w-3" />
                From a meeting
              </Badge>
            ) : null}
          </div>

          {task.sourceMeetingId ? (
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link to={`/meetings/${task.sourceMeetingId}`}>
                Open source meeting
              </Link>
            </Button>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={quickToggle}
            disabled={update.isPending}
          >
            {task.status === 'done' ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {task.status === 'done' ? 'Reopen task' : 'Mark done'}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={update.isPending || !dirty}
            >
              {update.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
