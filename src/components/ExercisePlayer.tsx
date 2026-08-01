import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronRight, Zap, Sparkles, Command, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ExerciseItem, SessionResult, AttemptResult, SetMode } from '../types';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';
import { getLocalDateString } from '../services/storage';

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
  const attemptsRef = useRef<AttemptResult[]>([]);
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

    // Ref keeps the just-answered attempt available for Done (avoid stale React state).
    attemptsRef.current = [...attemptsRef.current, attempt];
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
      const allAttempts = attemptsRef.current;
      const correctCount = allAttempts.filter((a) => a.isCorrect).length;
      const totalTimeMs = allAttempts.reduce((acc, a) => acc + a.timeSpentMs, 0);
      const totalPoints = allAttempts.reduce((acc, a) => acc + a.scoreEarned, 0);

      const accuracyPct = items.length > 0 ? correctCount / items.length : 0;
      const sharpnessDelta = Math.round(totalPoints * 0.8 + accuracyPct * 15);

      const sessionResult: SessionResult = {
        id: `session-${Date.now()}`,
        mode: setMode,
        date: getLocalDateString(),
        totalItems: Math.max(items.length, allAttempts.length),
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
          {comboMultiplier > 1 && (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl animate-bounce"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
            >
              <Flame className="w-4 h-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
              <span>{comboMultiplier}x combo</span>
            </div>
          )}

          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Clock className="w-4 h-4" />
            <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            {isPaused && <span className="text-[10px] font-bold uppercase ml-1" style={{ color: '#d97706' }}>(Paused)</span>}
          </div>

          <div
            className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Rep {currentIndex + 1} of {items.length}
          </div>
        </div>
      </div>

      <div className="w-full h-3 rounded-full mb-8 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        <div
          className="h-full progress-bar-teal transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-between w-full mb-6 gap-2 flex-wrap">
          <span
            className="text-xs font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full text-left"
            style={{
              background: '#ccfbf1',
              border: '1px solid #99f6e4',
              color: 'var(--accent-teal)',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              maxWidth: '100%',
              lineHeight: 1.35,
            }}
          >
            {currentItem.category} • {currentItem.cognitiveTarget}
          </span>
          <span
            className="text-xs font-extrabold flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
          >
            <Zap className="w-4 h-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            Tier {currentItem.difficulty}
          </span>
        </div>

        <h2
          className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight w-full"
          style={{ color: 'var(--text-primary)', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.25 }}
        >
          {currentItem.title}
        </h2>
        <p
          className="text-sm md:text-base leading-relaxed mb-6 max-w-xl w-full"
          style={{ color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
        >
          {currentItem.prompt}
        </p>

        {currentItem.contextCode && (
          <div
            className="w-full mb-6 p-5 rounded-2xl font-mono text-xs md:text-sm text-left overflow-x-auto"
            style={{ background: '#0f2744', color: '#5eead4', border: '1px solid #1e3a5f' }}
          >
            <pre>{currentItem.contextCode}</pre>
          </div>
        )}

        {currentItem.contextPassage && (
          <div
            className="w-full mb-6 p-6 rounded-2xl text-sm md:text-base italic text-left leading-relaxed"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: 'var(--text-primary)' }}
          >
            {currentItem.contextPassage}
          </div>
        )}

        <div className="space-y-3 w-full mb-6">
          {currentItem.options?.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentItem.correctAnswer;

            let btnClass = 'btn-3d w-full p-5 text-left text-xs md:text-sm font-bold border-b-4 flex items-start justify-between gap-2 ';

            if (isAnswered) {
              if (isCorrect) {
                btnClass += 'bg-emerald-500 border-emerald-700 text-white';
              } else if (isSelected && !isCorrect) {
                btnClass += 'bg-rose-500 border-rose-700 text-white';
              } else {
                btnClass += 'bg-white border-[#d7e0ea] text-[var(--text-muted)] opacity-55';
              }
            } else if (isSelected) {
              btnClass += 'btn-3d-teal border-b-2';
            } else {
              btnClass += 'bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(option)}
                className={btnClass}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span
                    className="w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: isSelected && !isAnswered ? 'rgba(255,255,255,0.22)' : 'var(--bg-secondary)',
                      color: isSelected && !isAnswered ? '#fff' : 'var(--accent-teal)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="leading-snug"
                    style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                  >
                    {option}
                  </span>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className="w-full p-6 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: selectedOption === currentItem.correctAnswer ? '#ecfdf5' : '#fff1f2',
              borderColor: selectedOption === currentItem.correctAnswer ? '#a7f3d0' : '#fecdd3',
              color: selectedOption === currentItem.correctAnswer ? '#065f46' : '#9f1239',
            }}
          >
            <div className="flex items-center gap-2 font-extrabold mb-2 text-sm uppercase tracking-wider">
              <Sparkles className="w-5 h-5" />
              <span>Why this answer</span>
            </div>
            <p className="leading-relaxed">{currentItem.explanation}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs mb-6 w-full px-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5">
            <Command className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} /> Press <strong>1–4</strong> to pick
          </span>
          <span>Press <strong>Enter / Space</strong></span>
        </div>

        {!isAnswered ? (
          <button
            disabled={!selectedOption}
            onClick={handleSubmitAnswer}
            className={`btn-3d w-full py-4 text-base ${
              selectedOption
                ? 'btn-3d-coral'
                : 'bg-[#e2ebf4] border-b-4 border-[#c5d3e0] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          >
            Check answer
          </button>
        ) : (
          <button
            onClick={handleNextItem}
            className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <span>{currentIndex < items.length - 1 ? 'Next' : 'Done'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
