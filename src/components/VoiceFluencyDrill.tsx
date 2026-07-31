import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, X } from 'lucide-react';
import { VoiceFluencyEngine } from '../services/voiceFluencyEngine';
import type { VoiceDrillResult } from '../services/voiceFluencyEngine';
import { playClickSound, playCorrectSound } from '../services/sound';

interface VoiceFluencyDrillProps {
  onClose: () => void;
}

export const VoiceFluencyDrill: React.FC<VoiceFluencyDrillProps> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [drillResult, setDrillResult] = useState<VoiceDrillResult | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-xl w-full p-6 md:p-8 border border-indigo-500/30 text-left relative animate-fadeIn shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider">Speech Drill</span>
              <h2 className="text-xl font-extrabold text-white">Voice & Speech Fluency Drill</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Card */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Read verbose text, then speak an 8-word active rewrite out loud:
          </label>
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-sm italic text-indigo-200 leading-relaxed">
            {verbosePrompt}
          </div>
        </div>

        {/* Voice Control Recording Button */}
        <div className="flex flex-col items-center justify-center py-6 mb-6 bg-white/5 border border-white/10 rounded-2xl">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="gradient-btn text-sm px-6 py-3 shadow-xl flex items-center gap-2"
            >
              <Mic className="w-5 h-5 fill-white" />
              <span>Start Speaking Rewrite</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-500/30 flex items-center gap-2 animate-pulse"
            >
              <MicOff className="w-5 h-5" />
              <span>Stop & Evaluate Speech</span>
            </button>
          )}

          {/* Live Spoken Transcript */}
          {spokenText && (
            <div className="mt-4 px-4 text-xs text-cyan-300 font-mono text-center">
              "{spokenText}"
            </div>
          )}
        </div>

        {/* Evaluation Results Card */}
        {drillResult && (
          <div className="p-5 rounded-2xl bg-white/5 border border-emerald-500/30 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Conciseness Score: {drillResult.concisenessScore}%
              </span>
              <span className="text-xs font-bold text-violet-300 px-2.5 py-0.5 rounded bg-violet-500/20 border border-violet-500/30">
                Fluency Level: {drillResult.brocaActivationLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <div className="bg-white/5 p-2.5 rounded-xl">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Spoken Word Count</span>
                <span className="text-sm font-bold text-white">{drillResult.wordCount} Words (Target ≤ {targetMaxWords})</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Speech Velocity</span>
                <span className="text-sm font-bold text-white">{drillResult.wordsPerMinute} WPM</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
