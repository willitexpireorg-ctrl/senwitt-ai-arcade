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
}

export interface WittNudge {
  id: string;
  quote: string;
  categoryRecommendation: SkillCategory;
  mood: 'encouraging' | 'sharp' | 'challenging' | 'celebratory';
}
