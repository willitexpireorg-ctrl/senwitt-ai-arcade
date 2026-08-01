import React, { useMemo } from 'react';
import { Award, Flame, CheckCircle, TrendingUp, ShieldCheck, Sparkles, CalendarDays, Gauge, Play } from 'lucide-react';
import type { UserProgress, SessionResult, SkillCategory } from '../types';
import { SharpnessGauge } from './SharpnessGauge';
import { CognitiveRadarChart } from './CognitiveRadarChart';
import { getLocalDateString, hasTrainedToday } from '../services/storage';
import { buildWeeklyReport, last7DayActivity, computeMomentum } from '../services/sessionInsights';
import {
  tierFromTheta,
  tierLabel,
  trainingIntensityBlurb,
  skillLevelLabel,
  type DifficultyTier,
} from '../services/difficultyFeel';
import { BRAND_IMAGES } from '../assets/brandImages';

interface AnalyticsPageProps {
  progress: UserProgress;
  sessionHistory: SessionResult[];
  onStartDaily?: () => void;
  /** Latent ability theta for intensity band (not shown raw). */
  abilityTheta?: number;
}

const BELT_THRESHOLDS = [
  { rank: 'White Belt (Initiate)', minScore: 300, minSessions: 0 },
  { rank: 'Yellow Belt (Focus Practitioner)', minScore: 700, minSessions: 2 },
  { rank: 'Green Belt (Logic Specialist)', minScore: 740, minSessions: 8 },
  { rank: 'Blue Belt (Cognitive Architect)', minScore: 780, minSessions: 18 },
  { rank: 'Purple Belt (Neural Strategist)', minScore: 840, minSessions: 30 },
  { rank: 'Black Belt (Master Mind)', minScore: 900, minSessions: 50 },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  progress,
  sessionHistory,
  onStartDaily,
  abilityTheta = 0,
}) => {
  const categories: SkillCategory[] = ['writing', 'math', 'code', 'memory', 'reading', 'reasoning'];
  const today = getLocalDateString();
  const week = useMemo(() => buildWeeklyReport(progress, sessionHistory, today), [progress, sessionHistory, today]);
  const momentum = useMemo(() => computeMomentum(sessionHistory, today), [sessionHistory, today]);
  const habitDays = useMemo(() => last7DayActivity(sessionHistory, today), [sessionHistory, today]);
  const recentSessions = sessionHistory.slice(0, 7);
  const trainedToday = hasTrainedToday(progress, today);
  const intensityTier: DifficultyTier = tierFromTheta(abilityTheta);
  const intensityCopy = trainingIntensityBlurb(intensityTier);

  const historyPoints = progress.sharpnessHistory.slice(-30);
  const minScore = historyPoints.length ? Math.min(...historyPoints.map((h) => h.score), 300) : 300;
  const maxScore = historyPoints.length ? Math.max(...historyPoints.map((h) => h.score), 1000) : 1000;
  const range = Math.max(1, maxScore - minScore);
  const sparkW = 280;
  const sparkH = 72;
  const sparkPath =
    historyPoints.length > 1
      ? historyPoints
          .map((h, i) => {
            const x = (i / (historyPoints.length - 1)) * sparkW;
            const y = sparkH - ((h.score - minScore) / range) * (sparkH - 8) - 4;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  return (
    <div className="page-shell py-8 animate-tabSlideIn">
      <div className="section-header">
        <h1>Progress</h1>
        <p>Track Sharpness, skill balance, streak, and belt progression.</p>
      </div>

      {!trainedToday && onStartDaily && (
        <div
          className="sticky top-0 z-20 mb-6 surface p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <div className="flex-1 text-center sm:text-left min-w-0">
            <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Complete today&apos;s workout — Momentum {momentum.daysThisWeek}/{momentum.target}
            </p>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
              An open loop remembers better — finish today&apos;s set when you can.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartDaily}
            className="btn-3d btn-3d-coral py-2.5 px-4 text-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4" style={{ fill: 'white' }} />
            <span>Start</span>
          </button>
        </div>
      )}

      <div
        className="surface p-5 mb-6 animate-fadeInUp"
        style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#ccfbf1', color: 'var(--accent-teal)' }}
          >
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0 text-left">
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: 'var(--accent-teal)',
                letterSpacing: '0.06em',
              }}
            >
              Training intensity
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {tierLabel(intensityTier)} · Intensity band {intensityTier}/5
            </h3>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.45 }}>
              {intensityCopy}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 stagger-children w-full">
        <div className="surface p-6 flex flex-col items-center justify-center text-center animate-fadeInUp">
          <SharpnessGauge score={progress.sharpnessScore} maxScore={1000} size={150} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', fontWeight: 600 }}>
            Based on accuracy, speed, and difficulty over time.
          </p>
        </div>

        <div className="surface p-6 flex flex-col justify-between animate-fadeInUp">
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#ccfbf1', color: 'var(--accent-teal)' }}
            >
              <Award className="w-6 h-6" />
            </div>
            <div className="min-w-0 text-left">
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '0.06em' }}>
                Current belt
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.35, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
                {progress.beltRank}
              </h3>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 600 }}>
            Climb belts with consistent sessions and a rising Sharpness score.
          </p>
          <div style={{ width: '100%', background: 'var(--bg-secondary)', height: 10, borderRadius: 99, overflow: 'hidden' }}>
            <div
              className="progress-bar-teal"
              style={{ height: '100%', width: `${Math.min(100, (progress.sharpnessScore / 1000) * 100)}%`, transition: 'width 0.7s ease' }}
            />
          </div>
        </div>

        <div className="surface p-6 flex flex-col justify-between animate-fadeInUp">
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#fff1ed', color: 'var(--accent-coral)' }}
            >
              <Flame className="w-6 h-6" style={{ fill: 'var(--accent-coral)' }} />
            </div>
            <div className="min-w-0 text-left">
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-coral)', letterSpacing: '0.06em' }}>
                Habit streak
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {progress.streakDays}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>days</span>
              </h3>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-teal)', flexShrink: 0, marginTop: 2 }} />
            <span>
              Missing a day won&apos;t erase this: {progress.streakShields} streak shield{progress.streakShields === 1 ? '' : 's'} cover
              longer gaps, plus {progress.graceTokens} comeback token{progress.graceTokens === 1 ? '' : 's'} this month for shorter ones.
            </span>
          </p>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-extrabold" style={{ color: 'var(--text-primary)' }}>
              <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--accent-teal)' }} />
              Last 7 days
            </div>
            <div className="flex justify-between gap-1">
              {habitDays.map((d) => {
                const weekday = DAY_LABELS[new Date(d.date + 'T12:00:00').getDay()];
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{weekday}</span>
                    <div
                      className="w-full aspect-square max-w-[2rem] rounded-lg flex items-center justify-center"
                      style={{
                        background: d.trained ? '#ccfbf1' : 'var(--bg-secondary)',
                        border: `1px solid ${d.trained ? '#99f6e4' : 'var(--border-color)'}`,
                        color: d.trained ? 'var(--accent-teal)' : 'var(--text-muted)',
                      }}
                      title={d.date}
                    >
                      {d.trained ? <CheckCircle className="w-3.5 h-3.5" /> : <span style={{ fontSize: 10 }}>·</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8 w-full">
        <div className="surface p-6">
          <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-teal)' }} />
            Sharpness (30 days)
          </h2>
          {historyPoints.length > 1 ? (
            <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full h-20" role="img" aria-label="Sharpness history">
              <path d={sparkPath} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Complete a few sessions to see your Sharpness trend.
            </p>
          )}
          {historyPoints.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 8 }}>
              Latest: {historyPoints[historyPoints.length - 1].score} · Range {minScore}–{maxScore}
            </p>
          )}
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            This week
          </h2>
          <div
            className="rounded-xl p-3 mb-4 flex items-center gap-3"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
          >
            <Gauge className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-teal)' }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Momentum {momentum.daysThisWeek}/{momentum.target} this week
              </p>
              <div style={{ width: '100%', background: 'var(--bg-secondary)', height: 6, borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
                <div
                  className="progress-bar-teal"
                  style={{ height: '100%', width: `${Math.min(100, (momentum.daysThisWeek / momentum.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="surface-soft p-3">
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sessions</span>
              <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>{week.sessionsThisWeek}</p>
            </div>
            <div className="surface-soft p-3">
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active days</span>
              <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>{week.activeDays}/7</p>
            </div>
            <div className="surface-soft p-3">
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sharpness Δ</span>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: week.sharpnessDelta >= 0 ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>
                {week.sharpnessDelta >= 0 ? '+' : ''}{week.sharpnessDelta}
              </p>
            </div>
            <div className="surface-soft p-3">
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus next</span>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', textTransform: 'capitalize' }}>{week.focusNext ?? '—'}</p>
            </div>
          </div>
          {week.bestSkill && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 12 }}>
              Best skill this stretch: <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{week.bestSkill}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 w-full">
        <div className="surface p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-sm font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} />
            Skill balance
          </div>
          <CognitiveRadarChart progress={progress} size={250} />
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1rem', maxWidth: 280, fontWeight: 600 }}>
            Balance across writing, math, code, memory, reading, and logic.
          </p>
        </div>

        <div className="lg:col-span-2 surface p-6">
          <h2 className="text-lg font-extrabold mb-4 flex items-center justify-center sm:justify-start gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-teal)' }} />
            Skill mastery
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const skill = progress.skills[cat] || { level: 1, score: 700, accuracy: 100, totalReps: 0 };
              return (
                <div key={cat} className="surface-soft p-4">
                  <div className="flex justify-between text-sm font-bold mb-2 gap-2" style={{ color: 'var(--text-primary)' }}>
                    <span className="capitalize">{cat}</span>
                    <span style={{ color: 'var(--accent-teal)' }}>{skill.accuracy}%</span>
                  </div>
                  <div style={{ width: '100%', background: 'var(--bg-secondary)', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div
                      className="progress-bar-teal"
                      style={{ height: '100%', width: `${skill.accuracy}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold gap-2 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    <span>Level {skill.level} · {skillLevelLabel(skill.level)} · {skill.score} pts</span>
                    <span>{skill.totalReps} reps</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="surface p-6 mb-8">
        <h2 className="text-lg font-extrabold mb-4 text-center sm:text-left" style={{ color: 'var(--text-primary)' }}>
          Recent sessions
        </h2>
        {recentSessions.length === 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <img
              src={BRAND_IMAGES.onboardingEmpty}
              alt=""
              width={120}
              height={120}
              className="illustrative-panel"
              decoding="async"
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              No sessions yet — start today&apos;s workout to see your progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const acc = s.totalItems > 0 ? Math.round((s.correctCount / s.totalItems) * 100) : 0;
              return (
                <div
                  key={s.id}
                  className="surface-soft p-3 flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.date}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {s.mode.replace('_', ' ')}
                  </span>
                  <span style={{ fontWeight: 700 }}>{acc}% · +{s.sharpnessDelta}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="surface p-6 mb-8">
        <h2 className="text-lg font-extrabold mb-4 text-center sm:text-left" style={{ color: 'var(--text-primary)' }}>
          Belt pathway
        </h2>
        <div className="space-y-2.5">
          {BELT_THRESHOLDS.map((belt, idx) => {
            const isUnlocked = progress.sharpnessScore >= belt.minScore && progress.totalSessions >= belt.minSessions;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                style={{
                  background: isUnlocked ? '#f0fdfa' : 'var(--bg-surface-soft)',
                  border: `1px solid ${isUnlocked ? '#99f6e4' : 'var(--border-color)'}`,
                  opacity: isUnlocked ? 1 : 0.85,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Award className="w-5 h-5 shrink-0" style={{ color: isUnlocked ? 'var(--accent-teal)' : 'var(--text-muted)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
                    {belt.rank}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  <span>{belt.minScore}+ score</span>
                  <span>{belt.minSessions}+ sessions</span>
                  {isUnlocked ? (
                    <span className="font-extrabold flex items-center gap-1" style={{ color: 'var(--accent-teal)' }}>
                      <CheckCircle className="w-4 h-4" /> Unlocked
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
