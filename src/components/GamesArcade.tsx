import React, { useMemo, useState } from 'react';
import {
  Gamepad2, Play, Target, Clock, LayoutGrid, Layers, Palette,
  Scale, Mic, PenLine, Calculator, Code2, BookSearch, Brain,
  FileText, MessageSquareText, Percent, Scissors, ShoppingCart, ListOrdered, Zap,
  GitCompare, ScanSearch, Shuffle, Sparkles, BookA, MessageCircle,
  TrainFront, Waypoints, Lock,
  type LucideIcon,
} from 'lucide-react';
import { ResearchAgent } from '../services/researchAgent';
import type { GameSpec } from '../services/researchAgent';
import type { BaselinePriority, SkillCategory, UserProgress } from '../types';
import { playClickSound } from '../services/sound';

interface GamesArcadeProps {
  onLaunchGame: (game: GameSpec) => void;
  progress?: UserProgress;
  /** SENWITT Phase 2: free tier only gets the 3 recommended games unlocked. */
  isPremium?: boolean;
  /** Opens the upgrade modal — called instead of launching a locked game. */
  onRequestUpgrade?: () => void;
}

const BASELINE_TO_CATEGORY: Record<BaselinePriority, SkillCategory> = {
  focus: 'reasoning',
  recall: 'memory',
  communication: 'writing',
  numbers: 'math',
};

/** Prefer games matching weakest baseline areas / lowest skill scores (Hick: curated shortlist). */
function pickRecommendedGames(games: GameSpec[], progress?: UserProgress, limit = 3): GameSpec[] {
  if (!progress) return games.slice(0, limit);

  const preferredCategories: SkillCategory[] = [];
  const priorities = progress.baselineProfile?.priorities;
  if (priorities?.length) {
    for (const p of priorities) {
      preferredCategories.push(BASELINE_TO_CATEGORY[p]);
    }
  }
  const skillSorted = (Object.entries(progress.skills) as [SkillCategory, { score: number }][])
    .sort((a, b) => a[1].score - b[1].score)
    .map(([cat]) => cat);
  for (const cat of skillSorted) {
    if (!preferredCategories.includes(cat)) preferredCategories.push(cat);
  }

  const picked: GameSpec[] = [];
  const used = new Set<string>();
  for (const cat of preferredCategories) {
    const match = games.find((g) => g.category === cat && !used.has(g.id));
    if (match) {
      picked.push(match);
      used.add(match.id);
    }
    if (picked.length >= limit) break;
  }
  for (const g of games) {
    if (picked.length >= limit) break;
    if (!used.has(g.id)) {
      picked.push(g);
      used.add(g.id);
    }
  }
  return picked;
}

const CATEGORY_STYLES: Record<string, {
  soft: string;
  ink: string;
  badgeClass: string;
  btnClass: string;
}> = {
  writing: {
    soft: '#e0f2fe',
    ink: '#0369a1',
    badgeClass: 'badge-writing',
    btnClass: 'btn-3d-cyan',
  },
  math: {
    soft: '#ccfbf1',
    ink: '#0f766e',
    badgeClass: 'badge-math',
    btnClass: 'btn-3d-teal',
  },
  code: {
    soft: '#d1fae5',
    ink: '#047857',
    badgeClass: 'badge-code',
    btnClass: 'btn-3d-emerald',
  },
  memory: {
    soft: '#cffafe',
    ink: '#0e7490',
    badgeClass: 'badge-memory',
    btnClass: 'btn-3d-cyan',
  },
  reading: {
    soft: '#fef3c7',
    ink: '#b45309',
    badgeClass: 'badge-reading',
    btnClass: 'btn-3d-amber',
  },
  reasoning: {
    soft: '#ffe4e6',
    ink: '#be123c',
    badgeClass: 'badge-reasoning',
    btnClass: 'btn-3d-rose',
  },
};

/** Per-game visual identity — every title gets a unique icon + art well. */
const GAME_VISUALS: Record<string, { icon: LucideIcon; artClass: string; label: string }> = {
  'game-spatial': {
    icon: LayoutGrid,
    artClass: 'tile-art--cyan',
    label: 'Spatial grid icon',
  },
  'game-nback': {
    icon: Layers,
    artClass: 'tile-art--teal',
    label: 'Dual n-back layers icon',
  },
  'game-stroop': {
    icon: Palette,
    artClass: 'tile-art--rose',
    label: 'Stroop color palette icon',
  },
  'game-logic': {
    icon: Scale,
    artClass: 'tile-art--amber',
    label: 'Logic scales icon',
  },
  'game-voice': {
    icon: Mic,
    artClass: 'tile-art--sky',
    label: 'Speech microphone icon',
  },
  'game-brief-recall': {
    icon: FileText,
    artClass: 'tile-art--cyan',
    label: 'Project update recall icon',
  },
  'game-clearer-sentence': {
    icon: MessageSquareText,
    artClass: 'tile-art--sky',
    label: 'Clearer sentence rewrite icon',
  },
  'game-number-sense': {
    icon: Percent,
    artClass: 'tile-art--amber',
    label: 'Number sense percent icon',
  },
  'game-brevity-cut': {
    icon: Scissors,
    artClass: 'tile-art--rose',
    label: 'Brevity cut scissors icon',
  },
  'game-quick-purchase': {
    icon: ShoppingCart,
    artClass: 'tile-art--amber',
    label: 'Quick purchase shopping cart icon',
  },
  'game-sequence-order': {
    icon: ListOrdered,
    artClass: 'tile-art--mint',
    label: 'Sequence order list icon',
  },
  'game-rsvp-reader': {
    icon: Zap,
    artClass: 'tile-art--sky',
    label: 'RSVP reader lightning icon',
  },
  'game-speed-match': {
    icon: GitCompare,
    artClass: 'tile-art--rose',
    label: 'Speed Match compare icon',
  },
  'game-signal-sweep': {
    icon: ScanSearch,
    artClass: 'tile-art--amber',
    label: 'Signal Sweep scan icon',
  },
  'game-pattern-shift': {
    icon: Shuffle,
    artClass: 'tile-art--mint',
    label: 'Pattern Shift shuffle icon',
  },
  'game-synonym-race': {
    icon: BookA,
    artClass: 'tile-art--sky',
    label: 'Synonym Race book icon',
  },
  'game-tone-pick': {
    icon: MessageCircle,
    artClass: 'tile-art--rose',
    label: 'Tone Pick message icon',
  },
  'game-focus-track': {
    icon: TrainFront,
    artClass: 'tile-art--sky',
    label: 'Focus Track train icon',
  },
  'game-route-planner': {
    icon: Waypoints,
    artClass: 'tile-art--mint',
    label: 'Route Planner waypoints icon',
  },
  'game-writing-quiz': {
    icon: PenLine,
    artClass: 'tile-art--sky',
    label: 'Writing pen icon',
  },
  'game-math-quiz': {
    icon: Calculator,
    artClass: 'tile-art--teal',
    label: 'Math calculator icon',
  },
  'game-code-quiz': {
    icon: Code2,
    artClass: 'tile-art--mint',
    label: 'Code brackets icon',
  },
  'game-reading-quiz': {
    icon: BookSearch,
    artClass: 'tile-art--amber',
    label: 'Critical reading icon',
  },
  'game-memory-quiz': {
    icon: Brain,
    artClass: 'tile-art--cyan',
    label: 'Memory challenge brain icon',
  },
};

const FALLBACK_VISUAL = {
  icon: Gamepad2,
  artClass: 'tile-art--teal',
  label: 'Game icon',
};

const LIVE_MECHANIC_TYPES = new Set([
  'visual_grid', 'dual_nback', 'stroop', 'logic_deduction', 'voice_drill',
  'brief_recall', 'clearer_sentence', 'number_sense',
  'brevity_cut', 'quick_purchase', 'sequence_order', 'rsvp_reader',
  'speed_match', 'signal_sweep', 'pattern_shift',
  'synonym_race', 'tone_pick',
  'attention_track', 'route_plan',
]);

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Writing', value: 'writing' },
  { label: 'Math', value: 'math' },
  { label: 'Code', value: 'code' },
  { label: 'Memory', value: 'memory' },
  { label: 'Reading', value: 'reading' },
  { label: 'Reasoning', value: 'reasoning' },
];

const renderGameTile = (
  game: GameSpec,
  onLaunchGame: (game: GameSpec) => void,
  opts?: { recommended?: boolean; locked?: boolean; onRequestUpgrade?: () => void },
) => {
  const style = CATEGORY_STYLES[game.category] ?? CATEGORY_STYLES.writing;
  const visual = GAME_VISUALS[game.id] ?? FALLBACK_VISUAL;
  const Icon = visual.icon;
  const isLive = LIVE_MECHANIC_TYPES.has(game.mechanicType);
  const recommended = Boolean(opts?.recommended);
  const locked = Boolean(opts?.locked);

  const handlePlay = () => {
    playClickSound();
    if (locked) {
      opts?.onRequestUpgrade?.();
      return;
    }
    onLaunchGame(game);
  };

  return (
    <article
      key={game.id}
      className="game-tile animate-fadeInUp"
      style={
        recommended
          ? {
              border: '2px solid #0f766e',
              transform: 'scale(1.02)',
              boxShadow: '0 8px 24px rgba(15, 118, 110, 0.12)',
            }
          : locked
            ? { opacity: 0.72 }
            : undefined
      }
    >
      <div className={`tile-art ${visual.artClass}`} role="img" aria-label={visual.label} style={locked ? { filter: 'grayscale(0.35)' } : undefined}>
        {locked ? <Lock className="tile-art__icon" strokeWidth={1.75} aria-hidden /> : <Icon className="tile-art__icon" strokeWidth={1.75} aria-hidden />}
      </div>

      <div className="tile-body">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${style.badgeClass}`}>
              {game.category}
            </span>
            {recommended && (
              <span
                className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full"
                style={{ background: '#ccfbf1', color: 'var(--accent-teal)', border: '1px solid #99f6e4' }}
              >
                For you
              </span>
            )}
            {locked && (
              <span
                className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                style={{ background: '#fff1ed', color: 'var(--accent-coral)', border: '1px solid #ffd4c8' }}
              >
                <Lock className="w-2.5 h-2.5" /> Premium
              </span>
            )}
            {isLive && !locked && (
              <span className="live-badge">
                <span className="live-badge__dot" />
                Live
              </span>
            )}
          </div>
          <span className="tile-meta">
            <Clock className="w-3.5 h-3.5" /> {game.estimatedDuration}
          </span>
        </div>

        <h3 className="tile-title" style={recommended ? { fontSize: '1.15rem' } : undefined}>
          {game.title}
        </h3>
        <p className="tile-desc mb-4 flex-1">{game.description}</p>

        <div className="tile-target" style={{ background: style.soft, color: style.ink }}>
          <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Target: {game.neuralTarget}</span>
        </div>

        <button
          type="button"
          onClick={handlePlay}
          className={`btn-3d ${recommended ? 'btn-3d-teal' : locked ? 'btn-3d-coral' : style.btnClass} w-full py-3.5 flex items-center justify-center gap-2 text-sm mt-4`}
        >
          {locked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" style={{ fill: 'white' }} />}
          <span>{locked ? 'Upgrade to play' : 'Play'}</span>
        </button>
      </div>
    </article>
  );
};

export const GamesArcade: React.FC<GamesArcadeProps> = ({ onLaunchGame, progress, isPremium = false, onRequestUpgrade }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const games = ResearchAgent.getGameSuite();

  const recommended = useMemo(
    () => pickRecommendedGames(games, progress, 3),
    [games, progress],
  );
  const recommendedIds = useMemo(() => new Set(recommended.map((g) => g.id)), [recommended]);
  const filteredGames = filterCategory === 'all'
    ? games
    : games.filter((g) => g.category === filterCategory);

  return (
    <div className="page-shell py-10 animate-tabSlideIn">
      <div className="section-header">
        <div className="section-pill">
          <Gamepad2 className="w-3.5 h-3.5" />
          {games.length} focused drills
        </div>
        <h1>Games</h1>
        <p>Live mini-games and short drills — pick one clear target and play.</p>
      </div>

      {!isPremium && (
        <div
          className="surface-soft p-4 flex items-start gap-3 text-xs font-semibold mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-coral)' }} />
          <p>
            Free plan includes your 3 recommended games below. Upgrade to SENWITT Premium to unlock the full arcade.
          </p>
        </div>
      )}

      {recommended.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-teal)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Recommended for you
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children w-full">
            {recommended.map((game) => renderGameTile(game, onLaunchGame, { recommended: true }))}
          </div>
        </section>
      )}

      <h2
        className="mb-3"
        style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}
      >
        Browse all drills
      </h2>

      <div className="filter-chip-row">
        {CATEGORIES.map((cat) => {
          const isSelected = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => { playClickSound(); setFilterCategory(cat.value); }}
              className={`filter-chip ${isSelected ? 'is-active' : ''}`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children w-full">
        {filteredGames.map((game) =>
          renderGameTile(game, onLaunchGame, {
            locked: !isPremium && !recommendedIds.has(game.id),
            onRequestUpgrade,
          }),
        )}
      </div>
    </div>
  );
};
