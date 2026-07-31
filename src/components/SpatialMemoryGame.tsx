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
    <div className="w-full max-w-2xl mx-auto px-4 py-6 min-h-[85vh] flex flex-col justify-center items-center relative z-10">
      
      {/* Top Bar Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={() => {
            clearAllTimers();
            onCancel();
          }}
          className="btn-3d px-4 py-2 text-xs bg-slate-800 text-gray-300 border-b-4 border-slate-950 hover:bg-slate-700"
        >
          ✕ Exit Arena
        </button>

        {/* Duolingo XP & Round Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-sm shadow-md">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Round {round}/4</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Main Hero Card Container */}
      <div className="w-full glass-panel p-8 md:p-12 text-center border-2 border-indigo-500/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center">
        
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-black uppercase tracking-wider mb-6 border border-violet-500/40 shadow-md">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Classic Spatial Corsi Grid
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
          {status === 'watch' && 'Watch the Pattern Light Up... 👁️'}
          {status === 'repeat' && `Tap Tiles in Order (${userSequence.length}/${sequence.length}) 🎯`}
          {status === 'success' && (round >= 4 ? 'Arena Mastery Complete! 🎉' : `Round ${round} Cleared! ✨`)}
          {status === 'fail' && 'Sequence Mis-tapped! 💥'}
        </h2>

        <p className="text-sm md:text-base text-gray-300 mb-8 max-w-md">
          {status === 'watch' && 'Memorize the exact spatial order of illuminated tiles.'}
          {status === 'repeat' && `Tap each tile once in the exact order shown (${sequence.length - userSequence.length} taps remaining).`}
          {status === 'success' && `Flawless spatial memory! Earned +${round * 30} XP!`}
          {status === 'fail' && `Missed step ${userSequence.length + 1} of ${sequence.length}. Retry to build focus!`}
        </p>

        {/* 3x3 Tactile 3D Corsi Grid */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[340px] mx-auto mb-8">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isActive = activeTile === idx;
            const isUserSelected = userSequence.includes(idx) && status === 'repeat';

            let tileStyle = "aspect-square rounded-2xl font-black text-xl transition-all duration-150 cursor-pointer flex items-center justify-center relative border-b-4 ";

            if (isActive) {
              tileStyle += "bg-cyan-400 border-cyan-600 text-slate-950 shadow-2xl shadow-cyan-400/80 scale-105 border-b-0 translate-y-1";
            } else if (status === 'fail') {
              tileStyle += "bg-rose-500/30 border-rose-700 text-rose-200";
            } else if (status === 'success') {
              tileStyle += "bg-emerald-500/40 border-emerald-700 text-emerald-100 scale-105";
            } else if (isUserSelected) {
              tileStyle += "bg-indigo-600 border-indigo-900 text-white shadow-lg border-b-2 translate-y-0.5";
            } else {
              tileStyle += "bg-slate-800/80 border-slate-950 text-gray-400 hover:bg-slate-700/80 hover:border-slate-900 active:translate-y-1 active:border-b-0";
            }

            return (
              <button
                key={idx}
                disabled={isPlayingSequence || status !== 'repeat'}
                onClick={() => handleTileClick(idx)}
                className={tileStyle}
              >
                {isActive && (
                  <span className="w-5 h-5 rounded-full bg-white shadow-lg animate-ping" />
                )}
                {isUserSelected && (
                  <span className="text-sm font-black text-cyan-200">
                    #{userSequence.lastIndexOf(idx) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status Feedback Banner */}
        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-emerald-300 text-base font-black animate-fadeIn py-3 px-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 shadow-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>{round >= 4 ? 'All 4 Rounds Mastered! (+50 Bonus XP)' : `Round ${round} Mastered! (+${round * 30} XP)`}</span>
          </div>
        )}

        {status === 'fail' && (
          <div className="flex items-center justify-center gap-2 text-rose-300 text-base font-black animate-fadeIn py-3 px-6 rounded-2xl bg-rose-500/20 border border-rose-500/40 shadow-xl">
            <XCircle className="w-6 h-6 text-rose-400" />
            <span>Sequence Error — Final Score: {score} XP</span>
          </div>
        )}

      </div>
    </div>
  );
};
