/**
 * Recording operator-console types (issue #13).
 *
 * Lane ownership: `src/features/recording/*` (recording lane only).
 *
 * These shapes intentionally mirror `docs/03_CONTRACTS.md` WITHOUT importing
 * `src/demo/types.ts` (contracts lane, issue #2, not yet merged). Every
 * interface below is structural: once the canonical modules land, the
 * adapters in `engine-adapter.ts` accept them with zero changes. Do not
 * redefine these in other lanes.
 *
 * Demo-only: everything here drives preauthored, deterministic sample
 * timelines. No scans, API calls, auth, Vultr, inference, or databases.
 */

/** Allowed demo clock multipliers (contract: 0.5/1/2/4x). */
export type RecordingSpeed = 0.5 | 1 | 2 | 4;
export const RECORDING_SPEEDS: readonly RecordingSpeed[] = [0.5, 1, 2, 4];

/** Transport lifecycle of the operator console playback. */
export type RecordingStatus = 'idle' | 'running' | 'paused' | 'completed';

/** One chapter checkpoint the operator can seek to while recording. */
export interface RecordingChapter {
  /** Stable checkpoint id, e.g. `invoice-baseline-200`. */
  id: string;
  /** Virtual scenario time of the checkpoint in milliseconds. */
  offsetMs: number;
  /** Short label shown on the checkpoint button. */
  label: string;
  /** App route the operator should have framed at this checkpoint. */
  route: string;
  /** One-line operator cue from the shooting script. */
  cue: string;
}

/**
 * A scenario preset selectable in the console. `scenarioId` must match the
 * canonical fixture index owned by the seed-data lane (issue #4) once it
 * lands; until then it is an opaque, display-only key and playback uses the
 * preset's own chapter timings deterministically.
 */
export interface RecordingPreset {
  /** Canonical scenario id (seed-data lane owns the fixture record). */
  scenarioId: string;
  /** Project the scenario belongs to (display only). */
  projectName: string;
  /** Short preset title shown in the selector. */
  title: string;
  /** One-line description shown under the selector. */
  description: string;
  /** Full virtual duration in milliseconds. */
  durationMs: number;
  /** Chapter checkpoints in ascending `offsetMs` order. */
  chapters: RecordingChapter[];
}

/** Persisted capture preferences for repeatable 1440x900 recording. */
export interface RecordingCaptureState {
  /** Hide cursor tooltips / hover popups while recording. */
  hideCursorHelpers: boolean;
  /** Hide decorative floating animations while recording. */
  reduceMotionExtras: boolean;
  /** Operator's target frame label (display only, never enforced). */
  framePreset: '1440x900';
}

/** Full persisted console state (browser storage only, SSR-safe). */
export interface PersistedRecordingState {
  v: 1;
  scenarioId: string;
  elapsedMs: number;
  speed: RecordingSpeed;
  status: RecordingStatus;
  capture: RecordingCaptureState;
}

/** Defaults used for first run and for "reset sample account". */
export const DEFAULT_CAPTURE_STATE: RecordingCaptureState = {
  hideCursorHelpers: true,
  reduceMotionExtras: false,
  framePreset: '1440x900',
};

export const DEFAULT_RECORDING_STATE: PersistedRecordingState = {
  v: 1,
  scenarioId: 'scenario-bola-invoice',
  elapsedMs: 0,
  speed: 1,
  status: 'idle',
  capture: { ...DEFAULT_CAPTURE_STATE },
};

/** Minimal structural event consumed by the console (mirrors `DemoEvent`). */
export interface RecordingVisibleEvent {
  id: string;
  seq: number;
  offsetMs: number;
  title: string;
  summary: string;
}

/** Snapshot published by any compatible playback engine. */
export interface RecordingSnapshot {
  scenarioId: string | null;
  status: RecordingStatus;
  elapsedMs: number;
  durationMs: number;
  speed: RecordingSpeed;
  visibleCount: number;
}
