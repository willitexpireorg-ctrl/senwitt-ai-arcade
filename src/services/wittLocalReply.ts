/**
 * Deterministic keyword-based Witt coach replies — the always-available local
 * fallback used by free users and whenever the server-side LLM (Phase 3,
 * `api/witt-chat.ts`) is unavailable or fails. Grounded, practical tips only;
 * no IQ/clinical/brain-age claims.
 */

export interface WittLocalProgress {
  sharpnessScore: number;
  streakDays: number;
  beltRank: string;
}

export function wittLocalReply(userText: string, progress: WittLocalProgress): string {
  const promptLower = userText.toLowerCase();

  if (promptLower.includes('streak') || promptLower.includes('belt')) {
    return `You're on ${progress.beltRank} with a ${progress.streakDays}-day streak. Finish today's set to keep it going.`;
  }
  if (promptLower.includes('fallacy') || promptLower.includes('logic')) {
    return `Watch for weak arguments — circular reasoning, straw men, and attacks on the person instead of the claim. The logic games are good practice for spotting those.`;
  }
  if (promptLower.includes('code') || promptLower.includes('scope')) {
    return `Trace code by hand before you trust a suggested fix. Closures and shared loop variables still trip people up — our code drills target that.`;
  }
  if (promptLower.includes('fluff') || promptLower.includes('writing')) {
    return `Cut filler. Prefer short active sentences over corporate padding. The writing drills train that habit.`;
  }

  return `Nice question. Short daily reps in writing, logic, and code help you keep solving things yourself instead of always asking a tool first.`;
}
