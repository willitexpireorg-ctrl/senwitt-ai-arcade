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
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
        >
          Exit Drill
        </button>

        <div className="flex items-center gap-2 text-xs text-purple-300 font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Verbal Logic • Problem {currentIndex + 1}/{LOGIC_PROBLEMS.length}</span>
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel p-6 md:p-8 border border-purple-500/30">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Deductive Logic & Syllogism Analysis
        </div>

        {/* Premises Card */}
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 mb-6 space-y-2">
          <div className="text-[11px] uppercase font-extrabold text-purple-400 tracking-wider">Premises</div>
          <p className="text-sm font-medium text-gray-200">1. {problem.premise1}</p>
          <p className="text-sm font-medium text-gray-200">2. {problem.premise2}</p>
        </div>

        {/* Question Title */}
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          {problem.question}
        </h3>

        {/* Multiple Choice Options */}
        <div className="space-y-3 mb-6">
          {problem.options.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === problem.correctIndex;

            let optClass = "w-full p-4 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ";

            if (isAnswered) {
              if (isCorrectOption) {
                optClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-md";
              } else if (isSelected) {
                optClass += "bg-rose-500/20 border-rose-500/50 text-rose-200";
              } else {
                optClass += "bg-white/5 border-white/5 text-gray-500 opacity-60";
              }
            } else {
              optClass += "bg-white/5 border-white/10 hover:bg-white/15 hover:border-purple-400/40 text-gray-200";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={optClass}
              >
                <span>{String.fromCharCode(65 + idx)}. {optionText}</span>
                {isAnswered && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {isAnswered && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 text-xs text-purple-200">
              <span className="font-bold text-purple-300 block mb-1">Deductive Rationale:</span>
              {problem.explanation}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{currentIndex + 1 < LOGIC_PROBLEMS.length ? 'Next Logic Problem' : 'Complete Drill'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
