import React, { useState } from 'react';
import {
  Flame, Award, Brain, Volume2, VolumeX, Gamepad2,
  MessageSquare, History, Home, Library, ChartLine, UserCircle,
} from 'lucide-react';
import type { UserProgress } from '../types';
import { isSoundMuted, setSoundMuted, getSoundVolume, setSoundVolume, playClickSound } from '../services/sound';
import { isTestModeEnabled } from '../services/entitlements';

interface NavbarProps {
  progress: UserProgress;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWittChat: () => void;
  onOpenHistoryModal: () => void;
  onOpenAccount: () => void;
  isSignedIn?: boolean;
  hideBottomNav?: boolean;
}

const NAV_TABS = [
  { id: 'dashboard', label: 'Train', icon: Home },
  { id: 'arcade', label: 'Games', icon: Gamepad2 },
  { id: 'skills', label: 'Skills', icon: Library },
  { id: 'progress', label: 'Progress', icon: ChartLine },
];

export const Navbar: React.FC<NavbarProps> = ({
  progress,
  activeTab,
  setActiveTab,
  onOpenWittChat,
  onOpenHistoryModal,
  onOpenAccount,
  isSignedIn = false,
  hideBottomNav = false,
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
    <>
      <header
        className="w-full sticky top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.9)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between"
          style={{ height: 'var(--navbar-height)' }}
        >
          <div
            tabIndex={0}
            role="button"
            aria-label="Go to Train home"
            onClick={() => handleTabClick('dashboard')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTabClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group focus-ring rounded-xl p-1 shrink-0"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{ background: 'linear-gradient(145deg, #14b8a6, #0f766e)', boxShadow: '0 6px 16px rgba(15,118,110,0.28)' }}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)',
                }}
              >
                SENWITT
              </span>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Daily Brain Training
              </p>
            </div>
            {isTestModeEnabled() && (
              <span
                className="hidden sm:inline-flex text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg"
                style={{
                  background: '#fff7ed',
                  color: '#c2410c',
                  border: '1px solid #fdba74',
                }}
                title="VITE_TEST_MODE unlocks Premium features locally. Set to false before production."
              >
                Test mode
              </span>
            )}
          </div>

          <nav
            aria-label="Main Application Navigation"
            className="hidden lg:flex items-center gap-1 p-1 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 focus-ring flex items-center gap-1.5"
                  style={{
                    background: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWittChat}
              title="Ask Witt"
              aria-label="Open Witt coach tips chat"
              className="p-2 rounded-xl transition-all focus-ring"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--accent-teal)' }}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenHistoryModal}
              title="Session History"
              aria-label="Open session history and data export"
              className="p-2 rounded-xl transition-all focus-ring"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAccount}
              title="Account & sync"
              aria-label="Open account and cloud sync settings"
              className="p-2 rounded-xl transition-all focus-ring"
              style={{
                background: isSignedIn ? '#ccfbf1' : 'var(--bg-secondary)',
                border: `1px solid ${isSignedIn ? '#99f6e4' : 'var(--border-color)'}`,
                color: isSignedIn ? 'var(--accent-teal)' : 'var(--text-secondary)',
              }}
            >
              <UserCircle className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              <button
                onClick={handleToggleSound}
                onMouseEnter={() => setShowVolumeSlider(true)}
                aria-label={muted ? 'Unmute Audio Effects' : 'Mute Audio Effects'}
                className="p-2 rounded-xl transition-all focus-ring"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                {muted
                  ? <VolumeX className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  : <Volume2 className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} />
                }
              </button>

              {showVolumeSlider && (
                <div
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute top-12 right-0 surface p-3 rounded-xl flex items-center gap-2 z-50 animate-fadeIn"
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-teal)' }} />
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', accentColor: 'var(--accent-teal)' }}
                  />
                  <span className="text-[10px] font-mono w-8 font-bold" style={{ color: 'var(--accent-teal)' }}>
                    {muted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              )}
            </div>

            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold"
              style={{ background: '#fff1ed', border: '1px solid #ffd4c8', color: 'var(--accent-coral)' }}
            >
              <Flame className="w-3.5 h-3.5" style={{ fill: 'var(--accent-coral)' }} />
              <span>{progress.streakDays}</span>
            </div>

            <div
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{progress.beltRank.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      </header>

      {!hideBottomNav && (
        <nav className="bottom-nav items-stretch" aria-label="Mobile navigation">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`bottom-nav-item ${isActive ? 'active' : ''} focus-ring`}
                onClick={() => handleTabClick(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};
