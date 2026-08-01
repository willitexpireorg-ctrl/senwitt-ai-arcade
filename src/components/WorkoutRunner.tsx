import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ExercisePlayer } from './ExercisePlayer';
import { WorkoutProgressBar } from './WorkoutProgressBar';
import { StroopDrill } from './StroopDrill';
import { BriefRecallDrill } from './engines/BriefRecallDrill';
import { ClearerSentenceDrill } from './engines/ClearerSentenceDrill';
import { NumberSenseDrill } from './engines/NumberSenseDrill';
import { BrevityCutDrill } from './engines/BrevityCutDrill';
import { QuickPurchaseDrill } from './engines/QuickPurchaseDrill';
import { SequenceOrderDrill } from './engines/SequenceOrderDrill';
import { RsvpReaderDrill } from './engines/RsvpReaderDrill';
import { SpeedMatchDrill } from './engines/SpeedMatchDrill';
import { SignalSweepDrill } from './engines/SignalSweepDrill';
import { PatternShiftDrill } from './engines/PatternShiftDrill';
import type { AttemptResult, SessionResult, SkillCategory } from '../types';
import type { DailyWorkoutPlan, WorkoutEngineMechanic } from '../services/dailyWorkoutPlan';
import { getLocalDateString } from '../services/storage';
import { playCorrectSound } from '../services/sound';

type EngineResult = {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
};

interface WorkoutRunnerProps {
  plan: DailyWorkoutPlan;
  initialStepIndex?: number;
  initialAttempts?: AttemptResult[];
  onComplete: (session: SessionResult) => void;
  onCancel: () => void;
  onProgress?: (state: { stepIndex: number; attempts: AttemptResult[] }) => void;
}

const engineResultToAttempts = (
  result: EngineResult,
  mechanic: WorkoutEngineMechanic,
  category: SkillCategory,
): AttemptResult[] => {
  const totalItems = Math.max(1, result.totalItems);
  const correctCount = Math.min(totalItems, Math.max(0, result.correctCount));
  const timePerAttempt = Math.max(1, Math.round(result.totalTimeMs / totalItems));
  const scoreEarned = result.scoreEarned;

  return Array.from({ length: totalItems }, (_, i) => ({
    itemId: `${mechanic}-rep-${i + 1}`,
    category,
    isCorrect: i < correctCount,
    timeSpentMs: timePerAttempt,
    scoreEarned: i < correctCount ? Math.max(10, Math.floor(scoreEarned / Math.max(1, correctCount))) : 0,
    userAnswer: i < correctCount ? 'hit' : 'miss',
    explanation: `${mechanic} workout drill`,
    timestamp: new Date().toISOString(),
  }));
};

const buildSession = (
  plan: DailyWorkoutPlan,
  attempts: AttemptResult[],
  startedAtMs: number,
): SessionResult => {
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const totalTimeSpentMs = Math.max(
    1,
    attempts.reduce((sum, a) => sum + a.timeSpentMs, 0) || Date.now() - startedAtMs,
  );
  const scoreSum = attempts.reduce((sum, a) => sum + a.scoreEarned, 0);
  return {
    id: `workout-${plan.mode}-${plan.date}-${Date.now()}`,
    mode: plan.mode,
    date: getLocalDateString(),
    totalItems: attempts.length,
    correctCount,
    totalTimeSpentMs,
    sharpnessDelta: Math.max(5, Math.floor(scoreSum / 10)),
    finalSharpness: 0,
    attempts,
  };
};

export const WorkoutRunner: React.FC<WorkoutRunnerProps> = ({
  plan,
  initialStepIndex = 0,
  initialAttempts = [],
  onComplete,
  onCancel,
  onProgress,
}) => {
  const clampedStart = Math.max(
    0,
    Math.min(initialStepIndex, Math.max(0, plan.steps.length)),
  );
  const [stepIndex, setStepIndex] = useState(clampedStart);
  const [attempts, setAttempts] = useState<AttemptResult[]>(initialAttempts);
  const [interstitial, setInterstitial] = useState<{ stepNum: number; total: number } | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;
  const stepIndexRef = useRef(stepIndex);
  stepIndexRef.current = stepIndex;
  const finalizedRef = useRef(false);
  const advancingRef = useRef(false);
  const interstitialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    return () => {
      if (interstitialTimerRef.current) clearTimeout(interstitialTimerRef.current);
    };
  }, []);

  const finalize = useCallback(
    (finalAttempts: AttemptResult[]) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      onCompleteRef.current(buildSession(plan, finalAttempts, startTimeRef.current));
    },
    [plan],
  );

  const commitAdvance = useCallback(
    (nextIndex: number, newAttempts: AttemptResult[]) => {
      onProgressRef.current?.({ stepIndex: nextIndex, attempts: newAttempts });
      setStepIndex(nextIndex);
      stepIndexRef.current = nextIndex;
      setInterstitial(null);
      advancingRef.current = false;
    },
    [],
  );

  const advance = useCallback(
    (newAttempts: AttemptResult[]) => {
      if (finalizedRef.current || advancingRef.current) return;
      const completedStepNum = stepIndexRef.current + 1;
      const nextIndex = stepIndexRef.current + 1;
      setAttempts(newAttempts);
      attemptsRef.current = newAttempts;

      if (nextIndex >= plan.steps.length) {
        // Do not persist stepIndex past the end — completion clears active workout.
        finalize(newAttempts);
        return;
      }

      // Inter-step celebration (Peak-End / Tiny Habits celebration) — not after last.
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delayMs = prefersReduced ? 200 : 900;

      advancingRef.current = true;
      playCorrectSound();
      setInterstitial({ stepNum: completedStepNum, total: plan.steps.length });

      if (interstitialTimerRef.current) clearTimeout(interstitialTimerRef.current);
      interstitialTimerRef.current = setTimeout(() => {
        commitAdvance(nextIndex, newAttempts);
      }, delayMs);
    },
    [plan.steps.length, finalize, commitAdvance],
  );

  // Empty plan or resume past the end → single SessionResult, no blank screen.
  useEffect(() => {
    if (finalizedRef.current) return;
    if (plan.steps.length === 0) {
      finalize(attemptsRef.current);
      return;
    }
    if (stepIndexRef.current >= plan.steps.length) {
      finalize(attemptsRef.current);
    }
  }, [plan.steps.length, finalize]);

  const handleQuizComplete = useCallback(
    (result: SessionResult) => {
      advance([...attemptsRef.current, ...result.attempts]);
    },
    [advance],
  );

  const handleEngineComplete = useCallback(
    (result: EngineResult, mechanic: WorkoutEngineMechanic, category: SkillCategory) => {
      const mapped = engineResultToAttempts(result, mechanic, category);
      advance([...attemptsRef.current, ...mapped]);
    },
    [advance],
  );

  const step = plan.steps[stepIndex];
  if (!step) {
    return null;
  }

  const isFinalStep = stepIndex === plan.steps.length - 1;

  const renderEngine = () => {
    if (step.kind !== 'engine') return null;
    const { mechanic, category } = step;
    const onDone = (result: EngineResult) => handleEngineComplete(result, mechanic, category);
    const skipMissing = () =>
      handleEngineComplete(
        { scoreEarned: 0, correctCount: 0, totalItems: 1, totalTimeMs: 1 },
        mechanic,
        category,
      );

    switch (mechanic) {
      case 'brevity_cut':
        return <BrevityCutDrill onComplete={onDone} onCancel={onCancel} />;
      case 'quick_purchase':
        return <QuickPurchaseDrill onComplete={onDone} onCancel={onCancel} />;
      case 'sequence_order':
        return <SequenceOrderDrill onComplete={onDone} onCancel={onCancel} />;
      case 'rsvp_reader':
        return <RsvpReaderDrill onComplete={onDone} onCancel={onCancel} />;
      case 'speed_match':
        return <SpeedMatchDrill onComplete={onDone} onCancel={onCancel} />;
      case 'signal_sweep':
        return <SignalSweepDrill onComplete={onDone} onCancel={onCancel} />;
      case 'pattern_shift':
        return <PatternShiftDrill onComplete={onDone} onCancel={onCancel} />;
      case 'brief_recall':
        return <BriefRecallDrill onComplete={onDone} onCancel={onCancel} />;
      case 'clearer_sentence':
        return <ClearerSentenceDrill onComplete={onDone} onCancel={onCancel} />;
      case 'number_sense':
        return <NumberSenseDrill onComplete={onDone} onCancel={onCancel} />;
      case 'stroop':
        return <StroopDrill onComplete={onDone} onCancel={onCancel} />;
      default:
        return (
          <div className="page-shell py-10 flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              This drill isn&apos;t available in this build.
            </p>
            <button type="button" onClick={skipMissing} className="btn-3d btn-3d-teal px-5 py-3 text-sm">
              Skip and continue
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col relative">
      <WorkoutProgressBar
        steps={plan.steps}
        stepIndex={stepIndex}
        title={plan.title}
        onExit={onCancel}
        isFinalStep={isFinalStep}
      />

      <div className="flex-1" key={step.id}>
        {step.kind === 'quiz' ? (
          <ExercisePlayer
            items={[step.item]}
            setMode={plan.mode}
            onComplete={handleQuizComplete}
            onCancel={onCancel}
          />
        ) : (
          renderEngine()
        )}
      </div>

      {interstitial && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <div
            className="surface px-8 py-7 text-center animate-fadeIn"
            style={{ maxWidth: '16rem' }}
          >
            <CheckCircle2
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: 'var(--accent-teal)' }}
            />
            <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Step {interstitial.stepNum} of {interstitial.total} — nice
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
