import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';

export function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="min-w-0 lg:pl-[68px]">
        <Header />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
