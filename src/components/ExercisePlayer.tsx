import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronRight, Zap, Sparkles, Command, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ExerciseItem, SessionResult, AttemptResult, SetMode } from '../types';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

interface ExercisePlayerProps {
  items: ExerciseItem[];
  setMode: SetMode;
  onComplete: (result: SessionResult) => void;
  onCancel: () => void;
}

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({ items, setMode, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);

  const currentItem = items[currentIndex];

  // Visibility & Tab Blur Pause Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Timer Effect with Pause Check
  useEffect(() => {
    setStartTime(Date.now());
    const interval = setInterval(() => {
      if (!isPaused) {
        setTimerSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  // Keyboard Shortcuts (1, 2, 3, 4, Enter, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!isAnswered && currentItem?.options) {
        if (e.key === '1' && currentItem.options[0]) handleSelectOption(currentItem.options[0]);
        if (e.key === '2' && currentItem.options[1]) handleSelectOption(currentItem.options[1]);
        if (e.key === '3' && currentItem.options[2]) handleSelectOption(currentItem.options[2]);
        if (e.key === '4' && currentItem.options[3]) handleSelectOption(currentItem.options[3]);
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isAnswered && selectedOption) {
          handleSubmitAnswer();
        } else if (isAnswered) {
          handleNextItem();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, selectedOption, currentItem, currentIndex]);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswered || !currentItem) return;

    const elapsed = Date.now() - startTime;
    const timeSpent = Math.min(30000, elapsed);
    const isCorrect = selectedOption === currentItem.correctAnswer;
    
    let nextCombo = comboMultiplier;
    if (isCorrect) {
      nextCombo = comboMultiplier + 1;
      setComboMultiplier(nextCombo);
      playCorrectSound();
    } else {
      setComboMultiplier(1);
      playIncorrectSound();
    }

    const basePoints = isCorrect ? Math.max(10, 25 - Math.floor(timeSpent / 2000)) : 0;
    const scoreEarned = isCorrect ? basePoints * nextCombo : 0;

    const attempt: AttemptResult = {
      itemId: currentItem.id,
      category: currentItem.category,
      isCorrect,
      timeSpentMs: timeSpent,
      scoreEarned,
      userAnswer: selectedOption,
      explanation: currentItem.explanation,
      timestamp: new Date().toISOString(),
    };

    setAttempts((prev) => [...prev, attempt]);
    setIsAnswered(true);

    if (isCorrect) {
      confetti({
        particleCount: 30 * nextCombo,
        spread: 60 + nextCombo * 10,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b'],
      });
    }
  };

  const handleNextItem = () => {
    playClickSound();
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      playFanfareSound();
      const allAttempts = [...attempts];
      const correctCount = allAttempts.filter((a) => a.isCorrect).length;
      const totalTimeMs = allAttempts.reduce((acc, a) => acc + a.timeSpentMs, 0);
      const totalPoints = allAttempts.reduce((acc, a) => acc + a.scoreEarned, 0);

      const accuracyPct = correctCount / items.length;
      const sharpnessDelta = Math.round(totalPoints * 0.8 + accuracyPct * 15);

      const sessionResult: SessionResult = {
        id: `session-${Date.now()}`,
        mode: setMode,
        date: new Date().toISOString().split('T')[0],
        totalItems: items.length,
        correctCount,
        totalTimeSpentMs: totalTimeMs,
        sharpnessDelta,
        finalSharpness: 0,
        attempts: allAttempts,
      };

      onComplete(sessionResult);
    }
  };

  if (!currentItem) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 min-h-[85vh] flex flex-col justify-center items-center relative z-10">
      
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs bg-slate-800 text-gray-300 border-b-4 border-slate-950 hover:bg-slate-700"
        >
          ✕ Exit Session
        </button>

        <div className="flex items-center gap-3">
          
          {/* Combo Multiplier Pill */}
          {comboMultiplier > 1 && (
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 px-3.5 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/20 animate-bounce">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{comboMultiplier}x Streak Combo!</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-extrabold px-3.5 py-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 shadow-md">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            {isPaused && <span className="text-[10px] text-amber-400 font-bold uppercase ml-1">(Paused)</span>}
          </div>

          <div className="text-xs text-gray-300 font-extrabold bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700">
            Rep {currentIndex + 1} of {items.length}
          </div>
        </div>
      </div>

      {/* Duolingo Progress Bar */}
      <div className="w-full h-3 bg-slate-900 rounded-full mb-8 overflow-hidden border border-slate-800 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Main Glass Hero Card */}
      <div className="w-full glass-panel p-8 md:p-12 border-2 border-indigo-500/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center text-center">
        
        {/* Category & Difficulty Pill */}
        <div className="flex items-center justify-between w-full mb-6">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-300 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 shadow-md">
            {currentItem.category} • {currentItem.cognitiveTarget}
          </span>
          <span className="text-xs font-black text-amber-400 flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            Difficulty Tier {currentItem.difficulty}
          </span>
        </div>

        {/* Question Title & Prompt */}
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
          {currentItem.title}
        </h2>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
          {currentItem.prompt}
        </p>

        {/* Code Snippet Box if exists */}
        {currentItem.contextCode && (
          <div className="w-full mb-6 p-5 rounded-2xl bg-slate-950 border-2 border-slate-800 font-mono text-xs md:text-sm text-emerald-400 text-left overflow-x-auto shadow-2xl">
            <pre>{currentItem.contextCode}</pre>
          </div>
        )}

        {/* Reading Passage Box if exists */}
        {currentItem.contextPassage && (
          <div className="w-full mb-6 p-6 rounded-2xl bg-indigo-950/40 border-2 border-indigo-500/30 text-sm md:text-base italic text-gray-200 text-left leading-relaxed shadow-inner">
            {currentItem.contextPassage}
          </div>
        )}

        {/* 3D Tactile Option Buttons */}
        <div className="space-y-4 w-full mb-6">
          {currentItem.options?.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentItem.correctAnswer;
            
            let btnClass = "btn-3d w-full p-5 text-left text-xs md:text-sm font-bold border-b-4 flex items-center justify-between shadow-lg ";

            if (isAnswered) {
              if (isCorrect) {
                btnClass += "bg-emerald-600 border-emerald-900 text-white shadow-emerald-500/30";
              } else if (isSelected && !isCorrect) {
                btnClass += "bg-rose-600 border-rose-900 text-white";
              } else {
                btnClass += "bg-slate-900 border-slate-950 text-gray-600 opacity-40";
              }
            } else {
              if (isSelected) {
                btnClass += "bg-indigo-600 border-indigo-900 text-white shadow-indigo-500/40 border-b-2 translate-y-0.5";
              } else {
                btnClass += "bg-slate-800 text-gray-200 border-slate-950 hover:bg-slate-700 active:border-b-0";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(option)}
                className={btnClass}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-black/30 text-xs font-black text-indigo-300 flex items-center justify-center border border-white/10 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{option}</span>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Rationale Box */}
        {isAnswered && (
          <div className={`w-full p-6 rounded-2xl border-2 mb-6 text-xs md:text-sm text-left animate-fadeIn shadow-xl ${
            selectedOption === currentItem.correctAnswer
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-100'
          }`}>
            <div className="flex items-center gap-2 font-black mb-2 text-sm uppercase tracking-wider">
              <Sparkles className="w-5 h-5" />
              <span>Cognitive Breakdown & Rationale</span>
            </div>
            <p className="leading-relaxed opacity-95">{currentItem.explanation}</p>
          </div>
        )}

        {/* Hotkey Helper Banner */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-6 w-full px-1 font-semibold">
          <span className="flex items-center gap-1.5">
            <Command className="w-4 h-4 text-indigo-400" /> Press <strong>1, 2, 3, 4</strong> to pick options
          </span>
          <span>Press <strong>Enter / Space</strong> to confirm</span>
        </div>

        {/* Action Button */}
        {!isAnswered ? (
          <button
            disabled={!selectedOption}
            onClick={handleSubmitAnswer}
            className={`btn-3d w-full py-4 text-base shadow-2xl ${
              selectedOption
                ? 'btn-3d-indigo'
                : 'bg-slate-800 border-b-4 border-slate-950 text-gray-600 cursor-not-allowed'
            }`}
          >
            Submit Rep Answer [Space]
          </button>
        ) : (
          <button
            onClick={handleNextItem}
            className="btn-3d btn-3d-emerald w-full py-4 text-base shadow-2xl flex items-center justify-center gap-2"
          >
            <span>{currentIndex < items.length - 1 ? 'Next Rep [Space]' : 'Finish Workout [Space]'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

      </div>
    </div>
  );
};
