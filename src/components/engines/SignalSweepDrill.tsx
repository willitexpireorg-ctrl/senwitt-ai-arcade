import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Sparkles,
  ScanSearch,
  ArrowRight,
  Circle,
  Square,
  Diamond,
  Triangle,
  Star,
  Hexagon,
  Check,
  X,
} from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface SignalSweepResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface SignalSweepDrillProps {
  onComplete: (result: SignalSweepResult) => void;
  onCancel: () => void;
}

type ShapeId = 'circle' | 'square' | 'diamond' | 'triangle' | 'star' | 'hexagon';
type FillMode = 'filled' | 'outline';
type Hue = 'teal' | 'rose' | 'amber' | 'sky';

interface CellItem {
  id: string;
  shape: ShapeId;
  fill: FillMode;
  hue: Hue;
  isTarget: boolean;
}

interface SweepRound {
  id: string;
  instruction: string;
  cols: number;
  rows: number;
  seconds: number;
  items: CellItem[];
}

const POINTS_HIT = 14;
const PENALTY_DISTRACTOR = 8;
const ROUND_SECONDS = [15, 14, 13, 12, 12];
const ROUNDS_PER_SESSION = 5;

const HUE_HEX: Record<Hue, string> = {
  teal: '#0f766e',
  rose: '#be123c',
  amber: '#b45309',
  sky: '#0369a1',
};

const SHAPE_ICONS = {
  circle: Circle,
  square: Square,
  diamond: Diamond,
  triangle: Triangle,
  star: Star,
  hexagon: Hexagon,
} as const;

const safeSound = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* audio optional */
  }
};

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildRound = (
  id: string,
  instruction: string,
  cols: number,
  rows: number,
  seconds: number,
  targetCount: number,
  makeTarget: () => Omit<CellItem, 'id' | 'isTarget'>,
  makeDistractor: () => Omit<CellItem, 'id' | 'isTarget'>,
): SweepRound => {
  const total = cols * rows;
  const items: CellItem[] = [];
  for (let i = 0; i < targetCount; i++) {
    items.push({ id: `${id}-t-${i}`, ...makeTarget(), isTarget: true });
  }
  const targetRecipe = makeTarget();
  for (let i = targetCount; i < total; i++) {
    let d = makeDistractor();
    let guard = 0;
    while (
      guard < 24 &&
      d.shape === targetRecipe.shape &&
      d.fill === targetRecipe.fill &&
      d.hue === targetRecipe.hue
    ) {
      d = makeDistractor();
      guard += 1;
    }
    items.push({ id: `${id}-d-${i}`, ...d, isTarget: false });
  }
  return { id, instruction, cols, rows, seconds, items: shuffle(items) };
};

const ALL_SHAPES: ShapeId[] = ['circle', 'square', 'diamond', 'triangle', 'star', 'hexagon'];
const ALL_FILLS: FillMode[] = ['filled', 'outline'];
const ALL_HUES: Hue[] = ['teal', 'rose', 'amber', 'sky'];

interface RoundRecipe {
  id: string;
  instruction: string;
  cols: number;
  rows: number;
  targetCount: number;
  target: Omit<CellItem, 'id' | 'isTarget'>;
}

const ROUND_RECIPES: RoundRecipe[] = [
  { id: 'sweep-1', instruction: 'Tap every filled teal diamond.', cols: 4, rows: 4, targetCount: 4, target: { shape: 'diamond', fill: 'filled', hue: 'teal' } },
  { id: 'sweep-2', instruction: 'Tap every outline rose circle.', cols: 4, rows: 4, targetCount: 5, target: { shape: 'circle', fill: 'outline', hue: 'rose' } },
  { id: 'sweep-3', instruction: 'Tap every filled amber star.', cols: 5, rows: 4, targetCount: 5, target: { shape: 'star', fill: 'filled', hue: 'amber' } },
  { id: 'sweep-4', instruction: 'Tap every outline sky hexagon.', cols: 5, rows: 4, targetCount: 6, target: { shape: 'hexagon', fill: 'outline', hue: 'sky' } },
  { id: 'sweep-5', instruction: 'Tap every filled rose triangle.', cols: 5, rows: 4, targetCount: 6, target: { shape: 'triangle', fill: 'filled', hue: 'rose' } },
  { id: 'sweep-6', instruction: 'Tap every outline teal square.', cols: 4, rows: 4, targetCount: 5, target: { shape: 'square', fill: 'outline', hue: 'teal' } },
  { id: 'sweep-7', instruction: 'Tap every filled sky circle.', cols: 5, rows: 4, targetCount: 5, target: { shape: 'circle', fill: 'filled', hue: 'sky' } },
  { id: 'sweep-8', instruction: 'Tap every outline amber diamond.', cols: 5, rows: 5, targetCount: 6, target: { shape: 'diamond', fill: 'outline', hue: 'amber' } },
];

const makeDistractorFor = (target: Omit<CellItem, 'id' | 'isTarget'>) => (): Omit<CellItem, 'id' | 'isTarget'> => {
  let shape = ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)];
  let fill = ALL_FILLS[Math.floor(Math.random() * ALL_FILLS.length)];
  let hue = ALL_HUES[Math.floor(Math.random() * ALL_HUES.length)];
  if (shape === target.shape && fill === target.fill && hue === target.hue) {
    fill = fill === 'filled' ? 'outline' : 'filled';
  }
  return { shape, fill, hue };
};

const buildRounds = (): SweepRound[] => {
  const recipes = [...ROUND_RECIPES].sort(() => Math.random() - 0.5).slice(0, ROUNDS_PER_SESSION);
  return recipes.map((recipe, idx) =>
    buildRound(
      recipe.id,
      recipe.instruction,
      recipe.cols,
      recipe.rows,
      ROUND_SECONDS[Math.min(idx, ROUND_SECONDS.length - 1)],
      recipe.targetCount,
      () => recipe.target,
      makeDistractorFor(recipe.target),
    ),
  );
};

type Phase = 'playing' | 'reveal';

export const SignalSweepDrill: React.FC<SignalSweepDrillProps> = ({ onComplete, onCancel }) => {
  const rounds = useMemo(() => buildRounds(), []);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [secondsLeft, setSecondsLeft] = useState(rounds[0].seconds);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [perfectRounds, setPerfectRounds] = useState(0);
  const [roundDelta, setRoundDelta] = useState(0);
  const [roundStats, setRoundStats] = useState({ hits: 0, misses: 0, targets: 0 });

  const drillStartRef = useRef(Date.now());
  const selectedRef = useRef<Set<string>>(selected);
  const scoreRef = useRef(0);
  const perfectRef = useRef(0);
  const finishingRef = useRef(false);
  const activeRef = useRef(true);
  const targetIdsRef = useRef<Set<string>>(new Set());
  const currentRound = rounds[roundIndex];
  const targetIds = useMemo(
    () => new Set(currentRound.items.filter((i) => i.isTarget).map((i) => i.id)),
    [currentRound],
  );

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    targetIdsRef.current = targetIds;
  }, [targetIds]);

  const finishRound = () => {
    // Guard against Lock-in + timer expiry double-scoring in the same tick.
    if (finishingRef.current) return;
    finishingRef.current = true;
    let hits = 0;
    let mistaps = 0;
    const targets = targetIdsRef.current;
    selectedRef.current.forEach((id) => {
      if (targets.has(id)) hits += 1;
      else mistaps += 1;
    });
    const missedTargets = targets.size - hits;
    const isPerfect = hits === targets.size && mistaps === 0;
    const delta = Math.max(0, hits * POINTS_HIT - mistaps * PENALTY_DISTRACTOR - missedTargets * 2);
    if (isPerfect) {
      safeSound(playCorrectSound);
      perfectRef.current += 1;
      setPerfectRounds(perfectRef.current);
    } else if (hits > mistaps) {
      safeSound(playCorrectSound);
    } else {
      safeSound(playIncorrectSound);
    }
    setRoundStats({ hits, misses: mistaps, targets: targets.size });
    setRoundDelta(delta);
    scoreRef.current += delta;
    setScore(scoreRef.current);
    setPhase('reveal');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    if (secondsLeft <= 0) {
      finishRound();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const toggleCell = (id: string) => {
    if (phase !== 'playing' || finishingRef.current) return;
    safeSound(playClickSound);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Keep ref in sync immediately so timer expiry never misses a last-ms tap.
      selectedRef.current = next;
      return next;
    });
  };

  const handleLockIn = () => {
    if (phase !== 'playing' || finishingRef.current) return;
    safeSound(playClickSound);
    finishRound();
  };

  const handleNext = () => {
    safeSound(playClickSound);
    if (roundIndex + 1 >= rounds.length) {
      if (!activeRef.current) return;
      safeSound(playFanfareSound);
      onComplete({
        scoreEarned: scoreRef.current,
        correctCount: perfectRef.current,
        totalItems: rounds.length,
        totalTimeMs: Date.now() - drillStartRef.current,
      });
      return;
    }
    const next = roundIndex + 1;
    finishingRef.current = false;
    setRoundIndex(next);
    const empty = new Set<string>();
    selectedRef.current = empty;
    setSelected(empty);
    setSecondsLeft(rounds[next].seconds);
    setPhase('playing');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      <div className="w-full flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          onClick={onCancel}
          className="btn-3d px-4 py-2 text-xs"
          style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
        >
          ✕ Exit
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Round {roundIndex + 1} of {rounds.length}
          </div>
          {phase === 'playing' && (
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
              style={{
                background: secondsLeft <= 5 ? '#fff1f2' : '#fff7ed',
                border: `1px solid ${secondsLeft <= 5 ? '#fecdd3' : '#fed7aa'}`,
                color: secondsLeft <= 5 ? '#9f1239' : '#c2410c',
              }}
            >
              <Clock className="w-4 h-4" />
              <span>{secondsLeft}s</span>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts · {perfectRounds} clean</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="signal_sweep" />

      <div className="w-full surface p-6 md:p-10 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4"
          style={{ background: '#ffe4e6', border: '1px solid #fecdd3', color: '#be123c' }}
        >
          <ScanSearch className="w-4 h-4" />
          Signal Sweep
        </div>

        <p className="text-base md:text-lg mb-5 max-w-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          {currentRound.instruction}
        </p>

        <div
          className="w-full max-w-lg grid gap-2 mb-6"
          style={{ gridTemplateColumns: `repeat(${currentRound.cols}, minmax(0, 1fr))` }}
        >
          {currentRound.items.map((item) => {
            const Icon = SHAPE_ICONS[item.shape];
            const isSelected = selected.has(item.id);
            const color = HUE_HEX[item.hue];
            let border = '2px solid #e2ebf4';
            let bg = '#fff';
            if (phase === 'reveal') {
              if (item.isTarget && isSelected) {
                border = '2px solid #059669';
                bg = '#ecfdf5';
              } else if (item.isTarget && !isSelected) {
                border = '2px dashed #059669';
                bg = '#f0fdf4';
              } else if (!item.isTarget && isSelected) {
                border = '2px solid #e11d48';
                bg = '#fff1f2';
              }
            } else if (isSelected) {
              border = '2px solid #0f766e';
              bg = '#f0fdfa';
            }
            return (
              <button
                key={item.id}
                type="button"
                disabled={phase === 'reveal'}
                onClick={() => toggleCell(item.id)}
                className="relative flex items-center justify-center rounded-xl min-h-[48px] sm:min-h-[56px] transition-all"
                style={{ background: bg, border }}
                aria-label={`${item.fill} ${item.hue} ${item.shape}`}
              >
                <Icon
                  className="w-6 h-6 sm:w-7 sm:h-7"
                  strokeWidth={item.fill === 'outline' ? 2.4 : 0}
                  fill={item.fill === 'filled' ? color : 'transparent'}
                  color={color}
                />
                {phase === 'reveal' && item.isTarget && isSelected && (
                  <Check className="absolute top-1 right-1 w-3 h-3 text-emerald-600" />
                )}
                {phase === 'reveal' && !item.isTarget && isSelected && (
                  <X className="absolute top-1 right-1 w-3 h-3 text-rose-600" />
                )}
              </button>
            );
          })}
        </div>

        {phase === 'reveal' && (
          <div
            className="w-full p-5 rounded-2xl border mb-6 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: roundDelta > 0 ? '#ecfdf5' : '#fff1f2',
              borderColor: roundDelta > 0 ? '#a7f3d0' : '#fecdd3',
              color: roundDelta > 0 ? '#065f46' : '#9f1239',
            }}
          >
            <p className="leading-relaxed font-extrabold mb-1">+{roundDelta} pts this round</p>
            <p className="leading-relaxed font-semibold">
              Hits {roundStats.hits}/{roundStats.targets}
              {roundStats.misses > 0 ? ` · ${roundStats.misses} distractor tap${roundStats.misses === 1 ? '' : 's'}` : ''}
            </p>
          </div>
        )}

        {phase === 'playing' ? (
          <button onClick={handleLockIn} className="btn-3d btn-3d-rose w-full py-4 text-base flex items-center justify-center gap-2 min-h-[48px]">
            <span>Lock it in</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleNext} className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2 min-h-[48px]">
            <span>{roundIndex + 1 < rounds.length ? 'Next round' : 'Finish drill'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
