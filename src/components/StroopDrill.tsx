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
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
        >
          Exit Game
        </button>

        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Stroop Speed • {currentIndex + 1}/{trials.length || 10}</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel p-6 md:p-8 text-center border border-amber-500/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Inhibition Control & Cognitive Speed
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          {isFinished ? 'Drill Complete! 🎉' : 'Select the INK COLOR!'}
        </h2>
        <p className="text-xs text-gray-300 mb-8">
          Ignore what the word says — tap the button matching the font's actual visual color.
        </p>

        {/* Word Display Box */}
        {currentTrial && !isFinished && (
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl py-10 mb-8 shadow-inner flex flex-col items-center justify-center min-h-[140px]">
            <span className={`text-4xl md:text-5xl font-black uppercase tracking-widest transition-transform ${currentTrial.inkColor} ${feedback === 'correct' ? 'scale-110' : feedback === 'wrong' ? 'animate-shake' : ''}`}>
              {currentTrial.word}
            </span>

            {feedback === 'correct' && (
              <span className="text-emerald-400 text-xs font-bold mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Fast & Accurate!
              </span>
            )}
            {feedback === 'wrong' && (
              <span className="text-rose-400 text-xs font-bold mt-3 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Ink color was {currentTrial.inkName}!
              </span>
            )}
          </div>
        )}

        {/* Reaction Time Badge */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-6 px-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Avg Speed: {avgReactionTime}ms
          </span>
          <span className="font-bold text-white">Score: {score}</span>
        </div>

        {/* Answer Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_OPTIONS.map((opt, idx) => (
            <button
              key={opt.name}
              onClick={() => handleAnswer(opt.name)}
              className="py-3.5 px-3 rounded-xl font-extrabold text-xs bg-white/5 border border-white/10 hover:bg-white/15 hover:border-amber-400/40 text-white transition-all active:scale-95 shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${opt.colorClass.replace('text-', 'bg-')}`} />
                <span>{opt.name}</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                [{idx + 1}]
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
