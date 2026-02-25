import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (email: string, password: string) => Promise<
    | { ok: true; needsEmailConfirmation: boolean }
    | { ok: false; error: string }
  >;
  signOut: () => Promise<void>;
  resendSignupEmail: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;
      if (error) {
        // In v1, treat as logged out; UI will show auth.
        setSession(null);
      } else {
        setSession(data.session ?? null);
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      // Best-effort: ensure profile exists for progress/habits.
      if (newSession?.user) {
        try {
          await supabase.from('profiles').upsert({ id: newSession.user.id });
        } catch {
          // ignore
        }
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;

    return {
      loading,
      session,
      user,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { ok: false, error: error.message };

        // If email confirmations are ON, Supabase returns user but no session until confirmed.
        const needsEmailConfirmation = !data.session;
        return { ok: true, needsEmailConfirmation };
      },
      resendSignupEmail: async (email) => {
        // Resend confirmation email.
        // Supabase uses type 'signup' for resending signup confirmations.
        const { error } = await supabase.auth.resend({ type: 'signup', email } as any);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
