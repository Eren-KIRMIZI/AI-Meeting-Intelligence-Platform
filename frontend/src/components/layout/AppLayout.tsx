import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageSkeleton } from '@/components/common/page-skeleton';
import {
  ErrorBoundary,
  RouteErrorFallback,
} from '@/components/common/error-boundary';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { resolveRouteMeta } from '@/lib/navigation';
import { useI18n } from '@/i18n';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { useWorkspaceRealtime } from '@/hooks/use-workspace-realtime';

function RouteTitle() {
  const { pathname } = useLocation();
  useDocumentTitle(resolveRouteMeta(pathname).title);
  return null;
}

export function AppLayout() {
  const location = useLocation();
  const { t } = useI18n();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useWorkspaceRealtime();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;

    // Move focus into the new page so keyboard and screen reader users do not
    // have to tab through the shell again after every navigation.
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <RouteTitle />
      <a href="#main-content" className="skip-link">
        {t('Skip to content')}
      </a>
      <Sidebar />
      <div className="min-w-0 lg:pl-[68px]">
        <Header />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="page-container focus:outline-none"
        >
          <ErrorBoundary
            key={location.pathname}
            fallback={({ error, reset }) => (
              <RouteErrorFallback error={error} reset={reset} />
            )}
          >
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
