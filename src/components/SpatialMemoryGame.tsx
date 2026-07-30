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
      newSeq.push(Math.floor(Math.random() * (gridSize * gridSize)));
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
    }, 750);
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
      }, 1400);
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      playCorrectSound();
      const points = round * 30;
      setScore((prev) => prev + points);

      if (round >= 4) {
        playFanfareSound();
        setStatus('success');
        addTimeout(() => {
          onComplete(score + points + 50);
        }, 1400);
      } else {
        addTimeout(() => {
          setRound((r) => r + 1);
        }, 800);
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
          {status === 'watch' && 'Watch the Tile Pattern...'}
          {status === 'repeat' && 'Repeat the Tile Sequence!'}
          {status === 'success' && 'Round Mastery Achieved! 🎉'}
          {status === 'fail' && 'Sequence Broken!'}
        </h2>

        <p className="text-xs text-gray-300 mb-6">
          {status === 'watch' ? 'Observe the order in which the tiles illuminate.' : 'Tap the grid tiles in the exact order shown.'}
        </p>

        {/* 3x3 Interactive Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-6">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isActive = activeTile === idx;
            const isUserSelected = userSequence.includes(idx) && status === 'repeat';

            let tileClass = "aspect-square rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-center font-bold text-lg ";

            if (isActive) {
              tileClass += "bg-indigo-500 border-indigo-300 shadow-xl shadow-indigo-500/50 scale-105";
            } else if (status === 'fail') {
              tileClass += "bg-rose-500/20 border-rose-500/40 text-rose-300";
            } else if (status === 'success') {
              tileClass += "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 scale-105";
            } else if (isUserSelected) {
              tileClass += "bg-cyan-500/30 border-cyan-400 text-cyan-200";
            } else {
              tileClass += "bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20 text-white/50";
            }

            return (
              <button
                key={idx}
                disabled={isPlayingSequence || status !== 'repeat'}
                onClick={() => handleTileClick(idx)}
                className={tileClass}
              >
                {isActive || isUserSelected ? (idx + 1) : ''}
              </button>
            );
          })}
        </div>

        {/* Status Indicator */}
        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5" /> Perfect Spatial Recall!
          </div>
        )}

        {status === 'fail' && (
          <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold animate-fadeIn">
            <XCircle className="w-5 h-5" /> Sequence Error
          </div>
        )}

      </div>
    </div>
  );
};
