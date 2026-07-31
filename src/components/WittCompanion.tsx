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
      return `Nice ${progress.streakDays}-day streak! Your ${targetRecommendation} reps are a good place to push further today.`;
    }
    if (progress.sharpnessScore > 750) {
      return `Your Sharpness score is climbing nicely. Let's keep sharpening your ${targetRecommendation} reps!`;
    }
    return `AI can give you the answer, but your brain builds the muscle. Take 5 minutes to complete today's set!`;
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden bg-slate-900/70 border border-cyan-500/20">

      <div className="flex items-start gap-5 relative z-10">
        
        {/* Animated Witt Avatar */}
        <WittAvatar mood={progress.streakDays > 3 ? 'sharp' : 'encouraging'} size="md" />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-heading font-extrabold text-white text-lg tracking-tight">Witt</span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Coach Tips
            </span>
          </div>

          <p className="text-sm text-gray-200 mb-4 leading-relaxed font-medium">
            "{getNudgeMessage()}"
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectSkill(targetRecommendation)}
              className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-2 transition-all bg-cyan-500/15 hover:bg-cyan-500/25 px-4 py-2 rounded-xl border border-cyan-500/30"
            >
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span>Practice Recommended {targetRecommendation.toUpperCase()} Reps</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
