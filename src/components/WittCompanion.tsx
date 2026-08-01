import React from 'react';
import { Lightbulb, ArrowRight, Play } from 'lucide-react';
import type { UserProgress, SkillCategory } from '../types';
import { WittAvatar } from './WittAvatar';
import type { MomentumStatus } from '../services/sessionInsights';

interface WittCompanionProps {
  progress: UserProgress;
  onSelectSkill: (skill: SkillCategory) => void;
  momentum?: MomentumStatus;
  onStartDaily?: () => void;
  trainedToday?: boolean;
  canContinue?: boolean;
}

export const WittCompanion: React.FC<WittCompanionProps> = ({
  progress,
  onSelectSkill,
  momentum,
  onStartDaily,
  trainedToday = false,
  canContinue = false,
}) => {
  const skillEntries = Object.entries(progress.skills) as [SkillCategory, { score: number }][];
  const sortedSkills = skillEntries.sort((a, b) => a[1].score - b[1].score);
  const targetRecommendation = sortedSkills[0][0];

  const getNudgeMessage = () => {
    if (trainedToday && !canContinue) {
      return `You already trained today. A light ${targetRecommendation} practice is optional — rest is part of the loop.`;
    }
    if (canContinue) {
      return `Your workout is still open. Continue where you left off, or warm up with ${targetRecommendation}.`;
    }
    if (momentum && momentum.daysThisWeek >= momentum.target) {
      return `Momentum ${momentum.daysThisWeek}/${momentum.target} this week — you\u2019ve hit your target! A bonus round on ${targetRecommendation} keeps it rolling.`;
    }
    if (progress.streakDays > 0 && progress.streakDays % 7 === 0) {
      return `Week milestone! You’ve got ${progress.streakShields} streak shield${progress.streakShields === 1 ? '' : 's'}. Keep ${targetRecommendation} warm today.`;
    }
    if (progress.streakDays > 5) {
      return `Nice ${progress.streakDays}-day streak! Your ${targetRecommendation} reps are a good place to push further today.`;
    }
    if (momentum && momentum.daysThisWeek < momentum.target) {
      return `Momentum ${momentum.daysThisWeek}/${momentum.target} this week. One more session on ${targetRecommendation} keeps you on pace.`;
    }
    if (progress.sharpnessScore > 750) {
      return `Your Sharpness score is climbing. Tomorrow’s sets will lean a bit harder — warm up with ${targetRecommendation}.`;
    }
    const mins = progress.dailyMinutesGoal === 2 || progress.dailyMinutesGoal === 10
      ? progress.dailyMinutesGoal
      : 5;
    return `Tools can give answers — your brain builds the muscle. Take ~${mins} minutes for today's set, starting with ${targetRecommendation}.`;
  };

  const primaryLabel = canContinue
    ? 'Continue workout'
    : trainedToday
      ? 'Bonus coffee break'
      : "Start today's workout";

  return (
    <div className="surface p-5 sm:p-6 relative">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10">
        <WittAvatar mood={progress.streakDays > 3 ? 'sharp' : 'encouraging'} size="md" />

        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Witt
            </span>
            <span
              className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
              style={{ background: '#ccfbf1', color: 'var(--accent-teal)', border: '1px solid #99f6e4' }}
            >
              Coach tip
            </span>
          </div>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: 1.55,
              fontWeight: 600,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            &ldquo;{getNudgeMessage()}&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {onStartDaily && (
              <button
                type="button"
                onClick={onStartDaily}
                className="btn-3d btn-3d-coral text-xs px-4 py-2.5 inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" style={{ fill: 'white' }} />
                <span>{primaryLabel}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectSkill(targetRecommendation)}
              className="text-xs font-extrabold inline-flex items-center justify-center gap-2 transition-all px-4 py-2.5 rounded-xl focus-ring"
              style={{
                background: 'transparent',
                color: 'var(--accent-teal)',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span style={{ whiteSpace: 'normal' }}>Practice {targetRecommendation}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
