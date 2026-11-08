/**
 * Unit tests for the pure deterministic scheduling core.
 * Runner-agnostic: uses only `node:test` + `node:assert` (no dependencies).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampSeekTarget,
  durationOf,
  effectiveOffset,
  phaseAt,
  sortEvents,
  visibleEventsAt,
} from './scheduler';
import type { EngineEvent } from './types';

let seqCounter = 0;
function makeEvent(partial: Partial<EngineEvent> & { id: string }): EngineEvent {
  seqCounter += 1;
  return {
    seq: seqCounter,
    offsetMs: 0,
    phase: 'recon',
    actor: 'agent',
    title: partial.id,
    summary: `summary ${partial.id}`,
    status: 'pending',
    ...partial,
  } as EngineEvent;
}

describe('effectiveOffset', () => {
  it('clamps negative offsets to 0', () => {
    assert.equal(effectiveOffset({ offsetMs: -500 }), 0);
  });

  it('passes through finite non-negative offsets', () => {
    assert.equal(effectiveOffset({ offsetMs: 2500 }), 2500);
    assert.equal(effectiveOffset({ offsetMs: 0 }), 0);
  });
});

describe('sortEvents', () => {
  it('orders by offset, then seq, then id — regardless of input order', () => {
    const c = makeEvent({ id: 'c', offsetMs: 1000, seq: 3 });
    const a = makeEvent({ id: 'a', offsetMs: 0, seq: 1 });
    const b = makeEvent({ id: 'b', offsetMs: 1000, seq: 2 });
    const ordered = sortEvents([c, b, a]).map((event) => event.id);
    assert.deepEqual(ordered, ['a', 'b', 'c']);
  });

  it('breaks offset+seq ties deterministically by id', () => {
    const z = makeEvent({ id: 'z', offsetMs: 100, seq: 1 });
    const m = makeEvent({ id: 'm', offsetMs: 100, seq: 1 });
    const ordered = sortEvents([z, m]).map((event) => event.id);
    assert.deepEqual(ordered, ['m', 'z']);
  });

  it('does not mutate the input array', () => {
    const b = makeEvent({ id: 'b', offsetMs: 200, seq: 2 });
    const a = makeEvent({ id: 'a', offsetMs: 100, seq: 1 });
    const input = [b, a];
    sortEvents(input);
    assert.deepEqual(input.map((event) => event.id), ['b', 'a']);
  });
});

describe('visibleEventsAt', () => {
  it('reveals events with offsetMs <= elapsed (inclusive boundary)', () => {
    const events = [
      makeEvent({ id: 'e1', offsetMs: 0, seq: 1 }),
      makeEvent({ id: 'e2', offsetMs: 1000, seq: 2 }),
      makeEvent({ id: 'e3', offsetMs: 2000, seq: 3 }),
    ];
    assert.deepEqual(
      visibleEventsAt(events, 1000).map((event) => event.id),
      ['e1', 'e2'],
    );
    assert.deepEqual(visibleEventsAt(events, 0).map((event) => event.id), ['e1']);
    assert.deepEqual(visibleEventsAt(events, 999).map((event) => event.id), ['e1']);
    assert.equal(visibleEventsAt(events, 5000).length, 3);
  });

  it('treats negative elapsed as 0', () => {
    const events = [makeEvent({ id: 'e1', offsetMs: 0, seq: 1 })];
    assert.deepEqual(visibleEventsAt(events, -100).map((event) => event.id), ['e1']);
  });
});

describe('durationOf', () => {
  it('prefers an explicit non-negative duration', () => {
    const events = [makeEvent({ id: 'e1', offsetMs: 9000, seq: 1 })];
    assert.equal(durationOf(events, 5000), 5000);
  });

  it('falls back to the maximum event offset', () => {
    const events = [
      makeEvent({ id: 'e1', offsetMs: 1000, seq: 1 }),
      makeEvent({ id: 'e2', offsetMs: 4000, seq: 2 }),
    ];
    assert.equal(durationOf(events), 4000);
  });

  it('is 0 for an empty event list', () => {
    assert.equal(durationOf([]), 0);
  });
});

describe('phaseAt', () => {
  it('is idle before anything is revealed', () => {
    assert.equal(phaseAt([], 0), 'idle');
  });

  it('reflects the latest visible event phase', () => {
    const events = [
      makeEvent({ id: 'e1', offsetMs: 0, seq: 1, phase: 'recon' }),
      makeEvent({ id: 'e2', offsetMs: 1000, seq: 2, phase: 'executing' }),
    ];
    assert.equal(phaseAt(events, 1), 'recon');
    assert.equal(phaseAt(events, 2), 'executing');
  });
});

describe('clampSeekTarget', () => {
  it('clamps into [0, durationMs] and maps NaN to 0', () => {
    assert.equal(clampSeekTarget(-50, 1000), 0);
    assert.equal(clampSeekTarget(5000, 1000), 1000);
    assert.equal(clampSeekTarget(400, 1000), 400);
    assert.equal(clampSeekTarget(Number.NaN, 1000), 0);
  });
});
