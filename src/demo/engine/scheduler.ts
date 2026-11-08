/**
 * Pure deterministic scheduling core. No timers, no I/O, no React.
 *
 * Ordering rule: events reveal in ascending `(offsetMs, seq, id)` order.
 * Negative offsets are treated as `0` (visible immediately). The reveal set
 * at elapsed time `t` is every event with effective offset `<= t`, which
 * makes seek-forward, seek-backward and reload-reconstruction all derive
 * from a single elapsed value.
 */
import type { EngineEvent, EnginePhase } from './types';

/** Effective reveal time of an event; negative offsets clamp to 0. */
export function effectiveOffset(event: Pick<EngineEvent, 'offsetMs'>): number {
  const offset = Number(event.offsetMs);
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return offset;
}

/**
 * Deterministically sort events into reveal order.
 * Never mutates the input array. Total order via (offsetMs, seq, id).
 */
export function sortEvents<T extends EngineEvent>(events: readonly T[]): T[] {
  return [...events].sort((a, b) => {
    const offsetDelta = effectiveOffset(a) - effectiveOffset(b);
    if (offsetDelta !== 0) return offsetDelta;
    if (a.seq !== b.seq) return a.seq - b.seq;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Events visible at elapsed time `t` (event.offsetMs <= t), in reveal order.
 * Pure function of `(events, elapsedMs)` — seeking and reload recovery both
 * reduce to calling this with the target elapsed time.
 */
export function visibleEventsAt<T extends EngineEvent>(
  events: readonly T[],
  elapsedMs: number,
): T[] {
  const t = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  return sortEvents(events).filter((event) => effectiveOffset(event) <= t);
}

/** Virtual duration: explicit duration wins, else the last event offset. */
export function durationOf(
  events: readonly EngineEvent[],
  explicitDurationMs?: number,
): number {
  if (
    typeof explicitDurationMs === 'number' &&
    Number.isFinite(explicitDurationMs) &&
    explicitDurationMs >= 0
  ) {
    return explicitDurationMs;
  }
  let max = 0;
  for (const event of events) max = Math.max(max, effectiveOffset(event));
  return max;
}

/**
 * Scenario phase shown for the current reveal state: the phase of the
 * latest visible event, or `idle` before anything is revealed.
 */
export function phaseAt(
  sortedEvents: readonly EngineEvent[],
  visibleCount: number,
): EnginePhase {
  if (visibleCount <= 0) return 'idle';
  const latest = sortedEvents[Math.min(visibleCount, sortedEvents.length) - 1];
  return latest ? latest.phase : 'idle';
}

/** Clamp a seek target into `[0, durationMs]`. */
export function clampSeekTarget(offsetMs: number, durationMs: number): number {
  if (!Number.isFinite(offsetMs)) return 0;
  return Math.min(Math.max(0, offsetMs), Math.max(0, durationMs));
}
