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
  {
    id: 'security-audit',
    title: 'Project update — Security audit',
    passage:
      'Update on the security audit: the external firm flagged two medium-severity issues in the auth service, both related to token expiry handling. Sana is leading the remediation and expects both fixes merged by Wednesday. We\u2019re holding the SOC 2 renewal submission until both fixes are verified in production, so there\u2019s no hard deadline pressure beyond that.',
    questions: [
      {
        id: 'security-issue',
        question: 'What area did the flagged issues relate to?',
        options: ['Database backups', 'Token expiry handling in the auth service', 'Payment processing', 'Employee offboarding'],
        correctIndex: 1,
        explanation: 'Both medium-severity issues were related to token expiry handling in the auth service.',
      },
      {
        id: 'security-owner',
        question: 'Who is leading the remediation?',
        options: ['The external firm', 'Sana', 'No one yet', 'Leadership'],
        correctIndex: 1,
        explanation: 'Sana is explicitly named as leading the remediation.',
      },
      {
        id: 'security-gate',
        question: 'What is the SOC 2 renewal submission waiting on?',
        options: [
          'Nothing, it already shipped',
          'Board approval',
          'Both fixes being verified in production',
          'A new external auditor',
        ],
        correctIndex: 2,
        explanation: 'The update says the submission is held until both fixes are verified in production.',
      },
    ],
  },
  {
    id: 'hiring-update',
    title: 'Project update — Engineering hiring',
    passage:
      'Hiring update: we\u2019re pausing the senior backend req for now since the reorg shifted budget to the platform team instead. Tomas will keep the two remaining candidates warm in case the req reopens next quarter. The platform team\u2019s two open reqs are moving forward as planned, with onsites starting the week of the 9th.',
    questions: [
      {
        id: 'hiring-decision',
        question: 'What happened to the senior backend req?',
        options: ['It was filled immediately', 'It was paused due to a budget shift', 'It was cancelled permanently', 'It was combined with a platform role'],
        correctIndex: 1,
        explanation: 'The senior backend req is paused because the reorg moved that budget to the platform team.',
      },
      {
        id: 'hiring-owner',
        question: 'Who is keeping the backend candidates warm?',
        options: ['Tomas', 'The platform team', 'No one — they were told no', 'HR'],
        correctIndex: 0,
        explanation: 'Tomas is named as keeping the two remaining candidates warm.',
      },
      {
        id: 'hiring-date',
        question: 'When do platform team onsites start?',
        options: ['Immediately', 'The week of the 9th', 'Next quarter', 'No date was given'],
        correctIndex: 1,
        explanation: 'Onsites for the platform team\u2019s open reqs start the week of the 9th.',
      },
    ],
  },
  {
    id: 'pricing-update',
    title: 'Project update — Pricing change',
    passage:
      'Quick note on pricing: we\u2019re moving the mid-tier plan from $49 to $59/month starting next billing cycle, grandfathering all current subscribers at their existing rate. Priya\u2019s team is updating the pricing page and billing copy this week. New signups after the change will see the new price immediately; support has the grandfathering policy documented for any questions.',
    questions: [
      {
        id: 'pricing-decision',
        question: 'What is changing about the mid-tier plan?',
        options: ['It\u2019s being discontinued', 'Price rises from $49 to $59/month for new signups', 'It\u2019s dropping to $39/month', 'Nothing — this was a false alarm'],
        correctIndex: 1,
        explanation: 'The mid-tier plan is rising from $49 to $59/month starting next billing cycle.',
      },
      {
        id: 'pricing-owner',
        question: 'Whose team is updating the pricing page?',
        options: ['Support', 'Priya\u2019s team', 'Sales', 'No one has been assigned'],
        correctIndex: 1,
        explanation: 'Priya\u2019s team is updating the pricing page and billing copy.',
      },
      {
        id: 'pricing-grandfather',
        question: 'What happens to current subscribers?',
        options: [
          'They are grandfathered at their existing rate',
          'They must re-subscribe at the new rate',
          'They get a one-time discount code',
          'They are moved to a different plan automatically',
        ],
        correctIndex: 0,
        explanation: 'Current subscribers are grandfathered at their existing rate — only new signups see the new price.',
      },
    ],
  },
  {
    id: 'incident-review',
    title: 'Project update — Incident review',
    passage:
      'Following yesterday\u2019s checkout failure, the postmortem found the root cause was a third-party payment API rate limit we hit during a traffic spike. Wei is adding a request queue with backoff to prevent this from recurring, targeting a fix by Monday. Leadership asked for a customer-facing status page update, which support already posted this morning.',
    questions: [
      {
        id: 'incident-cause',
        question: 'What caused the checkout failure?',
        options: ['A database outage', 'Hitting a third-party payment API rate limit', 'An expired SSL certificate', 'A deploy rollback gone wrong'],
        correctIndex: 1,
        explanation: 'The postmortem found the root cause was hitting a third-party payment API rate limit during a traffic spike.',
      },
      {
        id: 'incident-owner',
        question: 'Who is building the fix?',
        options: ['Wei', 'Support', 'Leadership', 'The payment vendor'],
        correctIndex: 0,
        explanation: 'Wei is adding a request queue with backoff, targeting a fix by Monday.',
      },
      {
        id: 'incident-comms',
        question: 'What communication already happened?',
        options: [
          'Nothing yet — it\u2019s still being drafted',
          'Support posted a customer-facing status page update this morning',
          'Leadership emailed all customers directly',
          'A press release was issued',
        ],
        correctIndex: 1,
        explanation: 'Support already posted a customer-facing status page update this morning.',
      },
    ],
  },
  {
    id: 'vendor-renewal',
    title: 'Project update — Vendor renewal',
    passage:
      'Update on the analytics vendor renewal: their quote came in 22% higher than last year, so we\u2019re evaluating two alternatives before committing. Dana is running a two-week bake-off comparing feature parity and migration cost, with a recommendation due by the 15th. Current contract auto-renews on the 30th unless we cancel by the 20th, so the timeline is tight.',
    questions: [
      {
        id: 'vendor-price',
        question: 'How does the renewal quote compare to last year?',
        options: ['22% lower', '22% higher', 'Exactly the same', 'Not mentioned'],
        correctIndex: 1,
        explanation: 'The quote came in 22% higher than last year, prompting the evaluation.',
      },
      {
        id: 'vendor-owner',
        question: 'Who is running the alternatives comparison?',
        options: ['Dana', 'The vendor', 'Leadership directly', 'No one yet'],
        correctIndex: 0,
        explanation: 'Dana is running a two-week bake-off comparing the alternatives.',
      },
      {
        id: 'vendor-deadline',
        question: 'What is the real deadline pressure here?',
        options: [
          'The recommendation is due by the 15th, but the contract must be cancelled by the 20th to avoid auto-renewal',
          'There is no deadline at all',
          'The vendor is shutting down next month',
          'The budget review is not until next year',
        ],
        correctIndex: 0,
        explanation: 'The recommendation is due the 15th, and the contract auto-renews on the 30th unless cancelled by the 20th.',
      },
    ],
  },
  {
    id: 'support-backlog',
    title: 'Project update — Support backlog',
    passage:
      'Support backlog update: open tickets climbed from 60 to 95 this week after Friday\u2019s release introduced a login bug affecting SSO users. Jordan has already shipped a hotfix, and the backlog is expected to drain by Wednesday as tickets get triaged. We\u2019re holding off on any new feature releases until the backlog is back under 70.',
    questions: [
      {
        id: 'support-cause',
        question: 'Why did the ticket backlog spike?',
        options: [
          'A marketing campaign drove more signups',
          'A login bug from Friday\u2019s release affecting SSO users',
          'The support team was short-staffed',
          'A pricing change confused customers',
        ],
        correctIndex: 1,
        explanation: 'The spike was caused by a login bug affecting SSO users, introduced in Friday\u2019s release.',
      },
      {
        id: 'support-owner',
        question: 'Who shipped the hotfix?',
        options: ['Jordan', 'Support leadership', 'The SSO vendor', 'It has not shipped yet'],
        correctIndex: 0,
        explanation: 'Jordan has already shipped a hotfix for the login bug.',
      },
      {
        id: 'support-gate',
        question: 'What is blocking new feature releases?',
        options: [
          'Nothing is blocking them',
          'The backlog needs to drop back under 70 first',
          'A hiring freeze',
          'Legal review of the SSO fix',
        ],
        correctIndex: 1,
        explanation: 'New feature releases are on hold until the backlog is back under 70 tickets.',
      },
    ],
  },
  {
    id: 'design-refresh',
    title: 'Project update — Design system refresh',
    passage:
      'Design system update: we\u2019re deprecating the old button component in favor of the new one, with a 6-week migration window before the old component is removed. Aisha is publishing a migration guide by Friday, and the design team will do office hours every Tuesday to help teams migrate. Any team not migrated by the deadline will need to file an exception with engineering leadership.',
    questions: [
      {
        id: 'design-decision',
        question: 'What is happening to the old button component?',
        options: [
          'It\u2019s being kept indefinitely alongside the new one',
          'It\u2019s being deprecated with a 6-week migration window',
          'It was already removed yesterday',
          'It\u2019s being renamed only',
        ],
        correctIndex: 1,
        explanation: 'The old component is being deprecated with a 6-week migration window before removal.',
      },
      {
        id: 'design-owner',
        question: 'Who is publishing the migration guide?',
        options: ['Aisha', 'Engineering leadership', 'Each team individually', 'No one — teams must reverse-engineer it'],
        correctIndex: 0,
        explanation: 'Aisha is publishing the migration guide by Friday.',
      },
      {
        id: 'design-exception',
        question: 'What happens if a team misses the migration deadline?',
        options: [
          'Nothing, deadlines are informal',
          'They must file an exception with engineering leadership',
          'Their app gets automatically reverted',
          'They lose access to the design system entirely',
        ],
        correctIndex: 1,
        explanation: 'Teams that miss the deadline need to file an exception with engineering leadership.',
      },
    ],
  },
  {
    id: 'data-migration',
    title: 'Project update — Database migration',
    passage:
      'Database migration update: we\u2019re moving the orders table to the new sharded cluster this weekend, with a planned 90-minute read-only window starting Saturday at 2am. Raj is running the migration and has a rollback script ready if error rates spike above 1%. Customer support has been briefed to expect possible order-status delays during the window.',
    questions: [
      {
        id: 'migration-decision',
        question: 'What is being moved this weekend?',
        options: ['The users table', 'The orders table, to a new sharded cluster', 'The entire database to a new provider', 'Just the analytics warehouse'],
        correctIndex: 1,
        explanation: 'The orders table is being moved to the new sharded cluster this weekend.',
      },
      {
        id: 'migration-owner',
        question: 'Who is running the migration?',
        options: ['Raj', 'Customer support', 'An external contractor', 'It is fully automated with no owner'],
        correctIndex: 0,
        explanation: 'Raj is running the migration and holds the rollback script.',
      },
      {
        id: 'migration-window',
        question: 'What is the planned read-only window?',
        options: ['30 minutes on Friday night', '90 minutes starting Saturday at 2am', 'A full 24-hour freeze', 'No downtime is expected'],
        correctIndex: 1,
        explanation: 'The plan is a 90-minute read-only window starting Saturday at 2am.',
      },
    ],
  },
  {
    id: 'vendor-contract',
    title: 'Project update — Vendor contract renewal',
    passage:
      'Vendor update: our current analytics contract auto-renews in three weeks unless we cancel by the 15th. Legal flagged a 12% price increase in the new terms, so Tom is scheduling a call with the vendor this week to negotiate before the deadline. If no better terms come through, finance wants a decision memo by Friday so we can either renew or start evaluating alternatives.',
    questions: [
      {
        id: 'vendor-decision',
        question: 'What happens if we do nothing by the 15th?',
        options: [
          'The contract cancels automatically',
          'The contract auto-renews with a 12% price increase',
          'The vendor pauses service',
          'Legal makes the decision for us',
        ],
        correctIndex: 1,
        explanation: 'The contract auto-renews in three weeks unless cancelled by the 15th, and the new terms include a 12% price increase.',
      },
      {
        id: 'vendor-owner',
        question: 'Who is scheduling the negotiation call with the vendor?',
        options: ['Legal', 'Finance', 'Tom', 'No one — negotiation was ruled out'],
        correctIndex: 2,
        explanation: 'Tom is scheduling a call with the vendor this week to negotiate before the deadline.',
      },
      {
        id: 'vendor-date',
        question: 'By when does finance want a decision memo?',
        options: ['By the 15th', 'By Friday', 'By the end of the month', 'No deadline was given'],
        correctIndex: 1,
        explanation: 'Finance wants a decision memo by Friday if no better terms come through.',
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
  const finishedRef = useRef(false);

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
      if (finishedRef.current) return;
      finishedRef.current = true;
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
