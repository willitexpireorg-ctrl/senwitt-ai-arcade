import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export { isSupabaseConfigured };

export interface AuthResult {
  error: string | null;
}

/** Sends a magic sign-in link. No-op (with a friendly error) when cloud sync isn't configured. */
export const signInWithMagicLink = async (
  email: string,
  redirectTo: string = window.location.origin,
): Promise<AuthResult> => {
  if (!supabase) {
    return { error: 'Cloud sync isn\u2019t configured on this build.' };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  return { error: error?.message ?? null };
};

export const signOut = async (): Promise<void> => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getSession = async (): Promise<Session | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

/** Current access token for calling authenticated `/api/*` routes, or `null` when signed out. */
export const getAccessToken = async (): Promise<string | null> => {
  const session = await getSession();
  return session?.access_token ?? null;
};

/**
 * Subscribes to auth state changes (including the initial session on load).
 * Supabase handles magic-link redirect tokens in the URL automatically via
 * `detectSessionInUrl` on the client — no manual parsing needed here.
 * Returns an unsubscribe function; no-op when supabase isn't configured.
 */
export const onAuthStateChange = (callback: (session: Session | null) => void): (() => void) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
};
