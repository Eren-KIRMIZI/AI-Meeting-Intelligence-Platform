import {
  BookOpen,
  FileText,
  Lightbulb,
  ScrollText,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import type { KnowledgeKind } from '@/types';

export const kindMeta: Record<
  KnowledgeKind,
  { label: string; icon: LucideIcon; tone: string }
> = {
  meeting_note: {
    label: 'Meeting note',
    icon: StickyNote,
    tone: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  },
  transcript: {
    label: 'Transcript',
    icon: ScrollText,
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
  playbook: {
    label: 'Playbook',
    icon: BookOpen,
    tone: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  },
  insight: {
    label: 'Insight',
    icon: Lightbulb,
    tone: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  },
  document: {
    label: 'Document',
    icon: FileText,
    tone: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  },
};

export const knowledgeFilters: Array<{ value: 'all' | KnowledgeKind; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'meeting_note', label: 'Meeting notes' },
  { value: 'transcript', label: 'Transcripts' },
  { value: 'playbook', label: 'Playbooks' },
  { value: 'insight', label: 'Insights' },
  { value: 'document', label: 'Documents' },
];
