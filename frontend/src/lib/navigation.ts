import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesCombined,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const primaryNav: NavItem[] = [
  {
    label: 'Overview',
    path: '/overview',
    icon: LayoutDashboard,
    description: 'Workspace pulse, projects and activity',
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    description: 'Portfolio health and delivery',
  },
  {
    label: 'My Tasks',
    path: '/tasks',
    icon: ListTodo,
    description: 'Everything assigned to you',
  },
  {
    label: 'Meetings',
    path: '/meetings',
    icon: CalendarDays,
    description: 'Schedule, briefs and recordings',
  },
  {
    label: 'Decisions',
    path: '/decisions',
    icon: GitBranch,
    description: 'The decision log and its owners',
  },
  {
    label: 'Knowledge',
    path: '/knowledge',
    icon: BookOpen,
    description: 'Meeting notes and company memory',
  },
  {
    label: 'Workflows',
    path: '/workflows',
    icon: Workflow,
    description: 'Automations from signal to action',
  },
  {
    label: 'AI Intelligence',
    path: '/intelligence',
    icon: BrainCircuit,
    description: 'Extracted summaries, decisions and actions',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: ChartNoAxesCombined,
    description: 'Execution velocity and team capacity',
  },
  {
    label: 'Team',
    path: '/team',
    icon: Users,
    description: 'Members, roles and workload',
  },
];

export const secondaryNav: NavItem[] = [
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'Profile, workspace and integrations',
  },
];

export const logoutNav = {
  label: 'Log out',
  icon: LogOut,
} as const;

export const routeMeta: Record<string, { title: string; parent?: string }> = {
  '/overview': { title: 'Overview', parent: 'Workspace' },
  '/projects': { title: 'Projects', parent: 'Workspace' },
  '/tasks': { title: 'My Tasks', parent: 'Workspace' },
  '/meetings': { title: 'Meetings', parent: 'Workspace' },
  '/decisions': { title: 'Decisions', parent: 'Workspace' },
  '/knowledge': { title: 'Knowledge', parent: 'Workspace' },
  '/workflows': { title: 'Workflows', parent: 'Workspace' },
  '/intelligence': { title: 'AI Intelligence', parent: 'Workspace' },
  '/analytics': { title: 'Analytics', parent: 'Workspace' },
  '/team': { title: 'Team', parent: 'Workspace' },
  '/settings': { title: 'Settings', parent: 'Workspace' },
  '/login': { title: 'Sign in' },
};

export const allNavItems = [...primaryNav, ...secondaryNav];
