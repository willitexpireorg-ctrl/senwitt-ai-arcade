import type { UserProgress, SessionResult, SkillCategory, SkillMastery } from '../types';

const STORAGE_KEY_PROGRESS = 'senwitt_user_progress_v1';
const STORAGE_KEY_SESSIONS = 'senwitt_session_history_v1';

// In-Memory Storage Fallback for Incognito & Storage Blocked environments
const memoryStorage = new Map<string, string>();

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {}
  return memoryStorage.get(key) || null;
};

const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {}
  memoryStorage.set(key, value);
};

// Helper: Get local wall-clock date string (YYYY-MM-DD) avoiding UTC midnight shift bugs
export const getLocalDateString = (dateObj: Date = new Date()): string => {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_SKILLS: Record<SkillCategory, SkillMastery> = {
  writing: { category: 'writing', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  math: { category: 'math', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  code: { category: 'code', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  memory: { category: 'memory', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  reading: { category: 'reading', level: 1, score: 700, totalReps: 0, accuracy: 100 },
  reasoning: { category: 'reasoning', level: 1, score: 700, totalReps: 0, accuracy: 100 },
};

const DEFAULT_PROGRESS: UserProgress = {
  sharpnessScore: 720,
  sharpnessHistory: [
    { date: getLocalDateString(new Date(Date.now() - 86400000 * 4)), score: 700 },
    { date: getLocalDateString(new Date(Date.now() - 86400000 * 3)), score: 705 },
    { date: getLocalDateString(new Date(Date.now() - 86400000 * 2)), score: 712 },
    { date: getLocalDateString(new Date(Date.now() - 86400000 * 1)), score: 720 },
  ],
  totalSessions: 4,
  streakDays: 4,
  lastSessionDate: getLocalDateString(new Date(Date.now() - 86400000 * 1)),
  streakShields: 2,
  beltRank: 'Yellow Belt (Focus Practitioner)',
  skills: INITIAL_SKILLS,
  completedSetIds: [],
};

export const getStoredProgress = (): UserProgress => {
  try {
    const raw = safeGetItem(STORAGE_KEY_PROGRESS);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch (e) {
    return DEFAULT_PROGRESS;
  }
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

export const recordSessionCompletion = (session: SessionResult): UserProgress => {
  const current = getStoredProgress();
  const todayStr = getLocalDateString();

  // 1. Update Sharpness
  const newSharpness = Math.min(1000, Math.max(300, current.sharpnessScore + session.sharpnessDelta));

  // 2. Streak tracking
  let newStreak = current.streakDays;
  if (current.lastSessionDate) {
    if (current.lastSessionDate === todayStr) {
      newStreak = current.streakDays;
    } else {
      const lastDate = new Date(current.lastSessionDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        if (current.streakShields > 0 && diffDays <= 3) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }
  } else {
    newStreak = 1;
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
    lastSessionDate: todayStr,
    beltRank: calculateBeltRank(newSharpness, current.totalSessions + 1),
    skills: updatedSkills,
    completedSetIds: [...current.completedSetIds, session.id],
  };

  saveUserProgress(updatedProgress);

  const existingSessions = getSessionHistory();
  safeSetItem(STORAGE_KEY_SESSIONS, JSON.stringify([session, ...existingSessions]));

  return updatedProgress;
};
