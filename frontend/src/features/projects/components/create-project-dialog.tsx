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
      toast.error('A project name is required');
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
          toast.success(`“${project.name}” created`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Could not create project'
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Start a focused space for the work that follows your next meeting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Project name" htmlFor="project-name">
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Customer insight hub"
              autoFocus
              required
            />
          </Field>

          <Field label="Description" htmlFor="project-description">
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What outcome should this project create?"
              className="min-h-[72px]"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="project-category">
              <NativeSelect
                id="project-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="Product">Product</option>
                <option value="Research">Research</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
              </NativeSelect>
            </Field>

            <Field label="Status" htmlFor="project-status">
              <NativeSelect
                id="project-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
              >
                <option value="planning">Planning</option>
                <option value="on_track">On track</option>
                <option value="at_risk">At risk</option>
              </NativeSelect>
            </Field>
          </div>

          <Field label="Target date" htmlFor="project-due-date">
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
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
