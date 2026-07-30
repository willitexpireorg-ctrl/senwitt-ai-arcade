import React from 'react';
import { Play, Coffee, Calendar, Sparkles } from 'lucide-react';
import type { UserProgress, SetMode, SkillCategory, ExerciseItem } from '../types';
import { WittCompanion } from './WittCompanion';
import { CustomRepGenerator } from './CustomRepGenerator';

interface DashboardProps {
  progress: UserProgress;
  onStartSet: (mode: SetMode) => void;
  onSelectSkill: (skill: SkillCategory) => void;
  onTestCustomRep: (item: ExerciseItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  onStartSet,
  onSelectSkill,
  onTestCustomRep,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Witt Companion Nudge Banner */}
      <WittCompanion progress={progress} onSelectSkill={onSelectSkill} />

      {/* Main Daily Workout Hero Card */}
      <div className="glass-panel p-8 md:p-10 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 relative overflow-hidden shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Today's Fresh Daily Set Ready
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            5-Minute Daily Brain Exercise
          </h1>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
            A targeted 5-rep sequence across Writing, Logic, Code, and Memory. Grounded in cognitive resilience to maintain critical thinking in the AI era.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onStartSet('daily')}
              className="gradient-btn text-base px-8 py-4 shadow-xl shadow-indigo-500/30"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Today's Daily Set</span>
            </button>

            <span className="text-xs text-gray-400 font-medium">
              ⚡ ~5 Mins • 5 Cognitive Reps
            </span>
          </div>
        </div>

      </div>

      {/* Custom Work Artifact Rep Generator */}
      <CustomRepGenerator onTestCustomRep={onTestCustomRep} />

      {/* Secondary Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Coffee Break Set */}
        <div className="glass-panel p-6 border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900/50 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Coffee Break Set</h3>
            <p className="text-gray-300 text-xs leading-relaxed mb-4">
              Short on time? Run a quick 3-rep micro workout to keep your streak intact and sharp.
            </p>
          </div>

          <button
            onClick={() => onStartSet('coffee_break')}
            className="w-full py-3 rounded-xl font-heading font-semibold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-amber-300" />
            <span>Launch Coffee Break (~2 Mins)</span>
          </button>
        </div>

        {/* Weekend Long Set */}
        <div className="glass-panel p-6 border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-slate-900/50 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Weekend Deep Set</h3>
            <p className="text-gray-300 text-xs leading-relaxed mb-4">
              An extended 8-rep workout covering advanced fallacies, code concurrency, and Fermi estimates.
            </p>
          </div>

          <button
            onClick={() => onStartSet('weekend_long')}
            className="w-full py-3 rounded-xl font-heading font-semibold text-xs bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-violet-300" />
            <span>Launch Weekend Deep Set (~10 Mins)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
