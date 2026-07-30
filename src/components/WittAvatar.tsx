import React from 'react';
import { Sparkles, Brain, Zap, CheckCircle2 } from 'lucide-react';

interface WittAvatarProps {
  mood?: 'encouraging' | 'sharp' | 'challenging' | 'celebratory';
  size?: 'sm' | 'md' | 'lg';
}

export const WittAvatar: React.FC<WittAvatarProps> = ({ mood = 'encouraging', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses}`}>
      
      {/* Outer Rotating Glowing Ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 opacity-60 blur-md animate-pulse-glow" />

      {/* Inner Avatar Core */}
      <div className={`relative z-10 ${sizeClasses} rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 border border-white/20 flex items-center justify-center shadow-xl animate-float`}>
        {mood === 'celebratory' ? (
          <CheckCircle2 className={`${iconSizes} text-emerald-300`} />
        ) : mood === 'sharp' ? (
          <Zap className={`${iconSizes} text-cyan-300 fill-cyan-300/20`} />
        ) : mood === 'challenging' ? (
          <Brain className={`${iconSizes} text-amber-300`} />
        ) : (
          <Sparkles className={`${iconSizes} text-indigo-200`} />
        )}
      </div>

    </div>
  );
};
