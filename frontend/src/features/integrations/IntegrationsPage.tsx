import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Plug,
  RefreshCw,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { IntegrationIcon } from '@/components/common/integration-icon';
import { IntegrationStatusBadge } from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  useIntegrations,
  useIntegrationSyncEvents,
  useSyncIntegration,
  useToggleIntegration,
} from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import {
  cn,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from '@/lib/utils';
import type {
  Integration,
  IntegrationSyncDirection,
  IntegrationSyncEvent,
} from '@/types';

const directionIcon: Record<IntegrationSyncDirection, LucideIcon> = {
  inbound: ArrowDownLeft,
  outbound: ArrowUpRight,
  two_way: ArrowLeftRight,
};

const directionLabel: Record<IntegrationSyncDirection, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  two_way: 'Two-way',
};

const healthTone = {
  healthy: 'bg-emerald-400',
  attention: 'bg-amber-400',
  offline: 'bg-slate-500',
} as const;

const statusTone = {
  success: 'text-emerald-400',
  partial: 'text-amber-400',
  failed: 'text-rose-400',
} as const;

const statusIcon: Record<IntegrationSyncEvent['status'], LucideIcon> = {
  success: CheckCircle2,
  partial: AlertTriangle,
  failed: AlertTriangle,
};

export function IntegrationsPage() {
  const { t } = useI18n();
  const integrations = useIntegrations();
  const syncEvents = useIntegrationSyncEvents();
  const toggle = useToggleIntegration();
  const sync = useSyncIntegration();
  const [category, setCategory] = useState('all');

  const list = useMemo(() => integrations.data ?? [], [integrations.data]);
  const connected = list.filter(
    (integration) => integration.status === 'connected'
  );
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(list.map((item) => item.category)))],
    [list]
  );
  const visible = useMemo(
    () =>
      category === 'all'
        ? list
        : list.filter((integration) => integration.category === category),
    [category, list]
  );

  const totalSynced = list.reduce(
    (total, integration) => total + integration.syncedItems,
    0
  );
  const attention = list.filter(
    (integration) =>
      integration.status === 'connected' && integration.health !== 'healthy'
  ).length;
  const log = syncEvents.data ?? [];

  if (integrations.isLoading) return <PageSkeleton />;

  if (integrations.error) {
    return (
      <ErrorState
        description={
          integrations.error instanceof Error
            ? integrations.error.message
            : t('Integrations could not be loaded.')
        }
        onRetry={() => void integrations.refetch()}
      />
    );
  }

  const handleToggle = (integration: Integration, next: boolean) => {
    toggle.mutate(
      { id: integration.id, connect: next },
      {
        onSuccess: () => {
          toast.success(
            next
              ? t('{{name}} connected', { name: integration.name })
              : t('{{name}} disconnected', { name: integration.name })
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('The integration could not be updated.')
          );
        },
      }
    );
  };

  const handleSync = (integration: Integration) => {
    sync.mutate(integration.id, {
      onSuccess: (event) => {
        toast.success(
          t('{{name}} synced: {{count}} items', {
            name: integration.name,
            count: event.itemCount,
          })
        );
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : t('The integration could not be synced.')
        );
      },
    });
  };

  const summary = [
    {
      label: t('Connected'),
      value: connected.length,
      icon: Plug,
      tone: 'text-blue-400',
    },
    {
      label: t('Items synced'),
      value: totalSynced,
      icon: RefreshCw,
      tone: 'text-emerald-400',
    },
    {
      label: t('Needs attention'),
      value: attention,
      icon: AlertTriangle,
      tone: 'text-amber-400',
    },
    {
      label: t('Sync events'),
      value: log.length,
      icon: Clock3,
      tone: 'text-violet-400',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Integrations hub')}
        description={t(
          'Bring meetings in from your calendar and video tools, then push decisions and follow-ups back where work happens.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{connected}} of {{total}} connected', {
              connected: connected.length,
              total: list.length,
            })}
          </Badge>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings?tab=integrations">
                <Settings2 className="h-3.5 w-3.5" />
                {t('Integration settings')}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/calendar">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('Open calendar')}
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 divide-x divide-border/70 p-0 sm:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5 px-4 py-3.5">
                <span className={cn('icon-tile h-8 w-8 border-border/70', item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold leading-none tabular">
                    {item.value}
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

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={cn(
              'inline-flex h-7 items-center rounded-md border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              category === item
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                : 'border-border/70 bg-secondary/30 text-muted-foreground hover:text-foreground'
            )}
          >
            {item === 'all' ? t('All providers') : t(item)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Plug}
          title={t('No integrations in this category')}
          description={t('Choose another category to see available providers.')}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((integration) => {
            const DirectionIcon = directionIcon[integration.syncDirection];
            const isSyncing =
              sync.isPending && sync.variables === integration.id;
            const isToggling =
              toggle.isPending && toggle.variables?.id === integration.id;
            const isConnected = integration.status === 'connected';

            return (
              <Card key={integration.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <IntegrationIcon integration={integration} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="truncate text-sm font-semibold text-foreground">
                          {integration.name}
                        </h2>
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            healthTone[integration.health]
                          )}
                          title={t(integration.health)}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t(integration.category)}
                      </p>
                    </div>
                    <IntegrationStatusBadge status={integration.status} />
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {integration.description}
                  </p>

                  <dl className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-md border border-border/60 bg-secondary/20 px-2 py-1.5">
                      <dt className="text-muted-foreground">{t('Direction')}</dt>
                      <dd className="mt-0.5 flex items-center gap-1 text-[11px] text-foreground">
                        <DirectionIcon className="h-3 w-3 text-muted-foreground" />
                        {t(directionLabel[integration.syncDirection])}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border/60 bg-secondary/20 px-2 py-1.5">
                      <dt className="text-muted-foreground">{t('Items synced')}</dt>
                      <dd className="mt-0.5 text-[11px] tabular text-foreground">
                        {integration.syncedItems}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border/60 bg-secondary/20 px-2 py-1.5">
                      <dt className="text-muted-foreground">{t('Last sync')}</dt>
                      <dd className="mt-0.5 truncate text-[11px] text-foreground">
                        {integration.lastSyncedAt
                          ? formatRelativeTime(integration.lastSyncedAt)
                          : t('Never')}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border/60 bg-secondary/20 px-2 py-1.5">
                      <dt className="text-muted-foreground">{t('Account')}</dt>
                      <dd className="mt-0.5 truncate text-[11px] text-foreground">
                        {integration.accountLabel ?? t('Not connected')}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={isConnected}
                        disabled={isToggling}
                        onCheckedChange={(checked) =>
                          handleToggle(integration, checked)
                        }
                        aria-label={t('{{name}} connection', {
                          name: integration.name,
                        })}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {isConnected ? t('Connected') : t('Available')}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={!isConnected || isSyncing}
                      onClick={() => handleSync(integration)}
                    >
                      {isSyncing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      {t('Sync now')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            {t('Sync activity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {syncEvents.isLoading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('Loading sync activity')}
            </div>
          ) : log.length === 0 ? (
            <p className="px-4 pb-4 text-xs text-muted-foreground">
              {t('No sync activity yet. Connect a provider and run a sync.')}
            </p>
          ) : (
            <div className="divide-y divide-border/70">
              {log.slice(0, 12).map((event) => {
                const integration = list.find(
                  (item) => item.id === event.integrationId
                );
                const StatusIcon = statusIcon[event.status];
                return (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-start gap-2 px-4 py-2.5"
                  >
                    <StatusIcon
                      className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', statusTone[event.status])}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">
                        {integration?.name ?? event.provider}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {t(directionLabel[event.direction])}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {event.summary}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{t('{{count}} items', { count: event.itemCount })}</span>
                      <span>{formatDuration(event.durationMs)}</span>
                      <span title={formatDateTime(event.startedAt)}>
                        {formatRelativeTime(event.startedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
