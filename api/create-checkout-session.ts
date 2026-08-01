import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, isStripeConfigured } from './_lib/stripe';
import { getProfileById, isSupabaseAdminConfigured, setStripeCustomerId } from './_lib/supabaseAdmin';
import { requireUser } from './_lib/auth';

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

const getOrigin = (req: VercelRequest): string => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isStripeConfigured() || !STRIPE_PRICE_ID) {
    return res.status(503).json({ error: 'Billing is not configured on this deployment yet.' });
  }
  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ error: 'Server auth is not configured on this deployment yet.' });
  }

  const user = await requireUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Billing is not configured on this deployment yet.' });
  }

  try {
    const body = (req.body ?? {}) as { successUrl?: string; cancelUrl?: string };
    const origin = getOrigin(req);
    const successUrl = body.successUrl || `${origin}/?checkout=success`;
    const cancelUrl = body.cancelUrl || `${origin}/?checkout=cancelled`;

    const profile = await getProfileById(user.id);
    let customerId = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await setStripeCustomerId(user.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session failed', err);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
}
