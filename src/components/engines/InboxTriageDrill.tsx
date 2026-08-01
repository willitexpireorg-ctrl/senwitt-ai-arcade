import React, { useRef, useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Inbox } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';

export interface InboxTriageResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface InboxTriageDrillProps {
  onComplete: (result: InboxTriageResult) => void;
  onCancel: () => void;
}

const ACTIONS = ['Reply now', 'Schedule for later', 'Delegate to a teammate', 'Archive — no action needed'] as const;

interface EmailItem {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  tag: string;
  correctIndex: number;
  explanation: string;
}

const ITEMS_PER_SESSION = 6;

const ITEMS: EmailItem[] = [
  {
    id: 'inbox-1',
    from: 'VP of Sales',
    subject: 'Contract needs your signature before 5pm today',
    snippet: 'The deal closes today only if this goes out this afternoon — can you sign and send back within the hour?',
    tag: 'Deadline: today, 5pm',
    correctIndex: 0,
    explanation: 'Same-day deadline, and you\u2019re the named blocker — this needs a reply now, not a queue.',
  },
  {
    id: 'inbox-2',
    from: 'Company Newsletter',
    subject: '5 productivity tips for your Monday',
    snippet: 'Check out this week\u2019s roundup of tips from the productivity blog...',
    tag: 'No deadline · no ask',
    correctIndex: 3,
    explanation: 'No request, no deadline, not from a real stakeholder — this is a clean archive.',
  },
  {
    id: 'inbox-3',
    from: 'Teammate (Dana)',
    subject: 'PR review whenever you get a chance this week',
    snippet: 'No rush, but would love your eyes on this before we merge later this week.',
    tag: 'Due: this week',
    correctIndex: 1,
    explanation: 'A real ask with a soft deadline days out — block time later this week instead of dropping current work.',
  },
  {
    id: 'inbox-4',
    from: 'New customer',
    subject: 'How do I reset my password?',
    snippet: 'I can\u2019t log in and reset my password isn\u2019t working. Please help!',
    tag: 'Answered in help docs',
    correctIndex: 2,
    explanation: 'This is a routine support question, not something that needs your specific expertise — route it to support.',
  },
  {
    id: 'inbox-5',
    from: 'Your manager',
    subject: 'Quick sync in 10 min — bring your roadmap notes',
    snippet: 'Grabbing 10 minutes in a few — can you hop on with your latest notes?',
    tag: 'Starts: 10 minutes',
    correctIndex: 0,
    explanation: 'Time-boxed and starting imminently — this needs an immediate response, not scheduling.',
  },
  {
    id: 'inbox-6',
    from: 'HR',
    subject: 'Benefits open enrollment opens next month',
    snippet: 'Just a heads-up that enrollment opens in a few weeks. No action needed from you right now.',
    tag: 'No action needed yet',
    correctIndex: 3,
    explanation: 'The email itself says no action is needed yet — archive it and let the later reminder handle scheduling.',
  },
  {
    id: 'inbox-7',
    from: 'Client (Marcus)',
    subject: 'Can you send a pricing quote by Friday?',
    snippet: 'No urgency today, but we do need a number from you before Friday\u2019s budget meeting.',
    tag: 'Due: Friday',
    correctIndex: 1,
    explanation: 'Real deadline, but days away — schedule focused time to prep the quote rather than reacting right now.',
  },
  {
    id: 'inbox-8',
    from: 'On-call alerts',
    subject: 'Checkout is down for customers right now',
    snippet: 'Error rate spiking on checkout in the last 5 minutes — customers are affected right now.',
    tag: 'Live incident',
    correctIndex: 0,
    explanation: 'An active incident affecting customers is the definition of "reply now" — every minute matters here.',
  },
  {
    id: 'inbox-9',
    from: 'Project thread (cc\u2019d)',
    subject: 'Re: Re: Re: Migration status update',
    snippet: 'Thanks all — Priya already has this covered and will report back Friday. No action needed from anyone else.',
    tag: "You're only cc'd",
    correctIndex: 3,
    explanation: 'You\u2019re cc\u2019d for visibility only and the thread already states no action is needed — archive it.',
  },
  {
    id: 'inbox-10',
    from: 'Teammate (Alicia)',
    subject: 'Going on leave — need someone to cover on-call swap requests',
    snippet: 'I\u2019m out starting Monday. Can someone who actually owns the on-call schedule handle swap approvals?',
    tag: 'Needs schedule owner',
    correctIndex: 2,
    explanation: 'This needs the person who actually owns the on-call schedule, not you personally — delegate to that owner.',
  },
  {
    id: 'inbox-11',
    from: 'Vendor integration contact',
    subject: 'Question about your API rate limits',
    snippet: 'Our engineers want to confirm your API\u2019s rate limit behavior before we finalize the integration.',
    tag: 'Technical — not your area',
    correctIndex: 2,
    explanation: 'A technical API question is better answered by engineering directly — forward it rather than answering yourself.',
  },
  {
    id: 'inbox-12',
    from: 'Team offsite planning doc',
    subject: 'Add your input to the offsite agenda (event is next month)',
    snippet: 'The offsite isn\u2019t for another month — add your session ideas whenever works for you before then.',
    tag: 'Event: next month',
    correctIndex: 1,
    explanation: 'Plenty of lead time and no urgency — put it on your calendar for later rather than acting immediately.',
  },
];

const pickItems = (): EmailItem[] => {
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ITEMS_PER_SESSION);
};

export const InboxTriageDrill: React.FC<InboxTriageDrillProps> = ({ onComplete, onCancel }) => {
  const [items] = useState<EmailItem[]>(pickItems);
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

  const current = items[index];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedIndex(idx);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || isAnswered) return;
    const isCorrect = selectedIndex === current.correctIndex;
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
    if (index + 1 >= items.length) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playFanfareSound();
      onComplete({
        scoreEarned: scoreRef.current,
        correctCount: correctRef.current,
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

      <div className="w-full surface p-8 md:p-12 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
          style={{ background: '#d1fae5', border: '1px solid #a7f3d0', color: '#047857' }}
        >
          <Inbox className="w-4 h-4" />
          Inbox Triage
        </div>

        <div
          className="w-full max-w-xl rounded-2xl p-6 mb-6 text-left"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span className="text-xs font-extrabold" style={{ color: 'var(--text-primary)' }}>{current.from}</span>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
            >
              {current.tag}
            </span>
          </div>
          <p className="text-sm md:text-base font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
            {current.subject}
          </p>
          <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {current.snippet}
          </p>
        </div>

        <p className="text-sm md:text-base mb-4 font-extrabold w-full" style={{ color: 'var(--text-primary)' }}>
          What should you do with this email?
        </p>

        <div className="space-y-3 w-full mb-6">
          {ACTIONS.map((action, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrectOpt = idx === current.correctIndex;
            let btnClass = 'btn-3d w-full p-5 text-left text-xs md:text-sm font-bold border-b-4 flex items-center justify-between gap-2 ';
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
              <button key={action} type="button" disabled={isAnswered} onClick={() => handleSelect(idx)} className={btnClass}>
                <span className="leading-snug">{action}</span>
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
              background: selectedIndex === current.correctIndex ? '#ecfdf5' : '#fff1f2',
              borderColor: selectedIndex === current.correctIndex ? '#a7f3d0' : '#fecdd3',
              color: selectedIndex === current.correctIndex ? '#065f46' : '#9f1239',
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
          <button type="button" onClick={handleNext} className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2">
            <span>{index + 1 < items.length ? 'Next email' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
