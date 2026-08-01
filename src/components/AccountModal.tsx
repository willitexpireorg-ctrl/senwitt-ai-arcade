import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { X, Mail, LogOut, RefreshCw, Cloud, CloudOff, CheckCircle2, AlertCircle, Loader2, Sparkles, CreditCard, BellRing, BellOff } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { signInWithMagicLink, signOut } from '../services/authService';
import {
  pullAndMerge,
  subscribeSyncStatus,
  type SyncStatusSnapshot,
} from '../services/syncService';
import { playClickSound } from '../services/sound';
import {
  getExistingWebPushSubscription,
  isWebPushConfigured,
  isWebPushSupported,
  subscribeWebPush,
  unsubscribeWebPush,
} from '../services/webPush';

interface AccountModalProps {
  session: Session | null;
  onClose: () => void;
  /** Called after a successful pull that imported newer remote data, so App can refresh state. */
  onDataImported?: () => void;
  /** SENWITT Phase 2: current cached premium entitlement. */
  isPremium?: boolean;
  /** Opens the upgrade modal (or the manage-billing flow if already premium). */
  onOpenUpgrade?: () => void;
}

const formatLastSynced = (iso: string | null): string => {
  if (!iso) return 'Not synced yet';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Last synced just now';
  if (diffMin < 60) return `Last synced ${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Last synced ${diffHr}h ago`;
  return `Last synced ${new Date(iso).toLocaleDateString()}`;
};

export const AccountModal: React.FC<AccountModalProps> = ({ session, onClose, onDataImported, isPremium = false, onOpenUpgrade }) => {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncSnapshot, setSyncSnapshot] = useState<SyncStatusSnapshot>({
    status: 'idle',
    lastSyncedAt: null,
    error: null,
  });
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const pushAvailable = isWebPushConfigured() && isWebPushSupported();

  useEffect(() => subscribeSyncStatus(setSyncSnapshot), []);

  useEffect(() => {
    if (!session || !pushAvailable) return;
    void getExistingWebPushSubscription().then((sub) => setPushSubscribed(Boolean(sub)));
  }, [session, pushAvailable]);

  const handleTogglePush = async () => {
    if (!session || pushBusy) return;
    playClickSound();
    setPushBusy(true);
    try {
      if (pushSubscribed) {
        await unsubscribeWebPush();
        setPushSubscribed(false);
      } else {
        const ok = await subscribeWebPush(session.user.id);
        setPushSubscribed(ok);
      }
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending) return;
    playClickSound();
    setSending(true);
    setAuthError(null);
    const { error } = await signInWithMagicLink(email.trim());
    setSending(false);
    if (error) {
      setAuthError(error);
    } else {
      setLinkSent(true);
    }
  };

  const handleSyncNow = () => {
    playClickSound();
    if (!session) return;
    void pullAndMerge(session.user.id).then((result) => {
      if (result.imported) onDataImported?.();
    });
  };

  const handleSignOut = async () => {
    playClickSound();
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="surface max-w-md w-full p-6 text-left relative animate-modalPop">
        <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Account &amp; sync</h2>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Keep your progress backed up across devices.
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

        {!configured ? (
          <div
            className="surface-soft p-4 flex items-start gap-3 text-xs font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CloudOff className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
            <p>Cloud sync isn&rsquo;t configured on this build. Progress stays on this device.</p>
          </div>
        ) : session ? (
          <div className="space-y-4">
            <div className="surface-soft p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Signed in as
                </p>
                <p className="text-sm font-extrabold mt-0.5">{session.user.email}</p>
              </div>
              <span
                className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full shrink-0 inline-flex items-center gap-1"
                style={
                  isPremium
                    ? { background: '#fff1ed', color: 'var(--accent-coral)', border: '1px solid #ffd4c8' }
                    : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
                }
              >
                {isPremium && <Sparkles className="w-2.5 h-2.5" />}
                {isPremium ? 'Premium' : 'Free'}
              </span>
            </div>

            <SyncStatusLine snapshot={syncSnapshot} />

            {pushAvailable && (
              <button
                onClick={handleTogglePush}
                disabled={pushBusy}
                className="w-full flex items-center justify-between gap-2 surface-soft p-3 disabled:opacity-60"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <span className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {pushBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pushSubscribed ? (
                    <BellRing className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} />
                  ) : (
                    <BellOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  )}
                  Push reminders
                </span>
                <span
                  className="text-[10px] uppercase font-extrabold px-2 py-1 rounded-full"
                  style={
                    pushSubscribed
                      ? { background: '#ccfbf1', color: 'var(--accent-teal)' }
                      : { background: 'var(--bg-secondary)', color: 'var(--text-muted)' }
                  }
                >
                  {pushSubscribed ? 'On' : 'Off'}
                </span>
              </button>
            )}

            <div className="flex flex-col gap-2.5">
              {onOpenUpgrade && (
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenUpgrade();
                  }}
                  className="btn-3d btn-3d-coral text-xs px-4 py-2.5 flex items-center justify-center gap-1.5"
                >
                  {isPremium ? <CreditCard className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isPremium ? 'Manage billing' : 'Upgrade to Premium'}</span>
                </button>
              )}

              <button
                onClick={handleSyncNow}
                disabled={syncSnapshot.status === 'syncing'}
                className="btn-3d btn-3d-teal text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {syncSnapshot.status === 'syncing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Sync now</span>
              </button>

              <button
                onClick={handleSignOut}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        ) : linkSent ? (
          <div
            className="surface-soft p-4 flex items-start gap-3 text-xs font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-teal)' }} />
            <p>Check <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> for a sign-in link. You can close this window.</p>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-3">
            <label className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus-ring"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </label>

            {authError && (
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--accent-coral-deep)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="btn-3d btn-3d-coral text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 w-full disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Email me a sign-in link</span>
            </button>

            <p className="text-[11px] font-medium text-center" style={{ color: 'var(--text-muted)' }}>
              No password needed — we&rsquo;ll email you a secure link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

const SyncStatusLine: React.FC<{ snapshot: SyncStatusSnapshot }> = ({ snapshot }) => {
  if (snapshot.status === 'syncing') {
    return (
      <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent-teal)' }} />
        Syncing…
      </p>
    );
  }
  if (snapshot.status === 'error') {
    return (
      <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--accent-coral-deep)' }}>
        <AlertCircle className="w-3.5 h-3.5" />
        Sync error: {snapshot.error ?? 'Unknown error'}
      </p>
    );
  }
  if (snapshot.status === 'synced' || snapshot.lastSyncedAt) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--accent-teal)' }}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        {formatLastSynced(snapshot.lastSyncedAt)}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
      <Cloud className="w-3.5 h-3.5" />
      Idle
    </p>
  );
};
