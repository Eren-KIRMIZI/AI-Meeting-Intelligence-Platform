import {
  FileText,
  GitBranch,
  ListChecks,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { InsightKind } from '@/types';

export const insightKindMeta: Record<
  InsightKind,
  {
    label: string;
    icon: LucideIcon;
    tone: string;
    badge: 'warning' | 'violet' | 'info' | 'success';
  }
> = {
  risk: {
    label: 'Risk signal',
    icon: TriangleAlert,
    tone: 'text-amber-400',
    badge: 'warning',
  },
  decision: {
    label: 'Decision',
    icon: GitBranch,
    tone: 'text-violet-400',
    badge: 'violet',
  },
  action: {
    label: 'Action pattern',
    icon: ListChecks,
    tone: 'text-blue-400',
    badge: 'info',
  },
  summary: {
    label: 'Summary',
    icon: FileText,
    tone: 'text-emerald-400',
    badge: 'success',
  },
};
