/**
 * Engine-local types for the deterministic scenario playback engine.
 *
 * Lane ownership: `src/demo/engine/*` (issue #5). These shapes intentionally
 * mirror `docs/03_CONTRACTS.md` (`DemoPhase`, `DemoEvent`, `DemoScenario` and
 * the `PlaybackControls` contract) WITHOUT importing `src/demo/types.ts`,
 * which is owned by the Contracts lane (issue #2) and has not landed yet.
 * Every engine function accepts structurally-compatible objects, so once the
 * canonical types land the engine interoperates with zero changes: any
 * `DemoEvent`/`DemoScenario` from the contracts module satisfies these
 * interfaces. Do not redefine these in other lanes — import from here or,
 * once available, from `src/demo/types.ts`.
 *
 * Demo-only: all events are preauthored fixture records with relative
 * `offsetMs` values. The engine performs no network access, no inference,
 * and generates no random events.
 */

/** Playback phases, identical to the `DemoPhase` contract. */
export type EnginePhase =
  | 'idle'
  | 'queued'
  | 'recon'
  | 'planning'
  | 'policy'
  | 'preparing'
  | 'executing'
  | 'verifying'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled';

/** Minimal structural event shape. Compatible with contract `DemoEvent`. */
export interface EngineEvent {
  id: string;
  seq: number;
  offsetMs: number;
  phase: EnginePhase;
  actor: 'agent' | 'policy' | 'runner' | 'oracle' | 'system';
  title: string;
  summary: string;
  detail?: string;
  request?: string;
  response?: string;
  evidenceId?: string;
  status: 'pending' | 'running' | 'done' | 'blocked' | 'failed';
}

/** Minimal structural scenario shape. Compatible with contract `DemoScenario`. */
export interface EngineScenario {
  id: string;
  title: string;
  description: string;
  projectId: string;
  events: EngineEvent[];
  replayEvents: EngineEvent[];
  findingIds: string[];
  durationMs: number;
}

/** Allowed playback speeds (contract: 0.5/1/2/4x). */
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;
export const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2, 4];

/** Lifecycle of the playback controller itself. */
export type EngineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'canceled';

/** Immutable snapshot published to subscribers on every state change. */
export interface PlaybackSnapshot {
  readonly scenarioId: string | null;
  readonly status: EngineStatus;
  readonly elapsedMs: number;
  readonly durationMs: number;
  readonly speed: PlaybackSpeed;
  /** Visible events in deterministic reveal order. */
  readonly visibleEvents: readonly EngineEvent[];
  /** ids of visible events, for cheap comparisons. */
  readonly visibleEventIds: readonly string[];
  /** Current scenario phase derived from the latest visible event. */
  readonly phase: EnginePhase;
}

/** Options for `start()`. `url` is display-only text, never fetched. */
export interface StartOptions {
  url?: string;
}
