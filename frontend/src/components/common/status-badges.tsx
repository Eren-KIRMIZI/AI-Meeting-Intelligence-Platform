import type { ReactNode } from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import {
  decisionStatusMeta,
  integrationStatusMeta,
  meetingStatusMeta,
  projectStatusMeta,
  taskPriorityMeta,
  taskStatusMeta,
  type StatusMeta,
} from '@/lib/status';
import type {
  DecisionStatus,
  IntegrationStatus,
  MeetingStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@/types';

function DotBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  const { t } = useI18n();
  return (
    <Badge
      variant={meta.tone as BadgeProps['variant']}
      className={cn('gap-1.5', className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {t(meta.label)}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <DotBadge meta={projectStatusMeta[status]} />;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <DotBadge meta={taskStatusMeta[status]} />;
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useI18n();
  return (
    <Badge variant={taskPriorityMeta[priority].tone as BadgeProps['variant']}>
      {t(taskPriorityMeta[priority].label)}
    </Badge>
  );
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return <DotBadge meta={decisionStatusMeta[status]} />;
}

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  return <DotBadge meta={meetingStatusMeta[status]} />;
}

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  return <DotBadge meta={integrationStatusMeta[status]} />;
}

export function MetaBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn('bg-secondary/30', className)}>
      {children}
    </Badge>
  );
}
