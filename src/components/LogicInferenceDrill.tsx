import React, { useState, useRef } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../services/sound';

export interface LogicInferenceResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface LogicInferenceDrillProps {
  onComplete: (result: LogicInferenceResult) => void;
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
  },
  {
    id: 'l5',
    premise1: 'No production database migration may run without a verified backup.',
    premise2: 'The migration for Service Y ran successfully last night.',
    question: 'What MUST be true about the migration for Service Y?',
    options: [
      'It ran twice as fast as expected.',
      'A verified backup existed before it ran.',
      'It was reviewed by two senior engineers.',
      'It included a schema rollback script.'
    ],
    correctIndex: 1,
    explanation: 'Modus tollens in reverse: since no migration may run without a verified backup, and this migration did run, a verified backup must have existed.',
  },
  {
    id: 'l6',
    premise1: 'If a candidate has strong system design skills, they pass the architecture round or receive a conditional offer.',
    premise2: 'Candidate Rao has strong system design skills and did not pass the architecture round.',
    question: 'What MUST be true about Candidate Rao?',
    options: [
      'Rao failed every interview round.',
      'Rao received a conditional offer.',
      'Rao does not have strong system design skills after all.',
      'Rao will be re-interviewed next quarter.'
    ],
    correctIndex: 1,
    explanation: 'Disjunctive syllogism: strong design skills imply (pass the round OR conditional offer). Since "pass the round" is false, "conditional offer" must be true.',
  },
  {
    id: 'l7',
    premise1: 'Every microservice that emits structured logs is compatible with the central dashboard.',
    premise2: 'The billing service is not compatible with the central dashboard.',
    question: 'What can be validly concluded about the billing service?',
    options: [
      'The billing service emits structured logs.',
      'The billing service does not emit structured logs.',
      'The billing service was deployed before the dashboard existed.',
      'The billing service has no logs at all.'
    ],
    correctIndex: 1,
    explanation: 'Contrapositive reasoning: if emitting structured logs guarantees dashboard compatibility, then lacking compatibility means it cannot emit structured logs.',
  },
  {
    id: 'l8',
    premise1: 'If the cache is cold, the first request is slow or the request is served from a backup region.',
    premise2: 'The cache is cold, and the request was NOT served from a backup region.',
    question: 'What MUST be true about the first request?',
    options: [
      'It was slow.',
      'It failed entirely.',
      'It was served from the backup region anyway.',
      'The cache was actually warm.'
    ],
    correctIndex: 0,
    explanation: 'Disjunctive syllogism: cold cache implies (slow request OR served from backup). Since "served from backup" is false, "slow request" must be true.',
  },
  {
    id: 'l9',
    premise1: 'All certified auditors have completed the compliance training.',
    premise2: 'Jules has completed the compliance training.',
    question: 'What can be validly concluded about Jules?',
    options: [
      'Jules is a certified auditor.',
      'Jules is not a certified auditor.',
      'Nothing about Jules\u2019 certification can be concluded from this alone.',
      'Jules trained every other auditor.'
    ],
    correctIndex: 2,
    explanation: 'This is the affirming-the-consequent trap: completing training is necessary for certification, but plenty of non-auditors could also complete the training, so certification cannot be concluded.',
  },
  {
    id: 'l10',
    premise1: 'No unencrypted payload passes the security gateway.',
    premise2: 'Packet Z passed the security gateway.',
    question: 'What MUST be true about Packet Z?',
    options: [
      'Packet Z was unencrypted.',
      'Packet Z was encrypted.',
      'Packet Z was dropped later in the pipeline.',
      'Packet Z originated from an internal service.'
    ],
    correctIndex: 1,
    explanation: 'If no unencrypted payload can pass the gateway, and Packet Z passed, Packet Z cannot have been unencrypted \u2014 so it must have been encrypted.',
  },
  {
    id: 'l11',
    premise1: 'If quarterly revenue grows, the team either expands headcount or increases the marketing budget.',
    premise2: 'Quarterly revenue grew, and headcount was not expanded.',
    question: 'What MUST be true this quarter?',
    options: [
      'The marketing budget increased.',
      'Headcount was frozen indefinitely.',
      'Revenue growth was reversed.',
      'The team missed its targets.'
    ],
    correctIndex: 0,
    explanation: 'Disjunctive syllogism: revenue growth implies (expand headcount OR increase marketing budget). Since headcount did not expand, the marketing budget must have increased.',
  },
  {
    id: 'l12',
    premise1: 'Every function that mutates shared state without a lock introduces a race condition.',
    premise2: 'Function `updateCounter` introduces a race condition.',
    question: 'What can be validly concluded about `updateCounter`?',
    options: [
      'It mutates shared state without a lock.',
      'It must have caused a production outage.',
      'It does not mutate any shared state.',
      'Nothing can be concluded about its locking behavior.'
    ],
    correctIndex: 3,
    explanation: 'This is affirming the consequent: mutating without a lock guarantees a race condition, but a race condition could also arise from other causes, so the specific cause cannot be concluded.',
  },
  {
    id: 'l13',
    premise1: 'Every deployment that skips the staging gate requires a post-hoc review.',
    premise2: 'The hotfix for Service Q did not require a post-hoc review.',
    question: 'What can be validly concluded about the hotfix for Service Q?',
    options: [
      'It skipped the staging gate.',
      'It did not skip the staging gate.',
      'It was deployed on a weekend.',
      'It caused no incidents.',
    ],
    correctIndex: 1,
    explanation: 'Contrapositive: skipping staging guarantees a review is required. Since no review was required, staging was not skipped.',
  },
  {
    id: 'l14',
    premise1: 'If a report is stale, the dashboard shows a warning banner or the data team is auto-notified.',
    premise2: 'The report is stale, and no warning banner is showing.',
    question: 'What MUST be true?',
    options: [
      'The data team was auto-notified.',
      'The report is not actually stale.',
      'The dashboard is broken.',
      'The data team ignored the report.',
    ],
    correctIndex: 0,
    explanation: 'Disjunctive syllogism: stale implies (banner OR auto-notify). Since the banner is false, auto-notify must be true.',
  },
  {
    id: 'l15',
    premise1: 'All engineers who pass the on-call shadow program can join the rotation unsupervised.',
    premise2: 'Priya can join the rotation unsupervised.',
    question: 'What can be validly concluded about Priya?',
    options: [
      'Priya passed the on-call shadow program.',
      'Priya has the most seniority on the team.',
      'Nothing can be concluded about how Priya qualified — passing the program is sufficient but not the only stated path.',
      'Priya is the on-call lead.',
    ],
    correctIndex: 2,
    explanation: 'This is affirming the consequent: passing the program guarantees unsupervised access, but the premises don\u2019t say it\u2019s the only route, so it can\u2019t be concluded Priya took that path.',
  },
  {
    id: 'l16',
    premise1: 'No feature flag rolled out to 100% skips the canary stage.',
    premise2: 'The new checkout flag is rolled out to 100%.',
    question: 'What MUST be true about the new checkout flag?',
    options: [
      'It skipped the canary stage.',
      'It went through the canary stage.',
      'It was rolled back later.',
      'It has zero bugs.',
    ],
    correctIndex: 1,
    explanation: 'If no flag at 100% skips canary, and this flag is at 100%, it must have gone through canary.',
  },
];

const SESSION_SIZE = 5;

function pickSessionProblems(): LogicProblem[] {
  const shuffled = [...LOGIC_PROBLEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SESSION_SIZE);
}

export const LogicInferenceDrill: React.FC<LogicInferenceDrillProps> = ({ onComplete, onCancel }) => {
  const [sessionProblems] = useState<LogicProblem[]>(pickSessionProblems);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const startTimeRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);
  const problem = sessionProblems[currentIndex];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setCorrectCount((c) => c + 1);
    } else {
      playIncorrectSound();
    }
  };

  const handleNext = () => {
    playClickSound();
    if (currentIndex + 1 >= sessionProblems.length) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playFanfareSound();
      onComplete({
        scoreEarned: score,
        correctCount,
        totalItems: sessionProblems.length,
        totalTimeMs: Date.now() - startTimeRef.current,
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      {/* Top Header */}
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
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Problem {currentIndex + 1}/{sessionProblems.length}</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
          >
            <Sparkles className="w-4 h-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
        >
          <Sparkles className="w-4 h-4" />
          Deductive Logic & Syllogism Analysis
        </div>

        {/* Premises Card */}
        <div
          className="w-full rounded-3xl p-6 mb-6 space-y-3 text-left"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          <div className="text-xs uppercase font-extrabold tracking-widest" style={{ color: 'var(--accent-teal)' }}>Formal Premises</div>
          <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>1. {problem.premise1}</p>
          <p className="text-base font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>2. {problem.premise2}</p>
        </div>

        {/* Question Title */}
        <h3 className="text-lg md:text-xl font-extrabold mb-6 flex items-center justify-center gap-2 text-center" style={{ color: 'var(--text-primary)' }}>
          <HelpCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-teal)' }} />
          <span>{problem.question}</span>
        </h3>

        {/* Multiple Choice Options */}
        <div className="space-y-3 w-full mb-6">
          {problem.options.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === problem.correctIndex;

            let style: React.CSSProperties = { background: '#fff', border: '1px solid #d7e0ea', color: 'var(--text-primary)' };
            let badgeStyle: React.CSSProperties = { background: 'var(--bg-secondary)', color: 'var(--accent-teal)' };

            if (isAnswered) {
              if (isCorrectOption) {
                style = { background: '#10b981', border: '1px solid #047857', color: '#fff' };
                badgeStyle = { background: 'rgba(255,255,255,0.22)', color: '#fff' };
              } else if (isSelected) {
                style = { background: '#f43f5e', border: '1px solid #9f1239', color: '#fff' };
                badgeStyle = { background: 'rgba(255,255,255,0.22)', color: '#fff' };
              } else {
                style = { background: '#fff', border: '1px solid #d7e0ea', color: 'var(--text-muted)', opacity: 0.55 };
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className="btn-3d w-full p-5 text-left text-xs md:text-sm font-bold flex items-center justify-between border-b-4"
                style={style}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg" style={badgeStyle}>
                    [{String.fromCharCode(65 + idx)}]
                  </span>
                  <span className="leading-snug">{optionText}</span>
                </div>
                {isAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 shrink-0 ml-2" style={{ color: '#fff' }} />}
                {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 shrink-0 ml-2" style={{ color: '#fff' }} />}
              </button>
            );
          })}
        </div>

        {/* Rationale & Next Button */}
        {isAnswered && (
          <div className="w-full space-y-4 animate-fadeIn">
            <div
              className="rounded-2xl p-5 text-xs md:text-sm text-left"
              style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: 'var(--text-primary)' }}
            >
              <span className="font-extrabold block mb-1.5 uppercase tracking-wider text-[11px]" style={{ color: 'var(--accent-teal)' }}>Deductive Rationale</span>
              <p className="leading-relaxed">{problem.explanation}</p>
            </div>

            <button
              onClick={handleNext}
              className="btn-3d btn-3d-teal w-full py-4 text-sm flex items-center justify-center gap-2"
            >
              <span>{currentIndex + 1 < sessionProblems.length ? 'Next logic problem' : 'Finish drill'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
