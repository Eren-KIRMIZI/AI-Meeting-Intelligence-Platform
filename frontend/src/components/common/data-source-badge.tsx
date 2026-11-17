import { Database, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isSupabaseConfigured } from '@/lib/env';

export function DataSourceBadge({ className }: { className?: string }) {
  if (isSupabaseConfigured) {
    return (
      <Badge variant="success" className={className}>
        <Radio className="h-3 w-3" />
        Live workspace
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      <Database className="h-3 w-3" />
      Demo data
    </Badge>
  );
}
