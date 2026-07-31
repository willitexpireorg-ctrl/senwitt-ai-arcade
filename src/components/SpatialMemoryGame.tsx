import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

interface SpatialMemoryGameProps {
  onComplete: (scoreEarned: number) => void;
  onCancel: () => void;
}

export const SpatialMemoryGame: React.FC<SpatialMemoryGameProps> = ({ onComplete, onCancel }) => {
  const [gridSize] = useState<number>(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(true);
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [status, setStatus] = useState<'watch' | 'repeat' | 'success' | 'fail'>('watch');

  // Timers cleanup ref
  const timersRef = useRef<Array<number>>(window ? [] : []);

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

  // Start new round
  useEffect(() => {
    startRound(round);
    return () => clearAllTimers();
  }, [round]);

  const startRound = (currentRound: number) => {
    clearAllTimers();
    setStatus('watch');
    setIsPlayingSequence(true);
    setUserSequence([]);

    const seqLength = currentRound + 2;
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      let nextTile = Math.floor(Math.random() * (gridSize * gridSize));
      // Avoid consecutive duplicate tiles to eliminate player confusion
      while (i > 0 && nextTile === newSeq[i - 1]) {
        nextTile = Math.floor(Math.random() * (gridSize * gridSize));
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
        onComplete(score);
      }, 1600);
      return;
    }

    // Single step matched correctly
    if (nextUserSeq.length === sequence.length) {
      playCorrectSound();
      const points = round * 30;
      setScore((prev) => prev + points);

      if (round >= 4) {
        playFanfareSound();
        setStatus('success');
        addTimeout(() => {
          onComplete(score + points + 50);
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
    <div className="max-w-md mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            clearAllTimers();
            onCancel();
          }}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
        >
          Exit Game
        </button>

        <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Brain className="w-4 h-4 text-violet-400" />
          <span>Round {round} of 4 • Score: {score}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-panel p-6 md:p-8 text-center border border-indigo-500/30">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider mb-4 border border-violet-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Spatial Working Memory Rep
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {status === 'watch' && 'Watch the Flashing Sequence...'}
          {status === 'repeat' && `Tap Tiles in Order (${userSequence.length}/${sequence.length})`}
          {status === 'success' && (round >= 4 ? 'Exercise Completed! 🎉' : `Round ${round} Cleared! ✨`)}
          {status === 'fail' && 'Sequence Mis-tapped!'}
        </h2>

        <p className="text-xs text-gray-300 mb-6">
          {status === 'watch' && 'Memorize the exact order of glowing tiles.'}
          {status === 'repeat' && `Tap each tile once in the exact order shown (${sequence.length - userSequence.length} taps remaining).`}
          {status === 'success' && `Great job! Earned +${round * 30} PTS!`}
          {status === 'fail' && `Wrong tile tapped on step ${userSequence.length} of ${sequence.length}.`}
        </p>

        {/* 3x3 Interactive Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-6">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isActive = activeTile === idx;
            const isUserSelected = userSequence.includes(idx) && status === 'repeat';

            let tileClass = "aspect-square rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-center font-bold text-lg ";

            if (isActive) {
              tileClass += "bg-cyan-400 border-cyan-200 shadow-xl shadow-cyan-400/60 scale-105";
            } else if (status === 'fail') {
              tileClass += "bg-rose-500/20 border-rose-500/40 text-rose-300";
            } else if (status === 'success') {
              tileClass += "bg-emerald-500/30 border-emerald-400/60 scale-105";
            } else if (isUserSelected) {
              tileClass += "bg-indigo-500/40 border-indigo-300 shadow-md shadow-indigo-500/30";
            } else {
              tileClass += "bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20";
            }

            return (
              <button
                key={idx}
                disabled={isPlayingSequence || status !== 'repeat'}
                onClick={() => handleTileClick(idx)}
                className={tileClass}
              >
                {/* Tile indicator icon or clean spatial tile glow */}
                {isActive && (
                  <span className="w-4 h-4 rounded-full bg-white shadow-lg animate-ping" />
                )}
                {isUserSelected && (
                  <span className="text-xs font-semibold text-indigo-200">
                    #{userSequence.lastIndexOf(idx) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status Indicator */}
        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold animate-fadeIn py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{round >= 4 ? 'All 4 Rounds Mastered!' : `Round ${round} Completed! (+${round * 30} PTS)`}</span>
          </div>
        )}

        {status === 'fail' && (
          <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold animate-fadeIn py-2 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>Sequence Error — Final Score: {score}</span>
          </div>
        )}

      </div>
    </div>
  );
};
