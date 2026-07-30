import React, { useState } from 'react';
import { Flame, Shield, Award, Zap, Brain, Volume2, VolumeX, Grid, Bot, Gamepad2, MessageSquare, Download, Mic } from 'lucide-react';
import type { UserProgress } from '../types';
import { isSoundMuted, setSoundMuted, playClickSound } from '../services/sound';

interface NavbarProps {
  progress: UserProgress;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLaunchMemoryGame: () => void;
  onOpenWittChat: () => void;
  onOpenHistoryModal: () => void;
  onOpenVoiceDrill: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  progress,
  activeTab,
  setActiveTab,
  onLaunchMemoryGame,
  onOpenWittChat,
  onOpenHistoryModal,
  onOpenVoiceDrill,
}) => {
  const [muted, setMuted] = useState<boolean>(isSoundMuted());

  const handleToggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setSoundMuted(nextMuted);
    if (!nextMuted) playClickSound();
  };

  const handleTabClick = (tab: string) => {
    playClickSound();
    setActiveTab(tab);
  };

  return (
    <header className="w-full border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          tabIndex={0}
          role="button"
          aria-label="Go to Dashboard Home"
          onClick={() => handleTabClick('dashboard')} 
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTabClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group focus-ring rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Brain className="w-6 h-6 text-white animate-pulse-glow" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              SENWITT <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">PHASE 2</span>
            </span>
            <p className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-medium">Cognitive OS</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Application Navigation" className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Daily Set
          </button>

          <button
            onClick={() => handleTabClick('arcade')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 font-semibold focus-ring ${
              activeTab === 'arcade'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-indigo-300 hover:text-white hover:bg-indigo-500/20'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>15 Games</span>
          </button>

          <button
            onClick={onOpenVoiceDrill}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-1 border border-rose-500/30 bg-rose-500/10 focus-ring"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Voice Drill</span>
          </button>

          <button
            onClick={() => handleTabClick('skills')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring ${
              activeTab === 'skills'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Skill Library
          </button>

          <button
            onClick={() => handleTabClick('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 focus-ring ${
              activeTab === 'studio'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-violet-300 hover:text-white hover:bg-violet-500/20'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span>Agent Studio</span>
          </button>

          <button
            onClick={onLaunchMemoryGame}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1 border border-cyan-500/30 bg-cyan-500/10 focus-ring"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spatial Game</span>
          </button>

          <button
            onClick={() => handleTabClick('progress')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all focus-ring ${
              activeTab === 'progress'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Analytics & Belt
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Ask Witt AI Coach Button */}
          <button
            onClick={onOpenWittChat}
            aria-label="Open Witt AI Coach Companion Chat"
            className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/20 focus-ring"
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-300" />
            <span className="hidden sm:inline">Ask Witt</span>
          </button>

          {/* Export Data & History Button */}
          <button
            onClick={onOpenHistoryModal}
            title="Export Session Data & CSV"
            aria-label="Open Session History and Data Export Modal"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
          >
            <Download className="w-4 h-4 text-gray-300" />
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            aria-label={muted ? 'Unmute Audio Effects' : 'Mute Audio Effects'}
            title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus-ring"
          >
            {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Sharpness Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
            <span>{progress.sharpnessScore}</span>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{progress.streakDays}d</span>
            {progress.streakShields > 0 && (
              <span className="flex items-center text-[10px] text-emerald-400 gap-0.5 ml-0.5">
                <Shield className="w-3 h-3 fill-emerald-400/20" />
                {progress.streakShields}
              </span>
            )}
          </div>

          {/* Belt Rank Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium">
            <Award className="w-4 h-4 text-violet-400" />
            <span>{progress.beltRank.split(' ')[0]}</span>
          </div>

        </div>

      </div>
    </header>
  );
};
