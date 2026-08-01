import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from './_lib/stripe';
import {
  getProfileByStripeCustomerId,
  isSupabaseAdminConfigured,
  setPremiumByStripeCustomerId,
  setPremiumByUserId,
} from './_lib/supabaseAdmin';

// Stripe needs the exact raw bytes of the request body to verify the
// signature, so the platform's automatic JSON body parser must be disabled.
export const config = {
  api: {
    bodyParser: false,
  },
};

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const readRawBody = async (req: VercelRequest): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

/** Resolves the internal Supabase user id a Stripe object should map to. */
const resolveUserId = (obj: { metadata?: Stripe.Metadata | null; client_reference_id?: string | null }): string | null =>
  obj.metadata?.user_id ?? obj.client_reference_id ?? null;

const applyPremiumStatus = async (
  isPremium: boolean,
  opts: { userId?: string | null; stripeCustomerId?: string | null },
): Promise<void> => {
  if (opts.userId) {
    await setPremiumByUserId(opts.userId, isPremium);
    return;
  }
  if (opts.stripeCustomerId) {
    await setPremiumByStripeCustomerId(opts.stripeCustomerId, isPremium);
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  if (!isStripeConfigured() || !STRIPE_WEBHOOK_SECRET) {
    console.error('stripe-webhook: STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not configured');
    return res.status(503).send('Webhook not configured');
  }
  if (!isSupabaseAdminConfigured()) {
    console.error('stripe-webhook: Supabase admin not configured');
    return res.status(503).send('Server not configured');
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).send('Webhook not configured');
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('stripe-webhook: signature verification failed', err);
    return res.status(400).send(`Webhook signature verification failed`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;
        const userId = resolveUserId(session);
        const stripeCustomerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        await applyPremiumStatus(true, { userId, stripeCustomerId });
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId =
          typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;
        const userId = resolveUserId(subscription);
        const activeStatuses = new Set(['active', 'trialing']);
        const isActive = event.type === 'customer.subscription.updated' && activeStatuses.has(subscription.status);

        let resolvedUserId = userId;
        if (!resolvedUserId && stripeCustomerId) {
          const profile = await getProfileByStripeCustomerId(stripeCustomerId);
          resolvedUserId = profile?.id ?? null;
        }
        await applyPremiumStatus(isActive, { userId: resolvedUserId, stripeCustomerId });
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe-webhook: handler failed', err);
    return res.status(500).send('Webhook handler error');
  }
}
