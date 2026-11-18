import { useMemo, useState } from 'react';
import {
  Clock3,
  LayoutTemplate,
  ListChecks,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useMarkTemplateUsed,
  useMeetingTemplates,
  useToggleTemplateFavorite,
} from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import {
  emptyTemplateFilters,
  filterTemplates,
  playbookPrompts,
  sortTemplates,
  templateCategoryOrder,
  type TemplateSort,
} from '@/lib/templates';
import { cn, formatRelativeTime } from '@/lib/utils';
import { CreateMeetingDialog } from '@/features/meetings/components/create-meeting-dialog';
import type { MeetingTemplate, TemplateCategory } from '@/types';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import {
  accentTones,
  categoryIcons,
  categoryLabels,
} from './template-meta';

export function TemplatesPage() {
  const { t } = useI18n();
  const templates = useMeetingTemplates();
  const toggleFavorite = useToggleTemplateFavorite();
  const markUsed = useMarkTemplateUsed();
  const [filters, setFilters] = useState(emptyTemplateFilters());
  const [sort, setSort] = useState<TemplateSort>('popular');
  const [createOpen, setCreateOpen] = useState(false);
  const [playbook, setPlaybook] = useState<MeetingTemplate | null>(null);
  const [scheduleTemplate, setScheduleTemplate] =
    useState<MeetingTemplate | null>(null);

  const list = useMemo(() => templates.data ?? [], [templates.data]);
  const visible = useMemo(
    () => sortTemplates(filterTemplates(list, filters), sort),
    [list, filters, sort]
  );

  const summary = useMemo(() => {
    const prompts = list.reduce(
      (total, template) => total + playbookPrompts(template).length,
      0
    );
    const average =
      list.length === 0
        ? 0
        : Math.round(
            list.reduce((total, template) => total + template.durationMinutes, 0) /
              list.length
          );

    return [
      {
        label: t('Templates'),
        value: list.length,
        icon: LayoutTemplate,
        tone: 'text-blue-400',
      },
      {
        label: t('Favourites'),
        value: list.filter((template) => template.isFavorite).length,
        icon: Star,
        tone: 'text-amber-400',
      },
      {
        label: t('Playbook prompts'),
        value: prompts,
        icon: Sparkles,
        tone: 'text-violet-400',
      },
      {
        label: t('Average length'),
        value: average,
        icon: Clock3,
        tone: 'text-emerald-400',
      },
    ];
  }, [list, t]);

  if (templates.isLoading) return <PageSkeleton />;

  if (templates.error) {
    return (
      <ErrorState
        description={
          templates.error instanceof Error
            ? templates.error.message
            : t('The template library could not be loaded.')
        }
        onRetry={() => void templates.refetch()}
      />
    );
  }

  const startFromTemplate = (template: MeetingTemplate) => {
    setPlaybook(null);
    setScheduleTemplate(template);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Meeting templates')}
        description={t(
          'Reusable agendas and playbooks that keep every recurring meeting on the same track.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {t('{{count}} templates', { count: list.length })}
          </Badge>
        }
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t('New template')}
          </Button>
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

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              placeholder={t('Search templates...')}
              aria-label={t('Search templates')}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <NativeSelect
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value as TemplateCategory | 'all',
              }))
            }
            aria-label={t('Filter by category')}
            className="h-8 w-[170px] text-xs"
          >
            <option value="all">{t('All categories')}</option>
            {templateCategoryOrder.map((category) => (
              <option key={category} value={category}>
                {t(categoryLabels[category])}
              </option>
            ))}
          </NativeSelect>

          <Button
            type="button"
            variant={filters.favoritesOnly ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 text-[11px]"
            aria-pressed={filters.favoritesOnly}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                favoritesOnly: !current.favoritesOnly,
              }))
            }
          >
            <Star
              className={cn(
                'h-3.5 w-3.5',
                filters.favoritesOnly && 'fill-current text-amber-300'
              )}
            />
            {t('Favourites only')}
          </Button>
        </div>

        <div className="w-full sm:max-w-[190px]">
          <NativeSelect
            value={sort}
            onChange={(event) => setSort(event.target.value as TemplateSort)}
            aria-label={t('Sort templates')}
            className="h-8 text-xs"
          >
            <option value="popular">{t('Most used')}</option>
            <option value="recent">{t('Recently used')}</option>
            <option value="name">{t('Name A–Z')}</option>
          </NativeSelect>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title={t('No templates match this view')}
          description={t(
            'Clear the filters or create a template for the meetings your team repeats.'
          )}
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t('New template')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((template) => {
            const Icon = categoryIcons[template.category];
            const prompts = playbookPrompts(template);
            return (
              <Card key={template.id} className="flex h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={cn(
                        'icon-tile h-9 w-9 shrink-0 border',
                        accentTones[template.accent]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm">
                        {template.name}
                      </CardTitle>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t(categoryLabels[template.category])}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-pressed={template.isFavorite}
                    aria-label={t(
                      template.isFavorite
                        ? 'Remove {{name}} from favourites'
                        : 'Add {{name}} to favourites',
                      { name: template.name }
                    )}
                    disabled={toggleFavorite.isPending}
                    onClick={() =>
                      toggleFavorite.mutate({
                        templateId: template.id,
                        isFavorite: !template.isFavorite,
                      })
                    }
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        template.isFavorite
                          ? 'fill-current text-amber-300'
                          : 'text-muted-foreground'
                      )}
                    />
                  </Button>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {t('{{count}} min', { count: template.durationMinutes })}
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      {t('{{count}} phases', { count: template.phases.length })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t('{{count}} prompts', { count: prompts.length })}
                    </span>
                  </div>

                  {template.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[9px] text-muted-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <p className="text-[10px] text-muted-foreground">
                    {t('Used {{count}} times', { count: template.usageCount })}
                    {template.lastUsedAt ? (
                      <span>
                        {' · '}
                        {t('last {{time}}', {
                          time: formatRelativeTime(template.lastUsedAt),
                        })}
                      </span>
                    ) : null}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => startFromTemplate(template)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {t('Use template')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPlaybook(template)}
                    >
                      {t('View playbook')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(playbook)}
        onOpenChange={(open) => {
          if (!open) setPlaybook(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {playbook ? (
            <>
              <DialogHeader>
                <DialogTitle>{playbook.name}</DialogTitle>
                <DialogDescription>{playbook.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {playbook.phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="rounded-lg border border-border/70 bg-secondary/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {t('{{index}}. {{title}}', {
                          index: index + 1,
                          title: phase.title,
                        })}
                      </p>
                      <Badge variant="outline" className="text-[9px]">
                        {t('{{count}} min', {
                          count: phase.durationMinutes,
                        })}
                      </Badge>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {phase.prompts.map((prompt) => (
                        <li
                          key={prompt}
                          className="flex gap-1.5 text-[11px] text-muted-foreground"
                        >
                          <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0 text-violet-300" />
                          {prompt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPlaybook(null)}
                >
                  {t('Close')}
                </Button>
                <Button onClick={() => startFromTemplate(playbook)}>
                  <Play className="h-3.5 w-3.5" />
                  {t('Use template')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <CreateMeetingDialog
        open={Boolean(scheduleTemplate)}
        onOpenChange={(open) => {
          if (!open) setScheduleTemplate(null);
        }}
        template={scheduleTemplate}
        onScheduled={() => {
          if (scheduleTemplate) {
            markUsed.mutate(scheduleTemplate.id);
          }
        }}
      />
    </div>
  );
}
