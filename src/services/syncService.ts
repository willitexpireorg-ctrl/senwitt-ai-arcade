import type { UserProgress, SessionResult } from '../types';
import type { IRTAbilityProfile } from './irtAdaptiveEngine';
import { supabase } from './supabaseClient';
import {
  getStoredProgress,
  getSessionHistory,
  getStoredAbilityProfile,
  importUserDataJson,
} from './storage';

/** Matches the shape produced by `exportUserDataJson` / consumed by `importUserDataJson`. */
export interface SyncPayload {
  version: string;
  progress: UserProgress;
  history: SessionResult[];
  ability: IRTAbilityProfile;
  clientUpdatedAt?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncStatusSnapshot {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
}

export interface PullAndMergeResult {
  imported: boolean;
  error?: string;
}

interface SyncMeta {
  clientUpdatedAt: string;
  lastSyncedAt?: string | null;
}

const SYNC_META_KEY = 'senwitt_sync_meta';
const PUSH_DEBOUNCE_MS = 1500;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

const getSyncMeta = (): SyncMeta => {
  try {
    return safeParse<SyncMeta>(localStorage.getItem(SYNC_META_KEY), {
      clientUpdatedAt: new Date(0).toISOString(),
      lastSyncedAt: null,
    });
  } catch {
    return { clientUpdatedAt: new Date(0).toISOString(), lastSyncedAt: null };
  }
};

const setSyncMeta = (meta: SyncMeta): void => {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('Failed to persist sync meta', e);
  }
};

/** Marks local data as changed "now" so the next sync knows it's the newer copy. */
export const touchSyncTimestamp = (): void => {
  setSyncMeta({ ...getSyncMeta(), clientUpdatedAt: new Date().toISOString() });
};

let status: SyncStatus = 'idle';
let statusError: string | null = null;
type StatusListener = (snapshot: SyncStatusSnapshot) => void;
const listeners = new Set<StatusListener>();

const emitStatus = (): void => {
  const snapshot: SyncStatusSnapshot = {
    status,
    error: statusError,
    lastSyncedAt: getSyncMeta().lastSyncedAt ?? null,
  };
  listeners.forEach((listener) => listener(snapshot));
};

const setStatus = (next: SyncStatus, error: string | null = null): void => {
  status = next;
  statusError = error;
  emitStatus();
};

export const getSyncStatusSnapshot = (): SyncStatusSnapshot => ({
  status,
  error: statusError,
  lastSyncedAt: getSyncMeta().lastSyncedAt ?? null,
});

export const subscribeSyncStatus = (listener: StatusListener): (() => void) => {
  listeners.add(listener);
  listener(getSyncStatusSnapshot());
  return () => listeners.delete(listener);
};

/** Builds the current local sync payload from stored progress/history/ability. */
export const getLocalSyncPayload = (): SyncPayload => ({
  version: '1.1',
  progress: getStoredProgress(),
  history: getSessionHistory(),
  ability: getStoredAbilityProfile(),
});

const pushNow = async (userId: string): Promise<void> => {
  if (!supabase) return;
  try {
    setStatus('syncing');
    const payload = getLocalSyncPayload();
    const meta = getSyncMeta();
    const { error } = await supabase.from('user_data').upsert({
      user_id: userId,
      payload,
      client_updated_at: meta.clientUpdatedAt,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setStatus('error', error.message);
      return;
    }
    setSyncMeta({ ...meta, lastSyncedAt: new Date().toISOString() });
    setStatus('synced');
  } catch (e) {
    setStatus('error', e instanceof Error ? e.message : 'Sync push failed.');
  }
};

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushUserId: string | null = null;

/** Ensures pushSoon knows which account to sync to once a session exists. */
export const setSyncUser = (userId: string | null): void => {
  pushUserId = userId;
};

/**
 * Debounced (~1.5s) upsert of local data to `user_data`. Always stamps the
 * local "changed at" marker (even pre-auth / offline) so that a later
 * `pullAndMerge` can correctly tell that this device's local progress is
 * newer than an older remote copy — otherwise pre-login local training would
 * keep the epoch(0) timestamp and could be silently overwritten on sign-in.
 * The actual network push is still a no-op without a session.
 */
export const pushSoon = (): void => {
  touchSyncTimestamp();
  if (!supabase || !pushUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  const userId = pushUserId;
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow(userId);
  }, PUSH_DEBOUNCE_MS);
};

/**
 * Pulls the remote sync document for `userId`. If the remote copy is newer
 * than the local marker, imports it into local storage (returns `imported: true`
 * so the caller can refresh React state). Otherwise pushes the local copy up.
 */
export const pullAndMerge = async (userId: string): Promise<PullAndMergeResult> => {
  setSyncUser(userId);
  if (!supabase) return { imported: false };
  try {
    setStatus('syncing');
    const { data, error } = await supabase
      .from('user_data')
      .select('payload, client_updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setStatus('error', error.message);
      return { imported: false, error: error.message };
    }

    const meta = getSyncMeta();
    const localTime = new Date(meta.clientUpdatedAt).getTime();
    const remoteTime = data?.client_updated_at ? new Date(data.client_updated_at).getTime() : 0;
    const remotePayload = data?.payload as SyncPayload | undefined;

    if (remotePayload?.progress && remoteTime > localTime) {
      const ok = importUserDataJson(
        JSON.stringify({
          version: remotePayload.version ?? '1.1',
          progress: remotePayload.progress,
          history: remotePayload.history,
          ability: remotePayload.ability,
        }),
      );
      if (ok) {
        setSyncMeta({ clientUpdatedAt: data!.client_updated_at, lastSyncedAt: new Date().toISOString() });
        setStatus('synced');
        return { imported: true };
      }
      setStatus('error', 'Failed to import synced data.');
      return { imported: false, error: 'Failed to import synced data.' };
    }

    await pushNow(userId);
    return { imported: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed.';
    setStatus('error', message);
    return { imported: false, error: message };
  }
};

/** Upserts a profile row if one doesn't already exist (trigger usually beats us to it). */
export const ensureProfile = async (userId: string, email: string | null): Promise<void> => {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('ensureProfile check failed', error.message);
      return;
    }
    if (!data) {
      const { error: upsertError } = await supabase.from('profiles').upsert({ id: userId, email });
      if (upsertError) console.warn('ensureProfile upsert failed', upsertError.message);
    }
  } catch (e) {
    console.warn('ensureProfile failed', e);
  }
};

/** Call on sign-out to stop future debounced pushes from firing under a stale user id. */
export const resetSyncState = (): void => {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  pushUserId = null;
  setStatus('idle');
};
