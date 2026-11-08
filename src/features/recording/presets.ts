/**
 * Deterministic scenario presets for the recording operator console.
 *
 * Scenario ids follow the canonical fixture index owned by the seed-data
 * lane (issue #4, `src/demo/fixtures/projects.ts`): `scenario-bola-invoice`
 * is the flagship InvoiceCloud BOLA walkthrough. Chapter timings are derived
 * from the shooting script in `docs/06_RECORDING_STORYBOARD.md` and are
 * display-only operator cues — the fixture lane owns the actual event
 * timelines. All values here are fixed constants; there is no randomness.
 *
 * INTEGRATION NOTE for coordinator: the signature-scenario lane (issue #7)
 * currently uses `scenario-invoice-bola` for the same walkthrough. The
 * fixture-index lane should declare one canonical id and the other lane
 * should adopt it; this console resolves presets through the injected
 * engine, so it follows whichever id the engine serves.
 */
import type { RecordingPreset } from './types';

const MIN = 60_000;

export const RECORDING_PRESETS: readonly RecordingPreset[] = [
  {
    scenarioId: 'scenario-bola-invoice',
    projectName: 'InvoiceCloud',
    title: 'Invoice BOLA / IDOR (flagship)',
    description:
      'Alice baseline 200, Alice reads Bob invoice 200 (vulnerable), ' +
      'blocked out-of-scope containment, verified fix 403 + baseline 200.',
    durationMs: 3 * MIN + 20_000,
    chapters: [
      {
        id: 'landing',
        offsetMs: 0,
        label: '0:00 Landing',
        route: '/',
        cue: '“Can we prove that software is secure?” Framed on landing.',
      },
      {
        id: 'workspace',
        offsetMs: 15_000,
        label: '0:15 Workspace',
        route: '/app',
        cue: 'Sample workspace, risk history, projects, verified fixes.',
      },
      {
        id: 'new-assessment',
        offsetMs: 35_000,
        label: '0:35 New assessment',
        route: '/app/projects/new',
        cue: 'Select InvoiceCloud scenario; URL field is display-only.',
      },
      {
        id: 'recon',
        offsetMs: 55_000,
        label: '0:55 Recon theater',
        route: '/app/scans/[id]',
        cue: 'Slow progressive recon, hypothesis, approved plan steps.',
      },
      {
        id: 'bola-evidence',
        offsetMs: 85_000,
        label: '1:25 BOLA evidence',
        route: '/app/scans/[id]',
        cue: 'Alice→Alice 200 baseline, then Alice→Bob 200 oracle hit.',
      },
      {
        id: 'containment',
        offsetMs: 105_000,
        label: '1:45 Containment',
        route: '/app/scans/[id]',
        cue: 'Blocked out-of-scope operation with policy detail.',
      },
      {
        id: 'finding',
        offsetMs: 120_000,
        label: '2:00 Finding',
        route: '/app/findings/[id]',
        cue: 'Impact, attack path, fix prompt (copyable guidance).',
      },
      {
        id: 'replay',
        offsetMs: 145_000,
        label: '2:25 Replay',
        route: '/app/replays/[id]',
        cue: 'Patched: Alice→Bob 403, Alice→Alice 200. Verified Fixed.',
      },
      {
        id: 'reports',
        offsetMs: 175_000,
        label: '2:55 Reports',
        route: '/app/reports',
        cue: 'Updated workspace history and risk trends.',
      },
      {
        id: 'close',
        offsetMs: 190_000,
        label: '3:10 Close',
        route: '/app',
        cue: '“Prove the risk. Prove the fix.” End card.',
      },
    ],
  },
  {
    scenarioId: 'scenario-coupon-replay',
    projectName: 'CartForge',
    title: 'Payment coupon replay (controlled)',
    description:
      'Fictional store coupon-reuse walkthrough. Synthetic checkout only.',
    durationMs: 2 * MIN,
    chapters: [
      {
        id: 'start',
        offsetMs: 0,
        label: '0:00 Setup',
        route: '/app/projects/new',
        cue: 'Select coupon-replay scenario; display-only URL.',
      },
      {
        id: 'replay-proof',
        offsetMs: 60_000,
        label: '1:00 Replay proof',
        route: '/app/replays/[id]',
        cue: 'Before/after coupon assertion comparison.',
      },
      {
        id: 'finding',
        offsetMs: 100_000,
        label: '1:40 Finding',
        route: '/app/findings/[id]',
        cue: 'Impact and fix guidance for coupon replay.',
      },
    ],
  },
  {
    scenarioId: 'scenario-cross-tenant-membership',
    projectName: 'TeamDesk',
    title: 'Cross-tenant membership (controlled)',
    description:
      'Fictional team-SaaS membership walkthrough. Synthetic tenants only.',
    durationMs: 2 * MIN,
    chapters: [
      {
        id: 'start',
        offsetMs: 0,
        label: '0:00 Setup',
        route: '/app/projects/new',
        cue: 'Select cross-tenant scenario; display-only URL.',
      },
      {
        id: 'evidence',
        offsetMs: 60_000,
        label: '1:00 Evidence',
        route: '/app/scans/[id]',
        cue: 'Membership oracle assertion on synthetic tenants.',
      },
      {
        id: 'finding',
        offsetMs: 100_000,
        label: '1:40 Finding',
        route: '/app/findings/[id]',
        cue: 'Impact and fix guidance for membership check.',
      },
    ],
  },
  {
    scenarioId: 'scenario-ratelimit-bypass',
    projectName: 'SupportHarbor',
    title: 'Rate-limit bypass (controlled)',
    description:
      'Fictional helpdesk rate-limit walkthrough. Synthetic traffic only.',
    durationMs: 2 * MIN,
    chapters: [
      {
        id: 'start',
        offsetMs: 0,
        label: '0:00 Setup',
        route: '/app/projects/new',
        cue: 'Select rate-limit scenario; display-only URL.',
      },
      {
        id: 'evidence',
        offsetMs: 60_000,
        label: '1:00 Evidence',
        route: '/app/scans/[id]',
        cue: 'Synthetic burst vs. limit assertion.',
      },
      {
        id: 'finding',
        offsetMs: 100_000,
        label: '1:40 Finding',
        route: '/app/findings/[id]',
        cue: 'Impact and fix guidance for rate limiting.',
      },
    ],
  },
];

/** Look up a preset by scenario id; returns `undefined` when unknown. */
export function findPreset(scenarioId: string): RecordingPreset | undefined {
  return RECORDING_PRESETS.find((preset) => preset.scenarioId === scenarioId);
}

/**
 * Chapter active at virtual time `t`: the latest chapter with
 * `offsetMs <= t`, or `undefined` before the first chapter.
 */
export function chapterAt(
  preset: RecordingPreset,
  elapsedMs: number,
): RecordingPreset['chapters'][number] | undefined {
  const t = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  let active: RecordingPreset['chapters'][number] | undefined;
  for (const chapter of preset.chapters) {
    if (chapter.offsetMs <= t) active = chapter;
    else break;
  }
  return active;
}

/** Format virtual milliseconds as `m:ss` for the operator readout. */
export function formatClock(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
