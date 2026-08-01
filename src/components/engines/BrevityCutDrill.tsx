import React, { useEffect, useRef, useState } from 'react';
import { Clock, Sparkles, ArrowRight, Scissors, Check, X } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface BrevityCutResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface BrevityCutDrillProps {
  onComplete: (result: BrevityCutResult) => void;
  onCancel: () => void;
}

interface CutRound {
  id: string;
  tokens: string[];
  /** Indices of tokens that are redundant / add no meaning and should be tapped. */
  redundantIndices: number[];
  note: string;
}

const ROUND_SECONDS = 15;
const POINTS_PER_HIT = 15;
const PENALTY_PER_MISTAP = 8;

const ROUNDS: CutRound[] = [
  {
    id: 'brevity-1',
    tokens: ['The', 'team', 'will', 'revert', 'back', 'to', 'you', 'with', 'the', 'final', 'outcome', 'by', 'Friday.'],
    redundantIndices: [4, 9],
    note: '"Revert" already means going back, and an "outcome" is already final — both extra words can go.',
  },
  {
    id: 'brevity-2',
    tokens: ["Let's", 'plan', 'ahead', 'in', 'advance', 'so', 'the', 'launch', 'avoids', 'the', 'past', 'history', 'of', 'delays.'],
    redundantIndices: [2, 10],
    note: '"In advance" already means ahead of time, and "history" is already about the past.',
  },
  {
    id: 'brevity-3',
    tokens: ['Each', 'and', 'every', 'attendee', 'must', 'completely', 'confirm', 'their', 'availability', 'before', 'the', 'meeting', 'starts.'],
    redundantIndices: [1, 2, 5],
    note: '"Each" alone covers it — "and every" just repeats it. "Confirm" is already a complete action.',
  },
  {
    id: 'brevity-4',
    tokens: ['We', 'need', 'to', 'completely', 'eliminate', 'the', 'unnecessary', 'extra', 'steps', 'from', 'the', 'current', 'existing', 'process.'],
    redundantIndices: [3, 7, 12],
    note: '"Eliminate" already means fully remove. "Unnecessary" and "current" each already do the job alone.',
  },
  {
    id: 'brevity-5',
    tokens: ['Please', 'send', 'the', 'brief', 'short', 'summary', 'of', 'the', 'new', 'additional', 'features', 'we', 'added', 'this', 'week.'],
    redundantIndices: [4, 9],
    note: 'A "summary" is already brief, and "new" already implies "additional" — pick one.',
  },
];

type Phase = 'playing' | 'reveal';

export const BrevityCutDrill: React.FC<BrevityCutDrillProps> = ({ onComplete, onCancel }) => {
  const [rounds] = useState<CutRound[]>(ROUNDS);
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [secondsLeft, setSecondsLeft] = useState<number>(ROUND_SECONDS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [score, setScore] = useState<number>(0);
  const [perfectRounds, setPerfectRounds] = useState<number>(0);
  const [roundDelta, setRoundDelta] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const currentRound = rounds[roundIndex];

  useEffect(() => {
    if (phase !== 'playing') return;
    if (secondsLeft <= 0) {
      finishRound();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const toggleWord = (idx: number) => {
    if (phase !== 'playing') return;
    playClickSound();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const finishRound = () => {
    const redundantSet = new Set(currentRound.redundantIndices);
    let hits = 0;
    let mistaps = 0;
    selected.forEach((idx) => {
      if (redundantSet.has(idx)) hits += 1;
      else mistaps += 1;
    });
    const isPerfect = hits === redundantSet.size && mistaps === 0;
    const delta = Math.max(0, hits * POINTS_PER_HIT - mistaps * PENALTY_PER_MISTAP);
    if (isPerfect) {
      playCorrectSound();
      setPerfectRounds((p) => p + 1);
    } else if (hits > 0) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    setRoundDelta(delta);
    setScore((s) => s + delta);
    setPhase('reveal');
  };

  const handleLockIn = () => {
    if (phase !== 'playing') return;
    playClickSound();
    finishRound();
  };

  const handleNext = () => {
    playClickSound();
    if (roundIndex + 1 >= rounds.length) {
      playFanfareSound();
      onComplete({
        scoreEarned: score,
        correctCount: perfectRounds,
        totalItems: rounds.length,
        totalTimeMs: Date.now() - drillStartRef.current,
      });
      return;
    }
    setRoundIndex((i) => i + 1);
    setSelected(new Set());
    setSecondsLeft(ROUND_SECONDS);
    setPhase('playing');
  };

  const redundantSet = new Set(currentRound.redundantIndices);

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
            Round {roundIndex + 1} of {rounds.length}
          </div>
          {phase === 'playing' && (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{ background: secondsLeft <= 5 ? '#fff1f2' : '#fff7ed', border: `1px solid ${secondsLeft <= 5 ? '#fecdd3' : '#fed7aa'}`, color: secondsLeft <= 5 ? '#9f1239' : '#c2410c' }}
            >
              <Clock className="w-4 h-4" />
              <span>{secondsLeft}s</span>
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

      <EvidencePanel evidenceKey="brevity_cut" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#ffe4e6', border: '1px solid #fecdd3', color: '#be123c' }}
        >
          <Scissors className="w-4 h-4" />
          Brevity Cut
        </div>

        <p className="text-sm md:text-base mb-6 max-w-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Tap every word that adds nothing — the sentence should still mean exactly the same thing without it.
        </p>

        <div
          className="w-full max-w-xl rounded-2xl p-6 mb-6 leading-loose text-left"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          {currentRound.tokens.map((word, idx) => {
            const isSelected = selected.has(idx);
            const isRedundant = redundantSet.has(idx);
            let chipClass = 'inline-flex items-center gap-1 m-1 px-3 py-1.5 rounded-xl text-sm md:text-base font-bold border-2 transition-all ';
            if (phase === 'reveal') {
              if (isRedundant && isSelected) chipClass += 'bg-emerald-500 border-emerald-700 text-white';
              else if (isRedundant && !isSelected) chipClass += 'bg-white border-emerald-500 text-emerald-700 border-dashed';
              else if (!isRedundant && isSelected) chipClass += 'bg-rose-500 border-rose-700 text-white';
              else chipClass += 'bg-white border-[#e2ebf4] text-[var(--text-primary)]';
            } else if (isSelected) {
              chipClass += 'bg-rose-100 border-rose-400 text-rose-700 line-through';
            } else {
              chipClass += 'bg-white border-[#e2ebf4] text-[var(--text-primary)] hover:border-rose-300 cursor-pointer';
            }
            return (
              <button key={idx} type="button" disabled={phase === 'reveal'} onClick={() => toggleWord(idx)} className={chipClass}>
                {word}
                {phase === 'reveal' && isRedundant && isSelected && <Check className="w-3.5 h-3.5" />}
                {phase === 'reveal' && !isRedundant && isSelected && <X className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {phase === 'reveal' && (
          <div
            className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: roundDelta > 0 ? '#ecfdf5' : '#fff1f2',
              borderColor: roundDelta > 0 ? '#a7f3d0' : '#fecdd3',
              color: roundDelta > 0 ? '#065f46' : '#9f1239',
            }}
          >
            <p className="leading-relaxed font-extrabold mb-1">+{roundDelta} pts this round</p>
            <p className="leading-relaxed font-semibold">{currentRound.note}</p>
          </div>
        )}

        {phase === 'playing' ? (
          <button onClick={handleLockIn} className="btn-3d btn-3d-rose w-full py-4 text-base flex items-center justify-center gap-2">
            <span>Lock it in</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleNext} className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2">
            <span>{roundIndex + 1 < rounds.length ? 'Next round' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
