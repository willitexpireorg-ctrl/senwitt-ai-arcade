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
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
        >
          Exit Game
        </button>

        <div className="flex items-center gap-2 text-xs text-cyan-300 font-bold px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>Dual {nLevel}-Back • Trial {Math.min(currentStep + 1, trialCount)}/{trialCount}</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel p-6 md:p-8 text-center border border-cyan-500/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Working Memory & Fluid Intelligence
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          {gameFinished ? 'Dual N-Back Complete! 🎉' : `Match ${nLevel} Step${nLevel > 1 ? 's' : ''} Back`}
        </h2>
        <p className="text-xs text-gray-300 mb-6">
          Compare the current position & letter to what appeared {nLevel} step{nLevel > 1 ? 's' : ''} ago.
        </p>

        {/* 3x3 Grid Display */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isActive = activeGridIndex === idx;
            return (
              <div
                key={idx}
                className={`aspect-square rounded-2xl border transition-all duration-200 flex items-center justify-center font-extrabold text-2xl ${
                  isActive
                    ? 'bg-cyan-500 border-cyan-300 shadow-lg shadow-cyan-500/50 scale-105 text-white'
                    : 'bg-white/5 border-white/10 text-white/20'
                }`}
              >
                {isActive ? currentLetter : ''}
              </div>
            );
          })}
        </div>

        {/* Letter Sound / Display Prompt */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-6">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-extrabold text-white">Current Letter: {currentLetter}</span>
        </div>

        {/* Action Match Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            disabled={userMatchedPosition || currentStep < nLevel}
            onClick={handlePositionMatch}
            className={`py-3.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between border transition-all ${
              userMatchedPosition
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/40 shadow-lg shadow-cyan-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              <span>Position Match</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded border border-white/20 font-mono">
              [P] / [1]
            </span>
          </button>

          <button
            disabled={userMatchedLetter || currentStep < nLevel}
            onClick={handleLetterMatch}
            className={`py-3.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between border transition-all ${
              userMatchedLetter
                ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-indigo-400/40 shadow-lg shadow-indigo-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Letter Match</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded border border-white/20 font-mono">
              [L] / [2]
            </span>
          </button>
        </div>

        {/* Status Feedback */}
        <div className="text-xs text-gray-300 font-medium">
          {statusMessage}
        </div>
      </div>
    </div>
  );
};
