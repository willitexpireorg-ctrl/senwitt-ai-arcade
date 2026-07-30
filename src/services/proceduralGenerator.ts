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
