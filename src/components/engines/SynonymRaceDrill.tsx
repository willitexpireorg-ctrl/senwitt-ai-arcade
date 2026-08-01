import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, BookA, Clock } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface SynonymRaceResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface SynonymRaceDrillProps {
  onComplete: (result: SynonymRaceResult) => void;
  onCancel: () => void;
}

interface SynonymRound {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ROUND_SECONDS = 8;
const ROUNDS_PER_SESSION = 9;

const BANK: SynonymRound[] = [
  {
    id: 'syn-1',
    prompt: 'concise',
    options: ['brief', 'vague', 'ornate', 'delayed'],
    correctIndex: 0,
    explanation: 'Concise and brief both mean short and to the point.',
  },
  {
    id: 'syn-2',
    prompt: 'mitigate',
    options: ['worsen', 'lessen', 'ignore', 'announce'],
    correctIndex: 1,
    explanation: 'Mitigate means to make less severe — lessen is the near-synonym.',
  },
  {
    id: 'syn-3',
    prompt: 'clarify',
    options: ['obscure', 'complicate', 'explain', 'postpone'],
    correctIndex: 2,
    explanation: 'Clarify and explain both aim to make meaning clearer.',
  },
  {
    id: 'syn-4',
    prompt: 'urgent',
    options: ['optional', 'pressing', 'casual', 'remote'],
    correctIndex: 1,
    explanation: 'Urgent and pressing both signal something that needs prompt attention.',
  },
  {
    id: 'syn-5',
    prompt: 'allocate',
    options: ['assign', 'discard', 'hide', 'delay'],
    correctIndex: 0,
    explanation: 'Allocate means to assign resources or responsibility.',
  },
  {
    id: 'syn-6',
    prompt: 'reliable',
    options: ['erratic', 'dependable', 'flashy', 'temporary'],
    correctIndex: 1,
    explanation: 'Reliable and dependable both mean you can count on it.',
  },
  {
    id: 'syn-7',
    prompt: 'summarize',
    options: ['expand', 'recap', 'translate', 'schedule'],
    correctIndex: 1,
    explanation: 'Summarize and recap both mean to restate the main points briefly.',
  },
  {
    id: 'syn-8',
    prompt: 'obstacle',
    options: ['shortcut', 'barrier', 'reward', 'template'],
    correctIndex: 1,
    explanation: 'Obstacle and barrier both mean something that blocks progress.',
  },
  {
    id: 'syn-9',
    prompt: 'approve',
    options: ['endorse', 'reject', 'question', 'archive'],
    correctIndex: 0,
    explanation: 'Approve and endorse both mean to give official support.',
  },
  {
    id: 'syn-10',
    prompt: 'precise',
    options: ['fuzzy', 'exact', 'loud', 'optional'],
    correctIndex: 1,
    explanation: 'Precise and exact both mean accurate and specific.',
  },
  {
    id: 'syn-11',
    prompt: 'postpone',
    options: ['advance', 'defer', 'finish', 'publish'],
    correctIndex: 1,
    explanation: 'Postpone and defer both mean to put off until later.',
  },
  {
    id: 'syn-12',
    prompt: 'collaborate',
    options: ['compete', 'cooperate', 'withdraw', 'dictate'],
    correctIndex: 1,
    explanation: 'Collaborate and cooperate both mean working together.',
  },
];

const pickRounds = (): SynonymRound[] => {
  const shuffled = [...BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ROUNDS_PER_SESSION);
};

export const SynonymRaceDrill: React.FC<SynonymRaceDrillProps> = ({ onComplete, onCancel }) => {
  const [rounds] = useState<SynonymRound[]>(pickRounds);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [timedOut, setTimedOut] = useState(false);

  const drillStartRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const finishedRef = useRef(false);
  /** Guards against double lock (Strict Mode updater double-invoke / double click). */
  const roundLockedRef = useRef(false);
  const indexRef = useRef(0);
  indexRef.current = index;
  scoreRef.current = score;
  correctRef.current = correctCount;

  const current = rounds[index];

  const finishDrill = (finalScore: number, finalCorrect: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    playFanfareSound();
    onComplete({
      scoreEarned: finalScore,
      correctCount: finalCorrect,
      totalItems: rounds.length,
      totalTimeMs: Date.now() - drillStartRef.current,
    });
  };

  const lockAnswer = (idx: number | null, fromTimeout: boolean) => {
    if (roundLockedRef.current || finishedRef.current) return;
    roundLockedRef.current = true;
    const isCorrect = idx !== null && idx === current.correctIndex;
    if (isCorrect) {
      playCorrectSound();
      const nextScore = scoreRef.current + 20;
      const nextCorrect = correctRef.current + 1;
      setScore(nextScore);
      setCorrectCount(nextCorrect);
      scoreRef.current = nextScore;
      correctRef.current = nextCorrect;
    } else {
      playIncorrectSound();
    }
    setTimedOut(fromTimeout);
    setIsAnswered(true);
  };

  useEffect(() => {
    if (isAnswered || finishedRef.current) return;
    roundLockedRef.current = false;
    setSecondsLeft(ROUND_SECONDS);
    setTimedOut(false);
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          // Side effect outside the pure updater path: schedule after this tick.
          queueMicrotask(() => lockAnswer(null, true));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isAnswered]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedIndex(idx);
    lockAnswer(idx, false);
  };

  const handleNext = () => {
    playClickSound();
    if (index + 1 >= rounds.length) {
      finishDrill(scoreRef.current, correctRef.current);
      return;
    }
    setIndex((i) => i + 1);
    setSelectedIndex(null);
    setIsAnswered(false);
    setTimedOut(false);
    setSecondsLeft(ROUND_SECONDS);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      <div className="w-full flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs"
          style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
        >
          ✕ Exit
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{
              background: secondsLeft <= 2 && !isAnswered ? '#fff1ed' : 'var(--bg-surface)',
              border: `1px solid ${secondsLeft <= 2 && !isAnswered ? '#fed7aa' : 'var(--border-color)'}`,
              color: secondsLeft <= 2 && !isAnswered ? 'var(--accent-coral)' : 'var(--text-primary)',
            }}
          >
            <Clock className="w-4 h-4" />
            <span>{isAnswered ? '—' : `${secondsLeft}s`}</span>
          </div>
          <div
            className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {index + 1} of {rounds.length}
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="synonym_race" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <BookA className="w-4 h-4" />
          Synonym Race
        </div>

        <p className="text-xs font-extrabold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Pick the closest synonym
        </p>
        <h2
          className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          {current.prompt}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6">
          {current.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrectOpt = idx === current.correctIndex;
            let btnClass = 'btn-3d w-full p-5 text-left text-sm font-bold border-b-4 flex items-center justify-between gap-2 ';
            if (isAnswered) {
              if (isCorrectOpt) btnClass += 'bg-emerald-500 border-emerald-700 text-white';
              else if (isSelected) btnClass += 'bg-rose-500 border-rose-700 text-white';
              else btnClass += 'bg-white border-[#d7e0ea] text-[var(--text-muted)] opacity-55';
            } else {
              btnClass += 'bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]';
            }
            return (
              <button
                key={option}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelect(idx)}
                className={btnClass}
              >
                <span>{option}</span>
                {isAnswered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: selectedIndex === current.correctIndex ? '#ecfdf5' : '#fff1f2',
              borderColor: selectedIndex === current.correctIndex ? '#a7f3d0' : '#fecdd3',
              color: selectedIndex === current.correctIndex ? '#065f46' : '#9f1239',
            }}
          >
            <p className="leading-relaxed font-semibold">
              {timedOut && selectedIndex === null ? 'Time ran out — ' : ''}
              {current.explanation}
            </p>
          </div>
        )}

        {isAnswered && (
          <button
            type="button"
            onClick={handleNext}
            className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <span>{index + 1 < rounds.length ? 'Next word' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
