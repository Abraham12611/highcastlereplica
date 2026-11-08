/**
 * Deterministic scenario playback controller.
 *
 * - Consumes preauthored events (via an injected `resolveScenario`), never
 *   network, inference, or random generation.
 * - Virtual clock: a single interval advances `elapsedMs` by
 *   `realDt * speed`. Speeds `0.5 | 1 | 2 | 4`.
 * - Visibility is a pure function of `elapsedMs` (see `scheduler.ts`), so
 *   pause / resume / seek / reload-recovery all reconstruct the same state.
 * - Persists `{ scenarioId, elapsedMs, speed, status }` to browser storage
 *   only (guarded for SSR). A reload restores the exact revealed set and
 *   parks as `paused` — the engine never autoplays after a reload.
 * - `start()` is idempotent: starting the already-active scenario is a
 *   no-op (no second timer, no duplicate callbacks). Reruns are explicit
 *   via `reset()` then `start()`, and always replay identically.
 * - `dispose()` clears the timer and listeners; safe to call on unmount
 *   with zero leaks. State survives in storage for remount hydration.
 */
import {
  clampSeekTarget,
  durationOf,
  phaseAt,
  sortEvents,
  visibleEventsAt,
} from './scheduler';
import type {
  EngineEvent,
  EnginePhase,
  EngineScenario,
  EngineStatus,
  PlaybackSnapshot,
  PlaybackSpeed,
  StartOptions,
} from './types';
import { PLAYBACK_SPEEDS } from './types';

export const ENGINE_STORAGE_KEY = 'highcastle.demo.engine.v1';
const STORAGE_VERSION = 1;
const DEFAULT_TICK_MS = 100;

export interface EngineStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface EngineTimers {
  setInterval(callback: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

export interface CreateEngineOptions {
  /** Resolve a scenario id to its preauthored fixture record. */
  resolveScenario: (scenarioId: string) => EngineScenario | null | undefined;
  /** Browser storage. Defaults to `localStorage` when available, else null. */
  storage?: EngineStorage | null;
  storageKey?: string;
  /** Real-time clock, injectable for tests. */
  now?: () => number;
  /** Timer functions, injectable for tests. Defaults to globals. */
  timers?: EngineTimers;
  /** Real-ms interval between virtual-clock ticks. */
  tickMs?: number;
  /** Fired once per event as it is revealed in the current pass. */
  onEventsRevealed?: (events: EngineEvent[]) => void;
  /** Fired exactly once when the scenario reaches its duration. */
  onComplete?: (scenarioId: string) => void;
}

interface PersistedState {
  v: number;
  scenarioId: string;
  elapsedMs: number;
  speed: PlaybackSpeed;
  status: EngineStatus;
}

function defaultStorage(): EngineStorage | null {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage;
    }
  } catch {
    // Blocked storage / SSR: run without persistence.
  }
  return null;
}

function isValidSpeed(value: unknown): value is PlaybackSpeed {
  return (PLAYBACK_SPEEDS as readonly unknown[]).includes(value);
}

function readPersisted(
  storage: EngineStorage | null,
  key: string,
): PersistedState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (record['v'] !== STORAGE_VERSION) return null;
    if (typeof record['scenarioId'] !== 'string' || record['scenarioId'] === '') {
      return null;
    }
    const elapsedMs = record['elapsedMs'];
    const speed = record['speed'];
    const status = record['status'];
    if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs)) return null;
    if (!isValidSpeed(speed)) return null;
    if (
      status !== 'running' &&
      status !== 'paused' &&
      status !== 'completed' &&
      status !== 'canceled'
    ) {
      return null;
    }
    return {
      v: STORAGE_VERSION,
      scenarioId: record['scenarioId'] as string,
      elapsedMs: Math.max(0, elapsedMs),
      speed,
      status,
    };
  } catch {
    return null;
  }
}

export interface PlaybackEngine {
  subscribe(listener: () => void): () => void;
  getSnapshot(): PlaybackSnapshot;
  start(scenarioId: string, opts?: StartOptions): void;
  pause(): void;
  resume(): void;
  reset(): void;
  cancel(): void;
  setSpeed(speed: PlaybackSpeed): void;
  seek(offsetMs: number): void;
  getVisibleEvents(): EngineEvent[];
  dispose(): void;
}

export function createEngine(options: CreateEngineOptions): PlaybackEngine {
  const {
    resolveScenario,
    tickMs = DEFAULT_TICK_MS,
    now = () => Date.now(),
    onEventsRevealed,
    onComplete,
  } = options;
  const storage = options.storage !== undefined ? options.storage : defaultStorage();
  const storageKey = options.storageKey ?? ENGINE_STORAGE_KEY;
  const timers: EngineTimers = options.timers ?? {
    setInterval: (callback, ms) => globalThis.setInterval(callback, ms),
    clearInterval: (id) => globalThis.clearInterval(id as ReturnType<typeof setInterval>),
  };

  let scenarioId: string | null = null;
  let sortedEvents: EngineEvent[] = [];
  let durationMs = 0;
  let elapsedMs = 0;
  let speed: PlaybackSpeed = 1;
  let status: EngineStatus = 'idle';
  let intervalId: unknown = null;
  let lastTickAt: number | null = null;
  /** Events already reported via `onEventsRevealed` in the current pass. */
  let revealedIds = new Set<string>();

  const listeners = new Set<() => void>();
  let cachedSnapshot: PlaybackSnapshot | null = null;

  function persist(): void {
    if (!storage) return;
    try {
      if (scenarioId === null) {
        storage.removeItem(storageKey);
        return;
      }
      const state: PersistedState = { v: STORAGE_VERSION, scenarioId, elapsedMs, speed, status };
      storage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Persistence is best-effort; playback must never crash on it.
    }
  }

  function buildSnapshot(): PlaybackSnapshot {
    const visible = scenarioId === null ? [] : visibleEventsAt(sortedEvents, elapsedMs);
    const phase: EnginePhase =
      scenarioId === null ? 'idle' : phaseAt(sortedEvents, visible.length);
    return {
      scenarioId,
      status,
      elapsedMs,
      durationMs,
      speed,
      visibleEvents: visible,
      visibleEventIds: visible.map((event) => event.id),
      phase,
    };
  }

  function emit(): void {
    cachedSnapshot = buildSnapshot();
    persist();
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // One bad subscriber must not break the engine or other subscribers.
      }
    }
  }

  function stopTimer(): void {
    if (intervalId !== null) {
      try {
        timers.clearInterval(intervalId);
      } catch {
        // Ignore timer teardown failures.
      }
      intervalId = null;
    }
    lastTickAt = null;
  }

  function startTimer(): void {
    stopTimer();
    lastTickAt = now();
    intervalId = timers.setInterval(onTick, Math.max(16, tickMs));
  }

  function fireNewlyRevealed(visible: EngineEvent[]): void {
    const fresh = visible.filter((event) => !revealedIds.has(event.id));
    if (fresh.length === 0) return;
    for (const event of fresh) revealedIds.add(event.id);
    try {
      onEventsRevealed?.(fresh);
    } catch {
      // Callback failures must not corrupt playback state.
    }
  }

  function onTick(): void {
    if (status !== 'running') return;
    const current = now();
    const anchor = lastTickAt ?? current;
    lastTickAt = current;
    advance((current - anchor) * speed);
  }

  /** Advance the virtual clock by `dtVirtualMs`. No-op unless running. */
  function advance(dtVirtualMs: number): void {
    if (status !== 'running' || scenarioId === null) return;
    if (!Number.isFinite(dtVirtualMs) || dtVirtualMs <= 0) return;
    const next = Math.min(elapsedMs + dtVirtualMs, durationMs);
    elapsedMs = next;
    fireNewlyRevealed(visibleEventsAt(sortedEvents, elapsedMs));
    if (elapsedMs >= durationMs) {
      status = 'completed';
      stopTimer();
      emit();
      try {
        onComplete?.(scenarioId);
      } catch {
        // Ignore callback failures.
      }
      return;
    }
    emit();
  }

  function loadScenario(id: string): boolean {
    const scenario = resolveScenario(id);
    if (!scenario) return false;
    scenarioId = scenario.id;
    sortedEvents = sortEvents(scenario.events);
    durationMs = durationOf(scenario.events, scenario.durationMs);
    return true;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot(): PlaybackSnapshot {
    if (!cachedSnapshot) cachedSnapshot = buildSnapshot();
    return cachedSnapshot;
  }

  function start(id: string, _opts?: StartOptions): void {
    void _opts;
    // Idempotent: re-starting the already-active scenario changes nothing.
    if (scenarioId === id && (status === 'running' || status === 'paused')) return;
    if (!loadScenario(id)) return;
    elapsedMs = 0;
    status = 'running';
    revealedIds = new Set<string>();
    // Events at offset 0 are visible immediately and reported once.
    fireNewlyRevealed(visibleEventsAt(sortedEvents, elapsedMs));
    startTimer();
    emit();
  }

  function pause(): void {
    if (status !== 'running') return;
    // Settle the clock up to this instant so no time is lost or gained.
    if (lastTickAt !== null) {
      const current = now();
      const dt = (current - lastTickAt) * speed;
      lastTickAt = null;
      if (Number.isFinite(dt) && dt > 0) {
        elapsedMs = Math.min(elapsedMs + dt, durationMs);
        fireNewlyRevealed(visibleEventsAt(sortedEvents, elapsedMs));
      }
    }
    if (elapsedMs >= durationMs) {
      status = 'completed';
      stopTimer();
      emit();
      try {
        if (scenarioId !== null) onComplete?.(scenarioId);
      } catch {
        // Ignore callback failures.
      }
      return;
    }
    status = 'paused';
    stopTimer();
    emit();
  }

  function resume(): void {
    if (status !== 'paused' || scenarioId === null) return;
    status = 'running';
    startTimer();
    emit();
  }

  function reset(): void {
    stopTimer();
    scenarioId = null;
    sortedEvents = [];
    durationMs = 0;
    elapsedMs = 0;
    speed = 1;
    status = 'idle';
    revealedIds = new Set<string>();
    emit();
  }

  function cancel(): void {
    if (status !== 'running' && status !== 'paused') return;
    status = 'canceled';
    stopTimer();
    emit();
  }

  function setSpeed(next: PlaybackSpeed): void {
    if (!isValidSpeed(next) || next === speed) return;
    // Rebase the tick anchor so the in-flight interval is not scaled twice.
    if (status === 'running') {
      if (lastTickAt !== null) {
        const current = now();
        const dt = (current - lastTickAt) * speed;
        lastTickAt = current;
        if (Number.isFinite(dt) && dt > 0) {
          elapsedMs = Math.min(elapsedMs + dt, durationMs);
          fireNewlyRevealed(visibleEventsAt(sortedEvents, elapsedMs));
        }
      }
      if (elapsedMs >= durationMs) {
        status = 'completed';
        stopTimer();
        emit();
        try {
          if (scenarioId !== null) onComplete?.(scenarioId);
        } catch {
          // Ignore callback failures.
        }
        return;
      }
    }
    speed = next;
    emit();
  }

  function seek(offsetMs: number): void {
    if (scenarioId === null) return;
    const target = clampSeekTarget(offsetMs, durationMs);
    // Re-anchor the running clock so post-seek ticks do not replay the jump.
    if (status === 'running') lastTickAt = now();
    elapsedMs = target;
    if (status === 'completed' || status === 'canceled') {
      status = 'paused';
    }
    const visible = visibleEventsAt(sortedEvents, elapsedMs);
    // Resync the callback cursor to the new position: forward seeks report
    // the newly visible delta; backward seeks allow re-reveal on replay.
    const previouslyRevealed = revealedIds;
    revealedIds = new Set(visible.map((event) => event.id));
    const fresh = visible.filter((event) => !previouslyRevealed.has(event.id));
    if (fresh.length > 0) {
      try {
        onEventsRevealed?.(fresh);
      } catch {
        // Ignore callback failures.
      }
    }
    emit();
  }

  function getVisibleEvents(): EngineEvent[] {
    if (scenarioId === null) return [];
    return visibleEventsAt(sortedEvents, elapsedMs);
  }

  function dispose(): void {
    stopTimer();
    listeners.clear();
    // State (and its persisted copy) intentionally survives dispose so a
    // remount can hydrate; use reset() for a clean slate.
  }

  // Hydrate after construction (never during module evaluation, for SSR
  // safety). A snapshot left `running` parks as `paused` — the engine
  // reconstructs revealed events but never autoplays after a reload.
  // Corrupt storage or an unresolvable scenario is discarded silently.
  function hydrate(): void {
    const saved = readPersisted(storage, storageKey);
    if (!saved) {
      cachedSnapshot = buildSnapshot();
      return;
    }
    if (!loadScenario(saved.scenarioId)) {
      try {
        storage?.removeItem(storageKey);
      } catch {
        // Ignore cleanup failures.
      }
      cachedSnapshot = buildSnapshot();
      return;
    }
    elapsedMs = Math.min(saved.elapsedMs, durationMs);
    speed = saved.speed;
    status = saved.status === 'running' ? 'paused' : saved.status;
    const visible = visibleEventsAt(sortedEvents, elapsedMs);
    revealedIds = new Set(visible.map((event) => event.id));
    cachedSnapshot = buildSnapshot();
    persist();
  }

  hydrate();

  return {
    subscribe,
    getSnapshot,
    start,
    pause,
    resume,
    reset,
    cancel,
    setSpeed,
    seek,
    getVisibleEvents,
    dispose,
  };
}
