import React, { useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Percent } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface NumberSenseResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface NumberSenseDrillProps {
  onComplete: (result: NumberSenseResult) => void;
  onCancel: () => void;
}

interface NumberItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ITEMS: NumberItem[] = [
  {
    id: 'ns1',
    prompt: 'A report shows revenue grew from $840K to $1.05M this quarter. Roughly what percentage growth is that?',
    options: ['5%', '15%', '25%', '80%'],
    correctIndex: 2,
    explanation: '$1.05M is $210K more than $840K. $210K / $840K = 0.25, i.e. about 25% growth.',
  },
  {
    id: 'ns2',
    prompt: 'A vendor offers "30% off, then an extra 10% off at checkout." What\u2019s the real total discount on a $100 item?',
    options: ['40%', '37%', '30%', '33%'],
    correctIndex: 1,
    explanation: '$100 → $70 after 30% off → $63 after another 10% off $70. Total discount is $37, i.e. 37%, not 40%.',
  },
  {
    id: 'ns3',
    prompt: 'Your team closed 9 out of 12 sprint tickets. A teammate says "we\u2019re basically at 90%." Is that a fair estimate?',
    options: [
      'Yes, close enough — 9/12 is about 90%',
      'No — 9/12 is 75%, meaningfully lower than 90%',
      'No — 9/12 is 60%',
      'Yes, exactly 90%',
    ],
    correctIndex: 1,
    explanation: '9/12 = 0.75 = 75%. That\u2019s a 15-point gap from "90%" — worth correcting before it goes in a status report.',
  },
  {
    id: 'ns4',
    prompt: 'A slide claims "our app is used by 4 out of 5 people in the industry." Which detail would make you most suspicious of this figure?',
    options: [
      'The ratio is expressed as a fraction instead of a percent',
      'The survey behind it only asked 5 people',
      'The number is rounded to a whole percentage',
      'The claim mentions "the industry" instead of a company name',
    ],
    correctIndex: 1,
    explanation: 'A sample size of 5 people can\u2019t support an industry-wide claim — the ratio might be real but wildly unrepresentative.',
  },
];

export const NumberSenseDrill: React.FC<NumberSenseDrillProps> = ({ onComplete, onCancel }) => {
  const [items] = useState<NumberItem[]>(ITEMS);
  const [index, setIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const currentItem = items[index];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || isAnswered) return;
    const isCorrect = selectedIndex === currentItem.correctIndex;
    if (isCorrect) {
      playCorrectSound();
      setScore((s) => s + 25);
      setCorrectCount((c) => c + 1);
    } else {
      playIncorrectSound();
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    playClickSound();
    if (index + 1 >= items.length) {
      playFanfareSound();
      onComplete({
        scoreEarned: score,
        correctCount,
        totalItems: items.length,
        totalTimeMs: Date.now() - drillStartRef.current,
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelectedIndex(null);
    setIsAnswered(false);
  };

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
          <div
            className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {index + 1} of {items.length}
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

      <EvidencePanel evidenceKey="number_sense" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
        >
          <Percent className="w-4 h-4" />
          Number Sense at Work
        </div>

        <p
          className="text-base md:text-lg font-extrabold mb-8 leading-relaxed w-full max-w-xl"
          style={{ color: 'var(--text-primary)' }}
        >
          {currentItem.prompt}
        </p>

        <div className="space-y-3 w-full mb-6">
          {currentItem.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrectOpt = idx === currentItem.correctIndex;
            let btnClass = 'btn-3d w-full p-5 text-left text-xs md:text-sm font-bold border-b-4 flex items-start justify-between gap-2 ';
            if (isAnswered) {
              if (isCorrectOpt) btnClass += 'bg-emerald-500 border-emerald-700 text-white';
              else if (isSelected) btnClass += 'bg-rose-500 border-rose-700 text-white';
              else btnClass += 'bg-white border-[#d7e0ea] text-[var(--text-muted)] opacity-55';
            } else if (isSelected) {
              btnClass += 'btn-3d-teal border-b-2';
            } else {
              btnClass += 'bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]';
            }
            return (
              <button key={idx} type="button" disabled={isAnswered} onClick={() => handleSelect(idx)} className={btnClass}>
                <span className="leading-snug">{option}</span>
                {isAnswered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
                {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: selectedIndex === currentItem.correctIndex ? '#ecfdf5' : '#fff1f2',
              borderColor: selectedIndex === currentItem.correctIndex ? '#a7f3d0' : '#fecdd3',
              color: selectedIndex === currentItem.correctIndex ? '#065f46' : '#9f1239',
            }}
          >
            <p className="leading-relaxed font-semibold">{currentItem.explanation}</p>
          </div>
        )}

        {!isAnswered ? (
          <button
            disabled={selectedIndex === null}
            onClick={handleSubmit}
            className={`btn-3d w-full py-4 text-base ${selectedIndex !== null ? 'btn-3d-coral' : 'bg-[#e2ebf4] border-b-4 border-[#c5d3e0] text-[var(--text-muted)] cursor-not-allowed'}`}
          >
            Check answer
          </button>
        ) : (
          <button onClick={handleNext} className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2">
            <span>{index + 1 < items.length ? 'Next question' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
