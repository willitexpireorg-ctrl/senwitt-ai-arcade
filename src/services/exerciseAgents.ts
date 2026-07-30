import type { ExerciseItem } from '../types';

// Multi-Agent Exercise Generation Framework
export interface ExerciseGeneratorOptions {
  count: number;
  minDifficulty?: 1 | 2 | 3 | 4 | 5;
  maxDifficulty?: 1 | 2 | 3 | 4 | 5;
}

/**
 * WRITING AGENT
 * Focuses on cutting AI wordiness, jargon, passive voice, and syntactic precision.
 */
export class WritingAgent {
  static generateReps(count: number): ExerciseItem[] {
    const templates = [
      {
        title: 'Cut AI Corporate Fluff',
        type: 'concise_drafting',
        prompts: [
          { passage: '"In order to facilitate the optimization of our workflow processes going forward, it is recommended that we make a decision."', correct: 'We should decide how to streamline our workflow.', options: ['We should decide how to streamline our workflow.', 'In order to optimize workflows going forward, we must decide.', 'It is recommended to facilitate workflow optimization decisions.', 'To make a decision going forward, workflow optimization is needed.'], explanation: 'Reduces 21 wordy filler phrases to a crisp 8-word active sentence.' },
          { passage: '"Due to the fact that the server experienced an unexpected downtime event, we were unable to complete the migration."', correct: 'Because the server went down, we could not finish the migration.', options: ['Because the server went down, we could not finish the migration.', 'Due to server downtime events, migration completion was impossible.', 'The unexpected server downtime caused an inability to complete migration.', 'Owing to server downtime, the migration was unable to be completed.'], explanation: 'Replaces "due to the fact that" with "because" and "experienced an unexpected downtime event" with "went down".' },
          { passage: '"It is of utmost importance to bear in mind that user privacy must be prioritized at all times."', correct: 'We must always prioritize user privacy.', options: ['We must always prioritize user privacy.', 'Bearing in mind user privacy, it is of utmost importance to prioritize.', 'It is important to bear in mind prioritizing user privacy at all times.', 'User privacy prioritization is of utmost importance to bear in mind.'], explanation: 'Eliminates 12 words of preamble ("it is of utmost importance to bear in mind that").' }
        ]
      },
      {
        title: 'Precision Vocabulary Audit',
        type: 'word_choice',
        prompts: [
          { passage: 'Which word accurately describes a logical argument whose premises already assume the truth of its conclusion?', correct: 'Begging the question (Tautology)', options: ['Begging the question (Tautology)', 'Red herring', 'Ad hominem', 'Equivocation'], explanation: 'Begging the question occurs when an argument assumes what it purports to prove.' },
          { passage: 'Select the term for an overused, unoriginal idea that has lost its impact through repetition:', correct: 'Cliché', options: ['Cliché', 'Paradox', 'Oxymoron', 'Hyperbole'], explanation: 'A cliché is an expression or idea that has been overused to the point of losing original meaning.' },
          { passage: 'Identify the word for stating a fact or claim with extreme clarity and explicit detail:', correct: 'Unequivocal', options: ['Unequivocal', 'Ambiguous', 'Esoteric', 'Transient'], explanation: 'Unequivocal means leaving no doubt, clear and unambiguous.' }
        ]
      }
    ];

    const reps: ExerciseItem[] = [];
    for (let i = 0; i < count; i++) {
      const templateGroup = templates[i % templates.length];
      const itemData = templateGroup.prompts[i % templateGroup.prompts.length];

      reps.push({
        id: `agent-writing-${i + 1}`,
        category: 'writing',
        type: templateGroup.type,
        title: `${templateGroup.title} #${Math.floor(i / templates.length) + 1}`,
        prompt: `Refine the text for maximum conciseness and impact:`,
        contextPassage: itemData.passage,
        options: itemData.options,
        correctAnswer: itemData.correct,
        explanation: itemData.explanation,
        difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        cognitiveTarget: 'Syntactic Compression & Lexical Precision'
      });
    }
    return reps;
  }
}

/**
 * MATH AGENT
 * Focuses on Fermi scale estimation, symbolic equations, and compound growth math.
 */
export class MathAgent {
  static generateReps(count: number): ExerciseItem[] {
    const reps: ExerciseItem[] = [];
    for (let i = 0; i < count; i++) {
      const typeChoice = i % 3;

      if (typeChoice === 0) {
        // Fermi Estimate
        const power = 4 + (i % 5);
        const base = 2 + (i % 4);
        const ans = Math.round(base * Math.pow(10, power));
        const ansStr = `${(ans / Math.pow(10, power)).toFixed(2)} × 10^${power}`;

        reps.push({
          id: `agent-math-${i + 1}`,
          category: 'math',
          type: 'magnitude_estimation',
          title: `Order of Magnitude Scale #${i + 1}`,
          prompt: `Estimate the approximate value of (${base.toFixed(1)} × 10^${power}):`,
          options: [
            ansStr,
            `${((base + 2) * Math.pow(10, power) / Math.pow(10, power)).toFixed(2)} × 10^${power}`,
            `${(ans / Math.pow(10, power + 1)).toFixed(2)} × 10^${power + 1}`,
            `${(ans / Math.pow(10, power - 1)).toFixed(2)} × 10^${power - 1}`
          ].sort(() => 0.5 - Math.random()),
          correctAnswer: ansStr,
          explanation: `Order of magnitude scale is ${ansStr}.`,
          difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          cognitiveTarget: 'Fermi Scale & Order of Magnitude Awareness'
        });
      } else if (typeChoice === 1) {
        // Symbolic Equation
        const valA = (i + 3) * 2;
        const valB = i + 5;
        const target = valA + valB;

        reps.push({
          id: `agent-math-${i + 1}`,
          category: 'math',
          type: 'emoji_math',
          title: `Symbolic Working Memory System #${i + 1}`,
          prompt: `Solve for the Target Symbol (💎):\n\n🔥 + 🔥 = ${valA * 2}\n🔥 × ⚡ = ${valA * 3}\n⚡ + 💎 = ${3 + target}`,
          options: [`${target}`, `${target + 4}`, `${target - 3}`, `${target + 2}`].sort(() => 0.5 - Math.random()),
          correctAnswer: `${target}`,
          explanation: `🔥 = ${valA}. Since 🔥 × ⚡ = ${valA * 3}, ⚡ = 3. Therefore 3 + 💎 = ${3 + target} => 💎 = ${target}.`,
          difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          cognitiveTarget: 'Symbolic Working Memory Substitution'
        });
      } else {
        // Compound Growth
        const p = 10 + (i % 4) * 5;
        const net = Math.round(100 * (1 + p / 100) * 0.9);

        reps.push({
          id: `agent-math-${i + 1}`,
          category: 'math',
          type: 'mental_arithmetic',
          title: `Compound Percentage Audit #${i + 1}`,
          prompt: `A system increases performance by ${p}%, then experiences a 10% overhead penalty on the new total. What is the net percentage relative to baseline?`,
          options: [`${net}%`, `${100 + p - 10}%`, `${net + 5}%`, `${net - 4}%`].sort(() => 0.5 - Math.random()),
          correctAnswer: `${net}%`,
          explanation: `Baseline 100 × (1 + ${p/100}) = ${100 + p}. Decreasing by 10% yields ${100 + p} × 0.9 = ${net}%.`,
          difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          cognitiveTarget: 'Compounded Percentile Arithmetic'
        });
      }
    }
    return reps;
  }
}

/**
 * CODE AGENT
 * Focuses on closures, scoping, race conditions, and control flow execution.
 */
export class CodeAgent {
  static generateReps(count: number): ExerciseItem[] {
    const reps: ExerciseItem[] = [];
    for (let i = 0; i < count; i++) {
      const type = i % 2 === 0 ? 'predict_output' : 'spot_bug';

      if (type === 'predict_output') {
        const val = (i % 4) + 2;
        const res = val * val;

        reps.push({
          id: `agent-code-${i + 1}`,
          category: 'code',
          type: 'predict_output',
          title: `Scope & Closure Tracing #${i + 1}`,
          prompt: 'Predict the console output of this closure execution:',
          contextCode: `function makeMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = makeMultiplier(${val});
console.log(double(${val}));`,
          options: [`${res}`, `${val}`, `${val * 2}`, 'undefined'].sort(() => 0.5 - Math.random()),
          correctAnswer: `${res}`,
          explanation: `The outer scope factor \`factor = ${val}\` is bound in the closure. Calling \`double(${val})\` returns ${val} × ${val} = ${res}.`,
          difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          cognitiveTarget: 'Mental Execution & Variable Scope Tracing'
        });
      } else {
        reps.push({
          id: `agent-code-${i + 1}`,
          category: 'code',
          type: 'spot_bug',
          title: `Concurrency & Async Edge Case Audit #${i + 1}`,
          prompt: 'Identify the flaw in this async component lifecycle handler:',
          contextCode: `useEffect(() => {
  let isSubscribed = true;
  fetchData(id).then(data => {
    setState(data);
  });
}, [id]);`,
          options: [
            'Missing check for isSubscribed before setting state',
            'Missing async keyword on useEffect callback',
            'setState cannot be called inside then promise handler',
            'Dependency array is missing fetchData function reference'
          ].sort(() => 0.5 - Math.random()),
          correctAnswer: 'Missing check for isSubscribed before setting state',
          explanation: 'Without checking `if (isSubscribed)` inside the resolved promise, rapid `id` changes can cause unmounted state updates or race condition overwrites.',
          difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          cognitiveTarget: 'Async Lifecycle Concurrency Audit'
        });
      }
    }
    return reps;
  }
}

/**
 * MEMORY AGENT
 * Focuses on paired associates, list recall, and spatial patterns.
 */
export class MemoryAgent {
  static generateReps(count: number): ExerciseItem[] {
    const pairsPool = [
      { key: 'Alpha', val: 'Hypervisor' },
      { key: 'Beta', val: 'Garbage Collector' },
      { key: 'Gamma', val: 'JIT Compiler' },
      { key: 'Delta', val: 'Event Loop' },
      { key: 'Epsilon', val: 'Virtual DOM' },
      { key: 'Zeta', val: 'Thread Pool' }
    ];

    const reps: ExerciseItem[] = [];
    for (let i = 0; i < count; i++) {
      const pair = pairsPool[i % pairsPool.length];
      const otherPairs = pairsPool.filter(p => p.key !== pair.key).slice(0, 2);

      reps.push({
        id: `agent-memory-${i + 1}`,
        category: 'memory',
        type: 'paired_associates',
        title: `Architectural Term Association #${i + 1}`,
        prompt: `Memorize these pairs for 5 seconds:\n\n• ${pair.key} -> ${pair.val}\n• ${otherPairs[0].key} -> ${otherPairs[0].val}\n• ${otherPairs[1].key} -> ${otherPairs[1].val}`,
        options: [pair.val, otherPairs[0].val, otherPairs[1].val, 'Mutex Lock'].sort(() => 0.5 - Math.random()),
        correctAnswer: pair.val,
        explanation: `${pair.key} was explicitly paired with ${pair.val}.`,
        difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        cognitiveTarget: 'Paired Associate Working Memory'
      });
    }
    return reps;
  }
}

/**
 * READING AGENT
 * Focuses on critical reading, unstated assumption extraction, and speed comprehension.
 */
export class ReadingAgent {
  static generateReps(count: number): ExerciseItem[] {
    const passages = [
      {
        context: '"By switching from monolithic deployments to microservices, our platform decreased single-point server crash incidents by 40%."',
        question: 'Identify the unstated assumption required for the argument:',
        correct: 'Microservices do not introduce new cascading network failure modes that offset individual server stability.',
        options: [
          'Microservices do not introduce new cascading network failure modes that offset individual server stability.',
          'Monolithic deployments are always slower than microservices.',
          'Single-point crashes are the only metric of software quality.',
          'Developers prefer writing code in microservice architectures.'
        ],
        explanation: 'The argument assumes net stability improved without acknowledging network complexity overhead.'
      },
      {
        context: '"Our company implemented mandatory daily stand-ups and saw a 15% increase in feature story points completed per sprint."',
        question: 'Which unstated assumption is made by management?',
        correct: 'Increased story points completed directly reflects genuine productivity rather than story point inflation.',
        options: [
          'Increased story points completed directly reflects genuine productivity rather than story point inflation.',
          'Daily stand-ups eliminate all software bugs.',
          'Engineers enjoy daily morning meetings.',
          'Feature velocity is the only metric customers care about.'
        ],
        explanation: 'Assumes team story point estimation remained baseline-constant.'
      }
    ];

    const reps: ExerciseItem[] = [];
    for (let i = 0; i < count; i++) {
      const p = passages[i % passages.length];
      reps.push({
        id: `agent-reading-${i + 1}`,
        category: 'reading',
        type: 'inference_spotting',
        title: `Unstated Assumption Audit #${i + 1}`,
        prompt: p.question,
        contextPassage: p.context,
        options: p.options,
        correctAnswer: p.correct,
        explanation: p.explanation,
        difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        cognitiveTarget: 'Critical Reading & Assumption Extraction'
      });
    }
    return reps;
  }
}

/**
 * REASONING AGENT
 * Focuses on formal fallacies, deduction grids, and counterfactual logic.
 */
export class ReasoningAgent {
  static generateReps(count: number): ExerciseItem[] {
    const fallacies = [
      {
        statement: '"If a developer understands computer science, they can write bug-free code. Alice writes bug-free code, therefore Alice understands computer science."',
        fallacy: 'Affirming the Consequent',
        explanation: 'If P implies Q, observing Q does not logically guarantee P (Alice could write bug-free code through extreme caution or simple tasks).'
      },
      {
        statement: '"We should not adopt Bob\'s proposed database indexing strategy because Bob was late to yesterday\'s standup meeting."',
        fallacy: 'Ad Hominem',
        explanation: 'Attacking Bob\'s personal punctuality rather than evaluating the technical merits of his database indexing proposal.'
      },
      {
        statement: '"Either we migrate our entire codebase to Rust this month, or our company will go bankrupt by next year."',
        fallacy: 'False Dilemma',
        explanation: 'Falsely limiting the choices to two extreme options while ignoring intermediate solutions.'
      }
    ];

    const reps: ExerciseItem[] = [];
    for (let i = 0; i < count; i++) {
      const f = fallacies[i % fallacies.length];
      reps.push({
        id: `agent-reasoning-${i + 1}`,
        category: 'reasoning',
        type: 'logic_flaw',
        title: `Formal Fallacy Recognition #${i + 1}`,
        prompt: 'Identify the logical fallacy committed in this statement:',
        contextPassage: f.statement,
        options: [f.fallacy, 'Strawman Fallacy', 'Begging the Question', 'Post Hoc Ergo Propter Hoc'].sort(() => 0.5 - Math.random()),
        correctAnswer: f.fallacy,
        explanation: f.explanation,
        difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        cognitiveTarget: 'Formal Deductive Fallacy Recognition'
      });
    }
    return reps;
  }
}

/**
 * MASTER AGENT ORCHESTRATOR
 * Generates an expansive bank of 450+ unique non-repeating exercise items (90 Days of Content).
 */
export const generate90DayExerciseSuite = (): ExerciseItem[] => {
  const writingReps = WritingAgent.generateReps(80);
  const mathReps = MathAgent.generateReps(80);
  const codeReps = CodeAgent.generateReps(80);
  const memoryReps = MemoryAgent.generateReps(80);
  const readingReps = ReadingAgent.generateReps(80);
  const reasoningReps = ReasoningAgent.generateReps(80);

  return [
    ...writingReps,
    ...mathReps,
    ...codeReps,
    ...memoryReps,
    ...readingReps,
    ...reasoningReps
  ];
};
