import type {
  AccentColor,
  DecisionStatus,
  IntegrationStatus,
  MeetingStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@/types';

export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'violet'
  | 'neutral';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  dot: string;
}

export const projectStatusMeta: Record<ProjectStatus, StatusMeta> = {
  planning: { label: 'Planning', tone: 'neutral', dot: 'bg-slate-400' },
  on_track: { label: 'On track', tone: 'success', dot: 'bg-emerald-400' },
  at_risk: { label: 'At risk', tone: 'warning', dot: 'bg-amber-400' },
  off_track: { label: 'Off track', tone: 'danger', dot: 'bg-rose-400' },
  completed: { label: 'Completed', tone: 'info', dot: 'bg-blue-400' },
};

export const taskStatusMeta: Record<TaskStatus, StatusMeta> = {
  backlog: { label: 'Backlog', tone: 'neutral', dot: 'bg-slate-400' },
  todo: { label: 'To do', tone: 'neutral', dot: 'bg-slate-300' },
  in_progress: { label: 'In progress', tone: 'info', dot: 'bg-blue-400' },
  in_review: { label: 'In review', tone: 'violet', dot: 'bg-violet-400' },
  done: { label: 'Done', tone: 'success', dot: 'bg-emerald-400' },
};

export const taskPriorityMeta: Record<TaskPriority, StatusMeta> = {
  low: { label: 'Low', tone: 'neutral', dot: 'bg-slate-400' },
  medium: { label: 'Medium', tone: 'info', dot: 'bg-blue-400' },
  high: { label: 'High', tone: 'warning', dot: 'bg-amber-400' },
  urgent: { label: 'Urgent', tone: 'danger', dot: 'bg-rose-400' },
};

export const decisionStatusMeta: Record<DecisionStatus, StatusMeta> = {
  proposed: { label: 'Proposed', tone: 'warning', dot: 'bg-amber-400' },
  accepted: { label: 'Accepted', tone: 'success', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', tone: 'danger', dot: 'bg-rose-400' },
  superseded: { label: 'Superseded', tone: 'neutral', dot: 'bg-slate-400' },
};

export const meetingStatusMeta: Record<MeetingStatus, StatusMeta> = {
  scheduled: { label: 'Scheduled', tone: 'info', dot: 'bg-blue-400' },
  live: { label: 'Live', tone: 'danger', dot: 'bg-rose-400' },
  processing: { label: 'Processing', tone: 'warning', dot: 'bg-amber-400' },
  completed: { label: 'Completed', tone: 'success', dot: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', tone: 'neutral', dot: 'bg-slate-400' },
};

export const integrationStatusMeta: Record<IntegrationStatus, StatusMeta> = {
  connected: { label: 'Connected', tone: 'success', dot: 'bg-emerald-400' },
  available: { label: 'Available', tone: 'neutral', dot: 'bg-slate-400' },
  error: { label: 'Needs attention', tone: 'danger', dot: 'bg-rose-400' },
};

export interface AccentConfig {
  text: string;
  bg: string;
  border: string;
  solidBg: string;
  chart: string;
  softText: string;
}

export const accentConfig: Record<AccentColor, AccentConfig> = {
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    solidBg: 'bg-blue-500',
    chart: '#5B8DEF',
    softText: 'text-blue-300',
  },
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    solidBg: 'bg-emerald-500',
    chart: '#34D399',
    softText: 'text-emerald-300',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    solidBg: 'bg-amber-500',
    chart: '#F59E0B',
    softText: 'text-amber-300',
  },
  rose: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    solidBg: 'bg-rose-500',
    chart: '#F87171',
    softText: 'text-rose-300',
  },
  violet: {
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    solidBg: 'bg-violet-500',
    chart: '#A78BFA',
    softText: 'text-violet-300',
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    solidBg: 'bg-cyan-500',
    chart: '#22D3EE',
    softText: 'text-cyan-300',
  },
  slate: {
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    solidBg: 'bg-slate-500',
    chart: '#94A3B8',
    softText: 'text-slate-300',
  },
};
