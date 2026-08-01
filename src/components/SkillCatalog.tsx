import React from 'react';
import { PenTool, Calculator, Code2, Brain, BookOpen, Scale, Play, TrendingUp } from 'lucide-react';
import type { UserProgress, SkillCategory } from '../types';
import { skillLevelLabel } from '../services/difficultyFeel';

interface SkillCatalogProps {
  progress: UserProgress;
  onStartSkillPractice: (skill: SkillCategory) => void;
}

const SKILL_METADATA: Record<SkillCategory, {
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  artClass: string;
  soft: string;
  ink: string;
  progressBarClass: string;
  badgeClass: string;
  btnClass: string;
  description: string;
  subskills: string[];
}> = {
  writing: {
    name: 'Writing & Precision',
    icon: PenTool,
    artClass: 'tile-art--sky',
    soft: '#e0f2fe',
    ink: '#0369a1',
    progressBarClass: 'progress-bar-cyan',
    badgeClass: 'badge-writing',
    btnClass: 'btn-3d-cyan',
    description: 'Cut fluff, sharpen word choice, and structure clear arguments.',
    subskills: ['Concise Drafting', 'Word Choice', 'Compression'],
  },
  math: {
    name: 'Math & Estimation',
    icon: Calculator,
    artClass: 'tile-art--teal',
    soft: '#ccfbf1',
    ink: '#0f766e',
    progressBarClass: 'progress-bar-teal',
    badgeClass: 'badge-math',
    btnClass: 'btn-3d-teal',
    description: 'Fermi estimates, percentages, and quick quantitative judgment.',
    subskills: ['Order of Magnitude', 'Percentages', 'Symbolic'],
  },
  code: {
    name: 'Code Tracing',
    icon: Code2,
    artClass: 'tile-art--mint',
    soft: '#d1fae5',
    ink: '#047857',
    progressBarClass: 'progress-bar-emerald',
    badgeClass: 'badge-code',
    btnClass: 'btn-3d-emerald',
    description: 'Mentally execute scope, control flow, and common bugs.',
    subskills: ['Scope', 'Async', 'Control Flow'],
  },
  memory: {
    name: 'Working Memory',
    icon: Brain,
    artClass: 'tile-art--cyan',
    soft: '#cffafe',
    ink: '#0e7490',
    progressBarClass: 'progress-bar-cyan',
    badgeClass: 'badge-memory',
    btnClass: 'btn-3d-cyan',
    description: 'Hold patterns, pairs, and sequences under light pressure.',
    subskills: ['Paired Associates', 'Spatial Grid', 'Sequences'],
  },
  reading: {
    name: 'Critical Reading',
    icon: BookOpen,
    artClass: 'tile-art--amber',
    soft: '#fef3c7',
    ink: '#b45309',
    progressBarClass: 'progress-bar-amber',
    badgeClass: 'badge-reading',
    btnClass: 'btn-3d-amber',
    description: 'Spot assumptions, infer quickly, and verify claims.',
    subskills: ['Assumptions', 'Inference', 'Verification'],
  },
  reasoning: {
    name: 'Logic & Fallacies',
    icon: Scale,
    artClass: 'tile-art--rose',
    soft: '#ffe4e6',
    ink: '#be123c',
    progressBarClass: 'progress-bar-rose',
    badgeClass: 'badge-reasoning',
    btnClass: 'btn-3d-rose',
    description: 'Identify fallacies, run deduction grids, and test claims.',
    subskills: ['Fallacies', 'Deduction', 'Validation'],
  },
};

export const SkillCatalog: React.FC<SkillCatalogProps> = ({ progress, onStartSkillPractice }) => {
  return (
    <div className="page-shell py-10 animate-tabSlideIn">
      <div className="section-header">
        <h1>Skill library</h1>
        <p>Six cognitive disciplines — practice any one in a short, focused drill.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children w-full">
        {(Object.keys(SKILL_METADATA) as SkillCategory[]).map((category, cardIdx) => {
          const meta = SKILL_METADATA[category];
          const Icon = meta.icon;
          const userSkill = progress.skills[category] || { level: 1, score: 700, accuracy: 100, totalReps: 0 };
          const levelProgress = Math.min(100, ((userSkill.score - 700) / 300) * 100);

          return (
            <article
              key={category}
              className="game-tile animate-fadeInUp"
              style={{ animationDelay: `${cardIdx * 60}ms` }}
            >
              <div className={`tile-art ${meta.artClass}`}>
                <Icon className="w-8 h-8" />
              </div>

              <div className="tile-body">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${meta.badgeClass}`}>
                    Level {userSkill.level} · {skillLevelLabel(userSkill.level)}
                  </span>
                  <span className="tile-meta">{userSkill.totalReps} reps</span>
                </div>

                <h3 className="tile-title">{meta.name}</h3>
                <p className="tile-desc mb-4">{meta.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {meta.subskills.map((sub) => (
                    <span
                      key={sub}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: meta.soft, color: meta.ink }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {userSkill.score} pts
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: meta.ink }}>
                      {userSkill.accuracy}% accuracy
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.95rem' }}>
                    <div
                      className={`${meta.progressBarClass} progress-fill`}
                      style={{ height: '100%', borderRadius: '99px', width: `${Math.max(5, levelProgress)}%`, transition: 'width 0.8s ease' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartSkillPractice(category)}
                    className={`btn-3d ${meta.btnClass} w-full py-3.5 flex items-center justify-center gap-2 text-sm`}
                  >
                    <Play className="w-3.5 h-3.5" style={{ fill: 'white' }} />
                    Practice {meta.name}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
