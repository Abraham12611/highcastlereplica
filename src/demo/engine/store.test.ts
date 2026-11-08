/**
 * Unit tests for the playback controller: order, pause/resume, speeds,
 * seek, reload hydration, finish-once, cancel, idempotent start, reset.
 * Runner-agnostic: `node:test` + `node:assert` only. Time is fully fake:
 * the engine's clock and timers are injected, so no real waiting occurs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, ENGINE_STORAGE_KEY, type PlaybackEngine } from './store';
import type { EngineEvent, EngineScenario, PlaybackSpeed } from './types';
import type { EngineStorage } from './store';

function makeEvent(
  id: string,
  offsetMs: number,
  seq: number,
  phase: EngineEvent['phase'] = 'recon',
): EngineEvent {
  return {
    id,
    seq,
    offsetMs,
    phase,
    actor: 'agent',
    title: `title ${id}`,
    summary: `summary ${id}`,
    status: 'pending',
  };
}

function makeScenario(): EngineScenario {
  return {
    id: 'scn-invoice-bola',
    title: 'Invoice BOLA (simulated)',
    description: 'Deterministic fixture scenario for engine tests.',
    projectId: 'proj-invoicecloud',
    events: [
      makeEvent('e1', 0, 1, 'queued'),
      makeEvent('e2', 1000, 2, 'recon'),
      makeEvent('e3', 1000, 3, 'planning'),
      makeEvent('e4', 2500, 4, 'executing'),
      makeEvent('e5', 4000, 5, 'verifying'),
    ],
    replayEvents: [],
    findingIds: ['f1'],
    durationMs: 5000,
  };
}

function makeMemoryStorage(seed?: Record<string, string>): EngineStorage {
  const data = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    getItem: (key) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

interface Harness {
  engine: PlaybackEngine;
  /** Advance fake real-time by `dtMs`; fires the engine tick. */
  tickReal: (dtMs: number) => void;
  revealed: EngineEvent[];
  completions: string[];
  intervalCount: () => number;
  liveIntervals: () => number;
}

function makeHarness(
  scenario: EngineScenario,
  storage: EngineStorage,
  opts?: { speed?: PlaybackSpeed },
): Harness {
  let fakeNow = 0;
  let activeIntervals = 0;
  let createdIntervals = 0;
  let intervalCb: (() => void) | null = null;
  const revealed: EngineEvent[] = [];
  const completions: string[] = [];
  const engine = createEngine({
    resolveScenario: (id) => (id === scenario.id ? scenario : null),
    storage,
    now: () => fakeNow,
    timers: {
      setInterval: (cb) => {
        activeIntervals += 1;
        createdIntervals += 1;
        intervalCb = cb;
        return {};
      },
      clearInterval: () => {
        if (intervalCb !== null) activeIntervals -= 1;
        intervalCb = null;
      },
    },
    onEventsRevealed: (events) => revealed.push(...events),
    onComplete: (id) => completions.push(id),
  });
  if (opts?.speed !== undefined) engine.setSpeed(opts.speed);
  return {
    engine,
    tickReal: (dtMs) => {
      fakeNow += dtMs;
      intervalCb?.();
    },
    revealed,
    completions,
    intervalCount: () => createdIntervals,
    liveIntervals: () => activeIntervals,
  };
}

describe('ordering and completion', () => {
  it('reveals every event exactly once in (offset, seq) order, then completes once', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    // e1 sits at offset 0: visible + reported immediately on start.
    assert.deepEqual(h.revealed.map((event) => event.id), ['e1']);
    h.tickReal(1000); // t=1000 virtual (1x)
    assert.deepEqual(h.revealed.map((event) => event.id), ['e1', 'e2', 'e3']);
    h.tickReal(1500); // t=2500
    assert.deepEqual(h.revealed.map((event) => event.id), ['e1', 'e2', 'e3', 'e4']);
    h.tickReal(1500); // t=4000
    assert.deepEqual(h.revealed.map((event) => event.id), [
      'e1',
      'e2',
      'e3',
      'e4',
      'e5',
    ]);
    assert.equal(h.engine.getSnapshot().status, 'running');
    h.tickReal(1000); // t=5000 = duration
    const snapshot = h.engine.getSnapshot();
    assert.equal(snapshot.status, 'completed');
    assert.equal(snapshot.visibleEvents.length, 5);
    assert.deepEqual(h.completions, [scenario.id]);
    // Extra ticks after completion change nothing and never refire.
    h.tickReal(5000);
    assert.deepEqual(h.completions, [scenario.id]);
    assert.equal(h.revealed.length, 5);
    assert.equal(h.liveIntervals(), 0);
    h.engine.dispose();
  });

  it('getVisibleEvents() always matches the snapshot in reveal order', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.tickReal(1200);
    assert.deepEqual(
      h.engine.getVisibleEvents().map((event) => event.id),
      h.engine.getSnapshot().visibleEventIds.slice(),
    );
    h.engine.dispose();
  });
});

describe('pause / resume', () => {
  it('freezes the virtual clock while paused and continues on resume', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.tickReal(1000);
    assert.equal(h.engine.getSnapshot().elapsedMs, 1000);
    h.engine.pause();
    assert.equal(h.engine.getSnapshot().status, 'paused');
    assert.equal(h.liveIntervals(), 0);
    h.tickReal(5000); // no live timer: nothing advances
    assert.equal(h.engine.getSnapshot().elapsedMs, 1000);
    h.engine.resume();
    h.tickReal(500);
    assert.equal(h.engine.getSnapshot().elapsedMs, 1500);
    assert.equal(h.engine.getSnapshot().status, 'running');
    h.engine.dispose();
  });

  it('pause and resume are no-ops outside running/paused states', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.pause(); // idle: no-op
    h.engine.resume(); // idle: no-op
    assert.equal(h.engine.getSnapshot().status, 'idle');
    h.engine.start('unknown-scenario');
    assert.equal(h.engine.getSnapshot().status, 'idle');
    h.engine.dispose();
  });
});

describe('speeds', () => {
  it('scales virtual time by 2x and 0.5x; rejects unknown speeds', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.engine.setSpeed(2);
    h.tickReal(500);
    assert.equal(h.engine.getSnapshot().elapsedMs, 1000);
    h.engine.setSpeed(0.5);
    h.tickReal(1000);
    assert.equal(h.engine.getSnapshot().elapsedMs, 1500);
    h.engine.setSpeed(4);
    h.tickReal(250);
    assert.equal(h.engine.getSnapshot().elapsedMs, 2500);
    h.engine.setSpeed(99 as PlaybackSpeed); // invalid: ignored
    assert.equal(h.engine.getSnapshot().speed, 4);
    h.engine.dispose();
  });
});

describe('seek', () => {
  it('seek-forward reveals, seek-backward hides (snapshot is source of truth)', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.engine.seek(2500);
    assert.deepEqual(
      h.engine.getSnapshot().visibleEventIds.slice(),
      ['e1', 'e2', 'e3', 'e4'],
    );
    h.engine.seek(100);
    assert.deepEqual(h.engine.getSnapshot().visibleEventIds.slice(), ['e1']);
    // Clock keeps running after seek while running.
    h.tickReal(900);
    assert.deepEqual(
      h.engine.getSnapshot().visibleEventIds.slice(),
      ['e1', 'e2', 'e3'],
    );
    h.engine.dispose();
  });

  it('clamps seek targets into [0, durationMs]', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.engine.seek(99999);
    assert.equal(h.engine.getSnapshot().elapsedMs, 5000);
    h.engine.seek(-10);
    assert.equal(h.engine.getSnapshot().elapsedMs, 0);
    h.engine.dispose();
  });

  it('seek from a terminal state parks as paused (replayable)', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.engine.cancel();
    assert.equal(h.engine.getSnapshot().status, 'canceled');
    h.engine.seek(1000);
    const snapshot = h.engine.getSnapshot();
    assert.equal(snapshot.status, 'paused');
    assert.equal(snapshot.elapsedMs, 1000);
    h.engine.dispose();
  });

  it('seek with no active scenario is a no-op', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.seek(1000);
    assert.equal(h.engine.getSnapshot().status, 'idle');
    h.engine.dispose();
  });
});

describe('reload hydration and recovery', () => {
  it('restores the exact revealed set as paused after a reload (never autoplays)', () => {
    const scenario = makeScenario();
    const storage = makeMemoryStorage();
    const first = makeHarness(scenario, storage);
    first.engine.start(scenario.id);
    first.tickReal(1500);
    first.engine.pause();
    const before = first.engine.getSnapshot();
    assert.equal(before.status, 'paused');

    // Simulate a page reload: brand-new engine, same storage.
    const second = makeHarness(scenario, storage);
    const after = second.engine.getSnapshot();
    assert.equal(after.scenarioId, scenario.id);
    assert.equal(after.status, 'paused');
    assert.equal(after.elapsedMs, before.elapsedMs);
    assert.deepEqual(after.visibleEventIds.slice(), before.visibleEventIds.slice());
    // Resume continues deterministically from the restored position.
    second.engine.resume();
    second.tickReal(1000);
    assert.equal(
      second.engine.getSnapshot().elapsedMs,
      before.elapsedMs + 1000,
    );
    first.engine.dispose();
    second.engine.dispose();
  });

  it('parks a snapshot left running as paused on reload', () => {
    const scenario = makeScenario();
    const storage = makeMemoryStorage();
    const first = makeHarness(scenario, storage);
    first.engine.start(scenario.id);
    first.tickReal(800); // still running; persisted as running
    const second = makeHarness(scenario, storage);
    assert.equal(second.engine.getSnapshot().status, 'paused');
    assert.equal(second.engine.getSnapshot().elapsedMs, 800);
    first.engine.dispose();
    second.engine.dispose();
  });

  it('discards corrupt storage and starts clean', () => {
    const scenario = makeScenario();
    const storage = makeMemoryStorage({
      [ENGINE_STORAGE_KEY]: '{not-json',
    });
    const h = makeHarness(scenario, storage);
    assert.equal(h.engine.getSnapshot().status, 'idle');
    h.engine.start(scenario.id);
    assert.equal(h.engine.getSnapshot().status, 'running');
    h.engine.dispose();
  });
});

describe('cancel, reset, idempotent start', () => {
  it('cancel freezes playback with zero live timers', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.tickReal(1000);
    h.engine.cancel();
    assert.equal(h.engine.getSnapshot().status, 'canceled');
    assert.equal(h.liveIntervals(), 0);
    const elapsed = h.engine.getSnapshot().elapsedMs;
    h.tickReal(5000);
    assert.equal(h.engine.getSnapshot().elapsedMs, elapsed);
    assert.equal(h.engine.getSnapshot().status, 'canceled');
    // A canceled run can be restarted deterministically.
    h.engine.start(scenario.id);
    assert.equal(h.engine.getSnapshot().status, 'running');
    assert.equal(h.engine.getSnapshot().elapsedMs, 0);
    h.engine.dispose();
  });

  it('start() on the active scenario is idempotent: one timer, no duplicate reveals', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    h.engine.start(scenario.id);
    h.engine.start(scenario.id);
    assert.equal(h.intervalCount(), 1);
    h.tickReal(1000);
    assert.deepEqual(h.revealed.map((event) => event.id), ['e1', 'e2', 'e3']);
    h.engine.dispose();
  });

  it('reset() returns to idle and clears persisted state', () => {
    const scenario = makeScenario();
    const storage = makeMemoryStorage();
    const h = makeHarness(scenario, storage);
    h.engine.start(scenario.id);
    h.tickReal(1000);
    h.engine.reset();
    const snapshot = h.engine.getSnapshot();
    assert.equal(snapshot.status, 'idle');
    assert.equal(snapshot.scenarioId, null);
    assert.equal(snapshot.elapsedMs, 0);
    assert.equal(storage.getItem(ENGINE_STORAGE_KEY), null);
    // A fresh engine after reset hydrates to idle.
    const next = makeHarness(scenario, storage);
    assert.equal(next.engine.getSnapshot().status, 'idle');
    h.engine.dispose();
    next.engine.dispose();
  });

  it('subscribe notifies on change and stops after unsubscribe', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    let calls = 0;
    const unsubscribe = h.engine.subscribe(() => {
      calls += 1;
    });
    h.engine.start(scenario.id);
    assert.ok(calls >= 1);
    unsubscribe();
    const before = calls;
    h.tickReal(500);
    assert.equal(calls, before);
    h.engine.dispose();
  });

  it('dispose() clears the live timer and is safe to call twice', () => {
    const scenario = makeScenario();
    const h = makeHarness(scenario, makeMemoryStorage());
    h.engine.start(scenario.id);
    assert.equal(h.liveIntervals(), 1);
    h.engine.dispose();
    assert.equal(h.liveIntervals(), 0);
    h.engine.dispose();
    h.tickReal(1000); // no timer: engine already torn down
    assert.equal(h.engine.getSnapshot().elapsedMs, 0);
  });
});
