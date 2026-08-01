import React, { useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, MessageSquareText } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface ClearerSentenceResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface ClearerSentenceDrillProps {
  onComplete: (result: ClearerSentenceResult) => void;
  onCancel: () => void;
}

interface RewriteItem {
  id: string;
  verbose: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ITEMS: RewriteItem[] = [
  {
    id: 'rw1',
    verbose:
      'Hey team, just wanted to check in and see if maybe we could possibly get some thoughts or feedback on the doc whenever anyone has a bit of free time, no rush at all of course!',
    options: [
      'Can you review the doc by Thursday?',
      'Hey team, just wanted to check in and see if maybe we could possibly get some thoughts or feedback whenever you have time.',
      'Feedback on the doc would be nice at some point I guess.',
      'The doc needs feedback from someone eventually, not sure who.',
    ],
    correctIndex: 0,
    explanation: 'Concise version keeps the ask (review) and adds a deadline — that\u2019s the info the reader actually needs.',
  },
  {
    id: 'rw2',
    verbose:
      'So I know this might be a weird time to bring this up, but I was just thinking that it could potentially be worth considering whether we might want to maybe push the release date back a little bit.',
    options: [
      'Random thought: release dates are hard sometimes.',
      'It could potentially be worth considering pushing the release back a little.',
      'Can we push the release back two days? I\u2019m seeing risk in QA.',
      'I don\u2019t think the release date is right, someone should look at it.',
    ],
    correctIndex: 2,
    explanation: 'This keeps the concrete ask (push back 2 days) and the reason (QA risk), which is what a reader can act on.',
  },
  {
    id: 'rw3',
    verbose:
      'Just a heads up that I noticed there might be a few small things that could potentially be issues with the current approach, not totally sure but wanted to flag it just in case it matters.',
    options: [
      'There might be some stuff wrong, not sure, just flagging.',
      'The current approach has issues — see below.',
      'The current approach breaks pagination above 500 rows — worth fixing before launch.',
      'Heads up on potential things, more info to follow eventually.',
    ],
    correctIndex: 2,
    explanation: 'Names the specific problem (pagination above 500 rows) and the stakes (before launch) — vague hedging is gone.',
  },
  {
    id: 'rw4',
    verbose:
      'I was wondering if it would be at all possible for someone, whoever has bandwidth I suppose, to maybe take a look at the ticket queue since it seems like it might be getting a little bit backed up recently.',
    options: [
      'The ticket queue is a bit much lately, someone should probably check.',
      'Can someone triage the ticket queue today? It\u2019s at 40 open, up from 12 last week.',
      'Bandwidth permitting, tickets, queue, backed up, thoughts?',
      'It might be possible that the queue needs looking at eventually.',
    ],
    correctIndex: 1,
    explanation: 'Clear ask (triage today) plus the number that makes urgency concrete (40 open, up from 12).',
  },
];

export const ClearerSentenceDrill: React.FC<ClearerSentenceDrillProps> = ({ onComplete, onCancel }) => {
  const [items] = useState<RewriteItem[]>(ITEMS);
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

      <EvidencePanel evidenceKey="clearer_sentence" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <MessageSquareText className="w-4 h-4" />
          Clearer Workplace Messages
        </div>

        <p className="text-xs font-extrabold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Verbose Slack message
        </p>
        <div
          className="w-full max-w-xl rounded-2xl p-6 mb-8 text-left text-sm md:text-base italic leading-relaxed"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          &ldquo;{currentItem.verbose}&rdquo;
        </div>

        <p className="text-sm md:text-base mb-4 font-extrabold w-full" style={{ color: 'var(--text-primary)' }}>
          Pick the clearest one-line rewrite:
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
            <span>{index + 1 < items.length ? 'Next message' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
