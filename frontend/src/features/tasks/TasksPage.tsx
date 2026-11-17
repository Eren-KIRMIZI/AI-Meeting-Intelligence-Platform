import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CircleCheck,
  Clock3,
  Download,
  ListTodo,
  Plus,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import {
  TaskPriorityBadge,
  TaskStatusBadge,
} from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProjects, useTasks } from '@/hooks/use-workspace';
import {
  cn,
  downloadCsv,
  formatDueDate,
  isOverdue,
} from '@/lib/utils';
import { CreateTaskDialog } from './components/create-task-dialog';
import { TaskCheckbox } from './components/task-checkbox';
import { TaskDetailDialog } from './components/task-detail-dialog';
import type { Task, TaskPriority, TaskStatus } from '@/types';

type ViewMode = 'board' | 'list';

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

function BoardTaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (task: Task) => void;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-2.5 shadow-sm transition-colors hover:border-border">
      <div className="flex items-start gap-2">
        <TaskCheckbox task={task} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(task)}
            className={cn(
              'line-clamp-2 text-left text-[12px] font-medium leading-snug transition-colors hover:text-primary',
              task.status === 'done'
                ? 'text-muted-foreground line-through'
                : 'text-foreground'
            )}
          >
            {task.title}
          </button>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            {task.projectName}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <UserAvatar user={task.assignee} size="xs" />
          <TaskPriorityBadge priority={task.priority} />
        </div>
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

export function TasksPage() {
  const tasks = useTasks();
  const projects = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get('project') ?? 'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [view, setView] = useState<ViewMode>('board');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    setProjectFilter(searchParams.get('project') ?? 'all');
  }, [searchParams]);

  const list = useMemo(() => tasks.data ?? [], [tasks.data]);
  const projectList = useMemo(() => projects.data ?? [], [projects.data]);

  // Deep link from the command palette: /tasks?task=<id> opens the detail dialog.
  const taskParam = searchParams.get('task');

  useEffect(() => {
    if (!taskParam) return;
    const match = list.find((task) => task.id === taskParam);
    if (match) setSelectedTask(match);
  }, [list, taskParam]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return list.filter((task) => {
      if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (!normalized) return true;
      return `${task.title} ${task.projectName} ${task.tags.join(' ')} ${
        task.assignee?.fullName ?? ''
      }`
        .toLowerCase()
        .includes(normalized);
    });
  }, [list, priorityFilter, projectFilter, query, statusFilter]);

  if (tasks.isLoading || projects.isLoading) return <PageSkeleton />;

  if (tasks.error || projects.error) {
    const error = tasks.error ?? projects.error;
    return (
      <ErrorState
        description={
          error instanceof Error ? error.message : 'Tasks could not be loaded.'
        }
        onRetry={() => {
          void tasks.refetch();
          void projects.refetch();
        }}
      />
    );
  }

  const openTasks = list.filter((task) => task.status !== 'done').length;
  const doneTasks = list.filter((task) => task.status === 'done').length;
  const overdueTasks = list.filter(
    (task) => task.status !== 'done' && isOverdue(task.dueDate)
  ).length;

  const hasFilters =
    query.trim() !== '' ||
    projectFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    const next = new URLSearchParams(searchParams);
    next.delete('project');
    setSearchParams(next, { replace: true });
  };

  const handleProjectChange = (value: string) => {
    setProjectFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('project');
    else next.set('project', value);
    setSearchParams(next, { replace: true });
  };

  const exportTasks = () => {
    if (filtered.length === 0) {
      toast.error('There are no tasks to export');
      return;
    }
    downloadCsv(
      'nova-tasks.csv',
      filtered.map((task) => ({
        Title: task.title,
        Project: task.projectName,
        Status: task.status,
        Priority: task.priority,
        Assignee: task.assignee?.fullName ?? 'Unassigned',
        Due: task.dueDate ?? '',
        Tags: task.tags.join(' | '),
      }))
    );
    toast.success('Tasks exported');
  };

  const summary = [
    { label: 'Open tasks', value: openTasks, icon: ListTodo, tone: 'text-blue-400' },
    { label: 'Completed', value: doneTasks, icon: CircleCheck, tone: 'text-emerald-400' },
    { label: 'Overdue', value: overdueTasks, icon: TriangleAlert, tone: 'text-rose-400' },
    {
      label: 'Due soon',
      value: list.filter((task) => {
        if (task.status === 'done' || !task.dueDate) return false;
        const diff = new Date(task.dueDate).getTime() - Date.now();
        return diff >= 0 && diff <= 7 * 86_400_000;
      }).length,
      icon: Clock3,
      tone: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Tasks"
        description="Every commitment in one place — filter by project, priority or status and keep work moving."
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {openTasks} open
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportTasks}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New task
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 divide-x divide-border/70 p-0 sm:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5 px-4 py-3.5">
                <span className={cn('icon-tile h-8 w-8 border-border/70', item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold leading-none tabular">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks, projects, people or tags..."
                className="h-8 pl-8 text-xs"
                aria-label="Search tasks"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
              <NativeSelect
                value={projectFilter}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="h-8 text-xs lg:w-[160px]"
                aria-label="Filter by project"
              >
                <option value="all">All projects</option>
                {projectList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | TaskStatus)
                }
                className="h-8 text-xs lg:w-[140px]"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="backlog">Backlog</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="in_review">In review</option>
                <option value="done">Done</option>
              </NativeSelect>

              <NativeSelect
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as 'all' | TaskPriority)
                }
                className="h-8 text-xs lg:w-[140px]"
                aria-label="Filter by priority"
              >
                <option value="all">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </NativeSelect>

              <div className="col-span-2 flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/30 p-0.5 sm:col-span-1">
                <Button
                  variant={view === 'board' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 flex-1 px-2.5 text-[11px]"
                  onClick={() => setView('board')}
                >
                  Board
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 flex-1 px-2.5 text-[11px]"
                  onClick={() => setView('list')}
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              Showing {filtered.length} of {list.length} tasks
            </span>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-[10px]"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks match these filters"
          description="Clear the filters to see the whole board, or add a new task to get started."
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                New task
              </Button>
            )
          }
        />
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = filtered.filter((task) =>
              column.statuses.includes(task.status)
            );
            return (
              <div
                key={column.key}
                className="rounded-xl border border-border/70 bg-secondary/15 p-2.5"
              >
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', column.dot)} />
                    <span className="text-[11px] font-medium text-foreground">
                      {column.label}
                    </span>
                  </div>
                  <span className="text-[10px] tabular text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/70 px-2 py-6 text-center text-[10px] text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <BoardTaskCard
                        key={task.id}
                        task={task}
                        onOpen={setSelectedTask}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden md:table-cell">Assignee</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <TaskCheckbox task={task} />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          'text-left text-xs font-medium transition-colors hover:text-primary',
                          task.status === 'done'
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground'
                        )}
                      >
                        {task.title}
                      </button>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {task.projectName}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar user={task.assignee} size="xs" />
                        <span className="text-[11px] text-muted-foreground">
                          {task.assignee?.fullName ?? 'Unassigned'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <TaskPriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'text-[11px]',
                          isOverdue(task.dueDate) && task.status !== 'done'
                            ? 'text-rose-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatDueDate(task.dueDate)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projectList}
        defaultProjectId={projectFilter === 'all' ? undefined : projectFilter}
      />
      <TaskDetailDialog
        task={selectedTask}
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            if (searchParams.has('task')) {
              const next = new URLSearchParams(searchParams);
              next.delete('task');
              setSearchParams(next, { replace: true });
            }
          }
        }}
      />
    </div>
  );
}
