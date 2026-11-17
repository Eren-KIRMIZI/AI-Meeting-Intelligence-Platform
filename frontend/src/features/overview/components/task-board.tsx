import { Link } from 'react-router-dom';
import { ChevronRight, ListTodo, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { TaskPriorityBadge, TaskStatusBadge } from '@/components/common/status-badges';
import { cn, formatDueDate, isOverdue } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

export type BoardView = 'board' | 'list';

const columns: Array<{
  key: string;
  label: string;
  dot: string;
  statuses: TaskStatus[];
}> = [
  { key: 'todo', label: 'To do', dot: 'bg-slate-400', statuses: ['backlog', 'todo'] },
  { key: 'progress', label: 'In progress', dot: 'bg-blue-400', statuses: ['in_progress'] },
  { key: 'review', label: 'In review', dot: 'bg-violet-400', statuses: ['in_review'] },
  { key: 'done', label: 'Done', dot: 'bg-emerald-400', statuses: ['done'] },
];

function BoardTaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-2.5 shadow-sm transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
          {task.title}
        </p>
        <span
          className={cn(
            'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
            task.priority === 'urgent'
              ? 'bg-rose-400'
              : task.priority === 'high'
                ? 'bg-amber-400'
                : task.priority === 'medium'
                  ? 'bg-blue-400'
                  : 'bg-slate-400'
          )}
          title={`${task.priority} priority`}
        />
      </div>
      <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
        {task.projectName}
      </p>
      <div className="mt-2.5 flex items-center justify-between">
        <UserAvatar user={task.assignee} size="xs" />
        <span
          className={cn(
            'text-[10px]',
            isOverdue(task.dueDate) && task.status !== 'done'
              ? 'text-rose-400'
              : 'text-muted-foreground'
          )}
        >
          {formatDueDate(task.dueDate)}
        </span>
      </div>
    </div>
  );
}

export function TaskBoard({
  tasks,
  view,
  onAddTask,
}: {
  tasks: Task[];
  view: BoardView;
  onAddTask: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle>Execution board</CardTitle>
          <CardDescription className="mt-1">
            Tasks moving through the current cycle
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onAddTask}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add task</span>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/tasks">
              Open board
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {view === 'board' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {columns.map((column) => {
              const columnTasks = tasks
                .filter((task) => column.statuses.includes(task.status))
                .slice(0, 3);

              return (
                <div
                  key={column.key}
                  className="rounded-lg border border-border/70 bg-secondary/20 p-2.5"
                >
                  <div className="mb-2 flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', column.dot)} />
                      <span className="text-[11px] font-medium text-foreground">
                        {column.label}
                      </span>
                    </div>
                    <span className="text-[10px] tabular text-muted-foreground">
                      {
                        tasks.filter((task) => column.statuses.includes(task.status))
                          .length
                      }
                    </span>
                  </div>

                  <div className="space-y-2">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border/70 px-2 py-5 text-center text-[10px] text-muted-foreground">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <BoardTaskCard key={task.id} task={task} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-border/70 rounded-lg border border-border/70">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    task.status === 'done' ? 'bg-emerald-400' : 'bg-blue-400'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-xs font-medium',
                      task.status === 'done'
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {task.projectName}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <TaskPriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
                <UserAvatar user={task.assignee} size="xs" />
                <span
                  className={cn(
                    'w-16 text-right text-[10px]',
                    isOverdue(task.dueDate) && task.status !== 'done'
                      ? 'text-rose-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between rounded-md bg-secondary/25 px-3 py-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ListTodo className="h-3 w-3" />
            {tasks.filter((task) => task.status !== 'done').length} open tasks
          </span>
          <span>
            {tasks.filter((task) => task.status === 'done').length} completed
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
