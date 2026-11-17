import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/features/auth/auth-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { allNavItems } from '@/lib/navigation';
import { Sidebar } from './Sidebar';

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/overview']}>
      <AuthProvider>
        <TooltipProvider>
          <Sidebar />
        </TooltipProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  it('renders every workspace module as an accessible link', () => {
    renderSidebar();

    // The Nova home mark is the only extra link besides the modules.
    expect(screen.getAllByRole('link')).toHaveLength(allNavItems.length + 1);

    for (const item of allNavItems) {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.path);
    }
  });

  it('exposes the home, primary navigation and sign out controls', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Nova home' })).toHaveAttribute(
      'href',
      '/overview'
    );
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Log out' })
    ).toBeInTheDocument();
  });
});
