import type { ExerciseItem } from '../types';

export const generateProceduralMathItem = (): ExerciseItem => {
  const num1 = Math.floor(Math.random() * 8) + 2;
  const num2 = Math.floor(Math.random() * 8) + 2;
  const targetVal = (num1 * num2) + Math.floor(Math.random() * 10);
  
  const options = [
    `${targetVal}`,
    `${targetVal + 3}`,
    `${targetVal - 4}`,
    `${targetVal + 7}`
  ].sort(() => 0.5 - Math.random());

  return {
    id: `proc-math-${Date.now()}`,
    category: 'math',
    type: 'mental_arithmetic',
    title: 'Dynamic Symbolic Solver',
    prompt: `Solve for the variable X:\n\n(${num1} × ${num2}) + 5 = X + ${5 - (targetVal - (num1 * num2))}`,
    options,
    correctAnswer: `${targetVal}`,
    explanation: `(${num1} × ${num2}) = ${num1 * num2}. Solving the algebraic balance yields X = ${targetVal}.`,
    difficulty: 2,
    cognitiveTarget: 'Procedural Symbolic Algebra'
  };
};

export const generateProceduralCodeItem = (): ExerciseItem => {
  const initialVal = Math.floor(Math.random() * 5) + 1;
  const multiplier = Math.floor(Math.random() * 3) + 2;
  const finalAns = initialVal * multiplier;

  return {
    id: `proc-code-${Date.now()}`,
    category: 'code',
    type: 'predict_output',
    title: 'Procedural Scope & Closure Audit',
    prompt: 'Predict the console output of this closure execution:',
    contextCode: `function createAdder(x) {
  return function(y) {
    return x * y;
  };
}
const calc = createAdder(${initialVal});
console.log(calc(${multiplier}));`,
    options: [`${finalAns}`, `${initialVal}`, `${multiplier}`, 'NaN'],
    correctAnswer: `${finalAns}`,
    explanation: `The returned closure captures \`x = ${initialVal}\` in its scope. Calling \`calc(${multiplier})\` computes ${initialVal} × ${multiplier} = ${finalAns}.`,
    difficulty: 2,
    cognitiveTarget: 'Lexical Closure Tracing'
  };
};

export const generateProceduralReasoningItem = (): ExerciseItem => {
  const subjects = ['Alpha', 'Beta', 'Gamma', 'Delta'];
  const subj1 = subjects[Math.floor(Math.random() * subjects.length)];
  const subj2 = subjects.filter((s) => s !== subj1)[Math.floor(Math.random() * 3)];
  
  return {
    id: `proc-reason-${Date.now()}`,
    category: 'reasoning',
    type: 'syllogistic_deduction',
    title: 'Procedural Syllogism Audit',
    prompt: `Premise 1: All ${subj1} processes require deterministic synchronization.\nPremise 2: Task X is a ${subj1} process.\n\nWhich conclusion MUST logically follow?`,
    options: [
      `Task X requires deterministic synchronization.`,
      `Task X runs faster than ${subj2} processes.`,
      `All deterministic processes are ${subj1} processes.`,
      `Task X will never fail runtime validation.`
    ],
    correctAnswer: `Task X requires deterministic synchronization.`,
    explanation: `Universal instantiation: since all ${subj1} processes require deterministic synchronization and Task X is a ${subj1} process, Task X must require deterministic synchronization.`,
    difficulty: 2,
    cognitiveTarget: 'Deductive Syllogistic Inference'
  };
};

export const generateProceduralMemoryItem = (): ExerciseItem => {
  const words = ['KUBERNETES', 'DOCKER', 'POSTGRES', 'REDIS', 'GRAPHQL', 'TERRAFORM'];
  const chosen = words.sort(() => 0.5 - Math.random()).slice(0, 3);
  const target = chosen[1];

  return {
    id: `proc-mem-${Date.now()}`,
    category: 'memory',
    type: 'paired_associates',
    title: 'Procedural Sequence Memory Rep',
    prompt: `Recall the 2nd item in this technical stack sequence: [${chosen.join(' → ')}]`,
    options: [chosen[1], chosen[0], chosen[2], 'NGINX'],
    correctAnswer: target,
    explanation: `The 2nd item in the sequence [${chosen.join(' → ')}] is ${target}.`,
    difficulty: 2,
    cognitiveTarget: 'Phonological Working Memory Order'
  };
};

export const generateProceduralReadingItem = (): ExerciseItem => {
  return {
    id: `proc-read-${Date.now()}`,
    category: 'reading',
    type: 'unspoken_assumption',
    title: 'Procedural Critical Assumption Detector',
    prompt: 'Claim: "Implementing distributed caching reduced server database CPU load by 40%."\n\nWhat unstated assumption is necessary for this claim to hold?',
    options: [
      'Cache read hits bypassed repeated expensive database query execution.',
      'The database engine was upgraded to PostgreSQL 16.',
      'All database tables were fully indexed before deployment.',
      'The server was migrated to a faster ARM processor.'
    ],
    correctAnswer: 'Cache read hits bypassed repeated expensive database query execution.',
    explanation: 'For a cache to reduce DB CPU load, the cached queries must actually bypass DB processing via cache hit interception.',
    difficulty: 3,
    cognitiveTarget: 'Unstated Assumption Identification'
  };
};

