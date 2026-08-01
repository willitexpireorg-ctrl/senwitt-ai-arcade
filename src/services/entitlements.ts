import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Tracks the current user's premium entitlement (SENWITT Phase 2: Stripe
 * freemium). Free by default and whenever cloud sync isn't configured or
 * the user is signed out — local play always keeps working fully for the
 * free tier feature set with zero backend dependency.
 */

let isPremium = false;
type Listener = (isPremium: boolean) => void;
const listeners = new Set<Listener>();

const emit = (): void => {
  listeners.forEach((listener) => listener(isPremium));
};

const setIsPremium = (next: boolean): void => {
  if (isPremium === next) return;
  isPremium = next;
  emit();
};

/** Current cached premium flag (synchronous, safe to read anywhere). */
export const getIsPremium = (): boolean => isPremium;

/** Alias kept for readability at call sites gating a specific feature. */
export const isPremiumFeatureUnlocked = (): boolean => isPremium;

/** Subscribes to entitlement changes; immediately invokes with the current value. */
export const subscribeEntitlement = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(isPremium);
  return () => listeners.delete(listener);
};

/**
 * Refetches `profiles.is_premium` for `userId` and updates the cache. Pass
 * `null` (e.g. on sign-out) to reset to free. Returns the resolved value.
 */
export const refreshEntitlement = async (userId: string | null): Promise<boolean> => {
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
export const canAccessFullArcade = (): boolean => isPremium;

/** Weekend Deep Set (`weekend_long`) requires premium. */
export const canAccessWeekendLong = (): boolean => isPremium;
