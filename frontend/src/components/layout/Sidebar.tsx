import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  logoutNav,
  primaryNav,
  secondaryNav,
  type NavItem,
} from '@/lib/navigation';
import { useAuth } from '@/features/auth/use-auth';
import { useUiStore } from '@/stores/ui-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { NovaMark } from '@/components/common/nova-mark';
import { UserAvatar } from '@/components/common/user-avatar';
import { useI18n } from '@/i18n';
import { LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function SidebarLink({ item }: { item: NavItem }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <NavLink
          to={item.path}
          aria-label={t(item.label)}
          className={({ isActive }) =>
            cn(
              'group relative grid h-10 w-10 place-items-center rounded-lg outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              isActive
                ? 'bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                : 'text-[#8A929E] hover:bg-white/[0.055] hover:text-white'
            )
          }
        >
          <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right">{t(item.label)}</TooltipContent>
    </Tooltip>
  );
}

function SidebarIconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="grid h-10 w-10 place-items-center rounded-lg text-[#8A929E] outline-none transition-colors hover:bg-white/[0.055] hover:text-white focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function MobileNavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const { t } = useI18n();
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring',
          isActive
            ? 'bg-primary text-white'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      <span>{t(item.label)}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, orgName, signOut } = useAuth();
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  const handleLogout = async () => {
    await signOut();
    setMobileNavOpen(false);
    navigate('/login');
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[68px] flex-col items-center border-r border-border/80 bg-sidebar lg:flex">
        <div className="flex h-[60px] w-full items-center justify-center border-b border-border/60">
          <Tooltip delayDuration={80}>
            <TooltipTrigger asChild>
              <NavLink
                to="/overview"
                aria-label={t('Nova home')}
                className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] outline-none transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring"
              >
                <NovaMark className="h-5 w-5" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              Nova · {orgName ?? t('Workspace')}
            </TooltipContent>
          </Tooltip>
        </div>

        <nav
          aria-label={t('Primary navigation')}
          className="no-scrollbar flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto py-3"
        >
          {primaryNav.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="flex w-full flex-col items-center gap-1 border-t border-border/60 py-3">
          {secondaryNav.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))}
          <SidebarIconButton
            label={t(logoutNav.label)}
            icon={logoutNav.icon}
            onClick={() => void handleLogout()}
          />
          <div className="mt-2 border-t border-border/50 pt-3">
            <UserAvatar user={user} size="md" ring />
          </div>
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="flex w-[286px] flex-col border-r-border bg-sidebar p-0 sm:max-w-[286px]"
        >
          <SheetTitle className="sr-only">{t('Workspace navigation')}</SheetTitle>
          <SheetDescription className="sr-only">
            {t('Navigate between Nova workspace modules.')}
          </SheetDescription>

          <div className="flex h-[60px] items-center gap-3 border-b border-border/70 px-4 pr-12">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
              <NovaMark className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold tracking-tight">
                Nova
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {orgName ?? t('Workspace')}
              </p>
            </div>
          </div>

          <nav
            aria-label={t('Mobile navigation')}
            className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-3"
          >
            {primaryNav.map((item) => (
              <MobileNavLink
                key={item.path}
                item={item}
                onNavigate={() => setMobileNavOpen(false)}
              />
            ))}
          </nav>

          <div className="space-y-1 border-t border-border/70 p-3">
            {secondaryNav.map((item) => (
              <MobileNavLink
                key={item.path}
                item={item}
                onNavigate={() => setMobileNavOpen(false)}
              />
            ))}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>{t('Log out')}</span>
            </button>

            <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {user?.fullName ?? t('Workspace member')}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user?.jobTitle ?? user?.email ?? t('Nova workspace')}
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
