import React, { useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface TonePickResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface TonePickDrillProps {
  onComplete: (result: TonePickResult) => void;
  onCancel: () => void;
}

type ToneLabel = 'Professional' | 'Warm' | 'Direct';

interface ToneItem {
  id: string;
  situation: string;
  goal: string;
  bestTone: ToneLabel;
  options: { tone: ToneLabel; text: string }[];
  explanation: string;
}

const ITEMS: ToneItem[] = [
  {
    id: 'tone-1',
    situation: 'A teammate missed a deadline that blocks your deliverable.',
    goal: 'Get a new ETA without escalating or shaming them.',
    bestTone: 'Warm',
    options: [
      {
        tone: 'Professional',
        text: 'Per our timeline, your piece was due yesterday. Please advise on status at your earliest convenience.',
      },
      {
        tone: 'Warm',
        text: 'Hey — I know things get busy. When do you think you can get that piece over? Happy to help unblock if useful.',
      },
      {
        tone: 'Direct',
        text: 'You missed the deadline. Send the file by 3pm or I escalate.',
      },
    ],
    explanation:
      'Warm fits when the goal is a new ETA without shame — it names the need and offers help. Direct is too harsh here; stiff-professional can feel cold.',
  },
  {
    id: 'tone-2',
    situation: 'You need legal to review a contract before Friday’s signature.',
    goal: 'Make a clear, time-bound ask that sounds businesslike.',
    bestTone: 'Professional',
    options: [
      {
        tone: 'Warm',
        text: 'Would love your eyes on this whenever you get a chance — no stress if Friday slips!',
      },
      {
        tone: 'Professional',
        text: 'Could you review the attached contract by Thursday 3pm? We plan to sign Friday morning.',
      },
      {
        tone: 'Direct',
        text: 'Need this reviewed now. Friday signature is non-negotiable.',
      },
    ],
    explanation:
      'Professional matches a time-bound cross-team ask: clear deadline, no fluff, no aggression.',
  },
  {
    id: 'tone-3',
    situation: 'A vendor’s invoice has a wrong amount that will delay payment.',
    goal: 'Flag the error and ask for a corrected invoice quickly.',
    bestTone: 'Direct',
    options: [
      {
        tone: 'Warm',
        text: 'So sorry to bother you — the numbers might be a tiny bit off? No rush whenever you can peek!',
      },
      {
        tone: 'Professional',
        text: 'We received invoice #4412. Kindly note a possible discrepancy and advise at your convenience.',
      },
      {
        tone: 'Direct',
        text: 'Invoice #4412 shows $4,200; our PO is $3,800. Please send a corrected invoice today so we can pay.',
      },
    ],
    explanation:
      'Direct is right when the facts are clear and delay costs money — state the mismatch and the ask with a concrete time.',
  },
  {
    id: 'tone-4',
    situation: 'You’re declining a meeting that doesn’t need you.',
    goal: 'Protect focus time while staying respectful.',
    bestTone: 'Professional',
    options: [
      {
        tone: 'Direct',
        text: 'I’m skipping. Send notes if anything needs me.',
      },
      {
        tone: 'Professional',
        text: 'I’ll sit this one out to protect focus time — please loop me in if a decision needs my input.',
      },
      {
        tone: 'Warm',
        text: 'I’d love to join but I’m stretched thin — maybe next time? Miss you all!',
      },
    ],
    explanation:
      'Professional declines cleanly and leaves a clear re-entry path. Pure Direct can sound brusque; overly Warm dilutes the boundary.',
  },
  {
    id: 'tone-5',
    situation: 'A junior report just shipped a solid first draft.',
    goal: 'Reinforce what worked so they keep doing it.',
    bestTone: 'Warm',
    options: [
      {
        tone: 'Professional',
        text: 'Draft received. Proceed to the next milestone per the plan.',
      },
      {
        tone: 'Direct',
        text: 'Good. Fix section 3 and ship tomorrow.',
      },
      {
        tone: 'Warm',
        text: 'This draft is clear and well-structured — especially the summary. Keep that approach on the next pass.',
      },
    ],
    explanation:
      'Warm fits recognition: specific praise locks in the habit. Cold professional or bare Direct skips the reinforcement the goal needs.',
  },
];

export const TonePickDrill: React.FC<TonePickDrillProps> = ({ onComplete, onCancel }) => {
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const drillStartRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const finishedRef = useRef(false);
  scoreRef.current = score;
  correctRef.current = correctCount;

  const current = ITEMS[index];
  const correctIndex = current.options.findIndex((o) => o.tone === current.bestTone);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || isAnswered) return;
    const isCorrect = selectedIndex === correctIndex;
    if (isCorrect) {
      playCorrectSound();
      const nextScore = scoreRef.current + 25;
      const nextCorrect = correctRef.current + 1;
      scoreRef.current = nextScore;
      correctRef.current = nextCorrect;
      setScore(nextScore);
      setCorrectCount(nextCorrect);
    } else {
      playIncorrectSound();
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    playClickSound();
    if (index + 1 >= ITEMS.length) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playFanfareSound();
      onComplete({
        scoreEarned: scoreRef.current,
        correctCount: correctRef.current,
        totalItems: ITEMS.length,
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
          type="button"
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
            {index + 1} of {ITEMS.length}
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

      <EvidencePanel evidenceKey="tone_pick" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <MessageCircle className="w-4 h-4" />
          Tone Pick
        </div>

        <p className="text-xs font-extrabold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Situation
        </p>
        <p
          className="text-base md:text-lg font-bold mb-4 max-w-xl leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {current.situation}
        </p>

        <div
          className="w-full max-w-xl rounded-2xl p-4 mb-6 text-left text-sm font-semibold"
          style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
        >
          Goal: {current.goal}
        </div>

        <p className="text-sm mb-4 font-extrabold w-full" style={{ color: 'var(--text-primary)' }}>
          Which reply best matches the goal?
        </p>

        <div className="space-y-3 w-full mb-6">
          {current.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrectOpt = idx === correctIndex;
            let btnClass = 'btn-3d w-full p-5 text-left text-xs md:text-sm font-bold border-b-4 flex flex-col gap-1.5 ';
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
              <button
                key={option.tone}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelect(idx)}
                className={btnClass}
              >
                <span className="flex items-center justify-between gap-2 w-full">
                  <span
                    className="text-[10px] uppercase tracking-wider font-extrabold"
                    style={{ opacity: 0.85 }}
                  >
                    {option.tone}
                  </span>
                  {isAnswered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white shrink-0" />}
                </span>
                <span className="leading-snug font-semibold">{option.text}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: selectedIndex === correctIndex ? '#ecfdf5' : '#fff1f2',
              borderColor: selectedIndex === correctIndex ? '#a7f3d0' : '#fecdd3',
              color: selectedIndex === correctIndex ? '#065f46' : '#9f1239',
            }}
          >
            <p className="leading-relaxed font-semibold">{current.explanation}</p>
          </div>
        )}

        {!isAnswered ? (
          <button
            type="button"
            disabled={selectedIndex === null}
            onClick={handleSubmit}
            className={`btn-3d w-full py-4 text-base ${selectedIndex !== null ? 'btn-3d-coral' : 'bg-[#e2ebf4] border-b-4 border-[#c5d3e0] text-[var(--text-muted)] cursor-not-allowed'}`}
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <span>{index + 1 < ITEMS.length ? 'Next message' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
