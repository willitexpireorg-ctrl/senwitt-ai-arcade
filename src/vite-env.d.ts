/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Optional — not currently read by client code (Checkout is server-driven), reserved for future Stripe.js use. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Web Push (Phase 4) — VAPID public key. Leave unset to disable push opt-in (banner/local notifications still work). */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
