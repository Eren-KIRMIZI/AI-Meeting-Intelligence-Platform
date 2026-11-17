import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

interface MembershipRow {
  role: string;
  organization_id: string;
  organizations: { name: string } | { name: string }[] | null;
}

interface AuthContextValue {
  user: UserProfile | null;
  session: Session | null;
  orgId: string | null;
  orgName: string | null;
  orgRole: OrgRole | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const loadWorkspace = useCallback(async (nextSession: Session) => {
    if (!supabase) return;

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

    const { data: memberships } = await supabase
      .from('organization_members')
      .select('role, organization_id, organizations(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .returns<MembershipRow[]>();

    const membership = memberships?.[0];
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
