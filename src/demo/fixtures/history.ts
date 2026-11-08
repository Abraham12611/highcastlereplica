import type { DemoEvent, DemoScan, DemoPhase } from '../types';
import { projects } from './projects';

/**
 * Seed fixture: 90 days of deterministic scan history for Northstar Labs.
 *
 * Fixed anchor date plus a fixed PRNG seed (mulberry32) — no Date.now(),
 * no Math.random(), so every checkout produces byte-identical rows.
 * All events are preauthored synthetic samples; nothing executes.
 */

export const SEED = 20261108;
export const HISTORY_DAYS = 90;
export const ANCHOR_ISO = '2026-11-08T12:00:00.000Z';
const ANCHOR_MS = Date.parse(ANCHOR_ISO);
const DAY_MS = 86_400_000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCAN_COUNTS: Record<string, number> = {
  'proj-invoicecloud': 22,
  'proj-cartforge': 16,
  'proj-teamdesk': 13,
  'proj-supportharbor': 12,
};

export const TOTAL_SCANS = 63;

type FindingLink = { discoveryScanId: string; verificationScanId?: string };

/** Finding -> project linkage owned here so scan rows and finding rows agree. */
const FINDING_PROJECTS: Record<string, string> = {
  'fnd-01': 'proj-invoicecloud',
  'fnd-02': 'proj-invoicecloud',
  'fnd-03': 'proj-invoicecloud',
  'fnd-04': 'proj-invoicecloud',
  'fnd-05': 'proj-invoicecloud',
  'fnd-06': 'proj-invoicecloud',
  'fnd-07': 'proj-invoicecloud',
  'fnd-08': 'proj-cartforge',
  'fnd-09': 'proj-cartforge',
  'fnd-10': 'proj-cartforge',
  'fnd-11': 'proj-cartforge',
  'fnd-12': 'proj-cartforge',
  'fnd-13': 'proj-teamdesk',
  'fnd-14': 'proj-teamdesk',
  'fnd-15': 'proj-teamdesk',
  'fnd-16': 'proj-supportharbor',
  'fnd-17': 'proj-supportharbor',
  'fnd-18': 'proj-supportharbor',
};

/** Findings whose fix was later verified by a second scan. */
export const VERIFIED_FINDING_IDS = [
  'fnd-01',
  'fnd-02',
  'fnd-03',
  'fnd-06',
  'fnd-08',
  'fnd-09',
  'fnd-10',
  'fnd-13',
  'fnd-16',
  'fnd-17',
];

/** Relative position of each discovery inside its project's completed scans. */
const DISCOVERY_FRACTION: Record<string, number> = {
  'fnd-01': 0.08,
  'fnd-02': 0.16,
  'fnd-03': 0.24,
  'fnd-04': 0.3,
  'fnd-05': 0.36,
  'fnd-06': 0.42,
  'fnd-07': 0.48,
  'fnd-08': 0.1,
  'fnd-09': 0.2,
  'fnd-10': 0.3,
  'fnd-11': 0.38,
  'fnd-12': 0.46,
  'fnd-13': 0.12,
  'fnd-14': 0.3,
  'fnd-15': 0.46,
  'fnd-16': 0.15,
  'fnd-17': 0.32,
  'fnd-18': 0.48,
};

function scenarioForProject(projectId: string): string {
  return projects.find((p) => p.id === projectId)?.scenarioId ?? 'scenario-bola-invoice';
}

function lifecycleEvents(
  scanId: string,
  kind: DemoScan['status'],
  evidenceId: string | undefined,
  rand: () => number,
): DemoEvent[] {
  type Step = {
    phase: DemoPhase;
    actor: DemoEvent['actor'];
    title: string;
    status: DemoEvent['status'];
  };
  const steps: Step[] = [
    { phase: 'queued', actor: 'system', title: 'Sample scan queued', status: 'done' },
    { phase: 'recon', actor: 'agent', title: 'Synthetic reconnaissance batch (simulated)', status: 'done' },
    { phase: 'planning', actor: 'agent', title: 'Sample test plan drafted (simulated)', status: 'done' },
    { phase: 'policy', actor: 'policy', title: 'Policy check approved sample scope (simulated)', status: 'done' },
    { phase: 'preparing', actor: 'runner', title: 'Mock runner prepared (simulated)', status: 'done' },
    { phase: 'executing', actor: 'runner', title: 'Scripted sample requests replayed (simulated)', status: 'done' },
    { phase: 'verifying', actor: 'oracle', title: 'Oracle assertions evaluated (simulated)', status: 'done' },
    { phase: 'finalizing', actor: 'system', title: 'Sample report finalized', status: 'done' },
  ];
  if (kind === 'failed') {
    const items: Step[] = [
      { ...steps[0], status: 'done' },
      { ...steps[1], status: 'done' },
      { ...steps[2], status: 'done' },
      {
        phase: 'executing',
        actor: 'runner',
        title: 'Mock runner fault injected (simulated failure)',
        status: 'failed',
      },
    ];
    return items.map((s, i) => toEvent(scanId, i, s, undefined, rand));
  }
  if (kind === 'canceled') {
    const items: Step[] = [
      { ...steps[0], status: 'done' },
      { ...steps[1], status: 'done' },
      {
        phase: 'planning',
        actor: 'system',
        title: 'Sample scan canceled by operator (simulated)',
        status: 'blocked',
      },
    ];
    return items.map((s, i) => toEvent(scanId, i, s, undefined, rand));
  }
  if (kind === 'running') {
    return steps.slice(0, 6).map((s, i) =>
      toEvent(
        scanId,
        i,
        {
          ...s,
          status: i < 4 ? 'done' : i === 4 ? 'running' : 'pending',
        },
        i === 5 ? evidenceId : undefined,
        rand,
      ),
    );
  }
  return steps.map((s, i) =>
    toEvent(scanId, i, s, s.phase === 'executing' ? evidenceId : undefined, rand),
  );
}

function toEvent(
  scanId: string,
  seq: number,
  s: { phase: DemoEvent['phase']; actor: DemoEvent['actor']; title: string; status: DemoEvent['status'] },
  evidenceId: string | undefined,
  rand: () => number,
): DemoEvent {
  const offsetMs = 2_000 + seq * 12_000 + Math.floor(rand() * 3_000);
  return {
    id: `${scanId}-e${String(seq + 1).padStart(2, '0')}`,
    seq,
    offsetMs,
    phase: s.phase,
    actor: s.actor,
    title: s.title,
    summary: `${s.title} — deterministic synthetic sample, no live execution.`,
    ...(evidenceId ? { evidenceId } : {}),
    status: s.status,
  };
}

function buildScans(): { scans: DemoScan[]; links: Record<string, FindingLink> } {
  const rand = mulberry32(SEED);

  // 63 start times spread over the 90-day window, oldest first.
  const dayOffsets: number[] = [];
  for (let i = 0; i < TOTAL_SCANS; i += 1) dayOffsets.push(Math.floor(rand() * HISTORY_DAYS));
  dayOffsets[0] = HISTORY_DAYS - 1; // oldest sample at window edge
  const windowStartMs = Date.parse('2026-08-11T00:00:00.000Z');
  const timesMs = dayOffsets
    .map((d) => Math.max(windowStartMs, ANCHOR_MS - d * DAY_MS - Math.floor(rand() * 20 * 3_600_000)))
    .sort((a, b) => a - b);
  // Newest sample is "now": the in-progress run.
  timesMs[TOTAL_SCANS - 1] = ANCHOR_MS - 4 * 60_000;

  // Weighted project slots, seeded shuffle, dealt out oldest -> newest.
  const slots: string[] = [];
  for (const [projectId, count] of Object.entries(SCAN_COUNTS)) {
    for (let i = 0; i < count; i += 1) slots.push(projectId);
  }
  for (let i = slots.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  // Statuses: newest is running; 3 failed + 3 canceled picked from the middle.
  const statusOf: Record<number, DemoScan['status']> = {};
  statusOf[TOTAL_SCANS - 1] = 'running';
  const candidates: number[] = [];
  for (let i = 4; i < TOTAL_SCANS - 4; i += 1) candidates.push(i);
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const failedAt = new Set(candidates.slice(0, 3).sort((a, b) => a - b));
  const canceledAt = new Set(candidates.slice(3, 6).sort((a, b) => a - b));

  const scans: DemoScan[] = timesMs.map((startedMs, i) => {
    const n = i + 1;
    const id = `scan-${String(n).padStart(3, '0')}`;
    const projectId = slots[i];
    const status: DemoScan['status'] = statusOf[i] ?? (failedAt.has(i) ? 'failed' : canceledAt.has(i) ? 'canceled' : 'completed');
    const phase: DemoScan['phase'] =
      status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : status === 'canceled' ? 'canceled' : 'executing';
    const durationMs = 4 * 60_000 + Math.floor(rand() * 24 * 60_000);
    return {
      id,
      projectId,
      scenarioId: scenarioForProject(projectId),
      startedAt: new Date(startedMs).toISOString(),
      ...(status === 'running' ? {} : { completedAt: new Date(startedMs + durationMs).toISOString() }),
      phase,
      status,
      findings: [],
      events: lifecycleEvents(id, status, undefined, rand),
    };
  });

  // Link each finding to a discovery scan (completed) and, for fixed ones,
  // to a later completed verification scan on the same project.
  const links: Record<string, FindingLink> = {};
  const completedByProject = (projectId: string): DemoScan[] =>
    scans.filter((s) => s.projectId === projectId && s.status === 'completed');
  for (const [findingId, projectId] of Object.entries(FINDING_PROJECTS)) {
    const done = completedByProject(projectId);
    const dPos = Math.min(done.length - 2, Math.floor(DISCOVERY_FRACTION[findingId] * done.length));
    const discovery = done[Math.max(0, dPos)];
    let verification: DemoScan | undefined;
    if (VERIFIED_FINDING_IDS.includes(findingId)) {
      const vPos = Math.min(done.length - 1, dPos + 3 + Math.floor(rand() * 3));
      verification = done[Math.max(dPos + 1, vPos)];
    }
    links[findingId] = {
      discoveryScanId: discovery.id,
      ...(verification ? { verificationScanId: verification.id } : {}),
    };
    discovery.findings.push(findingId);
    if (verification && !verification.findings.includes(findingId)) verification.findings.push(findingId);
  }

  // Attach evidence pointers to the executing step of discovery scans.
  for (const [findingId, link] of Object.entries(links)) {
    const scan = scans.find((s) => s.id === link.discoveryScanId);
    const exec = scan?.events.find((e) => e.phase === 'executing');
    if (scan && exec) {
      scan.events = scan.events.map((e) =>
        e.id === exec.id ? { ...e, evidenceId: `ev-${findingId}-http` } : e,
      );
    }
  }

  return { scans, links };
}

const built = buildScans();

export const scans: DemoScan[] = built.scans;

/** Discovery (+ optional verification) scan per finding id. */
export const findingScanLinks: Record<string, FindingLink> = built.links;

export function getScanSeedById(scanId: string): DemoScan | undefined {
  return scans.find((s) => s.id === scanId);
}
