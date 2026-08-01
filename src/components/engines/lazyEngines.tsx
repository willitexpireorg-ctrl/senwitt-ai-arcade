import React, { Suspense, lazy, type ComponentType } from 'react';

/** Bright Focus spinner/skeleton while a heavy engine chunk loads. */
export const EngineSuspenseFallback: React.FC = () => (
  <div
    className="w-full max-w-3xl mx-auto px-4 py-16 min-h-[50vh] flex flex-col items-center justify-center gap-4"
    role="status"
    aria-live="polite"
    aria-label="Loading drill"
  >
    <div
      className="w-12 h-12 rounded-2xl animate-pulse"
      style={{
        background: 'linear-gradient(145deg, #17a89a, #0f766e)',
        boxShadow: '0 8px 20px rgba(15,118,110,0.22)',
      }}
    />
    <p
      className="text-sm font-extrabold"
      style={{ color: 'var(--text-secondary)' }}
    >
      Loading drill…
    </p>
    <div
      className="w-full max-w-md h-32 rounded-2xl animate-pulse"
      style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
    />
  </div>
);

/**
 * VoiceFluencyDrill renders as a `fixed inset-0 z-50` overlay modal (unlike the
 * other engines here, which are full-page tab content). Give it a matching
 * overlay fallback so the loading state doesn't flash as an inline block
 * among App.tsx's flex-column siblings (main/footer) while the chunk loads.
 */
const ModalEngineSuspenseFallback: React.FC = () => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    role="status"
    aria-live="polite"
    aria-label="Loading drill"
  >
    <div
      className="surface max-w-xl w-full p-6 md:p-8 flex flex-col items-center gap-4"
      style={{ minHeight: '260px', justifyContent: 'center' }}
    >
      <div
        className="w-12 h-12 rounded-2xl animate-pulse"
        style={{
          background: 'linear-gradient(145deg, #17a89a, #0f766e)',
          boxShadow: '0 8px 20px rgba(15,118,110,0.22)',
        }}
      />
      <div
        className="w-full h-24 rounded-2xl animate-pulse"
        style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
      />
    </div>
  </div>
);

function withSuspense<P extends object>(
  LazyComp: ComponentType<P>,
  fallback: React.ReactNode = <EngineSuspenseFallback />,
): ComponentType<P> {
  const Wrapped = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComp {...props} />
    </Suspense>
  );
  return Wrapped;
}

export const LazyBriefRecallDrill = withSuspense(
  lazy(() => import('./BriefRecallDrill').then((m) => ({ default: m.BriefRecallDrill }))),
);
export const LazyClearerSentenceDrill = withSuspense(
  lazy(() => import('./ClearerSentenceDrill').then((m) => ({ default: m.ClearerSentenceDrill }))),
);
export const LazyNumberSenseDrill = withSuspense(
  lazy(() => import('./NumberSenseDrill').then((m) => ({ default: m.NumberSenseDrill }))),
);
export const LazyBrevityCutDrill = withSuspense(
  lazy(() => import('./BrevityCutDrill').then((m) => ({ default: m.BrevityCutDrill }))),
);
export const LazyQuickPurchaseDrill = withSuspense(
  lazy(() => import('./QuickPurchaseDrill').then((m) => ({ default: m.QuickPurchaseDrill }))),
);
export const LazySequenceOrderDrill = withSuspense(
  lazy(() => import('./SequenceOrderDrill').then((m) => ({ default: m.SequenceOrderDrill }))),
);
export const LazyRsvpReaderDrill = withSuspense(
  lazy(() => import('./RsvpReaderDrill').then((m) => ({ default: m.RsvpReaderDrill }))),
);
export const LazySpeedMatchDrill = withSuspense(
  lazy(() => import('./SpeedMatchDrill').then((m) => ({ default: m.SpeedMatchDrill }))),
);
export const LazySignalSweepDrill = withSuspense(
  lazy(() => import('./SignalSweepDrill').then((m) => ({ default: m.SignalSweepDrill }))),
);
export const LazyPatternShiftDrill = withSuspense(
  lazy(() => import('./PatternShiftDrill').then((m) => ({ default: m.PatternShiftDrill }))),
);
export const LazySynonymRaceDrill = withSuspense(
  lazy(() => import('./SynonymRaceDrill').then((m) => ({ default: m.SynonymRaceDrill }))),
);
export const LazyTonePickDrill = withSuspense(
  lazy(() => import('./TonePickDrill').then((m) => ({ default: m.TonePickDrill }))),
);
export const LazyFocusTrackDrill = withSuspense(
  lazy(() => import('./FocusTrackDrill').then((m) => ({ default: m.FocusTrackDrill }))),
);
export const LazyRoutePlannerDrill = withSuspense(
  lazy(() => import('./RoutePlannerDrill').then((m) => ({ default: m.RoutePlannerDrill }))),
);
export const LazyInboxTriageDrill = withSuspense(
  lazy(() => import('./InboxTriageDrill').then((m) => ({ default: m.InboxTriageDrill }))),
);

export const LazyDualNBackGame = withSuspense(
  lazy(() => import('../DualNBackGame').then((m) => ({ default: m.DualNBackGame }))),
);
export const LazySpatialMemoryGame = withSuspense(
  lazy(() => import('../SpatialMemoryGame').then((m) => ({ default: m.SpatialMemoryGame }))),
);
export const LazyStroopDrill = withSuspense(
  lazy(() => import('../StroopDrill').then((m) => ({ default: m.StroopDrill }))),
);
export const LazyLogicInferenceDrill = withSuspense(
  lazy(() => import('../LogicInferenceDrill').then((m) => ({ default: m.LogicInferenceDrill }))),
);
export const LazyVoiceFluencyDrill = withSuspense(
  lazy(() => import('../VoiceFluencyDrill').then((m) => ({ default: m.VoiceFluencyDrill }))),
  <ModalEngineSuspenseFallback />,
);
export const LazyBaselineAssessment = withSuspense(
  lazy(() => import('../BaselineAssessment').then((m) => ({ default: m.BaselineAssessment }))),
);
