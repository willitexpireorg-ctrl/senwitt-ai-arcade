export type SkillCategory = 'writing' | 'math' | 'code' | 'memory' | 'reading' | 'reasoning';

export type SetMode = 'daily' | 'coffee_break' | 'weekend_long';

export type BeltRank = 
  | 'White Belt (Initiate)'
  | 'Yellow Belt (Focus Practitioner)'
  | 'Green Belt (Logic Specialist)'
  | 'Blue Belt (Cognitive Architect)'
  | 'Purple Belt (Neural Strategist)'
  | 'Black Belt (Master Mind)';

export interface ExerciseItem {
  id: string;
  category: SkillCategory;
  type: string;
  title: string;
  prompt: string;
  contextCode?: string;
  contextPassage?: string;
  gridSize?: number; // For spatial memory
  sequenceData?: string[]; // For memory sequence
  options?: string[];
  correctAnswer: string | string[] | number[];
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cognitiveTarget: string;
  timeLimitSec?: number;
}

export interface DailySet {
  id: string;
  date: string;
  title: string;
  description: string;
  mode: SetMode;
  items: ExerciseItem[];
  estimatedMinutes: number;
}

export interface AttemptResult {
  itemId: string;
  category: SkillCategory;
  isCorrect: boolean;
  timeSpentMs: number;
  scoreEarned: number;
  userAnswer: any;
  explanation: string;
  timestamp: string;
}

export interface SessionResult {
  id: string;
  mode: SetMode;
  date: string;
  totalItems: number;
  correctCount: number;
  totalTimeSpentMs: number;
  sharpnessDelta: number;
  finalSharpness: number;
  attempts: AttemptResult[];
}

export interface SkillMastery {
  category: SkillCategory;
  level: number;
  score: number;
  totalReps: number;
  accuracy: number;
}

export interface UserProgress {
  sharpnessScore: number;
  sharpnessHistory: { date: string; score: number }[];
  totalSessions: number;
  streakDays: number;
  lastSessionDate: string | null;
  streakShields: number;
  beltRank: BeltRank;
  skills: Record<SkillCategory, SkillMastery>;
  completedSetIds: string[];
  baselineCompleted: boolean;
  baselineProfile?: BaselineProfile;
  /** Monthly "comeback" recovery tokens — softer safety net than shields, meant
   * for the occasional 2-day gap without any streak-loss anxiety. */
  graceTokens: number;
  /** YYYY-MM the current graceTokens balance was issued for; resets on month change. */
  graceTokensMonth: string;
  /** Tiny Habits: after I [anchor], I train */
  habitAnchor?: string | null;
  /** Minutes user committed to (foot-in-the-door) */
  dailyMinutesGoal?: 2 | 5 | 10;
  /** HH:mm local for opt-in reminder, null = off */
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  /** YYYY-MM-DD last time we showed in-app reminder banner */
  reminderLastShownDate?: string | null;
  /** true after user finished at least one full session — gates install prompt */
  earnedInstallPrompt?: boolean;
}

export interface WittNudge {
  id: string;
  quote: string;
  categoryRecommendation: SkillCategory;
  mood: 'encouraging' | 'sharp' | 'challenging' | 'celebratory';
}

/** Practical priority buckets surfaced by the baseline assessment (deliberately
 * distinct from SkillCategory — these map to plain-language, real-world areas). */
export type BaselinePriority = 'focus' | 'recall' | 'communication' | 'numbers';

export interface BaselineProfile {
  /** Weakest-first ordering of the four practical areas. */
  priorities: BaselinePriority[];
  /** Normalized 0-100 score per area from the short sample. */
  scoresByArea: Record<BaselinePriority, number>;
  completedAt: string;
  /** Optional foot-in-the-door minutes commitment from baseline intro. */
  committedMinutes?: 2 | 5 | 10;
}
