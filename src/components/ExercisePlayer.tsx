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
      if (['Input', 'Textarea'].includes((e.target as HTMLElement)?.tagName)) return;

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          Exit Session
        </button>

        <div className="flex items-center gap-3">
          
          {/* Combo Multiplier Pill */}
          {comboMultiplier > 1 && (
            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-300 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse-glow">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{comboMultiplier}x Combo!</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            {isPaused && <span className="text-[10px] text-amber-400 font-bold uppercase ml-1">(Paused)</span>}
          </div>

          <div className="text-xs text-gray-400 font-semibold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            Rep {currentIndex + 1} of {items.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="glass-panel p-6 md:p-10 mb-6 border border-indigo-500/30 shadow-2xl">
        
        {/* Category & Cognitive Target Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
            {currentItem.category} • {currentItem.cognitiveTarget}
          </span>
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Difficulty Tier {currentItem.difficulty}
          </span>
        </div>

        {/* Question Title & Prompt */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          {currentItem.title}
        </h2>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
          {currentItem.prompt}
        </p>

        {/* Code Snippet Box if exists */}
        {currentItem.contextCode && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs md:text-sm text-emerald-400 overflow-x-auto shadow-inner">
            <pre>{currentItem.contextCode}</pre>
          </div>
        )}

        {/* Reading Passage Box if exists */}
        {currentItem.contextPassage && (
          <div className="mb-6 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-sm italic text-gray-200 leading-relaxed shadow-inner">
            {currentItem.contextPassage}
          </div>
        )}

        {/* Options Grid */}
        <div className="space-y-3 mb-6">
          {currentItem.options?.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentItem.correctAnswer;
            
            let btnClass = "w-full text-left p-4.5 rounded-2xl text-sm font-medium border transition-all flex items-center justify-between ";

            if (isAnswered) {
              if (isCorrect) {
                btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-md shadow-emerald-500/20";
              } else if (isSelected && !isCorrect) {
                btnClass += "bg-rose-500/20 border-rose-500 text-rose-100";
              } else {
                btnClass += "bg-white/5 border-white/5 text-gray-500 opacity-40";
              }
            } else {
              if (isSelected) {
                btnClass += "bg-indigo-600/30 border-indigo-500 text-white shadow-xl shadow-indigo-500/30 scale-[1.01]";
              } else {
                btnClass += "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20";
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
                  <span className="w-6 h-6 rounded-lg bg-white/10 text-xs font-bold text-gray-300 flex items-center justify-center border border-white/10 shrink-0">
                    {idx + 1}
                  </span>
                  <span>{option}</span>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Rationale Box */}
        {isAnswered && (
          <div className={`p-5 rounded-2xl border mb-6 text-xs md:text-sm animate-fadeIn ${
            selectedOption === currentItem.correctAnswer
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1.5 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Cognitive Breakdown & Rationale</span>
            </div>
            <p className="leading-relaxed opacity-95">{currentItem.explanation}</p>
          </div>
        )}

        {/* Hotkey Helper Banner */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4 px-1">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3 text-indigo-400" /> Press <strong>1, 2, 3, 4</strong> to pick options
          </span>
          <span>Press <strong>Enter / Space</strong> to confirm</span>
        </div>

        {/* Action Button */}
        {!isAnswered ? (
          <button
            disabled={!selectedOption}
            onClick={handleSubmitAnswer}
            className={`w-full py-4 rounded-2xl font-heading font-semibold text-base transition-all ${
              selectedOption
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/40 scale-[1.01]'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Rep Answer [Space]
          </button>
        ) : (
          <button
            onClick={handleNextItem}
            className="w-full py-4 rounded-2xl font-heading font-semibold text-base bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center gap-2"
          >
            <span>{currentIndex < items.length - 1 ? 'Next Rep [Space]' : 'Finish Workout [Space]'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

      </div>
    </div>
  );
};
