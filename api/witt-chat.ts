import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfileById, isSupabaseAdminConfigured } from './_lib/supabaseAdmin';
import { requireUser } from './_lib/auth';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 10_000;

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** In-memory per-user request timestamps for a light rate limit. Resets on cold start. */
const requestLog = new Map<string, number[]>();

const isRateLimited = (userId: string): boolean => {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    requestLog.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  // Bound the map's growth across distinct users on a long-lived serverless
  // instance — sweep out any other user's fully-expired entry on our way out.
  if (requestLog.size > 500) {
    for (const [otherId, otherTimestamps] of requestLog) {
      if (otherId === userId) continue;
      if (otherTimestamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(otherId);
      }
    }
  }
  return false;
};

interface ProgressSnapshot {
  sharpnessScore?: number;
  streakDays?: number;
  beltRank?: string;
  dailyMinutesGoal?: number;
}

const SYSTEM_PROMPT = `You are Witt, a brief, encouraging training coach inside the SENWITT app. SENWITT helps users build daily habits in logic, writing, and code-reading through short practice sets.

Rules:
- Give practical, actionable tips only — about streaks, habits, logical fallacies, code scoping/closures, or cutting fluff from writing.
- NEVER claim IQ gains, brain age reduction, medical or ADHD treatment benefits, or "far transfer" miracles from using this app. Do not make any clinical or cognitive-enhancement claims.
- Keep replies short: 2-4 sentences, no bullet lists, no markdown.
- Be warm but concise, like a coach giving a quick pointer between reps.`;

const buildProgressContext = (snapshot?: ProgressSnapshot): string => {
  if (!snapshot) return 'No progress snapshot available.';
  const parts: string[] = [];
  if (typeof snapshot.sharpnessScore === 'number') parts.push(`sharpness score ${snapshot.sharpnessScore}`);
  if (typeof snapshot.streakDays === 'number') parts.push(`${snapshot.streakDays}-day streak`);
  if (snapshot.beltRank) parts.push(`belt rank ${snapshot.beltRank}`);
  if (typeof snapshot.dailyMinutesGoal === 'number') parts.push(`daily goal ${snapshot.dailyMinutesGoal} min`);
  return parts.length > 0 ? `User progress: ${parts.join(', ')}.` : 'No progress snapshot available.';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({ error: 'Server auth is not configured on this deployment yet.', fallback: true });
  }

  const user = await requireUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  const profile = await getProfileById(user.id);
  if (!profile?.is_premium) {
    return res.status(403).json({ error: 'Witt LLM chat is a premium feature.' });
  }

  if (isRateLimited(user.id)) {
    return res.status(429).json({ error: 'Too many messages. Please wait a bit before asking again.', fallback: true });
  }

  const body = (req.body ?? {}) as { message?: string; progressSnapshot?: ProgressSnapshot };
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Witt LLM is not configured on this deployment yet.', fallback: true });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const openaiRes = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: buildProgressContext(body.progressSnapshot) },
          { role: 'user', content: message.slice(0, 2000) },
        ],
        max_tokens: 200,
        temperature: 0.6,
      }),
      signal: controller.signal,
    });

    if (!openaiRes.ok) {
      console.error('witt-chat: OpenAI request failed', openaiRes.status);
      return res.status(503).json({ error: 'Witt LLM is temporarily unavailable.', fallback: true });
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(503).json({ error: 'Witt LLM returned an empty reply.', fallback: true });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('witt-chat failed', err);
    return res.status(503).json({ error: 'Witt LLM is temporarily unavailable.', fallback: true });
  } finally {
    clearTimeout(timeout);
  }
}
