import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './_lib/supabaseAdmin';

const CRON_SECRET = process.env.CRON_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@senwitt.app';

// Cron fires every 15 minutes (see vercel.json) — this is the send window.
const REMINDER_WINDOW_MINUTES = 15;

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone_offset_minutes: number;
  last_notified_date: string | null;
}

interface ProgressLike {
  reminderEnabled?: boolean;
  reminderTime?: string | null;
}

const isWebPushConfigured = (): boolean => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

/** Checks the cron secret from either `Authorization: Bearer` or `x-cron-secret`. */
const isAuthorizedCronRequest = (req: VercelRequest): boolean => {
  if (!CRON_SECRET) return false;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  const bearerToken = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (bearerToken?.startsWith('Bearer ') && bearerToken.slice('Bearer '.length).trim() === CRON_SECRET) {
    return true;
  }

  const cronHeader = req.headers['x-cron-secret'];
  const cronSecretHeader = Array.isArray(cronHeader) ? cronHeader[0] : cronHeader;
  return Boolean(cronSecretHeader && cronSecretHeader === CRON_SECRET);
};

/** Local wall-clock date/time (YYYY-MM-DD, HH:mm) for a subscription's timezone offset. */
const localDateAndTime = (
  now: Date,
  timezoneOffsetMinutes: number,
): { dateStr: string; hh: number; mm: number } => {
  // Date.getTimezoneOffset() convention: offset is UTC minus local, in minutes.
  const localMs = now.getTime() - timezoneOffsetMinutes * 60_000;
  const local = new Date(localMs);
  const year = local.getUTCFullYear();
  const month = (local.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = local.getUTCDate().toString().padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    hh: local.getUTCHours(),
    mm: local.getUTCMinutes(),
  };
};

const parseHHmm = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

/** True when `minuteOfDay` falls within the last `windowMinutes` up to and including `targetMinuteOfDay`. */
const isWithinReminderWindow = (
  minuteOfDay: number,
  targetMinuteOfDay: number,
  windowMinutes: number,
): boolean => {
  let diff = minuteOfDay - targetMinuteOfDay;
  if (diff < 0) diff += 24 * 60; // handle midnight wrap
  return diff >= 0 && diff < windowMinutes;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorizedCronRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ error: 'Server auth is not configured on this deployment yet.' });
  }
  if (!isWebPushConfigured()) {
    return res.status(503).json({ error: 'Web Push is not configured on this deployment yet.' });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY as string, VAPID_PRIVATE_KEY as string);

  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Server auth is not configured on this deployment yet.' });
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const { data: subscriptions, error: subsError } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, timezone_offset_minutes, last_notified_date');

    if (subsError) {
      console.error('send-reminders: failed to load push_subscriptions', subsError);
      return res.status(500).json({ error: 'Failed to load subscriptions' });
    }

    const rows = (subscriptions ?? []) as PushSubscriptionRow[];
    if (rows.length === 0) {
      return res.status(200).json({ sent, skipped, errors });
    }

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: userDataRows, error: userDataError } = await admin
      .from('user_data')
      .select('user_id, payload')
      .in('user_id', userIds);

    if (userDataError) {
      console.error('send-reminders: failed to load user_data', userDataError);
      return res.status(500).json({ error: 'Failed to load user preferences' });
    }

    const progressByUserId = new Map<string, ProgressLike>();
    for (const row of userDataRows ?? []) {
      const payload = row.payload as { progress?: ProgressLike } | null;
      if (payload?.progress) progressByUserId.set(row.user_id, payload.progress);
    }

    const now = new Date();

    for (const sub of rows) {
      try {
        const progress = progressByUserId.get(sub.user_id);
        if (!progress?.reminderEnabled || typeof progress.reminderTime !== 'string' || !progress.reminderTime) {
          skipped += 1;
          continue;
        }

        const targetMinuteOfDay = parseHHmm(progress.reminderTime);
        if (targetMinuteOfDay == null) {
          skipped += 1;
          continue;
        }

        const { dateStr, hh, mm } = localDateAndTime(now, sub.timezone_offset_minutes);
        const minuteOfDay = hh * 60 + mm;

        if (sub.last_notified_date === dateStr) {
          skipped += 1;
          continue;
        }
        if (!isWithinReminderWindow(minuteOfDay, targetMinuteOfDay, REMINDER_WINDOW_MINUTES)) {
          skipped += 1;
          continue;
        }

        const payload = JSON.stringify({
          title: "Today's set is ready",
          body: 'A few minutes keeps your thinking sharp.',
          url: '/',
        });

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent += 1;

        // Mark the local day as notified so we never double-send within the
        // same day. This must succeed or a later run in the same 15-minute
        // window (or a delayed retry) could push again — retry once before
        // giving up, and log loudly so a persistent failure is visible.
        let markError = (await admin.from('push_subscriptions').update({ last_notified_date: dateStr }).eq('id', sub.id)).error;
        if (markError) {
          markError = (await admin.from('push_subscriptions').update({ last_notified_date: dateStr }).eq('id', sub.id)).error;
        }
        if (markError) {
          console.error(
            'send-reminders: failed to persist last_notified_date after a successful send — next run may double-notify',
            sub.id,
            markError,
          );
          errors += 1;
        }
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          const { error: deleteError } = await admin.from('push_subscriptions').delete().eq('id', sub.id);
          if (deleteError) {
            console.error('send-reminders: failed to delete dead subscription', sub.id, deleteError);
          }
        } else {
          console.error('send-reminders: send failed for subscription', sub.id, err);
        }
        errors += 1;
      }
    }

    return res.status(200).json({ sent, skipped, errors });
  } catch (err) {
    console.error('send-reminders: handler failed', err);
    return res.status(500).json({ error: 'Internal error', sent, skipped, errors });
  }
}
