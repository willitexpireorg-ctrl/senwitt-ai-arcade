import React, { useState, useEffect, useRef } from 'react';
import { Brain, Volume2, Grid, Sparkles } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

interface DualNBackGameProps {
  onComplete: (scoreEarned: number) => void;
  onCancel: () => void;
}

const LETTERS = ['A', 'C', 'H', 'K', 'L', 'O', 'Q', 'R', 'T'];

export const DualNBackGame: React.FC<DualNBackGameProps> = ({ onComplete, onCancel }) => {
  const [nLevel] = useState<number>(1);
  const [trialCount] = useState<number>(12);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [positions, setPositions] = useState<number[]>([]);
  const [letters, setLetters] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [userMatchedPosition, setUserMatchedPosition] = useState<boolean>(false);
  const [userMatchedLetter, setUserMatchedLetter] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready? Pay attention to Position and Letter!');
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Generate trial sequence
  const initGame = React.useCallback((n: number) => {
    const posSeq: number[] = [];
    const letSeq: string[] = [];

    for (let i = 0; i < trialCount; i++) {
      if (i >= n && Math.random() < 0.35) {
        posSeq.push(posSeq[i - n]);
      } else {
        let randPos = Math.floor(Math.random() * 9);
        // Avoid unintended consecutive duplicate positions unless N=1 match
        while (i > 0 && n > 1 && randPos === posSeq[i - 1]) {
          randPos = Math.floor(Math.random() * 9);
        }
        posSeq.push(randPos);
      }

      if (i >= n && Math.random() < 0.35) {
        letSeq.push(letSeq[i - n]);
      } else {
        let randLet = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        while (i > 0 && n > 1 && randLet === letSeq[i - 1]) {
          randLet = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        }
        letSeq.push(randLet);
      }
    }

    setPositions(posSeq);
    setLetters(letSeq);
    setCurrentStep(0);
    setScore(0);
    setIsPlaying(true);
    setGameFinished(false);
  }, [trialCount]);

  useEffect(() => {
    initGame(nLevel);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nLevel, initGame]);

  // Speak letter aloud on each step for true Auditory N-Back
  useEffect(() => {
    if (isPlaying && letters[currentStep]) {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(letters[currentStep]);
          utterance.rate = 1.2;
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {
        // Fallback gracefully if speech synthesis unavailable
      }
    }
  }, [currentStep, isPlaying, letters]);

  // Step loop
  useEffect(() => {
    if (!isPlaying || positions.length === 0) return;

    if (currentStep >= trialCount) {
      setIsPlaying(false);
      setGameFinished(true);
      playFanfareSound();
      const finalScore = score + (nLevel * 40);
      setTimeout(() => {
        onComplete(finalScore);
      }, 1500);
      return;
    }

    // Reset user flags for new step
    setUserMatchedPosition(false);
    setUserMatchedLetter(false);

    timerRef.current = window.setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 2400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isPlaying, positions.length, trialCount, score, nLevel, onComplete]);

  // Keyboard shortcut listeners (P for position, L for letter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameFinished) return;
      if (e.key === 'p' || e.key === 'P' || e.key === '1') {
        handlePositionMatch();
      } else if (e.key === 'l' || e.key === 'L' || e.key === '2') {
        handleLetterMatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameFinished, userMatchedPosition, userMatchedLetter, currentStep, nLevel, positions, letters]);

  const handlePositionMatch = () => {
    if (userMatchedPosition || currentStep < nLevel) return;
    playClickSound();
    setUserMatchedPosition(true);

    const isMatch = positions[currentStep] === positions[currentStep - nLevel];
    if (isMatch) {
      playCorrectSound();
      setScore((s) => s + 25);
      setStatusMessage('Position Match Correct! +25');
    } else {
      playIncorrectSound();
      setScore((s) => Math.max(0, s - 10));
      setStatusMessage('Position Mismatch! -10');
    }
  };

  const handleLetterMatch = () => {
    if (userMatchedLetter || currentStep < nLevel) return;
    playClickSound();
    setUserMatchedLetter(true);

    const isMatch = letters[currentStep] === letters[currentStep - nLevel];
    if (isMatch) {
      playCorrectSound();
      setScore((s) => s + 25);
      setStatusMessage('Letter Match Correct! +25');
    } else {
      playIncorrectSound();
      setScore((s) => Math.max(0, s - 10));
      setStatusMessage('Letter Mismatch! -10');
    }
  };

  const activeGridIndex = positions[currentStep] ?? null;
  const currentLetter = letters[currentStep] ?? '';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 min-h-[85vh] flex flex-col justify-center items-center relative z-10">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs bg-slate-800 text-gray-300 border-b-4 border-slate-950 hover:bg-slate-700"
        >
          ✕ Exit Arena
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-sm shadow-md">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Dual {nLevel}-Back • Trial {Math.min(currentStep + 1, trialCount)}/{trialCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Main Glass Hero Container */}
      <div className="w-full glass-panel p-8 md:p-12 text-center border-2 border-cyan-500/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-wider mb-6 border border-cyan-500/40 shadow-md">
          <Sparkles className="w-4 h-4" />
          Working Memory & Fluid Intelligence
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
          {gameFinished ? 'Dual N-Back Complete! 🎉' : `Match ${nLevel} Step${nLevel > 1 ? 's' : ''} Back 🧠`}
        </h2>
        <p className="text-sm md:text-base text-gray-300 mb-8 max-w-md">
          Compare current grid location & spoken letter to what appeared {nLevel} step{nLevel > 1 ? 's' : ''} ago.
        </p>

        {/* 3x3 Grid Display */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mx-auto mb-8">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isActive = activeGridIndex === idx;
            return (
              <div
                key={idx}
                className={`aspect-square rounded-2xl border-b-4 transition-all duration-150 flex items-center justify-center font-black text-3xl ${
                  isActive
                    ? 'bg-cyan-400 border-cyan-600 text-slate-950 shadow-2xl shadow-cyan-400/80 scale-105 border-b-0 translate-y-1'
                    : 'bg-slate-800/80 border-slate-950 text-gray-600'
                }`}
              >
                {isActive ? currentLetter : ''}
              </div>
            );
          })}
        </div>

        {/* Letter Sound / Display Prompt */}
        <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 mb-8 shadow-inner">
          <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-base font-black text-white tracking-wide">Audio Letter: {currentLetter}</span>
        </div>

        {/* Tactile 3D Action Match Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-6">
          <button
            disabled={userMatchedPosition || currentStep < nLevel}
            onClick={handlePositionMatch}
            className={`btn-3d py-4 px-5 text-xs flex items-center justify-between shadow-xl ${
              userMatchedPosition
                ? 'bg-cyan-900 border-b-4 border-cyan-950 text-cyan-400 opacity-60'
                : 'btn-3d-cyan'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5" />
              <span>Position Match</span>
            </div>
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded-lg border border-white/20 font-mono">
              [P] / [1]
            </span>
          </button>

          <button
            disabled={userMatchedLetter || currentStep < nLevel}
            onClick={handleLetterMatch}
            className={`btn-3d py-4 px-5 text-xs flex items-center justify-between shadow-xl ${
              userMatchedLetter
                ? 'bg-violet-900 border-b-4 border-violet-950 text-violet-400 opacity-60'
                : 'btn-3d-violet'
            }`}
          >
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              <span>Letter Match</span>
            </div>
            <span className="text-[10px] bg-black/20 px-2 py-1 rounded-lg border border-white/20 font-mono">
              [L] / [2]
            </span>
          </button>
        </div>

        {/* Status Feedback */}
        <div className="text-sm font-bold text-cyan-200 py-2 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          {statusMessage}
        </div>
      </div>
    </div>
  );
};
