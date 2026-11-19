import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { demoOrg, demoUser } from '@/mocks/data';
import { avatarColorFor, getInitials } from '@/lib/utils';
import { asOrgRole } from '@/services/enum-guards';
import type { OrgRole, UserProfile } from '@/types';
import { AuthContext } from './auth-context';

interface MembershipRow {
  role: string;
  organization_id: string;
  organizations: { name: string } | { name: string }[] | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isDemo = !isSupabaseConfigured;
  const [user, setUser] = useState<UserProfile | null>(isDemo ? demoUser : null);
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(isDemo ? demoOrg.id : null);
  const [orgName, setOrgName] = useState<string | null>(
    isDemo ? demoOrg.name : null
  );
  const [orgRole, setOrgRole] = useState<OrgRole | null>(isDemo ? 'owner' : null);
  const [loading, setLoading] = useState(!isDemo);
  const bootstrappedUser = useRef<string | null>(null);

  const loadWorkspace = useCallback(async (nextSession: Session) => {
    if (!supabase) return;
    const client = supabase;

    const userId = nextSession.user.id;

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileRow) {
      const fullName =
        (profileRow.full_name as string | null)?.trim() ||
        nextSession.user.email?.split('@')[0] ||
        'Workspace member';

      setUser({
        id: userId,
        fullName,
        email: (profileRow.email as string) ?? nextSession.user.email ?? '',
        initials: getInitials(fullName),
        avatarColor: avatarColorFor(userId),
        avatarUrl: (profileRow.avatar_url as string | null) ?? undefined,
        jobTitle: (profileRow.job_title as string | null) ?? undefined,
      });
    } else {
      const fullName =
        (nextSession.user.user_metadata?.full_name as string | undefined) ??
        nextSession.user.email?.split('@')[0] ??
        'Workspace member';
      setUser({
        id: userId,
        fullName,
        email: nextSession.user.email ?? '',
        initials: getInitials(fullName),
        avatarColor: avatarColorFor(userId),
      });
    }

    const readMembership = async (): Promise<MembershipRow | null> => {
      const { data: memberships } = await client
        .from('organization_members')
        .select('role, organization_id, organizations(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .returns<MembershipRow[]>();

      return memberships?.[0] ?? null;
    };

    let membership = await readMembership();

    // A freshly created auth user only gets a profile row from the database
    // trigger. Without a membership every org-scoped service throws. The
    // bootstrap RPC is idempotent, so create the first workspace on sign-in.
    if (!membership && bootstrappedUser.current !== userId) {
      bootstrappedUser.current = userId;
      const displayName =
        (profileRow?.full_name as string | null)?.trim() ||
        (nextSession.user.user_metadata?.full_name as string | undefined) ||
        nextSession.user.email?.split('@')[0] ||
        'Workspace member';

      const { error: bootstrapError } = await client.rpc(
        'bootstrap_workspace',
        { workspace_name: `${displayName}'s Workspace` }
      );

      if (!bootstrapError) {
        membership = await readMembership();
      }
    }

    if (membership) {
      const organization = Array.isArray(membership.organizations)
        ? membership.organizations[0]
        : membership.organizations;
      setOrgId(membership.organization_id);
      setOrgName(organization?.name ?? 'Workspace');
      setOrgRole(asOrgRole(membership.role));
    } else {
      setOrgId(null);
      setOrgName(null);
      setOrgRole(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (data.session) {
          await loadWorkspace(data.session);
        }
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);

        if (nextSession) {
          setLoading(true);
          void loadWorkspace(nextSession).finally(() => {
            if (active) setLoading(false);
          });
        } else {
          setUser(null);
          setOrgId(null);
          setOrgName(null);
          setOrgRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadWorkspace]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        setUser(demoUser);
        setOrgId(demoOrg.id);
        setOrgName(demoOrg.name);
        setOrgRole('owner');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setOrgId(null);
    setOrgName(null);
    setOrgRole(null);
    bootstrappedUser.current = null;
  }, []);

  const enterDemo = useCallback(() => {
    setUser(demoUser);
    setOrgId(demoOrg.id);
    setOrgName(demoOrg.name);
    setOrgRole('owner');
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      orgId,
      orgName,
      orgRole,
      loading,
      isDemo,
      signIn,
      signOut,
      enterDemo,
    }),
    [user, session, orgId, orgName, orgRole, loading, isDemo, signIn, signOut, enterDemo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
