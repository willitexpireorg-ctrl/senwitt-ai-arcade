import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'senwitt_install_dismissed_v1';

interface InstallPromptProps {
  /** Reciprocity: only after user finished at least one workout. */
  earnedInstallPrompt?: boolean;
}

const isDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export const InstallPrompt: React.FC<InstallPromptProps> = ({ earnedInstallPrompt = false }) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  // Capture beforeinstallprompt even before earn-gate — browser may fire once early.
  useEffect(() => {
    if (isDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    if (!earnedInstallPrompt || !deferred || isDismissed()) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [earnedInstallPrompt, deferred]);

  if (!earnedInstallPrompt || !visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  const install = async () => {
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // ignore
    }
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-[calc(var(--bottom-nav-height)+0.75rem)] lg:bottom-6 left-1/2 z-40 w-[min(92vw,24rem)] -translate-x-1/2 surface p-4 shadow-lg animate-fadeIn"
      style={{ border: '1px solid var(--border-strong)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#ccfbf1', color: 'var(--accent-teal)' }}
        >
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Install SENWITT
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>
            You finished a workout — add to home screen so tomorrow&apos;s set is one tap.
          </p>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={install} className="btn-3d btn-3d-teal text-xs px-3 py-2">
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-bold px-3 py-2 rounded-xl"
              style={{ color: 'var(--text-muted)' }}
            >
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="p-1" aria-label="Dismiss install prompt">
          <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
};
