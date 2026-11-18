import {
  Compass,
  LayoutTemplate,
  MessagesSquare,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { AccentColor, TemplateCategory } from '@/types';

export const categoryIcons: Record<TemplateCategory, LucideIcon> = {
  one_on_one: Users,
  standup: Zap,
  retrospective: RefreshCw,
  planning: Target,
  sales: TrendingUp,
  interview: MessagesSquare,
  customer: Compass,
  custom: LayoutTemplate,
};

export const categoryLabels: Record<TemplateCategory, string> = {
  one_on_one: 'One-on-one',
  standup: 'Stand-up',
  retrospective: 'Retrospective',
  planning: 'Planning meeting',
  sales: 'Sales',
  interview: 'Interview',
  customer: 'Customer',
  custom: 'Custom',
};

export const accentTones: Record<AccentColor, string> = {
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  slate: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};
