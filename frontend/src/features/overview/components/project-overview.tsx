import { ChevronRight, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarStack } from '@/components/common/user-avatar';
import { EmptyState } from '@/components/common/empty-state';
import { ProjectStatusBadge } from '@/components/common/status-badges';
import { accentConfig } from '@/lib/status';
import { cn, formatDueDate } from '@/lib/utils';
import type { Project } from '@/types';

export function ProjectOverview({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle>Project overview</CardTitle>
          <CardDescription className="mt-1">
            Portfolio health across active work
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/projects">
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {projects.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              icon={FolderKanban}
              title="No projects match this filter"
              description="Try a different status filter or create a new project."
            />
          </div>
        ) : (
          <div className="divide-y divide-border/70 border-t border-border/70">
            {projects.slice(0, 4).map((project) => {
              const accent = accentConfig[project.color];
              return (
                <Link
                  key={project.id}
                  to="/projects"
                  className="group flex items-center gap-3 px-5 py-3.5 outline-none transition-colors hover:bg-secondary/25 focus-visible:bg-secondary/30 sm:gap-4"
                >
                  <span
                    className={cn('h-8 w-1 shrink-0 rounded-full', accent.solidBg)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2.5">
                      <div className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn('h-full rounded-full', accent.solidBg)}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular text-muted-foreground">
                        {project.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-6 sm:flex">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Tasks
                      </p>
                      <p className="mt-0.5 text-xs tabular text-foreground">
                        {project.completedTasks}/{project.taskCount}
                      </p>
                    </div>
                    <div className="hidden text-right md:block">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Due
                      </p>
                      <p className="mt-0.5 text-xs text-foreground">
                        {formatDueDate(project.dueDate)}
                      </p>
                    </div>
                    <AvatarStack users={project.members} max={3} />
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
