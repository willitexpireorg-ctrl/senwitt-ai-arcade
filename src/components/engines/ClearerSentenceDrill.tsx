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

const ITEMS_PER_SESSION = 6;

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
  {
    id: 'rw5',
    verbose:
      'I guess what I\u2019m sort of trying to say, in a roundabout way, is that it might be a good idea for us to maybe think about possibly revisiting the pricing page copy at some point soon-ish.',
    options: [
      'Can we revisit the pricing page copy this week? Support tickets suggest it\u2019s confusing.',
      'Pricing page copy, revisit, at some point, thoughts welcome I suppose.',
      'It might be a good idea to maybe think about the pricing page eventually.',
      'The pricing page is fine as is, no changes needed for now probably.',
    ],
    correctIndex: 0,
    explanation: 'Names the concrete ask (revisit this week) and the reason (confusing per tickets) — the hedging is gone.',
  },
  {
    id: 'rw6',
    verbose:
      'Not to be a bother or anything, but I was kind of curious if it would be possible to maybe get an update on where things stand with the vendor contract whenever that\u2019s convenient for you.',
    options: [
      'Any update on the vendor contract? No rush, just checking in.',
      'Could you send a status update on the vendor contract by end of day Friday?',
      'Curious about contract stuff whenever, no pressure or anything really.',
      'The vendor contract update would be nice to have sometime, maybe.',
    ],
    correctIndex: 1,
    explanation: 'Adds a concrete deadline (Friday) to a vague "whenever\u2019s convenient" ask, making it actionable.',
  },
  {
    id: 'rw7',
    verbose:
      'Just wanted to sort of flag, in case it\u2019s useful information, that there could potentially be a chance that the dashboard numbers might not be totally in sync with what\u2019s in the database right now.',
    options: [
      'Heads up: dashboard numbers might be a little off, just flagging for awareness.',
      'The dashboard is currently showing stale data — last synced 6 hours ago, refresh before reporting on it.',
      'There could potentially be some kind of sync issue somewhere, maybe.',
      'In case it\u2019s useful, the numbers and database might not fully agree right now.',
    ],
    correctIndex: 1,
    explanation: 'States the specific problem (stale data, 6 hours) and the actionable fix (refresh before reporting) instead of hedging.',
  },
  {
    id: 'rw8',
    verbose:
      'So this is maybe a silly question and please ignore if it\u2019s already been answered somewhere, but I was wondering if anyone happens to know off the top of their head when the next release is roughly planned for.',
    options: [
      'When is the next release planned? Trying to plan my QA schedule around it.',
      'Silly question maybe, ignore if answered, but release timing, does anyone know?',
      'Just curious about release stuff whenever someone gets a chance to mention it.',
      'Apologies in advance if this has come up before regarding release timing.',
    ],
    correctIndex: 0,
    explanation: 'Drops the apologetic hedging and states both the question and the reason it matters (QA scheduling).',
  },
  {
    id: 'rw9',
    verbose:
      'I don\u2019t want to overstep or anything since I know this isn\u2019t really my area, but it did kind of seem like maybe the onboarding flow has gotten a bit long compared to before, just an observation.',
    options: [
      'Onboarding now takes 9 steps, up from 5 last quarter — worth a look before the next cohort.',
      'Just an observation, not my area, but onboarding seems longer maybe, no big deal.',
      'I don\u2019t want to overstep, but something about onboarding felt off recently.',
      'Onboarding has gotten longer I think, though I could be wrong about that.',
    ],
    correctIndex: 0,
    explanation: 'Replaces a hedged "observation" with a specific, checkable fact (9 steps vs. 5) and a reason to act.',
  },
  {
    id: 'rw10',
    verbose:
      'Hey, super random question, but do you happen to maybe know if there\u2019s any chance we could possibly get access to the staging environment sometime before the demo, if that\u2019s not too much to ask?',
    options: [
      'Can I get staging access before Thursday\u2019s demo?',
      'Random question, staging access, demo coming up, if possible maybe?',
      'Not trying to ask for too much, but staging access would be nice eventually.',
      'Wondering about staging environment access at some point before things happen.',
    ],
    correctIndex: 0,
    explanation: 'Keeps the concrete ask (staging access) and a real deadline (Thursday\u2019s demo) — everything else is filler.',
  },
  {
    id: 'rw11',
    verbose:
      'Just so everyone\u2019s on the same page and there\u2019s no confusion later, I wanted to sort of reiterate that the deadline we previously discussed is still technically the deadline, even though some things have changed since then.',
    options: [
      'Reminder: the March 15 deadline still stands despite the recent scope changes.',
      'Just reiterating that the deadline is still the deadline, sort of, for now.',
      'To avoid confusion, the previously discussed thing is still the thing we discussed.',
      'Things have changed, but the deadline hasn\u2019t changed, if that makes sense.',
    ],
    correctIndex: 0,
    explanation: 'Gives the actual date and names what changed (scope) instead of circling around "the deadline is still the deadline."',
  },
  {
    id: 'rw12',
    verbose:
      'I could be totally off base here, and feel free to correct me if I\u2019m wrong, but it sort of feels like maybe the new pricing tiers could possibly be a little confusing to some customers, potentially.',
    options: [
      'Three support tickets this week asked which pricing tier includes API access — the tiers may need clearer labels.',
      'Could be wrong, but pricing tiers maybe seem a bit confusing potentially, to some.',
      'Feel free to correct me, but something about pricing might confuse someone.',
      'Pricing tiers might be a little unclear, I guess, possibly, to be determined.',
    ],
    correctIndex: 0,
    explanation: 'Backs the vague hedge with concrete evidence (3 tickets, specific confusion) that makes the concern actionable.',
  },
];

const pickItems = (): RewriteItem[] => {
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ITEMS_PER_SESSION);
};

export const ClearerSentenceDrill: React.FC<ClearerSentenceDrillProps> = ({ onComplete, onCancel }) => {
  const [items] = useState<RewriteItem[]>(pickItems);
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
