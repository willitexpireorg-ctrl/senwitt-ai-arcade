import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { InstallPrompt } from './components/InstallPrompt';
import { BaselineAssessment } from './components/BaselineAssessment';
import { BriefRecallDrill } from './components/engines/BriefRecallDrill';
import { ClearerSentenceDrill } from './components/engines/ClearerSentenceDrill';
import { NumberSenseDrill } from './components/engines/NumberSenseDrill';
import { BrevityCutDrill } from './components/engines/BrevityCutDrill';
import { QuickPurchaseDrill } from './components/engines/QuickPurchaseDrill';
import { SequenceOrderDrill } from './components/engines/SequenceOrderDrill';
import { RsvpReaderDrill } from './components/engines/RsvpReaderDrill';
import { SpeedMatchDrill } from './components/engines/SpeedMatchDrill';
import { SignalSweepDrill } from './components/engines/SignalSweepDrill';
import { PatternShiftDrill } from './components/engines/PatternShiftDrill';
import { WorkoutRunner } from './components/WorkoutRunner';
import type { UserProgress, SessionResult, SetMode, SkillCategory, AttemptResult, BaselineProfile } from './types';
import {
  getStoredProgress,
  recordSessionCompletion,
  getSessionHistory,
  getLocalDateString,
  getStoredAbilityProfile,
  saveAbilityProfile,
  completeBaselineAssessment,
  getActiveWorkout,
  saveActiveWorkout,
  clearActiveWorkout,
  updateHabitPreferences,
  markInstallPromptEarned,
  deferBaselineWithDefaults,
  type ActiveWorkoutState,
  type HabitPreferencesPartial,
} from './services/storage';
import { buildDailyWorkoutPlan } from './services/dailyWorkoutPlan';
import { EXERCISE_BANK, getSkillPracticeSet } from './data/exerciseBank';
import type { GameSpec } from './services/researchAgent';
import { Phase2MultiAgentOrchestrator } from './services/phase2Orchestrator';

const ARCADE_SKILL: Record<string, SkillCategory> = {
  spatial: 'memory',
  dual_nback: 'memory',
  stroop: 'reasoning',
  logic_deduction: 'reasoning',
  voice: 'writing',
  brief_recall: 'memory',
  clearer_sentence: 'writing',
  number_sense: 'math',
  brevity_cut: 'writing',
  quick_purchase: 'math',
  sequence_order: 'memory',
  rsvp_reader: 'reading',
  speed_match: 'reasoning',
  signal_sweep: 'reasoning',
  pattern_shift: 'reasoning',
};

const recentItemIds = (history: SessionResult[], limit = 80): string[] => {
  const ids: string[] = [];
  for (const session of history) {
    for (const att of session.attempts) {
      ids.push(att.itemId);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
};

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(getStoredProgress);
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>(getSessionHistory);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const abilityOrchestrator = useMemo(
    () => new Phase2MultiAgentOrchestrator(getStoredAbilityProfile()),
    [],
  );

  /** Skill-practice MCQ path (unchanged) — separate from mixed daily workouts. */
  const [activeSessionMode, setActiveSessionMode] = useState<SetMode | null>(null);
  const [activeSessionItems, setActiveSessionItems] = useState<ReturnType<typeof getSkillPracticeSet>>([]);
  /** Currently running fullscreen workout (null until Start / Continue). */
  const [runningWorkout, setRunningWorkout] = useState<ActiveWorkoutState | null>(null);
  /** Persisted open-loop workout for Dashboard Continue CTA (not auto-fullscreen). */
  const [pausedWorkout, setPausedWorkout] = useState<ActiveWorkoutState | null>(() => getActiveWorkout());
  const [activeGameMode, setActiveGameMode] = useState<
    | 'spatial'
    | 'dual_nback'
    | 'stroop'
    | 'logic_deduction'
    | 'brief_recall'
    | 'clearer_sentence'
    | 'number_sense'
    | 'brevity_cut'
    | 'quick_purchase'
    | 'sequence_order'
    | 'rsvp_reader'
    | 'speed_match'
    | 'signal_sweep'
    | 'pattern_shift'
    | null
  >(null);

  const [completedSession, setCompletedSession] = useState<SessionResult | null>(null);
  const [isWittChatOpen, setIsWittChatOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isVoiceDrillOpen, setIsVoiceDrillOpen] = useState<boolean>(false);

  useEffect(() => {
    setProgress(getStoredProgress());
    setSessionHistory(getSessionHistory());
    // Load paused workout for Dashboard continue CTA — do not auto-fullscreen resume.
    setPausedWorkout(getActiveWorkout());
  }, []);

  const excludeIds = useMemo(() => recentItemIds(sessionHistory), [sessionHistory]);

  const memoryLevel = progress.skills.memory?.level ?? 1;
  const reasoningLevel = progress.skills.reasoning?.level ?? 1;
  const spatialGridSize = memoryLevel >= 5 ? 4 : 3;
  const nBackLevel = Math.min(3, Math.max(1, Math.floor((memoryLevel + 1) / 2)));
  const stroopTrialCount = Math.min(16, 10 + Math.floor(reasoningLevel / 2));
  const stroopFeedbackMs = Math.max(280, 450 - (reasoningLevel - 1) * 30);

  const runningWorkoutRef = useRef<ActiveWorkoutState | null>(null);
  runningWorkoutRef.current = runningWorkout;

  const handleCompleteSession = useCallback((result: SessionResult) => {
    result.attempts.forEach((att) => {
      abilityOrchestrator.processRepResult(att.isCorrect, att.timeSpentMs);
    });
    saveAbilityProfile(abilityOrchestrator.getAbilityProfile());

    let updated = recordSessionCompletion(result);
    if (!updated.earnedInstallPrompt) {
      updated = markInstallPromptEarned();
    }
    setProgress(updated);
    setSessionHistory(getSessionHistory());
    setActiveSessionMode(null);
    setActiveSessionItems([]);
    // Only clear paused daily workout when the mixed WorkoutRunner finishes.
    // Arcade / skill-practice completion must not wipe an open-loop daily set.
    const completedMixedWorkout = Boolean(runningWorkoutRef.current);
    setRunningWorkout(null);
    if (completedMixedWorkout) {
      setPausedWorkout(null);
      clearActiveWorkout();
    }
    setCompletedSession(result);
  }, [abilityOrchestrator]);

  const handleBaselineComplete = useCallback((profile: BaselineProfile) => {
    const updated = completeBaselineAssessment(profile);
    setProgress(updated);
  }, []);

  const handleCommitMinutes = useCallback((m: 2 | 5 | 10) => {
    setProgress(updateHabitPreferences({ dailyMinutesGoal: m }));
  }, []);

  const handleSkipBaselineToWorkout = useCallback(() => {
    let updated = deferBaselineWithDefaults();
    updated = updateHabitPreferences({ dailyMinutesGoal: 2 });
    const plan = buildDailyWorkoutPlan('coffee_break', {
      excludeIds: recentItemIds(getSessionHistory()),
      date: getLocalDateString(),
      baselineProfile: updated.baselineProfile,
    });
    const state: ActiveWorkoutState = {
      plan,
      stepIndex: 0,
      attempts: [],
      startedAt: new Date().toISOString(),
    };
    // Batch progress + workout in the same event so we don't flash the dashboard.
    setProgress(updated);
    setRunningWorkout(state);
    setPausedWorkout(state);
    saveActiveWorkout(state);
  }, []);

  const handleSaveHabitPrefs = useCallback((partial: HabitPreferencesPartial) => {
    setProgress(updateHabitPreferences(partial));
  }, []);

  const handleStartSet = (mode: SetMode) => {
    const plan = buildDailyWorkoutPlan(mode, {
      excludeIds,
      date: getLocalDateString(),
      baselineProfile: progress.baselineProfile,
    });
    const state: ActiveWorkoutState = {
      plan,
      stepIndex: 0,
      attempts: [],
      startedAt: new Date().toISOString(),
    };
    setRunningWorkout(state);
    setPausedWorkout(state);
    saveActiveWorkout(state);
    setActiveSessionMode(null);
    setActiveSessionItems([]);
    setActiveGameMode(null);
  };

  const handleContinueWorkout = () => {
    const stored = getActiveWorkout() ?? pausedWorkout;
    if (stored && stored.stepIndex < stored.plan.steps.length) {
      setRunningWorkout(stored);
      setPausedWorkout(stored);
      setActiveGameMode(null);
      setActiveSessionMode(null);
      setActiveSessionItems([]);
    }
  };

  const handleDiscardWorkout = () => {
    setRunningWorkout(null);
    setPausedWorkout(null);
    clearActiveWorkout();
  };

  const handleWorkoutProgress = useCallback(
    (state: { stepIndex: number; attempts: AttemptResult[] }) => {
      setRunningWorkout((prev) => {
        if (!prev) return prev;
        const next: ActiveWorkoutState = {
          ...prev,
          stepIndex: state.stepIndex,
          attempts: state.attempts,
        };
        saveActiveWorkout(next);
        setPausedWorkout(next);
        return next;
      });
    },
    [],
  );

  const handleStartSkillPractice = (skill: SkillCategory) => {
    setActiveSessionItems(getSkillPracticeSet(skill, 3, EXERCISE_BANK, { excludeIds }));
    setActiveSessionMode('coffee_break');
    setActiveGameMode(null);
    // Keep paused workout in storage; skill practice is a side path.
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
    } else if (game.mechanicType === 'brief_recall') {
      setActiveGameMode('brief_recall');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'clearer_sentence') {
      setActiveGameMode('clearer_sentence');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'number_sense') {
      setActiveGameMode('number_sense');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'brevity_cut') {
      setActiveGameMode('brevity_cut');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'quick_purchase') {
      setActiveGameMode('quick_purchase');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'sequence_order') {
      setActiveGameMode('sequence_order');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'rsvp_reader') {
      setActiveGameMode('rsvp_reader');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'speed_match') {
      setActiveGameMode('speed_match');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'signal_sweep') {
      setActiveGameMode('signal_sweep');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'pattern_shift') {
      setActiveGameMode('pattern_shift');
      setActiveSessionMode(null);
    } else if (game.mechanicType === 'voice_drill') {
      setIsVoiceDrillOpen(true);
    } else {
      setActiveSessionItems(getSkillPracticeSet(game.category, 3, EXERCISE_BANK, { excludeIds }));
      setActiveSessionMode('coffee_break');
    }
  };

  const handleCustomGameComplete = (
    result: { scoreEarned: number; correctCount: number; totalItems: number; totalTimeMs: number },
    modeName: string,
  ) => {
    setActiveGameMode(null);
    const category = ARCADE_SKILL[modeName] ?? 'memory';
    const { scoreEarned, totalTimeMs } = result;
    const totalItems = Math.max(1, result.totalItems);
    const correctCount = Math.min(totalItems, Math.max(0, result.correctCount));
    const timePerAttempt = Math.max(1, Math.round(totalTimeMs / totalItems));
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
      totalTimeSpentMs: Math.max(totalTimeMs, totalItems * timePerAttempt),
      sharpnessDelta: Math.max(5, Math.floor(scoreEarned / 10)),
      finalSharpness: 0,
      attempts,
    };
    handleCompleteSession(session);
  };

  const handleVoiceComplete = (result: {
    scoreEarned: number;
    correctCount: number;
    totalItems: number;
    totalTimeMs: number;
    spokenText: string;
  }) => {
    setIsVoiceDrillOpen(false);
    handleCustomGameComplete(result, 'voice');
  };

  /** Arcade / skill-practice cancel — does not wipe a paused daily workout. */
  const handleCancelSession = () => {
    setActiveSessionMode(null);
    setActiveSessionItems([]);
    setActiveGameMode(null);
  };

  /**
   * Workout Exit: leave the open loop in storage (Zeigarnik) so Dashboard can
   * offer Continue. "Start over" on Dashboard is the explicit discard path.
   */
  const handleCancelWorkout = () => {
    setRunningWorkout((prev) => {
      if (prev) {
        saveActiveWorkout(prev);
        setPausedWorkout(prev);
      }
      return null;
    });
  };

  /** Fullscreen runner only after explicit Start / Continue — not on mount. */
  const workoutRunning =
    Boolean(runningWorkout) &&
    !activeGameMode &&
    !isVoiceDrillOpen &&
    !(activeSessionMode && activeSessionItems.length > 0);

  const inSession = Boolean(
    runningWorkout || activeSessionMode || activeGameMode || isVoiceDrillOpen,
  );
  const needsBaseline = !progress.baselineCompleted;

  /** Dashboard CTA: paused open-loop workout for today (Zeigarnik). */
  const dashboardActiveWorkout =
    pausedWorkout &&
    pausedWorkout.stepIndex < pausedWorkout.plan.steps.length &&
    pausedWorkout.plan.date === getLocalDateString()
      ? pausedWorkout
      : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col selection:bg-teal-200 selection:text-teal-950 relative">
      <Navbar
        progress={progress}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWittChat={() => setIsWittChatOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        hideBottomNav={inSession || needsBaseline}
      />

      <main className="flex-1 w-full pb-[calc(var(--bottom-nav-height)+1.25rem)] lg:pb-16 relative z-10">
        <ErrorBoundary>
          {needsBaseline ? (
            <BaselineAssessment
              onComplete={handleBaselineComplete}
              onCommitMinutes={handleCommitMinutes}
              onSkipToWorkout={handleSkipBaselineToWorkout}
            />
          ) : activeGameMode === 'spatial' ? (
            <SpatialMemoryGame
              gridSize={spatialGridSize}
              onComplete={(s) => handleCustomGameComplete(s, 'spatial')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'dual_nback' ? (
            <DualNBackGame
              nLevel={nBackLevel}
              onComplete={(s) => handleCustomGameComplete(s, 'dual_nback')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'stroop' ? (
            <StroopDrill
              trialCount={stroopTrialCount}
              feedbackMs={stroopFeedbackMs}
              onComplete={(s) => handleCustomGameComplete(s, 'stroop')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'logic_deduction' ? (
            <LogicInferenceDrill
              onComplete={(s) => handleCustomGameComplete(s, 'logic_deduction')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'brief_recall' ? (
            <BriefRecallDrill
              onComplete={(s) => handleCustomGameComplete(s, 'brief_recall')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'clearer_sentence' ? (
            <ClearerSentenceDrill
              onComplete={(s) => handleCustomGameComplete(s, 'clearer_sentence')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'number_sense' ? (
            <NumberSenseDrill
              onComplete={(s) => handleCustomGameComplete(s, 'number_sense')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'brevity_cut' ? (
            <BrevityCutDrill
              onComplete={(s) => handleCustomGameComplete(s, 'brevity_cut')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'quick_purchase' ? (
            <QuickPurchaseDrill
              onComplete={(s) => handleCustomGameComplete(s, 'quick_purchase')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'sequence_order' ? (
            <SequenceOrderDrill
              onComplete={(s) => handleCustomGameComplete(s, 'sequence_order')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'rsvp_reader' ? (
            <RsvpReaderDrill
              onComplete={(s) => handleCustomGameComplete(s, 'rsvp_reader')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'speed_match' ? (
            <SpeedMatchDrill
              onComplete={(s) => handleCustomGameComplete(s, 'speed_match')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'signal_sweep' ? (
            <SignalSweepDrill
              onComplete={(s) => handleCustomGameComplete(s, 'signal_sweep')}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'pattern_shift' ? (
            <PatternShiftDrill
              onComplete={(s) => handleCustomGameComplete(s, 'pattern_shift')}
              onCancel={handleCancelSession}
            />
          ) : workoutRunning && runningWorkout ? (
            <WorkoutRunner
              plan={runningWorkout.plan}
              initialStepIndex={runningWorkout.stepIndex}
              initialAttempts={runningWorkout.attempts}
              onComplete={handleCompleteSession}
              onCancel={handleCancelWorkout}
              onProgress={handleWorkoutProgress}
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
                  sessionHistory={sessionHistory}
                  onStartSet={handleStartSet}
                  onSelectSkill={handleStartSkillPractice}
                  activeWorkout={dashboardActiveWorkout}
                  onContinueWorkout={handleContinueWorkout}
                  onDiscardWorkout={handleDiscardWorkout}
                  onSaveHabitPrefs={handleSaveHabitPrefs}
                  onOpenGames={() => setActiveTab('arcade')}
                />
              )}

              {activeTab === 'arcade' && (
                <GamesArcade
                  onLaunchGame={handleLaunchArcadeGame}
                  progress={progress}
                />
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
                  onStartDaily={() => {
                    if (dashboardActiveWorkout) handleContinueWorkout();
                    else handleStartSet('daily');
                  }}
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
          onSaveHabitPrefs={handleSaveHabitPrefs}
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
        <VoiceFluencyDrill
          onClose={() => setIsVoiceDrillOpen(false)}
          onComplete={handleVoiceComplete}
        />
      )}

      <InstallPrompt earnedInstallPrompt={Boolean(progress.earnedInstallPrompt)} />

      <footer className="w-full border-t border-[var(--border-color)] py-6 text-center text-xs relative z-10" style={{ color: 'var(--text-muted)' }}>
        <p>© 2026 SENWITT — 5 minutes a day to keep your thinking sharp.</p>
      </footer>
    </div>
  );
};

export default App;
