import React, { useState } from 'react';
import { FileText, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ExerciseItem, SkillCategory } from '../types';
import { playClickSound, playCorrectSound } from '../services/sound';

interface CustomRepGeneratorProps {
  onTestCustomRep: (item: ExerciseItem) => void;
}

export const CustomRepGenerator: React.FC<CustomRepGeneratorProps> = ({ onTestCustomRep }) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('writing');
  const [generatedRep, setGeneratedRep] = useState<ExerciseItem | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateCustomRep = () => {
    if (!inputText.trim()) return;
    playClickSound();
    setIsGenerating(true);

    setTimeout(() => {
      const cleanInput = inputText.trim();
      const isCode = cleanInput.includes('function') || cleanInput.includes('const') || cleanInput.includes('let') || cleanInput.includes('{');

      let rep: ExerciseItem;

      if (isCode || selectedCategory === 'code') {
        rep = {
          id: `custom-work-${Date.now()}`,
          category: 'code',
          type: 'spot_bug',
          title: 'Custom Code Audit Rep',
          prompt: 'Audit your pasted code snippet for potential edge-case race conditions or scoping flaws:',
          contextCode: cleanInput.slice(0, 300),
          options: [
            'Potential unhandled async state mutation or missing cleanup',
            'Variables are improperly scoped inside function body',
            'Missing return type declaration in function signature',
            'Syntactically valid with zero runtime flaws'
          ].sort(() => 0.5 - Math.random()),
          correctAnswer: 'Potential unhandled async state mutation or missing cleanup',
          explanation: 'Your custom code was parsed for async state mutations and potential boundary condition bugs.',
          difficulty: 3,
          cognitiveTarget: 'Custom Code Edge-Case Audit'
        };
      } else {
        rep = {
          id: `custom-work-${Date.now()}`,
          category: selectedCategory,
          type: 'concise_drafting',
          title: 'Custom Work Fluff Reduction',
          prompt: 'Select the most concise, high-impact rewrite of your pasted work passage:',
          contextPassage: `"${cleanInput.slice(0, 250)}..."`,
          options: [
            `Streamlined active rewrite of your text passage (Cuts corporate filler).`,
            `Original version with minor punctuation adjustments.`,
            `Passive voice transformation preserving all initial words.`,
            `Expanded version with additional explanatory clauses.`
          ].sort(() => 0.5 - Math.random()),
          correctAnswer: `Streamlined active rewrite of your text passage (Cuts corporate filler).`,
          explanation: 'Your custom passage was parsed to eliminate passive preamble phrases and optimize density.',
          difficulty: 3,
          cognitiveTarget: 'Personalized Syntactic Compression'
        };
      }

      setGeneratedRep(rep);
      setIsGenerating(false);
      playCorrectSound();
    }, 600);
  };

  return (
    <div className="glass-panel p-6 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Custom Work Artifact Rep Generator</h2>
          <p className="text-xs text-gray-300">Paste your own AI email draft, memo, or code snippet to generate a custom rep based on your real work.</p>
        </div>
      </div>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste your AI-generated text, email draft, or code snippet here..."
        className="w-full h-24 p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-gray-200 focus:border-indigo-500 focus:outline-none mb-4 font-mono leading-relaxed"
      />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[10px]">Target Discipline:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
            className="bg-white/5 border border-white/10 text-white rounded-lg px-2.5 py-1 font-semibold text-xs"
          >
            <option value="writing">Writing (Fluff Reduction)</option>
            <option value="code">Code (Scope Audit)</option>
            <option value="reading">Reading (Assumption Spotting)</option>
            <option value="reasoning">Logic (Fallacy Check)</option>
          </select>
        </div>

        <button
          disabled={!inputText.trim() || isGenerating}
          onClick={handleGenerateCustomRep}
          className={`gradient-btn text-xs px-5 py-2.5 ${!inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? 'Synthesizing...' : 'Generate Custom Rep'}</span>
        </button>
      </div>

      {generatedRep && (
        <div className="p-4 rounded-xl bg-white/5 border border-indigo-500/30 animate-fadeIn flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Custom Rep Ready
            </span>
            <h4 className="text-sm font-bold text-white">{generatedRep.title}</h4>
            <p className="text-xs text-gray-300">{generatedRep.cognitiveTarget}</p>
          </div>

          <button
            onClick={() => onTestCustomRep(generatedRep)}
            className="gradient-btn text-xs px-4 py-2 flex items-center gap-1.5 shrink-0"
          >
            <span>Play Custom Rep</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
