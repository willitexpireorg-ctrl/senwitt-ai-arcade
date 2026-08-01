import type { UserProgress, SessionResult, SkillCategory, SkillMastery, BaselineProfile, AttemptResult } from '../types';
import type { IRTAbilityProfile } from './irtAdaptiveEngine';
import type { DailyWorkoutPlan } from './dailyWorkoutPlan';

const STORAGE_KEY_PROGRESS = 'senwitt_user_progress_v1';
const STORAGE_KEY_SESSIONS = 'senwitt_session_history_v1';
const STORAGE_KEY_IRT = 'senwitt_irt_profile_v1';
export const STORAGE_KEY_ACTIVE_WORKOUT = 'senwitt_active_workout_v1';

export interface ActiveWorkoutState {
  plan: DailyWorkoutPlan;
  stepIndex: number;
  attempts: AttemptResult[];
  startedAt: string;
}

const DEFAULT_IRT_PROFILE: IRTAbilityProfile = {
  theta: 0.2,
  glickoRating: 1560,
  ratingDeviation: 120,
  flowStateTarget: 0.82,
};

// In-Memory Storage Fallback for Incognito & Storage Blocked environments
const memoryStorage = new Map<string, string>();

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('storage get failed', e);
  }
  return memoryStorage.get(key) || null;
};

const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    console.warn('storage set failed', e);
  }
  memoryStorage.set(key, value);
};

// Helper: Get local wall-clock date string (YYYY-MM-DD) avoiding UTC midnight shift bugs
export const getLocalDateString = (dateObj: Date = new Date()): string => {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get local wall-clock month string (YYYY-MM) for monthly grace token resets
export const getLocalMonthString = (dateObj: Date = new Date()): string => {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

const GRACE_TOKENS_PER_MONTH = 2;

const INITIAL_SKILLS: Record<SkillCategory, SkillMastery> = {
  writing: { category: 'writing', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  math: { category: 'math', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  code: { category: 'code', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  memory: { category: 'memory', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  reading: { category: 'reading', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  reasoning: { category: 'reasoning', level: 1, score: 700, totalReps: 0, accuracy: 100 },
};

const DEFAULT_PROGRESS: UserProgress = {
  sharpnessScore: 700,
  sharpnessHistory: [],
  totalSessions: 0,
  streakDays: 0,
  lastSessionDate: null,
  streakShields: 0,
  beltRank: 'White Belt (Initiate)',
  skills: INITIAL_SKILLS,
  completedSetIds: [],
  baselineCompleted: false,
  baselineProfile: undefined,
  graceTokens: GRACE_TOKENS_PER_MONTH,
  graceTokensMonth: getLocalMonthString(),
  habitAnchor: null,
  dailyMinutesGoal: 5,
  reminderTime: null,
  reminderEnabled: false,
  reminderLastShownDate: null,
  earnedInstallPrompt: false,
};

export type HabitPreferencesPartial = Partial<
  Pick<
    UserProgress,
    | 'habitAnchor'
    | 'dailyMinutesGoal'
    | 'reminderTime'
    | 'reminderEnabled'
    | 'reminderLastShownDate'
  >
>;

export const getStoredProgress = (): UserProgress => {
  try {
    const raw = safeGetItem(STORAGE_KEY_PROGRESS);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    const merged: UserProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      skills: { ...INITIAL_SKILLS, ...(parsed.skills || {}) },
    };
    let migrated = false;
    // Existing users who already trained should not be forced through baseline again.
    if (parsed.baselineCompleted !== true && (merged.totalSessions > 0 || Boolean(merged.lastSessionDate))) {
      merged.baselineCompleted = true;
      migrated = true;
    }
    // Migrate habit / reminder / install fields for older saves.
    if (parsed.habitAnchor === undefined) {
      merged.habitAnchor = null;
      migrated = true;
    }
    if (merged.dailyMinutesGoal !== 2 && merged.dailyMinutesGoal !== 5 && merged.dailyMinutesGoal !== 10) {
      merged.dailyMinutesGoal = 5;
      migrated = true;
    }
    if (parsed.reminderEnabled === undefined) {
      merged.reminderEnabled = false;
      migrated = true;
    }
    if (parsed.reminderTime === undefined) {
      merged.reminderTime = null;
      migrated = true;
    }
    if (parsed.reminderLastShownDate === undefined) {
      merged.reminderLastShownDate = null;
      migrated = true;
    }
    // Existing trainers earn the install prompt without a new session.
    if (parsed.earnedInstallPrompt === undefined) {
      merged.earnedInstallPrompt = merged.totalSessions > 0;
      migrated = true;
    }
    if (migrated) {
      try {
        safeSetItem(STORAGE_KEY_PROGRESS, JSON.stringify(merged));
      } catch (e) {
        console.warn('Failed to persist migrated progress', e);
      }
    }
    return merged;
  } catch (e) {
    console.warn('Failed to parse stored progress', e);
    return { ...DEFAULT_PROGRESS };
  }
};

/** Whether the user already completed a session on the given local date. */
export const hasTrainedToday = (
  progressOrHistory: UserProgress | SessionResult[],
  today: string = getLocalDateString(),
): boolean => {
  if (Array.isArray(progressOrHistory)) {
    return progressOrHistory.some((s) => s.date === today);
  }
  return progressOrHistory.lastSessionDate === today;
};

export const updateHabitPreferences = (partial: HabitPreferencesPartial): UserProgress => {
  const current = getStoredProgress();
  const updated: UserProgress = { ...current, ...partial };
  saveUserProgress(updated);
  return updated;
};

export const markInstallPromptEarned = (): UserProgress => {
  const current = getStoredProgress();
  if (current.earnedInstallPrompt) return current;
  const updated: UserProgress = { ...current, earnedInstallPrompt: true };
  saveUserProgress(updated);
  return updated;
};

/** Skip full baseline — equal starter scores so the plan still has priorities. */
export const deferBaselineWithDefaults = (): UserProgress => {
  const current = getStoredProgress();
  const updated: UserProgress = {
    ...current,
    baselineCompleted: true,
    baselineProfile: {
      priorities: ['focus', 'recall', 'communication', 'numbers'],
      scoresByArea: { focus: 50, recall: 50, communication: 50, numbers: 50 },
      completedAt: new Date().toISOString(),
    },
  };
  saveUserProgress(updated);
  return updated;
};

export const saveUserProgress = (progress: UserProgress): void => {
  try {
    safeSetItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
};

export const getSessionHistory = (): SessionResult[] => {
  try {
    const raw = safeGetItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse session history', e);
    return [];
  }
};

export const calculateBeltRank = (sharpness: number, totalSessions: number): UserProgress['beltRank'] => {
  if (sharpness >= 900 && totalSessions >= 50) return 'Black Belt (Master Mind)';
  if (sharpness >= 840 && totalSessions >= 30) return 'Purple Belt (Neural Strategist)';
  if (sharpness >= 780 && totalSessions >= 18) return 'Blue Belt (Cognitive Architect)';
  if (sharpness >= 740 && totalSessions >= 8) return 'Green Belt (Logic Specialist)';
  if (sharpness >= 700 && totalSessions >= 2) return 'Yellow Belt (Focus Practitioner)';
  return 'White Belt (Initiate)';
};

export const getStoredAbilityProfile = (): IRTAbilityProfile => {
  try {
    const raw = safeGetItem(STORAGE_KEY_IRT);
    if (!raw) return { ...DEFAULT_IRT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_IRT_PROFILE, ...parsed };
  } catch (e) {
    console.warn('Failed to parse IRT profile', e);
    return { ...DEFAULT_IRT_PROFILE };
  }
};

export const saveAbilityProfile = (profile: IRTAbilityProfile): void => {
  try {
    safeSetItem(STORAGE_KEY_IRT, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save IRT profile:', e);
  }
};

export const recordSessionCompletion = (session: SessionResult): UserProgress => {
  const current = getStoredProgress();
  const todayStr = getLocalDateString();
  const thisMonth = getLocalMonthString();

  // Grace tokens refresh monthly regardless of streak outcome below.
  let newGraceTokens = current.graceTokensMonth === thisMonth ? current.graceTokens : GRACE_TOKENS_PER_MONTH;
  const newGraceTokensMonth = thisMonth;

  // 1. Update Sharpness
  const newSharpness = Math.min(1000, Math.max(300, current.sharpnessScore + session.sharpnessDelta));

  // 2. Streak tracking (+ consume / earn shields / grace tokens)
  // Non-punitive recovery order: a 2-day gap first tries a monthly grace token
  // (no visible "cost" beyond the token itself); only a 3-day gap — or a 2-day
  // gap with no grace tokens left — dips into a streak shield. Never both for
  // the same gap.
  let newStreak = current.streakDays;
  let newShields = current.streakShields;
  let usedGraceToken = false;
  if (current.lastSessionDate) {
    if (current.lastSessionDate === todayStr) {
      newStreak = current.streakDays;
    } else {
      const lastDate = new Date(current.lastSessionDate + 'T12:00:00');
      const todayDate = new Date(todayStr + 'T12:00:00');
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        if (diffDays <= 2 && newGraceTokens > 0) {
          newStreak += 1;
          newGraceTokens -= 1;
          usedGraceToken = true;
        } else if (diffDays <= 3 && current.streakShields > 0) {
          newStreak += 1;
          newShields = Math.max(0, current.streakShields - 1);
        } else {
          newStreak = 1;
        }
      }
    }
  } else {
    newStreak = 1;
  }
  void usedGraceToken; // reserved for future "used a comeback token" messaging

  // Earn +1 shield every 7-day streak milestone (cap 2)
  if (newStreak > 0 && newStreak % 7 === 0 && newStreak !== current.streakDays) {
    newShields = Math.min(2, newShields + 1);
  }

  // 3. Update Skill Masteries with Division Guards
  const updatedSkills = { ...current.skills };
  session.attempts.forEach((attempt) => {
    const category = attempt.category;
    if (updatedSkills[category]) {
      const existing = updatedSkills[category];
      const newTotalReps = existing.totalReps + 1;
      const correctInc = attempt.isCorrect ? 1 : 0;
      const totalCorrect = Math.round((existing.accuracy || 100) * 0.01 * existing.totalReps) + correctInc;
      
      const newAccuracy = newTotalReps > 0
        ? Math.min(100, Math.max(0, Math.round((totalCorrect / newTotalReps) * 100)))
        : 100;

      const scoreDelta = attempt.isCorrect ? 12 : -6;
      const newScore = Math.min(1000, Math.max(300, existing.score + scoreDelta));
      const newLevel = Math.floor(newScore / 150) + 1;

      updatedSkills[category] = {
        ...existing,
        totalReps: newTotalReps,
        accuracy: isNaN(newAccuracy) ? 100 : newAccuracy,
        score: newScore,
        level: newLevel,
      };
    }
  });

  // 4. Update History
  const history = [...current.sharpnessHistory];
  const lastHistoryIndex = history.findIndex((h) => h.date === todayStr);
  if (lastHistoryIndex >= 0) {
    history[lastHistoryIndex].score = newSharpness;
  } else {
    history.push({ date: todayStr, score: newSharpness });
  }

  const updatedProgress: UserProgress = {
    ...current,
    sharpnessScore: newSharpness,
    sharpnessHistory: history.slice(-30),
    totalSessions: current.totalSessions + 1,
    streakDays: newStreak,
    streakShields: newShields,
    graceTokens: newGraceTokens,
    graceTokensMonth: newGraceTokensMonth,
    lastSessionDate: todayStr,
    beltRank: calculateBeltRank(newSharpness, current.totalSessions + 1),
    skills: updatedSkills,
    completedSetIds: [...current.completedSetIds, ...session.attempts.map((a) => a.itemId)].slice(-400),
  };

  saveUserProgress(updatedProgress);

  const existingSessions = getSessionHistory();
  safeSetItem(STORAGE_KEY_SESSIONS, JSON.stringify([session, ...existingSessions]));

  return updatedProgress;
};

export const completeBaselineAssessment = (profile: BaselineProfile): UserProgress => {
  const current = getStoredProgress();
  const updated: UserProgress = {
    ...current,
    baselineCompleted: true,
    baselineProfile: profile,
    ...(profile.committedMinutes === 2 || profile.committedMinutes === 5 || profile.committedMinutes === 10
      ? { dailyMinutesGoal: profile.committedMinutes }
      : {}),
  };
  saveUserProgress(updated);
  return updated;
};

/** Resume state for an in-progress mixed daily workout (Zeigarnik open loop). */
export const getActiveWorkout = (): ActiveWorkoutState | null => {
  try {
    const raw = safeGetItem(STORAGE_KEY_ACTIVE_WORKOUT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveWorkoutState;
    if (!parsed?.plan?.date || !Array.isArray(parsed.plan.steps)) {
      clearActiveWorkout();
      return null;
    }
    const today = getLocalDateString();
    if (parsed.plan.date !== today) {
      clearActiveWorkout();
      return null;
    }
    const stepCount = parsed.plan.steps.length;
    if (stepCount === 0) {
      clearActiveWorkout();
      return null;
    }
    const stepIndex = Number(parsed.stepIndex);
    if (!Number.isFinite(stepIndex) || stepIndex < 0 || stepIndex >= stepCount) {
      clearActiveWorkout();
      return null;
    }
    if (!Array.isArray(parsed.attempts)) {
      parsed.attempts = [];
    }
    return { ...parsed, stepIndex };
  } catch (e) {
    console.warn('Failed to parse active workout', e);
    clearActiveWorkout();
    return null;
  }
};

export const saveActiveWorkout = (state: ActiveWorkoutState): void => {
  try {
    safeSetItem(STORAGE_KEY_ACTIVE_WORKOUT, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save active workout:', e);
  }
};

export const clearActiveWorkout = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_WORKOUT);
    }
  } catch (e) {
    console.warn('storage remove failed', e);
  }
  memoryStorage.delete(STORAGE_KEY_ACTIVE_WORKOUT);
};

export const exportUserDataJson = (): string => {
  const progress = getStoredProgress();
  const history = getSessionHistory();
  const ability = getStoredAbilityProfile();
  return JSON.stringify({
    version: '1.1',
    exportDate: new Date().toISOString(),
    progress,
    history,
    ability,
  }, null, 2);
};

export const importUserDataJson = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data && data.progress) {
      saveUserProgress(data.progress);
      if (Array.isArray(data.history)) {
        safeSetItem(STORAGE_KEY_SESSIONS, JSON.stringify(data.history));
      }
      if (data.ability) {
        saveAbilityProfile({ ...DEFAULT_IRT_PROFILE, ...data.ability });
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to import user data:', e);
  }
  return false;
};

