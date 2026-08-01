import type { SkillCategory } from '../types';

export interface EvidenceCard {
  /** What cognitive/skill capacity this exercise rehearses. */
  practises: string;
  /** Why that capacity matters, in one plain sentence. */
  explanation: string;
  /** Honest boundary — what this short drill does NOT prove or measure. */
  boundary: string;
}

/** Evidence-card copy keyed by SkillCategory (used across the arcade generally)
 * and by the real-world engine ids (more specific, real-world framing). */
export type EvidenceKey =
  | SkillCategory
  | 'brief_recall'
  | 'clearer_sentence'
  | 'number_sense'
  | 'brevity_cut'
  | 'quick_purchase'
  | 'sequence_order'
  | 'rsvp_reader'
  | 'speed_match'
  | 'signal_sweep'
  | 'pattern_shift';

export const EXERCISE_EVIDENCE: Record<EvidenceKey, EvidenceCard> = {
  writing: {
    practises: 'Cutting filler and picking the sharper word under time pressure.',
    explanation: 'Concise writing is a trainable habit, not a talent — reps on trimming build the reflex.',
    boundary: 'A few minutes of rewrites won\u2019t make you a stylist; it keeps the "say less, say it clearly" reflex warm.',
  },
  math: {
    practises: 'Fast estimation, percentages, and sanity-checking figures.',
    explanation: 'Ballparking a number before you see the real one catches errors and builds numeracy fluency.',
    boundary: 'This isn\u2019t a math course — it\u2019s a reflex check for numbers you meet in everyday work.',
  },
  code: {
    practises: 'Tracing execution and state changes by hand, without a debugger.',
    explanation: 'Mentally simulating code keeps you fast at spotting bugs before you even run anything.',
    boundary: 'Short traces don\u2019t replace real debugging practice on your own codebase.',
  },
  memory: {
    practises: 'Holding a few new items in mind briefly and retrieving them.',
    explanation: 'Working memory is what lets you track a conversation, a plan, or a set of names without notes.',
    boundary: 'A short recall drill isn\u2019t a memory test — it\u2019s light-touch maintenance for everyday recall.',
  },
  reading: {
    practises: 'Spotting assumptions, gaps, and what an argument is actually claiming.',
    explanation: 'Careful reading resists the urge to skim, which is where most misunderstandings start.',
    boundary: 'One passage a day won\u2019t make you a critic — it keeps the "read for the claim" habit active.',
  },
  reasoning: {
    practises: 'Filtering out an automatic response to give the correct one instead.',
    explanation: 'Impulse control under pressure is the same skill you use to pause before hitting "send."',
    boundary: 'This measures speed and inhibition in a lab-style task, not general intelligence.',
  },
  brief_recall: {
    practises: 'Retaining the key facts of a short update — decisions, owners, dates.',
    explanation: 'This mirrors what you need after a stand-up, a client call, or a quick project update.',
    boundary: 'One passage isn\u2019t a memory diagnosis — it\u2019s a rehearsal of "what actually got decided."',
  },
  clearer_sentence: {
    practises: 'Rewriting a verbose message into one clear line without losing meaning.',
    explanation: 'This is the exact move behind a good Slack message, subject line, or status update.',
    boundary: 'Four reps build the instinct; real writing still benefits from a second read before you hit send.',
  },
  number_sense: {
    practises: 'Reading percentages, ratios, and discounts quickly and sanity-checking figures.',
    explanation: 'This is the skill that catches a wrong number in a deck before you present it.',
    boundary: 'Multiple-choice estimation isn\u2019t full numeracy — it keeps your "does this number make sense" instinct sharp.',
  },
  brevity_cut: {
    practises: 'Spotting and cutting words that add no meaning, under a short time limit.',
    explanation: 'This is the same edit you make on a message or doc when you trim it before hitting send.',
    boundary: 'A handful of scored sentences won\u2019t teach style — it keeps the "does this word earn its place" reflex active.',
  },
  quick_purchase: {
    practises: 'Fast tips, discounts, recurring-cost math, and comparing per-unit prices.',
    explanation: 'These are the exact calculations that come up at checkout, on a bill, or comparing two offers.',
    boundary: 'Four multiple-choice questions aren\u2019t a finance course — it\u2019s a light warm-up for everyday mental math.',
  },
  sequence_order: {
    practises: 'Holding a short list of steps in mind, then reproducing the correct order.',
    explanation: 'This mirrors following a checklist, a recipe, or a set of instructions without re-reading them each time.',
    boundary: 'Three short scenarios aren\u2019t a memory diagnosis — it\u2019s a rehearsal of tracking a sequence end to end.',
  },
  rsvp_reader: {
    practises: 'Following text presented one word at a time, then holding onto the gist for a question.',
    explanation: 'This mirrors reading a fast-scrolling message or ticker without slowing down to reread every line.',
    boundary: 'This isn\u2019t a speed-reading course or a comprehension test — it\u2019s light practice at reading under a faster pace.',
  },
  speed_match: {
    practises: 'Comparing each new symbol to the previous one under a tightening response window.',
    explanation: 'Same/different match under time pressure is a standard way to rehearse quick perceptual decisions.',
    boundary: 'A short match streak isn\u2019t an IQ or brain-age score — it only reflects how you did on this paced comparison task.',
  },
  signal_sweep: {
    practises: 'Holding a target rule in mind while scanning a crowded grid and ignoring lookalikes.',
    explanation: 'Selective attention is the everyday skill of finding what matters (a name, a warning) among visual noise.',
    boundary: 'Hitting shapes in a grid isn\u2019t a clinical attention test — it\u2019s light practice at filtering distractors on purpose.',
  },
  pattern_shift: {
    practises: 'Sorting by one rule, then switching to another when the cue changes.',
    explanation: 'Task switching is the flexibility you use when priorities flip mid-meeting or mid-checklist.',
    boundary: 'A few rule flips don\u2019t measure general intelligence — they rehearse updating the active rule under mild pressure.',
  },
};
