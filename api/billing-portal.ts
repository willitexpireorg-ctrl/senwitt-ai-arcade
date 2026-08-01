import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, isStripeConfigured } from './_lib/stripe';
import { getProfileById, isSupabaseAdminConfigured } from './_lib/supabaseAdmin';
import { requireUser } from './_lib/auth';

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

  if (!isStripeConfigured()) {
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
    const profile = await getProfileById(user.id);
    if (!profile?.stripe_customer_id) {
      return res.status(404).json({ error: 'No billing account found for this user yet.' });
    }

    const body = (req.body ?? {}) as { returnUrl?: string };
    const origin = getOrigin(req);
    const returnUrl = body.returnUrl || `${origin}/`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('billing-portal failed', err);
    return res.status(500).json({ error: 'Could not open billing portal. Please try again.' });
  }
}
