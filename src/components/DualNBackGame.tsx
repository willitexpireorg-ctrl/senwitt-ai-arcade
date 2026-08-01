import React, { useState, useEffect, useRef } from 'react';
import { Brain, Volume2, Grid, Sparkles } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

export interface DualNBackResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface DualNBackGameProps {
  onComplete: (result: DualNBackResult) => void;
  onCancel: () => void;
  nLevel?: number; // default 1, clamp 1-3
}

const LETTERS = ['A', 'C', 'H', 'K', 'L', 'O', 'Q', 'R', 'T'];

export const DualNBackGame: React.FC<DualNBackGameProps> = ({ onComplete, onCancel, nLevel: nLevelProp = 1 }) => {
  const [nLevel] = useState<number>(Math.min(3, Math.max(1, nLevelProp)));
  const [trialCount] = useState<number>(12);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [positions, setPositions] = useState<number[]>([]);
  const [letters, setLetters] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [userMatchedPosition, setUserMatchedPosition] = useState<boolean>(false);
  const [userMatchedLetter, setUserMatchedLetter] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready? Pay attention to position and letter!');
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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
    startTimeRef.current = Date.now();
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
      const correctCount = Math.max(0, Math.min(trialCount, Math.round(finalScore / 25)));
      setTimeout(() => {
        onComplete({
          scoreEarned: finalScore,
          correctCount,
          totalItems: trialCount,
          totalTimeMs: Date.now() - startTimeRef.current,
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, gameFinished, userMatchedPosition, userMatchedLetter, currentStep, nLevel, positions, letters]);

  const handlePositionMatch = () => {
    if (userMatchedPosition || currentStep < nLevel) return;
    playClickSound();
    setUserMatchedPosition(true);

    const isMatch = positions[currentStep] === positions[currentStep - nLevel];
    if (isMatch) {
      playCorrectSound();
      setScore((s) => s + 25);
      setStatusMessage('Position match correct! +25');
    } else {
      playIncorrectSound();
      setScore((s) => Math.max(0, s - 10));
      setStatusMessage('Position mismatch! -10');
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
      setStatusMessage('Letter match correct! +25');
    } else {
      playIncorrectSound();
      setScore((s) => Math.max(0, s - 10));
      setStatusMessage('Letter mismatch! -10');
    }
  };

  const activeGridIndex = positions[currentStep] ?? null;
  const currentLetter = letters[currentStep] ?? '';

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      {/* Top Header */}
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
            className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-xl"
            style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
          >
            Level cue · n={nLevel}
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Brain className="w-4 h-4" />
            <span>Dual {nLevel}-Back • Trial {Math.min(currentStep + 1, trialCount)}/{trialCount}</span>
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
          Working Memory & Fluid Intelligence
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {gameFinished ? 'Dual n-back complete!' : `Match ${nLevel} step${nLevel > 1 ? 's' : ''} back`}
        </h2>
        <p className="text-sm md:text-base mb-8 max-w-md" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          Compare the current grid location & spoken letter to what appeared {nLevel} step{nLevel > 1 ? 's' : ''} ago.
        </p>

        {/* 3x3 Grid Display */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mx-auto mb-8">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isActive = activeGridIndex === idx;
            return (
              <div
                key={idx}
                className="aspect-square rounded-2xl transition-all duration-150 flex items-center justify-center font-extrabold text-3xl"
                style={
                  isActive
                    ? { background: 'var(--accent-teal-bright)', border: '1px solid var(--accent-teal)', color: '#fff', boxShadow: '0 8px 22px rgba(20, 184, 166, 0.45)' }
                    : { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }
                }
              >
                {isActive ? currentLetter : ''}
              </div>
            );
          })}
        </div>

        {/* Letter Sound / Display Prompt */}
        <div
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl mb-8"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          <Volume2 className="w-5 h-5" style={{ color: 'var(--accent-teal)' }} />
          <span className="text-base font-extrabold tracking-wide" style={{ color: 'var(--text-primary)' }}>Audio letter: {currentLetter}</span>
        </div>

        {/* Tactile Action Match Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-6">
          <button
            disabled={userMatchedPosition || currentStep < nLevel}
            onClick={handlePositionMatch}
            className={`btn-3d py-4 px-5 text-xs flex items-center justify-between ${
              userMatchedPosition ? '' : 'btn-3d-teal'
            }`}
            style={userMatchedPosition ? { background: '#f0fdfa', border: '1px solid #99f6e4', color: 'var(--accent-teal)', opacity: 0.7 } : undefined}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5" />
              <span>Position match</span>
            </div>
            <span className="text-[10px] bg-black/10 px-2 py-1 rounded-lg font-mono">
              [P] / [1]
            </span>
          </button>

          <button
            disabled={userMatchedLetter || currentStep < nLevel}
            onClick={handleLetterMatch}
            className={`btn-3d py-4 px-5 text-xs flex items-center justify-between ${
              userMatchedLetter ? '' : 'btn-3d-coral'
            }`}
            style={userMatchedLetter ? { background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', opacity: 0.7 } : undefined}
          >
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              <span>Letter match</span>
            </div>
            <span className="text-[10px] bg-black/10 px-2 py-1 rounded-lg font-mono">
              [L] / [2]
            </span>
          </button>
        </div>

        {/* Status Feedback */}
        <div
          className="text-sm font-bold py-2 px-4 rounded-xl"
          style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
        >
          {statusMessage}
        </div>
      </div>
    </div>
  );
};
