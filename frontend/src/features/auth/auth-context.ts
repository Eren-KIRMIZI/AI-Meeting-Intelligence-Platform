import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { OrgRole, UserProfile } from '@/types';

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null);
