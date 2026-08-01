import React from 'react';
import { X } from 'lucide-react';
import type { WorkoutStep } from '../services/dailyWorkoutPlan';

interface WorkoutProgressBarProps {
  steps: WorkoutStep[];
  stepIndex: number;
  title: string;
  onExit: () => void;
  /** Peak-end cue on the final step */
  isFinalStep: boolean;
  /** Subtle adaptive intensity 1–5 */
  intensityTier?: number | null;
}

/**
 * Honest UI psychology chrome for mixed workouts:
 * Zeigarnik/goal-gradient step rail, endowed-progress bar, chunked current step,
 * recognition chips (not cryptic ids), Fitts-friendly secondary Exit.
 */
export const WorkoutProgressBar: React.FC<WorkoutProgressBarProps> = ({
  steps,
  stepIndex,
  title,
  onExit,
  isFinalStep,
  intensityTier = null,
}) => {
  const total = Math.max(1, steps.length);
  const current = steps[stepIndex];
  // Endowed progress: ~12% "Ready" fill so starting already feels underway.
  const endowed = 0.12;
  const remaining = 1 - endowed;
  const completedFrac = stepIndex / total;
  const fillPct = Math.min(100, Math.round((endowed + completedFrac * remaining) * 100));

  const whatToDo =
    current?.kind === 'quiz'
      ? 'Answer one short question — pick the best option.'
      : 'Play a short interactive drill — follow the on-screen prompts.';

  return (
    <header
      className="w-full border-b"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="page-shell py-3 sm:py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] uppercase tracking-wider font-extrabold mb-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {title}
              {intensityTier != null && intensityTier >= 1 && intensityTier <= 5 && (
                <span style={{ color: 'var(--accent-teal)', marginLeft: 8 }}>
                  · Intensity {intensityTier}/5
                </span>
              )}
            </p>
            <h1
              className="text-base sm:text-lg font-extrabold truncate"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
            >
              {isFinalStep
                ? 'Last step — finish strong'
                : `Step ${stepIndex + 1} of ${total}`}
            </h1>
            {current && (
              <p
                className="text-sm font-semibold mt-0.5 truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {current.label}
                <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                  {' · '}
                  {whatToDo}
                </span>
              </p>
            )}
          </div>

          {/* Fitts: Exit is secondary — primary actions live inside each drill */}
          <button
            type="button"
            onClick={onExit}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border-color)',
            }}
            aria-label="Exit workout"
          >
            <X className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>

        {/* Endowed progress track */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[10px] uppercase tracking-wider font-extrabold"
              style={{ color: 'var(--accent-teal)' }}
            >
              Workout underway
            </span>
            <span
              className="text-[10px] font-bold"
              style={{ color: 'var(--text-muted)' }}
            >
              {fillPct}%
            </span>
          </div>
          <div
            className="h-2.5 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(15, 39, 68, 0.08)' }}
            role="progressbar"
            aria-valuenow={fillPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Workout progress"
          >
            <div
              className="h-full rounded-full progress-fill transition-all duration-500 ease-out"
              style={{
                width: `${fillPct}%`,
                background: 'linear-gradient(90deg, #0f766e 0%, #14b8a6 55%, #ff5c3a 100%)',
              }}
            />
          </div>
        </div>

        {/* Recognition chips — completed / current / upcoming */}
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Workout steps">
          {steps.map((step, i) => {
            const state =
              i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'upcoming';
            const bg =
              state === 'done'
                ? '#ccfbf1'
                : state === 'current'
                  ? '#fff1ed'
                  : 'var(--bg-surface-soft)';
            const ink =
              state === 'done'
                ? 'var(--accent-teal)'
                : state === 'current'
                  ? 'var(--accent-coral)'
                  : 'var(--text-muted)';
            const border =
              state === 'done'
                ? '#99f6e4'
                : state === 'current'
                  ? '#fed7aa'
                  : 'var(--border-color)';

            return (
              <span
                key={step.id}
                role="listitem"
                className={`inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold transition-transform duration-200 ${state === 'current' ? 'animate-breathe' : ''}`}
                style={{
                  background: bg,
                  color: ink,
                  border: `1px solid ${border}`,
                  opacity: state === 'upcoming' ? 0.72 : 1,
                }}
              >
                {step.label}
              </span>
            );
          })}
        </div>
      </div>
    </header>
  );
};
