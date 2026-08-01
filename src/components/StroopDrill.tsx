import React, { useState, useEffect, useRef } from 'react';
import { Zap, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

export interface StroopDrillResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface StroopDrillProps {
  onComplete: (result: StroopDrillResult) => void;
  onCancel: () => void;
  trialCount?: number; // default 10
  feedbackMs?: number; // default 400, lower = faster pace
}

interface StroopTrial {
  word: string;
  inkColor: string; // CSS color string or class
  inkName: string; // The correct color name
  isCongruent: boolean;
}

const COLOR_OPTIONS = [
  { name: 'Red', colorClass: 'text-red-500', hex: '#ef4444' },
  { name: 'Blue', colorClass: 'text-blue-500', hex: '#3b82f6' },
  { name: 'Green', colorClass: 'text-emerald-500', hex: '#10b981' },
  { name: 'Yellow', colorClass: 'text-yellow-500', hex: '#ca8a04' },
  { name: 'Purple', colorClass: 'text-purple-500', hex: '#a855f7' },
];

export const StroopDrill: React.FC<StroopDrillProps> = ({ onComplete, onCancel, trialCount = 10, feedbackMs = 400 }) => {
  const [trials, setTrials] = useState<StroopTrial[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalReactionTimeMs, setTotalReactionTimeMs] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const drillStartRef = useRef<number>(Date.now());

  const generateTrials = (count: number): StroopTrial[] => {
    const list: StroopTrial[] = [];
    for (let i = 0; i < count; i++) {
      let wordObj = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
      let inkObj = Math.random() < 0.3
        ? wordObj // congruent
        : COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]; // incongruent

      // Prevent consecutive duplicate word+ink combinations
      while (
        i > 0 &&
        wordObj.name === list[i - 1].word &&
        inkObj.name === list[i - 1].inkName
      ) {
        wordObj = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
        inkObj = Math.random() < 0.3
          ? wordObj
          : COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
      }

      list.push({
        word: wordObj.name,
        inkColor: inkObj.colorClass,
        inkName: inkObj.name,
        isCongruent: wordObj.name === inkObj.name,
      });
    }
    return list;
  };

  useEffect(() => {
    setTrials(generateTrials(trialCount));
    startTimeRef.current = Date.now();
    drillStartRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialCount]);

  // Keyboard shortcut handlers for 1-5 number keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || feedback !== null) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= COLOR_OPTIONS.length) {
        handleAnswer(COLOR_OPTIONS[num - 1].name);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, feedback, currentIndex, trials]);

  const handleAnswer = (selectedColorName: string) => {
    if (isFinished || trials.length === 0) return;
    playClickSound();

    const reactionTime = Date.now() - startTimeRef.current;
    setTotalReactionTimeMs((prev) => prev + reactionTime);

    const currentTrial = trials[currentIndex];
    const isCorrect = selectedColorName === currentTrial.inkName;

    let nextCorrectCount = correctCount;
    let nextScore = score;

    if (isCorrect) {
      playCorrectSound();
      setFeedback('correct');
      // Speed bonus: faster reaction time gets higher points
      const speedBonus = Math.max(10, Math.floor(1000 - reactionTime) / 10);
      nextScore = score + 30 + Math.floor(speedBonus);
      nextCorrectCount = correctCount + 1;
      setScore(nextScore);
      setCorrectCount(nextCorrectCount);
    } else {
      playIncorrectSound();
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 >= trials.length) {
        setIsFinished(true);
        playFanfareSound();
        setTimeout(() => {
          onComplete({
            scoreEarned: nextScore,
            correctCount: nextCorrectCount,
            totalItems: trials.length,
            totalTimeMs: Date.now() - drillStartRef.current,
          });
        }, 1200);
      } else {
        setCurrentIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }
    }, feedbackMs);
  };

  const currentTrial = trials[currentIndex];
  const avgReactionTime = correctCount > 0 ? Math.round(totalReactionTimeMs / (currentIndex + 1)) : 0;

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
            Level cue · {trialCount} trials
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
          >
            <Zap className="w-4 h-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            <span>Stroop speed • {currentIndex + 1}/{trials.length || trialCount}</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
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
          Inhibition Control & Cognitive Speed
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {isFinished ? 'Stroop speed complete!' : 'Select the ink color'}
        </h2>
        <p className="text-sm md:text-base mb-8 max-w-md" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          Ignore what the word spells — tap the button matching the font's actual visual ink color.
        </p>

        {/* Big Word Display Card */}
        {currentTrial && !isFinished && (
          <div
            className="w-full max-w-md rounded-3xl py-10 mb-8 flex flex-col items-center justify-center min-h-[160px]"
            style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
          >
            <span className={`text-4xl md:text-6xl font-extrabold uppercase tracking-widest transition-all ${currentTrial.inkColor} ${feedback === 'correct' ? 'scale-110' : feedback === 'wrong' ? 'animate-shake' : ''}`}>
              {currentTrial.word}
            </span>

            {feedback === 'correct' && (
              <span className="text-sm font-extrabold mt-4 flex items-center gap-1.5 animate-fadeIn" style={{ color: '#047857' }}>
                <CheckCircle2 className="w-5 h-5" /> Fast & accurate!
              </span>
            )}
            {feedback === 'wrong' && (
              <span className="text-sm font-extrabold mt-4 flex items-center gap-1.5 animate-fadeIn" style={{ color: '#be123c' }}>
                <XCircle className="w-5 h-5" /> Ink color was {currentTrial.inkName}
              </span>
            )}
          </div>
        )}

        {/* Reaction Time & Score */}
        <div className="w-full max-w-md flex items-center justify-between text-xs md:text-sm font-bold mb-6 px-2" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} /> Avg speed: {avgReactionTime}ms
          </span>
          <span className="font-extrabold" style={{ color: 'var(--accent-teal)' }}>Total: {score} pts</span>
        </div>

        {/* Answer Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
          {COLOR_OPTIONS.map((opt, idx) => (
            <button
              key={opt.name}
              onClick={() => handleAnswer(opt.name)}
              className="btn-3d py-3.5 px-3 text-xs flex items-center justify-between"
              style={{ background: '#fff', color: 'var(--text-primary)', borderBottom: '4px solid #d7e0ea' }}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${opt.colorClass.replace('text-', 'bg-')}`} />
                <span>{opt.name}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                [{idx + 1}]
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
