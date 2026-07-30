import React from 'react';
import { Award, Flame, CheckCircle, TrendingUp, ShieldCheck, Sparkles, Eye, Zap, Shield } from 'lucide-react';
import type { UserProgress, SessionResult, SkillCategory } from '../types';
import { SharpnessGauge } from './SharpnessGauge';
import { CognitiveRadarChart } from './CognitiveRadarChart';
import { GestaltHierarchyAgent, BehavioralHabitAgent, CognitiveFrictionAgent, NeuroAestheticAgent } from '../services/uiPsychologyAgents';

interface AnalyticsPageProps {
  progress: UserProgress;
  sessionHistory: SessionResult[];
}

const BELT_THRESHOLDS = [
  { rank: 'White Belt (Initiate)', minScore: 300, minSessions: 0 },
  { rank: 'Yellow Belt (Focus Practitioner)', minScore: 700, minSessions: 2 },
  { rank: 'Green Belt (Logic Specialist)', minScore: 740, minSessions: 8 },
  { rank: 'Blue Belt (Cognitive Architect)', minScore: 780, minSessions: 18 },
  { rank: 'Purple Belt (Neural Strategist)', minScore: 840, minSessions: 30 },
  { rank: 'Black Belt (Master Mind)', minScore: 900, minSessions: 50 },
];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ progress, sessionHistory: _sessionHistory }) => {
  const categories: SkillCategory[] = ['writing', 'math', 'code', 'memory', 'reading', 'reasoning'];

  const uiReports = [
    GestaltHierarchyAgent.auditUI(),
    BehavioralHabitAgent.auditUI(),
    CognitiveFrictionAgent.auditUI(),
    NeuroAestheticAgent.auditUI(),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2">Cognitive Analytics & Neuro-Design</h1>
        <p className="text-gray-400 text-sm">
          Track your long-term Sharpness trajectory, 6-axis skill balance, and behavioral progression toward Black Belt mastery.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Sharpness Radial Gauge Card */}
        <div className="glass-panel p-6 border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-slate-900/70 flex flex-col items-center justify-center text-center shadow-xl">
          <SharpnessGauge score={progress.sharpnessScore} maxScore={1000} size={150} />
          <p className="text-xs text-gray-300 mt-4 font-medium">
            Top 12% among knowledge workers. Based on speed, accuracy & rep difficulty.
          </p>
        </div>

        {/* Belt Rank Card */}
        <div className="glass-panel p-6 border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-slate-900/70 flex flex-col justify-between shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-400 block tracking-wider">Current Belt Status</span>
              <h3 className="text-lg font-bold text-white leading-snug">{progress.beltRank}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-300 mb-4">
            Earn higher belts by maintaining daily streak consistency and raising overall Sharpness.
          </p>
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-700"
              style={{ width: `${Math.min(100, (progress.sharpnessScore / 1000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Streak & Consistency */}
        <div className="glass-panel p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/50 to-slate-900/70 flex flex-col justify-between shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
              <Flame className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Habit Loop</span>
              <h3 className="text-2xl font-black text-white">{progress.streakDays} Days <span className="text-xs font-semibold text-amber-300">Streak</span></h3>
            </div>
          </div>
          <p className="text-xs text-gray-300 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            {progress.streakShields} Streak Shields active to protect your habit loop.
          </p>
        </div>

      </div>

      {/* Spider Radar Chart & Skill Accuracy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Radar Chart Card */}
        <div className="glass-panel p-6 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            6-Axis Cognitive Radar Balance
          </div>
          <CognitiveRadarChart progress={progress} size={250} />
          <p className="text-[11px] text-gray-400 mt-4 max-w-xs">
            Visualizes neural strength symmetry across Writing, Math, Code, Memory, Reading, and Logic.
          </p>
        </div>

        {/* Skill Accuracy Bars */}
        <div className="lg:col-span-2 glass-panel p-6 border-white/10 shadow-2xl flex flex-col justify-between">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Skill Mastery & Accuracy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const skill = progress.skills[cat] || { level: 1, score: 700, accuracy: 100, totalReps: 0 };
              return (
                <div key={cat} className="bg-white/5 border border-white/10 rounded-2xl p-4.5 hover:border-indigo-500/30 transition-colors">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="capitalize text-white">{cat}</span>
                    <span className="text-indigo-300">{skill.accuracy}% Accuracy</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-500"
                      style={{ width: `${skill.accuracy}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                    <span>Level {skill.level} ({skill.score} pts)</span>
                    <span>{skill.totalReps} Reps</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* UI Psychology Subagent Audit Panel */}
      <div className="glass-panel p-6 mb-8 border-violet-500/30 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-violet-400" />
          UI Psychology & Behavioral Subagent Audit Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uiReports.map((report, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" /> {report.agentName}
                </span>
                <span className="text-xs font-extrabold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                  {report.score}% Score
                </span>
              </div>
              <p className="text-[11px] text-violet-300 font-semibold uppercase tracking-wider">
                Focus: {report.psychologicalFocus}
              </p>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Belt Ladder Table */}
      <div className="glass-panel p-6 mb-8 border-white/10 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Belt Rank Pathway</h2>
        <div className="space-y-3">
          {BELT_THRESHOLDS.map((belt, idx) => {
            const isUnlocked = progress.sharpnessScore >= belt.minScore && progress.totalSessions >= belt.minSessions;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isUnlocked
                    ? 'bg-white/5 border-indigo-500/40 text-white shadow-md'
                    : 'bg-white/2 border-white/5 text-gray-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Award className={`w-5 h-5 ${isUnlocked ? 'text-indigo-400' : 'text-gray-600'}`} />
                  <span className="font-semibold text-sm">{belt.rank}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span>Score: {belt.minScore}+</span>
                  <span>Sessions: {belt.minSessions}+</span>
                  {isUnlocked ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-gray-500">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
