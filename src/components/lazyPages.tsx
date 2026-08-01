import React, { Suspense, lazy, type ComponentType } from 'react';

/** Lightweight Bright Focus fallback for lazy-loaded tabs/modals (no heavy assets). */
export const PageSuspenseFallback: React.FC = () => (
  <div
    className="w-full max-w-3xl mx-auto px-4 py-16 min-h-[40vh] flex flex-col items-center justify-center gap-4"
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <div
      className="w-10 h-10 rounded-2xl animate-pulse"
      style={{
        background: 'linear-gradient(145deg, #17a89a, #0f766e)',
        boxShadow: '0 8px 20px rgba(15,118,110,0.22)',
      }}
    />
    <div
      className="w-full max-w-md h-24 rounded-2xl animate-pulse"
      style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
    />
  </div>
);

/**
 * Fallback for lazy-loaded modals/drawers. The real modals render their own
 * `fixed inset-0 z-50` backdrop, so the Suspense fallback must match that
 * shape — otherwise, while the chunk is downloading, the fallback renders
 * inline wherever the component sits in the tree (a sibling of `<main>` /
 * `<footer>` in App.tsx) instead of as a dimmed overlay, causing a jarring
 * layout shift / content flash behind the rest of the page.
 */
const ModalSuspenseFallback: React.FC = () => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <div
      className="surface max-w-md w-full p-6 flex flex-col items-center gap-4"
      style={{ minHeight: '220px', justifyContent: 'center' }}
    >
      <div
        className="w-10 h-10 rounded-2xl animate-pulse"
        style={{
          background: 'linear-gradient(145deg, #17a89a, #0f766e)',
          boxShadow: '0 8px 20px rgba(15,118,110,0.22)',
        }}
      />
      <div
        className="w-full h-16 rounded-2xl animate-pulse"
        style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
      />
    </div>
  </div>
);

function withSuspense<P extends object>(
  LazyComp: ComponentType<P>,
  fallback: React.ReactNode = <PageSuspenseFallback />,
): ComponentType<P> {
  const Wrapped = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComp {...props} />
    </Suspense>
  );
  return Wrapped;
}

export const LazyAnalyticsPage = withSuspense(
  lazy(() => import('./AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))),
);
export const LazyGamesArcade = withSuspense(
  lazy(() => import('./GamesArcade').then((m) => ({ default: m.GamesArcade }))),
);
export const LazySkillCatalog = withSuspense(
  lazy(() => import('./SkillCatalog').then((m) => ({ default: m.SkillCatalog }))),
);
export const LazyWittChatModal = withSuspense(
  lazy(() => import('./WittChatModal').then((m) => ({ default: m.WittChatModal }))),
  <ModalSuspenseFallback />,
);
export const LazySessionHistoryModal = withSuspense(
  lazy(() => import('./SessionHistoryModal').then((m) => ({ default: m.SessionHistoryModal }))),
  <ModalSuspenseFallback />,
);
// Always mounted (see App.tsx) and usually renders null (earn-gated + dismissible),
// so it gets no visible fallback — a full page/modal skeleton would otherwise
// flash on every app load before this resolves to nothing.
export const LazyInstallPrompt = withSuspense(
  lazy(() => import('./InstallPrompt').then((m) => ({ default: m.InstallPrompt }))),
  null,
);
export const LazyUpgradeModal = withSuspense(
  lazy(() => import('./UpgradeModal').then((m) => ({ default: m.UpgradeModal }))),
  <ModalSuspenseFallback />,
);
export const LazyAccountModal = withSuspense(
  lazy(() => import('./AccountModal').then((m) => ({ default: m.AccountModal }))),
  <ModalSuspenseFallback />,
);
export const LazySessionSummaryModal = withSuspense(
  lazy(() => import('./SessionSummaryModal').then((m) => ({ default: m.SessionSummaryModal }))),
  <ModalSuspenseFallback />,
);
