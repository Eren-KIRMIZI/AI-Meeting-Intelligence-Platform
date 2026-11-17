import type { BadgeProps } from '@/components/ui/badge';
import type { Decision, DecisionStatus } from '@/types';

export const decisionFilters: Array<{ value: 'all' | DecisionStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'rejected', label: 'Rejected' },
];

export const decisionImpactVariant: Record<
  Decision['impact'],
  BadgeProps['variant']
> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};
