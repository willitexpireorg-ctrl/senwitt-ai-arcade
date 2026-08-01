import React, { useEffect, useMemo, useState } from 'react';
import {
  Play, Coffee, Calendar, Flame, TrendingUp, Sparkles, Gauge, Zap, CheckCircle2, ChevronDown, ChevronUp, Anchor, Bell,
} from 'lucide-react';
import type { UserProgress, SessionResult, SetMode, SkillCategory } from '../types';
import type { HabitPreferencesPartial, ActiveWorkoutState } from '../services/storage';
import { WittCompanion } from './WittCompanion';
import { DailyReminderBanner } from './DailyReminderBanner';
import { computeMomentum } from '../services/sessionInsights';
import { getLocalDateString, hasTrainedToday } from '../services/storage';
import { peekDailyPlanPreview } from '../services/dailyWorkoutPlan';
import { playClickSound } from '../services/sound';
import { requestReminderPermission, postReminderScheduleToSw } from '../services/reminderScheduler';

const ANCHOR_OPTIONS = ['morning coffee', 'after lunch', 'end of workday', 'evening wind-down'] as const;

interface DashboardProps {
  progress: UserProgress;
  sessionHistory: SessionResult[];
  onStartSet: (mode: SetMode) => void;
  onSelectSkill: (skill: SkillCategory) => void;
  activeWorkout?: ActiveWorkoutState | null;
  onContinueWorkout?: () => void;
  onDiscardWorkout?: () => void;
  onSaveHabitPrefs?: (partial: HabitPreferencesPartial) => void;
  onOpenGames?: () => void;
  /** Current adaptive difficulty tier label (e.g. Challenging) */
  difficultyTierLabel?: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  sessionHistory,
  onStartSet,
  onSelectSkill,
  activeWorkout = null,
  onContinueWorkout,
  onDiscardWorkout,
  onSaveHabitPrefs,
  onOpenGames,
  difficultyTierLabel = null,
}) => {
  const xpPercent = Math.min(100, ((progress.sharpnessScore - 300) / 700) * 100);
  const ringSize = 112;
  const stroke = 10;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference - (xpPercent / 100) * circumference;

  const today = getLocalDateString();
  const tomorrow = useMemo(() => {
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  }, [today]);

  const momentum = useMemo(() => computeMomentum(sessionHistory, today), [sessionHistory, today]);
  const trainedToday = hasTrainedToday(progress, today);
  const minutesGoal = progress.dailyMinutesGoal === 2 || progress.dailyMinutesGoal === 10
    ? progress.dailyMinutesGoal
    : 5;

  const excludeIds = useMemo(() => {
    const ids: string[] = [];
    for (const session of sessionHistory) {
      for (const att of session.attempts) {
        ids.push(att.itemId);
        if (ids.length >= 80) return ids;
      }
    }
    return ids;
  }, [sessionHistory]);

  const dailyPreview = useMemo(
    () => peekDailyPlanPreview('daily', today, progress.baselineProfile, excludeIds),
    [today, progress.baselineProfile, excludeIds],
  );

  const tomorrowPreview = useMemo(
    () => peekDailyPlanPreview('daily', tomorrow, progress.baselineProfile, excludeIds),
    [tomorrow, progress.baselineProfile, excludeIds],
  );

  const daysSinceLastSession = useMemo(() => {
    if (!progress.lastSessionDate) return null;
    const last = new Date(progress.lastSessionDate + 'T12:00:00');
    const now = new Date(today + 'T12:00:00');
    return Math.round((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
  }, [progress.lastSessionDate, today]);

  const showComeback = daysSinceLastSession !== null && daysSinceLastSession > 2;

  const canContinue =
    Boolean(activeWorkout) &&
    activeWorkout!.stepIndex < activeWorkout!.plan.steps.length &&
    activeWorkout!.plan.date === today;

  const continueStep = canContinue ? activeWorkout!.plan.steps[activeWorkout!.stepIndex] : null;
  const doneForToday = trainedToday && !canContinue;

  const [moreOpen, setMoreOpen] = useState(doneForToday);
  const [habitOpen, setHabitOpen] = useState(false);
  const [habitAnchorDraft, setHabitAnchorDraft] = useState(progress.habitAnchor ?? '');
  const [reminderTimeDraft, setReminderTimeDraft] = useState(progress.reminderTime ?? '09:00');
  const [reminderOnDraft, setReminderOnDraft] = useState(Boolean(progress.reminderEnabled));

  // Keep "More options" expanded when done-for-today flips on.
  useEffect(() => {
    if (doneForToday) setMoreOpen(true);
  }, [doneForToday]);

  const handleStartOver = () => {
    onDiscardWorkout?.();
    onStartSet('daily');
  };

  const habitSubcopy = progress.habitAnchor
    ? doneForToday
      ? `After ${progress.habitAnchor} — you're done for today`
      : `After ${progress.habitAnchor} — today's set is ready`
    : null;

  const saveHabitCues = async () => {
    if (!onSaveHabitPrefs) return;
    playClickSound();
    if (reminderOnDraft) {
      await requestReminderPermission();
      void postReminderScheduleToSw(reminderTimeDraft, true);
    } else {
      void postReminderScheduleToSw(reminderTimeDraft, false);
    }
    onSaveHabitPrefs({
      habitAnchor: habitAnchorDraft.trim() || null,
      reminderEnabled: reminderOnDraft,
      reminderTime: reminderOnDraft ? reminderTimeDraft : null,
    });
    setHabitOpen(false);
  };

  return (
    <div className="animate-tabSlideIn">
      <section className="hero-plane hero-plane--compact">
        <div className="hero-center">
          <p className="hero-brand animate-fadeInUp">SENWITT</p>
          <h1 className="hero-headline animate-fadeInUp" style={{ animationDelay: '60ms' }}>
            Train your mind in five minutes
          </h1>
          <p className="hero-sub animate-fadeInUp" style={{ animationDelay: '120ms' }}>
            {habitSubcopy ?? 'Daily workouts for writing, logic, code, and memory.'}
          </p>
        </div>
      </section>

      <div className="page-shell relative z-10" style={{ marginTop: '-4.5rem', paddingBottom: '2.5rem' }}>
        {onSaveHabitPrefs && (
          <DailyReminderBanner
            progress={progress}
            trainedToday={trainedToday}
            onStart={() => onStartSet('daily')}
            onMarkShown={() =>
              onSaveHabitPrefs({ reminderLastShownDate: today })
            }
          />
        )}

        <div className="training-card animate-fadeInUp" style={{ animationDelay: '160ms' }}>
          <div className="training-card__ring" aria-hidden>
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(15, 39, 68, 0.08)"
                strokeWidth={stroke}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="url(#dashRing)"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <defs>
                <linearGradient id="dashRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f766e" />
                  <stop offset="100%" stopColor="#ff5c3a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="training-card__ring-label">
              <span className="training-card__score">{progress.sharpnessScore}</span>
              <span className="training-card__score-cap">Sharpness</span>
            </div>
          </div>

          <div className="training-card__body">
            {doneForToday ? (
              <>
                <div className="training-card__eyebrow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Done for today
                </div>
                <h2 className="training-card__title">You&apos;re done for today</h2>
                <p className="training-card__desc">
                  Streak at {progress.streakDays} day{progress.streakDays === 1 ? '' : 's'} · Momentum{' '}
                  {momentum.daysThisWeek}/{momentum.target} this week. Nice work.
                </p>
                <p
                  className="text-xs font-extrabold uppercase tracking-wider mt-3 mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Tomorrow&apos;s peek · {tomorrow}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-1" aria-label="Tomorrow's workout steps">
                  {tomorrowPreview.labels.map((label, i) => (
                    <span
                      key={`${label}-${i}`}
                      className="inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold"
                      style={{
                        background: 'var(--bg-surface-soft)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="training-card__meta">
                  <span><Flame className="w-3.5 h-3.5" style={{ color: 'var(--accent-coral)' }} /> {progress.streakDays}-day streak</span>
                  <span><Gauge className="w-3.5 h-3.5" style={{ color: 'var(--accent-teal)' }} /> Momentum {momentum.daysThisWeek}/{momentum.target}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onStartSet('coffee_break')}
                  className="btn-3d btn-3d-amber training-card__cta"
                >
                  <Play className="w-5 h-5" style={{ fill: 'white' }} />
                  <span>Bonus round</span>
                </button>
                <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => onStartSet('coffee_break')}
                    className="text-xs font-bold underline-offset-2 hover:underline"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Coffee Break
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
                  <button
                    type="button"
                    onClick={() => onOpenGames?.()}
                    className="text-xs font-bold underline-offset-2 hover:underline"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Games
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="training-card__eyebrow">
                  <Sparkles className="w-3.5 h-3.5" />
                  Today&apos;s workout
                </div>
                <h2 className="training-card__title">Daily Brain Set</h2>
                <p className="training-card__desc">
                  A mixed ~{dailyPreview.estimatedMinutes}-minute session — short quizzes plus interactive drills.
                </p>
                {difficultyTierLabel && (
                  <span
                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-extrabold mt-2"
                    style={{
                      background: '#ccfbf1',
                      color: 'var(--accent-teal)',
                      border: '1px solid #99f6e4',
                    }}
                  >
                    Difficulty · {difficultyTierLabel}
                  </span>
                )}

                <div
                  className="flex flex-wrap gap-1.5 mt-3 mb-1"
                  aria-label="Today's workout steps"
                >
                  {dailyPreview.labels.map((label, i) => (
                    <span
                      key={`${label}-${i}`}
                      className="inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold"
                      style={{
                        background: 'var(--bg-surface-soft)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="training-card__meta">
                  <span><Flame className="w-3.5 h-3.5" style={{ color: 'var(--accent-coral)' }} /> {progress.streakDays}-day streak</span>
                  <span><TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent-teal)' }} /> {progress.sharpnessScore}/1000</span>
                  <span><Gauge className="w-3.5 h-3.5" style={{ color: 'var(--accent-teal)' }} /> Momentum {momentum.daysThisWeek}/{momentum.target} this week</span>
                </div>

                {canContinue && continueStep ? (
                  <div className="flex flex-col items-stretch sm:items-start gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => onContinueWorkout?.()}
                      className="btn-3d btn-3d-coral animate-cta-pulse training-card__cta"
                    >
                      <Play className="w-5 h-5" style={{ fill: 'white' }} />
                      <span>Continue workout</span>
                    </button>
                    <p
                      className="text-xs font-semibold text-center sm:text-left"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Step {activeWorkout!.stepIndex + 1} of {activeWorkout!.plan.steps.length}
                      {' · '}
                      {continueStep.label}
                    </p>
                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="text-xs font-bold underline-offset-2 hover:underline self-center sm:self-start"
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Start over
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartSet('daily')}
                    className="btn-3d btn-3d-coral animate-cta-pulse training-card__cta"
                  >
                    <Play className="w-5 h-5" style={{ fill: 'white' }} />
                    <span>Start today&apos;s ~{minutesGoal}-min workout</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 stagger-children w-full mt-6">
          {[
            { label: 'Streak', value: `${progress.streakDays}`, unit: 'days', icon: Flame, tint: '#fff1ed', ink: 'var(--accent-coral)' },
            { label: 'Sharpness', value: `${progress.sharpnessScore}`, unit: 'pts', icon: TrendingUp, tint: '#ccfbf1', ink: 'var(--accent-teal)' },
            { label: 'Sessions', value: `${progress.totalSessions}`, unit: 'done', icon: Calendar, tint: '#e0f2fe', ink: '#0284c7' },
          ].map(({ label, value, unit, icon: Icon, tint, ink }) => (
            <div key={label} className="stat-pill animate-fadeInUp">
              <div className="stat-pill__icon" style={{ background: tint, color: ink }}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="stat-pill__value">{value}</p>
              <p className="stat-pill__label">{label}</p>
              <p className="stat-pill__unit">{unit}</p>
            </div>
          ))}
        </div>

        {showComeback && !doneForToday && (
          <div
            className="surface p-5 sm:p-6 mt-6 flex flex-col sm:flex-row items-center gap-4 animate-fadeInUp"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#ffedd5', color: '#c2410c' }}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>2-minute comeback</h3>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                It&apos;s been a few days — no big deal. One quick round gets momentum going again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartSet('coffee_break')}
              className="btn-3d btn-3d-amber py-3 px-5 text-sm flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
            >
              <Play className="w-4 h-4" style={{ fill: 'white' }} />
              <span>Start comeback</span>
            </button>
          </div>
        )}

        <div className="mt-10">
          {!moreOpen ? (
            <button
              type="button"
              onClick={() => { playClickSound(); setMoreOpen(true); }}
              className="w-full surface-soft py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-extrabold"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            >
              <span>More options</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-kicker" style={{ marginBottom: 0 }}>
                  {doneForToday ? 'Bonus ways to train' : 'More ways to train'}
                </h2>
                {!doneForToday && (
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    className="text-xs font-bold inline-flex items-center gap-1"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Hide <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 stagger-children w-full">
                <article className="game-tile animate-fadeInUp">
                  <div className="tile-art tile-art--amber">
                    <Coffee className="w-8 h-8" />
                  </div>
                  <div className="tile-body justify-between gap-5">
                    <div>
                      <h3 className="tile-title">Coffee Break</h3>
                      <p className="tile-desc">
                        A ~2-minute mix — one quiz and one interactive drill when you only have a moment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartSet('coffee_break')}
                      className="btn-3d btn-3d-amber w-full py-3.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Play className="w-4 h-4" style={{ fill: 'white' }} />
                      <span>Launch · ~2 min</span>
                    </button>
                  </div>
                </article>

                <article className="game-tile animate-fadeInUp">
                  <div className="tile-art tile-art--teal">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="tile-body justify-between gap-5">
                    <div>
                      <h3 className="tile-title">Weekend Deep Set</h3>
                      <p className="tile-desc">
                        Six mixed steps — quizzes plus drills across memory, writing, numbers, and reasoning.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartSet('weekend_long')}
                      className="btn-3d btn-3d-teal w-full py-3.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <Play className="w-4 h-4" style={{ fill: 'white' }} />
                      <span>Launch · ~10 min</span>
                    </button>
                  </div>
                </article>
              </div>
            </>
          )}
        </div>

        <div className="mt-8">
          <WittCompanion
            progress={progress}
            onSelectSkill={onSelectSkill}
            momentum={momentum}
            onStartDaily={() => {
              if (canContinue) onContinueWorkout?.();
              else if (trainedToday) onStartSet('coffee_break');
              else onStartSet('daily');
            }}
            trainedToday={trainedToday}
            canContinue={canContinue}
          />
        </div>

        {onSaveHabitPrefs && (
          <div className="mt-6 surface p-4">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setHabitOpen((o) => !o);
                setHabitAnchorDraft(progress.habitAnchor ?? '');
                setReminderTimeDraft(progress.reminderTime ?? '09:00');
                setReminderOnDraft(Boolean(progress.reminderEnabled));
              }}
              className="w-full flex items-center justify-between gap-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                <Anchor className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} />
                Habit cues
              </span>
              {habitOpen ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </button>
            {habitOpen && (
              <div className="mt-4 text-left">
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                  After I… I train
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ANCHOR_OPTIONS.map((opt) => {
                    const selected = habitAnchorDraft === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHabitAnchorDraft(opt)}
                        className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                        style={{
                          background: selected ? '#ccfbf1' : 'var(--bg-surface-soft)',
                          color: selected ? 'var(--accent-teal)' : 'var(--text-secondary)',
                          border: selected ? '2px solid #0f766e' : '1px solid var(--border-color)',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2 text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={reminderOnDraft}
                    onChange={(e) => setReminderOnDraft(e.target.checked)}
                  />
                  <Bell className="w-3.5 h-3.5" />
                  Daily reminder
                </label>
                {reminderOnDraft && (
                  <input
                    type="time"
                    value={reminderTimeDraft}
                    onChange={(e) => setReminderTimeDraft(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm mb-3 block"
                    style={{ border: '1px solid var(--border-color)', background: 'white' }}
                  />
                )}
                <button
                  type="button"
                  onClick={saveHabitCues}
                  className="btn-3d btn-3d-teal text-xs px-4 py-2.5"
                >
                  Save habit cues
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
