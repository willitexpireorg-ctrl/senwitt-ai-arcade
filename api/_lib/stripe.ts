import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = (): boolean => Boolean(STRIPE_SECRET_KEY);

let cachedStripe: Stripe | null = null;

/** Server-only Stripe client. Returns `null` when `STRIPE_SECRET_KEY` isn't set. */
export const getStripe = (): Stripe | null => {
  if (!STRIPE_SECRET_KEY) return null;
  if (!cachedStripe) {
    cachedStripe = new Stripe(STRIPE_SECRET_KEY);
  }
  return cachedStripe;
};
