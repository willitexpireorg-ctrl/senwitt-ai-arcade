import type { AttemptResult, SessionResult, SkillCategory, UserProgress } from '../types';

const SKILL_LABEL: Record<SkillCategory, string> = {
  writing: 'Writing',
  math: 'Math',
  code: 'Code',
  memory: 'Memory',
  reading: 'Reading',
  reasoning: 'Reasoning',
};

/** Deterministic post-session insight from real attempt data. */
export const buildSessionInsight = (
  session: SessionResult,
  progress: UserProgress,
): string => {
  const byCat = new Map<SkillCategory, { correct: number; total: number; time: number }>();
  session.attempts.forEach((a: AttemptResult) => {
    const cur = byCat.get(a.category) ?? { correct: 0, total: 0, time: 0 };
    cur.total += 1;
    cur.time += a.timeSpentMs;
    if (a.isCorrect) cur.correct += 1;
    byCat.set(a.category, cur);
  });

  let weakest: SkillCategory | null = null;
  let weakestAcc = 2;
  let strongest: SkillCategory | null = null;
  let strongestAcc = -1;

  byCat.forEach((stats, cat) => {
    const acc = stats.total > 0 ? stats.correct / stats.total : 0;
    if (acc < weakestAcc) {
      weakestAcc = acc;
      weakest = cat;
    }
    if (acc > strongestAcc) {
      strongestAcc = acc;
      strongest = cat;
    }
  });

  const accuracy = session.totalItems > 0 ? session.correctCount / session.totalItems : 0;
  const avgMs =
    session.attempts.length > 0
      ? session.totalTimeSpentMs / session.attempts.length
      : session.totalTimeSpentMs;

  const parts: string[] = [];

  if (accuracy >= 0.85 && strongest) {
    parts.push(
      `Strong session — tomorrow’s set will lean a bit harder on ${SKILL_LABEL[strongest]}.`,
    );
  } else if (weakest && weakestAcc < 0.6) {
    parts.push(`We’ll reinforce ${SKILL_LABEL[weakest]} next — that was the soft spot today.`);
  } else if (avgMs > 18000 && accuracy >= 0.7) {
    parts.push('Solid accuracy — try answering a little faster next time to build fluency.');
  } else if (avgMs < 6000 && accuracy < 0.6) {
    parts.push('You moved fast. Slow a beat on the next set and accuracy should climb.');
  } else if (strongest && weakest && strongest !== weakest) {
    parts.push(
      `${SKILL_LABEL[strongest]} looked sharp; keep ${SKILL_LABEL[weakest]} in the mix tomorrow.`,
    );
  } else {
    parts.push('Nice work. Consistency beats intensity — see you for the next short set.');
  }

  if (progress.streakDays > 0 && progress.streakDays % 7 === 0) {
    parts.push('Seven-day streak milestone — you earned a streak shield.');
  } else if (progress.streakShields > 0 && progress.streakDays === 1) {
    // Likely a shield-protected restart isn't distinguishable here; skip.
  }

  return parts.slice(0, 2).join(' ');
};

export interface WeeklyReport {
  sessionsThisWeek: number;
  sharpnessDelta: number;
  bestSkill: SkillCategory | null;
  focusNext: SkillCategory | null;
  activeDays: number;
}

/** Summarize the last 7 local calendar days of history. */
export const buildWeeklyReport = (
  progress: UserProgress,
  history: SessionResult[],
  todayStr: string,
): WeeklyReport => {
  const today = new Date(todayStr + 'T12:00:00');
  const weekDates = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    weekDates.add(`${y}-${m}-${day}`);
  }

  const weekSessions = history.filter((s) => weekDates.has(s.date));
  const activeDays = new Set(weekSessions.map((s) => s.date)).size;

  const hist = progress.sharpnessHistory.filter((h) => weekDates.has(h.date));
  const scores = hist.map((h) => h.score);
  const sharpnessDelta =
    scores.length >= 2 ? scores[scores.length - 1] - scores[0] : weekSessions.reduce((n, s) => n + s.sharpnessDelta, 0);

  const skillScores = Object.entries(progress.skills) as [SkillCategory, { score: number; accuracy: number }][];
  skillScores.sort((a, b) => b[1].score - a[1].score);
  const bestSkill = skillScores[0]?.[0] ?? null;
  const focusNext = skillScores[skillScores.length - 1]?.[0] ?? null;

  return {
    sessionsThisWeek: weekSessions.length,
    sharpnessDelta,
    bestSkill,
    focusNext,
    activeDays,
  };
};

export interface MomentumStatus {
  daysThisWeek: number;
  target: number;
}

const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Momentum = distinct local calendar dates trained this Mon–Sun week, out of a
 * target of 5. Deliberately separate from "streak" (which is consecutive days)
 * — momentum is forgiving of which days you skip, only how many. */
export const computeMomentum = (history: SessionResult[], todayStr: string): MomentumStatus => {
  const today = new Date(todayStr + 'T12:00:00');
  const dayOfWeek = today.getDay(); // 0 = Sun ... 6 = Sat
  const diffFromMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffFromMonday);

  const weekDates = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.add(toLocalDateStr(d));
  }

  const daysThisWeek = new Set(history.filter((s) => weekDates.has(s.date)).map((s) => s.date)).size;
  return { daysThisWeek, target: 5 };
};

/** One real-world application tip based on the weakest category in a session —
 * ties the drill back to something the user can try today. */
export const buildApplicationCue = (session: SessionResult): string => {
  const byCat = new Map<SkillCategory, { correct: number; total: number }>();
  session.attempts.forEach((a: AttemptResult) => {
    const cur = byCat.get(a.category) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    byCat.set(a.category, cur);
  });

  let weakest: SkillCategory | null = null;
  let weakestAcc = 2;
  byCat.forEach((stats, cat) => {
    const acc = stats.total > 0 ? stats.correct / stats.total : 0;
    if (acc < weakestAcc) {
      weakestAcc = acc;
      weakest = cat;
    }
  });

  const TIPS: Record<SkillCategory, string> = {
    memory: 'Try it today: after your next meeting, recall the 2–3 decisions made before you check your notes.',
    writing: 'Try it today: before sending your next Slack message, cut it down to one clear sentence first.',
    math: 'Try it today: before opening a report, guess the headline number yourself, then check how close you were.',
    reasoning: 'Try it today: before reacting to a claim, pause and state what would have to be true for it to hold.',
    code: 'Try it today: trace a function by hand once before reaching for the debugger.',
    reading: 'Try it today: before agreeing with an argument, write down the one assumption it depends on.',
  };

  return TIPS[weakest ?? 'reasoning'];
};

/** Last 7 calendar days as trained / missed flags (oldest → newest). */
export const last7DayActivity = (
  history: SessionResult[],
  todayStr: string,
): { date: string; trained: boolean }[] => {
  const trainedDates = new Set(history.map((s) => s.date));
  const today = new Date(todayStr + 'T12:00:00');
  const days: { date: string; trained: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const date = `${y}-${m}-${day}`;
    days.push({ date, trained: trainedDates.has(date) });
  }
  return days;
};
