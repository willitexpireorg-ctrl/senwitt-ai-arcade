import React from 'react';
import { PenTool, Calculator, Code2, Brain, BookOpen, Scale, Play, TrendingUp } from 'lucide-react';
import type { UserProgress, SkillCategory } from '../types';

interface SkillCatalogProps {
  progress: UserProgress;
  onStartSkillPractice: (skill: SkillCategory) => void;
}

const SKILL_METADATA: Record<SkillCategory, {
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  emoji: string;
  color: string;
  glowColor: string;
  bg: string;
  border: string;
  progressBarClass: string;
  btnBg: string;
  btnBorder: string;
  badgeClass: string;
  description: string;
  subskills: string[];
}> = {
  writing: {
    name: 'Writing & Syntactic Precision',
    icon: PenTool,
    emoji: '✍️',
    color: '#818cf8',
    glowColor: 'rgba(99,102,241,0.2)',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #13103a 60%, #080614 100%)',
    border: 'rgba(99,102,241,0.3)',
    progressBarClass: 'progress-bar-indigo',
    btnBg: 'rgba(99,102,241,0.2)',
    btnBorder: 'rgba(99,102,241,0.4)',
    badgeClass: 'badge-writing',
    description: 'Eliminate corporate AI wordiness, refine nuanced word choice, and structure clear arguments.',
    subskills: ['Concise Drafting', 'Word Choice', 'Sentence Compression'],
  },
  math: {
    name: 'Math & Quantitative Reasoning',
    icon: Calculator,
    emoji: '🧮',
    color: '#22d3ee',
    glowColor: 'rgba(6,182,212,0.2)',
    bg: 'linear-gradient(135deg, #083344 0%, #052e3d 60%, #020d14 100%)',
    border: 'rgba(6,182,212,0.3)',
    progressBarClass: 'progress-bar-cyan',
    btnBg: 'rgba(6,182,212,0.2)',
    btnBorder: 'rgba(6,182,212,0.4)',
    badgeClass: 'badge-math',
    description: 'Fermi estimation, symbolic logic equations, and rapid percentage adjustments.',
    subskills: ['Order of Magnitude', 'Symbolic Solver', 'Compound Percentages'],
  },
  code: {
    name: 'Code Tracing & Logic Audit',
    icon: Code2,
    emoji: '💻',
    color: '#34d399',
    glowColor: 'rgba(16,185,129,0.2)',
    bg: 'linear-gradient(135deg, #064e3b 0%, #022c22 60%, #030d09 100%)',
    border: 'rgba(16,185,129,0.3)',
    progressBarClass: 'progress-bar-emerald',
    btnBg: 'rgba(16,185,129,0.2)',
    btnBorder: 'rgba(16,185,129,0.4)',
    badgeClass: 'badge-code',
    description: 'Mental execution of variable scope, concurrency race conditions, and bug spotting.',
    subskills: ['Scope & Closure', 'Async Race Conditions', 'Control Flow'],
  },
  memory: {
    name: 'Working Memory & Recall',
    icon: Brain,
    emoji: '🧠',
    color: '#a78bfa',
    glowColor: 'rgba(139,92,246,0.2)',
    bg: 'linear-gradient(135deg, #2e1065 0%, #1a0945 60%, #080217 100%)',
    border: 'rgba(139,92,246,0.3)',
    progressBarClass: 'progress-bar-violet',
    btnBg: 'rgba(139,92,246,0.2)',
    btnBorder: 'rgba(139,92,246,0.4)',
    badgeClass: 'badge-memory',
    description: 'Paired associate recall, spatial grid retention, and sequential patterns.',
    subskills: ['Paired Associates', 'Spatial Grid', 'Sequence Chains'],
  },
  reading: {
    name: 'Critical Reading & Inference',
    icon: BookOpen,
    emoji: '📖',
    color: '#fbbf24',
    glowColor: 'rgba(245,158,11,0.2)',
    bg: 'linear-gradient(135deg, #292524 0%, #1c1408 60%, #0a0800 100%)',
    border: 'rgba(245,158,11,0.3)',
    progressBarClass: 'progress-bar-amber',
    btnBg: 'rgba(245,158,11,0.2)',
    btnBorder: 'rgba(245,158,11,0.4)',
    badgeClass: 'badge-reading',
    description: 'Unstated assumption extraction, rapid passage comprehension, and context recall.',
    subskills: ['Assumption Extraction', 'Speed Inference', 'Fact Verification'],
  },
  reasoning: {
    name: 'Deductive Logic & Fallacies',
    icon: Scale,
    emoji: '⚖️',
    color: '#fb7185',
    glowColor: 'rgba(244,63,94,0.2)',
    bg: 'linear-gradient(135deg, #4c0519 0%, #3a0212 60%, #140008 100%)',
    border: 'rgba(244,63,94,0.3)',
    progressBarClass: 'progress-bar-rose',
    btnBg: 'rgba(244,63,94,0.2)',
    btnBorder: 'rgba(244,63,94,0.4)',
    badgeClass: 'badge-reasoning',
    description: 'Formal fallacy identification, deduction grids, and counterfactual analysis.',
    subskills: ['Formal Fallacies', 'Deduction Grids', 'Logic Validation'],
  },
};

export const SkillCatalog: React.FC<SkillCatalogProps> = ({ progress, onStartSkillPractice }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-tabSlideIn">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Cognitive Skill Library
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', lineHeight: 1.65 }}>
          Six fundamental cognitive disciplines designed to maintain independent thinking, analytical rigor, and memory in an AI-assisted world.
        </p>
      </div>

      {/* ── Skills Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {(Object.keys(SKILL_METADATA) as SkillCategory[]).map((category, cardIdx) => {
          const meta = SKILL_METADATA[category];
          const Icon = meta.icon;
          const userSkill = progress.skills[category] || { level: 1, score: 700, accuracy: 100, totalReps: 0 };
          const levelProgress = Math.min(100, ((userSkill.score - 700) / 300) * 100);

          return (
            <div
              key={category}
              className="relative overflow-hidden rounded-2xl flex flex-col justify-between animate-fadeInUp group"
              style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                padding: '1.5rem',
                animationDelay: `${cardIdx * 60}ms`,
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 40px ${meta.glowColor}`;
                e.currentTarget.style.borderColor = meta.color.replace(')', ', 0.5)').replace('rgb', 'rgba');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
                e.currentTarget.style.borderColor = meta.border;
              }}
            >
              {/* Watermark emoji */}
              <div style={{ position: 'absolute', bottom: '-12px', right: '-8px', fontSize: '6.5rem', opacity: 0.07, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>
                {meta.emoji}
              </div>

              {/* Bottom glow */}
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70%', height: '50px', background: `radial-gradient(ellipse, ${meta.glowColor} 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <div className="relative z-10">
                {/* Header: icon + level badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ background: `${meta.btnBg}`, border: `1px solid ${meta.btnBorder}` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: meta.color }} />
                  </div>
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full ${meta.badgeClass}`}
                  >
                    Level {userSkill.level}
                  </span>
                </div>

                {/* Name */}
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', fontWeight: 800, color: 'white', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                  {meta.name}
                </h3>
                <p style={{ color: 'rgba(200,215,230,0.65)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {meta.description}
                </p>

                {/* Subskill tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {meta.subskills.map((sub, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: `${meta.btnBg}`, color: meta.color, border: `1px solid ${meta.btnBorder}` }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats & CTA */}
              <div className="relative z-10">
                {/* Score progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {userSkill.score} pts
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color }}>
                      {userSkill.accuracy}% Accuracy
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div
                      className={meta.progressBarClass}
                      style={{ height: '100%', borderRadius: '99px', width: `${Math.max(5, levelProgress)}%`, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${meta.glowColor}` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                      {userSkill.totalReps} Total Reps
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                      Lvl {userSkill.level}
                    </span>
                  </div>
                </div>

                {/* Practice button */}
                <button
                  onClick={() => onStartSkillPractice(category)}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all group-hover:scale-[1.02]"
                  style={{
                    background: meta.btnBg,
                    border: `1px solid ${meta.btnBorder}`,
                    color: meta.color,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    boxShadow: `0 4px 16px ${meta.glowColor}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = meta.btnBorder;
                    (e.currentTarget as HTMLButtonElement).style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = meta.btnBg;
                    (e.currentTarget as HTMLButtonElement).style.color = meta.color;
                  }}
                >
                  <Play className="w-3.5 h-3.5" style={{ fill: 'currentColor' }} />
                  Practice {category.toUpperCase()} Drill
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
