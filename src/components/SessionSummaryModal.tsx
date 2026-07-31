import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Zap, Flame, Award, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import type { SessionResult, UserProgress } from '../types';

interface SessionSummaryModalProps {
  session: SessionResult;
  updatedProgress: UserProgress;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  updatedProgress,
  onClose,
}) => {
  const accuracyPct = Math.round((session.correctCount / session.totalItems) * 100);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981']
      });
    } catch (e) {
      // Fallback gracefully if confetti fails
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 md:p-8 border border-indigo-500/30 text-center relative animate-fadeIn">
        
        {/* Glow header icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-indigo-500/40">
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Set Complete!</h2>
        <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-semibold">
          {session.mode.replace('_', ' ')} Workout Completed
        </p>

        {/* Sharpness Delta Highlight */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 mb-6 flex items-center justify-around">
          <div>
            <span className="block text-2xl font-black text-indigo-300">+{session.sharpnessDelta}</span>
            <span className="text-[10px] text-indigo-400 uppercase font-bold">Sharpness Delta</span>
          </div>
          <div className="h-8 w-px bg-indigo-500/20" />
          <div>
            <span className="block text-2xl font-black text-white">{updatedProgress.sharpnessScore}</span>
            <span className="text-[10px] text-gray-400 uppercase font-bold">Current Rating</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="block text-base font-bold text-white">{accuracyPct}%</span>
            <span className="text-[10px] text-gray-400">Accuracy</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="block text-base font-bold text-amber-300">{updatedProgress.streakDays} Days</span>
            <span className="text-[10px] text-gray-400">Streak</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="block text-base font-bold text-white">
              {Math.round(session.totalTimeSpentMs / 1000)}s
            </span>
            <span className="text-[10px] text-gray-400">Duration</span>
          </div>

        </div>

        {/* Belt Rank Indicator */}
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mb-6 flex items-center gap-3 text-left">
          <Award className="w-6 h-6 text-violet-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-violet-300 block">Rank Level</span>
            <span className="text-sm font-bold text-white">{updatedProgress.beltRank}</span>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="gradient-btn w-full justify-center text-sm py-3"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
