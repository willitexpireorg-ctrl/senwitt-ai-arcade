import { IRTAdaptiveEngine } from './irtAdaptiveEngine';

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;

const TIER_LABELS: Record<DifficultyTier, string> = {
  1: 'Warm-up',
  2: 'Steady',
  3: 'Challenging',
  4: 'Sharp',
  5: 'Peak',
};

const SKILL_LEVEL_LABELS = [
  'Getting started',
  'Building pace',
  'Finding flow',
  'Solid footing',
  'Working hard',
  'Sharp edge',
  'High gear',
  'Elite reps',
  'Mastery track',
  'Peak form',
] as const;

/** Map latent ability (theta) to a 1–5 difficulty tier via the IRT engine. */
export function tierFromTheta(theta: number): DifficultyTier {
  return IRTAdaptiveEngine.getRecommendedDifficultyTier(theta);
}

export function tierLabel(tier: DifficultyTier | number): string {
  const t = Math.min(5, Math.max(1, Math.round(tier))) as DifficultyTier;
  return TIER_LABELS[t];
}

export function skillLevelLabel(level: number): string {
  const idx = Math.min(SKILL_LEVEL_LABELS.length - 1, Math.max(0, Math.floor(level) - 1));
  return SKILL_LEVEL_LABELS[idx] ?? SKILL_LEVEL_LABELS[0];
}

export interface SessionDifficultyFeel {
  tierBefore: DifficultyTier;
  tierAfter: DifficultyTier;
  message: string;
}

/**
 * Short, honest copy about how today's set felt relative to ability before/after.
 * No IQ claims — just intensity / flow language.
 */
export function describeSessionDifficulty(
  beforeTheta: number,
  afterTheta: number,
  avgItemDifficulty?: number,
): SessionDifficultyFeel {
  const tierBefore = tierFromTheta(beforeTheta);
  const tierAfter = tierFromTheta(afterTheta);
  const delta = afterTheta - beforeTheta;
  const tierDelta = tierAfter - tierBefore;

  let message: string;
  if (tierDelta > 0 || delta > 0.15) {
    message =
      tierAfter >= 4
        ? `Today's set leaned harder — you held pace at ${tierLabel(tierAfter)}`
        : `Pushed up toward ${tierLabel(tierAfter)} — solid work`;
  } else if (tierDelta < 0 || delta < -0.15) {
    message = `Eased slightly to keep you in flow · ${tierLabel(tierAfter)}`;
  } else if (avgItemDifficulty !== undefined && avgItemDifficulty >= 4) {
    message = `Today's set leaned harder — you held pace`;
  } else if (avgItemDifficulty !== undefined && avgItemDifficulty <= 2) {
    message = `Kept it light at ${tierLabel(tierAfter)} — good warm-up`;
  } else {
    message = `Held steady at ${tierLabel(tierAfter)}`;
  }

  return { tierBefore, tierAfter, message };
}

/** One-line Analytics copy — difficulty adapts from recent accuracy, not IQ. */
export function trainingIntensityBlurb(tier: DifficultyTier): string {
  return `You're in the ${tierLabel(tier)} band (Intensity ${tier}/5). Difficulty adjusts from recent accuracy so sets stay in a workable flow — not a measure of intelligence.`;
}
