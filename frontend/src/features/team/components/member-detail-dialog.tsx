import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  FolderKanban,
  ListChecks,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect } from '@/components/ui/select-native';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/common/user-avatar';
import { Field } from '@/components/common/field';
import {
  useRemoveMember,
  useSetMemberProjects,
  useUpdateMemberRole,
} from '@/hooks/use-workspace';
import {
  assignableRolesFor,
  canAssignProjects,
  canChangeMemberRole,
  canManageTeam,
  canRemoveMember,
  roleLabel,
  type TeamActor,
} from '@/lib/team';
import { cn, formatDate, formatDueDate, isOverdue } from '@/lib/utils';
import { roleMeta, statusMeta } from '../team-meta';
import type { OrgRole, Project, Task, TeamMember } from '@/types';

interface MemberDetailDialogProps {
  open: boolean;
  member: TeamMember | null;
  projects: Project[];
  tasks: Task[];
  actor: TeamActor;
  onOpenChange: (open: boolean) => void;
}

function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((id) => set.has(id));
}

export function MemberDetailDialog({
  open,
  member,
  projects,
  tasks,
  actor,
  onOpenChange,
}: MemberDetailDialogProps) {
  const updateRole = useUpdateMemberRole();
  const setProjects = useSetMemberProjects();
  const removeMember = useRemoveMember();

  const [role, setRole] = useState<OrgRole>('member');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const ownedProjectIds = useMemo(
    () =>
      member
        ? projects
            .filter((project) => project.owner.id === member.id)
            .map((project) => project.id)
        : [],
    [member, projects]
  );

  useEffect(() => {
    if (!open || !member) return;
    setRole(member.workspaceRole ?? 'member');
    setSelectedProjectIds(
      Array.from(new Set([...member.projectIds, ...ownedProjectIds]))
    );
    setConfirmRemove(false);
  }, [open, member, ownedProjectIds]);

  const currentRole = member?.workspaceRole ?? 'member';
  const roleOptions = useMemo(() => {
    const options = assignableRolesFor(actor.workspaceRole);
    return options.includes(currentRole) ? options : [currentRole, ...options];
  }, [actor.workspaceRole, currentRole]);

  if (!member) return null;

  const roleInfo = roleMeta[currentRole];
  const statusInfo = statusMeta[member.status];
  const manager = canManageTeam(actor.workspaceRole);
  const roleCheck = canChangeMemberRole(actor, member, role);
  const roleChanged = role !== currentRole;
  const projectCheck = canAssignProjects(actor, member);
  const removeCheck = canRemoveMember(actor, member);
  const isInvited = member.status === 'invited';

  const assignedProjects = projects.filter(
    (project) =>
      member.projectIds.includes(project.id) || project.owner.id === member.id
  );

  const initialProjectIds = Array.from(
    new Set([...member.projectIds, ...ownedProjectIds])
  );
  const projectsChanged = !sameIds(selectedProjectIds, initialProjectIds);

  const openTasks = tasks
    .filter((task) => task.assignee?.id === member.id && task.status !== 'done')
    .sort((left, right) => {
      if (!left.dueDate) return 1;
      if (!right.dueDate) return -1;
      return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
    });
  const recentTasks = openTasks.slice(0, 4);

  const toggleProject = (projectId: string, checked: boolean) => {
    setSelectedProjectIds((current) =>
      checked
        ? Array.from(new Set([...current, projectId]))
        : current.filter((id) => id !== projectId)
    );
  };

  const handleRoleSave = () => {
    updateRole.mutate(
      { memberId: member.id, role },
      {
        onSuccess: () => {
          toast.success(
            `${member.fullName} is now ${roleLabel(role).toLowerCase()}`
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Could not update the role'
          );
        },
      }
    );
  };

  const handleProjectSave = () => {
    setProjects.mutate(
      { memberId: member.id, projectIds: selectedProjectIds },
      {
        onSuccess: () => {
          toast.success(`Project access updated for ${member.fullName}`);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not update project access'
          );
        },
      }
    );
  };

  const handleRemove = () => {
    removeMember.mutate(member.id, {
      onSuccess: () => {
        toast.success(
          isInvited
            ? `Invitation for ${member.email} revoked`
            : `${member.fullName} removed from the workspace`
        );
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : 'Could not update the team'
        );
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <UserAvatar user={member} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <DialogTitle className="truncate">{member.fullName}</DialogTitle>
                <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className={cn('h-1.5 w-1.5 rounded-full', statusInfo.dot)}
                  />
                  {statusInfo.label}
                </span>
              </div>
              <DialogDescription className="mt-1">
                {member.jobTitle ?? 'Team member'} · {member.email || 'Email pending'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 divide-x divide-border/70 rounded-lg border border-border/70 bg-secondary/20">
          <div className="px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Workload
            </p>
            <p className="mt-0.5 font-display text-sm font-semibold tabular">
              {member.workload}%
            </p>
            <Progress
              value={member.workload}
              aria-label={`${member.fullName} workload`}
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
          <div className="px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Open tasks
            </p>
            <p className="mt-0.5 font-display text-sm font-semibold tabular">
              {openTasks.length}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Across {assignedProjects.length} project
              {assignedProjects.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Member since
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {member.joinedAt
                ? formatDate(member.joinedAt, {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {isInvited ? 'Invitation pending' : 'Workspace member'}
            </p>
          </div>
        </div>

        <section className="rounded-lg border border-border/70">
          <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
                Workspace role
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Admins manage the team; members create and edit work; viewers
                read only.
              </p>
            </div>
            <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
          </div>

          <div className="space-y-3 px-4 py-3">
            {!manager || currentRole === 'owner' ? (
              <p className="text-[11px] text-muted-foreground">
                {currentRole === 'owner'
                  ? 'The workspace owner role is fixed and cannot be changed.'
                  : 'Only workspace owners and admins can change this role.'}
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Field label="Assign role" htmlFor="member-role" className="flex-1">
                    <NativeSelect
                      id="member-role"
                      value={role}
                      onChange={(event) =>
                        setRole(event.target.value as OrgRole)
                      }
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option}>
                          {roleLabel(option)}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Button
                    size="sm"
                    className="h-9"
                    disabled={
                      !roleChanged || !roleCheck.allowed || updateRole.isPending
                    }
                    onClick={handleRoleSave}
                  >
                    {updateRole.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserRoundCheck className="h-3.5 w-3.5" />
                    )}
                    Save role
                  </Button>
                </div>
                {roleChanged && !roleCheck.allowed ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    {roleCheck.reason}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Role changes are recorded in the workspace activity log and
                    notify the member.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border/70">
          <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <FolderKanban className="h-3.5 w-3.5 text-blue-400" />
                Project access
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isInvited
                  ? 'Project access can be assigned after the invitation is accepted.'
                  : 'Choose which projects this member can see and work in.'}
              </p>
            </div>
            <Badge variant="outline">{assignedProjects.length}</Badge>
          </div>

          <div className="space-y-3 px-4 py-3">
            {isInvited || !projectCheck.allowed ? (
              <div className="flex flex-wrap gap-1.5">
                {assignedProjects.length === 0 ? (
                  <Badge variant="outline">No project access</Badge>
                ) : (
                  assignedProjects.map((project) => (
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
            ) : (
              <>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {projects.map((project) => {
                    const owned = project.owner.id === member.id;
                    const checked = selectedProjectIds.includes(project.id);
                    return (
                      <label
                        key={project.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 text-xs transition-colors hover:bg-secondary/40',
                          owned && 'cursor-default bg-secondary/20'
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={owned}
                          onCheckedChange={(value) =>
                            toggleProject(project.id, value === true)
                          }
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {project.name}
                        </span>
                        {owned ? (
                          <Badge variant="outline" className="text-[9px]">
                            Owner
                          </Badge>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground">
                    {projectsChanged
                      ? `${selectedProjectIds.length} project${
                          selectedProjectIds.length === 1 ? '' : 's'
                        } selected`
                      : 'No unsaved project changes'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={!projectsChanged || setProjects.isPending}
                    onClick={handleProjectSave}
                  >
                    {setProjects.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Save access
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border/70">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
              Open assignments
            </p>
            <Badge variant="outline">{openTasks.length}</Badge>
          </div>
          <div className="divide-y divide-border/60">
            {recentTasks.length === 0 ? (
              <p className="px-4 py-3 text-[11px] text-muted-foreground">
                No open tasks assigned to this member.
              </p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{task.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {task.projectName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[10px] tabular',
                      isOverdue(task.dueDate)
                        ? 'text-rose-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              ))
            )}
            {openTasks.length > recentTasks.length ? (
              <p className="px-4 py-2 text-[10px] text-muted-foreground">
                +{openTasks.length - recentTasks.length} more open task
                {openTasks.length - recentTasks.length === 1 ? '' : 's'} in the
                task board.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-rose-500/20 bg-rose-500/5">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <Trash2 className="h-3.5 w-3.5" />
                {isInvited ? 'Revoke invitation' : 'Remove member'}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {removeCheck.allowed
                  ? isInvited
                    ? 'The pending invitation will stop working immediately.'
                    : 'Project access is revoked. Existing tasks keep their history.'
                  : removeCheck.reason}
              </p>
            </div>

            {removeCheck.allowed ? (
              confirmRemove ? (
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRemove(false)}
                    disabled={removeMember.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={removeMember.isPending}
                  >
                    {removeMember.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    {isInvited ? 'Revoke' : 'Remove'}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                  onClick={() => setConfirmRemove(true)}
                >
                  {isInvited ? 'Revoke invitation' : 'Remove member'}
                </Button>
              )
            ) : null}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <a
            href={`mailto:${member.email}`}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-3 w-3" />
            {member.email || 'Email pending'}
          </a>
          <p className="text-[10px] text-muted-foreground">
            Changes apply to the whole workspace.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
