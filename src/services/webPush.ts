import { supabase, isSupabaseConfigured } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/** Whether this build has a VAPID public key configured for Web Push. */
export const isWebPushConfigured = (): boolean => Boolean(VAPID_PUBLIC_KEY);

/** Whether the current browser/context supports the Push API at all. */
export const isWebPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  typeof Notification !== 'undefined';

/** Converts a URL-safe base64 VAPID key into the Uint8Array PushManager expects. */
const urlBase64ToUint8Array = (base64String: string): BufferSource => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getReadyRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isWebPushSupported()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
};

/** Upserts (endpoint-keyed) the given push subscription for the signed-in user. */
const saveSubscriptionToSupabase = async (
  userId: string,
  subscription: PushSubscription,
): Promise<void> => {
  if (!supabase) return;
  const keys = subscription.toJSON().keys;
  if (!keys?.p256dh || !keys?.auth) return;
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      timezone_offset_minutes: new Date().getTimezoneOffset(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
};

/**
 * Requests notification permission, subscribes the browser to Web Push, and
 * upserts the subscription to Supabase for the signed-in user. Fully
 * graceful no-op (returns `false`) when unsupported / unconfigured / signed
 * out / permission denied — callers should not block on this.
 */
export const subscribeWebPush = async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;
  if (!isSupabaseConfigured() || !supabase) return false;
  if (!isWebPushConfigured()) return false;
  if (!isWebPushSupported()) return false;

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return false;

    const registration = await getReadyRegistration();
    if (!registration) return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      });
    }

    await saveSubscriptionToSupabase(userId, subscription);
    return true;
  } catch (e) {
    console.warn('subscribeWebPush failed', e);
    return false;
  }
};

/**
 * Unsubscribes the browser from Web Push (if subscribed) and removes the
 * matching row from Supabase. Graceful no-op when unsupported/unconfigured.
 */
export const unsubscribeWebPush = async (): Promise<void> => {
  if (!isWebPushSupported()) return;
  try {
    const registration = await getReadyRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => undefined);

    if (supabase && endpoint) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
  } catch (e) {
    console.warn('unsubscribeWebPush failed', e);
  }
};

/** Whether the browser currently holds an active push subscription. */
export const getExistingWebPushSubscription = async (): Promise<PushSubscription | null> => {
  const registration = await getReadyRegistration();
  if (!registration) return null;
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
};
