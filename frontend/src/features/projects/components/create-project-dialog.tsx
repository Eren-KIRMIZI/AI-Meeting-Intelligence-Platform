import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
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
import { useCreateProject } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import type { ProjectStatus } from '@/types';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultDueDate = () =>
  new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const createProject = useCreateProject();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Product');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [dueDate, setDueDate] = useState(defaultDueDate);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setCategory('Product');
    setStatus('planning');
    setDueDate(defaultDueDate());
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t('A project name is required'));
      return;
    }

    createProject.mutate(
      {
        name: trimmedName,
        description: description.trim(),
        status,
        category,
        dueDate,
      },
      {
        onSuccess: (project) => {
          toast.success(t('“{{name}}” created', { name: project.name }));
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t('Could not create project')
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create a project')}</DialogTitle>
          <DialogDescription>
            {t('Start a focused space for the work that follows your next meeting.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('Project name')} htmlFor="project-name">
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('e.g. Customer insight hub')}
              autoFocus
              required
            />
          </Field>

          <Field label={t('Description')} htmlFor="project-description">
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('What outcome should this project create?')}
              className="min-h-[72px]"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('Category')} htmlFor="project-category">
              <NativeSelect
                id="project-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="Product">{t('Product')}</option>
                <option value="Research">{t('Research')}</option>
                <option value="Marketing">{t('Marketing')}</option>
                <option value="Operations">{t('Operations')}</option>
                <option value="Engineering">{t('Engineering')}</option>
              </NativeSelect>
            </Field>

            <Field label={t('Status')} htmlFor="project-status">
              <NativeSelect
                id="project-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
              >
                <option value="planning">{t('Planning')}</option>
                <option value="on_track">{t('On track')}</option>
                <option value="at_risk">{t('At risk')}</option>
              </NativeSelect>
            </Field>
          </div>

          <Field label={t('Target date')} htmlFor="project-due-date">
            <Input
              id="project-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('Create project')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
