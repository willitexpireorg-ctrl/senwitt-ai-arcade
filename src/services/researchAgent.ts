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
  mechanicType: 'visual_grid' | 'choice_quiz' | 'dual_nback' | 'stroop' | 'logic_deduction' | 'voice_drill';
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
    ];
  }
}
