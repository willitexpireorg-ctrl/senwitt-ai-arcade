import React from 'react';
import { PenTool, Calculator, Code2, Brain, BookOpen, Scale, Play } from 'lucide-react';
import type { UserProgress, SkillCategory } from '../types';

interface SkillCatalogProps {
  progress: UserProgress;
  onStartSkillPractice: (skill: SkillCategory) => void;
}

const SKILL_METADATA: Record<SkillCategory, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderColor: string;
  bgGradient: string;
  description: string;
  subskills: string[];
}> = {
  writing: {
    name: 'Writing & Syntactic Precision',
    icon: PenTool,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgGradient: 'from-indigo-950/40 to-slate-900/60',
    description: 'Eliminate corporate AI wordiness, refine nuanced word choice, and structure clear arguments.',
    subskills: ['Concise Drafting', 'Word Choice', 'Sentence Compression']
  },
  math: {
    name: 'Math & Quantitative Reasoning',
    icon: Calculator,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgGradient: 'from-cyan-950/40 to-slate-900/60',
    description: 'Fermi estimation, symbolic logic equations, and rapid percentage adjustments.',
    subskills: ['Order of Magnitude', 'Symbolic Solver', 'Compound Percentages']
  },
  code: {
    name: 'Code Tracing & Logic Audit',
    icon: Code2,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/40 to-slate-900/60',
    description: 'Mental execution of variable scope, concurrency race conditions, and bug spotting.',
    subskills: ['Scope & Closure', 'Async Race Conditions', 'Control Flow']
  },
  memory: {
    name: 'Working Memory & Recall',
    icon: Brain,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgGradient: 'from-violet-950/40 to-slate-900/60',
    description: 'Paired associate recall, spatial grid retention, and sequential patterns.',
    subskills: ['Paired Associates', 'Spatial Grid', 'Sequence Chains']
  },
  reading: {
    name: 'Critical Reading & Inference',
    icon: BookOpen,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-950/40 to-slate-900/60',
    description: 'Unstated assumption extraction, rapid passage comprehension, and context recall.',
    subskills: ['Assumption Extraction', 'Speed Inference', 'Fact Verification']
  },
  reasoning: {
    name: 'Deductive Logic & Fallacies',
    icon: Scale,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgGradient: 'from-rose-950/40 to-slate-900/60',
    description: 'Formal fallacy identification, deduction grids, and counterfactual analysis.',
    subskills: ['Formal Fallacies', 'Deduction Grids', 'Logic Validation']
  }
};

export const SkillCatalog: React.FC<SkillCatalogProps> = ({ progress, onStartSkillPractice }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Cognitive Skill Library</h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          Six fundamental cognitive disciplines designed to maintain independent thinking, analytical rigor, and memory in an AI-assisted world.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(SKILL_METADATA) as SkillCategory[]).map((category) => {
          const meta = SKILL_METADATA[category];
          const Icon = meta.icon;
          const userSkill = progress.skills[category] || { level: 1, score: 700, accuracy: 100, totalReps: 0 };

          return (
            <div
              key={category}
              className={`glass-panel p-6 bg-gradient-to-br ${meta.bgGradient} border ${meta.borderColor} flex flex-col justify-between group hover:scale-[1.01] transition-all duration-200`}
            >
              <div>
                
                {/* Header Icon + Level Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${meta.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/10">
                    Level {userSkill.level} ({userSkill.score} pts)
                  </span>
                </div>

                {/* Skill Name */}
                <h3 className="text-lg font-bold text-white mb-2">{meta.name}</h3>
                <p className="text-gray-300 text-xs leading-relaxed mb-4">{meta.description}</p>

                {/* Subskill Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {meta.subskills.map((sub, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5">
                      {sub}
                    </span>
                  ))}
                </div>

              </div>

              {/* Progress & Practice CTA */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3 pt-3 border-t border-white/5">
                  <span>Accuracy: <strong className="text-white">{userSkill.accuracy}%</strong></span>
                  <span>Total Reps: <strong className="text-white">{userSkill.totalReps}</strong></span>
                </div>

                <button
                  onClick={() => onStartSkillPractice(category)}
                  className="w-full py-2.5 rounded-xl font-heading font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center justify-center gap-2 group-hover:border-indigo-500/50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Practice {category.toUpperCase()} Drill</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
