'use client';

/**
 * Recording operator console (issue #13).
 *
 * A clearly separate, hidden operator tool at `/recording` (kept OUT of the
 * main navigation by never linking it from the shell). Scenario preset
 * selector, pause/resume, speed, chapter checkpoint seek, restart, reset
 * sample account, capture-state display/restore, recording-URL copy, and
 * accessible keyboard shortcuts.
 *
 * Guarantees:
 * - The "Simulated demo" indicator is always rendered. There is
 *   deliberately NO control that hides it.
 * - Deterministic and demo-only: playback state is a pure function of the
 *   persisted virtual clock; no scans, fetches, auth, or databases.
 * - Browser storage is touched only after mount (SSR-safe).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDeterministicStandaloneEngine,
  type RecordingEnginePort,
} from './engine-adapter';
import {
  RECORDING_PRESETS,
  chapterAt,
  findPreset,
  formatClock,
} from './presets';
import './recording.css';
import {
  loadRecordingState,
  resetSampleAccount,
  saveRecordingState,
} from './storage';
import {
  DEFAULT_RECORDING_STATE,
  RECORDING_SPEEDS,
  type PersistedRecordingState,
  type RecordingCaptureState,
  type RecordingSnapshot,
  type RecordingSpeed,
} from './types';

interface RecordingConsoleProps {
  /**
   * Real playback engine (engine lane). When omitted, the console uses its
   * deterministic standalone fallback so the route works before the engine
   * lane merges.
   */
  engine?: RecordingEnginePort;
  /** Override presets (defaults to the storyboard preset catalog). */
  scenarioIds?: string[];
}

const SEEK_STEP_MS = 10_000;

function readDeepLink(): { scenarioId?: string; elapsedMs?: number; speed?: RecordingSpeed } {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const out: { scenarioId?: string; elapsedMs?: number; speed?: RecordingSpeed } = {};
    const scenarioId = params.get('scenario');
    if (scenarioId && findPreset(scenarioId)) out.scenarioId = scenarioId;
    const t = params.get('t');
    if (t !== null) {
      const ms = Number(t);
      if (Number.isFinite(ms) && ms >= 0) out.elapsedMs = ms;
    }
    const speed = Number(params.get('speed'));
    if (RECORDING_SPEEDS.includes(speed as RecordingSpeed)) {
      out.speed = speed as RecordingSpeed;
    }
    return out;
  } catch {
    return {};
  }
}

export function RecordingConsole(props: RecordingConsoleProps): React.JSX.Element {
  const injectedEngine = props.engine;
  const [persisted, setPersisted] = useState<PersistedRecordingState>(
    DEFAULT_RECORDING_STATE,
  );
  const [snapshot, setSnapshot] = useState<RecordingSnapshot>({
    scenarioId: DEFAULT_RECORDING_STATE.scenarioId,
    status: 'idle',
    elapsedMs: 0,
    durationMs: findPreset(DEFAULT_RECORDING_STATE.scenarioId)?.durationMs ?? 0,
    speed: 1,
    visibleCount: 0,
  });
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [resetArmed, setResetArmed] = useState<boolean>(false);
  const engineRef = useRef<RecordingEnginePort | null>(null);
  const hydratedRef = useRef<boolean>(false);

  const presets = useMemo(() => {
    if (!props.scenarioIds) return RECORDING_PRESETS;
    const wanted = new Set(props.scenarioIds);
    const filtered = RECORDING_PRESETS.filter((p) => wanted.has(p.scenarioId));
    return filtered.length > 0 ? filtered : RECORDING_PRESETS;
  }, [props.scenarioIds]);

  const activePreset =
    findPreset(snapshot.scenarioId ?? persisted.scenarioId) ??
    findPreset(persisted.scenarioId) ??
    presets[0];
  const activeChapter = useMemo(
    () => (activePreset ? chapterAt(activePreset, snapshot.elapsedMs) : undefined),
    [activePreset, snapshot.elapsedMs],
  );

  // Hydrate: storage + deep link, after mount only. Never autoplays.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = loadRecordingState();
    const link = readDeepLink();
    const merged: PersistedRecordingState = {
      ...stored,
      scenarioId:
        link.scenarioId && findPreset(link.scenarioId)
          ? link.scenarioId
          : stored.scenarioId,
      elapsedMs: link.elapsedMs ?? stored.elapsedMs,
      speed: link.speed ?? stored.speed,
    };
    if (!findPreset(merged.scenarioId)) {
      merged.scenarioId = presets[0]?.scenarioId ?? merged.scenarioId;
    }
    setPersisted(merged);
    const engine =
      injectedEngine ??
      createDeterministicStandaloneEngine({
        scenarioId: merged.scenarioId,
        speed: merged.speed,
        elapsedMs: 0,
      });
    if (!injectedEngine) {
      // Park the fallback at the restored clock without playing.
      engine.seek(merged.elapsedMs);
      engine.setSpeed(merged.speed);
    }
    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());
    const unsubscribe = engine.subscribe(() => {
      const next = engine.getSnapshot();
      setSnapshot(next);
      setPersisted((prev) => {
        const updated: PersistedRecordingState = {
          ...prev,
          scenarioId: next.scenarioId ?? prev.scenarioId,
          elapsedMs: next.elapsedMs,
          speed: next.speed,
          status: next.status,
        };
        saveRecordingState(updated);
        return updated;
      });
    });
    return () => {
      unsubscribe();
      if (!injectedEngine) engine.dispose();
      engineRef.current = null;
    };
    // Intentionally runs once: hydration + engine wiring.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withEngine = useCallback((fn: (engine: RecordingEnginePort) => void) => {
    const engine = engineRef.current;
    if (!engine) return;
    fn(engine);
    setSnapshot(engine.getSnapshot());
  }, []);

  const handleSelectScenario = useCallback(
    (scenarioId: string) => {
      withEngine((engine) => {
        engine.reset();
        engine.start(scenarioId);
      });
      setResetArmed(false);
    },
    [withEngine],
  );

  const handleRestart = useCallback(() => {
    const id = snapshot.scenarioId ?? persisted.scenarioId;
    withEngine((engine) => {
      engine.reset();
      engine.start(id);
    });
  }, [persisted.scenarioId, snapshot.scenarioId, withEngine]);

  const handleResetAccount = useCallback(() => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    const defaults = resetSampleAccount();
    setPersisted(defaults);
    setResetArmed(false);
    setCopyStatus('Sample account reset to deterministic defaults.');
    withEngine((engine) => {
      engine.reset();
    });
  }, [resetArmed, withEngine]);

  const handleCaptureChange = useCallback(
    (patch: Partial<RecordingCaptureState>) => {
      setPersisted((prev) => {
        const updated: PersistedRecordingState = {
          ...prev,
          capture: { ...prev.capture, ...patch },
        };
        saveRecordingState(updated);
        return updated;
      });
    },
    [],
  );

  const handleRestoreCapture = useCallback(() => {
    const stored = loadRecordingState();
    setPersisted((prev) => ({ ...prev, capture: stored.capture }));
    setCopyStatus('Capture state restored from browser storage.');
  }, []);

  const handleCopyUrl = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('scenario', snapshot.scenarioId ?? persisted.scenarioId);
    url.searchParams.set('t', String(Math.floor(snapshot.elapsedMs)));
    url.searchParams.set('speed', String(snapshot.speed));
    const text = url.toString();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopyStatus('Recording URL copied.');
    } catch {
      setCopyStatus(`Copy failed — URL: ${text}`);
    }
  }, [persisted.scenarioId, snapshot.elapsedMs, snapshot.scenarioId, snapshot.speed]);

  // Keyboard shortcuts (ignored while typing). Space toggles pause/resume,
  // arrows seek ±10s, Shift+arrows jump chapters, 1–4 set speed, R restarts.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const engine = engineRef.current;
      if (!engine) return;
      const snap = engine.getSnapshot();
      const preset = findPreset(snap.scenarioId ?? '');
      if (event.key === ' ') {
        event.preventDefault();
        if (snap.status === 'running') engine.pause();
        else engine.resume();
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const delta = event.key === 'ArrowRight' ? SEEK_STEP_MS : -SEEK_STEP_MS;
        if (event.shiftKey && preset) {
          const chapters = preset.chapters;
          const idx = chapters.findIndex((c) => c.offsetMs > snap.elapsedMs);
          if (event.key === 'ArrowRight') {
            const next = idx === -1 ? null : chapters[idx];
            if (next) engine.seek(next.offsetMs);
            else engine.seek(snap.durationMs);
          } else {
            const prev = [...chapters]
              .reverse()
              .find((c) => c.offsetMs < snap.elapsedMs - 1);
            engine.seek(prev ? prev.offsetMs : 0);
          }
        } else {
          engine.seek(snap.elapsedMs + delta);
        }
      } else if (event.key >= '1' && event.key <= '4') {
        const speed = RECORDING_SPEEDS[Number(event.key) - 1];
        if (speed) engine.setSpeed(speed);
      } else if (event.key === 'r' || event.key === 'R') {
        const id = snap.scenarioId ?? DEFAULT_RECORDING_STATE.scenarioId;
        engine.reset();
        engine.start(id);
      }
      setSnapshot(engine.getSnapshot());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const progress = snapshot.durationMs > 0
    ? Math.min(100, (snapshot.elapsedMs / snapshot.durationMs) * 100)
    : 0;
  const isRunning = snapshot.status === 'running';

  return (
    <div className="rc-root" data-testid="recording-console">
      <div className="rc-header">
        <div>
          <h1>Recording operator console</h1>
          <p>
            Hidden operator tool for the simulated walkthrough. Not linked
            from the main navigation. Everything here drives preauthored
            sample timelines.
          </p>
        </div>
        <span className="rc-badge" title="This surface is always a simulation">
          <span className="rc-badge-dot" aria-hidden="true" />
          Simulated demo
        </span>
      </div>

      <div className="rc-grid">
        <section className="rc-panel" aria-labelledby="rc-transport-h">
          <h2 id="rc-transport-h">Playback transport</h2>
          <ul className="rc-readout" aria-live="off">
            <li>
              Clock <strong>{formatClock(snapshot.elapsedMs)}</strong> /{' '}
              {formatClock(snapshot.durationMs)} ({progress.toFixed(0)}%)
            </li>
            <li>
              Status <strong>{snapshot.status}</strong>
            </li>
            <li>
              Revealed <strong>{snapshot.visibleCount}</strong> markers
            </li>
            {activeChapter && (
              <li>
                Frame <span className="rc-phase">{activeChapter.route}</span>
              </li>
            )}
          </ul>

          <div className="rc-transport" role="group" aria-label="Transport">
            {!isRunning ? (
              <button
                type="button"
                className="rc-btn rc-btn-primary"
                onClick={() =>
                  withEngine((engine) => {
                    if (snapshot.status === 'idle') {
                      engine.start(snapshot.scenarioId ?? persisted.scenarioId);
                    } else {
                      engine.resume();
                    }
                  })
                }
              >
                {snapshot.status === 'idle' ? 'Start' : 'Resume'}
              </button>
            ) : (
              <button
                type="button"
                className="rc-btn rc-btn-primary"
                onClick={() => withEngine((engine) => engine.pause())}
              >
                Pause
              </button>
            )}
            <button type="button" className="rc-btn" onClick={handleRestart}>
              Restart scene
            </button>
          </div>

          <div className="rc-speed" role="group" aria-label="Playback speed">
            <span id="rc-speed-label">Speed</span>
            {RECORDING_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                aria-pressed={snapshot.speed === speed}
                aria-label={`Set speed ${speed}x`}
                onClick={() => withEngine((engine) => engine.setSpeed(speed))}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="rc-seek">
            <label htmlFor="rc-scrub">
              <span>Scrub timeline</span>
              <span>
                {formatClock(snapshot.elapsedMs)} / {formatClock(snapshot.durationMs)}
              </span>
            </label>
            <input
              id="rc-scrub"
              type="range"
              min={0}
              max={snapshot.durationMs}
              step={1000}
              value={Math.min(snapshot.elapsedMs, snapshot.durationMs)}
              onChange={(event) =>
                withEngine((engine) => engine.seek(Number(event.target.value)))
              }
            />
          </div>

          {activePreset && (
            <>
              <h2 style={{ marginTop: '0.9rem' }}>Chapter checkpoints</h2>
              <p className="rc-hint">
                Seek to a storyboard checkpoint. Keep the listed route framed
                while recording that beat.
              </p>
              <ol className="rc-chapters">
                {activePreset.chapters.map((chapter) => {
                  const isActive = activeChapter?.id === chapter.id;
                  return (
                    <li key={chapter.id}>
                      <button
                        type="button"
                        className={isActive ? 'rc-active' : undefined}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() =>
                          withEngine((engine) => engine.seek(chapter.offsetMs))
                        }
                      >
                        <time>{chapter.label}</time>
                        <span className="rc-route">{chapter.route}</span>
                        <span className="rc-cue">{chapter.cue}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <div>
          <section className="rc-panel" aria-labelledby="rc-preset-h">
            <h2 id="rc-preset-h">Scenario preset</h2>
            <p className="rc-hint">
              Selecting a preset restarts playback on that sample scenario.
            </p>
            <div className="rc-presets" role="radiogroup" aria-label="Scenario preset">
              {presets.map((preset) => (
                <label key={preset.scenarioId}>
                  <input
                    type="radio"
                    name="rc-preset"
                    value={preset.scenarioId}
                    checked={
                      (snapshot.scenarioId ?? persisted.scenarioId) ===
                      preset.scenarioId
                    }
                    onChange={() => handleSelectScenario(preset.scenarioId)}
                  />
                  <strong>{preset.title}</strong>
                  <small>
                    {preset.projectName} · {formatClock(preset.durationMs)} ·{' '}
                    {preset.description}
                  </small>
                </label>
              ))}
            </div>
          </section>

          <section
            className="rc-panel"
            style={{ marginTop: '1rem' }}
            aria-labelledby="rc-capture-h"
          >
            <h2 id="rc-capture-h">Capture state</h2>
            <p className="rc-hint">
              Target frame <strong>1440×900</strong>. The Simulated demo badge
              above is permanent — this console offers no way to hide it.
            </p>
            <label className="rc-check">
              <input
                type="checkbox"
                checked={persisted.capture.hideCursorHelpers}
                onChange={(event) =>
                  handleCaptureChange({ hideCursorHelpers: event.target.checked })
                }
              />
              <span>
                Hide cursor tooltips / hover popups
                <small>Applies to the recording overlay when supported.</small>
              </span>
            </label>
            <label className="rc-check">
              <input
                type="checkbox"
                checked={persisted.capture.reduceMotionExtras}
                onChange={(event) =>
                  handleCaptureChange({ reduceMotionExtras: event.target.checked })
                }
              />
              <span>
                Reduce decorative motion
                <small>Calms extras during takes; honors OS reduced-motion.</small>
              </span>
            </label>
            <div className="rc-actions">
              <button type="button" className="rc-btn" onClick={handleRestoreCapture}>
                Restore capture state
              </button>
              <button type="button" className="rc-btn" onClick={handleCopyUrl}>
                Copy recording URL
              </button>
            </div>
            <div className="rc-field" style={{ marginTop: '0.7rem' }}>
              <label htmlFor="rc-frame">Frame preset (display only)</label>
              <input
                id="rc-frame"
                type="text"
                readOnly
                value={`${persisted.capture.framePreset} · hideHelpers=${persisted.capture.hideCursorHelpers ? 'on' : 'off'} · calmMotion=${persisted.capture.reduceMotionExtras ? 'on' : 'off'}`}
              />
            </div>
          </section>

          <section
            className="rc-panel"
            style={{ marginTop: '1rem' }}
            aria-labelledby="rc-account-h"
          >
            <h2 id="rc-account-h">Sample account</h2>
            <p className="rc-hint">
              Clears persisted demo state (engine pass + console prefs) and
              returns to deterministic defaults. No servers involved.
            </p>
            <div className="rc-actions">
              <button
                type="button"
                className="rc-btn rc-btn-danger"
                aria-pressed={resetArmed}
                onClick={handleResetAccount}
              >
                {resetArmed ? 'Confirm reset' : 'Reset sample account'}
              </button>
            </div>
            <p className={`rc-status${copyStatus ? ' rc-ok' : ''}`} role="status">
              {copyStatus}
            </p>
          </section>

          <section
            className="rc-panel"
            style={{ marginTop: '1rem' }}
            aria-labelledby="rc-keys-h"
          >
            <h2 id="rc-keys-h">Keyboard shortcuts</h2>
            <ul className="rc-keys">
              <li><kbd>Space</kbd> pause / resume</li>
              <li><kbd>←</kbd> <kbd>→</kbd> seek ±10s</li>
              <li><kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> previous / next chapter</li>
              <li><kbd>1</kbd>–<kbd>4</kbd> speed 0.5x / 1x / 2x / 4x</li>
              <li><kbd>R</kbd> restart current scene</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="rc-notice" role="note">
        <strong>Deterministic sample data.</strong> Timelines, counts, and
        evidence shown through this console are preauthored fiction for the
        walkthrough video. Real URLs are display-only input and are never
        requested, scanned, or presented as findings.
      </div>
    </div>
  );
}
