/**
 * Public surface of the recording operator console (issue #13).
 * Other lanes should not import from here; the engine lane may inject a
 * `RecordingEnginePort` into `RecordingConsole` once it lands.
 */
export { RecordingConsole } from './RecordingConsole';
export {
  RECORDING_PRESETS,
  findPreset,
  chapterAt,
  formatClock,
} from './presets';
export {
  RECORDING_STORAGE_KEY,
  ENGINE_STORAGE_KEY,
  loadRecordingState,
  saveRecordingState,
  parseRecordingState,
  resetSampleAccount,
} from './storage';
export { createDeterministicStandaloneEngine } from './engine-adapter';
export type { RecordingEnginePort } from './engine-adapter';
export {
  RECORDING_SPEEDS,
  DEFAULT_CAPTURE_STATE,
  DEFAULT_RECORDING_STATE,
} from './types';
export type {
  RecordingSpeed,
  RecordingStatus,
  RecordingChapter,
  RecordingPreset,
  RecordingCaptureState,
  PersistedRecordingState,
  RecordingVisibleEvent,
  RecordingSnapshot,
} from './types';
