import type { ExerciseItem, SkillCategory } from '../types';

export class GameVariationsFactory {
  
  /**
   * Synthesizes 100+ variations for a given game ID across all 15 mini-games
   */
  static generate100VariationsForGame(gameId: string, category: SkillCategory): ExerciseItem[] {
    const items: ExerciseItem[] = [];

    for (let i = 1; i <= 100; i++) {
      const difficulty = (((i - 1) % 5) + 1) as 1 | 2 | 3 | 4 | 5;

      switch (category) {
        case 'writing': {
          if (gameId === 'game-6') {
            // AI Fluff Cutter
            const fillerCount = 10 + (i % 8);
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'writing',
              type: 'concise_drafting',
              title: `AI Fluff Cutter Variation #${i}`,
              prompt: `Eliminate ${fillerCount} wordy filler terms and convert to active syntax:`,
              contextPassage: `"At this point in time (#${i}), it is critically incumbent upon our team to make a concerted effort to optimize workflow processes going forward."`,
              options: [
                `We must streamline our workflow processes now (Var #${i}).`,
                `It is incumbent upon our team to make concerted efforts at this point.`,
                `Going forward, workflow optimization efforts are critically needed.`,
                `At this point in time, optimizing workflow processes is recommended.`
              ].sort(() => 0.5 - Math.random()),
              correctAnswer: `We must streamline our workflow processes now (Var #${i}).`,
              explanation: `Cuts 14 corporate filler words down to a direct active sentence.`,
              difficulty,
              cognitiveTarget: 'Syntactic Compression & Active Voice'
            });
          } else if (gameId === 'game-7') {
            // Nuanced Lexicon Audit
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'writing',
              type: 'word_choice',
              title: `Nuanced Lexicon Variation #${i}`,
              prompt: `Select the precise lexical term for an unstated claim made without justification (#${i}):`,
              options: ['Gratuitous assertion', 'Tautological claim', 'Ad hominem', 'Red herring'].sort(() => 0.5 - Math.random()),
              correctAnswer: 'Gratuitous assertion',
              explanation: 'A gratuitous assertion is a claim made without supporting evidence or justification.',
              difficulty,
              cognitiveTarget: 'Lexical Precision & Argument Analysis'
            });
          } else {
            // Syntactic Compressor
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'writing',
              type: 'sentence_combine',
              title: `Syntactic Compressor Variation #${i}`,
              prompt: `Combine clauses into one modifier-safe sentence (#${i}):`,
              contextPassage: `1. The LLM outputted unverified code (#${i}). 2. The engineering team deployed it to production.`,
              options: [
                `The engineering team deployed unverified LLM code to production without testing (Var #${i}).`,
                `Unverified by engineers, LLM code was deployed because it was outputted.`,
                `Deploying to production, unverified LLM code was submitted by engineers.`,
                `The LLM code was deployed by the engineering team unverified to production.`
              ].sort(() => 0.5 - Math.random()),
              correctAnswer: `The engineering team deployed unverified LLM code to production without testing (Var #${i}).`,
              explanation: 'Avoids dangling modifiers and keeps subject-action structure intact.',
              difficulty,
              cognitiveTarget: 'Structural Syntactic Structuring'
            });
          }
          break;
        }

        case 'math': {
          if (gameId === 'game-2') {
            // Symbolic System Solver
            const a = (i % 6) + 3;
            const b = (i % 4) + 2;
            const ans = a + b + i;
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'math',
              type: 'emoji_math',
              title: `Symbolic System Variation #${i}`,
              prompt: `Solve for the Target Symbol (💎):\n\n🌟 + 🌟 = ${a * 2}\n🌟 × 🚀 = ${a * b}\n🚀 + 💎 = ${b + ans}`,
              options: [`${ans}`, `${ans + 3}`, `${ans - 2}`, `${ans + 5}`].sort(() => 0.5 - Math.random()),
              correctAnswer: `${ans}`,
              explanation: `🌟 = ${a}, 🚀 = ${b}, therefore 💎 = ${ans}.`,
              difficulty,
              cognitiveTarget: 'Symbolic Substitution Working Memory'
            });
          } else if (gameId === 'game-3') {
            // Fermi Scale Estimator
            const p = 4 + (i % 6);
            const coeff = (1.5 + (i % 5) * 0.8).toFixed(2);
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'math',
              type: 'magnitude_estimation',
              title: `Fermi Scale Variation #${i}`,
              prompt: `Select the correct order-of-magnitude scale notation for ${coeff} × 10^${p}:`,
              options: [
                `${coeff} × 10^${p}`,
                `${coeff} × 10^${p + 1}`,
                `${coeff} × 10^${p - 1}`,
                `${coeff} × 10^${p + 2}`
              ].sort(() => 0.5 - Math.random()),
              correctAnswer: `${coeff} × 10^${p}`,
              explanation: `Scale order of magnitude is 10^${p}.`,
              difficulty,
              cognitiveTarget: 'Fermi Scale & Order of Magnitude'
            });
          } else {
            // Compound Percentage Adjuster
            const inc = 10 + (i % 4) * 5;
            const net = Math.round(100 * (1 + inc / 100) * 0.9);
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'math',
              type: 'mental_arithmetic',
              title: `Compound Percentage Variation #${i}`,
              prompt: `A load increases by ${inc}%, then experiences a 10% penalty (#${i}). Net gain relative to baseline?`,
              options: [`${net}%`, `${100 + inc - 10}%`, `${net + 4}%`, `${net - 3}%`].sort(() => 0.5 - Math.random()),
              correctAnswer: `${net}%`,
              explanation: `100 × (1 + ${inc/100}) = ${100 + inc}. Decreasing by 10% = ${net}%.`,
              difficulty,
              cognitiveTarget: 'Compounded Percentile Arithmetic'
            });
          }
          break;
        }

        case 'code': {
          if (gameId === 'game-4') {
            // Closure Scope Tracer
            const factor = (i % 5) + 2;
            const mult = (i % 3) + 3;
            const res = factor * mult;
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'code',
              type: 'predict_output',
              title: `Closure Scope Variation #${i}`,
              prompt: `Predict console output for closure variation #${i}:`,
              contextCode: `function makeMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const mult = makeMultiplier(${factor});
console.log(mult(${mult}));`,
              options: [`${res}`, `${factor}`, `${mult}`, 'undefined'].sort(() => 0.5 - Math.random()),
              correctAnswer: `${res}`,
              explanation: `Closure captures factor = ${factor}. Calling \`mult(${mult})\` yields ${factor} × ${mult} = ${res}.`,
              difficulty,
              cognitiveTarget: 'Lexical Scope & Execution Tracing'
            });
          } else {
            // Async Race Spotter
            items.push({
              id: `${gameId}-var-${i}`,
              category: 'code',
              type: 'spot_bug',
              title: `Async Race Variation #${i}`,
              prompt: `Identify the flaw in this async component lifecycle variation #${i}:`,
              contextCode: `useEffect(() => {
  let active = true;
  fetchUser(id).then(res => {
    setUser(res);
  });
}, [id]);`,
              options: [
                'Missing check for active flag before setting state',
                'Async functions cannot be called in promises',
                'useEffect dependency array requires setUser',
                'Missing catch block in fetch request'
              ].sort(() => 0.5 - Math.random()),
              correctAnswer: 'Missing check for active flag before setting state',
              explanation: 'Without checking active flag, rapid id changes cause unmounted state overwrites.',
              difficulty,
              cognitiveTarget: 'Async Lifecycle Concurrency Audit'
            });
          }
          break;
        }

        case 'memory': {
          items.push({
            id: `${gameId}-var-${i}`,
            category: 'memory',
            type: 'paired_associates',
            title: `Memory Matrix Variation #${i}`,
            prompt: `Memorize term pair variation #${i}:\n\n• Node-${i} -> Service-${i + 10}\n• Delta -> Event Loop`,
            options: [`Service-${i + 10}`, 'Event Loop', 'Thread Pool', 'Hypervisor'].sort(() => 0.5 - Math.random()),
            correctAnswer: `Service-${i + 10}`,
            explanation: `Node-${i} was paired with Service-${i + 10}.`,
            difficulty,
            cognitiveTarget: 'Associative Episodic Working Memory'
          });
          break;
        }

        case 'reading': {
          items.push({
            id: `${gameId}-var-${i}`,
            category: 'reading',
            type: 'inference_spotting',
            title: `Unstated Assumption Variation #${i}`,
            prompt: `Identify the unstated assumption in argument variation #${i}:`,
            contextPassage: `"By introducing automated testing pipelines (#${i}), our deployment failures decreased by 50%."`,
            options: [
              'Test suite coverage reflects real production edge cases without inflation.',
              'Automated testing eliminates all human errors.',
              'Developers prefer writing automated tests.',
              'Deployment failures are the only quality metric.'
            ].sort(() => 0.5 - Math.random()),
            correctAnswer: 'Test suite coverage reflects real production edge cases without inflation.',
            explanation: 'Assumes automated test assertions map accurately to real production failures.',
            difficulty,
            cognitiveTarget: 'Critical Reading & Unstated Assumption Analysis'
          });
          break;
        }

        case 'reasoning': {
          items.push({
            id: `${gameId}-var-${i}`,
            category: 'reasoning',
            type: 'logic_flaw',
            title: `Formal Fallacy Variation #${i}`,
            prompt: `Identify the logical fallacy in argument variation #${i}:`,
            contextPassage: `"Every successful company uses cloud servers. If we migrate to cloud servers, we will become successful."`,
            options: ['Affirming the Consequent', 'Ad Hominem', 'False Dilemma', 'Strawman'].sort(() => 0.5 - Math.random()),
            correctAnswer: 'Affirming the Consequent',
            explanation: 'If P implies Q, observing Q does not logically guarantee P.',
            difficulty,
            cognitiveTarget: 'Formal Deductive Logic Validation'
          });
          break;
        }
      }
    }

    return items;
  }

  /**
   * Generates complete 1,500+ exercise suite (100 per game across 15 games)
   */
  static generate1500ExerciseSuite(): ExerciseItem[] {
    const gameConfigs: { id: string; category: SkillCategory }[] = [
      { id: 'game-1', category: 'memory' },
      { id: 'game-2', category: 'math' },
      { id: 'game-3', category: 'math' },
      { id: 'game-4', category: 'code' },
      { id: 'game-5', category: 'code' },
      { id: 'game-6', category: 'writing' },
      { id: 'game-7', category: 'writing' },
      { id: 'game-8', category: 'writing' },
      { id: 'game-9', category: 'reasoning' },
      { id: 'game-10', category: 'reading' },
      { id: 'game-11', category: 'memory' },
      { id: 'game-12', category: 'memory' },
      { id: 'game-13', category: 'reading' },
      { id: 'game-14', category: 'math' },
      { id: 'game-15', category: 'reasoning' },
    ];

    let fullSuite: ExerciseItem[] = [];
    gameConfigs.forEach((cfg) => {
      const vars = this.generate100VariationsForGame(cfg.id, cfg.category);
      fullSuite = [...fullSuite, ...vars];
    });

    return fullSuite;
  }
}
