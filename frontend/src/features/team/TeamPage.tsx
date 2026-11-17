import { useMemo, useState } from 'react';
import {
  Download,
  Mail,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useProjects, useTeam } from '@/hooks/use-workspace';
import { cn, downloadCsv } from '@/lib/utils';
import { InviteMemberDialog } from './components/invite-member-dialog';
import type { OrgRole, Project, TeamMember } from '@/types';

const roleMeta: Record<
  OrgRole,
  { label: string; variant: 'violet' | 'info' | 'neutral' | 'outline' }
> = {
  owner: { label: 'Owner', variant: 'violet' },
  admin: { label: 'Admin', variant: 'info' },
  member: { label: 'Member', variant: 'neutral' },
  viewer: { label: 'Viewer', variant: 'outline' },
};

const statusMeta: Record<TeamMember['status'], { label: string; dot: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-400' },
  away: { label: 'Away', dot: 'bg-amber-400' },
  invited: { label: 'Invited', dot: 'bg-slate-400' },
};

type RoleFilter = 'all' | OrgRole;

const roleFilters: Array<{ value: RoleFilter; label: string }> = [
  { value: 'all', label: 'Everyone' },
  { value: 'owner', label: 'Owners' },
  { value: 'admin', label: 'Admins' },
  { value: 'member', label: 'Members' },
  { value: 'viewer', label: 'Viewers' },
];

export function TeamPage() {
  const team = useTeam();
  const projects = useProjects();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [query, setQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const list = useMemo(() => team.data ?? [], [team.data]);
  const projectList = useMemo(() => projects.data ?? [], [projects.data]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return list.filter((member) => {
      const matchesRole =
        roleFilter === 'all' || member.workspaceRole === roleFilter;
      if (!matchesRole) return false;
      if (!normalized) return true;
      return `${member.fullName} ${member.email} ${member.jobTitle ?? ''}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [list, query, roleFilter]);

  if (team.isLoading) return <PageSkeleton />;

  if (team.error) {
    return (
      <ErrorState
        description={
          team.error instanceof Error
            ? team.error.message
            : 'The team could not be loaded.'
        }
        onRetry={() => void team.refetch()}
      />
    );
  }

  const active = list.filter((member) => member.status === 'active').length;
  const invited = list.filter((member) => member.status === 'invited').length;
  const averageWorkload = Math.round(
    list.reduce((total, member) => total + member.workload, 0) /
      Math.max(1, list.length)
  );

  const exportTeam = () => {
    if (filtered.length === 0) {
      toast.error('There are no members to export');
      return;
    }
    downloadCsv(
      'nova-team.csv',
      filtered.map((member) => ({
        Name: member.fullName,
        Email: member.email,
        Role: member.workspaceRole ?? 'member',
        Status: member.status,
        Workload: `${member.workload}%`,
        Projects: member.projectIds
          .map(
            (projectId) =>
              projectList.find((project) => project.id === projectId)?.name ??
              projectId
          )
          .join(' | '),
      }))
    );
    toast.success('Team directory exported');
  };

  const summary = [
    {
      label: 'Members',
      value: list.length,
      icon: Users,
      tone: 'text-blue-400',
    },
    {
      label: 'Active',
      value: active,
      icon: ShieldCheck,
      tone: 'text-emerald-400',
    },
    {
      label: 'Invited',
      value: invited,
      icon: Mail,
      tone: 'text-violet-400',
    },
    {
      label: 'Avg workload',
      value: `${averageWorkload}%`,
      icon: Users,
      tone: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="Who is in the workspace, what they own and how much is on their plate."
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {list.length} members
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportTeam}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              Invite member
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {roleFilters.map((item) => (
            <Button
              key={item.value}
              variant={roleFilter === item.value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setRoleFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members..."
            className="h-8 pl-8 text-xs"
            aria-label="Search team members"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? 'No members match this search' : 'No members in this role'}
          description={
            query
              ? 'Try another name, email address or job title.'
              : 'Invite a teammate or switch to another role filter.'
          }
          action={
            !query ? (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Invite member
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((member) => {
            const role = roleMeta[member.workspaceRole ?? 'member'];
            const status = statusMeta[member.status];
            const memberProjects = member.projectIds
              .map(
                (projectId) =>
                  projectList.find((project) => project.id === projectId) ?? null
              )
              .filter((project): project is Project => Boolean(project));

            return (
              <Card key={member.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={member} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {member.fullName}
                        </p>
                        <Badge variant={role.variant}>{role.label}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {member.jobTitle ?? 'Team member'}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground/80">
                        {member.email || 'Email pending'}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Workload</span>
                      <span
                        className={cn(
                          'tabular',
                          member.workload > 85
                            ? 'text-amber-400'
                            : 'text-foreground'
                        )}
                      >
                        {member.workload}%
                      </span>
                    </div>
                    <Progress
                      value={member.workload}
                      className="mt-1.5 h-1"
                      indicatorClassName={cn(
                        member.workload > 85
                          ? 'bg-amber-400'
                          : member.workload > 60
                            ? 'bg-blue-500'
                            : 'bg-emerald-400'
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Projects
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {memberProjects.length === 0 ? (
                        <Badge variant="outline">No project yet</Badge>
                      ) : (
                        memberProjects.map((project) => (
                          <Badge
                            key={project.id}
                            variant="outline"
                            className="bg-secondary/30"
                          >
                            {project.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-[10px] text-muted-foreground">
                      {member.status === 'invited'
                        ? 'Invitation pending'
                        : `${memberProjects.length} active ${
                            memberProjects.length === 1 ? 'project' : 'projects'
                          }`}
                    </span>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                    >
                      <a href={`mailto:${member.email}`}>
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
