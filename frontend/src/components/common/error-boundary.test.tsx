import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AppErrorFallback,
  ErrorBoundary,
  RouteErrorFallback,
} from './error-boundary';

afterEach(() => {
  vi.restoreAllMocks();
});

function Bomb({ armed }: { armed: boolean }) {
  if (armed) throw new Error('boom');
  return <p>Recovered view</p>;
}

function BoundaryHarness() {
  const [armed, setArmed] = useState(true);

  return (
    <MemoryRouter>
      <ErrorBoundary
        fallback={({ reset }) => (
          <div>
            <p>Fallback view</p>
            <button
              type="button"
              onClick={() => {
                setArmed(false);
                reset();
              }}
            >
              Try again
            </button>
          </div>
        )}
      >
        <Bomb armed={armed} />
      </ErrorBoundary>
    </MemoryRouter>
  );
}

describe('ErrorBoundary', () => {
  it('renders children while the tree is healthy', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary fallback={() => <p>Fallback view</p>}>
          <p>Healthy view</p>
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText('Healthy view')).toBeInTheDocument();
  });

  it('catches a render error and recovers after a reset', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    render(<BoundaryHarness />);

    expect(screen.getByText('Fallback view')).toBeInTheDocument();
    expect(screen.queryByText('Recovered view')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered view')).toBeInTheDocument();
    expect(screen.queryByText('Fallback view')).not.toBeInTheDocument();
  });
});

describe('RouteErrorFallback', () => {
  it('offers a retry and a way back for render errors', () => {
    render(
      <MemoryRouter>
        <RouteErrorFallback
          error={new Error('Cannot read properties of null')}
          reset={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('This page hit a snag')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to overview' })
    ).toHaveAttribute('href', '/overview');
  });

  it('asks for a reload when a route chunk failed to download', () => {
    render(
      <MemoryRouter>
        <RouteErrorFallback
          error={new Error('Failed to fetch dynamically imported module')}
          reset={() => {}}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText('This page could not be downloaded')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reload page' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Try again' })
    ).not.toBeInTheDocument();
  });
});

describe('AppErrorFallback', () => {
  it('keeps the recovery message calm and explicit', () => {
    render(<AppErrorFallback />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Nova needs a moment' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reload Nova' })
    ).toBeInTheDocument();
  });
});
