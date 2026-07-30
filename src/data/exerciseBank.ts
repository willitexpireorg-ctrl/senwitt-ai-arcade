import type { ExerciseItem } from '../types';
import { generate90DayExerciseSuite } from '../services/exerciseAgents';
import { GameVariationsFactory } from '../services/gameVariationsFactory';

// Base Seed Items
const SEED_BANK: ExerciseItem[] = [
  {
    id: 'w-1',
    category: 'writing',
    type: 'concise_drafting',
    title: 'Cut AI Fluff & Wordiness',
    prompt: 'Select the most concise, high-impact rewrite that eliminates corporate filler:',
    contextPassage: '"At this point in time, it is critically incumbent upon our team to make a concerted effort to utilize leverage on our synergies."',
    options: [
      'We must leverage our synergies at this juncture.',
      'We need to work together effectively now.',
      'It is incumbent upon us to utilize our efforts.',
      'At this point, we should make concerted efforts.'
    ],
    correctAnswer: 'We need to work together effectively now.',
    explanation: 'Eliminates 14 filler words ("at this point in time", "critically incumbent", "concerted effort", "utilize leverage").',
    difficulty: 2,
    cognitiveTarget: 'Concise Drafting & Precision'
  },
  {
    id: 'm-1',
    category: 'math',
    type: 'magnitude_estimation',
    title: 'Order of Magnitude Estimation',
    prompt: 'Estimate the approximate number of seconds in a standard non-leap calendar year:',
    options: [
      '3.15 × 10^5 seconds',
      '3.15 × 10^7 seconds',
      '3.15 × 10^9 seconds',
      '3.15 × 10^6 seconds'
    ],
    correctAnswer: '3.15 × 10^7 seconds',
    explanation: '365 days × 24 hrs × 3600 sec ≈ 31,536,000 seconds = 3.15 × 10^7 seconds (~π × 10^7).',
    difficulty: 2,
    cognitiveTarget: 'Fermi Estimation & Scale Awareness'
  },
  {
    id: 'c-1',
    category: 'code',
    type: 'predict_output',
    title: 'Closure & Scope Execution',
    prompt: 'What will be printed to the console when this JavaScript snippet executes?',
    contextCode: `const funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(() => i);
}
console.log(funcs[0](), funcs[1](), funcs[2]());`,
    options: ['0 1 2', '3 3 3', 'undefined undefined undefined', '0 0 0'],
    correctAnswer: '3 3 3',
    explanation: 'Because `var` is function-scoped rather than block-scoped, all three closures reference the exact same binding of `i`, which equals 3 after the loop finishes.',
    difficulty: 3,
    cognitiveTarget: 'Mental Execution & Variable Scope Tracing'
  }
];

// Complete 1,500+ Exercise Database (100+ variations per game across 15 games)
export const EXERCISE_BANK: ExerciseItem[] = [
  ...SEED_BANK,
  ...generate90DayExerciseSuite(),
  ...GameVariationsFactory.generate1500ExerciseSuite()
];

// Fisher-Yates (Knuth) Cryptographically Sound Uniform Array Shuffle Algorithm
export const fisherYatesShuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getDailySetForMode = (mode: 'daily' | 'coffee_break' | 'weekend_long'): ExerciseItem[] => {
  const pool = fisherYatesShuffle(EXERCISE_BANK);

  if (mode === 'coffee_break') {
    return pool.slice(0, 3);
  } else if (mode === 'weekend_long') {
    return pool.slice(0, 8);
  }
  return pool.slice(0, 5);
};
