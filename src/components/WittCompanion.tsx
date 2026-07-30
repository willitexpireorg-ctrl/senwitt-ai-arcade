import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import type { UserProgress, SkillCategory } from '../types';
import { WittAvatar } from './WittAvatar';

interface WittCompanionProps {
  progress: UserProgress;
  onSelectSkill: (skill: SkillCategory) => void;
}

export const WittCompanion: React.FC<WittCompanionProps> = ({ progress, onSelectSkill }) => {
  const skillEntries = Object.entries(progress.skills) as [SkillCategory, any][];
  const sortedSkills = skillEntries.sort((a, b) => a[1].score - b[1].score);
  const targetRecommendation = sortedSkills[0][0];

  const getNudgeMessage = () => {
    if (progress.streakDays > 5) {
      return `Outstanding 5+ day consistency! Your neural pathways in ${targetRecommendation.toUpperCase()} are prime for a level up today.`;
    }
    if (progress.sharpnessScore > 750) {
      return `Your overall Sharpness is in the top 15th percentile of knowledge workers. Let's sharpen your ${targetRecommendation} reps!`;
    }
    return `AI delegates the answer, but your brain builds the muscle. Take 5 minutes to complete today's Set!`;
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 border border-indigo-500/30 shadow-2xl">
      
      {/* Background glow circle */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-5 relative z-10">
        
        {/* Animated Witt Avatar */}
        <WittAvatar mood={progress.streakDays > 3 ? 'sharp' : 'encouraging'} size="md" />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-heading font-extrabold text-white text-lg tracking-tight">Witt</span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              AI Cognitive Companion
            </span>
          </div>

          <p className="text-sm text-gray-200 mb-4 leading-relaxed font-medium">
            "{getNudgeMessage()}"
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectSkill(targetRecommendation)}
              className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-2 transition-all bg-indigo-500/20 hover:bg-indigo-500/30 px-4 py-2 rounded-xl border border-indigo-500/40 shadow-md shadow-indigo-500/20"
            >
              <Lightbulb className="w-4 h-4 text-indigo-400" />
              <span>Practice Recommended {targetRecommendation.toUpperCase()} Reps</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
