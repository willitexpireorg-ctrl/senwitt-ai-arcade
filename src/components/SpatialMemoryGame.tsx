import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

export interface SpatialMemoryResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface SpatialMemoryGameProps {
  onComplete: (result: SpatialMemoryResult) => void;
  onCancel: () => void;
  gridSize?: number; // default 3, allow 3 or 4
}

const MAX_ROUNDS = 4;

export const SpatialMemoryGame: React.FC<SpatialMemoryGameProps> = ({ onComplete, onCancel, gridSize = 3 }) => {
  const resolvedGridSize = gridSize === 4 ? 4 : 3;
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(true);
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [status, setStatus] = useState<'watch' | 'repeat' | 'success' | 'fail'>('watch');

  const startTimeRef = useRef<number>(Date.now());
  const timersRef = useRef<Array<number>>([]);

  const addTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const addInterval = (fn: () => void, ms: number) => {
    const id = window.setInterval(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => {
      clearTimeout(id as any);
      clearInterval(id as any);
    });
    timersRef.current = [];
  };

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Start new round
  useEffect(() => {
    startRound(round);
    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const startRound = (currentRound: number) => {
    clearAllTimers();
    setStatus('watch');
    setIsPlayingSequence(true);
    setUserSequence([]);

    const seqLength = currentRound + 2;
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      let nextTile = Math.floor(Math.random() * (resolvedGridSize * resolvedGridSize));
      // Avoid consecutive duplicate tiles to eliminate player confusion
      while (i > 0 && nextTile === newSeq[i - 1]) {
        nextTile = Math.floor(Math.random() * (resolvedGridSize * resolvedGridSize));
      }
      newSeq.push(nextTile);
    }
    setSequence(newSeq);

    let step = 0;
    const interval = addInterval(() => {
      if (step < newSeq.length) {
        const tileIdx = newSeq[step];
        setActiveTile(tileIdx);
        playClickSound();

        addTimeout(() => {
          setActiveTile(null);
        }, 450);

        step++;
      } else {
        clearInterval(interval as any);
        setIsPlayingSequence(false);
        setStatus('repeat');
      }
    }, 800);
  };

  const finish = (scoreEarned: number, correctCount: number) => {
    onComplete({
      scoreEarned,
      correctCount,
      totalItems: MAX_ROUNDS,
      totalTimeMs: Date.now() - startTimeRef.current,
    });
  };

  const handleTileClick = (tileIdx: number) => {
    if (isPlayingSequence || status !== 'repeat') return;

    playClickSound();
    const nextUserSeq = [...userSequence, tileIdx];
    setUserSequence(nextUserSeq);

    const currentStep = nextUserSeq.length - 1;
    if (nextUserSeq[currentStep] !== sequence[currentStep]) {
      playIncorrectSound();
      setStatus('fail');
      addTimeout(() => {
        finish(score, round - 1);
      }, 1600);
      return;
    }

    // Single step matched correctly
    if (nextUserSeq.length === sequence.length) {
      playCorrectSound();
      const points = round * 30;
      setScore((prev) => prev + points);

      if (round >= MAX_ROUNDS) {
        playFanfareSound();
        setStatus('success');
        addTimeout(() => {
          finish(score + points + 50, MAX_ROUNDS);
        }, 1600);
      } else {
        setStatus('success');
        addTimeout(() => {
          setRound((r) => r + 1);
        }, 1200);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      {/* Top Bar Header */}
      <div className="w-full flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={() => {
            clearAllTimers();
            onCancel();
          }}
          className="btn-3d px-4 py-2 text-xs"
          style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
        >
          ✕ Exit
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Brain className="w-4 h-4" />
            <span>Round {round}/{MAX_ROUNDS}</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
          >
            <Sparkles className="w-4 h-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
        >
          <Sparkles className="w-4 h-4" />
          Spatial Memory • Corsi Grid
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {status === 'watch' && 'Watch the pattern light up'}
          {status === 'repeat' && `Tap tiles in order (${userSequence.length}/${sequence.length})`}
          {status === 'success' && (round >= MAX_ROUNDS ? 'All rounds complete!' : `Round ${round} cleared!`)}
          {status === 'fail' && 'Sequence broken'}
        </h2>

        <p className="text-sm md:text-base mb-8 max-w-md" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          {status === 'watch' && 'Memorize the exact spatial order of illuminated tiles.'}
          {status === 'repeat' && `Tap each tile once in the exact order shown (${sequence.length - userSequence.length} taps remaining).`}
          {status === 'success' && `Flawless spatial memory! Earned +${round * 30} pts!`}
          {status === 'fail' && `Missed step ${userSequence.length + 1} of ${sequence.length}. Retry to build focus!`}
        </p>

        {/* Corsi Grid */}
        <div
          className={`grid ${resolvedGridSize === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 w-full max-w-[340px] mx-auto mb-8`}
        >
          {Array.from({ length: resolvedGridSize * resolvedGridSize }).map((_, idx) => {
            const isActive = activeTile === idx;
            const isUserSelected = userSequence.includes(idx) && status === 'repeat';

            let background = 'var(--bg-secondary)';
            let border = '1px solid var(--border-color)';
            let color = 'var(--text-muted)';
            let boxShadow = 'none';

            if (isActive) {
              background = 'var(--accent-teal-bright)';
              border = '1px solid var(--accent-teal)';
              color = '#fff';
              boxShadow = '0 8px 22px rgba(20, 184, 166, 0.45)';
            } else if (status === 'fail') {
              background = '#ffe4e6';
              border = '1px solid #fecdd3';
              color = '#be123c';
            } else if (status === 'success') {
              background = '#d1fae5';
              border = '1px solid #a7f3d0';
              color = '#047857';
            } else if (isUserSelected) {
              background = '#fff7ed';
              border = '1px solid #fed7aa';
              color = '#c2410c';
            }

            return (
              <button
                key={idx}
                disabled={isPlayingSequence || status !== 'repeat'}
                onClick={() => handleTileClick(idx)}
                className="aspect-square rounded-2xl font-extrabold text-xl transition-all duration-150 cursor-pointer flex items-center justify-center relative"
                style={{ background, border, color, boxShadow }}
              >
                {isActive && (
                  <span className="w-5 h-5 rounded-full bg-white/80 animate-ping" />
                )}
                {isUserSelected && (
                  <span className="text-sm font-extrabold">
                    #{userSequence.lastIndexOf(idx) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status Feedback Banner */}
        {status === 'success' && (
          <div
            className="flex items-center justify-center gap-2 text-sm font-extrabold animate-fadeIn py-3 px-6 rounded-2xl"
            style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{round >= MAX_ROUNDS ? 'All rounds mastered! (+50 bonus)' : `Round ${round} mastered! (+${round * 30} pts)`}</span>
          </div>
        )}

        {status === 'fail' && (
          <div
            className="flex items-center justify-center gap-2 text-sm font-extrabold animate-fadeIn py-3 px-6 rounded-2xl"
            style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239' }}
          >
            <XCircle className="w-5 h-5" />
            <span>Final score: {score} pts</span>
          </div>
        )}
      </div>
    </div>
  );
};
