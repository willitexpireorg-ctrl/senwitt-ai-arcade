import React, { useEffect, useRef, useState } from 'react';
import { Clock, Sparkles, ArrowRight, ListOrdered, Undo2, CheckCircle2, XCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface SequenceOrderResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface SequenceOrderDrillProps {
  onComplete: (result: SequenceOrderResult) => void;
  onCancel: () => void;
}

interface StepScenario {
  id: string;
  title: string;
  steps: string[];
}

const PREVIEW_SECONDS = 10;
const POINTS_PER_STEP = 8;
const PERFECT_BONUS = 20;
const SCENARIOS_PER_SESSION = 4;

const SCENARIO_BANK: StepScenario[] = [
  {
    id: 'meeting-prep',
    title: 'Getting ready for a client meeting',
    steps: [
      'Confirm the agenda with attendees',
      'Book the meeting room or video link',
      'Send the calendar invite',
      'Prepare your talking points',
      'Follow up with notes after the meeting',
    ],
  },
  {
    id: 'travel-prep',
    title: 'Getting ready for a work trip',
    steps: [
      'Book flights and hotel',
      'Check visa or ID requirements',
      'Pack your bags',
      'Check in online 24 hours before',
      'Head to the airport with documents ready',
    ],
  },
  {
    id: 'deploy-checklist',
    title: 'Shipping a code change',
    steps: [
      'Run the test suite locally',
      'Open a pull request for review',
      'Merge to the main branch',
      'Deploy to staging and verify',
      'Deploy to production and monitor',
    ],
  },
  {
    id: 'new-hire-onboarding',
    title: 'Onboarding a new hire',
    steps: [
      'Send the offer letter and welcome packet',
      'Provision laptop and account access',
      'Schedule first-week orientation sessions',
      'Assign an onboarding buddy',
      'Check in after 30 days',
    ],
  },
  {
    id: 'invoice-processing',
    title: 'Processing a vendor invoice',
    steps: [
      'Receive the invoice from the vendor',
      'Match it against the purchase order',
      'Get manager approval for payment',
      'Submit the invoice to accounts payable',
      'Confirm payment was issued',
    ],
  },
  {
    id: 'product-launch',
    title: 'Launching a new feature',
    steps: [
      'Finalize the feature spec with stakeholders',
      'Build and QA the feature internally',
      'Ship to a small beta group',
      'Collect feedback and fix issues',
      'Roll out to all users',
    ],
  },
  {
    id: 'incident-response',
    title: 'Responding to a production incident',
    steps: [
      'Detect the alert and acknowledge it',
      'Assess impact and declare severity',
      'Apply a mitigation or rollback',
      'Confirm the system has recovered',
      'Write and share the postmortem',
    ],
  },
  {
    id: 'performance-review',
    title: 'Running a performance review cycle',
    steps: [
      'Set goals at the start of the cycle',
      'Collect peer feedback',
      'Write the self-assessment',
      'Hold the 1:1 review conversation',
      'Document final ratings and next goals',
    ],
  },
  {
    id: 'budget-approval',
    title: 'Getting a budget request approved',
    steps: [
      'Draft the budget proposal with cost breakdown',
      'Get sign-off from your direct manager',
      'Submit to finance for review',
      'Present to the budget committee if needed',
      'Receive final approval and allocate funds',
    ],
  },
  {
    id: 'customer-escalation',
    title: 'Handling a customer escalation',
    steps: [
      'Acknowledge the customer\u2019s complaint',
      'Investigate the root cause internally',
      'Propose a resolution to the customer',
      'Implement the fix or refund',
      'Follow up to confirm satisfaction',
    ],
  },
  {
    id: 'contract-signing',
    title: 'Closing a new client contract',
    steps: [
      'Send the proposal and pricing',
      'Negotiate final terms',
      'Route the contract for legal review',
      'Collect signatures from both parties',
      'Kick off onboarding for the client',
    ],
  },
  {
    id: 'password-reset',
    title: 'Resetting a locked company account',
    steps: [
      'Verify your identity with IT support',
      'Request a password reset link',
      'Set a new password meeting policy rules',
      'Re-enable multi-factor authentication',
      'Confirm you can log in successfully',
    ],
  },
];

const pickScenarios = (): StepScenario[] => {
  const shuffled = [...SCENARIO_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SCENARIOS_PER_SESSION);
};

type Phase = 'preview' | 'order' | 'result';

const shuffledDifferentFrom = <T,>(arr: T[]): T[] => {
  const indices = arr.map((_, i) => i);
  for (let attempt = 0; attempt < 20; attempt++) {
    const copy = [...indices];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (!copy.every((v, i) => v === indices[i])) return copy.map((i) => arr[i]);
  }
  return [...arr].reverse();
};

export const SequenceOrderDrill: React.FC<SequenceOrderDrillProps> = ({ onComplete, onCancel }) => {
  const [scenarios] = useState<StepScenario[]>(pickScenarios);
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>('preview');
  const [secondsLeft, setSecondsLeft] = useState<number>(PREVIEW_SECONDS);
  const [scrambled, setScrambled] = useState<string[]>(() => shuffledDifferentFrom(scenarios[0].steps));
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [correctPositionsTotal, setCorrectPositionsTotal] = useState<number>(0);
  const [roundCorrectPositions, setRoundCorrectPositions] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);
  const currentScenario = scenarios[scenarioIndex];
  const totalSteps = scenarios.reduce((sum, s) => sum + s.steps.length, 0);

  useEffect(() => {
    if (phase !== 'preview') return;
    if (secondsLeft <= 0) {
      startOrdering();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const startOrdering = () => {
    playClickSound();
    setPhase('order');
  };

  const remainingSteps = scrambled.filter((s) => !userOrder.includes(s));

  const handleTapStep = (step: string) => {
    if (phase !== 'order') return;
    playClickSound();
    setUserOrder((prev) => {
      const next = [...prev, step];
      if (next.length === currentScenario.steps.length) {
        evaluateRound(next);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (phase !== 'order' || userOrder.length === 0) return;
    playClickSound();
    setUserOrder((prev) => prev.slice(0, -1));
  };

  const evaluateRound = (finalOrder: string[]) => {
    let correctPositions = 0;
    finalOrder.forEach((step, idx) => {
      if (currentScenario.steps[idx] === step) correctPositions += 1;
    });
    const isPerfect = correctPositions === currentScenario.steps.length;
    const delta = correctPositions * POINTS_PER_STEP + (isPerfect ? PERFECT_BONUS : 0);
    if (isPerfect) playCorrectSound();
    else if (correctPositions > 0) playCorrectSound();
    else playIncorrectSound();
    setRoundCorrectPositions(correctPositions);
    setCorrectPositionsTotal((c) => c + correctPositions);
    setScore((s) => s + delta);
    setPhase('result');
  };

  const handleNextScenario = () => {
    playClickSound();
    if (scenarioIndex + 1 >= scenarios.length) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playFanfareSound();
      onComplete({
        scoreEarned: score,
        correctCount: correctPositionsTotal,
        totalItems: totalSteps,
        totalTimeMs: Date.now() - drillStartRef.current,
      });
      return;
    }
    const nextIndex = scenarioIndex + 1;
    setScenarioIndex(nextIndex);
    setScrambled(shuffledDifferentFrom(scenarios[nextIndex].steps));
    setUserOrder([]);
    setSecondsLeft(PREVIEW_SECONDS);
    setPhase('preview');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      <div className="w-full flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs"
          style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
        >
          ✕ Exit
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Scenario {scenarioIndex + 1} of {scenarios.length}
          </div>
          {phase === 'preview' && (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
            >
              <Clock className="w-4 h-4" />
              <span>Memorize • {secondsLeft}s</span>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="sequence_order" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#d1fae5', border: '1px solid #a7f3d0', color: '#047857' }}
        >
          <ListOrdered className="w-4 h-4" />
          Sequence Order
        </div>

        <h2 className="text-xl md:text-2xl font-extrabold mb-6 tracking-tight w-full" style={{ color: 'var(--text-primary)' }}>
          {currentScenario.title}
        </h2>

        {phase === 'preview' && (
          <>
            <p className="text-sm md:text-base mb-6 max-w-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Memorize this order. In a moment, the steps will scramble and you'll tap them back into place.
            </p>
            <div className="space-y-2.5 w-full max-w-xl mb-8">
              {currentScenario.steps.map((step, idx) => (
                <div
                  key={step}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left text-sm md:text-base font-bold"
                  style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <span
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                    style={{ background: 'var(--accent-teal)' }}
                  >
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <button onClick={startOrdering} className="btn-3d btn-3d-emerald w-full max-w-xl py-4 text-base flex items-center justify-center gap-2">
              <span>I'm ready — scramble it</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {phase === 'order' && (
          <>
            <p className="text-sm md:text-base mb-4 max-w-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Tap the steps below in the correct order.
            </p>

            <div className="w-full max-w-xl mb-5 min-h-[3.5rem]">
              <p className="text-xs font-extrabold uppercase tracking-wide mb-2 text-left" style={{ color: 'var(--text-muted)' }}>
                Your sequence
              </p>
              <div className="space-y-2">
                {userOrder.map((step, idx) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 p-3.5 rounded-2xl text-left text-sm font-bold"
                    style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white" style={{ background: '#059669' }}>
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
                {userOrder.length === 0 && (
                  <div className="p-3.5 rounded-2xl text-xs font-semibold text-left" style={{ background: 'var(--bg-surface-soft)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                    Tap a step below to place it first.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 w-full max-w-xl mb-6">
              {remainingSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleTapStep(step)}
                  className="btn-3d w-full p-4 text-left text-sm font-bold border-b-4 bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]"
                >
                  {step}
                </button>
              ))}
            </div>

            <button
              onClick={handleUndo}
              disabled={userOrder.length === 0}
              className="btn-3d px-5 py-2.5 text-xs flex items-center justify-center gap-2"
              style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea', opacity: userOrder.length === 0 ? 0.5 : 1 }}
            >
              <Undo2 className="w-4 h-4" />
              Undo last
            </button>
          </>
        )}

        {phase === 'result' && (
          <>
            <div
              className="w-full max-w-xl p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
              style={{
                background: roundCorrectPositions === currentScenario.steps.length ? '#ecfdf5' : '#fff7ed',
                borderColor: roundCorrectPositions === currentScenario.steps.length ? '#a7f3d0' : '#fed7aa',
                color: roundCorrectPositions === currentScenario.steps.length ? '#065f46' : '#c2410c',
              }}
            >
              <p className="font-extrabold mb-1">
                {roundCorrectPositions} of {currentScenario.steps.length} in the right spot
                {roundCorrectPositions === currentScenario.steps.length ? ' — perfect!' : ''}
              </p>
              <p className="font-semibold">Here's the correct order compared to yours:</p>
            </div>

            <div className="space-y-2 w-full max-w-xl mb-6">
              {currentScenario.steps.map((step, idx) => {
                const wasCorrect = userOrder[idx] === step;
                return (
                  <div key={step} className="flex items-center gap-3 p-3.5 rounded-2xl text-left text-xs md:text-sm font-bold" style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white" style={{ background: 'var(--accent-teal)' }}>
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                    {wasCorrect ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#059669' }} />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" style={{ color: '#e11d48' }} />
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={handleNextScenario} className="btn-3d btn-3d-teal w-full max-w-xl py-4 text-base flex items-center justify-center gap-2">
              <span>{scenarioIndex + 1 < scenarios.length ? 'Next scenario' : 'Finish drill'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
