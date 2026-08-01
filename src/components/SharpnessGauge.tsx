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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(15, 39, 68, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
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
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="55%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#ff5c3a" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Zap className="w-5 h-5 mb-0.5" style={{ color: 'var(--accent-teal)', fill: 'rgba(20,184,166,0.2)' }} />
        <span
          className="font-black text-2xl tracking-tight leading-none"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          {score}
        </span>
        <span
          className="text-[10px] uppercase font-extrabold tracking-wider mt-0.5"
          style={{ color: 'var(--accent-teal)' }}
        >
          Sharpness
        </span>
      </div>
    </div>
  );
};
