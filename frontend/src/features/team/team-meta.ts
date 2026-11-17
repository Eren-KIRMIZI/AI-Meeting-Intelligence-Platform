import type { OrgRole, TeamMember } from '@/types';

export const roleMeta: Record<
  OrgRole,
  { label: string; variant: 'violet' | 'info' | 'neutral' | 'outline' }
> = {
  owner: { label: 'Owner', variant: 'violet' },
  admin: { label: 'Admin', variant: 'info' },
  member: { label: 'Member', variant: 'neutral' },
  viewer: { label: 'Viewer', variant: 'outline' },
};

export const statusMeta: Record<
  TeamMember['status'],
  { label: string; dot: string }
> = {
  active: { label: 'Active', dot: 'bg-emerald-400' },
  away: { label: 'Away', dot: 'bg-amber-400' },
  invited: { label: 'Invited', dot: 'bg-slate-400' },
};
