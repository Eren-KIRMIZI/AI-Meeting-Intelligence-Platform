import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  FolderKanban,
  ListTodo,
  Search,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { allNavItems } from '@/lib/navigation';
import { cn, formatDate } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { useUiStore } from '@/stores/ui-store';
import { useAuth } from '@/features/auth/auth-provider';
import {
  useMeetings,
  useProjects,
  useTasks,
  useTeam,
} from '@/hooks/use-workspace';

interface CommandResult {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  path: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { orgName } = useAuth();
  const { t } = useI18n();
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const projects = useProjects({ enabled: open });
  const tasks = useTasks({ enabled: open });
  const meetings = useMeetings({ enabled: open });
  const team = useTeam({ enabled: open });

  const candidates = useMemo<CommandResult[]>(() => {
    const navigation: CommandResult[] = allNavItems.map((item) => ({
      id: `nav-${item.path}`,
      group: 'Navigate',
      label: t(item.label),
      hint: t(item.description),
      icon: item.icon,
      path: item.path,
    }));

    const projectResults: CommandResult[] = (projects.data ?? []).map(
      (project) => ({
        id: `project-${project.id}`,
        group: 'Projects',
        label: project.name,
        hint: project.category,
        icon: FolderKanban,
        path: `/projects/${project.id}`,
      })
    );

    const taskResults: CommandResult[] = (tasks.data ?? []).map((task) => ({
      id: `task-${task.id}`,
      group: 'Tasks',
      label: task.title,
      hint: task.assignee?.fullName ?? task.projectName,
      icon: ListTodo,
      path: `/tasks?task=${task.id}`,
    }));

    const meetingResults: CommandResult[] = (meetings.data ?? []).map(
      (meeting) => ({
        id: `meeting-${meeting.id}`,
        group: 'Meetings',
        label: meeting.title,
        hint: formatDate(meeting.startsAt, {
          month: 'short',
          day: 'numeric',
        }),
        icon: CalendarDays,
        path: `/meetings/${meeting.id}`,
      })
    );

    const teamResults: CommandResult[] = (team.data ?? []).map((member) => ({
      id: `member-${member.id}`,
      group: 'Team',
      label: member.fullName,
      hint: member.jobTitle ?? member.workspaceRole,
      icon: UserRound,
      path: '/team',
    }));

    return [
      ...navigation,
      ...projectResults,
      ...taskResults,
      ...meetingResults,
      ...teamResults,
    ];
  }, [projects.data, tasks.data, meetings.data, team.data, t]);

  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = candidates.filter((candidate) => {
      if (!normalized) return true;
      return `${candidate.label} ${candidate.hint ?? ''} ${candidate.group}`
        .toLowerCase()
        .includes(normalized);
    });

    const grouped = new Map<string, CommandResult[]>();
    filtered.forEach((candidate) => {
      const existing = grouped.get(candidate.group) ?? [];
      existing.push(candidate);
      grouped.set(candidate.group, existing);
    });

    return Array.from(grouped.entries()).map(([group, items]) => [
      group,
      group === 'Navigate' ? items : items.slice(0, 4),
    ]) as Array<[string, CommandResult[]]>;
  }, [candidates, query]);

  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups]);
  const activeId = flat[activeIndex]?.id;

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId, open]);

  const select = (result: CommandResult) => {
    setOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flat.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = flat[activeIndex];
      if (result) select(result);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        className="max-w-xl gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">{t('Command menu')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t(
            'Search for projects, tasks, meetings and team members, or jump to a workspace module.'
          )}
        </DialogDescription>

        <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('Search workspace or jump to...')}
            aria-label={t('Search workspace')}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        <div
          id="command-results"
          role="listbox"
          aria-label={t('Workspace results')}
          className="max-h-[400px] overflow-y-auto p-2"
        >
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">{t('No results')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('Try a project name, task, meeting or team member.')}
              </p>
            </div>
          ) : (
            groups.map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(group)}
                </p>
                <div className="space-y-0.5">
                  {items.map((result) => {
                    const index = flat.findIndex((item) => item.id === result.id);
                    const isActive = index === activeIndex;
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        id={result.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(result)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors',
                          isActive
                            ? 'bg-secondary text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/60'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive ? 'text-blue-400' : 'text-muted-foreground'
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {result.label}
                        </span>
                        {result.hint ? (
                          <span className="hidden max-w-[160px] truncate text-[10px] text-muted-foreground sm:block">
                            {result.hint}
                          </span>
                        ) : null}
                        <ArrowUpRight
                          className={cn(
                            'h-3 w-3 shrink-0 transition-opacity',
                            isActive ? 'opacity-60' : 'opacity-0'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd>
            {t('to navigate')}
            <kbd className="kbd ml-1">↵</kbd>
            {t('to open')}
          </span>
          <span className="truncate">{orgName ?? t('Workspace')}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
