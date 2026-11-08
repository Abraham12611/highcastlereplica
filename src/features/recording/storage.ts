/**
 * Browser-storage persistence for the recording console (issue #13).
 *
 * - SSR-safe: every helper no-ops (or returns defaults) when `localStorage`
 *   is unavailable, so server rendering never touches browser globals.
 * - Versioned payloads: unknown versions are discarded, never migrated
 *   with guesses.
 * - "Reset sample account" clears every `highcastle.demo.*` key (engine
 *   persistence owned by the engine lane, recording state owned here) and
 *   returns the deterministic defaults. No network, no inference.
 */
import {
  DEFAULT_CAPTURE_STATE,
  DEFAULT_RECORDING_STATE,
  RECORDING_SPEEDS,
  type PersistedRecordingState,
  type RecordingCaptureState,
  type RecordingSpeed,
  type RecordingStatus,
} from './types';

export const RECORDING_STORAGE_KEY = 'highcastle.demo.recording.v1';
/** Engine lane persistence key (owned by engine lane; cleared on reset). */
export const ENGINE_STORAGE_KEY = 'highcastle.demo.engine.v1';
const STORAGE_VERSION = 1;
const STATE_PREFIX = 'highcastle.demo.';

export interface RecordingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key?(index: number): string | null;
  readonly length?: number;
}

function browserStorage(): RecordingStorage | null {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage;
    }
  } catch {
    // Blocked storage / SSR: run without persistence.
  }
  return null;
}

function isValidSpeed(value: unknown): value is RecordingSpeed {
  return (RECORDING_SPEEDS as readonly unknown[]).includes(value);
}

function isValidStatus(value: unknown): value is RecordingStatus {
  return (
    value === 'idle' ||
    value === 'running' ||
    value === 'paused' ||
    value === 'completed'
  );
}

function sanitizeCapture(value: unknown): RecordingCaptureState {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_CAPTURE_STATE };
  }
  const record = value as Record<string, unknown>;
  return {
    hideCursorHelpers:
      typeof record['hideCursorHelpers'] === 'boolean'
        ? record['hideCursorHelpers']
        : DEFAULT_CAPTURE_STATE.hideCursorHelpers,
    reduceMotionExtras:
      typeof record['reduceMotionExtras'] === 'boolean'
        ? record['reduceMotionExtras']
        : DEFAULT_CAPTURE_STATE.reduceMotionExtras,
    framePreset: '1440x900',
  };
}

/** Parse and validate a persisted payload; `null` when absent or invalid. */
export function parseRecordingState(raw: string | null): PersistedRecordingState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (record['v'] !== STORAGE_VERSION) return null;
    if (typeof record['scenarioId'] !== 'string' || record['scenarioId'] === '') {
      return null;
    }
    const elapsedMs = record['elapsedMs'];
    if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs)) return null;
    if (!isValidSpeed(record['speed'])) return null;
    if (!isValidStatus(record['status'])) return null;
    return {
      v: STORAGE_VERSION,
      scenarioId: record['scenarioId'],
      elapsedMs: Math.max(0, elapsedMs),
      speed: record['speed'],
      // A reload never resumes motion on its own: a persisted `running`
      // pass parks as `paused` so refresh/resume is deterministic.
      status: record['status'] === 'running' ? 'paused' : record['status'],
      capture: sanitizeCapture(record['capture']),
    };
  } catch {
    return null;
  }
}

/** Load persisted console state, or deterministic defaults. */
export function loadRecordingState(
  storage: RecordingStorage | null = browserStorage(),
  key: string = RECORDING_STORAGE_KEY,
): PersistedRecordingState {
  if (!storage) return { ...DEFAULT_RECORDING_STATE, capture: { ...DEFAULT_CAPTURE_STATE } };
  return (
    parseRecordingState(safeGet(storage, key)) ?? {
      ...DEFAULT_RECORDING_STATE,
      capture: { ...DEFAULT_CAPTURE_STATE },
    }
  );
}

/** Persist console state; silently skips when storage is unavailable. */
export function saveRecordingState(
  state: PersistedRecordingState,
  storage: RecordingStorage | null = browserStorage(),
  key: string = RECORDING_STORAGE_KEY,
): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify({ ...state, v: STORAGE_VERSION }));
  } catch {
    // Quota / blocked storage: the console keeps running in memory.
  }
}

function safeGet(storage: RecordingStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Reset the sample account: remove every `highcastle.demo.*` key (engine
 * pass, recording console, and any sibling demo keys sharing the prefix),
 * then return deterministic defaults. The caller applies the returned state
 * to the live engine; this function performs no navigation or reload.
 */
export function resetSampleAccount(
  storage: RecordingStorage | null = browserStorage(),
): PersistedRecordingState {
  if (storage) {
    const keys: string[] = [];
    try {
      // Prefer prefix sweep so sibling demo lanes reset together.
      const length = storage.length ?? 0;
      if (typeof storage.key === 'function' && length > 0) {
        for (let i = 0; i < length; i += 1) {
          const k = storage.key(i);
          if (typeof k === 'string' && k.startsWith(STATE_PREFIX)) keys.push(k);
        }
      } else {
        keys.push(RECORDING_STORAGE_KEY, ENGINE_STORAGE_KEY);
      }
    } catch {
      keys.push(RECORDING_STORAGE_KEY, ENGINE_STORAGE_KEY);
    }
    const unique = new Set(keys.length > 0 ? keys : [RECORDING_STORAGE_KEY, ENGINE_STORAGE_KEY]);
    for (const k of unique) {
      try {
        storage.removeItem(k);
      } catch {
        // Continue clearing the remaining keys.
      }
    }
  }
  return {
    ...DEFAULT_RECORDING_STATE,
    capture: { ...DEFAULT_CAPTURE_STATE },
  };
}
