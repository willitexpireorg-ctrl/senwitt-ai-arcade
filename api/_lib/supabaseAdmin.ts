import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Whether server-side Supabase admin access is configured on this deployment. */
export const isSupabaseAdminConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

let cachedAdmin: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-only routes (bypasses RLS). Returns
 * `null` when env vars are missing so callers can respond with a clean 503
 * instead of throwing during cold start.
 */
export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!isSupabaseAdminConfigured()) return null;
  if (!cachedAdmin) {
    cachedAdmin = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedAdmin;
};

/** Fetches a profile row by user id, or `null` if missing / admin not configured. */
export const getProfileById = async (
  userId: string,
): Promise<{ id: string; is_premium: boolean; stripe_customer_id: string | null } | null> => {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from('profiles')
    .select('id, is_premium, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
};

/** Fetches a profile row by Stripe customer id (used by the webhook handler). */
export const getProfileByStripeCustomerId = async (
  stripeCustomerId: string,
): Promise<{ id: string } | null> => {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
};

/** Sets the Stripe customer id on a profile row (idempotent upsert-by-id). */
export const setStripeCustomerId = async (userId: string, stripeCustomerId: string): Promise<void> => {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from('profiles').update({ stripe_customer_id: stripeCustomerId }).eq('id', userId);
};

/** Sets the is_premium flag on a profile row, matched by internal user id. */
export const setPremiumByUserId = async (userId: string, isPremium: boolean): Promise<void> => {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from('profiles').update({ is_premium: isPremium }).eq('id', userId);
};

/** Sets the is_premium flag on a profile row, matched by Stripe customer id. */
export const setPremiumByStripeCustomerId = async (
  stripeCustomerId: string,
  isPremium: boolean,
): Promise<void> => {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from('profiles').update({ is_premium: isPremium }).eq('stripe_customer_id', stripeCustomerId);
};
