import type { DemoFinding, DemoProject, DemoScan } from '../types';
import { findings } from './findings';
import { ANCHOR_ISO as FIXTURE_ANCHOR } from './history';
import { findingScanLinks, scans } from './history';
import { projects } from './projects';
import { northstarWorkspace } from './workspace';

/**
 * Fixture entry point: re-exports rows plus derived selectors and an
 * integrity validator. Every count is computed from rows — nothing is
 * hardcoded — so charts and badges stay consistent by construction.
 */

export { findings, TOTAL_FINDINGS, VERIFIED_FIX_COUNT } from './findings';
export { ANCHOR_ISO, HISTORY_DAYS, SEED, TOTAL_SCANS, VERIFIED_FINDING_IDS, findingScanLinks, scans } from './history';
export { projectIds, projects } from './projects';
export { northstarWorkspace } from './workspace';

// --- Lookups ---------------------------------------------------------------

export function getProjects(): DemoProject[] {
  return projects;
}

export function getProjectById(projectId: string): DemoProject | undefined {
  return projects.find((p) => p.id === projectId);
}

export function getProjectBySlug(slug: string): DemoProject | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getScans(): DemoScan[] {
  return scans;
}

export function getScanById(scanId: string): DemoScan | undefined {
  return scans.find((s) => s.id === scanId);
}

export function getScansByProject(projectId: string): DemoScan[] {
  return scans.filter((s) => s.projectId === projectId);
}

export function getFindings(): DemoFinding[] {
  return findings;
}

export function getFindingById(findingId: string): DemoFinding | undefined {
  return findings.find((f) => f.id === findingId);
}

export function getFindingsByProject(projectId: string): DemoFinding[] {
  return findings.filter((f) => f.projectId === projectId);
}

export function getOpenFindings(): DemoFinding[] {
  return findings.filter((f) => f.remediationStatus === 'open' || f.remediationStatus === 'in_progress');
}

export function getFixedFindings(): DemoFinding[] {
  return findings.filter((f) => f.remediationStatus === 'verified_fixed');
}

// --- Derived counts (chart/badge sources) -----------------------------------

export function countScansByStatus(): Record<DemoScan['status'], number> {
  const counts: Record<DemoScan['status'], number> = {
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
    canceled: 0,
  };
  for (const s of scans) counts[s.status] += 1;
  return counts;
}

export function countFindingsBySeverity(): Record<DemoFinding['severity'], number> {
  const counts: Record<DemoFinding['severity'], number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}

export function countFindingsByRemediation(): Record<DemoFinding['remediationStatus'], number> {
  const counts: Record<DemoFinding['remediationStatus'], number> = {
    open: 0,
    in_progress: 0,
    pending_verification: 0,
    verified_fixed: 0,
    accepted_risk: 0,
    dismissed: 0,
  };
  for (const f of findings) counts[f.remediationStatus] += 1;
  return counts;
}

export type ProjectSummary = {
  project: DemoProject;
  scanCount: number;
  findingCount: number;
  openCount: number;
  fixedCount: number;
  lastScanAt: string | undefined;
};

export function getProjectSummaries(): ProjectSummary[] {
  return projects.map((project) => {
    const pscans = getScansByProject(project.id);
    const pfindings = getFindingsByProject(project.id);
    return {
      project,
      scanCount: pscans.length,
      findingCount: pfindings.length,
      openCount: pfindings.filter((f) => f.remediationStatus === 'open' || f.remediationStatus === 'in_progress').length,
      fixedCount: pfindings.filter((f) => f.remediationStatus === 'verified_fixed').length,
      lastScanAt: pscans.length > 0 ? pscans[pscans.length - 1].startedAt : undefined,
    };
  });
}

export type DayBucket = { date: string; count: number };

/** 90 daily buckets ending on the anchor date; counts derived from scans. */
export function getScansPerDay(days = 90): DayBucket[] {
  const buckets: DayBucket[] = [];
  const anchor = Date.parse(FIXTURE_ANCHOR);
  for (let d = days - 1; d >= 0; d -= 1) {
    buckets.push({ date: new Date(anchor - d * 86_400_000).toISOString().slice(0, 10), count: 0 });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));
  for (const s of scans) {
    const bucket = byDate.get(s.startedAt.slice(0, 10));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

// --- Integrity validator -----------------------------------------------------

const WINDOW_START_MS = Date.parse('2026-08-11T00:00:00.000Z');
const WINDOW_END_MS = Date.parse('2026-11-08T12:00:00.000Z');

/**
 * Checks id uniqueness, foreign keys, expected counts and timestamp
 * coherence. Returns a list of human-readable errors (empty = valid).
 * Pure function over the fixture rows; safe to run in tests or in-app.
 */
export function validateFixtureIntegrity(): string[] {
  const errors: string[] = [];

  if (projects.length !== 4) errors.push(`expected 4 projects, saw ${projects.length}`);
  if (scans.length !== 63) errors.push(`expected 63 scans, saw ${scans.length}`);
  if (findings.length !== 18) errors.push(`expected 18 findings, saw ${findings.length}`);
  const fixed = findings.filter((f) => f.remediationStatus === 'verified_fixed');
  if (fixed.length !== 10) errors.push(`expected 10 verified fixes, saw ${fixed.length}`);

  const dupes = (ids: string[]): string[] => {
    const seen = new Set<string>();
    return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  };
  const scanDupes = dupes(scans.map((s) => s.id));
  if (scanDupes.length > 0) errors.push(`duplicate scan ids: ${scanDupes.join(', ')}`);
  const findingDupes = dupes(findings.map((f) => f.id));
  if (findingDupes.length > 0) errors.push(`duplicate finding ids: ${findingDupes.join(', ')}`);

  const projectIds = new Set(projects.map((p) => p.id));
  const scanById = new Map(scans.map((s) => [s.id, s]));
  const findingIds = new Set(findings.map((f) => f.id));

  for (const p of projects) {
    for (const s of getScansByProject(p.id)) {
      if (Date.parse(s.startedAt) < Date.parse(p.createdAt)) {
        errors.push(`scan ${s.id} predates project ${p.id} creation`);
      }
    }
  }

  for (const s of scans) {
    if (!projectIds.has(s.projectId)) errors.push(`scan ${s.id} references unknown project ${s.projectId}`);
    const started = Date.parse(s.startedAt);
    if (Number.isNaN(started) || started < WINDOW_START_MS || started > WINDOW_END_MS) {
      errors.push(`scan ${s.id} startedAt outside 90-day window: ${s.startedAt}`);
    }
    if (s.status === 'running' && s.completedAt !== undefined) {
      errors.push(`running scan ${s.id} must not have completedAt`);
    }
    if (s.status !== 'running') {
      if (!s.completedAt) errors.push(`scan ${s.id} (${s.status}) is missing completedAt`);
      else if (Date.parse(s.completedAt) <= started) errors.push(`scan ${s.id} completedAt is not after startedAt`);
    }
    if (s.status === 'completed' && s.phase !== 'completed') errors.push(`completed scan ${s.id} has phase ${s.phase}`);
    if (s.status === 'failed' && s.phase !== 'failed') errors.push(`failed scan ${s.id} has phase ${s.phase}`);
    if (s.status === 'canceled' && s.phase !== 'canceled') errors.push(`canceled scan ${s.id} has phase ${s.phase}`);
    for (const fid of s.findings) {
      if (!findingIds.has(fid)) errors.push(`scan ${s.id} references unknown finding ${fid}`);
    }
    s.events.forEach((e, i) => {
      if (e.seq !== i) errors.push(`scan ${s.id} event ${e.id} has seq ${e.seq}, expected ${i}`);
      if (i > 0 && e.offsetMs <= s.events[i - 1].offsetMs) {
        errors.push(`scan ${s.id} event ${e.id} offsetMs not increasing`);
      }
    });
  }

  for (const f of findings) {
    if (!projectIds.has(f.projectId)) errors.push(`finding ${f.id} references unknown project ${f.projectId}`);
    const discovery = scanById.get(f.scanId);
    if (!discovery) {
      errors.push(`finding ${f.id} references unknown discovery scan ${f.scanId}`);
      continue;
    }
    if (discovery.projectId !== f.projectId) {
      errors.push(`finding ${f.id} project ${f.projectId} mismatches discovery scan project ${discovery.projectId}`);
    }
    if (discovery.status !== 'completed') errors.push(`finding ${f.id} discovered by non-completed scan ${discovery.id}`);
    if (!discovery.findings.includes(f.id)) errors.push(`discovery scan ${discovery.id} does not list finding ${f.id}`);
    if (f.firstSeenAt !== discovery.startedAt) {
      errors.push(`finding ${f.id} firstSeenAt does not match discovery scan start`);
    }
    if (Date.parse(f.lastSeenAt) < Date.parse(f.firstSeenAt)) {
      errors.push(`finding ${f.id} lastSeenAt precedes firstSeenAt`);
    }
    if (f.evidenceIds.length === 0) errors.push(`finding ${f.id} has no evidence ids`);
    const evDupes = dupes(f.evidenceIds);
    if (evDupes.length > 0) errors.push(`finding ${f.id} has duplicate evidence ids`);
    for (const ev of f.evidenceIds) {
      if (!ev.startsWith(`ev-${f.id}-`)) errors.push(`finding ${f.id} has off-convention evidence id ${ev}`);
    }
    if (f.remediationStatus === 'verified_fixed') {
      const link = findingScanLinks[f.id];
      const verification = link?.verificationScanId ? scanById.get(link.verificationScanId) : undefined;
      if (!verification) {
        errors.push(`verified finding ${f.id} has no verification scan`);
      } else {
        if (verification.projectId !== f.projectId) {
          errors.push(`verified finding ${f.id} verification scan is on another project`);
        }
        if (verification.status !== 'completed') {
          errors.push(`verified finding ${f.id} verification scan ${verification.id} is not completed`);
        }
        if (Date.parse(verification.startedAt) <= Date.parse(f.firstSeenAt)) {
          errors.push(`verified finding ${f.id} verification scan is not after discovery`);
        }
        if (f.lastSeenAt !== verification.startedAt) {
          errors.push(`verified finding ${f.id} lastSeenAt does not match verification scan start`);
        }
        if (!verification.findings.includes(f.id)) {
          errors.push(`verification scan ${verification.id} does not list finding ${f.id}`);
        }
      }
    }
  }

  if (northstarWorkspace.projects.length !== projects.length) {
    errors.push('workspace project list drifted from projects fixture');
  }
  if (northstarWorkspace.synthetic !== true) errors.push('workspace must be flagged synthetic');

  return errors;
}
