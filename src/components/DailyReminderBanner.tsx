import React, { useEffect, useRef, useState } from 'react';
import { Bell, Play } from 'lucide-react';
import type { UserProgress } from '../types';
import { getLocalDateString } from '../services/storage';

interface DailyReminderBannerProps {
  progress: UserProgress;
  trainedToday: boolean;
  onStart: () => void;
  onMarkShown: () => void;
}

const localTimeHHmm = (): string => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const sessionFlagKey = (day: string) => `senwitt_rem_banner_${day}`;

const readSessionFlag = (day: string): boolean => {
  try {
    return sessionStorage.getItem(sessionFlagKey(day)) === '1';
  } catch {
    return false;
  }
};

const writeSessionFlag = (day: string): void => {
  try {
    sessionStorage.setItem(sessionFlagKey(day), '1');
  } catch {
    // ignore
  }
};

/** Event-based in-app prompt when opt-in reminder time has passed and user hasn't trained. */
export const DailyReminderBanner: React.FC<DailyReminderBannerProps> = ({
  progress,
  trainedToday,
  onStart,
  onMarkShown,
}) => {
  const today = getLocalDateString();
  const markedRef = useRef(false);
  const notifiedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trainedToday) {
      setVisible(false);
      return;
    }
    if (!progress.reminderEnabled || !progress.reminderTime) {
      setVisible(false);
      return;
    }
    if (localTimeHHmm() < progress.reminderTime) {
      setVisible(false);
      return;
    }

    const alreadyMarkedToday = progress.reminderLastShownDate === today;
    const shownThisTab = readSessionFlag(today);

    // Revisit later today: do not spam. Same tab / Strict remount: keep showing.
    if (alreadyMarkedToday && !shownThisTab) {
      setVisible(false);
      return;
    }

    setVisible(true);
    writeSessionFlag(today);

    if (!alreadyMarkedToday && !markedRef.current) {
      markedRef.current = true;
      onMarkShown();
    }

    if (
      !notifiedRef.current &&
      !alreadyMarkedToday &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      notifiedRef.current = true;
      try {
        new Notification("Today's set is ready", {
          body: 'A few minutes keeps your thinking sharp.',
          tag: `senwitt-daily-${today}`,
        });
      } catch {
        // ignore unsupported Notification constructors
      }
    }
  }, [
    trainedToday,
    progress.reminderEnabled,
    progress.reminderTime,
    progress.reminderLastShownDate,
    today,
    onMarkShown,
  ]);

  if (!visible || trainedToday) return null;

  return (
    <div
      className="surface p-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fadeIn"
      style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
      role="status"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 self-center sm:self-auto"
        style={{ background: '#ccfbf1', color: 'var(--accent-teal)' }}
      >
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1 text-center sm:text-left min-w-0">
        <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          Today&apos;s set is ready
        </p>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
          Your reminder time passed — a short workout will keep momentum going.
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="btn-3d btn-3d-teal py-2.5 px-4 text-sm flex items-center justify-center gap-2 shrink-0"
      >
        <Play className="w-4 h-4" style={{ fill: 'white' }} />
        <span>Start</span>
      </button>
    </div>
  );
};
