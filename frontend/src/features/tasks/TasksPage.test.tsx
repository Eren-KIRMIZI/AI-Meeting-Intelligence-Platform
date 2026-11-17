import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app/router';
import { AuthProvider } from '@/features/auth/auth-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderTasks() {
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
          <MemoryRouter initialEntries={['/tasks']}>
            <AppRoutes />
          </MemoryRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('TasksPage', () => {
  it('loads the board and flips a task through the mock workspace', async () => {
    const user = userEvent.setup();
    renderTasks();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'My Tasks' })
    ).toBeInTheDocument();

    // t-01 ships as done, so the checkbox offers to reopen it first.
    const checkbox = await screen.findByRole(
      'checkbox',
      { name: /Mark .Finalize onboarding checklist. as open/ },
      { timeout: 4000 }
    );

    await user.click(checkbox);

    expect(
      await screen.findByRole(
        'checkbox',
        { name: /Mark .Finalize onboarding checklist. as done/ },
        { timeout: 4000 }
      )
    ).toBeInTheDocument();
  });
});
