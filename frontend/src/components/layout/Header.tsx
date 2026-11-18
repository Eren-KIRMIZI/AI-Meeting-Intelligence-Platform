import { useLocation } from 'react-router-dom';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { resolveRouteMeta } from '@/lib/navigation';
import { useAuth } from '@/features/auth/use-auth';
import { useUiStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { DataSourceBadge } from '@/components/common/data-source-badge';
import { useI18n } from '@/i18n';
import { NotificationsMenu } from './notifications-menu';
import { UserMenu } from './user-menu';

export function Header() {
  const location = useLocation();
  const { orgName } = useAuth();
  const { t } = useI18n();
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  const meta = resolveRouteMeta(location.pathname);
  const title = t(meta.title);
  const parent = t(meta.parent ?? orgName ?? 'Workspace');

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2 border-b border-border/80 bg-background/85 px-3 backdrop-blur-md sm:px-5 lg:px-8">
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('Open navigation')}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <nav
        aria-label={t('Breadcrumb')}
        className="hidden min-w-0 shrink-0 items-center gap-1.5 text-xs sm:flex"
      >
        <span className="max-w-[150px] truncate text-muted-foreground">
          {parent}
        </span>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
        <span className="font-medium text-foreground">{title}</span>
        <DataSourceBadge className="ml-1.5 hidden xl:inline-flex" />
      </nav>

      <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-3">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="group flex h-8 w-full max-w-[460px] items-center gap-2 rounded-md border border-border/80 bg-secondary/30 px-3 text-left text-xs text-muted-foreground outline-none transition-colors hover:border-border hover:bg-secondary/60 focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            <span className="hidden sm:inline">
              {t('Search for tasks, projects, meetings, or team members...')}
            </span>
            <span className="sm:hidden">{t('Search workspace...')}</span>
          </span>
          <span
            className="ml-auto hidden shrink-0 items-center gap-1 sm:flex"
            aria-hidden="true"
          >
            <kbd className="kbd">⌘</kbd>
            <kbd className="kbd">K</kbd>
          </span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label={t('Search workspace')}
        >
          <Search className="h-4 w-4" />
        </Button>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
