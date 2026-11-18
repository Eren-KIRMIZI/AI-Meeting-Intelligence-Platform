import { Database, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isSupabaseConfigured } from '@/lib/env';
import { useI18n } from '@/i18n';

export function DataSourceBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  if (isSupabaseConfigured) {
    return (
      <Badge variant="success" className={className}>
        <Radio className="h-3 w-3" />
        {t('Live workspace')}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      <Database className="h-3 w-3" />
      {t('Demo data')}
    </Badge>
  );
}
