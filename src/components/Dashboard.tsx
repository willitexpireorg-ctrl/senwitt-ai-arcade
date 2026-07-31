import React from 'react';
import { Play, Coffee, Calendar, TrendingUp } from 'lucide-react';
import type { UserProgress, SetMode, SkillCategory } from '../types';
import { WittCompanion } from './WittCompanion';

interface DashboardProps {
  progress: UserProgress;
  onStartSet: (mode: SetMode) => void;
  onSelectSkill: (skill: SkillCategory) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  onStartSet,
  onSelectSkill,
}) => {
  const xpPercent = Math.min(100, ((progress.sharpnessScore - 300) / 700) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 relative z-10 animate-tabSlideIn">

      <WittCompanion progress={progress} onSelectSkill={onSelectSkill} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(160deg, #0b1520 0%, #0c1a22 55%, #0a1218 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <h1
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              color: '#f0f4ff',
            }}
          >
            5-Minute Daily Brain Gym
          </h1>

          <p style={{ color: 'rgba(210,220,230,0.75)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '2rem', maxWidth: '480px', fontWeight: 400 }}>
            A short daily set across Writing, Logic, Code, and Memory to keep your independent thinking sharp.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartSet('daily')}
              className="btn-3d btn-3d-cyan flex items-center gap-3"
              style={{ fontSize: '0.95rem', padding: '14px 32px' }}
            >
              <Play className="w-5 h-5" style={{ fill: 'white' }} />
              <span>Start Today's Daily Set</span>
            </button>
            <span style={{ color: 'rgba(210,220,230,0.5)', fontSize: '0.8rem', fontWeight: 600 }}>
              ~5 minutes
            </span>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.85)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Sharpness Progress
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                {progress.sharpnessScore} / 1000
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                className="progress-bar-cyan"
                style={{ height: '100%', borderRadius: '99px', width: `${xpPercent}%`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Secondary Workout Cards ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">

        {/* Coffee Break */}
        <div
          className="relative overflow-hidden rounded-3xl flex flex-col justify-between group animate-fadeInUp"
          style={{
            background: 'linear-gradient(135deg, #292524 0%, #1c1917 50%, #0a0a0a 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            transition: 'border-color 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)';
          }}
        >
          <div className="relative z-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <Coffee className="w-6 h-6" style={{ color: '#f59e0b' }} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Coffee Break Micro-Set</h3>
            <p style={{ color: 'rgba(200,200,200,0.65)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Short on time? Run a quick 3-rep micro workout to keep your daily streak intact and mind sharp.
            </p>
          </div>

          <button
            onClick={() => onStartSet('coffee_break')}
            className="btn-3d btn-3d-amber relative z-10 w-full py-3.5 flex items-center justify-center gap-2 text-xs"
          >
            <Play className="w-4 h-4" style={{ fill: 'white' }} />
            <span>Launch Coffee Break (~2 Mins)</span>
          </button>
        </div>

        {/* Weekend Long */}
        <div
          className="relative overflow-hidden rounded-3xl flex flex-col justify-between group animate-fadeInUp"
          style={{
            background: 'linear-gradient(135deg, #0a1f1c 0%, #0f1b17 50%, #0a0a0a 100%)',
            border: '1px solid rgba(16,185,129,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            transition: 'border-color 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)';
          }}
        >
          <div className="relative z-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <Calendar className="w-6 h-6" style={{ color: '#34d399' }} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Weekend Deep Gym</h3>
            <p style={{ color: 'rgba(200,200,200,0.65)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              An extended 8-rep workout covering fallacies, code tracing, and Fermi estimation.
            </p>
          </div>

          <button
            onClick={() => onStartSet('weekend_long')}
            className="btn-3d btn-3d-emerald relative z-10 w-full py-3.5 flex items-center justify-center gap-2 text-xs"
          >
            <Play className="w-4 h-4" style={{ fill: 'white' }} />
            <span>Launch Weekend Deep Set (~10 Mins)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
