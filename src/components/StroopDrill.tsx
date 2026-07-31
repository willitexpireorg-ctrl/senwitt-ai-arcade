import React, { useState, useEffect, useRef } from 'react';
import { Zap, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

interface StroopDrillProps {
  onComplete: (scoreEarned: number) => void;
  onCancel: () => void;
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
  { name: 'Yellow', colorClass: 'text-yellow-400', hex: '#facc15' },
  { name: 'Purple', colorClass: 'text-purple-400', hex: '#c084fc' },
];

export const StroopDrill: React.FC<StroopDrillProps> = ({ onComplete, onCancel }) => {
  const [trials, setTrials] = useState<StroopTrial[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalReactionTimeMs, setTotalReactionTimeMs] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());

  const generateTrials = (count: number = 10): StroopTrial[] => {
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
    setTrials(generateTrials(10));
    startTimeRef.current = Date.now();
  }, []);

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
  }, [isFinished, feedback, currentIndex, trials]);

  const handleAnswer = (selectedColorName: string) => {
    if (isFinished || trials.length === 0) return;
    playClickSound();

    const reactionTime = Date.now() - startTimeRef.current;
    setTotalReactionTimeMs((prev) => prev + reactionTime);

    const currentTrial = trials[currentIndex];
    const isCorrect = selectedColorName === currentTrial.inkName;

    if (isCorrect) {
      playCorrectSound();
      setFeedback('correct');
      // Speed bonus: faster reaction time gets higher points
      const speedBonus = Math.max(10, Math.floor(1000 - reactionTime) / 10);
      setScore((s) => s + 30 + Math.floor(speedBonus));
      setCorrectCount((c) => c + 1);
    } else {
      playIncorrectSound();
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 >= trials.length) {
        setIsFinished(true);
        playFanfareSound();
        const finalScore = score + (isCorrect ? 30 : 0);
        setTimeout(() => {
          onComplete(finalScore);
        }, 1200);
      } else {
        setCurrentIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }
    }, 400);
  };

  const currentTrial = trials[currentIndex];
  const avgReactionTime = correctCount > 0 ? Math.round(totalReactionTimeMs / (currentIndex + 1)) : 0;

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
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm shadow-md">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Stroop Speed • {currentIndex + 1}/{trials.length || 10}</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Main Glass Hero Container */}
      <div className="w-full glass-panel p-8 md:p-12 text-center border-2 border-amber-500/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-6 border border-amber-500/40 shadow-md">
          <Sparkles className="w-4 h-4" />
          Inhibition Control & Cognitive Speed
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
          {isFinished ? 'Stroop Speed Complete! 🎉' : 'Select the INK COLOR! 🎨'}
        </h2>
        <p className="text-sm md:text-base text-gray-300 mb-8 max-w-md">
          Ignore what the word spells — tap the button matching the font's actual visual ink color!
        </p>

        {/* Big Word Display Card */}
        {currentTrial && !isFinished && (
          <div className="w-full max-w-md bg-slate-950 border-2 border-slate-800 rounded-3xl py-10 mb-8 shadow-2xl flex flex-col items-center justify-center min-h-[160px]">
            <span className={`text-4xl md:text-6xl font-black uppercase tracking-widest transition-all ${currentTrial.inkColor} ${feedback === 'correct' ? 'scale-110' : feedback === 'wrong' ? 'animate-shake' : ''}`}>
              {currentTrial.word}
            </span>

            {feedback === 'correct' && (
              <span className="text-emerald-400 text-sm font-black mt-4 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5" /> Fast & Accurate!
              </span>
            )}
            {feedback === 'wrong' && (
              <span className="text-rose-400 text-sm font-black mt-4 flex items-center gap-1.5 animate-fadeIn">
                <XCircle className="w-5 h-5" /> Ink color was {currentTrial.inkName}!
              </span>
            )}
          </div>
        )}

        {/* Reaction Time & XP Badge */}
        <div className="w-full max-w-md flex items-center justify-between text-xs md:text-sm font-bold text-gray-400 mb-6 px-2">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Avg Speed: {avgReactionTime}ms
          </span>
          <span className="text-amber-300 font-extrabold">Total XP: {score}</span>
        </div>

        {/* 3D Tactile Answer Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
          {COLOR_OPTIONS.map((opt, idx) => (
            <button
              key={opt.name}
              onClick={() => handleAnswer(opt.name)}
              className="btn-3d py-3.5 px-3 text-xs bg-slate-800 text-white border-b-4 border-slate-950 hover:bg-slate-700 active:border-b-0 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${opt.colorClass.replace('text-', 'bg-')}`} />
                <span>{opt.name}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono font-bold bg-black/30 px-1.5 py-0.5 rounded border border-white/10">
                [{idx + 1}]
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
