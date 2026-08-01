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
      <div
        className="absolute inset-0 rounded-2xl opacity-50 blur-md animate-pulse-glow"
        style={{ background: 'linear-gradient(135deg, #14b8a6, #ff5c3a)' }}
      />
      <div
        className={`relative z-10 ${sizeClasses} rounded-2xl flex items-center justify-center shadow-lg animate-float`}
        style={{
          background: 'linear-gradient(145deg, #17a89a 0%, #0f766e 100%)',
          border: '2px solid rgba(255,255,255,0.55)',
        }}
      >
        {mood === 'celebratory' ? (
          <CheckCircle2 className={`${iconSizes} text-emerald-100`} />
        ) : mood === 'sharp' ? (
          <Zap className={`${iconSizes} text-cyan-100`} style={{ fill: 'rgba(165,243,252,0.25)' }} />
        ) : mood === 'challenging' ? (
          <Brain className={`${iconSizes} text-amber-100`} />
        ) : (
          <Sparkles className={`${iconSizes} text-teal-50`} />
        )}
      </div>
    </div>
  );
};
