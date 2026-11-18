import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { aiBrief } from '@/mocks/data';
import { formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';

export function AiBriefCard() {
  const { t } = useI18n();
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="icon-tile h-8 w-8 border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <CardTitle>{t('AI brief')}</CardTitle>
            <CardDescription className="mt-1">
              {t('The latest meeting, distilled')}
            </CardDescription>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/intelligence">
            {t('Open')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-foreground">
            {aiBrief.meetingTitle}
          </p>
          <Badge variant="info" className="shrink-0">
            {t('Summary ready')}
          </Badge>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {aiBrief.summary}
        </p>

        <div className="mt-3.5 space-y-2">
          {aiBrief.items.map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-2 rounded-md border border-border/60 bg-secondary/25 px-2.5 py-2"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-snug text-foreground">
                  {item.text}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {item.owner} · {item.tag}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground">
          {t('Updated {{time}}', {
            time: formatRelativeTime(aiBrief.updatedAt),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
