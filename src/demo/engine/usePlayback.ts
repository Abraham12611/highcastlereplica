/**
 * React binding for the deterministic playback engine.
 *
 * Thin wrapper over the framework-agnostic external store in `store.ts`
 * via `useSyncExternalStore`, so tearing and stale reads are impossible.
 * The hook owns no timers itself: all timing lives in the engine, and the
 * effect cleanup calls `engine.dispose()`, guaranteeing no interval leaks
 * when the component unmounts.
 *
 * SSR-safe: engine construction and storage hydration never touch browser
 * globals during render. The engine reads persistence lazily inside
 * `createEngine` behind `typeof localStorage` guards.
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createEngine, type CreateEngineOptions, type PlaybackEngine } from './store';
import type {
  PlaybackSnapshot,
  PlaybackSpeed,
  StartOptions,
} from './types';

export interface UsePlaybackResult {
  snapshot: PlaybackSnapshot;
  start: (scenarioId: string, opts?: StartOptions) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  cancel: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  seek: (offsetMs: number) => void;
}

export function usePlayback(options: CreateEngineOptions): UsePlaybackResult {
  const engine: PlaybackEngine = useMemo(
    () => createEngine(options),
    // Engine identity is bound to the resolver/storage provided on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const snapshot = useSyncExternalStore(
    (listener) => engine.subscribe(listener),
    () => engine.getSnapshot(),
  );

  // No timers leak on unmount: the engine's single interval is cleared here
  // while the persisted snapshot survives for remount hydration.
  useEffect(() => () => engine.dispose(), [engine]);

  return useMemo<UsePlaybackResult>(
    () => ({
      snapshot,
      start: (scenarioId, opts) => engine.start(scenarioId, opts),
      pause: () => engine.pause(),
      resume: () => engine.resume(),
      reset: () => engine.reset(),
      cancel: () => engine.cancel(),
      setSpeed: (speed) => engine.setSpeed(speed),
      seek: (offsetMs) => engine.seek(offsetMs),
    }),
    [engine, snapshot],
  );
}

/**
 * Totally headless teardown helper for non-hook usage (tests, remounts):
 * clears the engine timer and drops subscribers without erasing the
 * persisted snapshot. Prefer the hook in components.
 */
export function disposeEngine(engine: PlaybackEngine): void {
  engine.dispose();
}
