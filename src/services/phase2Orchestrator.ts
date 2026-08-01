import { IRTAdaptiveEngine } from './irtAdaptiveEngine';
import type { IRTAbilityProfile } from './irtAdaptiveEngine';
import { VoiceFluencyEngine } from './voiceFluencyEngine';
import type { VoiceDrillResult } from './voiceFluencyEngine';
import type { ExerciseItem } from '../types';

const defaultProfile = (initialTheta: number = 0.2): IRTAbilityProfile => ({
  theta: initialTheta,
  glickoRating: 1500 + Math.round(300 * initialTheta),
  ratingDeviation: 120,
  flowStateTarget: 0.82,
});

export class Phase2MultiAgentOrchestrator {
  private abilityProfile: IRTAbilityProfile;

  constructor(initial?: number | IRTAbilityProfile) {
    if (typeof initial === 'object' && initial !== null) {
      this.abilityProfile = { ...defaultProfile(), ...initial };
    } else {
      this.abilityProfile = defaultProfile(typeof initial === 'number' ? initial : 0.2);
    }
  }

  /**
   * Returns current ability profile
   */
  getAbilityProfile(): IRTAbilityProfile {
    return this.abilityProfile;
  }

  setAbilityProfile(profile: IRTAbilityProfile): void {
    this.abilityProfile = { ...profile };
  }

  /**
   * Agent 1: IRT Adaptive Calibration Step
   */
  processRepResult(
    isCorrect: boolean,
    timeSpentMs: number,
    itemDifficulty: number = 0
  ): IRTAbilityProfile {
    this.abilityProfile = IRTAdaptiveEngine.calibrateAbilityAfterRep(
      this.abilityProfile,
      isCorrect,
      timeSpentMs,
      15000,
      itemDifficulty
    );
    return this.abilityProfile;
  }

  /**
   * Agent 2: Flow-State Queue Calibration Step
   */
  filterQueueForOptimalFlow(items: ExerciseItem[]): ExerciseItem[] {
    const recommendedTier = IRTAdaptiveEngine.getRecommendedDifficultyTier(this.abilityProfile.theta);
    
    // Sort and filter items to match recommended tier
    return items.sort((a, b) => {
      const diffA = Math.abs(a.difficulty - recommendedTier);
      const diffB = Math.abs(b.difficulty - recommendedTier);
      return diffA - diffB;
    });
  }

  /**
   * Agent 3: Voice Speech Fluency Evaluation Step
   */
  evaluateVoiceDrill(
    spokenText: string,
    durationMs: number,
    targetMaxWords: number = 10
  ): VoiceDrillResult {
    return VoiceFluencyEngine.evaluateSpokenFluency(spokenText, durationMs, targetMaxWords);
  }
}
