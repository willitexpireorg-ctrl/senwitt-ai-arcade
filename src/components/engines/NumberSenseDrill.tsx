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

const ITEMS_PER_SESSION = 6;

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
  {
    id: 'ns5',
    prompt: 'Headcount dropped from 40 to 34 people this year. What\u2019s the percentage decrease?',
    options: ['6%', '10%', '15%', '20%'],
    correctIndex: 2,
    explanation: 'The drop is 6 people. 6 / 40 = 0.15, i.e. a 15% decrease.',
  },
  {
    id: 'ns6',
    prompt: 'A dashboard says conversion "doubled from 2% to 4%." Is describing that as a "100% increase" accurate?',
    options: [
      'No — a 2-point change is only a 2% increase',
      'Yes — going from 2% to 4% is exactly a 100% relative increase',
      'No — percentages can\u2019t be doubled',
      'Yes, but only if the sample size is over 1,000',
    ],
    correctIndex: 1,
    explanation: 'Relative change: (4−2)/2 = 1.0 = 100% increase. The rate doubled even though the point gap is only 2.',
  },
  {
    id: 'ns7',
    prompt: 'A survey of 40 customers found 30 were "satisfied." What percentage is that, and is 40 people enough to trust for a 10,000-customer product?',
    options: [
      '75% satisfied, and 40 people is plenty for any claim',
      '75% satisfied, but 40 people is a thin sample for a 10,000-customer base',
      '30% satisfied, and the sample size doesn\u2019t matter',
      '133% satisfied, which is impossible so the data is wrong',
    ],
    correctIndex: 1,
    explanation: '30/40 = 75%. That\u2019s the right math, but 40 respondents out of 10,000 customers is a small, possibly unrepresentative slice.',
  },
  {
    id: 'ns8',
    prompt: 'Your bug count went from 120 to 90 after a cleanup sprint. What\u2019s the percentage reduction?',
    options: ['20%', '25%', '30%', '33%'],
    correctIndex: 1,
    explanation: '120 − 90 = 30 fewer bugs. 30 / 120 = 0.25, a 25% reduction.',
  },
  {
    id: 'ns9',
    prompt: 'A chart\u2019s Y-axis starts at 80 instead of 0, making a change from 82 to 86 look huge. What\u2019s the real percentage change?',
    options: [
      'About 5% — the axis truncation exaggerates the visual jump',
      'About 50%, matching how big the bars look',
      'It can\u2019t be calculated without the full axis',
      'About 25%',
    ],
    correctIndex: 0,
    explanation: '(86−82)/82 ≈ 4.9%. Truncating the Y-axis makes a modest change look dramatic — always check the axis start.',
  },
  {
    id: 'ns10',
    prompt: 'A vendor says their tool is "3x faster." The old process took 12 minutes. How long should the new one take if the claim holds?',
    options: ['9 minutes', '6 minutes', '4 minutes', '3 minutes'],
    correctIndex: 2,
    explanation: '"3x faster" means 1/3 the time: 12 / 3 = 4 minutes.',
  },
  {
    id: 'ns11',
    prompt: 'Two teams report error rates: Team A has 4 errors out of 200 tasks; Team B has 9 errors out of 500 tasks. Which team has the lower error rate?',
    options: ['Team A — 2.0%', 'Team B — 1.8%', 'They\u2019re exactly equal', 'Can\u2019t compare without more context'],
    correctIndex: 1,
    explanation: 'Team A: 4/200 = 2.0%. Team B: 9/500 = 1.8%. Team B\u2019s rate is slightly lower despite more raw errors.',
  },
  {
    id: 'ns12',
    prompt: 'A budget memo says costs rose "by $5,000, or about 40%." What was the original budget, roughly?',
    options: ['$8,000', '$10,000', '$12,500', '$20,000'],
    correctIndex: 2,
    explanation: 'If $5,000 is 40% of the original, the original ≈ $5,000 / 0.40 = $12,500.',
  },
];

const pickItems = (): NumberItem[] => {
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ITEMS_PER_SESSION);
};

export const NumberSenseDrill: React.FC<NumberSenseDrillProps> = ({ onComplete, onCancel }) => {
  const [items] = useState<NumberItem[]>(pickItems);
  const [index, setIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);
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
      if (finishedRef.current) return;
      finishedRef.current = true;
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
