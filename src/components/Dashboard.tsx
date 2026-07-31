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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Witt Companion Nudge Banner */}
      <WittCompanion progress={progress} onSelectSkill={onSelectSkill} />

      {/* Main Daily Workout Hero Card */}
      <div className="glass-panel p-8 md:p-12 border-2 border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950 rounded-3xl relative overflow-hidden shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/50 text-xs font-black uppercase tracking-wider mb-5 shadow-lg">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Today's Fresh Daily Set Ready
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            5-Minute Daily Brain Gym
          </h1>

          <p className="text-gray-200 text-base md:text-lg leading-relaxed mb-8 max-w-2xl font-medium">
            A targeted 5-rep sequence across Writing, Logic, Code, and Memory. Grounded in cognitive resilience to maintain critical thinking in the AI era.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => onStartSet('daily')}
              className="btn-3d btn-3d-indigo text-base px-8 py-4 flex items-center gap-3 shadow-2xl"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Today's Daily Set</span>
            </button>

            <span className="text-xs md:text-sm text-indigo-300 font-extrabold px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
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
        <div className="glass-panel p-8 border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-950 rounded-3xl flex flex-col justify-between shadow-2xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-5 shadow-lg">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Coffee Break Micro-Set</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium">
              Short on time? Run a quick 3-rep micro workout to keep your daily streak intact and mind sharp.
            </p>
          </div>

          <button
            onClick={() => onStartSet('coffee_break')}
            className="btn-3d btn-3d-amber w-full py-4 text-xs flex items-center justify-center gap-2 shadow-xl"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Coffee Break (~2 Mins)</span>
          </button>
        </div>

        {/* Weekend Long Set */}
        <div className="glass-panel p-8 border-2 border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-slate-950 rounded-3xl flex flex-col justify-between shadow-2xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 mb-5 shadow-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Weekend Deep Gym</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium">
              An extended 8-rep workout covering advanced fallacies, code concurrency, and Fermi scale estimation.
            </p>
          </div>

          <button
            onClick={() => onStartSet('weekend_long')}
            className="btn-3d btn-3d-violet w-full py-4 text-xs flex items-center justify-center gap-2 shadow-xl"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Weekend Deep Set (~10 Mins)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
