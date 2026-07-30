import React, { useState } from 'react';
import { Bot, Sparkles, Play, PlusCircle, CheckCircle2, Terminal, Cpu, RefreshCw } from 'lucide-react';
import type { ExerciseItem, SkillCategory } from '../types';
import { WritingAgent, MathAgent, CodeAgent, MemoryAgent, ReadingAgent, ReasoningAgent } from '../services/exerciseAgents';
import { playClickSound, playCorrectSound, playFanfareSound } from '../services/sound';

interface AgentGeneratorStudioProps {
  onInjectExercises: (newItems: ExerciseItem[]) => void;
  onTestExercise: (item: ExerciseItem) => void;
}

export const AgentGeneratorStudio: React.FC<AgentGeneratorStudioProps> = ({
  onInjectExercises,
  onTestExercise,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('writing');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [generatedItems, setGeneratedItems] = useState<ExerciseItem[]>([]);
  const [totalCreated, setTotalCreated] = useState<number>(0);

  const handleRunAgent = () => {
    playClickSound();
    setIsGenerating(true);
    setLogs([]);
    setGeneratedItems([]);

    const agentNames: Record<SkillCategory, string> = {
      writing: 'Writing & Syntactic Agent',
      math: 'Fermi Math & Scale Agent',
      code: 'Scope & Concurrency Code Agent',
      memory: 'Paired Associative Memory Agent',
      reading: 'Critical Inference & Reading Agent',
      reasoning: 'Formal Logic & Fallacy Agent',
    };

    const name = agentNames[selectedCategory];

    // Simulated multi-step agent reasoning logs
    const logSteps = [
      `[SYS] Initializing ${name} orchestration engine...`,
      `[TAXONOMY] Analyzing cognitive target parameters for ${selectedCategory.toUpperCase()} discipline...`,
      `[SYNTHESIS] Formulating distractor options & difficulty tiers 1 through 5...`,
      `[AUDIT] Validating single-answer grounding & rationale explanations...`,
      `[COMPLETE] Successfully synthesized ${batchCount} fresh cognitive exercise reps!`
    ];

    logSteps.forEach((step, idx) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step]);
        playClickSound();

        if (idx === logSteps.length - 1) {
          // Generate reps using domain agent
          let reps: ExerciseItem[] = [];
          if (selectedCategory === 'writing') reps = WritingAgent.generateReps(batchCount);
          if (selectedCategory === 'math') reps = MathAgent.generateReps(batchCount);
          if (selectedCategory === 'code') reps = CodeAgent.generateReps(batchCount);
          if (selectedCategory === 'memory') reps = MemoryAgent.generateReps(batchCount);
          if (selectedCategory === 'reading') reps = ReadingAgent.generateReps(batchCount);
          if (selectedCategory === 'reasoning') reps = ReasoningAgent.generateReps(batchCount);

          setGeneratedItems(reps);
          setIsGenerating(false);
          playCorrectSound();
        }
      }, (idx + 1) * 400);
    });
  };

  const handleInjectAll = () => {
    if (generatedItems.length === 0) return;
    playFanfareSound();
    onInjectExercises(generatedItems);
    setTotalCreated((prev) => prev + generatedItems.length);
    setGeneratedItems([]);
    setLogs((prev) => [...prev, `[DATABASE] Injected ${generatedItems.length} reps into active exercise bank!`]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Studio Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider mb-2 border border-violet-500/30">
            <Bot className="w-3.5 h-3.5" />
            AI Subagent Generation Studio
          </div>
          <h1 className="text-3xl font-extrabold text-white">Dynamic Exercise Agent Studio</h1>
          <p className="text-gray-400 text-sm max-w-2xl mt-1">
            Dispatch domain-specialized AI subagents to author fresh cognitive exercise reps on demand for Writing, Math, Code, Memory, Reading, and Reasoning.
          </p>
        </div>

        {/* Counter Pill */}
        <div className="glass-panel px-4 py-3 border-indigo-500/30 flex items-center gap-3">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Reps Synthesized</span>
            <span className="text-lg font-bold text-white">+{totalCreated} New Reps</span>
          </div>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Agent Config Column */}
        <div className="glass-panel p-6 border-indigo-500/30 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Select Domain Agent
          </h2>

          <div className="space-y-2">
            {(['writing', 'math', 'code', 'memory', 'reading', 'reasoning'] as SkillCategory[]).map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    playClickSound();
                    setSelectedCategory(cat);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="capitalize">{cat} Agent</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Batch Rep Count</label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setBatchCount(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    batchCount === num
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {num} Reps
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isGenerating}
            onClick={handleRunAgent}
            className={`w-full py-4 rounded-2xl font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              isGenerating
                ? 'bg-indigo-950 border border-indigo-500/30 text-indigo-300 cursor-wait'
                : 'gradient-btn shadow-xl shadow-indigo-500/30'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Agent Synthesizing...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Dispatch {selectedCategory.toUpperCase()} Agent</span>
              </>
            )}
          </button>
        </div>

        {/* Live Terminal Log & Generated Reps Preview Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Agent Output Terminal */}
          <div className="glass-panel p-5 border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 min-h-[160px] flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-gray-500 text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-gray-300">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Domain Agent Output Console
              </span>
              <span>Status: {isGenerating ? 'Active' : 'Idle'}</span>
            </div>

            <div className="space-y-1.5 my-3 overflow-y-auto max-h-[140px]">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">// Click "Dispatch Agent" to begin real-time exercise synthesis...</p>
              ) : (
                logs.map((log, idx) => <p key={idx} className="animate-fadeIn">{log}</p>)
              )}
            </div>
          </div>

          {/* Generated Reps Grid */}
          {generatedItems.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Synthesized Reps ({generatedItems.length})
                </h3>

                <button
                  onClick={handleInjectAll}
                  className="gradient-btn text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Inject All to Bank</span>
                </button>
              </div>

              <div className="space-y-3">
                {generatedItems.map((item, idx) => (
                  <div key={idx} className="glass-panel p-4 border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.category} • Tier {item.difficulty}
                        </span>
                        <span className="text-xs font-bold text-white">{item.title}</span>
                      </div>
                      <p className="text-xs text-gray-300 truncate max-w-lg">{item.prompt}</p>
                    </div>

                    <button
                      onClick={() => onTestExercise(item)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 shrink-0 flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Test Rep</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
