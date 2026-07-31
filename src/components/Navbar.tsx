import React, { useState } from 'react';
import { Flame, Award, Brain, Volume2, VolumeX, Gamepad2, MessageSquare, History } from 'lucide-react';
import type { UserProgress } from '../types';
import { isSoundMuted, setSoundMuted, getSoundVolume, setSoundVolume, playClickSound } from '../services/sound';

interface NavbarProps {
  progress: UserProgress;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWittChat: () => void;
  onOpenHistoryModal: () => void;
}

const NAV_TABS = [
  { id: 'dashboard', label: 'Daily Set', icon: null },
  { id: 'arcade', label: 'Games', icon: Gamepad2 },
  { id: 'skills', label: 'Skill Library', icon: null },
  { id: 'progress', label: 'Progress', icon: null },
];

export const Navbar: React.FC<NavbarProps> = ({
  progress,
  activeTab,
  setActiveTab,
  onOpenWittChat,
  onOpenHistoryModal,
}) => {
  const [muted, setMuted] = useState<boolean>(isSoundMuted());
  const [volume, setVol] = useState<number>(getSoundVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const handleToggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setSoundMuted(nextMuted);
    if (!nextMuted) playClickSound();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVol(val);
    setSoundVolume(val);
    if (val > 0 && muted) {
      setMuted(false);
      setSoundMuted(false);
    }
  };

  const handleTabClick = (tab: string) => {
    playClickSound();
    setActiveTab(tab);
  };

  return (
    <header
      style={{
        background: 'rgba(6, 10, 18, 0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
      }}
      className="w-full sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between"
        style={{ height: '64px' }}>

        {/* ── Brand Logo ─────────────────────────────────────── */}
        <div
          tabIndex={0}
          role="button"
          aria-label="Go to Dashboard Home"
          onClick={() => handleTabClick('dashboard')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTabClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group focus-ring rounded-xl p-1 shrink-0"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0891b2 0%, #059669 100%)' }}
          >
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span
              style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#f0f4ff' }}
            >
              SENWITT
            </span>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              Daily Brain Training
            </p>
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────────── */}
        <nav
          aria-label="Main Application Navigation"
          className="hidden lg:flex items-center gap-0.5 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 focus-ring flex items-center gap-1.5"
                style={{
                  background: isActive ? 'rgba(6,182,212,0.85)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {Icon && <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'white' : undefined }} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right Controls ──────────────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Ask Witt (small icon) */}
          <button
            onClick={onOpenWittChat}
            title="Ask Witt"
            aria-label="Open Witt coach tips chat"
            className="p-2 rounded-xl transition-all focus-ring"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(196,181,253,0.85)' }}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* History */}
          <button
            onClick={onOpenHistoryModal}
            title="Session History & Export"
            aria-label="Open session history and data export"
            className="p-2 rounded-xl transition-all focus-ring"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <div className="relative flex items-center">
            <button
              onClick={handleToggleSound}
              onMouseEnter={() => setShowVolumeSlider(true)}
              aria-label={muted ? 'Unmute Audio Effects' : 'Mute Audio Effects'}
              className="p-2 rounded-xl transition-all focus-ring"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {muted
                ? <VolumeX className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                : <Volume2 className="w-4 h-4" style={{ color: '#67e8f9' }} />
              }
            </button>

            {showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute top-12 right-0 glass-panel p-3 rounded-xl flex items-center gap-2 z-50 animate-fadeIn"
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#67e8f9' }} />
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.15)', accentColor: '#06b6d4' }}
                />
                <span className="text-[10px] font-mono w-8 font-bold" style={{ color: '#67e8f9' }}>
                  {muted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            )}
          </div>

          {/* Streak Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}
          >
            <Flame className="w-3.5 h-3.5" style={{ fill: '#f59e0b' }} />
            <span>{progress.streakDays}d</span>
          </div>

          <div
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}
          >
            <Award className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
            <span>{progress.beltRank.split(' ')[0]}</span>
          </div>

        </div>
      </div>
    </header>
  );
};
