import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Field } from '@/components/common/field';
import { useCreateMeetingTemplate } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import { templateCategoryOrder } from '@/lib/templates';
import type { TemplateCategory } from '@/types';
import { categoryLabels } from './template-meta';

interface PhaseDraft {
  key: string;
  title: string;
  minutes: string;
  prompts: string;
}

let phaseKey = 0;

function newPhase(): PhaseDraft {
  phaseKey += 1;
  return {
    key: `phase-${phaseKey}`,
    title: '',
    minutes: '10',
    prompts: '',
  };
}

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
}: CreateTemplateDialogProps) {
  const { t } = useI18n();
  const createTemplate = useCreateMeetingTemplate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('planning');
  const [duration, setDuration] = useState('45');
  const [tags, setTags] = useState('');
  const [phases, setPhases] = useState<PhaseDraft[]>([newPhase()]);

  const reset = () => {
    setName('');
    setDescription('');
    setCategory('planning');
    setDuration('45');
    setTags('');
    setPhases([newPhase()]);
  };

  const updatePhase = (key: string, patch: Partial<PhaseDraft>) => {
    setPhases((current) =>
      current.map((phase) => (phase.key === key ? { ...phase, ...patch } : phase))
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t('A template name is required'));
      return;
    }

    const filledPhases = phases
      .map((phase) => ({
        title: phase.title.trim(),
        durationMinutes: Math.max(1, Number(phase.minutes) || 10),
        prompts: phase.prompts
          .split('\n')
          .map((prompt) => prompt.trim())
          .filter(Boolean),
      }))
      .filter((phase) => phase.title);

    if (filledPhases.length === 0) {
      toast.error(t('Add at least one phase with a title'));
      return;
    }

    const totalMinutes = filledPhases.reduce(
      (total, phase) => total + phase.durationMinutes,
      0
    );

    createTemplate.mutate(
      {
        name: trimmedName,
        description: description.trim(),
        category,
        durationMinutes: Math.max(1, Number(duration) || totalMinutes),
        phases: filledPhases,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
      {
        onSuccess: (template) => {
          toast.success(
            t('“{{name}}” template created', { name: template.name })
          );
          reset();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('Could not create the template')
          );
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('New meeting template')}</DialogTitle>
          <DialogDescription>
            {t(
              'Save the agenda and prompts once, then reuse the playbook for every meeting that needs the same shape.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('Template name')} htmlFor="template-name">
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('e.g. Weekly product sync')}
              autoFocus
              required
            />
          </Field>

          <Field label={t('Description')} htmlFor="template-description">
            <Textarea
              id="template-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('What this playbook is for')}
              className="min-h-[72px]"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t('Category')} htmlFor="template-category">
              <NativeSelect
                id="template-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as TemplateCategory)
                }
              >
                {templateCategoryOrder.map((value) => (
                  <option key={value} value={value}>
                    {t(categoryLabels[value])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('Minutes')} htmlFor="template-duration">
              <Input
                id="template-duration"
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </Field>
            <Field label={t('Tags')} htmlFor="template-tags">
              <Input
                id="template-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={t('product, weekly')}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">
                {t('Phases')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setPhases((current) => [...current, newPhase()])}
              >
                <Plus className="h-3 w-3" />
                {t('Add phase')}
              </Button>
            </div>

            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div
                  key={phase.key}
                  className="rounded-lg border border-border/70 bg-secondary/20 p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <Field
                        label={t('Phase {{index}} title', { index: index + 1 })}
                        htmlFor={`phase-title-${phase.key}`}
                      >
                        <Input
                          id={`phase-title-${phase.key}`}
                          value={phase.title}
                          onChange={(event) =>
                            updatePhase(phase.key, {
                              title: event.target.value,
                            })
                          }
                          placeholder={t('e.g. Risks and decisions')}
                        />
                      </Field>
                    </div>
                    <div className="w-full sm:w-24">
                      <Field
                        label={t('Minutes')}
                        htmlFor={`phase-minutes-${phase.key}`}
                      >
                        <Input
                          id={`phase-minutes-${phase.key}`}
                          type="number"
                          min={1}
                          max={180}
                          value={phase.minutes}
                          onChange={(event) =>
                            updatePhase(phase.key, {
                              minutes: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('Remove phase {{index}}', {
                        index: index + 1,
                      })}
                      disabled={phases.length === 1}
                      onClick={() =>
                        setPhases((current) =>
                          current.filter((item) => item.key !== phase.key)
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-2">
                    <Field
                      label={t('Prompts')}
                      htmlFor={`phase-prompts-${phase.key}`}
                      hint={t('One prompt per line.')}
                    >
                      <Textarea
                        id={`phase-prompts-${phase.key}`}
                        value={phase.prompts}
                        onChange={(event) =>
                          updatePhase(phase.key, {
                            prompts: event.target.value,
                          })
                        }
                        placeholder={t('What could block the launch?')}
                        className="min-h-[64px]"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createTemplate.isPending}>
              {createTemplate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('Create template')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
