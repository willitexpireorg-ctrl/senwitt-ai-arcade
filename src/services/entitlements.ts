import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Tracks the current user's premium entitlement (SENWITT Phase 2: Stripe
 * freemium). Free by default and whenever cloud sync isn't configured or
 * the user is signed out — local play always keeps working fully for the
 * free tier feature set with zero backend dependency.
 *
 * Set `VITE_TEST_MODE=true` in `.env` to unlock all Premium-gated features
 * locally (full arcade, weekend set, client-side premium UI) without Stripe.
 * Turn it off (or remove the var) before a real freemium launch.
 */

let isPremium = false;
type Listener = (isPremium: boolean) => void;
const listeners = new Set<Listener>();

/** True when `VITE_TEST_MODE` is `true` or `1` (Vite build-time env). */
export const isTestModeEnabled = (): boolean => {
  const raw = import.meta.env.VITE_TEST_MODE;
  return raw === 'true' || raw === '1';
};

const effectivePremium = (): boolean => isTestModeEnabled() || isPremium;

const emit = (): void => {
  const value = effectivePremium();
  listeners.forEach((listener) => listener(value));
};

const setIsPremium = (next: boolean): void => {
  if (isPremium === next) {
    // Still re-emit when test mode alone should unlock (e.g. first subscribe).
    if (isTestModeEnabled()) emit();
    return;
  }
  isPremium = next;
  emit();
};

/** Current effective premium flag (test mode OR Stripe entitlement). */
export const getIsPremium = (): boolean => effectivePremium();

/** Alias kept for readability at call sites gating a specific feature. */
export const isPremiumFeatureUnlocked = (): boolean => effectivePremium();

/** Subscribes to entitlement changes; immediately invokes with the current value. */
export const subscribeEntitlement = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(effectivePremium());
  return () => listeners.delete(listener);
};

/**
 * Refetches `profiles.is_premium` for `userId` and updates the cache. Pass
 * `null` (e.g. on sign-out) to reset to free. Returns the resolved value.
 * Test mode always reports premium regardless of profile.
 */
export const refreshEntitlement = async (userId: string | null): Promise<boolean> => {
  if (isTestModeEnabled()) {
    setIsPremium(true);
    return true;
  }

  if (!userId || !isSupabaseConfigured() || !supabase) {
    setIsPremium(false);
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      setIsPremium(false);
      return false;
    }

    const next = Boolean(data.is_premium);
    setIsPremium(next);
    return next;
  } catch {
    setIsPremium(false);
    return false;
  }
};

/** Full Games arcade (browse-all + non-recommended titles) requires premium. */
export const canAccessFullArcade = (): boolean => effectivePremium();

/** Weekend Deep Set (`weekend_long`) requires premium. */
export const canAccessWeekendLong = (): boolean => effectivePremium();
