import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  FolderKanban,
  Plus,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { AvatarStack } from '@/components/common/user-avatar';
import {
  MetaBadge,
  ProjectStatusBadge,
} from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProjects } from '@/hooks/use-workspace';
import { accentConfig } from '@/lib/status';
import { cn, downloadCsv, formatDueDate, formatRelativeTime } from '@/lib/utils';
import { CreateProjectDialog } from './components/create-project-dialog';
import type { ProjectStatus } from '@/types';

const filters: Array<{ value: 'all' | ProjectStatus; label: string }> = [
  { value: 'all', label: 'All projects' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'planning', label: 'Planning' },
  { value: 'completed', label: 'Completed' },
];

export function ProjectsPage() {
  const projects = useProjects();
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const list = projects.data ?? [];
  const filtered = useMemo(
    () => (filter === 'all' ? list : list.filter((project) => project.status === filter)),
    [filter, list]
  );

  if (projects.isLoading) return <PageSkeleton />;

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

  const active = list.filter((project) => project.status !== 'completed').length;
  const onTrack = list.filter((project) => project.status === 'on_track').length;
  const atRisk = list.filter((project) => project.status === 'at_risk').length;
  const completed = list.filter((project) => project.status === 'completed').length;

  const summary = [
    { label: 'Active', value: active, icon: FolderKanban, tone: 'text-blue-400' },
    { label: 'On track', value: onTrack, icon: Target, tone: 'text-emerald-400' },
    { label: 'At risk', value: atRisk, icon: TriangleAlert, tone: 'text-amber-400' },
    { label: 'Completed', value: completed, icon: FolderKanban, tone: 'text-slate-400' },
  ];

  const exportProjects = () => {
    if (filtered.length === 0) {
      toast.error('There are no projects to export');
      return;
    }
    downloadCsv(
      'nova-projects.csv',
      filtered.map((project) => ({
        Name: project.name,
        Status: project.status,
        Category: project.category,
        Owner: project.owner.fullName,
        Progress: `${project.progress}%`,
        Tasks: `${project.completedTasks}/${project.taskCount}`,
        Due: project.dueDate,
      }))
    );
    toast.success('Projects exported');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        description="Portfolio health, ownership and delivery across every active initiative."
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {list.length} total
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportProjects}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New project
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

      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects match this filter"
          description="Try another status or create the next project your team needs."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((project) => {
            const accent = accentConfig[project.color];
            return (
              <Card key={project.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className={cn(
                          'icon-tile h-9 w-9 border',
                          accent.bg,
                          accent.border,
                          accent.text
                        )}
                      >
                        <FolderKanban className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {project.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {project.category} · {formatRelativeTime(project.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {project.description || 'No description yet.'}
                  </p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Progress</span>
                      <span className="tabular text-foreground">{project.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn('h-full rounded-full', accent.solidBg)}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <MetaBadge>{project.taskCount} tasks</MetaBadge>
                    <MetaBadge>{project.completedTasks} done</MetaBadge>
                    <MetaBadge>Due {formatDueDate(project.dueDate)}</MetaBadge>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <div className="flex items-center gap-2">
                      <AvatarStack users={project.members} max={3} size="xs" />
                      <span className="hidden text-[10px] text-muted-foreground sm:inline">
                        {project.owner.fullName}
                      </span>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-7 text-[11px]">
                      <Link to={`/tasks?project=${project.id}`}>
                        Open tasks
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
