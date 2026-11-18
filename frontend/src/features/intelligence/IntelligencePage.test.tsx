import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app/router';
import { AuthProvider } from '@/features/auth/auth-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderIntelligence(entry = '/intelligence') {
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

async function findQueue() {
  expect(
    await screen.findByRole(
      'heading',
      { level: 1, name: 'AI Intelligence' },
      { timeout: 5000 }
    )
  ).toBeInTheDocument();
}

describe('IntelligencePage', () => {
  it('opens an insight straight from a deep link', async () => {
    renderIntelligence('/intelligence?insight=ins-01');

    // The dialog opens as soon as the queue resolves, and Radix marks the page
    // behind the modal as aria-hidden, so the page heading is not queryable yet.
    const dialog = await screen.findByRole('dialog', {}, { timeout: 5000 });
    expect(
      within(dialog).getByText('Launch timing is the only repeated risk')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Risk signal')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Accept' })
    ).toBeInTheDocument();

    await userEvent.setup().click(
      within(dialog).getByRole('button', { name: 'Close' })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await findQueue();
  });

  it('filters the queue by kind, status and search', async () => {
    const user = userEvent.setup();
    renderIntelligence();
    await findQueue();

    await user.selectOptions(screen.getByLabelText('Filter by kind'), 'risk');
    expect(await screen.findByText('2 of 8 signals')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter by kind'), 'all');
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'open');
    expect(await screen.findByText('3 of 8 signals')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'all');
    await user.type(screen.getByLabelText('Search insights'), 'leadership');
    expect(await screen.findByText('1 of 8 signals')).toBeInTheDocument();
  });

  it('accepts and reopens a signal from the detail panel', async () => {
    const user = userEvent.setup();
    renderIntelligence();
    await findQueue();

    await user.click(
      await screen.findByRole(
        'button',
        { name: /Prototype single-owner action extraction/i },
        { timeout: 5000 }
      )
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Action pattern')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Accept' }));
    expect(
      await within(dialog).findByRole('button', { name: 'Reopen' })
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Accepted')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    expect(
      await within(dialog).findByRole('button', { name: 'Accept' })
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Open')).toBeInTheDocument();
  });
});
