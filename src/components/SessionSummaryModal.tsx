import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Zap, Flame, Award, Clock, CheckCircle2, ArrowRight, Lightbulb, ShieldCheck, Target, Anchor, Bell, Gauge,
} from 'lucide-react';
import type { SessionResult, UserProgress } from '../types';
import type { HabitPreferencesPartial } from '../services/storage';
import { buildSessionInsight, buildApplicationCue } from '../services/sessionInsights';
import { playClickSound } from '../services/sound';
import { describeSessionDifficulty, tierLabel } from '../services/difficultyFeel';
import { requestReminderPermission, postReminderScheduleToSw } from '../services/reminderScheduler';

const ANCHOR_OPTIONS = ['morning coffee', 'after lunch', 'end of workday', 'evening wind-down'] as const;

interface SessionSummaryModalProps {
  session: SessionResult;
  updatedProgress: UserProgress;
  onClose: () => void;
  onSaveHabitPrefs?: (partial: HabitPreferencesPartial) => void;
  abilityBefore?: { theta: number };
  abilityAfter?: { theta: number };
  /** Honest note when arcade used elevated adaptive settings */
  arcadeIntensityNote?: string | null;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  updatedProgress,
  onClose,
  onSaveHabitPrefs,
  abilityBefore,
  abilityAfter,
  arcadeIntensityNote,
}) => {
  const accuracyPct = Math.round((session.correctCount / Math.max(1, session.totalItems)) * 100);
  const insight = useMemo(
    () => buildSessionInsight(session, updatedProgress),
    [session, updatedProgress],
  );
  const applicationCue = useMemo(() => buildApplicationCue(session), [session]);
  const difficultyFeel = useMemo(() => {
    if (abilityBefore == null || abilityAfter == null) return null;
    return describeSessionDifficulty(abilityBefore.theta, abilityAfter.theta);
  }, [abilityBefore, abilityAfter]);
  const earnedShield =
    updatedProgress.streakDays > 0 &&
    updatedProgress.streakDays % 7 === 0;
  const isMixedSet =
    session.attempts.some((a) => !a.itemId.includes('-rep-')) &&
    session.attempts.some((a) => a.itemId.includes('-rep-'));

  const [anchor, setAnchor] = useState<string>(updatedProgress.habitAnchor ?? '');
  const [customAnchor, setCustomAnchor] = useState('');
  const [reminderTime, setReminderTime] = useState(
    updatedProgress.reminderTime ?? '09:00',
  );
  const [habitSaved, setHabitSaved] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(Boolean(updatedProgress.reminderEnabled));
  const [reminderSkipped, setReminderSkipped] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0f766e', '#14b8a6', '#ff5c3a', '#f59e0b', '#38bdf8'],
      });
    } catch {
      // ignore
    }
  }, []);

  const resolvedAnchor = anchor === '__custom__' ? customAnchor.trim() : anchor;

  const handleSaveAnchor = () => {
    if (!resolvedAnchor || !onSaveHabitPrefs) return;
    playClickSound();
    onSaveHabitPrefs({ habitAnchor: resolvedAnchor });
    setHabitSaved(true);
  };

  const handleEnableReminder = async () => {
    if (!onSaveHabitPrefs) return;
    playClickSound();
    await requestReminderPermission();
    onSaveHabitPrefs({ reminderEnabled: true, reminderTime });
    void postReminderScheduleToSw(reminderTime, true);
    setReminderSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="surface max-w-md w-full p-6 md:p-8 text-center relative animate-modalPop my-4 max-h-[min(92vh,720px)] overflow-y-auto">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(145deg, #17a89a, #0f766e)', boxShadow: '0 10px 24px rgba(15,118,110,0.28)' }}
        >
          <Zap className="w-8 h-8 text-white" style={{ fill: 'white' }} />
        </div>

        <h2 className="text-2xl font-extrabold mb-1">Workout complete</h2>
        <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
          {session.mode.replace('_', ' ')} finished
        </p>
        {isMixedSet ? (
          <p className="text-xs mt-1 mb-6 font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Mixed set: quizzes + interactive drills
          </p>
        ) : (
          <div className="mb-6" />
        )}

        <div
          className="rounded-2xl p-4 mb-6 flex items-center justify-around"
          style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
        >
          <div>
            <span className="block text-2xl font-black" style={{ color: 'var(--accent-teal)' }}>+{session.sharpnessDelta}</span>
            <span className="text-[10px] uppercase font-extrabold" style={{ color: 'var(--accent-teal)' }}>Sharpness</span>
          </div>
          <div className="h-8 w-px" style={{ background: '#99f6e4' }} />
          <div>
            <span className="block text-2xl font-black">{updatedProgress.sharpnessScore}</span>
            <span className="text-[10px] uppercase font-extrabold" style={{ color: 'var(--text-muted)' }}>Current</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="surface-soft p-3">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1" style={{ color: '#059669' }} />
            <span className="block text-base font-extrabold">{accuracyPct}%</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Accuracy</span>
          </div>
          <div className="surface-soft p-3">
            <Flame className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--accent-coral)', fill: 'var(--accent-coral)' }} />
            <span className="block text-base font-extrabold" style={{ color: 'var(--accent-coral)' }}>{updatedProgress.streakDays}d</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Streak</span>
          </div>
          <div className="surface-soft p-3">
            <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: '#0284c7' }} />
            <span className="block text-base font-extrabold">{Math.round(session.totalTimeSpentMs / 1000)}s</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Duration</span>
          </div>
        </div>

        {difficultyFeel && (
          <div
            className="rounded-xl p-3 mb-4 flex items-start gap-3 text-left"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
          >
            <Gauge className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-teal)' }} />
            <div className="min-w-0">
              <span
                className="text-[10px] uppercase font-extrabold block mb-0.5"
                style={{ color: 'var(--accent-teal)' }}
              >
                Difficulty · {tierLabel(difficultyFeel.tierAfter)}
              </span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {difficultyFeel.message}
              </p>
              {difficultyFeel.tierBefore !== difficultyFeel.tierAfter && (
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>
                  Intensity band {difficultyFeel.tierBefore}/5 → {difficultyFeel.tierAfter}/5
                </p>
              )}
            </div>
          </div>
        )}

        {arcadeIntensityNote && (
          <div
            className="rounded-xl p-3 mb-4 flex items-start gap-3 text-left"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <Zap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-coral)' }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {arcadeIntensityNote}
            </p>
          </div>
        )}

        <div
          className="rounded-xl p-3 mb-4 flex items-start gap-3 text-left"
          style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
        >
          <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#0284c7' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {insight}
          </p>
        </div>

        <div
          className="rounded-xl p-3 mb-4 flex items-start gap-3 text-left"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <Target className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#c2410c' }} />
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {applicationCue}
          </p>
        </div>

        {earnedShield && (
          <div
            className="rounded-xl p-3 mb-4 flex items-center gap-3 text-left"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-coral)' }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Streak shield earned — you now have {updatedProgress.streakShields}.
            </p>
          </div>
        )}

        <div
          className="rounded-xl p-3 mb-4 flex items-center gap-3 text-left"
          style={{ background: '#ccfbf1', border: '1px solid #99f6e4' }}
        >
          <Award className="w-6 h-6 shrink-0" style={{ color: 'var(--accent-teal)' }} />
          <div>
            <span className="text-[10px] uppercase font-extrabold block" style={{ color: 'var(--accent-teal)' }}>Rank</span>
            <span className="text-sm font-extrabold">{updatedProgress.beltRank}</span>
          </div>
        </div>

        {onSaveHabitPrefs && (
          <>
            <div
              className="rounded-xl p-4 mb-3 text-left"
              style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Anchor className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Wire the habit
                </p>
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                After I… I&apos;ll train for a few minutes.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {ANCHOR_OPTIONS.map((opt) => {
                  const selected = anchor === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { playClickSound(); setAnchor(opt); setHabitSaved(false); }}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                      style={{
                        background: selected ? '#ccfbf1' : 'white',
                        color: selected ? 'var(--accent-teal)' : 'var(--text-secondary)',
                        border: selected ? '2px solid #0f766e' : '1px solid var(--border-color)',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => { playClickSound(); setAnchor('__custom__'); setHabitSaved(false); }}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                  style={{
                    background: anchor === '__custom__' ? '#ccfbf1' : 'white',
                    color: anchor === '__custom__' ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    border: anchor === '__custom__' ? '2px solid #0f766e' : '1px solid var(--border-color)',
                  }}
                >
                  Custom
                </button>
              </div>
              {anchor === '__custom__' && (
                <input
                  type="text"
                  value={customAnchor}
                  onChange={(e) => { setCustomAnchor(e.target.value); setHabitSaved(false); }}
                  placeholder="e.g. brushing teeth"
                  className="w-full rounded-lg px-3 py-2 text-sm mb-2"
                  style={{ border: '1px solid var(--border-color)', background: 'white' }}
                />
              )}
              <button
                type="button"
                disabled={!resolvedAnchor || habitSaved}
                onClick={handleSaveAnchor}
                className="text-xs font-extrabold px-3 py-2 rounded-lg"
                style={{
                  background: habitSaved ? '#d1fae5' : '#ccfbf1',
                  color: 'var(--accent-teal)',
                  border: '1px solid #99f6e4',
                  opacity: !resolvedAnchor ? 0.5 : 1,
                  cursor: !resolvedAnchor || habitSaved ? 'default' : 'pointer',
                }}
              >
                {habitSaved ? 'Saved' : 'Save anchor'}
              </button>
            </div>

            {!reminderSkipped && (
              <div
                className="rounded-xl p-4 mb-4 text-left"
                style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4" style={{ color: 'var(--accent-coral)' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Remind me tomorrow at
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => { setReminderTime(e.target.value); setReminderSaved(false); }}
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{ border: '1px solid var(--border-color)', background: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={handleEnableReminder}
                    disabled={reminderSaved}
                    className="text-xs font-extrabold px-3 py-2 rounded-lg"
                    style={{
                      background: reminderSaved ? '#d1fae5' : '#fff1ed',
                      color: 'var(--accent-coral)',
                      border: '1px solid #fed7aa',
                      cursor: reminderSaved ? 'default' : 'pointer',
                    }}
                  >
                    {reminderSaved ? 'Reminder on' : 'Confirm'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderSkipped(true)}
                  className="mt-2 text-[11px] font-bold underline-offset-2 hover:underline"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Not now
                </button>
              </div>
            )}
          </>
        )}

        <button onClick={onClose} className="btn-3d btn-3d-coral w-full justify-center text-sm py-3.5 flex items-center gap-2">
          <span>Back to training</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
