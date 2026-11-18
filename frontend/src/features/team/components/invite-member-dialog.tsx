import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Field } from '@/components/common/field';
import { useInviteMember } from '@/hooks/use-workspace';
import { useI18n } from '@/i18n';
import type { OrgRole } from '@/types';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const inviteMember = useInviteMember();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setRole('member');
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(t('Enter a valid email address'));
      return;
    }

    inviteMember.mutate(
      { email: trimmedEmail, role },
      {
        onSuccess: (member) => {
          toast.success(
            t('Invitation ready for {{email}}', { email: member.email })
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('Could not invite member')
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Invite a teammate')}</DialogTitle>
          <DialogDescription>
            {t(
              'Give someone access to the workspace and the work that follows each meeting.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('Work email')} htmlFor="invite-email">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('teammate@company.com')}
              autoFocus
              required
            />
          </Field>

          <Field
            label={t('Workspace role')}
            htmlFor="invite-role"
            hint={t(
              'Admins can manage members. Members can create and edit work.'
            )}
          >
            <NativeSelect
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as OrgRole)}
            >
              <option value="admin">{t('Admin')}</option>
              <option value="member">{t('Member')}</option>
              <option value="viewer">{t('Viewer')}</option>
            </NativeSelect>
          </Field>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('Send invitation')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
