import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Sparkles, GitCompare, CheckCircle2, XCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface SpeedMatchResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface SpeedMatchDrillProps {
  onComplete: (result: SpeedMatchResult) => void;
  onCancel: () => void;
}

type ShapeKind = 'circle' | 'square' | 'triangle';
type ColorKind = 'teal' | 'rose' | 'amber';

interface Stimulus {
  shape: ShapeKind;
  color: ColorKind;
}

const TRIAL_COUNT = 28;
const BASE_WINDOW_MS = 1200;
const MIN_WINDOW_MS = 700;
const STREAK_FOR_SPEEDUP = 3;
const SPEEDUP_STEP_MS = 80;
const FEEDBACK_MS = 280;
const POINTS_CORRECT = 12;
const PENALTY_WRONG = 4;

const COLORS: Record<ColorKind, string> = {
  teal: '#0f766e',
  rose: '#be123c',
  amber: '#b45309',
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

const pickStimulus = (avoid?: Stimulus): Stimulus => {
  let next: Stimulus = {
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
  };
  let guard = 0;
  while (
    avoid &&
    next.shape === avoid.shape &&
    next.color === avoid.color &&
    guard < 12
  ) {
    next = {
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
    };
    guard += 1;
  }
  return next;
};

const buildSequence = (count: number): Stimulus[] => {
  const list: Stimulus[] = [pickStimulus()];
  for (let i = 1; i < count; i++) {
    // ~45% same as previous for balanced Same/Different
    if (Math.random() < 0.45) {
      list.push({ ...list[i - 1] });
    } else {
      list.push(pickStimulus(list[i - 1]));
    }
  }
  return list;
};

const ShapeGlyph: React.FC<{ stimulus: Stimulus; size?: number }> = ({ stimulus, size = 96 }) => {
  const fill = COLORS[stimulus.color];
  if (stimulus.shape === 'circle') {
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
  if (stimulus.shape === 'square') {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: 16,
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
        borderLeft: `${size * 0.52}px solid transparent`,
        borderRight: `${size * 0.52}px solid transparent`,
        borderBottom: `${size}px solid ${fill}`,
        filter: 'drop-shadow(0 4px 0 rgba(15, 23, 42, 0.08))',
      }}
    />
  );
};

type Phase = 'ready' | 'respond' | 'feedback' | 'done';

export const SpeedMatchDrill: React.FC<SpeedMatchDrillProps> = ({ onComplete, onCancel }) => {
  const sequence = useMemo(() => buildSequence(TRIAL_COUNT), []);
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [windowMs, setWindowMs] = useState(BASE_WINDOW_MS);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'miss' | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(BASE_WINDOW_MS / 1000));

  const drillStartRef = useRef(Date.now());
  const answeredRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const windowRef = useRef(BASE_WINDOW_MS);
  const streakRef = useRef(0);
  const activeRef = useRef(true);
  const advanceTimerRef = useRef<number | null>(null);

  const current = sequence[trialIndex];
  const previous = trialIndex > 0 ? sequence[trialIndex - 1] : null;
  const isMatch = Boolean(
    previous && previous.shape === current.shape && previous.color === current.color,
  );
  const canRespond = trialIndex > 0 && phase === 'respond';

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

  const finishDrill = useCallback(() => {
    if (!activeRef.current) return;
    setPhase('done');
    safeSound(playFanfareSound);
    onComplete({
      scoreEarned: Math.max(0, scoreRef.current),
      correctCount: correctRef.current,
      totalItems: TRIAL_COUNT - 1,
      totalTimeMs: Date.now() - drillStartRef.current,
    });
  }, [onComplete]);

  const advance = useCallback(
    (fromIndex: number) => {
      if (!activeRef.current) return;
      if (fromIndex + 1 >= TRIAL_COUNT) {
        finishDrill();
        return;
      }
      setFeedback(null);
      setTrialIndex(fromIndex + 1);
      setPhase(fromIndex + 1 === 0 ? 'ready' : 'respond');
      answeredRef.current = false;
      setSecondsLeft(Math.ceil(windowRef.current / 1000));
    },
    [finishDrill],
  );

  const applyOutcome = useCallback(
    (outcome: 'correct' | 'wrong' | 'miss', fromIndex: number) => {
      if (!activeRef.current || answeredRef.current) return;
      answeredRef.current = true;
      setPhase('feedback');
      setFeedback(outcome);

      if (outcome === 'correct') {
        safeSound(playCorrectSound);
        const nextScore = scoreRef.current + POINTS_CORRECT;
        scoreRef.current = nextScore;
        setScore(nextScore);
        correctRef.current += 1;
        setCorrectCount(correctRef.current);
        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);
        if (nextStreak > 0 && nextStreak % STREAK_FOR_SPEEDUP === 0) {
          const faster = Math.max(MIN_WINDOW_MS, windowRef.current - SPEEDUP_STEP_MS);
          windowRef.current = faster;
          setWindowMs(faster);
        }
      } else {
        safeSound(playIncorrectSound);
        const nextScore = Math.max(0, scoreRef.current - PENALTY_WRONG);
        scoreRef.current = nextScore;
        setScore(nextScore);
        streakRef.current = 0;
        setStreak(0);
      }

      if (advanceTimerRef.current != null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        advance(fromIndex);
      }, FEEDBACK_MS);
    },
    [advance],
  );

  // First stimulus: brief preview then auto-advance
  useEffect(() => {
    if (trialIndex !== 0) return;
    answeredRef.current = true;
    const t = window.setTimeout(() => {
      answeredRef.current = false;
      setTrialIndex(1);
      setPhase('respond');
      setSecondsLeft(Math.ceil(windowRef.current / 1000));
    }, 900);
    return () => clearTimeout(t);
  }, [trialIndex]);

  // Response window countdown / timeout
  useEffect(() => {
    if (phase !== 'respond' || trialIndex === 0) return;
    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = Math.max(0, windowRef.current - (Date.now() - started));
      setSecondsLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(tick);
        applyOutcome('miss', trialIndex);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [phase, trialIndex, applyOutcome]);

  const handleAnswer = useCallback(
    (saySame: boolean) => {
      if (!canRespond) return;
      safeSound(playClickSound);
      const correct = saySame === isMatch;
      applyOutcome(correct ? 'correct' : 'wrong', trialIndex);
    },
    [applyOutcome, canRespond, isMatch, trialIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canRespond) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleAnswer(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canRespond, handleAnswer]);

  const progressLabel =
    trialIndex === 0 ? 'Preview' : `Trial ${trialIndex} of ${TRIAL_COUNT - 1}`;

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
            {progressLabel}
          </div>
          {phase === 'respond' && (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{
                background: secondsLeft <= 1 ? '#fff1f2' : '#fff7ed',
                border: `1px solid ${secondsLeft <= 1 ? '#fecdd3' : '#fed7aa'}`,
                color: secondsLeft <= 1 ? '#9f1239' : '#c2410c',
              }}
            >
              <Clock className="w-4 h-4" />
              <span>{Math.max(1, secondsLeft)}s · {windowMs}ms</span>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts · {correctCount} hit{correctCount === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="speed_match" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#ffe4e6', border: '1px solid #fecdd3', color: '#be123c' }}
        >
          <GitCompare className="w-4 h-4" />
          Speed Match
        </div>

        <p className="text-sm md:text-base mb-6 max-w-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {trialIndex === 0
            ? 'Memorize this symbol — then say whether each new one matches the previous.'
            : 'Is this the same as the previous symbol, or different?'}
        </p>

        <div
          className="w-full max-w-sm rounded-2xl p-10 mb-6 flex items-center justify-center min-h-[180px]"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          <ShapeGlyph stimulus={current} />
        </div>

        {feedback && (
          <div
            className="flex items-center gap-2 mb-4 text-sm font-extrabold animate-fadeIn"
            style={{ color: feedback === 'correct' ? '#065f46' : '#9f1239' }}
          >
            {feedback === 'correct' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {feedback === 'correct' ? 'Match!' : feedback === 'miss' ? 'Too slow' : 'Miss'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          <button
            type="button"
            disabled={!canRespond}
            onClick={() => handleAnswer(true)}
            className="btn-3d btn-3d-teal py-4 text-base min-h-[48px] disabled:opacity-40"
          >
            Same
            <span className="block text-[10px] font-bold opacity-80 mt-0.5">← / S</span>
          </button>
          <button
            type="button"
            disabled={!canRespond}
            onClick={() => handleAnswer(false)}
            className="btn-3d btn-3d-rose py-4 text-base min-h-[48px] disabled:opacity-40"
          >
            Different
            <span className="block text-[10px] font-bold opacity-80 mt-0.5">→ / D</span>
          </button>
        </div>

        {streak >= STREAK_FOR_SPEEDUP && phase === 'respond' && (
          <p className="mt-4 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            Pace speeding up — streak {streak}
          </p>
        )}
      </div>
    </div>
  );
};
