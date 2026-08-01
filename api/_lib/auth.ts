import type { VercelRequest } from '@vercel/node';
import { getSupabaseAdmin } from './supabaseAdmin';

export interface AuthedUser {
  id: string;
  email: string | null;
}

/**
 * Verifies the `Authorization: Bearer <access_token>` header against Supabase
 * and returns the authenticated user, or `null` if missing/invalid/unconfigured.
 */
export const requireUser = async (req: VercelRequest): Promise<AuthedUser | null> => {
  const header = req.headers.authorization || req.headers.Authorization;
  const token = Array.isArray(header) ? header[0] : header;
  if (!token || !token.startsWith('Bearer ')) return null;
  const accessToken = token.slice('Bearer '.length).trim();
  if (!accessToken) return null;

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
};
