import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles, ArrowRight, Hand, Ban, Brain, CheckCircle2, XCircle,
  MessageSquareText, Percent, Zap, Compass,
} from 'lucide-react';
import type { BaselinePriority, BaselineProfile } from '../types';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

interface BaselineAssessmentProps {
  onComplete: (profile: BaselineProfile) => void;
  /** Foot-in-the-door: persist minutes when user picks a chip. */
  onCommitMinutes?: (m: 2 | 5 | 10) => void;
  /** Starter step: skip assessment and try a tiny workout. */
  onSkipToWorkout?: () => void;
}

type Step = 'intro' | 'attention' | 'memory' | 'communication' | 'numbers' | 'results';

const STEP_LABELS: Record<Exclude<Step, 'intro' | 'results'>, string> = {
  attention: 'Selective attention',
  memory: 'Working memory',
  communication: 'Communication',
  numbers: 'Number sense',
};

const TASK_STEPS: Exclude<Step, 'intro' | 'results'>[] = ['attention', 'memory', 'communication', 'numbers'];

const AREA_LABEL: Record<BaselinePriority, string> = {
  focus: 'Focus',
  recall: 'Working Memory',
  communication: 'Clear Communication',
  numbers: 'Number Sense',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Task 1: Selective attention (go / no-go) -------------------------------

const GO_NO_GO_WINDOW_MS = 950;
const GO_NO_GO_PRIORITY_COUNT = 7;
const GO_NO_GO_NOISE_COUNT = 5;

interface GoNoGoTrial {
  id: number;
  label: 'PRIORITY' | 'NOISE';
}

const buildGoNoGoTrials = (): GoNoGoTrial[] => {
  const labels: ('PRIORITY' | 'NOISE')[] = [
    ...Array(GO_NO_GO_PRIORITY_COUNT).fill('PRIORITY'),
    ...Array(GO_NO_GO_NOISE_COUNT).fill('NOISE'),
  ];
  return shuffle(labels).map((label, id) => ({ id, label }));
};

// --- Task 2: Brief working memory -------------------------------------------

const WORD_POOL = [
  'Invoice', 'Deadline', 'Roadmap', 'Client', 'Budget', 'Server', 'Meeting', 'Contract',
  'Backlog', 'Vendor', 'Ticket', 'Proposal', 'Calendar', 'Approval', 'Feedback', 'Dashboard',
  'Release', 'Timeline', 'Discount', 'Headcount',
];

interface MemoryRound {
  shown: string[];
  target: string;
  options: string[];
}

const buildMemoryRounds = (count: number): MemoryRound[] => {
  const pool = shuffle(WORD_POOL);
  const rounds: MemoryRound[] = [];
  for (let r = 0; r < count; r++) {
    const shown = pool.slice(r * 4, r * 4 + 4);
    const target = shown[Math.floor(Math.random() * shown.length)];
    const remaining = pool.filter((w) => !shown.includes(w));
    const distractors = shuffle(remaining).slice(0, 3);
    rounds.push({ shown, target, options: shuffle([target, ...distractors]) });
  }
  return rounds;
};

// --- Task 3: Communication ---------------------------------------------------

interface McqItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

const COMMUNICATION_ITEMS: McqItem[] = [
  {
    id: 'comm1',
    prompt:
      '"Just circling back on this again since I know things have been busy, but whenever you get a chance, no pressure, would love to hear any thoughts on the proposal if possible!"',
    options: [
      'Circling back — any thoughts on the proposal?',
      'Can you review the proposal by end of day Friday?',
      'Just circling back again, no pressure, whenever, thoughts welcome!',
      'The proposal is still out there waiting on feedback from someone.',
    ],
    correctIndex: 1,
  },
  {
    id: 'comm2',
    prompt:
      '"I don\u2019t want to alarm anyone but I was just kind of noticing that the numbers in the report might maybe not be totally lining up with what we discussed."',
    options: [
      'Something might be off with the numbers, not sure though.',
      'The report numbers don\u2019t match Tuesday\u2019s figures — can you double-check row 12?',
      'I don\u2019t want to alarm anyone, but numbers, discussion, alignment?',
      'The numbers are probably fine, just a feeling.',
    ],
    correctIndex: 1,
  },
];

// --- Task 4: Number sense -----------------------------------------------------

const NUMBER_ITEMS: McqItem[] = [
  {
    id: 'num1',
    prompt: 'Signups went from 250 to 300 last month. What\u2019s the percentage increase?',
    options: ['10%', '20%', '50%', '5%'],
    correctIndex: 1,
  },
  {
    id: 'num2',
    prompt: 'A task takes 3 people 6 hours together. Roughly how long would it take 1 person alone?',
    options: ['9 hours', '12 hours', '18 hours', '24 hours'],
    correctIndex: 2,
  },
];

export const BaselineAssessment: React.FC<BaselineAssessmentProps> = ({
  onComplete,
  onCommitMinutes,
  onSkipToWorkout,
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [committedMinutes, setCommittedMinutes] = useState<2 | 5 | 10>(5);

  // Task 1 state
  const [goNoGoTrials] = useState<GoNoGoTrial[]>(buildGoNoGoTrials);
  const [trialIndex, setTrialIndex] = useState(0);
  const [tapped, setTapped] = useState(false);
  const tappedRef = useRef(false);
  const attentionStatsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });

  // Task 2 state
  const [memoryRounds] = useState<MemoryRound[]>(() => buildMemoryRounds(3));
  const [memoryRoundIndex, setMemoryRoundIndex] = useState(0);
  const [memoryPhase, setMemoryPhase] = useState<'show' | 'ask'>('show');
  const [memorySelected, setMemorySelected] = useState<string | null>(null);
  const memoryCorrectRef = useRef(0);

  // Task 3 & 4 shared MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const communicationCorrectRef = useRef(0);
  const numbersCorrectRef = useRef(0);

  const [scores, setScores] = useState<Record<BaselinePriority, number>>({
    focus: 100,
    recall: 100,
    communication: 100,
    numbers: 100,
  });

  // Task 1 engine: run the trial window and score it, then advance.
  useEffect(() => {
    if (step !== 'attention') return;
    if (trialIndex >= goNoGoTrials.length) return;
    tappedRef.current = false;
    setTapped(false);
    const timer = setTimeout(() => {
      const trial = goNoGoTrials[trialIndex];
      const didTap = tappedRef.current;
      const stats = attentionStatsRef.current;
      if (trial.label === 'PRIORITY') {
        if (didTap) stats.hits += 1; else stats.misses += 1;
      } else {
        if (didTap) stats.falseAlarms += 1; else stats.correctRejections += 1;
      }
      setTrialIndex((i) => i + 1);
    }, GO_NO_GO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [step, trialIndex, goNoGoTrials]);

  useEffect(() => {
    if (step === 'attention' && trialIndex >= goNoGoTrials.length) {
      const stats = attentionStatsRef.current;
      const correct = stats.hits + stats.correctRejections;
      const focusScore = Math.round((correct / goNoGoTrials.length) * 100);
      setScores((prev) => ({ ...prev, focus: focusScore }));
      setStep('memory');
    }
  }, [step, trialIndex, goNoGoTrials.length]);

  // Keyboard support for the go/no-go tap.
  useEffect(() => {
    if (step !== 'attention') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, trialIndex]);

  const handleTap = () => {
    if (tappedRef.current) return;
    tappedRef.current = true;
    setTapped(true);
    playClickSound();
  };

  // Task 2 engine: 2s display window, then ask.
  useEffect(() => {
    if (step !== 'memory' || memoryPhase !== 'show') return;
    const timer = setTimeout(() => setMemoryPhase('ask'), 2000);
    return () => clearTimeout(timer);
  }, [step, memoryPhase, memoryRoundIndex]);

  const handleMemorySelect = (word: string) => {
    if (memorySelected) return;
    playClickSound();
    setMemorySelected(word);
    const round = memoryRounds[memoryRoundIndex];
    const isCorrect = word === round.target;
    if (isCorrect) {
      playCorrectSound();
      memoryCorrectRef.current += 1;
    } else {
      playIncorrectSound();
    }
    setTimeout(() => {
      if (memoryRoundIndex + 1 >= memoryRounds.length) {
        const recallScore = Math.round((memoryCorrectRef.current / memoryRounds.length) * 100);
        setScores((prev) => ({ ...prev, recall: recallScore }));
        setStep('communication');
      } else {
        setMemoryRoundIndex((i) => i + 1);
        setMemoryPhase('show');
        setMemorySelected(null);
      }
    }, 1100);
  };

  // Shared MCQ handlers for communication + numbers steps.
  const currentMcqList = step === 'communication' ? COMMUNICATION_ITEMS : NUMBER_ITEMS;
  const currentMcqItem = currentMcqList[mcqIndex];

  const handleMcqSelect = (idx: number) => {
    if (mcqAnswered) return;
    playClickSound();
    setMcqSelected(idx);
  };

  const handleMcqSubmit = () => {
    if (mcqSelected === null || mcqAnswered) return;
    const isCorrect = mcqSelected === currentMcqItem.correctIndex;
    if (isCorrect) {
      playCorrectSound();
      if (step === 'communication') communicationCorrectRef.current += 1;
      else numbersCorrectRef.current += 1;
    } else {
      playIncorrectSound();
    }
    setMcqAnswered(true);
  };

  const handleMcqNext = () => {
    playClickSound();
    if (mcqIndex + 1 >= currentMcqList.length) {
      if (step === 'communication') {
        const commScore = Math.round((communicationCorrectRef.current / COMMUNICATION_ITEMS.length) * 100);
        setScores((prev) => ({ ...prev, communication: commScore }));
        setMcqIndex(0);
        setMcqSelected(null);
        setMcqAnswered(false);
        setStep('numbers');
      } else {
        const numScore = Math.round((numbersCorrectRef.current / NUMBER_ITEMS.length) * 100);
        setScores((prev) => ({ ...prev, numbers: numScore }));
        playFanfareSound();
        setStep('results');
      }
      return;
    }
    setMcqIndex((i) => i + 1);
    setMcqSelected(null);
    setMcqAnswered(false);
  };

  const priorities = (Object.entries(scores) as [BaselinePriority, number][])
    .sort((a, b) => a[1] - b[1])
    .map(([area]) => area);

  const handleCommitMinutes = (m: 2 | 5 | 10) => {
    playClickSound();
    setCommittedMinutes(m);
    onCommitMinutes?.(m);
  };

  const handleStartToday = () => {
    playClickSound();
    onCommitMinutes?.(committedMinutes);
    onComplete({
      priorities,
      scoresByArea: scores,
      completedAt: new Date().toISOString(),
      committedMinutes,
    });
  };

  const stepNumber = TASK_STEPS.indexOf(step as Exclude<Step, 'intro' | 'results'>) + 1;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      {step !== 'intro' && step !== 'results' && (
        <div className="w-full mb-6">
          <div className="flex items-center justify-between text-xs font-extrabold mb-2" style={{ color: 'var(--text-secondary)' }}>
            <span>Step {stepNumber} of {TASK_STEPS.length} · {STEP_LABELS[step]}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-full progress-bar-teal transition-all duration-300 rounded-full"
              style={{ width: `${(stepNumber / TASK_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 'intro' && (
        <div className="w-full surface p-8 md:p-12 flex flex-col items-center text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Compass className="w-4 h-4" />
            Quick starting point
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Let&apos;s find your starting point
          </h1>
          <p className="text-sm md:text-base mb-8 max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Four short tasks, about 6–8 minutes total. This isn&apos;t an IQ test or a diagnosis — it&apos;s a quick sample so
            today&apos;s plan starts in the right place.
          </p>
          <div className="w-full grid grid-cols-2 gap-3 mb-6 text-left">
            {[
              { icon: Hand, label: 'Selective attention', sub: '12 quick trials' },
              { icon: Brain, label: 'Working memory', sub: '3 short rounds' },
              { icon: MessageSquareText, label: 'Communication', sub: '2 quick picks' },
              { icon: Percent, label: 'Number sense', sub: '2 quick picks' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="surface-soft p-3 flex items-start gap-2.5">
                <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-teal)' }} />
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>{label}</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <p
            className="text-xs font-extrabold uppercase tracking-wider mb-2 w-full text-left"
            style={{ color: 'var(--text-muted)' }}
          >
            I can train most days
          </p>
          <div className="flex flex-wrap gap-2 w-full mb-6" role="group" aria-label="Daily minutes commitment">
            {([2, 5, 10] as const).map((m) => {
              const selected = committedMinutes === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleCommitMinutes(m)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-extrabold transition-colors"
                  style={{
                    background: selected ? '#ccfbf1' : 'var(--bg-surface-soft)',
                    color: selected ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    border: selected ? '2px solid #0f766e' : '1px solid var(--border-color)',
                  }}
                >
                  ~{m} min
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              playClickSound();
              onCommitMinutes?.(committedMinutes);
              setStep('attention');
            }}
            className="btn-3d btn-3d-coral w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <span>Begin</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          {onSkipToWorkout && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onCommitMinutes?.(2);
                onSkipToWorkout();
              }}
              className="mt-3 text-sm font-bold underline-offset-2 hover:underline"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Skip for now — try a 2-min workout
            </button>
          )}
        </div>
      )}

      {step === 'attention' && (
        <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm md:text-base mb-6 max-w-md" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Tap (or press Space) only when the label says <strong>PRIORITY</strong>. Ignore <strong>NOISE</strong>.
          </p>

          <div
            className="w-full max-w-sm rounded-3xl py-12 mb-8 flex flex-col items-center justify-center min-h-[180px] transition-colors"
            style={{
              background: goNoGoTrials[trialIndex]?.label === 'PRIORITY' ? '#fff7ed' : 'var(--bg-surface-soft)',
              border: `1px solid ${goNoGoTrials[trialIndex]?.label === 'PRIORITY' ? '#fed7aa' : 'var(--border-color)'}`,
            }}
          >
            {goNoGoTrials[trialIndex] ? (
              <>
                {goNoGoTrials[trialIndex].label === 'PRIORITY' ? (
                  <Hand className="w-8 h-8 mb-3" style={{ color: '#c2410c' }} />
                ) : (
                  <Ban className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)' }} />
                )}
                <span
                  className="text-3xl md:text-4xl font-extrabold uppercase tracking-widest"
                  style={{ color: goNoGoTrials[trialIndex].label === 'PRIORITY' ? '#c2410c' : 'var(--text-muted)' }}
                >
                  {goNoGoTrials[trialIndex].label}
                </span>
                {tapped && <span className="text-xs font-extrabold mt-3" style={{ color: 'var(--accent-teal)' }}>Tapped</span>}
              </>
            ) : (
              <Zap className="w-8 h-8" style={{ color: 'var(--accent-teal)' }} />
            )}
          </div>

          <button
            onClick={handleTap}
            className="btn-3d btn-3d-coral w-full max-w-sm py-5 text-base mb-4"
          >
            Tap now
          </button>

          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            Trial {Math.min(trialIndex + 1, goNoGoTrials.length)} of {goNoGoTrials.length}
          </p>
        </div>
      )}

      {step === 'memory' && (
        <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
          {memoryPhase === 'show' ? (
            <>
              <p className="text-sm md:text-base mb-6" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                Remember these — you&apos;ll be asked in a moment.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4">
                {memoryRounds[memoryRoundIndex].shown.map((word) => (
                  <div
                    key={word}
                    className="rounded-2xl py-6 flex items-center justify-center text-base font-extrabold"
                    style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
                  >
                    {word}
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                Round {memoryRoundIndex + 1} of {memoryRounds.length}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm md:text-base mb-6 font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Which of these was shown?
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4">
                {memoryRounds[memoryRoundIndex].options.map((word) => {
                  const isSelected = memorySelected === word;
                  const isCorrectOpt = word === memoryRounds[memoryRoundIndex].target;
                  let cls = 'btn-3d py-5 px-3 text-sm font-bold border-b-4 ';
                  if (memorySelected) {
                    if (isCorrectOpt) cls += 'bg-emerald-500 border-emerald-700 text-white';
                    else if (isSelected) cls += 'bg-rose-500 border-rose-700 text-white';
                    else cls += 'bg-white border-[#d7e0ea] text-[var(--text-muted)] opacity-55';
                  } else {
                    cls += 'bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]';
                  }
                  return (
                    <button key={word} type="button" disabled={!!memorySelected} onClick={() => handleMemorySelect(word)} className={cls}>
                      {word}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                Round {memoryRoundIndex + 1} of {memoryRounds.length}
              </p>
            </>
          )}
        </div>
      )}

      {(step === 'communication' || step === 'numbers') && currentMcqItem && (
        <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
            style={{
              background: step === 'communication' ? '#e0f2fe' : '#fff7ed',
              border: `1px solid ${step === 'communication' ? '#bae6fd' : '#fed7aa'}`,
              color: step === 'communication' ? '#0369a1' : '#c2410c',
            }}
          >
            {step === 'communication' ? <MessageSquareText className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
            {step === 'communication' ? 'Pick the clearest rewrite' : 'Quick estimate'}
          </div>

          <p
            className="text-sm md:text-base mb-6 leading-relaxed w-full max-w-md"
            style={{ color: 'var(--text-primary)', fontWeight: 700 }}
          >
            {currentMcqItem.prompt}
          </p>

          <div className="space-y-3 w-full mb-6">
            {currentMcqItem.options.map((option, idx) => {
              const isSelected = mcqSelected === idx;
              const isCorrectOpt = idx === currentMcqItem.correctIndex;
              let btnClass = 'btn-3d w-full p-4 text-left text-xs md:text-sm font-bold border-b-4 flex items-start justify-between gap-2 ';
              if (mcqAnswered) {
                if (isCorrectOpt) btnClass += 'bg-emerald-500 border-emerald-700 text-white';
                else if (isSelected) btnClass += 'bg-rose-500 border-rose-700 text-white';
                else btnClass += 'bg-white border-[#d7e0ea] text-[var(--text-muted)] opacity-55';
              } else if (isSelected) {
                btnClass += 'btn-3d-teal border-b-2';
              } else {
                btnClass += 'bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]';
              }
              return (
                <button key={idx} type="button" disabled={mcqAnswered} onClick={() => handleMcqSelect(idx)} className={btnClass}>
                  <span className="leading-snug">{option}</span>
                  {mcqAnswered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
                  {mcqAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {!mcqAnswered ? (
            <button
              disabled={mcqSelected === null}
              onClick={handleMcqSubmit}
              className={`btn-3d w-full py-4 text-base ${mcqSelected !== null ? 'btn-3d-coral' : 'bg-[#e2ebf4] border-b-4 border-[#c5d3e0] text-[var(--text-muted)] cursor-not-allowed'}`}
            >
              Check answer
            </button>
          ) : (
            <button onClick={handleMcqNext} className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2">
              <span>{mcqIndex + 1 < currentMcqList.length ? 'Next' : 'See my starting profile'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {step === 'results' && (
        <div className="w-full surface p-8 md:p-12 flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-2xl mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #17a89a, #0f766e)', boxShadow: '0 10px 24px rgba(15,118,110,0.28)' }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Your starting profile
          </h2>
          <p className="text-sm md:text-base mb-6 max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Your plan will emphasise <strong>{AREA_LABEL[priorities[0]]}</strong> and <strong>{AREA_LABEL[priorities[1]]}</strong>.
            These results reflect today&apos;s short sample — not a fixed score.
          </p>

          <div className="w-full grid grid-cols-2 gap-3 mb-8">
            {(Object.keys(AREA_LABEL) as BaselinePriority[]).map((area) => (
              <div key={area} className="surface-soft p-3 text-left">
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{AREA_LABEL[area]}</p>
                <div style={{ width: '100%', background: 'var(--bg-secondary)', height: 8, borderRadius: 99, overflow: 'hidden', margin: '6px 0' }}>
                  <div className="progress-bar-teal" style={{ height: '100%', width: `${scores[area]}%` }} />
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{scores[area]}%</p>
              </div>
            ))}
          </div>

          <button onClick={handleStartToday} className="btn-3d btn-3d-coral w-full py-4 text-base flex items-center justify-center gap-2">
            <span>Start today&apos;s workout</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
