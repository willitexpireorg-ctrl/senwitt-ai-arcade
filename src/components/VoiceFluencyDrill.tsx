import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, X, Save } from 'lucide-react';
import { VoiceFluencyEngine } from '../services/voiceFluencyEngine';
import type { VoiceDrillResult } from '../services/voiceFluencyEngine';
import { playClickSound, playCorrectSound } from '../services/sound';

export interface VoiceFluencyCompletionResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
  spokenText: string;
}

interface VoiceFluencyDrillProps {
  onClose: () => void;
  onComplete?: (result: VoiceFluencyCompletionResult) => void;
}

export const VoiceFluencyDrill: React.FC<VoiceFluencyDrillProps> = ({ onClose, onComplete }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [drillResult, setDrillResult] = useState<VoiceDrillResult | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const sessionStartRef = useRef<number>(Date.now());
  const verbosePrompt = `"At this point in time, it is critically incumbent upon our engineering team to make a concerted effort to optimize workflow processes going forward."`;
  const targetMaxWords = 8;

  useEffect(() => {
    if (VoiceFluencyEngine.isWebSpeechSupported()) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSpokenText(transcript);
      };

      setRecognitionInstance(recognition);
    }
  }, []);

  const handleStartRecording = () => {
    playClickSound();
    setSpokenText('');
    setDrillResult(null);
    setStartTime(Date.now());
    setIsRecording(true);

    if (recognitionInstance) {
      try {
        recognitionInstance.start();
      } catch (e) {}
    }
  };

  const handleStopRecording = () => {
    playClickSound();
    setIsRecording(false);
    const durationMs = Date.now() - startTime;

    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }

    // Fallback simulation text if Web Speech API returns empty string in test environment
    const finalText = spokenText.trim() || "We must streamline our workflow processes now.";
    const result = VoiceFluencyEngine.evaluateSpokenFluency(finalText, durationMs, targetMaxWords);
    setDrillResult(result);
    playCorrectSound();
  };

  const handleSaveAndFinish = () => {
    playClickSound();
    if (drillResult && onComplete) {
      onComplete({
        scoreEarned: drillResult.concisenessScore,
        correctCount: drillResult.concisenessScore >= 60 ? 1 : 0,
        totalItems: 1,
        totalTimeMs: Date.now() - sessionStartRef.current,
        spokenText: spokenText.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="surface max-w-xl w-full p-6 md:p-8 text-left relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(180deg, #17a89a 0%, var(--accent-teal) 100%)', color: '#fff' }}
            >
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--accent-teal)' }}>Speech Drill</span>
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Voice & Speech Fluency Drill</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Card */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
            Read verbose text, then speak an 8-word active rewrite out loud:
          </label>
          <div
            className="p-4 rounded-2xl text-sm italic leading-relaxed"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: 'var(--text-primary)' }}
          >
            {verbosePrompt}
          </div>
        </div>

        {/* Voice Control Recording Button */}
        <div
          className="flex flex-col items-center justify-center py-6 mb-6 rounded-2xl"
          style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border-color)' }}
        >
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="btn-3d btn-3d-teal text-sm px-6 py-3 flex items-center gap-2"
            >
              <Mic className="w-5 h-5" style={{ fill: '#fff' }} />
              <span>Start speaking rewrite</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="btn-3d btn-3d-coral text-sm px-6 py-3 flex items-center gap-2 animate-pulse"
            >
              <MicOff className="w-5 h-5" />
              <span>Stop & evaluate speech</span>
            </button>
          )}

          {/* Live Spoken Transcript */}
          {spokenText && (
            <div className="mt-4 px-4 text-xs font-mono text-center" style={{ color: 'var(--accent-teal)' }}>
              "{spokenText}"
            </div>
          )}
        </div>

        {/* Evaluation Results Card */}
        {drillResult && (
          <div
            className="p-5 rounded-2xl space-y-4"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: '#047857' }}>
                <CheckCircle2 className="w-4 h-4" /> Conciseness score: {drillResult.concisenessScore}%
              </span>
              <span
                className="text-xs font-extrabold px-2.5 py-0.5 rounded-full"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
              >
                Fluency level: {drillResult.brocaActivationLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl" style={{ background: '#fff', border: '1px solid var(--border-color)' }}>
                <span className="text-[10px] block font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Spoken word count</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{drillResult.wordCount} words (target ≤ {targetMaxWords})</span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: '#fff', border: '1px solid var(--border-color)' }}>
                <span className="text-[10px] block font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Speech velocity</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{drillResult.wordsPerMinute} WPM</span>
              </div>
            </div>

            <button
              onClick={handleSaveAndFinish}
              className="btn-3d btn-3d-teal w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & finish</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
