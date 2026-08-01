import type { ExerciseItem, SkillCategory } from '../types';
import { EXERCISE_BANK_EXTRA } from './exerciseBankExtra';

// Curated, handcrafted exercise bank. Every item below is a distinct,
// real question with a real explanation — no procedurally generated
// "Variation #N" filler and no answers that are trivially markable by
// their position or label in the option text.
export const EXERCISE_BANK_CORE: ExerciseItem[] = [
  // ─────────────────────────────── WRITING ───────────────────────────────
  {
    id: 'writing-01',
    category: 'writing',
    type: 'concise_drafting',
    title: 'Cut the Corporate Filler',
    prompt: 'Select the most concise, high-impact rewrite that says the same thing:',
    contextPassage: '"At this point in time, it is critically incumbent upon our team to make a concerted effort to utilize our synergies going forward."',
    options: [
      'We must leverage our synergies at this juncture.',
      'Going forward, concerted synergy utilization is recommended.',
      'We need to work together effectively now.',
      'It is incumbent upon us to utilize concerted efforts.',
    ],
    correctAnswer: 'We need to work together effectively now.',
    explanation: 'The original sentence hides one simple idea ("work together now") behind 20+ words of filler. The other options just recombine the same jargon.',
    difficulty: 1,
    cognitiveTarget: 'Concise Drafting & Precision',
  },
  {
    id: 'writing-02',
    category: 'writing',
    type: 'passive_to_active',
    title: 'Passive to Active Voice',
    prompt: 'Which sentence converts the passive construction into a clear, active one without changing the meaning?',
    contextPassage: '"Mistakes were made during the rollout, and the outage was not noticed by the on-call engineer until customers were affected."',
    options: [
      'Mistakes were made and the outage went unnoticed by staff.',
      'The outage, having been caused by mistakes, affected customers eventually.',
      'The on-call engineer missed the rollout mistakes until customers were affected.',
      'It was the case that customers were affected by an outage.',
    ],
    correctAnswer: 'The on-call engineer missed the rollout mistakes until customers were affected.',
    explanation: 'Active voice names who did what: the engineer missed the mistakes. This also removes the classic accountability-dodging "mistakes were made" construction.',
    difficulty: 2,
    cognitiveTarget: 'Active Voice & Accountable Phrasing',
  },
  {
    id: 'writing-03',
    category: 'writing',
    type: 'redundancy',
    title: 'Spot the Redundant Pair',
    prompt: 'Which phrase below is redundant (says the same thing twice)?',
    options: [
      'Initial draft',
      'Advance planning',
      'Remote server',
      'Quarterly report',
    ],
    correctAnswer: 'Advance planning',
    explanation: 'All planning happens in advance of the thing being planned, so "advance" adds nothing. The other phrases each combine two distinct pieces of information.',
    difficulty: 1,
    cognitiveTarget: 'Redundancy Detection',
  },
  {
    id: 'writing-04',
    category: 'writing',
    type: 'pronoun_clarity',
    title: 'Fix the Ambiguous Reference',
    prompt: 'The sentence below has an ambiguous pronoun. Which rewrite removes the ambiguity?',
    contextPassage: '"When the manager told the intern that his presentation needed work, he seemed frustrated."',
    options: [
      'When the manager told the intern that his presentation needed work, he seemed frustrated indeed.',
      'His presentation needed work, and the manager told the intern this, causing frustration.',
      'The manager seemed frustrated when he told the intern that the presentation needed work.',
      'The intern and the manager both seemed frustrated about the presentation.',
    ],
    correctAnswer: 'The manager seemed frustrated when he told the intern that the presentation needed work.',
    explanation: 'In the original, "he" could refer to the manager or the intern. Naming the manager explicitly as the frustrated party removes the ambiguity.',
    difficulty: 3,
    cognitiveTarget: 'Referential Clarity',
  },
  {
    id: 'writing-05',
    category: 'writing',
    type: 'word_choice',
    title: 'Precise Vocabulary: Unsupported Claims',
    prompt: 'What is the precise term for a claim asserted without any supporting evidence or justification?',
    options: [
      'Euphemism',
      'Gratuitous assertion',
      'Red herring',
      'Tautology',
    ],
    correctAnswer: 'Gratuitous assertion',
    explanation: 'A gratuitous assertion is a statement offered as fact with no evidence behind it. A red herring distracts from the topic, a tautology restates itself, and a euphemism softens language.',
    difficulty: 2,
    cognitiveTarget: 'Lexical Precision',
  },
  {
    id: 'writing-06',
    category: 'writing',
    type: 'sentence_combine',
    title: 'Combine Clauses Without a Dangling Modifier',
    prompt: 'Combine these two facts into one sentence without creating a dangling modifier:\n\n1. The model was trained on unlabeled data.\n2. The engineers deployed it without validation.',
    options: [
      'Without validation, unlabeled data trained the model that engineers deployed.',
      'The engineers deployed the model, trained on unlabeled data, without validation.',
      'Deploying without validation, the model was trained on unlabeled data by engineers.',
      'Trained on unlabeled data, the engineers deployed it without validation.',
    ],
    correctAnswer: 'The engineers deployed the model, trained on unlabeled data, without validation.',
    explanation: 'The modifier "trained on unlabeled data" must sit next to "the model" (the thing it describes), not next to "the engineers," who were not trained on anything.',
    difficulty: 3,
    cognitiveTarget: 'Modifier Placement & Sentence Structure',
  },
  {
    id: 'writing-07',
    category: 'writing',
    type: 'hedging',
    title: 'Cut the Hedge, Keep the Claim',
    prompt: 'Which rewrite removes needless hedging while preserving the actual claim being made?',
    contextPassage: '"It could perhaps be argued that, in some sense, the new pricing model might possibly lead to somewhat higher churn."',
    options: [
      'Perhaps the pricing model might somewhat raise churn levels.',
      'The new pricing model will likely increase churn.',
      'It could be argued the pricing model may increase churn in some cases.',
      'In some sense, higher churn might possibly occur.',
    ],
    correctAnswer: 'The new pricing model will likely increase churn.',
    explanation: 'The original stacks four hedges ("could perhaps," "in some sense," "might possibly," "somewhat") around one claim. "Likely" keeps appropriate uncertainty without burying the point.',
    difficulty: 2,
    cognitiveTarget: 'Hedging Reduction & Directness',
  },

  // ──────────────────────────────────  MATH  ──────────────────────────────
  {
    id: 'math-01',
    category: 'math',
    type: 'magnitude_estimation',
    title: 'Order of Magnitude: Seconds in a Year',
    prompt: 'Estimate the approximate number of seconds in a standard (non-leap) calendar year:',
    options: [
      '3.15 × 10^9 seconds',
      '3.15 × 10^7 seconds',
      '3.15 × 10^6 seconds',
      '3.15 × 10^5 seconds',
    ],
    correctAnswer: '3.15 × 10^7 seconds',
    explanation: '365 × 24 × 3600 ≈ 31,536,000 = 3.15 × 10^7 seconds. A handy rule of thumb: 1 year ≈ π × 10^7 seconds.',
    difficulty: 2,
    cognitiveTarget: 'Fermi Estimation & Scale Awareness',
  },
  {
    id: 'math-02',
    category: 'math',
    type: 'compound_percentage',
    title: 'Compounded Percentage Change',
    prompt: 'A stock rises 20% on Monday, then falls 20% on Tuesday (from the new price). What is the net change from the original price?',
    options: [
      '+4%',
      '-4%',
      '-2%',
      '0%',
    ],
    correctAnswer: '-4%',
    explanation: '100 × 1.20 = 120, then 120 × 0.80 = 96. That is a net change of -4%, not 0% — percentage gains and losses do not cancel symmetrically.',
    difficulty: 2,
    cognitiveTarget: 'Compounded Percentage Reasoning',
  },
  {
    id: 'math-03',
    category: 'math',
    type: 'mental_arithmetic',
    title: 'Quick Mental Multiplication',
    prompt: 'Compute 24 × 16 without a calculator:',
    options: [
      '344',
      '364',
      '384',
      '404',
    ],
    correctAnswer: '384',
    explanation: '24 × 16 = 24 × 16 = (24 × 10) + (24 × 6) = 240 + 144 = 384.',
    difficulty: 1,
    cognitiveTarget: 'Mental Arithmetic Fluency',
  },
  {
    id: 'math-04',
    category: 'math',
    type: 'probability',
    title: 'Basic Probability: Two Coins',
    prompt: 'You flip two fair coins. What is the probability of getting at least one heads?',
    options: [
      '1/4',
      '1/2',
      '2/3',
      '3/4',
    ],
    correctAnswer: '3/4',
    explanation: 'There are 4 equally likely outcomes: HH, HT, TH, TT. Three of them contain at least one heads, so the probability is 3/4.',
    difficulty: 2,
    cognitiveTarget: 'Probability & Sample Space Reasoning',
  },
  {
    id: 'math-05',
    category: 'math',
    type: 'fermi_estimation',
    title: 'Fermi Estimate: Piano Tuners',
    prompt: 'Roughly how many piano tuners would you estimate work in a city of 1 million people? Pick the best order-of-magnitude answer.',
    options: [
      'About 500–2,000',
      'About 20,000',
      'About 2–5',
      'About 20–50',
    ],
    correctAnswer: 'About 20–50',
    explanation: 'Classic Fermi logic: ~1 in 3 households owns a piano (≈100k pianos), each tuned once a year, a tuner does ~2 pianos/day × 250 days (~500/year), so 100,000 / 500 ≈ 20–50 tuners. The exact number matters less than reasoning through the chain.',
    difficulty: 4,
    cognitiveTarget: 'Fermi Estimation & Scale Chains',
  },
  {
    id: 'math-06',
    category: 'math',
    type: 'algebra_word_problem',
    title: 'Algebra Word Problem',
    prompt: 'A rectangle is twice as long as it is wide. Its perimeter is 60 cm. What is its width?',
    options: [
      '20 cm',
      '10 cm',
      '15 cm',
      '12 cm',
    ],
    correctAnswer: '10 cm',
    explanation: 'Let width = w, length = 2w. Perimeter = 2(w + 2w) = 6w = 60, so w = 10 cm.',
    difficulty: 2,
    cognitiveTarget: 'Algebraic Word Problem Setup',
  },
  {
    id: 'math-07',
    category: 'math',
    type: 'rate_problem',
    title: 'Rate & Unit Conversion',
    prompt: 'A car travels 135 km in 1.5 hours. At that same rate, how far does it travel in 40 minutes?',
    options: [
      '45 km',
      '54 km',
      '60 km',
      '90 km',
    ],
    correctAnswer: '60 km',
    explanation: 'Rate = 135 km / 1.5 hr = 90 km/hr. In 40 minutes (2/3 hour): 90 × 2/3 = 60 km.',
    difficulty: 3,
    cognitiveTarget: 'Rate Reasoning & Unit Conversion',
  },

  // ──────────────────────────────────  CODE  ──────────────────────────────
  {
    id: 'code-01',
    category: 'code',
    type: 'predict_output',
    title: 'Closure & Scope: var in a Loop',
    prompt: 'What will be printed to the console when this snippet executes?',
    contextCode: `const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(() => i);
}
console.log(funcs[0](), funcs[1](), funcs[2]());`,
    options: [
      '0 1 2',
      'undefined undefined undefined',
      '0 0 0',
      '3 3 3',
    ],
    correctAnswer: '3 3 3',
    explanation: '`var` is function-scoped, not block-scoped, so all three closures share the same binding of `i`, which equals 3 once the loop finishes.',
    difficulty: 3,
    cognitiveTarget: 'Scope Tracing & Closures',
  },
  {
    id: 'code-02',
    category: 'code',
    type: 'predict_output',
    title: 'Array Method Chaining',
    prompt: 'What does this code log to the console?',
    contextCode: `const nums = [1, 2, 3, 4, 5];
const result = nums
  .filter(n => n % 2 === 0)
  .map(n => n * 10);
console.log(result);`,
    options: [
      '[20, 40, 60]',
      '[20, 40]',
      '[10, 20, 30, 40, 50]',
      '[2, 4]',
    ],
    correctAnswer: '[20, 40]',
    explanation: '`filter` keeps only even numbers (2 and 4), then `map` multiplies each surviving value by 10, giving [20, 40].',
    difficulty: 2,
    cognitiveTarget: 'Array Method Execution Tracing',
  },
  {
    id: 'code-03',
    category: 'code',
    type: 'spot_bug',
    title: 'Off-by-One Loop Bug',
    prompt: 'This function is supposed to sum every element in an array, but it has a bug. What is wrong?',
    contextCode: `function sumArray(arr) {
  let total = 0;
  for (let i = 1; i <= arr.length; i++) {
    total += arr[i];
  }
  return total;
}`,
    options: [
      '`arr.length` is evaluated incorrectly on every iteration.',
      'The loop starts at 1 and goes to arr.length, so it skips index 0 and reads one index past the end.',
      'The loop should use a while loop instead of a for loop.',
      'The variable total should be declared with const instead of let.',
    ],
    correctAnswer: 'The loop starts at 1 and goes to arr.length, so it skips index 0 and reads one index past the end.',
    explanation: 'Arrays are zero-indexed, so the loop should run from 0 to arr.length - 1. As written it skips arr[0] and accesses arr[arr.length], which is undefined.',
    difficulty: 2,
    cognitiveTarget: 'Off-by-One Bug Detection',
  },
  {
    id: 'code-04',
    category: 'code',
    type: 'predict_output',
    title: 'Hoisting Behavior',
    prompt: 'What does this code print?',
    contextCode: `console.log(typeof greet);
greet();

function greet() {
  console.log('hi');
}`,
    options: [
      '"undefined" then a TypeError',
      'ReferenceError before anything logs',
      '"undefined" then "hi"',
      '"function" then "hi"',
    ],
    correctAnswer: '"function" then "hi"',
    explanation: 'Function declarations (unlike function expressions or `let`/`const`) are fully hoisted, including their body, so `greet` is already a callable function before its declaration line runs.',
    difficulty: 3,
    cognitiveTarget: 'Hoisting & Execution Order',
  },
  {
    id: 'code-05',
    category: 'code',
    type: 'async_ordering',
    title: 'Async Execution Order',
    prompt: 'In what order will these three lines print?',
    contextCode: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
    options: [
      'A, D, B, C',
      'A, B, C, D',
      'A, C, D, B',
      'A, D, C, B',
    ],
    correctAnswer: 'A, D, C, B',
    explanation: 'Synchronous code (A, D) runs first. Then the microtask queue (Promise callbacks) runs before the macrotask queue (setTimeout), so C prints before B even with a 0ms delay.',
    difficulty: 4,
    cognitiveTarget: 'Event Loop & Microtask/Macrotask Ordering',
  },
  {
    id: 'code-06',
    category: 'code',
    type: 'recursion_trace',
    title: 'Trace a Recursive Function',
    prompt: 'What value does this function return when called as `mystery(4)`?',
    contextCode: `function mystery(n) {
  if (n <= 1) return 1;
  return n * mystery(n - 1);
}`,
    options: [
      '16',
      '10',
      '12',
      '24',
    ],
    correctAnswer: '24',
    explanation: 'This is a factorial function: mystery(4) = 4 × 3 × 2 × 1 = 24.',
    difficulty: 2,
    cognitiveTarget: 'Recursive Execution Tracing',
  },
  {
    id: 'code-07',
    category: 'code',
    type: 'spot_bug',
    title: 'Async State Update Race',
    prompt: 'Identify the real flaw in this React lifecycle snippet:',
    contextCode: `useEffect(() => {
  fetchUser(id).then(res => {
    setUser(res);
  });
}, [id]);`,
    options: [
      'useEffect cannot contain asynchronous logic at all.',
      'If `id` changes quickly, a stale response can arrive after a newer request and overwrite the latest state.',
      'setUser must be called synchronously inside useEffect.',
      'The dependency array should be empty to avoid re-running.',
    ],
    correctAnswer: 'If `id` changes quickly, a stale response can arrive after a newer request and overwrite the latest state.',
    explanation: 'Without an "is this still the latest request" guard (e.g. a cleanup flag), a slow earlier fetch can resolve after a faster later one and clobber the correct state with stale data.',
    difficulty: 4,
    cognitiveTarget: 'Async Race Condition Auditing',
  },

  // ─────────────────────────────────  MEMORY  ──────────────────────────────
  {
    id: 'memory-01',
    category: 'memory',
    type: 'paired_associates',
    title: 'Paired Associates: Capitals',
    prompt: 'Study these country–capital pairs, then answer: which capital was paired with Australia?\n\n• Kenya → Nairobi\n• Australia → Canberra\n• Peru → Lima\n• Norway → Oslo',
    options: [
      'Sydney',
      'Lima',
      'Canberra',
      'Oslo',
    ],
    correctAnswer: 'Canberra',
    explanation: 'Canberra, not Sydney, is the capital of Australia — a classic memory trap since Sydney is the better-known city.',
    difficulty: 1,
    cognitiveTarget: 'Associative Recall',
  },
  {
    id: 'memory-02',
    category: 'memory',
    type: 'sequence_recall',
    title: 'Sequence Recall: Digit String',
    prompt: 'Memorize this sequence, then identify the 4th digit in it:\n\n7 - 2 - 9 - 4 - 1 - 8',
    options: [
      '9',
      '4',
      '2',
      '1',
    ],
    correctAnswer: '4',
    explanation: 'Counting positions: 1st=7, 2nd=2, 3rd=9, 4th=4, 5th=1, 6th=8. The 4th digit is 4.',
    difficulty: 2,
    cognitiveTarget: 'Serial Position Working Memory',
  },
  {
    id: 'memory-03',
    category: 'memory',
    type: 'paired_associates',
    title: 'Paired Associates: Technical Terms',
    prompt: 'Study these term–definition pairs, then answer: which term means "a function that returns a function, capturing variables from its enclosing scope"?\n\n• Closure → captures enclosing scope\n• Recursion → a function calling itself\n• Polymorphism → many forms, one interface\n• Idempotence → same result no matter how many times applied',
    options: [
      'Recursion',
      'Idempotence',
      'Closure',
      'Polymorphism',
    ],
    correctAnswer: 'Closure',
    explanation: 'A closure is specifically the pattern of a function retaining access to variables from the scope in which it was created.',
    difficulty: 2,
    cognitiveTarget: 'Associative Recall Under Interference',
  },
  {
    id: 'memory-04',
    category: 'memory',
    type: 'sequence_recall',
    title: 'Sequence Recall: Ordered Steps',
    prompt: 'Memorize this deployment sequence, then answer: what is the 3rd step?\n\n1. Run tests\n2. Build artifact\n3. Push to staging\n4. Run smoke checks\n5. Promote to production',
    options: [
      'Run tests',
      'Push to staging',
      'Run smoke checks',
      'Build artifact',
    ],
    correctAnswer: 'Push to staging',
    explanation: 'The 3rd step in the listed sequence is "Push to staging," between building the artifact and running smoke checks.',
    difficulty: 1,
    cognitiveTarget: 'Serial Order Recall',
  },
  {
    id: 'memory-05',
    category: 'memory',
    type: 'paired_associates',
    title: 'Paired Associates: Location & Object',
    prompt: 'Study these room–item pairs, then answer: which item was placed in the kitchen?\n\n• Kitchen → Blue kettle\n• Office → Red stapler\n• Garage → Green toolbox\n• Bedroom → Yellow lamp',
    options: [
      'Yellow lamp',
      'Green toolbox',
      'Red stapler',
      'Blue kettle',
    ],
    correctAnswer: 'Blue kettle',
    explanation: 'The blue kettle was paired with the kitchen in the list above — a simple test of paired-associate encoding.',
    difficulty: 1,
    cognitiveTarget: 'Spatial-Associative Memory',
  },
  {
    id: 'memory-06',
    category: 'memory',
    type: 'sequence_recall',
    title: 'Sequence Recall: Reversed Order',
    prompt: 'Memorize this list, then answer: reading it backward, what is the 2nd item?\n\nApple, Ladder, Compass, Anchor, Feather',
    options: [
      'Compass',
      'Anchor',
      'Feather',
      'Ladder',
    ],
    correctAnswer: 'Anchor',
    explanation: 'Reversed, the list reads: Feather, Anchor, Compass, Ladder, Apple. The 2nd item backward is Anchor.',
    difficulty: 3,
    cognitiveTarget: 'Working Memory Manipulation (Reversal)',
  },

  // ─────────────────────────────────  READING  ─────────────────────────────
  {
    id: 'reading-01',
    category: 'reading',
    type: 'unstated_assumption',
    title: 'Unstated Assumption: Testing Claim',
    prompt: 'What unstated assumption does this claim depend on?',
    contextPassage: '"By introducing automated testing pipelines, our deployment failures decreased by 50%."',
    options: [
      'Developers universally prefer writing automated tests.',
      'Automated tests eliminate all possibility of human error.',
      'Deployment failure count is the only metric that matters for quality.',
      'The test suite\'s coverage reflects the real production failure modes it claims to prevent.',
    ],
    correctAnswer: 'The test suite\'s coverage reflects the real production failure modes it claims to prevent.',
    explanation: 'The causal claim only holds if the automated tests actually exercise the code paths that were previously failing in production — an assumption the sentence never states or proves.',
    difficulty: 3,
    cognitiveTarget: 'Unstated Assumption Identification',
  },
  {
    id: 'reading-02',
    category: 'reading',
    type: 'main_claim_vs_evidence',
    title: 'Main Claim vs. Supporting Evidence',
    prompt: 'Read the passage. What is the author\'s main claim (as opposed to supporting evidence)?',
    contextPassage: '"Remote work boosts productivity. Our internal survey found 68% of employees reported fewer interruptions at home, and commute time dropped to zero for most staff."',
    options: [
      'The company conducted an internal survey.',
      '68% of employees reported fewer interruptions.',
      'Commute time dropped to zero for most staff.',
      'Remote work boosts productivity.',
    ],
    correctAnswer: 'Remote work boosts productivity.',
    explanation: 'The first sentence states the overall claim; the survey statistics that follow are evidence offered in support of it, not the claim itself.',
    difficulty: 1,
    cognitiveTarget: 'Claim vs. Evidence Discrimination',
  },
  {
    id: 'reading-03',
    category: 'reading',
    type: 'correlation_vs_causation',
    title: 'Correlation vs. Causation',
    prompt: 'What is the core flaw in this argument?',
    contextPassage: '"Ice cream sales and drowning incidents both rise in the summer months. Therefore, ice cream causes drowning."',
    options: [
      'It contradicts itself in the second sentence.',
      'It relies on an appeal to authority.',
      'It uses statistics that were never collected.',
      'It ignores a third factor (hot weather) that independently causes both trends.',
    ],
    correctAnswer: 'It ignores a third factor (hot weather) that independently causes both trends.',
    explanation: 'This is a classic confounding-variable fallacy: hot weather drives both more ice cream sales and more swimming (hence more drownings), with no causal link between the two.',
    difficulty: 2,
    cognitiveTarget: 'Correlation/Causation Discrimination',
  },
  {
    id: 'reading-04',
    category: 'reading',
    type: 'inference',
    title: 'Draw the Valid Inference',
    prompt: 'Based only on the passage, which statement can be validly inferred?',
    contextPassage: '"Every certified auditor at the firm has passed the CPA exam. Maria works at the firm but has never taken the CPA exam."',
    options: [
      'Maria does not work in accounting.',
      'Maria will fail the CPA exam if she takes it.',
      'The firm has no other certified auditors besides Maria.',
      'Maria is not a certified auditor at the firm.',
    ],
    correctAnswer: 'Maria is not a certified auditor at the firm.',
    explanation: 'If all certified auditors passed the CPA exam, and Maria never took it, she logically cannot be a certified auditor there (contrapositive reasoning).',
    difficulty: 3,
    cognitiveTarget: 'Valid Inference from Premises',
  },
  {
    id: 'reading-05',
    category: 'reading',
    type: 'strongest_counterargument',
    title: 'Identify the Strongest Counterargument',
    prompt: 'Which response is the STRONGEST counterargument to this claim?',
    contextPassage: '"Since our top-performing employees all arrive before 8 AM, the company should require all staff to arrive by 8 AM to boost performance."',
    options: [
      'Some employees live far from the office.',
      'The policy would be unpopular with staff.',
      'Traffic can make early arrival difficult on certain days.',
      'Arriving early may be a result of high performance and personal preference, not its cause.',
    ],
    correctAnswer: 'Arriving early may be a result of high performance and personal preference, not its cause.',
    explanation: 'This directly attacks the causal assumption underlying the whole argument (reverse causation), while the other options are practical objections that don\'t address whether the core logic is flawed.',
    difficulty: 4,
    cognitiveTarget: 'Argument Evaluation & Counterargument Strength',
  },
  {
    id: 'reading-06',
    category: 'reading',
    type: 'logical_gap',
    title: 'Spot the Gap in a Marketing Claim',
    prompt: 'What is the logical gap in this advertisement?',
    contextPassage: '"9 out of 10 dentists recommend our toothpaste for their patients who chew gum."',
    options: [
      'It assumes all dentists have the same opinion.',
      'It only surveyed dentists about a narrow subset of patients (gum chewers), not their general recommendation.',
      'It does not name the dentists surveyed.',
      'It contradicts itself grammatically.',
    ],
    correctAnswer: 'It only surveyed dentists about a narrow subset of patients (gum chewers), not their general recommendation.',
    explanation: 'The claim is carefully scoped to "patients who chew gum," which is a much narrower and weaker claim than "9 out of 10 dentists recommend this toothpaste" in general — a common advertising sleight of hand.',
    difficulty: 3,
    cognitiveTarget: 'Scoped Claim Detection',
  },
  {
    id: 'reading-07',
    category: 'reading',
    type: 'fact_vs_opinion',
    title: 'Fact vs. Opinion',
    prompt: 'Which sentence from this passage is a statement of OPINION rather than a verifiable fact?\n\n"The bridge was completed in 1937. It is the most beautiful bridge in the world. It spans 2.7 kilometers."',
    options: [
      'The bridge exists.',
      'The bridge was completed in 1937.',
      'It is the most beautiful bridge in the world.',
      'It spans 2.7 kilometers.',
    ],
    correctAnswer: 'It is the most beautiful bridge in the world.',
    explanation: '"Most beautiful" is a subjective aesthetic judgment with no objective measurement, unlike the completion date and length, which can be independently verified.',
    difficulty: 1,
    cognitiveTarget: 'Fact/Opinion Discrimination',
  },

  // ────────────────────────────────  REASONING  ────────────────────────────
  {
    id: 'reasoning-01',
    category: 'reasoning',
    type: 'logic_flaw',
    title: 'Formal Fallacy: Affirming the Consequent',
    prompt: 'Identify the logical fallacy in this argument:',
    contextPassage: '"Every successful company uses cloud infrastructure. If we migrate to cloud infrastructure, we will become successful."',
    options: [
      'Ad Hominem',
      'False Dilemma',
      'Strawman',
      'Affirming the Consequent',
    ],
    correctAnswer: 'Affirming the Consequent',
    explanation: 'If P (success) implies Q (cloud use), observing Q does not guarantee P. Many unsuccessful companies also use cloud infrastructure.',
    difficulty: 3,
    cognitiveTarget: 'Formal Deductive Logic Validation',
  },
  {
    id: 'reasoning-02',
    category: 'reasoning',
    type: 'logic_flaw',
    title: 'Fallacy: Hasty Generalization',
    prompt: 'What fallacy is being committed here?',
    contextPassage: '"I met two rude tourists from that country last week. People from that country must be rude."',
    options: [
      'Circular Reasoning',
      'Slippery Slope',
      'Appeal to Authority',
      'Hasty Generalization',
    ],
    correctAnswer: 'Hasty Generalization',
    explanation: 'Drawing a broad conclusion about an entire population from a sample of two people is a hasty generalization — the sample is far too small to support the claim.',
    difficulty: 2,
    cognitiveTarget: 'Fallacy Identification',
  },
  {
    id: 'reasoning-03',
    category: 'reasoning',
    type: 'logic_flaw',
    title: 'Fallacy: False Dilemma',
    prompt: 'Which fallacy does this statement commit?',
    contextPassage: '"Either we cut the entire marketing budget, or the company goes bankrupt within a year."',
    options: [
      'Begging the Question',
      'False Dilemma',
      'Ad Hominem',
      'Equivocation',
    ],
    correctAnswer: 'False Dilemma',
    explanation: 'This presents only two extreme options while ignoring many intermediate possibilities, such as partially reducing the budget or increasing revenue elsewhere.',
    difficulty: 2,
    cognitiveTarget: 'Fallacy Identification',
  },
  {
    id: 'reasoning-04',
    category: 'reasoning',
    type: 'syllogism_validity',
    title: 'Check Syllogism Validity',
    prompt: 'Is the following syllogism logically valid?\n\nPremise 1: All engineers on this team know TypeScript.\nPremise 2: Sam knows TypeScript.\nConclusion: Sam is an engineer on this team.',
    options: [
      'Valid, but only if Sam has a job.',
      'Valid — the conclusion necessarily follows.',
      'Invalid — knowing TypeScript does not imply team membership.',
      'Invalid, because the premises contradict each other.',
    ],
    correctAnswer: 'Invalid — knowing TypeScript does not imply team membership.',
    explanation: 'This is the affirming-the-consequent pattern again: "all A are B" and "X is B" does not let you conclude "X is A." Plenty of people outside the team could also know TypeScript.',
    difficulty: 3,
    cognitiveTarget: 'Syllogistic Validity Checking',
  },
  {
    id: 'reasoning-05',
    category: 'reasoning',
    type: 'logic_flaw',
    title: 'Fallacy: Ad Hominem',
    prompt: 'What fallacy is at play in this exchange?',
    contextPassage: '"You say we should invest more in renewable energy, but you drive a gas car, so your argument is worthless."',
    options: [
      'Slippery Slope',
      'False Cause',
      'Appeal to Popularity',
      'Ad Hominem',
    ],
    correctAnswer: 'Ad Hominem',
    explanation: 'This attacks the arguer\'s personal behavior instead of engaging with the substance of the argument about renewable energy investment.',
    difficulty: 1,
    cognitiveTarget: 'Fallacy Identification',
  },
  {
    id: 'reasoning-06',
    category: 'reasoning',
    type: 'logic_flaw',
    title: 'Fallacy: Circular Reasoning',
    prompt: 'Identify the flaw in this argument:',
    contextPassage: '"This law is just because it was passed through the legal process, and the legal process is just because it produces just laws."',
    options: [
      'Straw Man',
      'Appeal to Emotion',
      'Circular Reasoning (Begging the Question)',
      'Slippery Slope',
    ],
    correctAnswer: 'Circular Reasoning (Begging the Question)',
    explanation: 'Each part of the argument is used to justify the other, so the conclusion is smuggled into the premises rather than actually proven.',
    difficulty: 3,
    cognitiveTarget: 'Circular Reasoning Detection',
  },
];

// Full exercise bank: curated core set plus the expanded second wave,
// bringing coverage to ~25 handcrafted items per category (~150 total).
export const EXERCISE_BANK: ExerciseItem[] = [...EXERCISE_BANK_CORE, ...EXERCISE_BANK_EXTRA];

// Fisher-Yates (Knuth) uniform shuffle.
export const fisherYatesShuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/** Shuffle option order so correctAnswer position is not predictable. */
export const withShuffledOptions = (item: ExerciseItem): ExerciseItem => {
  if (!item.options || item.options.length < 2) return item;
  return { ...item, options: fisherYatesShuffle(item.options) };
};

const ALL_CATEGORIES: SkillCategory[] = ['writing', 'math', 'code', 'memory', 'reading', 'reasoning'];

/**
 * Build a daily/coffee-break/weekend set that is:
 *  - Anti-repeat: prefers items the caller marks as already-seen (excludeIds)
 *    are avoided first, falling back to them only if the fresh pool runs dry.
 *  - Category-balanced: draws one item per distinct category (round-robin)
 *    before topping up the remainder from the leftover shuffled pool.
 */
export const getDailySetForMode = (
  mode: 'daily' | 'coffee_break' | 'weekend_long',
  options?: { excludeIds?: string[] },
): ExerciseItem[] => {
  const count = mode === 'coffee_break' ? 3 : mode === 'weekend_long' ? 8 : 5;
  const exclude = new Set(options?.excludeIds ?? []);

  const fresh = EXERCISE_BANK.filter((item) => !exclude.has(item.id));
  // If excluding everything would starve the pool below what we need, fall
  // back to the full bank so a set can still be assembled.
  const basePool = fresh.length >= count ? fresh : EXERCISE_BANK;

  const byCategory = new Map<SkillCategory, ExerciseItem[]>();
  ALL_CATEGORIES.forEach((cat) => byCategory.set(cat, []));
  fisherYatesShuffle(basePool).forEach((item) => {
    byCategory.get(item.category)?.push(item);
  });

  const selected: ExerciseItem[] = [];
  const selectedIds = new Set<string>();
  const shuffledCategories = fisherYatesShuffle(ALL_CATEGORIES);

  // Pass 1: round-robin one item per distinct category until count is hit
  // or every category's pool is exhausted.
  let progressed = true;
  while (selected.length < count && progressed) {
    progressed = false;
    for (const cat of shuffledCategories) {
      if (selected.length >= count) break;
      const pool = byCategory.get(cat) ?? [];
      const next = pool.shift();
      if (next && !selectedIds.has(next.id)) {
        selected.push(next);
        selectedIds.add(next.id);
        progressed = true;
      }
    }
  }

  // Pass 2: top up remainder from whatever is left, shuffled.
  if (selected.length < count) {
    const leftover = fisherYatesShuffle(
      basePool.filter((item) => !selectedIds.has(item.id)),
    );
    for (const item of leftover) {
      if (selected.length >= count) break;
      selected.push(item);
      selectedIds.add(item.id);
    }
  }

  return fisherYatesShuffle(selected).map(withShuffledOptions);
};

/** Pick N curated items for a skill, with shuffled option order. */
export const getSkillPracticeSet = (
  skill: ExerciseItem['category'],
  count = 3,
  bank: ExerciseItem[] = EXERCISE_BANK,
  options?: { excludeIds?: string[] },
): ExerciseItem[] => {
  const exclude = new Set(options?.excludeIds ?? []);
  const allMatching = bank.filter((item) => item.category === skill);
  const freshMatching = allMatching.filter((item) => !exclude.has(item.id));

  // Prefer unused items first, then top up with previously-seen ones if the
  // fresh pool can't cover the requested count on its own.
  const ordered = [...fisherYatesShuffle(freshMatching), ...fisherYatesShuffle(
    allMatching.filter((item) => exclude.has(item.id)),
  )];
  const pool = ordered.length > 0 ? ordered : fisherYatesShuffle(bank);
  return pool.slice(0, count).map(withShuffledOptions);
};
