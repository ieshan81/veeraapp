import { queryClient } from '@/lib/query-client';
import { clearPendingQrToken } from '@/lib/pendingPlantLink';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configError: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const configError = !isSupabaseConfigured;

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      console.warn(error.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    await loadProfile(uid);
  }, [loadProfile, session?.user?.id]);

  useEffect(() => {
    if (configError) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Rely on onAuthStateChange only: it emits INITIAL_SESSION after the same init
    // path as getSession(). A duplicate getSession() doubled refresh work and could
    // race with storage cleanup when the refresh token is invalid/revoked.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return;
      setSession(s);
      if (s?.user?.id) {
        void loadProfile(s.user.id).finally(() => {
          if (!cancelled) setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configError, loadProfile]);

  const signOut = useCallback(async () => {
    await clearPendingQrToken();
    await supabase.auth.signOut();
    setProfile(null);
    queryClient.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configError,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, configError, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
