import React from 'react';
import { Zap } from 'lucide-react';

interface SharpnessGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
}

export const SharpnessGauge: React.FC<SharpnessGaugeProps> = ({ score, maxScore = 1000, size = 160 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        
        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Dynamic Progress Gradient Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#sharpnessGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />

        <defs>
          <linearGradient id="sharpnessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Text Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20 mb-0.5 animate-pulse-glow" />
        <span className="font-heading font-black text-2xl text-white tracking-tight leading-none">
          {score}
        </span>
        <span className="text-[10px] uppercase font-bold text-indigo-300/80 tracking-wider mt-0.5">
          Sharpness
        </span>
      </div>
    </div>
  );
};
