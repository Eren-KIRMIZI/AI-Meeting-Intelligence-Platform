import { Languages } from 'lucide-react';
import { toast } from 'sonner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  localeLabels,
  locales,
  translateFor,
  useI18n,
  type Locale,
} from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Persisted language switcher. The label names are intentionally native
 * ("English", "Türkçe") so people can find their language in any locale.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    setLocale(next);
    toast.success(translateFor(next, 'Language updated'));
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-3',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="icon-tile h-9 w-9 border-blue-500/20 bg-blue-500/10 text-blue-400">
          <Languages className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">
            {t('Interface language')}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {t('Choose the language used across the workspace.')}
          </p>
        </div>
      </div>
      <SegmentedControl
        value={locale}
        onValueChange={handleChange}
        options={locales.map((value) => ({
          value,
          label: localeLabels[value],
        }))}
        label={t('Language')}
      />
    </div>
  );
}
