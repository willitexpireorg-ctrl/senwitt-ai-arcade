export interface VoiceDrillResult {
  transcript: string;
  wordCount: number;
  spokenDurationSec: number;
  wordsPerMinute: number;
  concisenessScore: number;
  brocaActivationLevel: 'Optimal' | 'High' | 'Moderate';
}

export class VoiceFluencyEngine {
  
  /**
   * Evaluates spoken transcript conciseness against a target word count budget
   */
  static evaluateSpokenFluency(
    transcript: string,
    spokenDurationMs: number,
    targetMaxWords: number = 10
  ): VoiceDrillResult {
    const cleanWords = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = cleanWords.length;
    const spokenDurationSec = Math.max(1, Math.round(spokenDurationMs / 1000));
    const wordsPerMinute = Math.round((wordCount / spokenDurationSec) * 60);

    // Conciseness Penalty: Max points if within target word count budget
    let concisenessScore = 100;
    if (wordCount > targetMaxWords) {
      concisenessScore = Math.max(20, 100 - (wordCount - targetMaxWords) * 12);
    } else if (wordCount === 0) {
      concisenessScore = 0;
    }

    let brocaActivationLevel: 'Optimal' | 'High' | 'Moderate' = 'Optimal';
    if (concisenessScore >= 85) {
      brocaActivationLevel = 'Optimal';
    } else if (concisenessScore >= 60) {
      brocaActivationLevel = 'High';
    } else {
      brocaActivationLevel = 'Moderate';
    }

    return {
      transcript,
      wordCount,
      spokenDurationSec,
      wordsPerMinute,
      concisenessScore: Math.round(concisenessScore),
      brocaActivationLevel
    };
  }

  /**
   * Helper: Check Web Speech API browser support
   */
  static isWebSpeechSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }
}
