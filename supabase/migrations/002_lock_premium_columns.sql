-- SENWITT Phase 2: Stripe freemium — lock down billing columns.
--
-- CRITICAL FIX: RLS policy "profiles_update_own" (and "profiles_insert_own")
-- only restricts *which row* an authenticated user may touch
-- (`auth.uid() = id`) — it does not restrict *which columns*. Supabase
-- grants table-level INSERT/UPDATE on `public.profiles` to the
-- `authenticated` role by default, so without this migration any signed-in
-- user could open the browser console and run e.g.:
--
--   supabase.from('profiles').update({ is_premium: true }).eq('id', myId)
--
-- ...and grant themselves SENWITT Premium for free, permanently, with zero
-- Stripe involvement. Only the server-only service-role client
-- (api/_lib/supabaseAdmin.ts, used exclusively by the Stripe webhook) should
-- ever be able to set `is_premium` / `stripe_customer_id`. Column-level
-- REVOKE layers on top of (and narrows) the table-level grant, so this does
-- not affect `service_role`, which keeps its own full-table privileges.
revoke insert (is_premium, stripe_customer_id) on public.profiles from authenticated, anon;
revoke update (is_premium, stripe_customer_id) on public.profiles from authenticated, anon;
