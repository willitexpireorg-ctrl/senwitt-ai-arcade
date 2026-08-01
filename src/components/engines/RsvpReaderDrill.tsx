import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Zap, Gauge } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface RsvpReaderResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface RsvpReaderDrillProps {
  onComplete: (result: RsvpReaderResult) => void;
  onCancel: () => void;
}

interface RsvpQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface RsvpPassage {
  id: string;
  title: string;
  text: string;
  question: RsvpQuestion;
}

const START_WPM = 200;
const MIN_WPM = 140;
const MAX_WPM = 400;
const WPM_STEP = 40;

const PASSAGES: RsvpPassage[] = [
  {
    id: 'expense-policy',
    title: 'Expense policy update',
    text:
      'The new expense policy caps meal reimbursements at fifty dollars per day for domestic travel and seventy dollars for international trips. Receipts are required for any single expense over twenty five dollars. Approvals now route through the finance team instead of direct managers starting next month.',
    question: {
      question: 'Under the new policy, when do approvals switch from managers to the finance team?',
      options: ['Immediately', 'Next month', 'At the end of the year', 'Only for international trips'],
      correctIndex: 1,
      explanation: 'The passage ends by stating approvals route through finance "starting next month."',
    },
  },
  {
    id: 'outage-report',
    title: 'Outage report',
    text:
      'Yesterday\u2019s server outage lasted twenty two minutes and affected roughly eight percent of active users, mostly in the European region. The root cause was a misconfigured load balancer rule pushed during a routine update. The team has added an automated check to catch similar misconfigurations before deployment.',
    question: {
      question: 'What caused yesterday\u2019s outage?',
      options: ['A misconfigured load balancer rule', 'A power failure', 'A scheduled maintenance window', 'An expired security certificate'],
      correctIndex: 0,
      explanation: 'The passage names the root cause directly: a misconfigured load balancer rule.',
    },
  },
  {
    id: 'survey-results',
    title: 'Quarterly survey results',
    text:
      'The quarterly survey found that seventy three percent of employees prefer a hybrid schedule over fully remote or fully in office arrangements. The most common reason cited was better focus time balanced with in person collaboration. Leadership plans to keep the current hybrid policy unchanged through year end.',
    question: {
      question: 'What did most employees prefer according to the survey?',
      options: ['Fully remote work', 'Fully in-office work', 'A hybrid schedule', 'No strong preference either way'],
      correctIndex: 2,
      explanation: '73% of employees preferred a hybrid schedule over fully remote or fully in-office.',
    },
  },
];

type Phase = 'ready' | 'rsvp' | 'question' | 'result';

export const RsvpReaderDrill: React.FC<RsvpReaderDrillProps> = ({ onComplete, onCancel }) => {
  const [passages] = useState<RsvpPassage[]>(PASSAGES);
  const [passageIndex, setPassageIndex] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [wpm, setWpm] = useState<number>(START_WPM);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const currentPassage = passages[passageIndex];
  const words = currentPassage.text.split(/\s+/);

  useEffect(() => {
    if (phase !== 'rsvp') return;
    if (wordIndex >= words.length) {
      setPhase('question');
      return;
    }
    const word = words[wordIndex];
    const endsWithPunctuation = /[.,!?;:]$/.test(word);
    const baseMs = 60000 / wpm;
    const delay = endsWithPunctuation ? baseMs * 1.6 : baseMs;
    const t = setTimeout(() => setWordIndex((i) => i + 1), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wordIndex, wpm]);

  const handleStart = () => {
    playClickSound();
    setWordIndex(0);
    setPhase('rsvp');
  };

  const handleSelect = (idx: number) => {
    if (phase !== 'question') return;
    playClickSound();
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || phase !== 'question') return;
    const isCorrect = selectedIndex === currentPassage.question.correctIndex;
    if (isCorrect) {
      playCorrectSound();
      setScore((s) => s + 30);
      setCorrectCount((c) => c + 1);
      setWpm((w) => Math.min(MAX_WPM, w + WPM_STEP));
    } else {
      playIncorrectSound();
      setWpm((w) => Math.max(MIN_WPM, w - WPM_STEP));
    }
    setPhase('result');
  };

  const handleNext = () => {
    playClickSound();
    if (passageIndex + 1 >= passages.length) {
      playFanfareSound();
      onComplete({
        scoreEarned: score,
        correctCount,
        totalItems: passages.length,
        totalTimeMs: Date.now() - drillStartRef.current,
      });
      return;
    }
    setPassageIndex((i) => i + 1);
    setSelectedIndex(null);
    setWordIndex(0);
    setPhase('ready');
  };

  const currentWord = phase === 'rsvp' && wordIndex < words.length ? words[wordIndex] : '';
  const question = currentPassage.question;

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
            Passage {passageIndex + 1} of {passages.length}
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
          >
            <Gauge className="w-4 h-4" />
            <span>{wpm} wpm</span>
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

      <EvidencePanel evidenceKey="rsvp_reader" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <Zap className="w-4 h-4" />
          Rapid Reader
        </div>

        {phase === 'ready' && (
          <>
            <h2 className="text-xl md:text-2xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {currentPassage.title}
            </h2>
            <p className="text-sm md:text-base mb-8 max-w-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Words will flash one at a time at {wpm} words per minute. Watch closely — then answer one question from memory.
            </p>
            <button onClick={handleStart} className="btn-3d btn-3d-cyan w-full max-w-xl py-4 text-base flex items-center justify-center gap-2">
              <span>Start reading</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {phase === 'rsvp' && (
          <div
            className="w-full max-w-xl h-48 md:h-56 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
          >
            <span className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {currentWord}
            </span>
          </div>
        )}

        {(phase === 'question' || phase === 'result') && (
          <>
            <h2
              className="text-lg md:text-xl font-extrabold mb-6 tracking-tight w-full"
              style={{ color: 'var(--text-primary)' }}
            >
              {question.question}
            </h2>

            <div className="space-y-3 w-full mb-6">
              {question.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const isCorrectOpt = idx === question.correctIndex;
                let btnClass = 'btn-3d w-full p-5 text-left text-xs md:text-sm font-bold border-b-4 flex items-start justify-between gap-2 ';
                if (phase === 'result') {
                  if (isCorrectOpt) btnClass += 'bg-emerald-500 border-emerald-700 text-white';
                  else if (isSelected) btnClass += 'bg-rose-500 border-rose-700 text-white';
                  else btnClass += 'bg-white border-[#d7e0ea] text-[var(--text-muted)] opacity-55';
                } else if (isSelected) {
                  btnClass += 'btn-3d-teal border-b-2';
                } else {
                  btnClass += 'bg-white text-[var(--text-primary)] border-[#d7e0ea] hover:bg-[#f7fafc]';
                }
                return (
                  <button key={idx} type="button" disabled={phase === 'result'} onClick={() => handleSelect(idx)} className={btnClass}>
                    <span className="leading-snug">{option}</span>
                    {phase === 'result' && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
                    {phase === 'result' && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white shrink-0 ml-2 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {phase === 'result' && (
              <div
                className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
                style={{
                  background: selectedIndex === question.correctIndex ? '#ecfdf5' : '#fff1f2',
                  borderColor: selectedIndex === question.correctIndex ? '#a7f3d0' : '#fecdd3',
                  color: selectedIndex === question.correctIndex ? '#065f46' : '#9f1239',
                }}
              >
                <p className="leading-relaxed font-semibold">{question.explanation}</p>
              </div>
            )}

            {phase === 'question' ? (
              <button
                disabled={selectedIndex === null}
                onClick={handleSubmit}
                className={`btn-3d w-full py-4 text-base ${selectedIndex !== null ? 'btn-3d-coral' : 'bg-[#e2ebf4] border-b-4 border-[#c5d3e0] text-[var(--text-muted)] cursor-not-allowed'}`}
              >
                Check answer
              </button>
            ) : (
              <button onClick={handleNext} className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2">
                <span>{passageIndex + 1 < passages.length ? 'Next passage' : 'Finish drill'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
