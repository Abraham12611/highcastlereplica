/**
 * Public surface of the deterministic scenario playback engine (issue #5).
 * Feature lanes consume `createEngine` (vanilla) or `usePlayback` (React);
 * scenario fixtures are supplied by the caller via `resolveScenario`.
 */
export { createEngine, ENGINE_STORAGE_KEY } from './store';
export type {
  CreateEngineOptions,
  EngineStorage,
  EngineTimers,
  PlaybackEngine,
} from './store';
export {
  clampSeekTarget,
  durationOf,
  effectiveOffset,
  phaseAt,
  sortEvents,
  visibleEventsAt,
} from './scheduler';
export type {
  EngineEvent,
  EnginePhase,
  EngineScenario,
  EngineStatus,
  PlaybackSnapshot,
  PlaybackSpeed,
  StartOptions,
} from './types';
export { PLAYBACK_SPEEDS } from './types';
export { disposeEngine, usePlayback } from './usePlayback';
export type { UsePlaybackResult } from './usePlayback';
