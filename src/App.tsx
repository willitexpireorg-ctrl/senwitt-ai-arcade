import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SkillCatalog } from './components/SkillCatalog';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ExercisePlayer } from './components/ExercisePlayer';
import { SpatialMemoryGame } from './components/SpatialMemoryGame';
import { GamesArcade } from './components/GamesArcade';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { WittChatModal } from './components/WittChatModal';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { VoiceFluencyDrill } from './components/VoiceFluencyDrill';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DualNBackGame } from './components/DualNBackGame';
import { StroopDrill } from './components/StroopDrill';
import { LogicInferenceDrill } from './components/LogicInferenceDrill';
import type { UserProgress, SessionResult, SetMode, SkillCategory, AttemptResult } from './types';
import { getStoredProgress, recordSessionCompletion, getSessionHistory, getLocalDateString } from './services/storage';
import { getDailySetForMode, getSkillPracticeSet } from './data/exerciseBank';
import type { GameSpec } from './services/researchAgent';
import { Phase2MultiAgentOrchestrator } from './services/phase2Orchestrator';

const ARCADE_SKILL: Record<string, SkillCategory> = {
  spatial: 'memory',
  dual_nback: 'memory',
  stroop: 'reasoning',
  logic_deduction: 'reasoning',
};

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(getStoredProgress);
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>(getSessionHistory);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Adaptive difficulty calibration (internal ability estimate, not user-facing)
  const abilityOrchestrator = useMemo(() => new Phase2MultiAgentOrchestrator(0.2), []);

  // Active workout session state
  const [activeSessionMode, setActiveSessionMode] = useState<SetMode | null>(null);
  const [activeSessionItems, setActiveSessionItems] = useState<ReturnType<typeof getDailySetForMode>>([]);
  const [activeGameMode, setActiveGameMode] = useState<'spatial' | 'dual_nback' | 'stroop' | 'logic_deduction' | null>(null);

  // Modals state
  const [completedSession, setCompletedSession] = useState<SessionResult | null>(null);
  const [isWittChatOpen, setIsWittChatOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isVoiceDrillOpen, setIsVoiceDrillOpen] = useState<boolean>(false);

  useEffect(() => {
    setProgress(getStoredProgress());
    setSessionHistory(getSessionHistory());
  }, []);

  const handleStartSet = (mode: SetMode) => {
    const baseItems = getDailySetForMode(mode);
    const calibratedItems = abilityOrchestrator.filterQueueForOptimalFlow(baseItems);
    setActiveSessionItems(calibratedItems);
    setActiveSessionMode(mode);
    setActiveGameMode(null);
  };

  const handleStartSkillPractice = (skill: SkillCategory) => {
    setActiveSessionItems(getSkillPracticeSet(skill, 3));
    setActiveSessionMode('coffee_break');
    setActiveGameMode(null);
  };

  const handleLaunchArcadeGame = (game: GameSpec) => {
    if (game.mechanicType === 'visual_grid') {
      setActiveGameMode('spatial');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'dual_nback') {
      setActiveGameMode('dual_nback');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'stroop') {
      setActiveGameMode('stroop');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'logic_deduction') {
      setActiveGameMode('logic_deduction');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'voice_drill') {
      setIsVoiceDrillOpen(true);
    } else {
      setActiveSessionItems(getSkillPracticeSet(game.category, 3));
      setActiveSessionMode('coffee_break');
    }
  };

  const handleCustomGameComplete = (scoreEarned: number, modeName: string) => {
    setActiveGameMode(null);
    const category = ARCADE_SKILL[modeName] ?? 'memory';
    const correctCount = Math.min(4, Math.max(0, Math.floor(scoreEarned / 30)));
    const totalItems = 4;
    const timePerAttempt = 7500;
    const attempts: AttemptResult[] = Array.from({ length: totalItems }, (_, i) => ({
      itemId: `${modeName}-rep-${i + 1}`,
      category,
      isCorrect: i < correctCount,
      timeSpentMs: timePerAttempt,
      scoreEarned: i < correctCount ? Math.max(10, Math.floor(scoreEarned / Math.max(1, correctCount))) : 0,
      userAnswer: i < correctCount ? 'hit' : 'miss',
      explanation: `${modeName} arcade round`,
      timestamp: new Date().toISOString(),
    }));

    const session: SessionResult = {
      id: `${modeName}-${Date.now()}`,
      mode: 'coffee_break',
      date: getLocalDateString(),
      totalItems,
      correctCount,
      totalTimeSpentMs: totalItems * timePerAttempt,
      sharpnessDelta: Math.max(5, Math.floor(scoreEarned / 10)),
      finalSharpness: 0,
      attempts,
    };
    handleCompleteSession(session);
  };

  const handleCompleteSession = (result: SessionResult) => {
    result.attempts.forEach((att) => {
      abilityOrchestrator.processRepResult(att.isCorrect, att.timeSpentMs);
    });

    const updated = recordSessionCompletion(result);
    setProgress(updated);
    setSessionHistory(getSessionHistory());
    setActiveSessionMode(null);
    setCompletedSession(result);
  };

  const handleCancelSession = () => {
    setActiveSessionMode(null);
    setActiveSessionItems([]);
    setActiveGameMode(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white flex flex-col selection:bg-cyan-500/40 selection:text-white relative">
      <Navbar
        progress={progress}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWittChat={() => setIsWittChatOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
      />

      <main className="flex-1 pb-16 relative z-10">
        <ErrorBoundary>
          {activeGameMode === 'spatial' ? (
            <SpatialMemoryGame
              onComplete={(s) => handleCustomGameComplete(s, 'spatial')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'dual_nback' ? (
            <DualNBackGame
              onComplete={(s) => handleCustomGameComplete(s, 'dual_nback')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'stroop' ? (
            <StroopDrill
              onComplete={(s) => handleCustomGameComplete(s, 'stroop')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'logic_deduction' ? (
            <LogicInferenceDrill
              onComplete={(s) => handleCustomGameComplete(s, 'logic_deduction')}
              onCancel={handleCancelSession}
            />
          ) : activeSessionMode && activeSessionItems.length > 0 ? (
            <ExercisePlayer
              items={activeSessionItems}
              setMode={activeSessionMode}
              onComplete={handleCompleteSession}
              onCancel={handleCancelSession}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  progress={progress}
                  onStartSet={handleStartSet}
                  onSelectSkill={handleStartSkillPractice}
                />
              )}

              {activeTab === 'arcade' && (
                <GamesArcade onLaunchGame={handleLaunchArcadeGame} />
              )}

              {activeTab === 'skills' && (
                <SkillCatalog
                  progress={progress}
                  onStartSkillPractice={handleStartSkillPractice}
                />
              )}

              {activeTab === 'progress' && (
                <AnalyticsPage
                  progress={progress}
                  sessionHistory={sessionHistory}
                />
              )}
            </>
          )}
        </ErrorBoundary>
      </main>

      {completedSession && (
        <SessionSummaryModal
          session={completedSession}
          updatedProgress={progress}
          onClose={() => setCompletedSession(null)}
        />
      )}

      {isWittChatOpen && (
        <WittChatModal
          progress={progress}
          onClose={() => setIsWittChatOpen(false)}
        />
      )}

      {isHistoryModalOpen && (
        <SessionHistoryModal
          history={sessionHistory}
          progress={progress}
          onClose={() => setIsHistoryModalOpen(false)}
          onRefreshData={() => {
            setProgress(getStoredProgress());
            setSessionHistory(getSessionHistory());
          }}
        />
      )}

      {isVoiceDrillOpen && (
        <VoiceFluencyDrill onClose={() => setIsVoiceDrillOpen(false)} />
      )}

      <footer className="w-full border-t border-[var(--border-color)] py-6 text-center text-xs text-gray-500 relative z-10">
        <p>© 2026 SENWITT — 5 minutes a day to keep your thinking sharp.</p>
      </footer>
    </div>
  );
};

export default App;
