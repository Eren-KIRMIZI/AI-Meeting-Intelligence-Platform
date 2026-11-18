import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Command,
  LogOut,
  Settings,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/auth-provider';
import { useUiStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/common/user-avatar';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, orgName, isDemo, signOut } = useAuth();
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  const handleSignOut = async () => {
    await signOut();
    toast.success(isDemo ? 'Demo session ended' : 'Signed out');
    navigate('/login');
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-1.5 text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <UserAvatar user={user} size="md" />
            <span className="sr-only">
              {user?.fullName ?? 'Workspace member'} account menu
            </span>
            <ChevronDown aria-hidden="true" className="hidden h-3 w-3 sm:block" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="p-0 pb-1">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.fullName ?? 'Workspace member'}
              </p>
              <p className="truncate text-[11px] font-normal text-muted-foreground">
                {user?.email ?? 'No email'}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <div className="mx-2.5 mb-1 flex items-center justify-between rounded-md border border-border/60 bg-secondary/30 px-2 py-1.5">
          <span className="text-[10px] text-muted-foreground">{orgName ?? 'Workspace'}</span>
          <span className="text-[10px] font-medium text-muted-foreground">
            {isDemo ? 'Demo' : 'Live'}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <UserRound />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <Settings />
          Workspace settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setCommandOpen(true)}>
          <Command />
          Command menu
          <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-rose-400 focus:text-rose-300"
          onSelect={() => void handleSignOut()}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
