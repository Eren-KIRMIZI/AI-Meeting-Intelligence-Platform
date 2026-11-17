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
import { useCreateWorkflow } from '@/hooks/use-workspace';

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const triggers = [
  { value: 'meeting_completed', label: 'Meeting completed' },
  { value: 'decision_accepted', label: 'Decision accepted' },
  { value: 'task_overdue', label: 'Task overdue 48h' },
  { value: 'schedule', label: 'On a schedule' },
  { value: 'transcript_ready', label: 'Transcript ready' },
] as const;

export function CreateWorkflowDialog({
  open,
  onOpenChange,
}: CreateWorkflowDialogProps) {
  const createWorkflow = useCreateWorkflow();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('meeting_completed');
  const [actions, setActions] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setTriggerType('meeting_completed');
    setActions('');
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const actionLabels = actions
      .split('\n')
      .map((action) => action.trim())
      .filter(Boolean);

    if (!trimmedName) {
      toast.error('A workflow name is required');
      return;
    }
    if (actionLabels.length === 0) {
      toast.error('Add at least one action');
      return;
    }

    const trigger =
      triggers.find((item) => item.value === triggerType) ?? triggers[0];

    createWorkflow.mutate(
      {
        name: trimmedName,
        description: description.trim(),
        triggerType,
        triggerLabel: trigger.label,
        actionLabels,
      },
      {
        onSuccess: (workflow) => {
          toast.success(`“${workflow.name}” is now active`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Could not create workflow'
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a workflow</DialogTitle>
          <DialogDescription>
            Connect a workspace signal to the actions that should follow it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Workflow name" htmlFor="workflow-name">
            <Input
              id="workflow-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Decision → project update"
              autoFocus
              required
            />
          </Field>

          <Field label="Description" htmlFor="workflow-description">
            <Textarea
              id="workflow-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should this automation keep in sync?"
              className="min-h-[72px]"
            />
          </Field>

          <Field label="Trigger" htmlFor="workflow-trigger">
            <NativeSelect
              id="workflow-trigger"
              value={triggerType}
              onChange={(event) => setTriggerType(event.target.value)}
            >
              {triggers.map((trigger) => (
                <option key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            label="Actions"
            htmlFor="workflow-actions"
            hint="One action per line. They run in the order shown."
          >
            <Textarea
              id="workflow-actions"
              value={actions}
              onChange={(event) => setActions(event.target.value)}
              placeholder={'Summarize transcript\nCreate action item drafts'}
              className="min-h-[92px]"
              required
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
            <Button type="submit" disabled={createWorkflow.isPending}>
              {createWorkflow.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
