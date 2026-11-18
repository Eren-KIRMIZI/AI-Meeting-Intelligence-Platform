import { useState } from 'react';
import { CalendarPlus, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import {
  useActivities,
  useIntegrations,
  useMeetings,
  useProjects,
  useTasks,
} from '@/hooks/use-workspace';
import { buildDashboardStats } from '@/lib/metrics';
import { getGreeting } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog';
import { CreateTaskDialog } from '@/features/tasks/components/create-task-dialog';
import { CreateMeetingDialog } from '@/features/meetings/components/create-meeting-dialog';
import { ProjectOverview } from './components/project-overview';
import { TaskBoard, type BoardView } from './components/task-board';
import { AiBriefCard } from './components/ai-brief-card';
import { ActivityFeed } from './components/activity-feed';
import { UpcomingMeetings } from './components/upcoming-meetings';
import { IntegrationsCard } from './components/integrations-card';

export function OverviewPage() {
  const { user, orgName } = useAuth();
  const { t } = useI18n();
  const projects = useProjects();
  const tasks = useTasks();
  const meetings = useMeetings();
  const activities = useActivities();
  const integrations = useIntegrations();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [boardView, setBoardView] = useState<BoardView>('board');

  const isLoading =
    projects.isLoading ||
    tasks.isLoading ||
    meetings.isLoading ||
    activities.isLoading ||
    integrations.isLoading;

  const error =
    projects.error ?? tasks.error ?? meetings.error ?? activities.error;

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <ErrorState
        description={
          error instanceof Error ? error.message : t('The workspace did not load.')
        }
        onRetry={() => {
          void projects.refetch();
          void tasks.refetch();
          void meetings.refetch();
          void activities.refetch();
          void integrations.refetch();
        }}
      />
    );
  }

  const projectList = projects.data ?? [];
  const taskList = tasks.data ?? [];
  const stats = buildDashboardStats(projectList, taskList);
  const firstName = user?.fullName.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description={t(
          'Here is what is moving across {{workspace}} today — projects, decisions and the meetings that connect them.',
          { workspace: orgName ?? t('your workspace') }
        )}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMeetingDialogOpen(true)}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              {t('Schedule meeting')}
            </Button>
            <Button size="sm" onClick={() => setProjectDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t('New project')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ProjectOverview projects={projectList} />

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t('Board preview')}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-secondary/30 p-0.5">
              <Button
                variant={boardView === 'board' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                onClick={() => setBoardView('board')}
              >
                {t('Board')}
              </Button>
              <Button
                variant={boardView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                onClick={() => setBoardView('list')}
              >
                {t('List')}
              </Button>
            </div>
          </div>

          <TaskBoard
            tasks={taskList}
            view={boardView}
            onAddTask={() => setTaskDialogOpen(true)}
          />

          <IntegrationsCard integrations={integrations.data ?? []} />

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-[10px] text-muted-foreground">
            <span>{t('Workspace data is refreshed automatically.')}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[10px]"
              onClick={() => {
                void projects.refetch();
                void tasks.refetch();
                void meetings.refetch();
                void activities.refetch();
                void integrations.refetch();
              }}
            >
              <RefreshCw className="h-3 w-3" />
              {t('Refresh')}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <AiBriefCard />
          <UpcomingMeetings
            meetings={meetings.data ?? []}
            onSchedule={() => setMeetingDialogOpen(true)}
          />
          <ActivityFeed activities={activities.data ?? []} />
        </div>
      </div>

      <CreateProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
      />
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projects={projectList}
      />
      <CreateMeetingDialog
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
      />
    </div>
  );
}
