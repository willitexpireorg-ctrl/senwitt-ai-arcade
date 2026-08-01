import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Waypoints, Flag, MapPin, RotateCcw, Trash2, Check, ArrowRight, SkipForward } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface RoutePlannerResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface RoutePlannerDrillProps {
  onComplete: (result: RoutePlannerResult) => void;
  onCancel: () => void;
}

type Cell = [number, number];

interface RoutePuzzle {
  id: string;
  size: number;
  start: Cell;
  waypoints: Cell[];
  blocked: Cell[];
  /** Best hand-verified move count. */
  targetMoves: number;
  /** Generous move count that still earns solid credit. */
  generousMoves: number;
}

const PUZZLES_PER_SESSION = 5;
const POINTS_OPTIMAL = 30;
const POINTS_GOOD = 20;
const POINTS_OK = 12;

const safeSound = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* audio optional */
  }
};

const key = (c: Cell) => `${c[0]}-${c[1]}`;
const sameCell = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const isAdjacent = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

const PUZZLE_BANK: RoutePuzzle[] = [
  {
    id: 'route-1',
    size: 5,
    start: [0, 0],
    waypoints: [[0, 4], [4, 4]],
    blocked: [],
    targetMoves: 8,
    generousMoves: 10,
  },
  {
    id: 'route-2',
    size: 5,
    start: [4, 0],
    waypoints: [[0, 0], [0, 4], [4, 4]],
    blocked: [[2, 2]],
    targetMoves: 12,
    generousMoves: 15,
  },
  {
    id: 'route-3',
    size: 5,
    start: [2, 0],
    waypoints: [[0, 4], [4, 4]],
    blocked: [],
    targetMoves: 10,
    generousMoves: 13,
  },
  {
    id: 'route-4',
    size: 6,
    start: [0, 0],
    waypoints: [[0, 5], [5, 5], [5, 0]],
    blocked: [],
    targetMoves: 15,
    generousMoves: 19,
  },
  {
    id: 'route-5',
    size: 5,
    start: [0, 0],
    waypoints: [[4, 0], [4, 4], [0, 4]],
    blocked: [[2, 2]],
    targetMoves: 12,
    generousMoves: 15,
  },
  {
    id: 'route-6',
    size: 5,
    start: [2, 2],
    waypoints: [[0, 0], [4, 4]],
    blocked: [[1, 1], [3, 3]],
    targetMoves: 12,
    generousMoves: 15,
  },
  {
    id: 'route-7',
    size: 6,
    start: [0, 3],
    waypoints: [[5, 0], [5, 5]],
    blocked: [],
    targetMoves: 13,
    generousMoves: 16,
  },
  {
    id: 'route-8',
    size: 5,
    start: [0, 0],
    waypoints: [[0, 2], [0, 4], [4, 4]],
    blocked: [],
    targetMoves: 8,
    generousMoves: 10,
  },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickPuzzles = (): RoutePuzzle[] => shuffle(PUZZLE_BANK).slice(0, PUZZLES_PER_SESSION);

type Phase = 'solving' | 'solved' | 'skipped';

export const RoutePlannerDrill: React.FC<RoutePlannerDrillProps> = ({ onComplete, onCancel }) => {
  const [puzzles] = useState<RoutePuzzle[]>(pickPuzzles);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = puzzles[puzzleIndex];
  const [path, setPath] = useState<Cell[]>(() => [puzzles[0].start]);
  const [phase, setPhase] = useState<Phase>('solving');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastResult, setLastResult] = useState<{ movesUsed: number; pointsEarned: number; band: string } | null>(
    null,
  );

  const drillStartRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const activeRef = useRef(true);
  const finishingRef = useRef(false);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const blockedSet = useMemo(() => new Set(puzzle.blocked.map(key)), [puzzle]);
  const waypointVisited = useMemo(
    () => puzzle.waypoints.map((wp) => path.some((c) => sameCell(c, wp))),
    [puzzle, path],
  );
  const allVisited = waypointVisited.every(Boolean);

  const finishDrill = useCallback(() => {
    if (finishingRef.current || !activeRef.current) return;
    finishingRef.current = true;
    safeSound(playFanfareSound);
    onComplete({
      scoreEarned: Math.max(0, scoreRef.current),
      correctCount: correctRef.current,
      totalItems: puzzles.length,
      totalTimeMs: Date.now() - drillStartRef.current,
    });
  }, [onComplete, puzzles.length]);

  const handleCellTap = (r: number, c: number) => {
    if (phase !== 'solving' || finishingRef.current) return;
    const cell: Cell = [r, c];
    if (blockedSet.has(key(cell))) return;
    if (path.some((p) => sameCell(p, cell))) return;
    const head = path[path.length - 1];
    if (!isAdjacent(head, cell)) return;
    safeSound(playClickSound);
    setPath((p) => [...p, cell]);
  };

  const handleUndo = () => {
    if (phase !== 'solving' || path.length <= 1) return;
    safeSound(playClickSound);
    setPath((p) => p.slice(0, -1));
  };

  const handleClear = () => {
    if (phase !== 'solving') return;
    safeSound(playClickSound);
    setPath([puzzle.start]);
  };

  const advancePuzzle = useCallback(() => {
    if (puzzleIndex + 1 >= puzzles.length) {
      finishDrill();
      return;
    }
    const next = puzzleIndex + 1;
    setPuzzleIndex(next);
    setPath([puzzles[next].start]);
    setPhase('solving');
    setLastResult(null);
  }, [puzzleIndex, puzzles, finishDrill]);

  const handleConfirm = () => {
    if (phase !== 'solving' || !allVisited || finishingRef.current) return;
    const movesUsed = path.length - 1;
    let pointsEarned = POINTS_OK;
    let band = 'Solved';
    if (movesUsed <= puzzle.targetMoves) {
      pointsEarned = POINTS_OPTIMAL;
      band = 'Optimal route';
    } else if (movesUsed <= puzzle.generousMoves) {
      pointsEarned = POINTS_GOOD;
      band = 'Efficient route';
    } else {
      band = 'Solved — a shorter route was possible';
    }
    safeSound(playCorrectSound);
    scoreRef.current += pointsEarned;
    correctRef.current += 1;
    setScore(scoreRef.current);
    setCorrectCount(correctRef.current);
    setLastResult({ movesUsed, pointsEarned, band });
    setPhase('solved');
  };

  const handleSkip = () => {
    if (phase !== 'solving' || finishingRef.current) return;
    safeSound(playIncorrectSound);
    setLastResult({ movesUsed: path.length - 1, pointsEarned: 0, band: 'Skipped' });
    setPhase('skipped');
  };

  const isFinalPuzzle = puzzleIndex + 1 >= puzzles.length;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-10 min-h-[calc(100vh-var(--navbar-height))] flex flex-col justify-start sm:justify-center items-stretch relative z-10">
      <div className="w-full flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          type="button"
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
            Route {puzzleIndex + 1} of {puzzles.length}
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <span>{score} pts · {correctCount} solved</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="route_plan" />

      <div className="w-full surface p-6 md:p-10 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4"
          style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: '#0f766e' }}
        >
          <Waypoints className="w-4 h-4" />
          Route Planner
        </div>

        <p className="text-xs md:text-sm font-semibold mb-5 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
          Tap adjacent cells to build a path from the flag that visits every numbered stop, in any order. Shorter
          routes score more.
        </p>

        <div
          className="grid gap-1 mb-5 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
            width: '100%',
            maxWidth: puzzle.size >= 6 ? '22rem' : '19rem',
          }}
        >
          {Array.from({ length: puzzle.size }, (_, r) =>
            Array.from({ length: puzzle.size }, (_, c) => {
              const cell: Cell = [r, c];
              const isStart = sameCell(cell, puzzle.start);
              const wpIndex = puzzle.waypoints.findIndex((wp) => sameCell(wp, cell));
              const isWaypoint = wpIndex >= 0;
              const isBlocked = blockedSet.has(key(cell));
              const inPath = path.some((p) => sameCell(p, cell));
              const isHead = path.length > 0 && sameCell(path[path.length - 1], cell);
              const visited = isWaypoint && waypointVisited[wpIndex];

              let bg = '#fff';
              let border = '2px solid #e2ebf4';
              if (isBlocked) {
                bg = '#e2e8f0';
                border = '2px solid #cbd5e1';
              } else if (isStart) {
                bg = '#0f766e';
                border = '2px solid #0b5c56';
              } else if (isWaypoint) {
                bg = visited ? '#ecfdf5' : '#fff7ed';
                border = visited ? '2px solid #6ee7b7' : '2px solid #fdba74';
              } else if (inPath) {
                bg = '#f0fdfa';
                border = '2px solid #99f6e4';
              }
              if (isHead && !isStart) {
                border = '2px solid #0f766e';
              }

              return (
                <button
                  key={key(cell)}
                  type="button"
                  disabled={phase !== 'solving' || isBlocked}
                  onClick={() => handleCellTap(r, c)}
                  className="relative flex items-center justify-center rounded-lg transition-all"
                  style={{ aspectRatio: '1', background: bg, border }}
                  aria-label={isStart ? 'Start' : isWaypoint ? `Waypoint ${wpIndex + 1}` : 'Path cell'}
                >
                  {isStart && <Flag className="w-4 h-4 sm:w-5 sm:h-5" color="#fff" fill="#fff" />}
                  {isWaypoint && !isStart && (
                    <span className="relative flex items-center justify-center">
                      <MapPin
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        color={visited ? '#059669' : '#c2410c'}
                        fill={visited ? '#a7f3d0' : '#fed7aa'}
                      />
                      <span
                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white"
                        style={{ background: visited ? '#059669' : '#c2410c' }}
                      >
                        {wpIndex + 1}
                      </span>
                    </span>
                  )}
                  {!isStart && !isWaypoint && inPath && (
                    <span
                      className="rounded-full"
                      style={{ width: isHead ? 12 : 8, height: isHead ? 12 : 8, background: '#0f766e' }}
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>

        {phase === 'solving' && (
          <div className="w-full flex items-center justify-center gap-2 mb-5 flex-wrap">
            <button
              type="button"
              onClick={handleUndo}
              disabled={path.length <= 1}
              className="btn-3d px-4 py-2.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={path.length <= 1}
              className="btn-3d px-4 py-2.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="btn-3d px-4 py-2.5 text-xs flex items-center gap-1.5"
              style={{ background: '#fff', color: 'var(--text-secondary)', borderBottom: '4px solid #d7e0ea' }}
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>
          </div>
        )}

        {(phase === 'solved' || phase === 'skipped') && lastResult && (
          <div
            className="w-full p-5 rounded-2xl border mb-5 text-xs md:text-sm text-left animate-fadeIn"
            style={{
              background: phase === 'skipped' ? '#fff1f2' : '#ecfdf5',
              borderColor: phase === 'skipped' ? '#fecdd3' : '#a7f3d0',
              color: phase === 'skipped' ? '#9f1239' : '#065f46',
            }}
          >
            <p className="leading-relaxed font-extrabold mb-1">
              {lastResult.band}
              {phase === 'solved' ? ` — +${lastResult.pointsEarned} pts` : ''}
            </p>
            <p className="leading-relaxed font-semibold">
              {phase === 'solved'
                ? `${lastResult.movesUsed} moves used (target ${puzzle.targetMoves}).`
                : 'No points for this route — moving to the next one.'}
            </p>
          </div>
        )}

        {phase === 'solving' ? (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allVisited}
            className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Check className="w-5 h-5" />
            <span>{allVisited ? 'Confirm route' : `Visit all stops (${waypointVisited.filter(Boolean).length}/${puzzle.waypoints.length})`}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={advancePuzzle}
            className="btn-3d btn-3d-teal w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <span>{isFinalPuzzle ? 'Finish drill' : 'Next route'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
