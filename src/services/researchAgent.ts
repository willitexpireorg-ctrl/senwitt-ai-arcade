import type { SkillCategory } from '../types';

export interface GameSpec {
  id: string;
  title: string;
  category: SkillCategory;
  description: string;
  scientificRationale: string;
  neuralTarget: string;
  difficultyRange: 'Tier 1-5';
  estimatedDuration: string;
  mechanicType:
    | 'visual_grid'
    | 'choice_quiz'
    | 'dual_nback'
    | 'stroop'
    | 'logic_deduction'
    | 'voice_drill'
    | 'brief_recall'
    | 'clearer_sentence'
    | 'number_sense'
    | 'brevity_cut'
    | 'quick_purchase'
    | 'sequence_order'
    | 'rsvp_reader'
    | 'speed_match'
    | 'signal_sweep'
    | 'pattern_shift'
    | 'synonym_race'
    | 'tone_pick'
    | 'attention_track'
    | 'route_plan'
    | 'inbox_triage';
}

// A small, curated set of mini-games that actually work: four live interactive
// engines plus a focused multiple-choice entry point per remaining skill.
export class ResearchAgent {
  static getGameSuite(): GameSpec[] {
    return [
      {
        id: 'game-spatial',
        title: 'Spatial Memory Grid',
        category: 'memory',
        description: 'Memorize and recall illuminated grid tile sequences.',
        scientificRationale: 'Exercises visuospatial working memory capacity.',
        neuralTarget: 'Visuospatial Working Memory',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'visual_grid',
      },
      {
        id: 'game-nback',
        title: 'Dual N-Back',
        category: 'memory',
        description: 'Compare the current position and letter to N steps back.',
        scientificRationale: 'A well-studied working-memory updating task.',
        neuralTarget: 'Working Memory Updating',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'dual_nback',
      },
      {
        id: 'game-stroop',
        title: 'Stroop Speed Drill',
        category: 'reasoning',
        description: 'Inhibit automatic reading to select the ink color instead.',
        scientificRationale: 'Trains response inhibition (the classic Stroop effect).',
        neuralTarget: 'Response Inhibition',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'stroop',
      },
      {
        id: 'game-logic',
        title: 'Logic Deduction',
        category: 'reasoning',
        description: 'Derive the necessary conclusion from multi-premise statements.',
        scientificRationale: 'Exercises deductive validity checking.',
        neuralTarget: 'Deductive Reasoning',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'logic_deduction',
      },
      {
        id: 'game-voice',
        title: 'Speech Fluency Drill',
        category: 'writing',
        description: 'Read a wordy passage, then speak a concise rewrite out loud.',
        scientificRationale: 'Practices rapid verbal compression and articulation.',
        neuralTarget: 'Verbal Fluency',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'voice_drill',
      },
      {
        id: 'game-brief-recall',
        title: 'Brief Recall Drill',
        category: 'memory',
        description: 'Read a short project update, then answer what was decided, by whom, and by when.',
        scientificRationale: 'Practices retaining real-world updates the way you would after a meeting.',
        neuralTarget: 'Everyday Working Memory',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'brief_recall',
      },
      {
        id: 'game-clearer-sentence',
        title: 'Clearer Sentence Drill',
        category: 'writing',
        description: 'Turn a verbose workplace message into the clearest one-line version.',
        scientificRationale: 'Builds the instinct for concise, actionable writing under real constraints.',
        neuralTarget: 'Communication Clarity',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'clearer_sentence',
      },
      {
        id: 'game-number-sense',
        title: 'Number Sense Drill',
        category: 'math',
        description: 'Spot-check percentages, ratios, discounts, and implausible figures.',
        scientificRationale: 'Trains the "does this number make sense" instinct before you act on it.',
        neuralTarget: 'Applied Number Sense',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'number_sense',
      },
      {
        id: 'game-brevity-cut',
        title: 'Brevity Cut',
        category: 'writing',
        description: 'Tap the redundant words out of a sentence before the round clock runs out.',
        scientificRationale: 'Practices spotting and cutting words that add no meaning under light time pressure.',
        neuralTarget: 'Concise Editing',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'brevity_cut',
      },
      {
        id: 'game-quick-purchase',
        title: 'Quick Purchase',
        category: 'math',
        description: 'Tips, discounts, subscription costs, and comparing deals — fast everyday money math.',
        scientificRationale: 'Builds quick, accurate mental math for the numbers you meet while shopping or budgeting.',
        neuralTarget: 'Applied Mental Math',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'quick_purchase',
      },
      {
        id: 'game-sequence-order',
        title: 'Sequence Order',
        category: 'memory',
        description: 'Memorize a short list of steps, then tap them back into the correct order.',
        scientificRationale: 'Practices holding an ordered sequence in mind and reproducing it accurately.',
        neuralTarget: 'Sequential Working Memory',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'sequence_order',
      },
      {
        id: 'game-rsvp-reader',
        title: 'RSVP Reader',
        category: 'reading',
        description: 'Words flash one at a time at a rising pace, then answer one question on what you read.',
        scientificRationale: 'Trains reading comprehension at an increasing presentation rate.',
        neuralTarget: 'Rapid Reading Comprehension',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'rsvp_reader',
      },
      {
        id: 'game-speed-match',
        title: 'Speed Match',
        category: 'reasoning',
        description: 'Decide whether each new symbol matches the previous one as the pace speeds up.',
        scientificRationale: 'Practices rapid same/different judgments — a classic processing-speed paradigm under adaptive time pressure.',
        neuralTarget: 'Processing Speed & Match Comparison',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'speed_match',
      },
      {
        id: 'game-signal-sweep',
        title: 'Signal Sweep',
        category: 'reasoning',
        description: 'Find every item that matches a priority rule among a crowded field of distractors.',
        scientificRationale: 'Exercises selective attention: holding a target rule while filtering visual distractors under a short timer.',
        neuralTarget: 'Selective Attention',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'signal_sweep',
      },
      {
        id: 'game-pattern-shift',
        title: 'Pattern Shift',
        category: 'reasoning',
        description: 'Sort cards by color or shape — then switch rules mid-round without warning.',
        scientificRationale: 'Practices cognitive flexibility: updating the active classification rule when the cue changes.',
        neuralTarget: 'Cognitive Flexibility / Task Switching',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'pattern_shift',
      },
      {
        id: 'game-synonym-race',
        title: 'Synonym Race',
        category: 'writing',
        description: 'See a prompt word and race to pick the closest synonym before the round clock hits zero.',
        scientificRationale: 'Practices rapid lexical selection — the same word-choice reflex used when tightening prose under time pressure.',
        neuralTarget: 'Lexical Fluency',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'synonym_race',
      },
      {
        id: 'game-tone-pick',
        title: 'Tone Pick',
        category: 'writing',
        description: 'Read a workplace situation and choose the reply tone that best matches the stated goal.',
        scientificRationale: 'Builds pragmatic tone matching — professional, warm, or direct — against a clear communicative goal.',
        neuralTarget: 'Pragmatic Communication',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'tone_pick',
      },
      {
        id: 'game-focus-track',
        title: 'Focus Track',
        category: 'reasoning',
        description: 'Route colored tasks arriving on multiple lanes to their matching destination before they arrive.',
        scientificRationale: 'Practices divided attention — tracking and acting on several time-pressured streams at once.',
        neuralTarget: 'Divided Attention',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '1 Min',
        mechanicType: 'attention_track',
      },
      {
        id: 'game-route-planner',
        title: 'Route Planner',
        category: 'reasoning',
        description: 'Plan a path from a start point that visits every stop on a small grid, in as few moves as possible.',
        scientificRationale: 'Practices route planning — sequencing moves ahead of time instead of solving step by step.',
        neuralTarget: 'Spatial Planning',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'route_plan',
      },
      {
        id: 'game-inbox-triage',
        title: 'Inbox Triage',
        category: 'reasoning',
        description: 'Read a short email and decide fast: reply now, schedule for later, delegate, or archive.',
        scientificRationale: 'Practices triage judgment — weighing urgency and ownership to decide what deserves attention right now.',
        neuralTarget: 'Prioritization Judgment',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'inbox_triage',
      },
      {
        id: 'game-writing-quiz',
        title: 'Writing Precision Drill',
        category: 'writing',
        description: 'Multiple-choice reps on cutting fluff and sharpening word choice.',
        scientificRationale: 'Builds syntactic compression and lexical precision.',
        neuralTarget: 'Syntactic Compression',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz',
      },
      {
        id: 'game-math-quiz',
        title: 'Math & Estimation Drill',
        category: 'math',
        description: 'Multiple-choice reps on mental math, probability, and Fermi estimates.',
        scientificRationale: 'Builds numerical fluency and magnitude estimation.',
        neuralTarget: 'Numerical Reasoning',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz',
      },
      {
        id: 'game-code-quiz',
        title: 'Code Tracing Drill',
        category: 'code',
        description: 'Multiple-choice reps tracing scope, output, and bugs by hand.',
        scientificRationale: 'Maintains mental execution of control flow without a debugger.',
        neuralTarget: 'Execution Tracing',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz',
      },
      {
        id: 'game-reading-quiz',
        title: 'Critical Reading Drill',
        category: 'reading',
        description: 'Multiple-choice reps spotting assumptions and reasoning gaps.',
        scientificRationale: 'Protects critical reading skills against passive skimming.',
        neuralTarget: 'Critical Reading',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz',
      },
      {
        id: 'game-memory-quiz',
        title: 'Memory Challenge Drill',
        category: 'memory',
        description: 'Multiple-choice reps on sequences, working memory, and recall.',
        scientificRationale: 'Builds short-term retention and recall precision.',
        neuralTarget: 'Working Memory Recall',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz',
      },
    ];
  }
}
