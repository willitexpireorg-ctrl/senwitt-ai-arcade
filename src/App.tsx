import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ExercisePlayer } from './components/ExercisePlayer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkoutRunner } from './components/WorkoutRunner';
import {
  LazyAnalyticsPage,
  LazyGamesArcade,
  LazySkillCatalog,
  LazyWittChatModal,
  LazySessionHistoryModal,
  LazyInstallPrompt,
  LazyUpgradeModal,
  LazyAccountModal,
  LazySessionSummaryModal,
} from './components/lazyPages';
import {
  LazyBriefRecallDrill,
  LazyClearerSentenceDrill,
  LazyNumberSenseDrill,
  LazyBrevityCutDrill,
  LazyQuickPurchaseDrill,
  LazySequenceOrderDrill,
  LazyRsvpReaderDrill,
  LazySpeedMatchDrill,
  LazySignalSweepDrill,
  LazyPatternShiftDrill,
  LazySynonymRaceDrill,
  LazyTonePickDrill,
  LazyFocusTrackDrill,
  LazyRoutePlannerDrill,
  LazyInboxTriageDrill,
  LazyDualNBackGame,
  LazySpatialMemoryGame,
  LazyStroopDrill,
  LazyLogicInferenceDrill,
  LazyVoiceFluencyDrill,
  LazyBaselineAssessment,
} from './components/engines/lazyEngines';
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
  hasTrainedToday,
  type ActiveWorkoutState,
  type HabitPreferencesPartial,
} from './services/storage';
import { buildDailyWorkoutPlan } from './services/dailyWorkoutPlan';
import { EXERCISE_BANK, getSkillPracticeSet } from './data/exerciseBank';
import type { GameSpec } from './services/researchAgent';
import { Phase2MultiAgentOrchestrator } from './services/phase2Orchestrator';
import { tierFromTheta, tierLabel } from './services/difficultyFeel';
import {
  scheduleReminderCheck,
  notifyDailyReadyIfDue,
  postReminderScheduleToSw,
} from './services/reminderScheduler';
import { onAuthStateChange } from './services/authService';
import { ensureProfile, pullAndMerge, pushSoon, resetSyncState, setSyncUser } from './services/syncService';
import { refreshWebPushTimezone, subscribeWebPush, unsubscribeWebPush } from './services/webPush';
import {
  refreshEntitlement,
  subscribeEntitlement,
  canAccessWeekendLong,
  getIsPremium,
} from './services/entitlements';
import type { Session } from '@supabase/supabase-js';

type ArcadeMode =
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
  | 'synonym_race'
  | 'tone_pick'
  | 'attention_track'
  | 'route_plan'
  | 'inbox_triage'
  | null;

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
  synonym_race: 'writing',
  tone_pick: 'writing',
  attention_track: 'reasoning',
  route_plan: 'reasoning',
  inbox_triage: 'reasoning',
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

const arcadeIntensityNote = (
  modeName: string,
  opts: { spatialGridSize: number; nBackLevel: number; stroopTrialCount: number },
): string | null => {
  if (modeName === 'spatial' && opts.spatialGridSize >= 4) {
    return 'Arcade used a larger 4×4 grid — a higher spatial setting based on your memory level.';
  }
  if (modeName === 'dual_nback' && opts.nBackLevel >= 2) {
    return `Arcade ran Dual ${opts.nBackLevel}-Back — a higher working-memory setting from your recent level.`;
  }
  if (modeName === 'stroop' && opts.stroopTrialCount > 10) {
    return `Arcade used ${opts.stroopTrialCount} Stroop trials — a longer set from your reasoning level.`;
  }
  return null;
};

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(getStoredProgress);
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>(getSessionHistory);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [abilityTheta, setAbilityTheta] = useState(() => getStoredAbilityProfile().theta);

  const abilityOrchestrator = useMemo(
    () => new Phase2MultiAgentOrchestrator(getStoredAbilityProfile()),
    [],
  );

  const [activeSessionMode, setActiveSessionMode] = useState<SetMode | null>(null);
  const [activeSessionItems, setActiveSessionItems] = useState<ReturnType<typeof getSkillPracticeSet>>([]);
  const [runningWorkout, setRunningWorkout] = useState<ActiveWorkoutState | null>(null);
  const [pausedWorkout, setPausedWorkout] = useState<ActiveWorkoutState | null>(() => getActiveWorkout());
  const [activeGameMode, setActiveGameMode] = useState<ArcadeMode>(null);

  const [completedSession, setCompletedSession] = useState<SessionResult | null>(null);
  const [sessionAbilityBefore, setSessionAbilityBefore] = useState<{ theta: number } | null>(null);
  const [sessionAbilityAfter, setSessionAbilityAfter] = useState<{ theta: number } | null>(null);
  const [sessionArcadeNote, setSessionArcadeNote] = useState<string | null>(null);
  const [isWittChatOpen, setIsWittChatOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isVoiceDrillOpen, setIsVoiceDrillOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(() => getIsPremium());
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeModalFromCheckout, setUpgradeModalFromCheckout] = useState<boolean>(false);

  const refreshFromStorage = useCallback(() => {
    setProgress(getStoredProgress());
    setSessionHistory(getSessionHistory());
    const pulledAbility = getStoredAbilityProfile();
    setAbilityTheta(pulledAbility.theta);
    // Keep the long-lived orchestrator instance in sync too, otherwise it
    // keeps calibrating from its stale pre-pull profile and would silently
    // clobber the just-imported ability data on the next completed session.
    abilityOrchestrator.setAbilityProfile(pulledAbility);
  }, [abilityOrchestrator]);

  useEffect(() => {
    setProgress(getStoredProgress());
    setSessionHistory(getSessionHistory());
    setPausedWorkout(getActiveWorkout());
    setAbilityTheta(getStoredAbilityProfile().theta);
  }, []);

  // Daily reminder polling while app is open (Page Visibility + 60s interval).
  useEffect(() => {
    return scheduleReminderCheck(() => {
      const p = getStoredProgress();
      notifyDailyReadyIfDue(p, hasTrainedToday(p));
    });
  }, []);

  // Cloud sync: subscribe to auth state; when signed in, pull remote data (if
  // newer) and refresh local React state, otherwise push local data up.
  useEffect(() => {
    const unsubscribe = onAuthStateChange((nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        const userId = nextSession.user.id;
        setSyncUser(userId);
        void refreshEntitlement(userId);
        void ensureProfile(userId, nextSession.user.email ?? null)
          .then(() => pullAndMerge(userId))
          .then((result) => {
            if (result.imported) refreshFromStorage();
          });
      } else {
        resetSyncState();
        void refreshEntitlement(null);
      }
    });
    return unsubscribe;
  }, [refreshFromStorage]);

  // Keep local isPremium state mirrored to the entitlements cache (updated by
  // sign-in/out above and by the Upgrade modal's "Refresh entitlement" action).
  useEffect(() => subscribeEntitlement(setIsPremium), []);

  // Stripe Checkout redirects back with `?checkout=success` — surface the
  // Upgrade modal so the user can confirm/refresh, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setUpgradeModalFromCheckout(true);
      setIsUpgradeModalOpen(true);
      params.delete('checkout');
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', nextUrl);
    }
  }, []);

  // Keep SW in sync when reminder prefs change (including disable).
  useEffect(() => {
    if (progress.reminderEnabled && progress.reminderTime) {
      void postReminderScheduleToSw(progress.reminderTime, true);
    } else {
      void postReminderScheduleToSw(progress.reminderTime ?? '09:00', false);
    }
  }, [progress.reminderEnabled, progress.reminderTime]);

  // Refresh stored timezone offset while reminders are on so DST / travel
  // don't leave the cron sender using a stale offset. Cheap upsert; no-op
  // when signed out, unsupported, or not subscribed.
  useEffect(() => {
    if (!session?.user.id || !progress.reminderEnabled) return;
    const userId = session.user.id;
    const refresh = () => {
      void refreshWebPushTimezone(userId);
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    const intervalId = window.setInterval(refresh, 6 * 60 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(intervalId);
    };
  }, [session?.user.id, progress.reminderEnabled]);

  const excludeIds = useMemo(() => recentItemIds(sessionHistory), [sessionHistory]);

  const memoryLevel = progress.skills.memory?.level ?? 1;
  const reasoningLevel = progress.skills.reasoning?.level ?? 1;
  const spatialGridSize = memoryLevel >= 5 ? 4 : 3;
  const nBackLevel = Math.min(3, Math.max(1, Math.floor((memoryLevel + 1) / 2)));
  const stroopTrialCount = Math.min(16, 10 + Math.floor(reasoningLevel / 2));
  const stroopFeedbackMs = Math.max(280, 450 - (reasoningLevel - 1) * 30);
  const difficultyTier = tierFromTheta(abilityTheta);
  const difficultyTierLabel = tierLabel(difficultyTier);

  const runningWorkoutRef = useRef<ActiveWorkoutState | null>(null);
  runningWorkoutRef.current = runningWorkout;

  const handleCompleteSession = useCallback((result: SessionResult, opts?: { arcadeNote?: string | null }) => {
    const before = { theta: abilityOrchestrator.getAbilityProfile().theta };
    result.attempts.forEach((att) => {
      abilityOrchestrator.processRepResult(att.isCorrect, att.timeSpentMs);
    });
    const afterProfile = abilityOrchestrator.getAbilityProfile();
    saveAbilityProfile(afterProfile);
    setAbilityTheta(afterProfile.theta);

    let updated = recordSessionCompletion(result);
    if (!updated.earnedInstallPrompt) {
      updated = markInstallPromptEarned();
    }
    setProgress(updated);
    setSessionHistory(getSessionHistory());
    setActiveSessionMode(null);
    setActiveSessionItems([]);
    const completedMixedWorkout = Boolean(runningWorkoutRef.current);
    setRunningWorkout(null);
    if (completedMixedWorkout) {
      setPausedWorkout(null);
      clearActiveWorkout();
    }
    setSessionAbilityBefore(before);
    setSessionAbilityAfter({ theta: afterProfile.theta });
    setSessionArcadeNote(opts?.arcadeNote ?? null);
    setCompletedSession(result);
    pushSoon();
  }, [abilityOrchestrator]);

  const handleBaselineComplete = useCallback((profile: BaselineProfile) => {
    const updated = completeBaselineAssessment(profile);
    setProgress(updated);
    pushSoon();
  }, []);

  const handleCommitMinutes = useCallback((m: 2 | 5 | 10) => {
    setProgress(updateHabitPreferences({ dailyMinutesGoal: m }));
    pushSoon();
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
    setProgress(updated);
    setRunningWorkout(state);
    setPausedWorkout(state);
    saveActiveWorkout(state);
    pushSoon();
  }, []);

  const handleSaveHabitPrefs = useCallback((partial: HabitPreferencesPartial) => {
    setProgress(updateHabitPreferences(partial));
    pushSoon();
    // Web Push opt-in/out follows the same toggle as the in-app reminder —
    // both are graceful no-ops when signed out / unsupported / unconfigured.
    if ('reminderEnabled' in partial) {
      if (partial.reminderEnabled) {
        void subscribeWebPush(session?.user.id);
      } else {
        void unsubscribeWebPush();
      }
    }
  }, [session]);

  const handleStartSet = (mode: SetMode) => {
    if (mode === 'weekend_long' && !canAccessWeekendLong()) {
      setIsUpgradeModalOpen(true);
      return;
    }
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
  };

  const handleLaunchArcadeGame = (game: GameSpec) => {
    const mechanicToMode: Partial<Record<GameSpec['mechanicType'], ArcadeMode>> = {
      visual_grid: 'spatial',
      dual_nback: 'dual_nback',
      stroop: 'stroop',
      logic_deduction: 'logic_deduction',
      brief_recall: 'brief_recall',
      clearer_sentence: 'clearer_sentence',
      number_sense: 'number_sense',
      brevity_cut: 'brevity_cut',
      quick_purchase: 'quick_purchase',
      sequence_order: 'sequence_order',
      rsvp_reader: 'rsvp_reader',
      speed_match: 'speed_match',
      signal_sweep: 'signal_sweep',
      pattern_shift: 'pattern_shift',
      synonym_race: 'synonym_race',
      tone_pick: 'tone_pick',
      attention_track: 'attention_track',
      route_plan: 'route_plan',
      inbox_triage: 'inbox_triage',
    };

    if (game.mechanicType === 'voice_drill') {
      setIsVoiceDrillOpen(true);
      return;
    }

    const mode = mechanicToMode[game.mechanicType];
    if (mode) {
      setActiveGameMode(mode);
      setActiveSessionMode(null);
      return;
    }

    setActiveSessionItems(getSkillPracticeSet(game.category, 3, EXERCISE_BANK, { excludeIds }));
    setActiveSessionMode('coffee_break');
  };

  type CustomGameResult = { scoreEarned: number; correctCount: number; totalItems: number; totalTimeMs: number };

  const handleCustomGameComplete = (
    result: CustomGameResult,
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
    const note = arcadeIntensityNote(modeName, { spatialGridSize, nBackLevel, stroopTrialCount });
    handleCompleteSession(session, { arcadeNote: note });
  };

  // Engines like DualNBackGame list `onComplete` in an effect's dependency
  // array (to advance/finish trials). Passing a fresh inline lambda here on
  // every App re-render would recreate that prop identity and re-run those
  // effects mid-step, resetting timers/flags. Route through a ref so each
  // arcade mode gets one stable callback for the component's lifetime while
  // still always calling the latest `handleCustomGameComplete` closure.
  const handleCustomGameCompleteRef = useRef(handleCustomGameComplete);
  handleCustomGameCompleteRef.current = handleCustomGameComplete;

  const arcadeOnComplete = useMemo(() => {
    const wrap = (modeName: string) => (result: CustomGameResult) =>
      handleCustomGameCompleteRef.current(result, modeName);
    return {
      spatial: wrap('spatial'),
      dual_nback: wrap('dual_nback'),
      stroop: wrap('stroop'),
      logic_deduction: wrap('logic_deduction'),
      brief_recall: wrap('brief_recall'),
      clearer_sentence: wrap('clearer_sentence'),
      number_sense: wrap('number_sense'),
      brevity_cut: wrap('brevity_cut'),
      quick_purchase: wrap('quick_purchase'),
      sequence_order: wrap('sequence_order'),
      rsvp_reader: wrap('rsvp_reader'),
      speed_match: wrap('speed_match'),
      signal_sweep: wrap('signal_sweep'),
      pattern_shift: wrap('pattern_shift'),
      synonym_race: wrap('synonym_race'),
      tone_pick: wrap('tone_pick'),
      attention_track: wrap('attention_track'),
      route_plan: wrap('route_plan'),
      inbox_triage: wrap('inbox_triage'),
    } as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCancelSession = () => {
    setActiveSessionMode(null);
    setActiveSessionItems([]);
    setActiveGameMode(null);
  };

  const handleCancelWorkout = () => {
    setRunningWorkout((prev) => {
      if (prev) {
        saveActiveWorkout(prev);
        setPausedWorkout(prev);
      }
      return null;
    });
  };

  const workoutRunning =
    Boolean(runningWorkout) &&
    !activeGameMode &&
    !isVoiceDrillOpen &&
    !(activeSessionMode && activeSessionItems.length > 0);

  const inSession = Boolean(
    runningWorkout || activeSessionMode || activeGameMode || isVoiceDrillOpen,
  );
  const needsBaseline = !progress.baselineCompleted;

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
        onOpenAccount={() => setIsAccountModalOpen(true)}
        isSignedIn={Boolean(session)}
        hideBottomNav={inSession || needsBaseline}
      />

      <main className="flex-1 w-full pb-[calc(var(--bottom-nav-height)+1.25rem)] lg:pb-16 relative z-10">
        <ErrorBoundary>
          {needsBaseline ? (
            <LazyBaselineAssessment
              onComplete={handleBaselineComplete}
              onCommitMinutes={handleCommitMinutes}
              onSkipToWorkout={handleSkipBaselineToWorkout}
            />
          ) : activeGameMode === 'spatial' ? (
            <LazySpatialMemoryGame
              gridSize={spatialGridSize}
              onComplete={arcadeOnComplete.spatial}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'dual_nback' ? (
            <LazyDualNBackGame
              nLevel={nBackLevel}
              onComplete={arcadeOnComplete.dual_nback}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'stroop' ? (
            <LazyStroopDrill
              trialCount={stroopTrialCount}
              feedbackMs={stroopFeedbackMs}
              onComplete={arcadeOnComplete.stroop}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'logic_deduction' ? (
            <LazyLogicInferenceDrill
              onComplete={arcadeOnComplete.logic_deduction}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'brief_recall' ? (
            <LazyBriefRecallDrill
              onComplete={arcadeOnComplete.brief_recall}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'clearer_sentence' ? (
            <LazyClearerSentenceDrill
              onComplete={arcadeOnComplete.clearer_sentence}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'number_sense' ? (
            <LazyNumberSenseDrill
              onComplete={arcadeOnComplete.number_sense}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'brevity_cut' ? (
            <LazyBrevityCutDrill
              onComplete={arcadeOnComplete.brevity_cut}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'quick_purchase' ? (
            <LazyQuickPurchaseDrill
              onComplete={arcadeOnComplete.quick_purchase}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'sequence_order' ? (
            <LazySequenceOrderDrill
              onComplete={arcadeOnComplete.sequence_order}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'rsvp_reader' ? (
            <LazyRsvpReaderDrill
              onComplete={arcadeOnComplete.rsvp_reader}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'speed_match' ? (
            <LazySpeedMatchDrill
              onComplete={arcadeOnComplete.speed_match}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'signal_sweep' ? (
            <LazySignalSweepDrill
              onComplete={arcadeOnComplete.signal_sweep}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'pattern_shift' ? (
            <LazyPatternShiftDrill
              onComplete={arcadeOnComplete.pattern_shift}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'synonym_race' ? (
            <LazySynonymRaceDrill
              onComplete={arcadeOnComplete.synonym_race}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'tone_pick' ? (
            <LazyTonePickDrill
              onComplete={arcadeOnComplete.tone_pick}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'attention_track' ? (
            <LazyFocusTrackDrill
              onComplete={arcadeOnComplete.attention_track}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'route_plan' ? (
            <LazyRoutePlannerDrill
              onComplete={arcadeOnComplete.route_plan}
              onCancel={handleCancelSession}
            />
          ) : activeGameMode === 'inbox_triage' ? (
            <LazyInboxTriageDrill
              onComplete={arcadeOnComplete.inbox_triage}
              onCancel={handleCancelSession}
            />
          ) : workoutRunning && runningWorkout ? (
            <WorkoutRunner
              plan={runningWorkout.plan}
              initialStepIndex={runningWorkout.stepIndex}
              initialAttempts={runningWorkout.attempts}
              onComplete={(s) => handleCompleteSession(s)}
              onCancel={handleCancelWorkout}
              onProgress={handleWorkoutProgress}
              abilityTheta={abilityTheta}
            />
          ) : activeSessionMode && activeSessionItems.length > 0 ? (
            <ExercisePlayer
              items={activeSessionItems}
              setMode={activeSessionMode}
              onComplete={(s) => handleCompleteSession(s)}
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
                  difficultyTierLabel={difficultyTierLabel}
                  isPremium={isPremium}
                  onRequestUpgrade={() => setIsUpgradeModalOpen(true)}
                />
              )}

              {activeTab === 'arcade' && (
                <LazyGamesArcade
                  onLaunchGame={handleLaunchArcadeGame}
                  progress={progress}
                  isPremium={isPremium}
                  onRequestUpgrade={() => setIsUpgradeModalOpen(true)}
                />
              )}

              {activeTab === 'skills' && (
                <LazySkillCatalog
                  progress={progress}
                  onStartSkillPractice={handleStartSkillPractice}
                />
              )}

              {activeTab === 'progress' && (
                <LazyAnalyticsPage
                  progress={progress}
                  sessionHistory={sessionHistory}
                  abilityTheta={abilityTheta}
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
        <LazySessionSummaryModal
          session={completedSession}
          updatedProgress={progress}
          onClose={() => {
            setCompletedSession(null);
            setSessionAbilityBefore(null);
            setSessionAbilityAfter(null);
            setSessionArcadeNote(null);
          }}
          onSaveHabitPrefs={handleSaveHabitPrefs}
          abilityBefore={sessionAbilityBefore ?? undefined}
          abilityAfter={sessionAbilityAfter ?? undefined}
          arcadeIntensityNote={sessionArcadeNote}
        />
      )}

      {isWittChatOpen && (
        <LazyWittChatModal
          progress={progress}
          isPremium={isPremium}
          onClose={() => setIsWittChatOpen(false)}
        />
      )}

      {isHistoryModalOpen && (
        <LazySessionHistoryModal
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
        <LazyVoiceFluencyDrill
          onClose={() => setIsVoiceDrillOpen(false)}
          onComplete={handleVoiceComplete}
        />
      )}

      {isAccountModalOpen && (
        <LazyAccountModal
          session={session}
          onClose={() => setIsAccountModalOpen(false)}
          onDataImported={refreshFromStorage}
          isPremium={isPremium}
          onOpenUpgrade={() => {
            setIsAccountModalOpen(false);
            setIsUpgradeModalOpen(true);
          }}
        />
      )}

      {isUpgradeModalOpen && (
        <LazyUpgradeModal
          session={session}
          isPremium={isPremium}
          onClose={() => {
            setIsUpgradeModalOpen(false);
            setUpgradeModalFromCheckout(false);
          }}
          onOpenAccount={() => {
            setIsUpgradeModalOpen(false);
            setIsAccountModalOpen(true);
          }}
          showRefreshHint={upgradeModalFromCheckout}
          onEntitlementRefreshed={setIsPremium}
        />
      )}

      <LazyInstallPrompt earnedInstallPrompt={Boolean(progress.earnedInstallPrompt)} />

      <footer className="w-full border-t border-[var(--border-color)] py-6 text-center text-xs relative z-10" style={{ color: 'var(--text-muted)' }}>
        <p>© 2026 SENWITT — 5 minutes a day to keep your thinking sharp.</p>
      </footer>
    </div>
  );
};

export default App;
