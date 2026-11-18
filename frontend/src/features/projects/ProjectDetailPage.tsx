import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  FolderKanban,
  GitBranch,
  ListTodo,
  Plus,
  Target,
} from 'lucide-react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { DateTile } from '@/components/common/date-tile';
import { AvatarStack, UserAvatar } from '@/components/common/user-avatar';
import {
  DecisionStatusBadge,
  MeetingStatusBadge,
  ProjectStatusBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
} from '@/components/common/status-badges';
import { ActivityFeed } from '@/features/overview/components/activity-feed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useActivities,
  useDecisions,
  useMeetings,
  useProjects,
  useTasks,
} from '@/hooks/use-workspace';
import { accentConfig } from '@/lib/status';
import {
  cn,
  formatDate,
  formatDueDate,
  formatRelativeTime,
} from '@/lib/utils';
import { CreateTaskDialog } from '@/features/tasks/components/create-task-dialog';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { TaskDetailDialog } from '@/features/tasks/components/task-detail-dialog';
import type { Task } from '@/types';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const projects = useProjects();
  const tasks = useTasks();
  const meetings = useMeetings();
  const decisions = useDecisions();
  const activities = useActivities();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const project = (projects.data ?? []).find((item) => item.id === projectId);
  const projectTasks = useMemo(
    () => (tasks.data ?? []).filter((task) => task.projectId === projectId),
    [projectId, tasks.data]
  );
  const projectMeetings = useMemo(
    () =>
      (meetings.data ?? [])
        .filter((meeting) => meeting.projectId === projectId)
        .sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
        ),
    [meetings.data, projectId]
  );
  const projectDecisions = useMemo(
    () =>
      (decisions.data ?? []).filter(
        (decision) => project && decision.projectName === project.name
      ),
    [decisions.data, project]
  );

  if (
    projects.isLoading ||
    tasks.isLoading ||
    meetings.isLoading ||
    decisions.isLoading ||
    activities.isLoading
  ) {
    return <PageSkeleton />;
  }

  if (projects.error) {
    return (
      <ErrorState
        description={
          projects.error instanceof Error
            ? projects.error.message
            : 'Projects could not be loaded.'
        }
        onRetry={() => void projects.refetch()}
      />
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
          <Link to="/projects">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to projects
          </Link>
        </Button>
        <ErrorState
          title="Project not found"
          description="This project may have been removed, or the link is out of date."
        />
      </div>
    );
  }

  const accent = accentConfig[project.color];
  const openTasks = projectTasks.filter((task) => task.status !== 'done').length;
  const completedTasks = projectTasks.filter(
    (task) => task.status === 'done'
  ).length;
  const analyzedMeetings = projectMeetings.filter(
    (meeting) => meeting.analysis
  ).length;

  const stats = [
    { label: 'Open tasks', value: openTasks, icon: ListTodo, tone: 'text-blue-400' },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CircleCheck,
      tone: 'text-emerald-400',
    },
    {
      label: 'Meetings',
      value: projectMeetings.length,
      icon: CalendarDays,
      tone: 'text-violet-400',
    },
    {
      label: 'Decisions',
      value: projectDecisions.length,
      icon: GitBranch,
      tone: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
          <Link to="/projects">
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </Link>
        </Button>
        <span className="text-border">/</span>
        <span className="truncate text-foreground">{project.name}</span>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  'icon-tile h-11 w-11 border',
                  accent.bg,
                  accent.border,
                  accent.text
                )}
              >
                <FolderKanban className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
                    {project.name}
                  </h1>
                  <ProjectStatusBadge status={project.status} />
                  <Badge variant="outline" className="bg-secondary/30">
                    {project.category}
                  </Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <UserAvatar user={project.owner} size="xs" />
                    {project.owner.fullName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <AvatarStack users={project.members} max={4} size="xs" />
                    {project.members.length} members
                  </span>
                  <span>Due {formatDueDate(project.dueDate)}</span>
                  <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/tasks?project=${project.id}`}>
                  <Target className="h-3.5 w-3.5" />
                  All tasks
                </Link>
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                New task
              </Button>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Delivery progress</span>
              <span className="tabular text-foreground">{project.progress}%</span>
            </div>
            <Progress
              value={project.progress}
              aria-label="Delivery progress"
              className="mt-2"
              indicatorClassName={accent.solidBg}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-2 divide-x divide-border/70 p-0 sm:grid-cols-4">
          {stats.map((item) => {
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

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="tasks">
            Tasks
            <span className="text-[10px] text-muted-foreground">
              {projectTasks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="meetings">
            Meetings
            <span className="text-[10px] text-muted-foreground">
              {projectMeetings.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="decisions">
            Decisions
            <span className="text-[10px] text-muted-foreground">
              {projectDecisions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-0">
          {projectTasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks in this project"
              description="Create the first task or turn a meeting action item into owned work."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  New task
                </Button>
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/70">
                  {projectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <TaskCheckbox task={task} />
                        <div className="min-w-0">
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
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                            {task.description ?? 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <UserAvatar user={task.assignee} size="xs" />
                          {task.assignee?.fullName ?? 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDueDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="meetings" className="mt-0">
          {projectMeetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No meetings linked to this project"
              description="Meetings scheduled with this project will appear here with their briefs and extracted follow-ups."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/70">
                  {projectMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <DateTile date={meeting.startsAt} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/meetings/${meeting.id}`}
                              className="truncate text-xs font-medium text-foreground transition-colors hover:text-primary"
                            >
                              {meeting.title}
                            </Link>
                            <MeetingStatusBadge status={meeting.status} />
                            {meeting.analysis ? (
                              <Badge variant="success">Analyzed</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                            {meeting.summary ?? 'No brief yet.'}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {formatDate(meeting.startsAt, {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            · {meeting.durationMinutes} min ·{' '}
                            {meeting.participants.length} participants
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 text-[11px]"
                      >
                        <Link to={`/meetings/${meeting.id}`}>
                          Open workspace
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="mt-0">
          {projectDecisions.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No decisions recorded yet"
              description="Confirm a decision from a meeting workspace and it will join this project's decision log."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/70">
                  {projectDecisions.map((decision) => (
                    <div key={decision.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-foreground">
                          {decision.title}
                        </p>
                        <DecisionStatusBadge status={decision.status} />
                        <Badge
                          variant={
                            decision.impact === 'high'
                              ? 'danger'
                              : decision.impact === 'medium'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {decision.impact} impact
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {decision.context}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <UserAvatar user={decision.owner} size="xs" />
                        <span>{decision.owner.fullName}</span>
                        <span>·</span>
                        <span>{decision.meetingTitle}</span>
                        <span>·</span>
                        <span>{formatDate(decision.decidedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <ActivityFeed activities={activities.data ?? []} />
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-muted-foreground">
        {analyzedMeetings} of {projectMeetings.length} meetings have an
        intelligence brief.
      </p>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects.data ?? []}
        defaultProjectId={project.id}
      />
      <TaskDetailDialog
        task={selectedTask}
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}
