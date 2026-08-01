import React, { useEffect, useRef, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Sparkles, ArrowRight, FileText } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface BriefRecallResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface BriefRecallDrillProps {
  onComplete: (result: BriefRecallResult) => void;
  onCancel: () => void;
}

interface RecallQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface RecallScenario {
  id: string;
  title: string;
  passage: string;
  questions: RecallQuestion[];
}

const READING_SECONDS = 25;

const SCENARIOS: RecallScenario[] = [
  {
    id: 'atlas',
    title: 'Project update — Atlas launch',
    passage:
      'Quick update on Atlas: after yesterday\u2019s review, we\u2019re cutting the SSO integration from the v1 launch to protect the timeline. Priya will own the migration script and is targeting next Thursday, March 12th, for the staging cutover. Marketing asked for a one-week buffer before the public announcement, so comms will hold until confirmed. If staging looks clean, we ship to prod the following Monday.',
    questions: [
      {
        id: 'atlas-decision',
        question: 'What decision was made about the v1 launch?',
        options: [
          'SSO integration was cut from v1 to protect the timeline',
          'The entire launch was postponed a month',
          'Marketing will announce immediately after staging',
          'The migration script was cancelled',
        ],
        correctIndex: 0,
        explanation: 'The update opens by stating SSO was cut from v1 specifically to protect the timeline.',
      },
      {
        id: 'atlas-owner',
        question: 'Who owns the migration script?',
        options: ['Marketing', 'Priya', 'The comms team', 'It wasn\u2019t assigned'],
        correctIndex: 1,
        explanation: 'Priya is explicitly named as owning the migration script.',
      },
      {
        id: 'atlas-date',
        question: 'What is the staging cutover target date?',
        options: ['This Monday', 'Thursday, March 12th', 'The end of the month', 'No date was given'],
        correctIndex: 1,
        explanation: 'Priya is targeting Thursday, March 12th for the staging cutover.',
      },
    ],
  },
  {
    id: 'campaign',
    title: 'Project update — Q3 campaign',
    passage:
      'Heads up on the Q3 campaign: we\u2019re dropping the paid social push after last week\u2019s test showed weak ROI, and reallocating that budget to email instead. Devon will run the email sequence and is aiming to have the first draft ready by next Tuesday for review. Leadership wants a go/no-go call before any spend increases, so nothing launches until that sign-off happens.',
    questions: [
      {
        id: 'campaign-decision',
        question: 'What was decided about paid social?',
        options: [
          'Budget increased due to strong ROI',
          'It was dropped and budget moved to email',
          'It was paused only for one week',
          'It will be replaced by print ads',
        ],
        correctIndex: 1,
        explanation: 'Paid social is being dropped and the budget reallocated to email.',
      },
      {
        id: 'campaign-owner',
        question: 'Who is running the email sequence?',
        options: ['Leadership', 'Devon', 'The paid social team', 'Unclear from the update'],
        correctIndex: 1,
        explanation: 'Devon is named as running the email sequence.',
      },
      {
        id: 'campaign-date',
        question: 'When does Devon aim to have a first draft ready?',
        options: ['End of Q3', 'Next Tuesday', 'Today', 'No date mentioned'],
        correctIndex: 1,
        explanation: 'The draft target is next Tuesday, for review.',
      },
    ],
  },
  {
    id: 'onboarding',
    title: 'Project update — Onboarding revamp',
    passage:
      'Onboarding revamp update: we\u2019re removing the mandatory intro video since drop-off data showed most new users skipped it anyway. Marcus is taking point on rewriting the welcome checklist and expects a shippable version by the 20th. We agreed to hold off on any in-app tooltips until the checklist ships, so that work stays out of this sprint.',
    questions: [
      {
        id: 'onboarding-decision',
        question: 'What change was decided for onboarding?',
        options: [
          'Adding a second mandatory video',
          'Removing the mandatory intro video',
          'Removing the welcome checklist entirely',
          'Shipping in-app tooltips immediately',
        ],
        correctIndex: 1,
        explanation: 'The mandatory intro video is being removed due to drop-off data.',
      },
      {
        id: 'onboarding-owner',
        question: 'Who is rewriting the welcome checklist?',
        options: ['Marcus', 'The data team', 'No one yet', 'The whole team jointly'],
        correctIndex: 0,
        explanation: 'Marcus is taking point on the welcome checklist rewrite.',
      },
      {
        id: 'onboarding-date',
        question: 'When does Marcus expect a shippable checklist?',
        options: ['By the 20th', 'Next quarter', 'By tomorrow', 'No date was set'],
        correctIndex: 0,
        explanation: 'Marcus expects a shippable version by the 20th.',
      },
    ],
  },
];

type Phase = 'reading' | 'quiz' | 'done';

export const BriefRecallDrill: React.FC<BriefRecallDrillProps> = ({ onComplete, onCancel }) => {
  const [scenario] = useState<RecallScenario>(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  const [phase, setPhase] = useState<Phase>('reading');
  const [secondsLeft, setSecondsLeft] = useState<number>(READING_SECONDS);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const drillStartRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (phase !== 'reading') return;
    if (secondsLeft <= 0) {
      setPhase('quiz');
      questionStartRef.current = Date.now();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  const handleContinueReading = () => {
    playClickSound();
    setPhase('quiz');
    questionStartRef.current = Date.now();
  };

  const currentQuestion = scenario.questions[questionIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || isAnswered) return;
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      playCorrectSound();
      setScore((s) => s + 34);
      setCorrectCount((c) => c + 1);
    } else {
      playIncorrectSound();
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    playClickSound();
    if (questionIndex + 1 >= scenario.questions.length) {
      playFanfareSound();
      onComplete({
        scoreEarned: score,
        correctCount,
        totalItems: scenario.questions.length,
        totalTimeMs: Date.now() - drillStartRef.current,
      });
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelectedIndex(null);
    setIsAnswered(false);
    questionStartRef.current = Date.now();
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
          {phase === 'reading' ? (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
            >
              <Clock className="w-4 h-4" />
              <span>Read • {secondsLeft}s</span>
            </div>
          ) : (
            <div
              className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              Q{questionIndex + 1} of {scenario.questions.length}
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

      <EvidencePanel evidenceKey="brief_recall" />

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
        >
          <FileText className="w-4 h-4" />
          Meeting & Update Recall
        </div>

        {phase === 'reading' ? (
          <>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {scenario.title}
            </h2>
            <p className="text-sm md:text-base mb-6 max-w-xl" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Read once, like you would a real update. Then answer 3 quick questions from memory.
            </p>
            <div
              className="w-full max-w-xl rounded-2xl p-6 mb-8 text-left text-sm md:text-base leading-relaxed"
              style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              {scenario.passage}
            </div>
            <button onClick={handleContinueReading} className="btn-3d btn-3d-teal w-full max-w-xl py-4 text-base flex items-center justify-center gap-2">
              <span>Continue to questions</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <h2
              className="text-xl md:text-2xl font-extrabold mb-6 tracking-tight w-full"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentQuestion.question}
            </h2>

            <div className="space-y-3 w-full mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedIndex === idx;
                const isCorrectOpt = idx === currentQuestion.correctIndex;
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
                    {isAnswered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                    {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div
                className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
                style={{
                  background: selectedIndex === currentQuestion.correctIndex ? '#ecfdf5' : '#fff1f2',
                  borderColor: selectedIndex === currentQuestion.correctIndex ? '#a7f3d0' : '#fecdd3',
                  color: selectedIndex === currentQuestion.correctIndex ? '#065f46' : '#9f1239',
                }}
              >
                <p className="leading-relaxed font-semibold">{currentQuestion.explanation}</p>
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
                <span>{questionIndex + 1 < scenario.questions.length ? 'Next question' : 'Finish drill'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
