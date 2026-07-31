import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

interface LogicInferenceDrillProps {
  onComplete: (scoreEarned: number) => void;
  onCancel: () => void;
}

interface LogicProblem {
  id: string;
  premise1: string;
  premise2: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LOGIC_PROBLEMS: LogicProblem[] = [
  {
    id: 'l1',
    premise1: 'All software architects analyze systems before writing code.',
    premise2: 'Elena is a software architect.',
    question: 'Which conclusion MUST be true?',
    options: [
      'Elena analyzes systems before writing code.',
      'Elena writes code faster than other developers.',
      'Elena only writes code in TypeScript.',
      'All people who analyze systems are software architects.'
    ],
    correctIndex: 0,
    explanation: 'By direct syllogism: since all software architects analyze systems and Elena is a software architect, Elena must analyze systems.',
  },
  {
    id: 'l2',
    premise1: 'No compiled program contains unparsed syntax errors.',
    premise2: 'Module X is a compiled program.',
    question: 'What logically follows about Module X?',
    options: [
      'Module X has zero runtime bugs.',
      'Module X contains no unparsed syntax errors.',
      'Module X was compiled using GCC.',
      'Module X is free of logical errors.'
    ],
    correctIndex: 1,
    explanation: 'From Premise 1 & 2, if no compiled program has unparsed syntax errors, Module X cannot have unparsed syntax errors.',
  },
  {
    id: 'l3',
    premise1: 'If an API endpoint has high latency, caching is enabled or the database is unindexed.',
    premise2: 'Endpoint /users has high latency and caching is NOT enabled.',
    question: 'What MUST be true about Endpoint /users?',
    options: [
      'The database query must be cached.',
      'The database is unindexed.',
      'The server run out of RAM memory.',
      'The network connection was dropped.'
    ],
    correctIndex: 1,
    explanation: 'Disjunctive syllogism: A implies (B or C). Since B is false (caching is NOT enabled), C (database is unindexed) must be true.',
  },
  {
    id: 'l4',
    premise1: 'All neural models require non-linear activations to represent non-linear decision boundaries.',
    premise2: 'Model Alpha represents a non-linear decision boundary.',
    question: 'What can be inferred about Model Alpha?',
    options: [
      'Model Alpha requires non-linear activations.',
      'Model Alpha is trained on GPU clusters.',
      'Model Alpha has 100% classification accuracy.',
      'Model Alpha is a Convolutional Neural Network.'
    ],
    correctIndex: 0,
    explanation: 'Because non-linear decision boundaries require non-linear activations, any model representing such a boundary requires them.',
  }
];

export const LogicInferenceDrill: React.FC<LogicInferenceDrillProps> = ({ onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const problem = LOGIC_PROBLEMS[currentIndex];

  // Keyboard shortcut listeners (1-4 or A-D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) return;
      const key = e.key.toUpperCase();
      if (key === '1' || key === 'A') handleSelectOption(0);
      if (key === '2' || key === 'B') handleSelectOption(1);
      if (key === '3' || key === 'C') handleSelectOption(2);
      if (key === '4' || key === 'D') handleSelectOption(3);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, currentIndex]);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === problem.correctIndex;
    if (isCorrect) {
      playCorrectSound();
      setScore((s) => s + 50);
    } else {
      playIncorrectSound();
    }
  };

  const handleNext = () => {
    playClickSound();
    if (currentIndex + 1 >= LOGIC_PROBLEMS.length) {
      playFanfareSound();
      onComplete(score);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

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
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-sm shadow-md">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Problem {currentIndex + 1}/{LOGIC_PROBLEMS.length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Main Glass Hero Container */}
      <div className="w-full glass-panel p-8 md:p-12 border-2 border-purple-500/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider mb-6 border border-purple-500/40 shadow-md">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Deductive Logic & Syllogism Analysis
        </div>

        {/* Premises Card */}
        <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 mb-6 space-y-3 text-left shadow-2xl">
          <div className="text-xs uppercase font-black text-purple-400 tracking-widest">Formal Premises</div>
          <p className="text-base font-semibold text-gray-200 leading-relaxed">1. {problem.premise1}</p>
          <p className="text-base font-semibold text-gray-200 leading-relaxed">2. {problem.premise2}</p>
        </div>

        {/* Question Title */}
        <h3 className="text-lg md:text-xl font-black text-white mb-6 flex items-center justify-center gap-2 text-center">
          <HelpCircle className="w-5 h-5 text-purple-400 shrink-0" />
          <span>{problem.question}</span>
        </h3>

        {/* 3D Tactile Multiple Choice Options */}
        <div className="space-y-4 w-full mb-6">
          {problem.options.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === problem.correctIndex;

            let optClass = "btn-3d w-full p-5 text-left text-xs md:text-sm font-bold flex items-center justify-between border-b-4 shadow-lg ";

            if (isAnswered) {
              if (isCorrectOption) {
                optClass += "bg-emerald-600 border-emerald-900 text-white shadow-emerald-500/30";
              } else if (isSelected) {
                optClass += "bg-rose-600 border-rose-900 text-white";
              } else {
                optClass += "bg-slate-900 border-slate-950 text-gray-600 opacity-50";
              }
            } else {
              optClass += "bg-slate-800 text-gray-200 border-slate-950 hover:bg-slate-700 active:border-b-0";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={optClass}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-black bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-purple-300">
                    [{String.fromCharCode(65 + idx)}]
                  </span>
                  <span className="leading-snug">{optionText}</span>
                </div>
                {isAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-white shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Rationale & Next Button */}
        {isAnswered && (
          <div className="w-full space-y-4 animate-fadeIn">
            <div className="bg-purple-950/60 border border-purple-500/40 rounded-2xl p-5 text-xs md:text-sm text-purple-200 text-left shadow-lg">
              <span className="font-black text-purple-300 block mb-1.5 uppercase tracking-wider text-[11px]">Deductive Rationale:</span>
              <p className="leading-relaxed opacity-95">{problem.explanation}</p>
            </div>

            <button
              onClick={handleNext}
              className="btn-3d btn-3d-violet w-full py-4 text-sm flex items-center justify-center gap-2 shadow-2xl"
            >
              <span>{currentIndex + 1 < LOGIC_PROBLEMS.length ? 'Next Logic Problem [Space]' : 'Complete Arena Drill [Space]'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
