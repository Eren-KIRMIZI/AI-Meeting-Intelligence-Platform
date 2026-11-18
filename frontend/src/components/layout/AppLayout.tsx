import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { useWorkspaceRealtime } from '@/hooks/use-workspace-realtime';

export function AppLayout() {
  const location = useLocation();
  useWorkspaceRealtime();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="min-w-0 lg:pl-[68px]">
        <Header />
        <main className="page-container">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
