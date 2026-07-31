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
  mechanicType: 'visual_grid' | 'choice_quiz' | 'sequence_memory' | 'math_solver' | 'dual_nback' | 'stroop' | 'logic_deduction';
}

export class ResearchAgent {
  static get15GameSuite(): GameSpec[] {
    return [
      {
        id: 'game-1',
        title: 'Spatial Memory Grid',
        category: 'memory',
        description: 'Memorize and recall illuminated 3x3/4x4 grid tile sequences.',
        scientificRationale: 'Exercises visuospatial scratchpad working memory capacity.',
        neuralTarget: 'Right Parietal Cortex & Hippocampus',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'visual_grid'
      },
      {
        id: 'game-16',
        title: 'Dual N-Back Working Memory',
        category: 'memory',
        description: 'Compare current visual grid position and audio letter to N steps back.',
        scientificRationale: 'Gold-standard fluid intelligence and working memory updating task.',
        neuralTarget: 'Dorsolateral Prefrontal Cortex & Basal Ganglia',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'dual_nback'
      },
      {
        id: 'game-17',
        title: 'Stroop Executive Speed',
        category: 'reasoning',
        description: 'Inhibit reading automaticity to rapidly select font ink color.',
        scientificRationale: 'Trains response inhibition and cognitive conflict resolution.',
        neuralTarget: 'Anterior Cingulate Cortex & Pre-SMA',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'stroop'
      },
      {
        id: 'game-18',
        title: 'Syllogism Logic Deduction',
        category: 'reasoning',
        description: 'Derive necessary conclusions from multi-premise formal logic statements.',
        scientificRationale: 'Exercises deductive validity checking and logical reasoning.',
        neuralTarget: 'Left Inferior Frontal Gyrus',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'logic_deduction'
      },
      {
        id: 'game-2',
        title: 'Symbolic System Solver',
        category: 'math',
        description: 'Solve multi-variable emoji equation systems.',
        scientificRationale: 'Trains working memory substitution and symbolic algebraic reasoning.',
        neuralTarget: 'Prefrontal & Intraparietal Sulcus',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'math_solver'
      },
      {
        id: 'game-3',
        title: 'Fermi Scale Estimator',
        category: 'math',
        description: 'Rapid order-of-magnitude (10^N) scale matching for real-world estimates.',
        scientificRationale: 'Strengthens numerical magnitude estimation and logarithmic scale intuition.',
        neuralTarget: 'Bilateral Parietal Lobe',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-4',
        title: 'Closure Scope Tracer',
        category: 'code',
        description: 'Mentally trace JavaScript closure execution and variable scope bindings.',
        scientificRationale: 'Maintains mental simulation execution of abstract control flow.',
        neuralTarget: 'Left Frontoparietal Network',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-5',
        title: 'Async Race Condition Spotter',
        category: 'code',
        description: 'Audit asynchronous lifecycle code for race conditions and unmounted state updates.',
        scientificRationale: 'Exercises edge-case failure mode reasoning under temporal uncertainty.',
        neuralTarget: 'Dorsolateral Prefrontal Cortex',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-6',
        title: 'AI Fluff Cutter',
        category: 'writing',
        description: 'Strip corporate jargon and AI wordiness to convert passive text into active precision.',
        scientificRationale: 'Combats cognitive offloading in writing by training syntactic compression.',
        neuralTarget: 'Broca Area & Inferior Frontal Gyrus',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-7',
        title: 'Nuanced Lexicon Audit',
        category: 'writing',
        description: 'Match precise vocabulary terms to argument flaws and subtle definitions.',
        scientificRationale: 'Enhances semantic precision and active vocabulary retrieval.',
        neuralTarget: 'Wernicke Area & Temporal Lobe',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-8',
        title: 'Syntactic Compressor',
        category: 'writing',
        description: 'Combine multiple complex clauses into one elegant, modifier-safe sentence.',
        scientificRationale: 'Develops structural syntax manipulation and grammatical working memory.',
        neuralTarget: 'Left Superior Temporal Gyrus',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-9',
        title: 'Formal Fallacy Detector',
        category: 'reasoning',
        description: 'Identify formal fallacies like Ad Hominem, Strawman, and Affirming the Consequent.',
        scientificRationale: 'Sharpens deductive logic validation and flaw spotting in arguments.',
        neuralTarget: 'Anterior Cingulate Cortex',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-10',
        title: 'Unstated Assumption Extractor',
        category: 'reading',
        description: 'Uncover hidden, unstated premises required for written claims to hold true.',
        scientificRationale: 'Protects critical reading ability against AI-generated overclaims.',
        neuralTarget: 'Medial Prefrontal Cortex',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-11',
        title: 'Paired Associates Matrix',
        category: 'memory',
        description: 'Recall architectural term pairs after a 5-second study window.',
        scientificRationale: 'Exercises associative episodic memory encoding and retrieval.',
        neuralTarget: 'Hippocampal Formation & Entorhinal Cortex',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'sequence_memory'
      },
      {
        id: 'game-12',
        title: 'Sequence Chain Recall',
        category: 'memory',
        description: 'Remember and order multi-step technical item sequences.',
        scientificRationale: 'Strengthens phonological loop and serial order working memory.',
        neuralTarget: 'Left Parietal & Premotor Cortex',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'sequence_memory'
      },
      {
        id: 'game-13',
        title: 'Speed Inference Matcher',
        category: 'reading',
        description: 'Verify fact vs. unstated implication in rapid passage reading.',
        scientificRationale: 'Enhances rapid reading comprehension and semantic verification speed.',
        neuralTarget: 'Occipitotemporal Reading Network',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '2 Mins',
        mechanicType: 'choice_quiz'
      },
      {
        id: 'game-14',
        title: 'Compound Percentage Adjuster',
        category: 'math',
        description: 'Calculate compounded percentage increases, decreases, and net load efficiency.',
        scientificRationale: 'Improves mental arithmetic compounding and multi-step math.',
        neuralTarget: 'Frontoparietal Math Loop',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'math_solver'
      },
      {
        id: 'game-15',
        title: 'Counterfactual Deduction Grid',
        category: 'reasoning',
        description: 'Solve multi-constraint truth table deduction puzzles under hypothetical rules.',
        scientificRationale: 'Develops counterfactual reasoning and formal logic matrix deduction.',
        neuralTarget: 'Bilateral Prefrontal & Parietal Cortex',
        difficultyRange: 'Tier 1-5',
        estimatedDuration: '3 Mins',
        mechanicType: 'choice_quiz'
      }
    ];
  }
}
