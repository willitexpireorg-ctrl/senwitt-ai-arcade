export interface IRTAbilityProfile {
  theta: number; // Latent cognitive ability (-3.0 to +3.0)
  glickoRating: number; // Glicko-2 scale rating (800 to 2400)
  ratingDeviation: number; // Uncertainty (RD: 30 to 350)
  flowStateTarget: number; // Target success rate (default 0.82)
}

export class IRTAdaptiveEngine {
  
  /**
   * 2-Parameter Logistic (2PL) IRT probability function:
   * P(theta) = 1 / (1 + exp(-a * (theta - b)))
   */
  static calculateSuccessProbability(
    theta: number,
    itemDifficulty: number,
    discrimination: number = 1.2
  ): number {
    const val = -discrimination * (theta - itemDifficulty);
    return 1 / (1 + Math.exp(val));
  }

  /**
   * Calibrates latent ability (theta) and Glicko rating based on response accuracy & latency
   */
  static calibrateAbilityAfterRep(
    profile: IRTAbilityProfile,
    isCorrect: boolean,
    timeSpentMs: number,
    targetTimeMs: number = 15000,
    itemDifficulty: number = 0
  ): IRTAbilityProfile {
    const speedRatio = Math.min(2.0, Math.max(0.3, targetTimeMs / Math.max(1000, timeSpentMs)));
    
    // Performance factor combining accuracy & response speed
    const perfFactor = isCorrect ? 1.0 * (0.8 + speedRatio * 0.2) : -0.8;

    // Latent ability update (Newton-Raphson step approximation)
    const learningRate = Math.max(0.05, profile.ratingDeviation / 1000);
    const expectedP = this.calculateSuccessProbability(profile.theta, itemDifficulty);
    const thetaDelta = learningRate * (perfFactor - expectedP);
    
    const nextTheta = Math.min(3.0, Math.max(-3.0, profile.theta + thetaDelta));
    
    // Glicko rating scaling: Rating = 1500 + 300 * theta
    const nextGlicko = Math.round(1500 + 300 * nextTheta);
    const nextRD = Math.max(35, Math.round(profile.ratingDeviation * 0.96));

    return {
      theta: Number(nextTheta.toFixed(3)),
      glickoRating: nextGlicko,
      ratingDeviation: nextRD,
      flowStateTarget: 0.82
    };
  }

  /**
   * Recommends optimal item difficulty level (1-5 star tier) to maintain Flow State
   */
  static getRecommendedDifficultyTier(theta: number): 1 | 2 | 3 | 4 | 5 {
    if (theta < -1.2) return 1;
    if (theta < -0.4) return 2;
    if (theta < 0.4) return 3;
    if (theta < 1.2) return 4;
    return 5;
  }
}
