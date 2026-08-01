import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, ShoppingCart, Timer } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface QuickPurchaseResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface QuickPurchaseDrillProps {
  onComplete: (result: QuickPurchaseResult) => void;
  onCancel: () => void;
}

interface PurchaseItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SOFT_TARGET_SECONDS = 20;
const ITEMS_PER_SESSION = 6;

const ITEMS: PurchaseItem[] = [
  {
    id: 'qp-tip',
    prompt: 'Your lunch bill is $38.40 and you want to leave an 18% tip. Which amount is closest?',
    options: ['$5.50', '$6.90', '$7.70', '$9.20'],
    correctIndex: 1,
    explanation: '18% of $38.40 is about $6.91 — round the bill to $40 and take ~18% (~$7.20) as a fast sanity check.',
  },
  {
    id: 'qp-discount',
    prompt: 'A jacket is $84, and there\u2019s a 25% discount at checkout. What\u2019s the final price?',
    options: ['$59', '$63', '$67', '$71'],
    correctIndex: 1,
    explanation: '25% off means you pay 75%. $84 × 0.75 = $63.',
  },
  {
    id: 'qp-annual',
    prompt: 'A streaming subscription costs $14.99/month. Roughly what\u2019s the annual cost?',
    options: ['$120', '$150', '$180', '$210'],
    correctIndex: 2,
    explanation: 'Round $14.99 to $15 and multiply by 12: $15 × 12 = $180.',
  },
  {
    id: 'qp-compare',
    prompt: 'Deal A: 3 items for $18. Deal B: 5 items for $27. Which is the better per-unit price?',
    options: ['Deal A — $6.00 each', 'Deal B — $5.40 each', 'They\u2019re exactly equal', 'Not enough info to tell'],
    correctIndex: 1,
    explanation: 'Deal A: $18 / 3 = $6.00 each. Deal B: $27 / 5 = $5.40 each — Deal B wins per unit.',
  },
  {
    id: 'qp-tax',
    prompt: 'An invoice subtotal is $250, and sales tax is 8%. What\u2019s the total due?',
    options: ['$270', '$258', '$265', '$275'],
    correctIndex: 0,
    explanation: '8% of $250 is $20. $250 + $20 = $270.',
  },
  {
    id: 'qp-split',
    prompt: 'Dinner for 4 comes to $132 total, split evenly. About how much does each person owe?',
    options: ['$28', '$38', '$44', '$33'],
    correctIndex: 3,
    explanation: '$132 / 4 = $33 per person.',
  },
  {
    id: 'qp-unitprice',
    prompt: 'One shampoo bottle is $6 for 12 oz. Another is $9 for 20 oz. Which is the better per-ounce deal?',
    options: ['12 oz bottle — $0.50/oz', 'They\u2019re equal per ounce', '20 oz bottle — $0.45/oz', 'Not enough info to tell'],
    correctIndex: 2,
    explanation: '$6 / 12 oz = $0.50/oz. $9 / 20 oz = $0.45/oz — the larger bottle is cheaper per ounce.',
  },
  {
    id: 'qp-overtime',
    prompt: 'You earn $22/hour, and overtime pays 1.5×. What do you earn for a 4-hour overtime shift?',
    options: ['$132', '$88', '$110', '$154'],
    correctIndex: 0,
    explanation: '$22 × 1.5 = $33/hour overtime rate. $33 × 4 hours = $132.',
  },
  {
    id: 'qp-mileage',
    prompt: 'Your company reimburses $0.65 per mile. A round trip is 84 miles. What\u2019s the reimbursement?',
    options: ['$42.00', '$50.40', '$58.80', '$54.60'],
    correctIndex: 3,
    explanation: '84 miles × $0.65/mile = $54.60.',
  },
  {
    id: 'qp-raise',
    prompt: 'Your salary is $62,000 and you get a 4% raise. What\u2019s your new salary?',
    options: ['$63,240', '$64,000', '$64,480', '$65,240'],
    correctIndex: 2,
    explanation: '4% of $62,000 is $2,480. $62,000 + $2,480 = $64,480.',
  },
  {
    id: 'qp-breakeven',
    prompt: 'A coffee subscription costs $18/month but saves you $3 every time you skip a café visit. How many skipped visits cover the monthly cost?',
    options: ['6 visits', '4 visits', '8 visits', '9 visits'],
    correctIndex: 0,
    explanation: '$18 / $3 per visit = 6 skipped visits to break even.',
  },
  {
    id: 'qp-stacked',
    prompt: 'A $60 item is 20% off, then 7% sales tax is added to the discounted price. What\u2019s the final price?',
    options: ['$54.00', '$48.00', '$50.00', '$51.36'],
    correctIndex: 3,
    explanation: '$60 × 0.80 = $48 after the discount. $48 × 1.07 = $51.36 after tax.',
  },
];

const pickItems = (): PurchaseItem[] => {
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ITEMS_PER_SESSION);
};

export const QuickPurchaseDrill: React.FC<QuickPurchaseDrillProps> = ({ onComplete, onCancel }) => {
  const [items] = useState<PurchaseItem[]>(pickItems);
  const [index, setIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const itemStartRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);
  const currentItem = items[index];

  useEffect(() => {
    if (isAnswered) return;
    const t = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - itemStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [isAnswered, index]);

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
    setElapsedSeconds(0);
    itemStartRef.current = Date.now();
  };

  const isOverSoftTarget = !isAnswered && elapsedSeconds >= SOFT_TARGET_SECONDS;

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
          {!isAnswered && (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{
                background: isOverSoftTarget ? '#fff7ed' : 'var(--bg-surface)',
                border: `1px solid ${isOverSoftTarget ? '#fed7aa' : 'var(--border-color)'}`,
                color: isOverSoftTarget ? '#c2410c' : 'var(--text-secondary)',
              }}
            >
              <Timer className="w-4 h-4" />
              <span>{elapsedSeconds}s</span>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="quick_purchase" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
        >
          <ShoppingCart className="w-4 h-4" />
          Quick Purchase Math
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
