import React, { useState } from 'react';
import { Gamepad2, Play, Target, Clock } from 'lucide-react';
import { ResearchAgent } from '../services/researchAgent';
import type { GameSpec } from '../services/researchAgent';
import { playClickSound } from '../services/sound';

interface GamesArcadeProps {
  onLaunchGame: (game: GameSpec) => void;
}

// Per-category visual identities
const CATEGORY_STYLES: Record<string, {
  emoji: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
  badgeClass: string;
  btnClass: string;
  tagColor: string;
}> = {
  writing: {
    emoji: '✍️',
    color: '#818cf8',
    glow: 'rgba(99,102,241,0.25)',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #13103a 60%, #0a0a14 100%)',
    border: 'rgba(99,102,241,0.3)',
    badgeClass: 'badge-writing',
    btnClass: 'btn-3d-indigo',
    tagColor: '#a5b4fc',
  },
  math: {
    emoji: '🧮',
    color: '#22d3ee',
    glow: 'rgba(6,182,212,0.25)',
    bg: 'linear-gradient(135deg, #083344 0%, #052e3d 60%, #020d14 100%)',
    border: 'rgba(6,182,212,0.3)',
    badgeClass: 'badge-math',
    btnClass: 'btn-3d-cyan',
    tagColor: '#67e8f9',
  },
  code: {
    emoji: '💻',
    color: '#34d399',
    glow: 'rgba(16,185,129,0.25)',
    bg: 'linear-gradient(135deg, #064e3b 0%, #022c22 60%, #020d0a 100%)',
    border: 'rgba(16,185,129,0.3)',
    badgeClass: 'badge-code',
    btnClass: 'btn-3d-emerald',
    tagColor: '#6ee7b7',
  },
  memory: {
    emoji: '🧠',
    color: '#a78bfa',
    glow: 'rgba(139,92,246,0.25)',
    bg: 'linear-gradient(135deg, #2e1065 0%, #1e0a4a 60%, #0a0520 100%)',
    border: 'rgba(139,92,246,0.3)',
    badgeClass: 'badge-memory',
    btnClass: 'btn-3d-violet',
    tagColor: '#c4b5fd',
  },
  reading: {
    emoji: '📖',
    color: '#fbbf24',
    glow: 'rgba(245,158,11,0.25)',
    bg: 'linear-gradient(135deg, #292524 0%, #1c1408 60%, #0a0800 100%)',
    border: 'rgba(245,158,11,0.3)',
    badgeClass: 'badge-reading',
    btnClass: 'btn-3d-amber',
    tagColor: '#fcd34d',
  },
  reasoning: {
    emoji: '⚖️',
    color: '#fb7185',
    glow: 'rgba(244,63,94,0.25)',
    bg: 'linear-gradient(135deg, #4c0519 0%, #3a0212 60%, #140008 100%)',
    border: 'rgba(244,63,94,0.3)',
    badgeClass: 'badge-reasoning',
    btnClass: 'btn-3d-rose',
    tagColor: '#fda4af',
  },
};

// Games with live interactive engines
const LIVE_MECHANIC_TYPES = new Set(['visual_grid', 'dual_nback', 'stroop', 'logic_deduction', 'voice_drill']);

const CATEGORIES = [
  { label: 'All Games', value: 'all' },
  { label: '✍️ Writing', value: 'writing' },
  { label: '🧮 Math', value: 'math' },
  { label: '💻 Code', value: 'code' },
  { label: '🧠 Memory', value: 'memory' },
  { label: '📖 Reading', value: 'reading' },
  { label: '⚖️ Reasoning', value: 'reasoning' },
];

export const GamesArcade: React.FC<GamesArcadeProps> = ({ onLaunchGame }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const games = ResearchAgent.getGameSuite();

  const filteredGames = filterCategory === 'all'
    ? games
    : games.filter((g) => g.category === filterCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-tabSlideIn">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          {games.length} Focused Drills
        </div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Games
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', lineHeight: 1.6 }}>
          A handful of live mini-games plus focused multiple-choice drills, one per skill.
        </p>
      </div>

      {/* ── Category Filter Pills ─────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-2 mb-8 p-1.5 rounded-2xl max-w-max"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => { playClickSound(); setFilterCategory(cat.value); }}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(79,70,229,0.9))' : 'transparent',
                color: isSelected ? 'white' : 'rgba(255,255,255,0.45)',
                boxShadow: isSelected ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Games Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {filteredGames.map((game) => {
          const style = CATEGORY_STYLES[game.category] ?? CATEGORY_STYLES.writing;
          const isLive = LIVE_MECHANIC_TYPES.has(game.mechanicType);

          return (
            <div
              key={game.id}
              className="relative overflow-hidden rounded-2xl flex flex-col justify-between group animate-fadeInUp"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                padding: '1.25rem',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.4), 0 0 20px ${style.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)';
              }}
            >
              {/* Watermark emoji */}
              <div style={{ position: 'absolute', top: '-8px', right: '-4px', fontSize: '5rem', opacity: 0.05, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>
                {style.emoji}
              </div>

              {/* Top row: category badge + time + LIVE */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${style.badgeClass}`}>
                    {game.category}
                  </span>
                  {isLive && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: style.tagColor }}>
                  <Clock className="w-3 h-3" /> {game.estimatedDuration}
                </span>
              </div>

              {/* Title & Description */}
              <div className="relative z-10 mb-3">
                <h3
                  style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem', letterSpacing: '-0.01em', transition: 'color 0.2s' }}
                  className="group-hover:text-opacity-90"
                >
                  {game.title}
                </h3>
                <p style={{ color: 'rgba(200,210,230,0.6)', fontSize: '0.8rem', lineHeight: 1.55 }}>
                  {game.description}
                </p>
              </div>

              {/* Info strip */}
              <div
                className="relative z-10 rounded-xl p-2.5 mb-4"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Target className="w-3.5 h-3.5 shrink-0" style={{ color: style.color }} />
                  <span style={{ color: style.tagColor, fontWeight: 600 }}>Target: {game.neuralTarget}</span>
                </div>
              </div>

              {/* Launch button */}
              <button
                onClick={() => { playClickSound(); onLaunchGame(game); }}
                className={`btn-3d ${style.btnClass} relative z-10 w-full py-2.5 flex items-center justify-center gap-2 text-[11px] rounded-xl`}
                style={{ letterSpacing: '0.06em' }}
              >
                <Play className="w-3.5 h-3.5" style={{ fill: 'white' }} />
                <span>Play {game.title}</span>
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
};
