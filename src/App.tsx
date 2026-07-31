import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SkillCatalog } from './components/SkillCatalog';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ExercisePlayer } from './components/ExercisePlayer';
import { SpatialMemoryGame } from './components/SpatialMemoryGame';
import { AgentGeneratorStudio } from './components/AgentGeneratorStudio';
import { GamesArcade } from './components/GamesArcade';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { WittChatModal } from './components/WittChatModal';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { VoiceFluencyDrill } from './components/VoiceFluencyDrill';
import { ThreeBackground } from './components/ThreeBackground';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DualNBackGame } from './components/DualNBackGame';
import { StroopDrill } from './components/StroopDrill';
import { LogicInferenceDrill } from './components/LogicInferenceDrill';
import type { UserProgress, SessionResult, SetMode, SkillCategory, ExerciseItem } from './types';
import { getStoredProgress, recordSessionCompletion, getSessionHistory } from './services/storage';
import { EXERCISE_BANK, getDailySetForMode } from './data/exerciseBank';
import { generateProceduralMathItem, generateProceduralCodeItem } from './services/proceduralGenerator';
import type { GameSpec } from './services/researchAgent';
import { Phase2MultiAgentOrchestrator } from './services/phase2Orchestrator';

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(getStoredProgress);
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>(getSessionHistory);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Multi-Agent Orchestrator Framework Instance
  const phase2Orchestrator = useMemo(() => new Phase2MultiAgentOrchestrator(0.2), []);

  // Exercise bank state
  const [customBank, setCustomBank] = useState<ExerciseItem[]>(EXERCISE_BANK);

  // Active workout session state
  const [activeSessionMode, setActiveSessionMode] = useState<SetMode | null>(null);
  const [activeSessionItems, setActiveSessionItems] = useState<ExerciseItem[]>([]);
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
    const proceduralItems = [generateProceduralMathItem(), generateProceduralCodeItem()];
    const rawItems = [...baseItems, ...proceduralItems].slice(0, mode === 'coffee_break' ? 3 : mode === 'weekend_long' ? 8 : 5);

    // Phase 2 IRT Flow-State Queue Calibration
    const calibratedItems = phase2Orchestrator.filterQueueForOptimalFlow(rawItems);

    setActiveSessionItems(calibratedItems);
    setActiveSessionMode(mode);
    setActiveGameMode(null);
  };

  const handleStartSkillPractice = (skill: SkillCategory) => {
    const matching = customBank.filter((item) => item.category === skill);
    const items = matching.length > 0 ? matching.slice(0, 3) : customBank.slice(0, 3);
    setActiveSessionItems(items);
    setActiveSessionMode('coffee_break');
    setActiveGameMode(null);
  };

  const handleLaunchSpatialGame = () => {
    setActiveGameMode('spatial');
    setActiveSessionMode(null);
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
    } else {
      const matching = customBank.filter((item) => item.category === game.category);
      const items = matching.length > 0 ? matching.slice(0, 3) : customBank.slice(0, 3);
      setActiveSessionItems(items);
      setActiveSessionMode('coffee_break');
    }
  };

  const handleCustomGameComplete = (scoreEarned: number, modeName: string) => {
    setActiveGameMode(null);
    const fakeSession: SessionResult = {
      id: `${modeName}-${Date.now()}`,
      mode: 'coffee_break',
      date: new Date().toISOString().split('T')[0],
      totalItems: 4,
      correctCount: Math.min(4, Math.max(1, Math.floor(scoreEarned / 30))),
      totalTimeSpentMs: 30000,
      sharpnessDelta: Math.max(10, Math.floor(scoreEarned / 10)),
      finalSharpness: 0,
      attempts: [],
    };
    handleCompleteSession(fakeSession);
  };

  const handleInjectAgentExercises = (newItems: ExerciseItem[]) => {
    setCustomBank((prev) => [...newItems, ...prev]);
  };

  const handleTestSingleExercise = (item: ExerciseItem) => {
    setActiveSessionItems([item]);
    setActiveSessionMode('coffee_break');
  };

  const handleCompleteSession = (result: SessionResult) => {
    // Calibrate IRT theta profile for each rep
    result.attempts.forEach((att) => {
      phase2Orchestrator.processRepResult(att.isCorrect, att.timeSpentMs);
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-white flex flex-col selection:bg-indigo-500 selection:text-white relative">
      
      {/* Interactive 3D Three.js Particle & Constellation Background */}
      <ThreeBackground />

      {/* Top Navigation */}
      <Navbar
        progress={progress}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLaunchMemoryGame={handleLaunchSpatialGame}
        onOpenWittChat={() => setIsWittChatOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenVoiceDrill={() => setIsVoiceDrillOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 relative z-10">
        <ErrorBoundary>
          {/* Active Mini-Game Overlays */}
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
            /* Active Workout Session Overlay */
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
                  onTestCustomRep={handleTestSingleExercise}
                />
              )}

              {activeTab === 'arcade' && (
                <GamesArcade
                  onLaunchGame={handleLaunchArcadeGame}
                />
              )}

              {activeTab === 'skills' && (
                <SkillCatalog
                  progress={progress}
                  onStartSkillPractice={handleStartSkillPractice}
                />
              )}

              {activeTab === 'studio' && (
                <AgentGeneratorStudio
                  onInjectExercises={handleInjectAgentExercises}
                  onTestExercise={handleTestSingleExercise}
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

      {/* Session Completion Modal */}
      {completedSession && (
        <SessionSummaryModal
          session={completedSession}
          updatedProgress={progress}
          onClose={() => setCompletedSession(null)}
        />
      )}

      {/* Witt Coach Chat Modal */}
      {isWittChatOpen && (
        <WittChatModal
          progress={progress}
          onClose={() => setIsWittChatOpen(false)}
        />
      )}

      {/* History & CSV Data Export Modal */}
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

      {/* Web Speech Voice Fluency Drill Modal */}
      {isVoiceDrillOpen && (
        <VoiceFluencyDrill
          onClose={() => setIsVoiceDrillOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border-color)] py-6 text-center text-xs text-gray-500 relative z-10">
        <p>© 2026 SENWITT AI PHASE 2 — IRT Adaptive Engine & Voice Speech Fluency</p>
      </footer>

    </div>
  );
};

export default App;
