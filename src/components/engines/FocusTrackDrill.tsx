import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TrainFront, Sparkles, ArrowRightCircle } from 'lucide-react';
import { playClickSound, playCorrectSound, playIncorrectSound, playFanfareSound } from '../../services/sound';
import { EvidencePanel } from '../EvidencePanel';

export interface FocusTrackResult {
  scoreEarned: number;
  correctCount: number;
  totalItems: number;
  totalTimeMs: number;
}

interface FocusTrackDrillProps {
  onComplete: (result: FocusTrackResult) => void;
  onCancel: () => void;
}

type DestColor = 'teal' | 'coral' | 'sky';

interface TrackTask {
  id: string;
  lane: number;
  dest: DestColor;
  spawnAt: number;
  deadline: number;
}

const LANE_COUNT = 3;
const DEST_COLORS: DestColor[] = ['teal', 'coral', 'sky'];
const SESSION_MS = 52_000;
const TICK_MS = 100;
const POINTS_CORRECT = 16;
const PENALTY_WRONG = 8;
const PENALTY_MISS = 6;

const DEST_META: Record<DestColor, { label: string; hex: string; soft: string; border: string }> = {
  teal: { label: 'Teal', hex: '#0f766e', soft: '#ccfbf1', border: '#99f6e4' },
  coral: { label: 'Coral', hex: '#e84628', soft: '#ffe4e6', border: '#fecdd3' },
  sky: { label: 'Sky', hex: '#0369a1', soft: '#e0f2fe', border: '#bae6fd' },
};

const safeSound = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* audio optional */
  }
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

let taskSeq = 0;

/** Difficulty ramp: faster approach + more concurrent lanes as the session goes on. */
const rampParams = (elapsedMs: number) => {
  const f = elapsedMs / SESSION_MS;
  const approachMs = lerp(4200, 2100, f);
  const spawnGapMin = lerp(1500, 750, f);
  const spawnGapMax = lerp(2200, 1350, f);
  const maxConcurrent = f < 0.3 ? 1 : f < 0.65 ? 2 : LANE_COUNT;
  return { approachMs, spawnGapMin, spawnGapMax, maxConcurrent };
};

export const FocusTrackDrill: React.FC<FocusTrackDrillProps> = ({ onComplete, onCancel }) => {
  const [, forceTick] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(SESSION_MS / 1000));
  const [laneFlash, setLaneFlash] = useState<{ lane: number; ok: boolean } | null>(null);

  const startTimeRef = useRef(Date.now());
  const tasksRef = useRef<TrackTask[]>([]);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const nextSpawnAtRef = useRef(Date.now() + 700);
  const activeRef = useRef(true);
  const finishingRef = useRef(false);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishDrill = useCallback(() => {
    if (finishingRef.current || !activeRef.current) return;
    finishingRef.current = true;
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    safeSound(playFanfareSound);
    onComplete({
      scoreEarned: Math.max(0, scoreRef.current),
      correctCount: correctRef.current,
      totalItems: Math.max(1, totalRef.current),
      totalTimeMs: Date.now() - startTimeRef.current,
    });
  }, [onComplete]);

  useEffect(() => {
    activeRef.current = true;
    tickTimerRef.current = setInterval(() => {
      if (!activeRef.current || finishingRef.current) return;
      const t = Date.now();
      const elapsed = t - startTimeRef.current;
      const { approachMs, spawnGapMin, spawnGapMax, maxConcurrent } = rampParams(elapsed);

      const stillActive: TrackTask[] = [];
      let missedThisTick = 0;
      for (const task of tasksRef.current) {
        if (t >= task.deadline) {
          missedThisTick += 1;
        } else {
          stillActive.push(task);
        }
      }
      tasksRef.current = stillActive;
      if (missedThisTick > 0) {
        totalRef.current += missedThisTick;
        scoreRef.current = Math.max(0, scoreRef.current - PENALTY_MISS * missedThisTick);
        setTotalItems(totalRef.current);
        setScore(scoreRef.current);
      }

      if (elapsed < SESSION_MS) {
        const occupiedLanes = new Set(tasksRef.current.map((tk) => tk.lane));
        if (tasksRef.current.length < maxConcurrent && occupiedLanes.size < LANE_COUNT && t >= nextSpawnAtRef.current) {
          const freeLanes = Array.from({ length: LANE_COUNT }, (_, i) => i).filter((i) => !occupiedLanes.has(i));
          if (freeLanes.length > 0) {
            const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
            const dest = DEST_COLORS[Math.floor(Math.random() * DEST_COLORS.length)];
            taskSeq += 1;
            tasksRef.current = [
              ...tasksRef.current,
              { id: `track-${taskSeq}`, lane, dest, spawnAt: t, deadline: t + approachMs },
            ];
            nextSpawnAtRef.current = t + spawnGapMin + Math.random() * (spawnGapMax - spawnGapMin);
          }
        }
        setSecondsLeft(Math.max(0, Math.ceil((SESSION_MS - elapsed) / 1000)));
      } else {
        setSecondsLeft(0);
        if (tasksRef.current.length === 0) {
          finishDrill();
          return;
        }
      }

      forceTick((n) => n + 1);
    }, TICK_MS);

    return () => {
      activeRef.current = false;
      if (tickTimerRef.current) {
        clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoute = (lane: number, dest: DestColor) => {
    if (finishingRef.current) return;
    const idx = tasksRef.current.findIndex((tk) => tk.lane === lane);
    if (idx === -1) return;
    const task = tasksRef.current[idx];
    // Miss-sweep runs on the 100ms tick; reject late taps so they aren't scored as hits.
    if (Date.now() >= task.deadline) return;
    safeSound(playClickSound);
    const isCorrect = task.dest === dest;
    tasksRef.current = tasksRef.current.filter((_, i) => i !== idx);
    totalRef.current += 1;
    if (isCorrect) {
      safeSound(playCorrectSound);
      scoreRef.current += POINTS_CORRECT;
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    } else {
      safeSound(playIncorrectSound);
      scoreRef.current = Math.max(0, scoreRef.current - PENALTY_WRONG);
    }
    setScore(scoreRef.current);
    setTotalItems(totalRef.current);
    setLaneFlash({ lane, ok: isCorrect });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setLaneFlash(null), 320);
    forceTick((n) => n + 1);
  };

  const now = Date.now();

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
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{
              background: secondsLeft <= 8 ? '#fff1ed' : 'var(--bg-surface)',
              border: `1px solid ${secondsLeft <= 8 ? '#fed7aa' : 'var(--border-color)'}`,
              color: secondsLeft <= 8 ? 'var(--accent-coral)' : 'var(--text-primary)',
            }}
          >
            <span>{secondsLeft}s</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2 rounded-2xl"
            style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{score} pts · {correctCount}/{totalItems} routed</span>
          </div>
        </div>
      </div>

      <EvidencePanel evidenceKey="attention_track" />

      <div className="w-full surface p-6 md:p-10 flex flex-col items-center justify-center text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4"
          style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <TrainFront className="w-4 h-4" />
          Focus Track
        </div>

        <p className="text-xs md:text-sm font-semibold mb-6 max-w-lg" style={{ color: 'var(--text-secondary)' }}>
          Each lane can carry one task at a time. Read its destination color and tap the matching button in that
          lane before its bar runs out. Several lanes can be live at once — split your attention across all of them.
        </p>

        <div className="w-full grid grid-cols-3 gap-3 mb-2">
          {Array.from({ length: LANE_COUNT }, (_, lane) => {
            const task = tasksRef.current.find((tk) => tk.lane === lane);
            const remaining = task ? clamp((task.deadline - now) / (task.deadline - task.spawnAt), 0, 1) : 1;
            const flashed = laneFlash?.lane === lane ? laneFlash : null;
            const meta = task ? DEST_META[task.dest] : null;
            return (
              <div
                key={lane}
                className="rounded-2xl p-2 flex flex-col items-center gap-2 transition-all"
                style={{
                  background: flashed ? (flashed.ok ? '#ecfdf5' : '#fff1f2') : 'var(--bg-surface-soft)',
                  border: `2px solid ${flashed ? (flashed.ok ? '#a7f3d0' : '#fecdd3') : 'var(--border-color)'}`,
                }}
              >
                <div
                  className="w-full rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    minHeight: '92px',
                    background: meta ? meta.soft : '#fff',
                    border: `1px dashed ${meta ? meta.border : '#e2ebf4'}`,
                  }}
                >
                  {task && meta ? (
                    <>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: meta.hex }}>
                        → {meta.label}
                      </span>
                      <div
                        className="absolute bottom-0 left-0 h-1.5 transition-all"
                        style={{
                          width: `${remaining * 100}%`,
                          background: remaining < 0.3 ? 'var(--accent-coral)' : meta.hex,
                        }}
                      />
                    </>
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                      waiting…
                    </span>
                  )}
                </div>

                <div className="w-full flex flex-col gap-1.5">
                  {DEST_COLORS.map((color) => {
                    const m = DEST_META[color];
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleRoute(lane, color)}
                        className="btn-3d py-2.5 text-[11px] font-extrabold rounded-lg"
                        style={{
                          background: m.soft,
                          color: m.hex,
                          borderBottom: `3px solid ${m.border}`,
                          minHeight: '44px',
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="w-full flex items-center gap-2 justify-center text-[11px] font-semibold mt-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowRightCircle className="w-3.5 h-3.5" />
          <span>Correct route +{POINTS_CORRECT} · wrong route −{PENALTY_WRONG} · missed −{PENALTY_MISS}</span>
        </div>
      </div>
    </div>
  );
};
