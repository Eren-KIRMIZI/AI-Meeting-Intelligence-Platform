import { useMemo, useState } from 'react';
import {
  Download,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { NativeSelect } from '@/components/ui/select-native';
import {
  useAuditEvents,
  useComplianceControls,
  useRecordAuditExport,
} from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import {
  auditEventsToCsv,
  auditSummary,
  complianceScore,
  emptyAuditFilters,
  filterAuditEvents,
  groupControlsByFramework,
} from '@/lib/audit';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import type {
  AuditCategory,
  AuditEvent,
  AuditSeverity,
} from '@/types';
import {
  auditCategoryLabels,
  auditSeverityLabels,
  complianceStatusLabels,
  frameworkLabels,
  severityVariant,
  statusVariant,
} from './audit-meta';

const dayOptions = [
  { value: '0', label: 'All time' },
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

function downloadCsv(content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nova-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AuditPage() {
  const { t } = useI18n();
  const audit = useAuditEvents();
  const controls = useComplianceControls();
  const recordExport = useRecordAuditExport();
  const [filters, setFilters] = useState(emptyAuditFilters());

  const events = useMemo(() => audit.data ?? [], [audit.data]);
  const controlList = useMemo(() => controls.data ?? [], [controls.data]);
  const filtered = useMemo(
    () => filterAuditEvents(events, filters),
    [events, filters]
  );
  const summary = useMemo(() => auditSummary(events), [events]);
  const score = useMemo(() => complianceScore(controlList), [controlList]);
  const groups = useMemo(
    () => groupControlsByFramework(controlList),
    [controlList]
  );

  if (audit.isLoading || controls.isLoading) return <PageSkeleton />;

  if (audit.error || controls.error) {
    const error = audit.error ?? controls.error;
    return (
      <ErrorState
        description={
          error instanceof Error
            ? error.message
            : t('The audit workspace could not be loaded.')
        }
        onRetry={() => {
          void audit.refetch();
          void controls.refetch();
        }}
      />
    );
  }

  const handleExport = () => {
    downloadCsv(auditEventsToCsv(filtered));
    recordExport.mutate(filtered.length, {
      onSuccess: () => toast.success(t('Audit log exported')),
      onError: (error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : t('Could not export the audit log')
        ),
    });
  };

  const summaryCards = [
    {
      label: t('Audit events'),
      value: summary.total,
      icon: FileCheck2,
      tone: 'text-blue-400',
      suffix: '',
    },
    {
      label: t('Critical events'),
      value: summary.critical,
      icon: ShieldAlert,
      tone: 'text-rose-400',
      suffix: '',
    },
    {
      label: t('Warnings'),
      value: summary.warning,
      icon: TriangleAlert,
      tone: 'text-amber-400',
      suffix: '',
    },
    {
      label: t('Compliance score'),
      value: score,
      icon: ShieldCheck,
      tone: 'text-emerald-400',
      suffix: '%',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Audit & compliance')}
        description={t(
          'Every sensitive action, integration change and access decision in one verifiable trail.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{count}} events', { count: events.length })}
          </Badge>
        }
        actions={
          <Button
            size="sm"
            onClick={handleExport}
            disabled={recordExport.isPending || filtered.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            {t('Export CSV')}
          </Button>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 divide-x divide-border/70 p-0 sm:grid-cols-4">
          {summaryCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5 px-4 py-3.5">
                <span className={cn('icon-tile h-8 w-8 border-border/70', item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold leading-none tabular">
                    {item.value}
                    {item.suffix ? (
                      <span className="text-xs text-muted-foreground">
                        {item.suffix}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="gap-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              {t('Audit log')}
            </CardTitle>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Input
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    query: event.target.value,
                  }))
                }
                placeholder={t('Search audit events...')}
                aria-label={t('Search audit events')}
                className="h-8 text-xs sm:max-w-[220px]"
              />
              <NativeSelect
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    category: event.target.value as AuditCategory | 'all',
                  }))
                }
                aria-label={t('Filter by category')}
                className="h-8 text-xs sm:w-[150px]"
              >
                <option value="all">{t('All categories')}</option>
                {Object.entries(auditCategoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={filters.severity}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    severity: event.target.value as AuditSeverity | 'all',
                  }))
                }
                aria-label={t('Filter by severity')}
                className="h-8 text-xs sm:w-[140px]"
              >
                <option value="all">{t('All severities')}</option>
                {Object.entries(auditSeverityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={filters.days === null ? '0' : String(filters.days)}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    days:
                      event.target.value === '0'
                        ? null
                        : Number(event.target.value),
                  }))
                }
                aria-label={t('Time range')}
                className="h-8 text-xs sm:w-[150px]"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="px-4 pb-4">
                <EmptyState
                  icon={ShieldCheck}
                  title={t('No audit events match this view')}
                  description={t(
                    'Adjust the filters or widen the time range to see more activity.'
                  )}
                />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filtered.map((event: AuditEvent) => (
                  <div key={event.id} className="flex gap-3 px-4 py-2.5">
                    <UserAvatar user={event.actor} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-medium text-foreground">
                          {event.action}
                        </p>
                        <Badge
                          variant={severityVariant[event.severity]}
                          className="text-[9px]"
                        >
                          {t(auditSeverityLabels[event.severity])}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {t(auditCategoryLabels[event.category])}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {t('{{actor}} · {{target}}', {
                          actor: event.actor.fullName,
                          target: event.target,
                        })}
                      </p>
                      {event.metadata ? (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {event.metadata}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(event.occurredAt)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {formatDate(event.occurredAt, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {event.ipAddress ? (
                        <p className="text-[9px] tabular text-muted-foreground">
                          {event.ipAddress}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                {t('Overall readiness')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <p className="font-display text-2xl font-semibold leading-none tabular">
                  {score}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t('{{count}} controls', { count: controlList.length })}
                </p>
              </div>
              <Progress value={score} aria-label={t('Compliance score')} />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t(
                  'Passing controls count in full, controls that need attention count half and failing controls do not count.'
                )}
              </p>
            </CardContent>
          </Card>

          {groups.map((group) => (
            <Card key={group.framework}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm">
                  {t(frameworkLabels[group.framework])}
                </CardTitle>
                <Badge
                  variant={
                    group.score >= 80
                      ? 'success'
                      : group.score >= 50
                        ? 'warning'
                        : 'danger'
                  }
                  className="text-[9px]"
                >
                  {group.score}%
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.controls.map((control) => (
                  <div
                    key={control.id}
                    className="rounded-md border border-border/60 bg-secondary/20 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground">
                          {control.code} · {control.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                          {control.description}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariant[control.status]}
                        className="shrink-0 text-[9px]"
                      >
                        {t(complianceStatusLabels[control.status])}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserAvatar user={control.owner} size="xs" />
                        {control.owner.fullName}
                      </span>
                      <span>
                        {t('{{count}} evidence items', {
                          count: control.evidenceCount,
                        })}
                      </span>
                      <span>
                        {t('checked {{time}}', {
                          time: formatRelativeTime(control.lastCheckedAt),
                        })}
                      </span>
                    </div>
                    {control.remediation ? (
                      <p className="mt-1.5 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">
                        {control.remediation}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
