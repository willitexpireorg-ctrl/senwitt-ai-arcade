import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Shuffle, CheckCircle2, XCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface PatternShiftResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface PatternShiftDrillProps {
  onComplete: (result: PatternShiftResult) => void;
  onCancel: () => void;
}

type ShapeKind = 'circle' | 'square' | 'triangle';
type ColorKind = 'teal' | 'rose' | 'amber';
type RuleKind = 'color' | 'shape';

interface CardStimulus {
  shape: ShapeKind;
  color: ColorKind;
}

interface Trial {
  card: CardStimulus;
  rule: RuleKind;
  ruleChanged: boolean;
}

const TRIAL_COUNT = 22;
const SWITCH_AT = [7, 14, 19];
const FEEDBACK_MS = 420;
const POINTS_CORRECT = 14;
const PENALTY_WRONG = 5;

const COLORS: Record<ColorKind, { hex: string; label: string }> = {
  teal: { hex: '#0f766e', label: 'Teal' },
  rose: { hex: '#be123c', label: 'Rose' },
  amber: { hex: '#b45309', label: 'Amber' },
};

const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle'];
const COLOR_KEYS: ColorKind[] = ['teal', 'rose', 'amber'];

const safeSound = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* audio optional */
  }
};

const randomCard = (): CardStimulus => ({
  shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
});

const buildTrials = (): Trial[] => {
  let rule: RuleKind = Math.random() < 0.5 ? 'color' : 'shape';
  const switchSet = new Set(SWITCH_AT);
  const trials: Trial[] = [];
  for (let i = 0; i < TRIAL_COUNT; i++) {
    const ruleChanged = switchSet.has(i);
    if (ruleChanged) {
      rule = rule === 'color' ? 'shape' : 'color';
    }
    trials.push({ card: randomCard(), rule, ruleChanged });
  }
  return trials;
};

const ShapeGlyph: React.FC<{ card: CardStimulus; size?: number }> = ({ card, size = 88 }) => {
  const fill = COLORS[card.color].hex;
  if (card.shape === 'circle') {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: fill,
          boxShadow: '0 6px 0 rgba(15, 23, 42, 0.08)',
        }}
      />
    );
  }
  if (card.shape === 'square') {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          background: fill,
          boxShadow: '0 6px 0 rgba(15, 23, 42, 0.08)',
        }}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size * 0.5}px solid transparent`,
        borderRight: `${size * 0.5}px solid transparent`,
        borderBottom: `${size}px solid ${fill}`,
        filter: 'drop-shadow(0 4px 0 rgba(15, 23, 42, 0.08))',
      }}
    />
  );
};

/** Two buckets: for color rule → Teal vs Not-teal (or pick the card's color vs other).
 * Simpler: always offer two classification options matching the active rule.
 * Color rule: pick the color of the card among two colors (correct + lure).
 * Shape rule: pick the shape among two shapes (correct + lure).
 */
interface BucketOption {
  id: string;
  label: string;
  matches: boolean;
  preview: CardStimulus;
}

const makeBuckets = (trial: Trial): BucketOption[] => {
  const { card, rule } = trial;
  if (rule === 'color') {
    const lureColor = COLOR_KEYS.filter((c) => c !== card.color)[Math.floor(Math.random() * 2)];
    const correct: BucketOption = {
      id: `color-${card.color}`,
      label: COLORS[card.color].label,
      matches: true,
      preview: { shape: 'circle', color: card.color },
    };
    const lure: BucketOption = {
      id: `color-${lureColor}`,
      label: COLORS[lureColor].label,
      matches: false,
      preview: { shape: 'circle', color: lureColor },
    };
    return Math.random() < 0.5 ? [correct, lure] : [lure, correct];
  }
  const lureShape = SHAPES.filter((s) => s !== card.shape)[Math.floor(Math.random() * 2)];
  const correct: BucketOption = {
    id: `shape-${card.shape}`,
    label: card.shape.charAt(0).toUpperCase() + card.shape.slice(1),
    matches: true,
    preview: { shape: card.shape, color: 'teal' },
  };
  const lure: BucketOption = {
    id: `shape-${lureShape}`,
    label: lureShape.charAt(0).toUpperCase() + lureShape.slice(1),
    matches: false,
    preview: { shape: lureShape, color: 'teal' },
  };
  return Math.random() < 0.5 ? [correct, lure] : [lure, correct];
};

export const PatternShiftDrill: React.FC<PatternShiftDrillProps> = ({ onComplete, onCancel }) => {
  const trials = useMemo(() => buildTrials(), []);
  const [trialIndex, setTrialIndex] = useState(0);
  const [buckets, setBuckets] = useState<BucketOption[]>(() => makeBuckets(trials[0]));
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showRuleBanner, setShowRuleBanner] = useState(true);
  const [locked, setLocked] = useState(false);

  const drillStartRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const activeRef = useRef(true);
  const advanceTimerRef = useRef<number | null>(null);

  const trial = trials[trialIndex];
  const answersBlocked = locked || Boolean(feedback) || showRuleBanner;

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (trial.ruleChanged || trialIndex === 0) {
      setShowRuleBanner(true);
      const t = window.setTimeout(() => setShowRuleBanner(false), 1400);
      return () => clearTimeout(t);
    }
    setShowRuleBanner(false);
    return undefined;
  }, [trialIndex, trial.ruleChanged]);

  const finishDrill = useCallback(() => {
    if (!activeRef.current) return;
    safeSound(playFanfareSound);
    onComplete({
      scoreEarned: Math.max(0, scoreRef.current),
      correctCount: correctRef.current,
      totalItems: TRIAL_COUNT,
      totalTimeMs: Date.now() - drillStartRef.current,
    });
  }, [onComplete]);

  const handlePick = (option: BucketOption) => {
    if (answersBlocked) return;
    safeSound(playClickSound);
    setLocked(true);
    const isCorrect = option.matches;
    if (isCorrect) {
      safeSound(playCorrectSound);
      setFeedback('correct');
      scoreRef.current += POINTS_CORRECT;
      setScore(scoreRef.current);
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    } else {
      safeSound(playIncorrectSound);
      setFeedback('wrong');
      scoreRef.current = Math.max(0, scoreRef.current - PENALTY_WRONG);
      setScore(scoreRef.current);
    }

    if (advanceTimerRef.current != null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      if (!activeRef.current) return;
      if (trialIndex + 1 >= TRIAL_COUNT) {
        finishDrill();
        return;
      }
      const next = trialIndex + 1;
      setTrialIndex(next);
      setBuckets(makeBuckets(trials[next]));
      setFeedback(null);
      setLocked(false);
    }, FEEDBACK_MS);
  };

  const ruleLabel = trial.rule === 'color' ? 'Sort by COLOR' : 'Sort by SHAPE';
  const ruleHint =
    trial.rule === 'color'
      ? 'Ignore the shape — tap the matching color bucket.'
      : 'Ignore the color — tap the matching shape bucket.';

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      <div className="w-full flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs"
          style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
        >
          ✕ Exit
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Trial {trialIndex + 1} of {TRIAL_COUNT}
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts · {correctCount} hit{correctCount === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="pattern_shift" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4"
          style={{ background: '#ffe4e6', border: '1px solid #fecdd3', color: '#be123c' }}
        >
          <Shuffle className="w-4 h-4" />
          Pattern Shift
        </div>

        <div
          className="w-full max-w-md rounded-2xl px-4 py-3 mb-5 transition-all"
          style={{
            background: showRuleBanner || trial.ruleChanged ? '#fff7ed' : 'var(--bg-surface-soft)',
            border: `2px solid ${showRuleBanner || trial.ruleChanged ? '#fdba74' : 'var(--border-color)'}`,
            color: showRuleBanner || trial.ruleChanged ? '#c2410c' : 'var(--text-primary)',
          }}
        >
          <p className="text-sm md:text-base font-extrabold tracking-wide uppercase">
            {trial.ruleChanged && trialIndex > 0 ? 'Rule change! ' : ''}
            {ruleLabel}
          </p>
          <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
            {ruleHint}
          </p>
        </div>

        <div
          className="w-full max-w-sm rounded-2xl p-10 mb-6 flex items-center justify-center min-h-[160px]"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          <ShapeGlyph card={trial.card} />
        </div>

        {feedback && (
          <div
            className="flex items-center gap-2 mb-4 text-sm font-extrabold animate-fadeIn"
            style={{ color: feedback === 'correct' ? '#065f46' : '#9f1239' }}
          >
            {feedback === 'correct' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {feedback === 'correct' ? 'Correct' : 'Wrong bucket'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {buckets.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={answersBlocked}
              onClick={() => handlePick(opt)}
              className="btn-3d py-4 text-base min-h-[56px] flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: '#fff',
                color: 'var(--text-primary)',
                borderBottom: '4px solid #d7e0ea',
              }}
            >
              <ShapeGlyph card={opt.preview} size={36} />
              <span className="font-extrabold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
