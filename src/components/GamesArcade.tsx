import React, { useState } from 'react';
import { Gamepad2, Play, Target, Clock, Filter, Star, Layers } from 'lucide-react';
import { ResearchAgent } from '../services/researchAgent';
import type { GameSpec } from '../services/researchAgent';
import { playClickSound } from '../services/sound';

interface GamesArcadeProps {
  onLaunchGame: (game: GameSpec) => void;
}

export const GamesArcade: React.FC<GamesArcadeProps> = ({ onLaunchGame }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const games = ResearchAgent.get15GameSuite();

  const filteredGames = filterCategory === 'all'
    ? games
    : games.filter((g) => g.category === filterCategory);

  const categories: { label: string; value: string }[] = [
    { label: 'All 15 Games', value: 'all' },
    { label: 'Writing', value: 'writing' },
    { label: 'Math', value: 'math' },
    { label: 'Code', value: 'code' },
    { label: 'Memory', value: 'memory' },
    { label: 'Reading', value: 'reading' },
    { label: 'Reasoning', value: 'reasoning' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <Gamepad2 className="w-3.5 h-3.5" />
            15 Games • 1,500+ Unique Variations
          </div>
          <h1 className="text-3xl font-extrabold text-white">Cognitive Arcade Suite</h1>
          <p className="text-gray-400 text-sm max-w-2xl mt-1">
            Research-backed cognitive mini-games with 100+ procedural variations per game to guarantee zero repetition.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="glass-panel px-4 py-3 border-violet-500/30 flex items-center gap-3">
          <Layers className="w-5 h-5 text-violet-400" />
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Variations Engine</span>
            <span className="text-lg font-bold text-white">1,500+ Exercises</span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 max-w-max">
        <Filter className="w-4 h-4 text-gray-400 ml-2 mr-1" />
        {categories.map((cat) => {
          const isSelected = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => {
                playClickSound();
                setFilterCategory(cat.value);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 15 Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
        {filteredGames.map((game, idx) => (
          <div
            key={game.id}
            onMouseMove={(e) => {
              const card = e.currentTarget;
              const rect = card.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              card.style.transform = `perspective(1000px) rotateX(${-y / 25}deg) rotateY(${x / 25}deg) scale3d(1.02, 1.02, 1.02)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            }}
            className="glass-panel p-6 border-white/10 hover:border-indigo-500/50 bg-gradient-to-br from-indigo-950/30 to-slate-900/60 flex flex-col justify-between group transition-all duration-200 shadow-xl relative"
          >
            <div>
              
              {/* Category & Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Game #{idx + 1} • 100+ Vars
                </span>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {game.estimatedDuration}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                {game.title}
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed mb-4">
                {game.description}
              </p>

              {/* Star Rating & Neural Target */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" /> 5 Difficulty Tiers
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">100+ Variations</span>
                </div>
                <div className="flex items-center gap-1.5 text-violet-300 font-semibold pt-1 border-t border-white/5">
                  <Target className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>Target: {game.neuralTarget}</span>
                </div>
              </div>

            </div>

            {/* Launch Button */}
            <button
              onClick={() => {
                playClickSound();
                onLaunchGame(game);
              }}
              className="w-full py-3 rounded-xl font-heading font-semibold text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play {game.title} (100+ Vars)</span>
            </button>

          </div>
        ))}
      </div>

    </div>
  );
};
