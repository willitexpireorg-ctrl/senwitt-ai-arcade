import React from 'react';
import type { UserProgress, SkillCategory } from '../types';

interface CognitiveRadarChartProps {
  progress: UserProgress;
  size?: number;
}

export const CognitiveRadarChart: React.FC<CognitiveRadarChartProps> = ({ progress, size = 260 }) => {
  const categories: { key: SkillCategory; label: string }[] = [
    { key: 'writing', label: 'Writing' },
    { key: 'math', label: 'Math' },
    { key: 'code', label: 'Code' },
    { key: 'memory', label: 'Memory' },
    { key: 'reading', label: 'Reading' },
    { key: 'reasoning', label: 'Logic' },
  ];

  const center = size / 2;
  const radius = size * 0.36;
  const totalAxes = categories.length;

  // Calculate coordinates for a polygon point at an angle & distance
  const getCoordinates = (index: number, valPct: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const dist = (valPct / 100) * radius;
    const x = center + dist * Math.cos(angle);
    const y = center + dist * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon background grids (25%, 50%, 75%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1.0].map((ringPct) => {
    const points = categories.map((_, idx) => {
      const { x, y } = getCoordinates(idx, ringPct * 100);
      return `${x},${y}`;
    }).join(' ');
    return points;
  });

  // User Skill Data Polygon Points
  const userPoints = categories.map((cat, idx) => {
    const skill = progress.skills[cat.key] || { accuracy: 80 };
    const valPct = Math.min(100, Math.max(30, skill.accuracy));
    const { x, y } = getCoordinates(idx, valPct);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        
        {/* Background Concentric Grid Web */}
        {gridRings.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="rgba(15, 39, 68, 0.1)"
            strokeWidth="1"
          />
        ))}

        {categories.map((_, idx) => {
          const { x, y } = getCoordinates(idx, 100);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(15, 39, 68, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={userPoints}
          fill="rgba(15, 118, 110, 0.18)"
          stroke="#0f766e"
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out"
        />

        {categories.map((cat, idx) => {
          const skill = progress.skills[cat.key] || { accuracy: 80 };
          const valPct = Math.min(100, Math.max(30, skill.accuracy));
          const { x, y } = getCoordinates(idx, valPct);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              fill="#14b8a6"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {categories.map((cat, idx) => {
          const { x, y } = getCoordinates(idx, 120);
          return (
            <text
              key={idx}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#5a7088"
              fontSize="10"
              fontWeight="700"
              className="font-heading uppercase tracking-wider"
            >
              {cat.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
