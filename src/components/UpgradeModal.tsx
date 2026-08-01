import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { X, Sparkles, CreditCard, AlertCircle, Loader2, CheckCircle2, RefreshCw, LogIn } from 'lucide-react';
import { getAccessToken } from '../services/authService';
import { refreshEntitlement } from '../services/entitlements';
import { playClickSound } from '../services/sound';

interface UpgradeModalProps {
  session: Session | null;
  isPremium: boolean;
  onClose: () => void;
  /** Opens the Account modal so a signed-out user can sign in before checkout. */
  onOpenAccount: () => void;
  /** True when this modal was opened because the URL had `?checkout=success`. */
  showRefreshHint?: boolean;
  onEntitlementRefreshed?: (isPremium: boolean) => void;
}

const PREMIUM_FEATURES = [
  'Full Games arcade — every drill, not just the 3 recommended',
  'Weekend Deep Set — the longer 6-step weekend session',
  'Full Witt tips catalog',
];

const callBillingApi = async (path: string, accessToken: string): Promise<{ url?: string; error?: string }> => {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data?.error || 'Something went wrong. Please try again.' };
    }
    return { url: data?.url };
  } catch {
    return { error: 'Could not reach billing right now. Please try again.' };
  }
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  session,
  isPremium,
  onClose,
  onOpenAccount,
  showRefreshHint = false,
  onEntitlementRefreshed,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedOk, setRefreshedOk] = useState(false);

  const handleCheckout = async () => {
    if (!session) return;
    playClickSound();
    setError(null);
    setLoading(true);
    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      setError('Your session expired — please sign in again.');
      return;
    }
    const { url, error: apiError } = await callBillingApi('/api/create-checkout-session', token);
    setLoading(false);
    if (apiError || !url) {
      setError(apiError ?? 'Checkout is not available right now.');
      return;
    }
    window.location.href = url;
  };

  const handleManageBilling = async () => {
    if (!session) return;
    playClickSound();
    setError(null);
    setLoading(true);
    const token = await getAccessToken();
    if (!token) {
      setLoading(false);
      setError('Your session expired — please sign in again.');
      return;
    }
    const { url, error: apiError } = await callBillingApi('/api/billing-portal', token);
    setLoading(false);
    if (apiError || !url) {
      setError(apiError ?? 'Billing portal is not available right now.');
      return;
    }
    window.location.href = url;
  };

  const handleRefresh = async () => {
    if (!session) return;
    playClickSound();
    setRefreshing(true);
    setRefreshedOk(false);
    const next = await refreshEntitlement(session.user.id);
    setRefreshing(false);
    setRefreshedOk(true);
    onEntitlementRefreshed?.(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="surface max-w-md w-full p-6 text-left relative animate-fadeIn">
        <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#fff1ed', border: '1px solid #ffd4c8', color: 'var(--accent-coral)' }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">SENWITT Premium</h2>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Unlock the full arcade and Weekend Deep Set.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isPremium ? (
          <div className="space-y-4">
            <div
              className="surface-soft p-4 flex items-start gap-3 text-xs font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-teal)' }} />
              <p>You&rsquo;re on SENWITT Premium. Manage or cancel your subscription any time.</p>
            </div>

            {error && <ErrorLine message={error} />}

            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="btn-3d btn-3d-teal text-xs px-4 py-2.5 w-full flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              <span>Manage billing</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              SENWITT Premium — unlock the full Games catalog and the Weekend Deep Set. Billed via Stripe, cancel any time.
            </p>

            <ul className="space-y-2">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-teal)' }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {error && <ErrorLine message={error} />}

            {!session ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Sign in first so we know which account to attach your subscription to.
                </p>
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenAccount();
                  }}
                  className="btn-3d btn-3d-coral text-xs px-4 py-2.5 w-full flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Open account &amp; sign in</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-3d btn-3d-coral text-xs px-4 py-2.5 w-full flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>Continue to Stripe</span>
              </button>
            )}
          </div>
        )}

        {showRefreshHint && session && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {refreshedOk
                ? isPremium
                  ? 'Premium is active on this device.'
                  : 'Not showing as Premium yet — Stripe may still be processing your payment.'
                : 'Back from checkout? Refresh to unlock Premium on this device.'}
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 w-full disabled:opacity-60"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Refresh entitlement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ErrorLine: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--accent-coral-deep)' }}>
    <AlertCircle className="w-4 h-4 shrink-0" />
    <span>{message}</span>
  </div>
);
