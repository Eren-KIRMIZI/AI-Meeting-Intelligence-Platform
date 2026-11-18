import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app/router';
import { AuthProvider } from '@/features/auth/auth-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWorkspace(entry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={[entry]}>
            <AppRoutes />
          </MemoryRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('AppLayout', () => {
  it('offers a skip link and a focusable main landmark', async () => {
    renderWorkspace('/tasks');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My Tasks' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'Skip to content' })
    ).toHaveAttribute('href', '#main-content');

    const main = document.getElementById('main-content');
    expect(main).not.toBeNull();
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('names the document and moves focus when the route changes', async () => {
    const user = userEvent.setup();
    renderWorkspace('/tasks');

    await screen.findByRole('heading', { level: 1, name: 'My Tasks' });
    expect(document.title).toBe('My Tasks — Nova');

    await user.click(screen.getAllByRole('link', { name: 'Projects' })[0]);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Projects' })
    ).toBeInTheDocument();
    expect(document.title).toBe('Projects — Nova');

    await waitFor(() => {
      expect(document.activeElement).toBe(
        document.getElementById('main-content')
      );
    });
  });
});
