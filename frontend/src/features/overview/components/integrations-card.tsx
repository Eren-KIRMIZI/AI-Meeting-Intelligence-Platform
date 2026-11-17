import { Link } from 'react-router-dom';
import { ChevronRight, Plug } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { IntegrationIcon } from '@/components/common/integration-icon';
import { IntegrationStatusBadge } from '@/components/common/status-badges';
import { useToggleIntegration } from '@/hooks/use-workspace';
import { cn } from '@/lib/utils';
import type { Integration } from '@/types';

export function IntegrationsCard({
  integrations,
}: {
  integrations: Integration[];
}) {
  const toggle = useToggleIntegration();
  const connected = integrations.filter(
    (integration) => integration.status === 'connected'
  ).length;

  const handleToggle = (integration: Integration, next: boolean) => {
    toggle.mutate(
      { id: integration.id, connect: next },
      {
        onSuccess: () => {
          toast.success(
            next
              ? `${integration.name} connected`
              : `${integration.name} disconnected`
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not update the integration'
          );
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle>Integrations</CardTitle>
          <CardDescription className="mt-1">
            {connected} of {integrations.length} tools connected
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/settings">
            Manage
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        {integrations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
            No integrations available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {integrations.slice(0, 6).map((integration) => {
              const isConnected = integration.status === 'connected';
              return (
                <div
                  key={integration.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors',
                    isConnected
                      ? 'border-border/80 bg-secondary/25'
                      : 'border-border/60 bg-transparent'
                  )}
                >
                  <IntegrationIcon integration={integration} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {integration.name}
                    </p>
                    <div className="mt-1">
                      <IntegrationStatusBadge status={integration.status} />
                    </div>
                  </div>
                  <Switch
                    checked={isConnected}
                    disabled={toggle.isPending}
                    onCheckedChange={(next) => handleToggle(integration, next)}
                    aria-label={`${isConnected ? 'Disconnect' : 'Connect'} ${integration.name}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 rounded-md bg-secondary/25 px-3 py-2 text-[10px] text-muted-foreground">
          <Plug className="h-3 w-3" />
          Connections are simulated in demo mode.
        </div>
      </CardContent>
    </Card>
  );
}
