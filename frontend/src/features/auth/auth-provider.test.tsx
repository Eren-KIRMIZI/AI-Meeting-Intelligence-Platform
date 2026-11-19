import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => {
  const membershipQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returns: vi.fn(),
  };
  const profileQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  return {
    membershipQuery,
    profileQuery,
    rpc: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    from: vi.fn(),
  };
});

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: true,
  env: {
    supabaseUrl: 'https://example.supabase.co',
    supabasePublishableKey: 'public-key',
    appUrl: '',
    liveKitUrl: '',
    isSupabaseConfigured: true,
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}));

import { AuthProvider } from './auth-provider';
import { useAuth } from './use-auth';

const session = {
  access_token: 'access-token',
  user: {
    id: 'user-1',
    email: 'new@example.com',
    user_metadata: {},
  },
} as unknown as Session;

const membership = {
  role: 'owner',
  organization_id: 'org-1',
  organizations: { name: 'Nova Labs' },
};

function Probe() {
  const { orgId, orgName, orgRole } = useAuth();
  return (
    <div data-testid="auth-probe">
      {JSON.stringify({ orgId, orgName, orgRole })}
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

describe('auth provider workspace bootstrap (live mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.membershipQuery.select.mockReturnThis();
    mocks.membershipQuery.eq.mockReturnThis();
    mocks.membershipQuery.limit.mockReturnThis();
    mocks.membershipQuery.returns.mockReset();
    mocks.profileQuery.select.mockReturnThis();
    mocks.profileQuery.eq.mockReturnThis();
    mocks.profileQuery.maybeSingle.mockResolvedValue({ data: null });
    mocks.from.mockImplementation((table: string) =>
      table === 'profiles' ? mocks.profileQuery : mocks.membershipQuery
    );
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({ data: { session } });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('uses an existing active membership without bootstrapping again', async () => {
    mocks.membershipQuery.returns.mockResolvedValue({ data: [membership] });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('auth-probe')).toHaveTextContent('org-1');
    });
    expect(screen.getByTestId('auth-probe')).toHaveTextContent('Nova Labs');
    expect(screen.getByTestId('auth-probe')).toHaveTextContent('owner');
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.membershipQuery.returns).toHaveBeenCalledTimes(1);
  });

  it('bootstraps a workspace and reloads the membership when none exists', async () => {
    (mocks.membershipQuery.returns as Mock)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [membership] });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('auth-probe')).toHaveTextContent('org-1');
    });
    expect(mocks.rpc).toHaveBeenCalledWith('bootstrap_workspace', {
      workspace_name: "new's Workspace",
    });
    expect(mocks.membershipQuery.returns).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('auth-probe')).toHaveTextContent('Nova Labs');
  });

  it('leaves the workspace unassigned when bootstrap fails', async () => {
    mocks.membershipQuery.returns.mockResolvedValue({ data: [] });
    mocks.rpc.mockResolvedValue({
      error: { message: 'permission denied' },
    });

    renderProvider();

    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('auth-probe')).toHaveTextContent('"orgId":null');
  });
});
