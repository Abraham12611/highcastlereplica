/**
 * Engine port for the recording console (issue #13).
 *
 * The console talks to playback ONLY through `RecordingEnginePort`, which
 * mirrors the `PlaybackControls` contract from `docs/03_CONTRACTS.md`. The
 * real engine (engine lane, issue #5) can be injected without touching any
 * recording file. Until it lands, `createDeterministicStandaloneEngine`
 * provides a fully deterministic fallback driven by the preset's own chapter
 * timings: a virtual clock, no timers hidden from tests, no network, no
 * randomness. Visibility is a pure function of `elapsedMs`, so pause /
 * resume / seek / reload all reconstruct the same state.
 */
import { findPreset } from './presets';
import type {
  RecordingSnapshot,
  RecordingSpeed,
  RecordingStatus,
  RecordingVisibleEvent,
} from './types';

export interface RecordingEnginePort {
  subscribe(listener: () => void): () => void;
  getSnapshot(): RecordingSnapshot;
  start(scenarioId: string): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setSpeed(speed: RecordingSpeed): void;
  seek(offsetMs: number): void;
  getVisibleEvents(): RecordingVisibleEvent[];
  dispose(): void;
}

interface EngineTimers {
  setInterval(callback: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

interface StandaloneEngineOptions {
  scenarioId: string;
  durationMs?: number;
  speed?: RecordingSpeed;
  elapsedMs?: number;
  status?: RecordingStatus;
  now?: () => number;
  timers?: EngineTimers;
  tickMs?: number;
  onTick?: (snapshot: RecordingSnapshot) => void;
}

const DEFAULT_TICK_MS = 100;

function defaultTimers(): EngineTimers | null {
  try {
    if (
      typeof globalThis.setInterval !== 'undefined' &&
      typeof globalThis.clearInterval !== 'undefined'
    ) {
      return {
        setInterval: (cb, ms) => globalThis.setInterval(cb, ms),
        clearInterval: (id) => {
          globalThis.clearInterval(
            id as Parameters<typeof globalThis.clearInterval>[0],
          );
        },
      };
    }
  } catch {
    // Non-timer environment (tests drive the clock manually).
  }
  return null;
}

/**
 * Deterministic standalone playback engine. Synthetic chapter markers from
 * the preset act as the visible timeline until the fixture/engine lanes
 * land: marker `i` is visible exactly when `elapsedMs >= chapter.offsetMs`.
 */
export function createDeterministicStandaloneEngine(
  options: StandaloneEngineOptions,
): RecordingEnginePort {
  const {
    tickMs = DEFAULT_TICK_MS,
    now = () => Date.now(),
    onTick,
  } = options;
  const timers = options.timers ?? defaultTimers();

  let scenarioId = options.scenarioId;
  let speed: RecordingSpeed = options.speed ?? 1;
  let elapsedMs = Math.max(0, options.elapsedMs ?? 0);
  let status: RecordingStatus = options.status ?? 'idle';
  let timerId: unknown = null;
  let lastTickRealMs = now();
  const listeners = new Set<() => void>();

  function durationMs(): number {
    if (typeof options.durationMs === 'number') return options.durationMs;
    return findPreset(scenarioId)?.durationMs ?? 0;
  }

  function visibleEvents(): RecordingVisibleEvent[] {
    const preset = findPreset(scenarioId);
    if (!preset) return [];
    return preset.chapters
      .filter((chapter) => chapter.offsetMs <= elapsedMs)
      .map((chapter, index) => ({
        id: chapter.id,
        seq: index,
        offsetMs: chapter.offsetMs,
        title: chapter.label,
        summary: chapter.cue,
      }));
  }

  function snapshot(): RecordingSnapshot {
    return {
      scenarioId,
      status,
      elapsedMs,
      durationMs: durationMs(),
      speed,
      visibleCount: visibleEvents().length,
    };
  }

  function emit(): void {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // A failing subscriber must not break the clock.
      }
    }
    onTick?.(snapshot());
  }

  function stopTimer(): void {
    if (timerId !== null && timers) {
      try {
        timers.clearInterval(timerId);
      } catch {
        // Already cleared; safe to ignore.
      }
      timerId = null;
    }
  }

  function advanceToComplete(): void {
    if (elapsedMs >= durationMs()) {
      elapsedMs = durationMs();
      status = 'completed';
      stopTimer();
    }
  }

  function tick(): void {
    if (status !== 'running') return;
    const current = now();
    const realDt = Math.max(0, current - lastTickRealMs);
    lastTickRealMs = current;
    elapsedMs += realDt * speed;
    advanceToComplete();
    emit();
  }

  function startTimer(): void {
    stopTimer();
    if (!timers) return;
    lastTickRealMs = now();
    try {
      timerId = timers.setInterval(tick, tickMs);
    } catch {
      timerId = null;
    }
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot(): RecordingSnapshot {
      return snapshot();
    },
    start(nextScenarioId: string): void {
      if (nextScenarioId === scenarioId && status !== 'idle') return;
      scenarioId = nextScenarioId;
      elapsedMs = 0;
      status = 'running';
      startTimer();
      emit();
    },
    pause(): void {
      if (status !== 'running') return;
      status = 'paused';
      stopTimer();
      emit();
    },
    resume(): void {
      if (status === 'completed' || status === 'running') return;
      if (status === 'idle') {
        status = 'running';
        startTimer();
        emit();
        return;
      }
      status = 'running';
      startTimer();
      emit();
    },
    reset(): void {
      stopTimer();
      elapsedMs = 0;
      status = 'idle';
      emit();
    },
    setSpeed(nextSpeed: RecordingSpeed): void {
      speed = nextSpeed;
      // Re-anchor the clock so the speed change does not jump.
      lastTickRealMs = now();
      emit();
    },
    seek(offsetMs: number): void {
      const target = Number.isFinite(offsetMs) ? offsetMs : 0;
      elapsedMs = Math.min(Math.max(0, target), durationMs());
      if (elapsedMs >= durationMs() && durationMs() > 0) {
        status = 'completed';
        stopTimer();
      } else if (status === 'completed') {
        status = 'paused';
      }
      emit();
    },
    getVisibleEvents(): RecordingVisibleEvent[] {
      return visibleEvents();
    },
    dispose(): void {
      stopTimer();
      listeners.clear();
    },
  };
}
