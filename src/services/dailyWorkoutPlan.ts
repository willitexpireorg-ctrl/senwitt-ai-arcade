import type { BaselineProfile, BaselinePriority, ExerciseItem, SetMode, SkillCategory } from '../types';
import { EXERCISE_BANK, withShuffledOptions } from '../data/exerciseBank';

const localDateString = (dateObj: Date = new Date()): string => {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type WorkoutEngineMechanic =
  | 'brevity_cut'
  | 'quick_purchase'
  | 'sequence_order'
  | 'rsvp_reader'
  | 'speed_match'
  | 'signal_sweep'
  | 'pattern_shift'
  | 'brief_recall'
  | 'clearer_sentence'
  | 'number_sense'
  | 'stroop'
  | 'synonym_race'
  | 'tone_pick'
  | 'attention_track'
  | 'route_plan';

export type WorkoutStep =
  | { id: string; kind: 'quiz'; label: string; item: ExerciseItem }
  | { id: string; kind: 'engine'; label: string; mechanic: WorkoutEngineMechanic; category: SkillCategory };

export interface DailyWorkoutPlan {
  mode: SetMode;
  date: string; // YYYY-MM-DD
  title: string;
  steps: WorkoutStep[];
  estimatedMinutes: number;
}

export const ENGINE_LABELS: Record<WorkoutEngineMechanic, string> = {
  brevity_cut: 'Brevity Cut',
  quick_purchase: 'Quick Purchase',
  sequence_order: 'Sequence Order',
  rsvp_reader: 'RSVP Reader',
  speed_match: 'Speed Match',
  signal_sweep: 'Signal Sweep',
  pattern_shift: 'Pattern Shift',
  brief_recall: 'Brief Recall',
  clearer_sentence: 'Clearer Sentence',
  number_sense: 'Number Sense',
  stroop: 'Stroop',
  synonym_race: 'Synonym Race',
  tone_pick: 'Tone Pick',
  attention_track: 'Focus Track',
  route_plan: 'Route Planner',
};

const ENGINE_CATEGORY: Record<WorkoutEngineMechanic, SkillCategory> = {
  brevity_cut: 'writing',
  quick_purchase: 'math',
  sequence_order: 'memory',
  rsvp_reader: 'reading',
  speed_match: 'reasoning',
  signal_sweep: 'reasoning',
  pattern_shift: 'reasoning',
  brief_recall: 'memory',
  clearer_sentence: 'writing',
  number_sense: 'math',
  stroop: 'reasoning',
  synonym_race: 'writing',
  tone_pick: 'writing',
  attention_track: 'reasoning',
  route_plan: 'reasoning',
};

const ALL_ENGINES: WorkoutEngineMechanic[] = [
  'brevity_cut',
  'quick_purchase',
  'sequence_order',
  'rsvp_reader',
  'speed_match',
  'signal_sweep',
  'pattern_shift',
  'brief_recall',
  'clearer_sentence',
  'number_sense',
  'stroop',
  'synonym_race',
  'tone_pick',
  'attention_track',
  'route_plan',
];

const BASELINE_TO_SKILL: Record<BaselinePriority, SkillCategory> = {
  focus: 'reasoning',
  recall: 'memory',
  communication: 'writing',
  numbers: 'math',
};

const MODE_CONFIG: Record<
  SetMode,
  { quizCount: number; engineCount: number; estimatedMinutes: number; title: string }
> = {
  coffee_break: { quizCount: 1, engineCount: 1, estimatedMinutes: 2, title: 'Coffee Break' },
  daily: { quizCount: 2, engineCount: 2, estimatedMinutes: 5, title: 'Daily Brain Set' },
  weekend_long: { quizCount: 3, engineCount: 3, estimatedMinutes: 10, title: 'Weekend Deep Set' },
};

/** FNV-1a inspired hash → unsigned 32-bit seed. */
const hashSeed = (str: string): number => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Mulberry32 — deterministic PRNG from a seed. */
const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = <T>(array: T[], rng: () => number): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/** Soft weight: preferred categories get a boost, never a hard lock. */
const categoryWeight = (
  category: SkillCategory,
  preferred: SkillCategory[],
): number => {
  const idx = preferred.indexOf(category);
  if (idx < 0) return 1;
  // Weakest-first: first priority gets ~2.4×, then taper.
  return 2.4 - idx * 0.35;
};

const weightedPick = <T>(
  items: T[],
  weightOf: (item: T) => number,
  rng: () => number,
): T | null => {
  if (items.length === 0) return null;
  let total = 0;
  const weights = items.map((item) => {
    const w = Math.max(0.01, weightOf(item));
    total += w;
    return w;
  });
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
};

const preferredCategoriesFromBaseline = (
  baseline?: BaselineProfile,
): SkillCategory[] => {
  if (!baseline?.priorities?.length) return [];
  const seen = new Set<SkillCategory>();
  const out: SkillCategory[] = [];
  for (const p of baseline.priorities) {
    const skill = BASELINE_TO_SKILL[p];
    if (skill && !seen.has(skill)) {
      seen.add(skill);
      out.push(skill);
    }
  }
  return out;
};

const pickEngines = (
  count: number,
  rng: () => number,
  preferred: SkillCategory[],
): WorkoutEngineMechanic[] => {
  const pool = seededShuffle(ALL_ENGINES, rng);
  const selected: WorkoutEngineMechanic[] = [];
  const usedCategories = new Set<SkillCategory>();

  // Pass 1: prefer unused categories + soft baseline bias
  while (selected.length < count && pool.length > 0) {
    const candidates = pool.filter((m) => !usedCategories.has(ENGINE_CATEGORY[m]));
    const from = candidates.length > 0 ? candidates : pool;
    const pick = weightedPick(
      from,
      (m) => categoryWeight(ENGINE_CATEGORY[m], preferred),
      rng,
    );
    if (!pick) break;
    selected.push(pick);
    usedCategories.add(ENGINE_CATEGORY[pick]);
    const idx = pool.indexOf(pick);
    if (idx >= 0) pool.splice(idx, 1);
  }

  return selected;
};

const pickQuizItems = (
  count: number,
  rng: () => number,
  excludeIds: string[],
  preferred: SkillCategory[],
  avoidCategories: SkillCategory[],
): ExerciseItem[] => {
  const exclude = new Set(excludeIds);
  const fresh = EXERCISE_BANK.filter((item) => !exclude.has(item.id));
  const basePool = fresh.length >= count ? fresh : EXERCISE_BANK;
  const pool = seededShuffle(basePool, rng);
  const selected: ExerciseItem[] = [];
  const selectedIds = new Set<string>();
  const usedCategories = new Set<SkillCategory>(avoidCategories);

  const takeOne = (preferFreshCategory: boolean) => {
    const available = pool.filter((item) => !selectedIds.has(item.id));
    if (available.length === 0) return;

    let candidates = preferFreshCategory
      ? available.filter((item) => !usedCategories.has(item.category))
      : available;
    if (candidates.length === 0) candidates = available;

    const pick = weightedPick(
      candidates,
      (item) => categoryWeight(item.category, preferred),
      rng,
    );
    if (!pick) return;
    selected.push(withShuffledOptions(pick));
    selectedIds.add(pick.id);
    usedCategories.add(pick.category);
  };

  for (let i = 0; i < count; i++) {
    takeOne(true);
  }

  // Top-up if somehow short
  while (selected.length < count) {
    const leftover = pool.find((item) => !selectedIds.has(item.id));
    if (!leftover) break;
    selected.push(withShuffledOptions(leftover));
    selectedIds.add(leftover.id);
  }

  return selected;
};

export interface BuildDailyWorkoutOpts {
  excludeIds?: string[];
  date?: string;
  baselineProfile?: BaselineProfile;
}

export const buildDailyWorkoutPlan = (
  mode: SetMode,
  opts: BuildDailyWorkoutOpts = {},
): DailyWorkoutPlan => {
  const config = MODE_CONFIG[mode];
  const date = opts.date ?? localDateString();
  const preferred = preferredCategoriesFromBaseline(opts.baselineProfile);
  const rng = mulberry32(hashSeed(`${date}|${mode}|senwitt-workout-v1`));

  const engines = pickEngines(config.engineCount, rng, preferred);
  const engineCategories = engines.map((m) => ENGINE_CATEGORY[m]);
  const quizzes = pickQuizItems(
    config.quizCount,
    rng,
    opts.excludeIds ?? [],
    preferred,
    engineCategories,
  );

  // Alternate quiz ↔ engine, starting with quiz (Hick: fixed plan, no mid-session choice).
  const steps: WorkoutStep[] = [];
  const pairs = Math.max(config.quizCount, config.engineCount);
  for (let i = 0; i < pairs; i++) {
    if (i < quizzes.length) {
      const item = quizzes[i];
      const catLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
      steps.push({
        id: `quiz-${date}-${mode}-${i}-${item.id}`,
        kind: 'quiz',
        label: `${catLabel} quiz`,
        item,
      });
    }
    if (i < engines.length) {
      const mechanic = engines[i];
      steps.push({
        id: `engine-${date}-${mode}-${i}-${mechanic}`,
        kind: 'engine',
        label: ENGINE_LABELS[mechanic],
        mechanic,
        category: ENGINE_CATEGORY[mechanic],
      });
    }
  }

  return {
    mode,
    date,
    title: config.title,
    steps,
    estimatedMinutes: config.estimatedMinutes,
  };
};

/** Lightweight dashboard preview — rebuilds the plan and returns step labels. */
export const peekDailyPlanPreview = (
  mode: SetMode,
  date: string,
  baseline?: BaselineProfile,
  excludeIds?: string[],
): { labels: string[]; estimatedMinutes: number } => {
  const plan = buildDailyWorkoutPlan(mode, {
    date,
    baselineProfile: baseline,
    excludeIds,
  });
  return {
    labels: plan.steps.map((s) => s.label),
    estimatedMinutes: plan.estimatedMinutes,
  };
};
