import type { UserProgress } from '../types';
import { getLocalDateString } from './storage';

const CHECK_INTERVAL_MS = 60_000;
const NOTIFY_TAG_PREFIX = 'senwitt-daily-';

const localTimeHHmm = (): string => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const notifyFlagKey = (day: string) => `senwitt_rem_notify_${day}`;

const readNotifyFlag = (day: string): boolean => {
  try {
    // localStorage so a new tab/session same day does not re-fire the OS notify.
    return localStorage.getItem(notifyFlagKey(day)) === '1';
  } catch {
    return false;
  }
};

const writeNotifyFlag = (day: string): void => {
  try {
    localStorage.setItem(notifyFlagKey(day), '1');
  } catch {
    // ignore
  }
};

export async function requestReminderPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

/** Tell the SW (or registration) to show a daily-ready notification. Tag prevents spam. */
async function showDailyReadyNotification(today: string): Promise<boolean> {
  const title = "Today's set is ready";
  const options: NotificationOptions = {
    body: 'A few minutes keeps your thinking sharp.',
    tag: `${NOTIFY_TAG_PREFIX}${today}`,
    icon: '/favicon.svg',
    data: { url: '/' },
  };

  const reg = await getReadyRegistration();
  if (reg) {
    try {
      // Prefer registration.showNotification (works with tab in background).
      // ACK only — do not also post SHOW_REMINDER or the SW would fire a second notify.
      await reg.showNotification(title, options);
      reg.active?.postMessage({ type: 'REMINDER_ACK', day: today });
      return true;
    } catch {
      // fall through — ask SW to show as fallback
      try {
        reg.active?.postMessage({ type: 'SHOW_REMINDER', title, options, day: today });
        return true;
      } catch {
        // continue to Notification constructor
      }
    }
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * If reminder is due, permission granted, and we haven't notified yet today,
 * show a SW / system notification. Returns true when a notification was shown.
 */
export function notifyDailyReadyIfDue(
  progress: UserProgress,
  trainedToday: boolean,
): boolean {
  if (trainedToday) return false;
  if (!progress.reminderEnabled || !progress.reminderTime) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;

  const today = getLocalDateString();
  if (localTimeHHmm() < progress.reminderTime) return false;
  // Session flag + persisted day mark (banner / prior notify) — avoid spam across revisits.
  if (readNotifyFlag(today)) return false;
  if (progress.reminderLastShownDate === today) return false;

  writeNotifyFlag(today);
  void showDailyReadyNotification(today);
  return true;
}

/** Post schedule prefs to the service worker (best-effort; SW may be killed). */
export async function postReminderScheduleToSw(
  time: string,
  enabled: boolean,
): Promise<void> {
  const reg = await getReadyRegistration();
  reg?.active?.postMessage({
    type: 'SCHEDULE_DAILY_REMINDER',
    time,
    enabled,
  });
}

/**
 * Poll every 60s while the app is open; also fire on visibility change.
 * Returns a cleanup function.
 */
export function scheduleReminderCheck(callback: () => void): () => void {
  callback();
  const id = window.setInterval(callback, CHECK_INTERVAL_MS);

  const onVis = () => {
    if (document.visibilityState === 'visible') callback();
  };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', onVis);
  };
}
