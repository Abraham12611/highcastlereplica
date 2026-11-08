import type {
  DemoFinding,
  DemoProject,
  DemoScan,
  DemoSeverity,
} from '@/demo/types';

/**
 * Pure, deterministic derivations for the P0 workspace dashboard.
 *
 * Every count shown on the dashboard is computed from fixture rows here —
 * nothing is hardcoded. All functions are side-effect free so the dashboard
 * renders identically on every load (simulated demo data only).
 */

export const SEVERITY_ORDER: readonly DemoSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'informational',
];

const SEVERITY_WEIGHT: Record<DemoSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  informational: 4,
};

const DAY_MS = 86_400_000;

function parseTime(iso: string): number | null {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

export function isOpenFinding(f: DemoFinding): boolean {
  return f.remediationStatus === 'open' || f.remediationStatus === 'in_progress';
}

export interface WorkspaceTotals {
  projectCount: number;
  scanCount: number;
  completedScanCount: number;
  activeScanCount: number;
  findingCount: number;
  openFindingCount: number;
  criticalOpenCount: number;
  verifiedFixCount: number;
}

export function getWorkspaceTotals(
  projects: DemoProject[],
  scans: DemoScan[],
  findings: DemoFinding[],
): WorkspaceTotals {
  const open = findings.filter(isOpenFinding);
  return {
    projectCount: projects.length,
    scanCount: scans.length,
    completedScanCount: scans.filter((s) => s.status === 'completed').length,
    activeScanCount: scans.filter((s) => s.status === 'queued' || s.status === 'running').length,
    findingCount: findings.length,
    openFindingCount: open.length,
    criticalOpenCount: open.filter((f) => f.severity === 'critical').length,
    verifiedFixCount: findings.filter((f) => f.remediationStatus === 'verified_fixed').length,
  };
}

export interface RiskSlice {
  severity: DemoSeverity;
  openCount: number;
  totalCount: number;
}

/** Open + total finding counts per severity, heaviest severity first. */
export function getRiskDistribution(findings: DemoFinding[]): RiskSlice[] {
  return SEVERITY_ORDER.map((severity) => {
    const inSeverity = findings.filter((f) => f.severity === severity);
    return {
      severity,
      openCount: inSeverity.filter(isOpenFinding).length,
      totalCount: inSeverity.length,
    };
  }).filter((slice) => slice.totalCount > 0);
}

/** Open critical/high findings first, then by most recently seen. */
export function getUrgentFindings(findings: DemoFinding[], limit = 5): DemoFinding[] {
  return findings
    .filter(isOpenFinding)
    .slice()
    .sort((a, b) => {
      const sev = SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
      if (sev !== 0) return sev;
      return (parseTime(b.lastSeenAt) ?? 0) - (parseTime(a.lastSeenAt) ?? 0);
    })
    .slice(0, limit);
}

/** Most recently started scans first. */
export function getRecentScans(scans: DemoScan[], limit = 7): DemoScan[] {
  return scans
    .slice()
    .sort((a, b) => (parseTime(b.startedAt) ?? 0) - (parseTime(a.startedAt) ?? 0))
    .slice(0, limit);
}

/** Verified fixes, most recently confirmed first. */
export function getRecentVerifiedFixes(findings: DemoFinding[], limit = 4): DemoFinding[] {
  return findings
    .filter((f) => f.remediationStatus === 'verified_fixed')
    .slice()
    .sort((a, b) => (parseTime(b.lastSeenAt) ?? 0) - (parseTime(a.lastSeenAt) ?? 0))
    .slice(0, limit);
}

export interface ActivityWeek {
  /** ISO date (UTC midnight) of the first day in the bucket. */
  weekStartIso: string;
  /** Short label, e.g. "Mar 3". */
  label: string;
  scans: number;
  findingsOpened: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Bucket scan starts + finding first-seen dates into weekly buckets covering
 * the trailing `days` window. The window ends at the newest record in the
 * data (not wall-clock time) so the seeded 90-day history always renders
 * fully and deterministically.
 */
export function getActivitySeries(
  scans: DemoScan[],
  findings: DemoFinding[],
  days = 90,
): ActivityWeek[] {
  const stamps: number[] = [];
  for (const s of scans) {
    const t = parseTime(s.startedAt);
    if (t !== null) stamps.push(t);
  }
  for (const f of findings) {
    const t = parseTime(f.firstSeenAt);
    if (t !== null) stamps.push(t);
  }
  if (stamps.length === 0 || days <= 0) return [];

  const endDay = Math.floor(Math.max(...stamps) / DAY_MS);
  const startDay = endDay - (days - 1);
  const weekCount = Math.ceil(days / 7);
  const weeks: ActivityWeek[] = Array.from({ length: weekCount }, (_, i) => {
    const weekStart = new Date((startDay + i * 7) * DAY_MS);
    return {
      weekStartIso: weekStart.toISOString().slice(0, 10),
      label: `${MONTHS[weekStart.getUTCMonth()]} ${weekStart.getUTCDate()}`,
      scans: 0,
      findingsOpened: 0,
    };
  });

  const bump = (iso: string, key: 'scans' | 'findingsOpened') => {
    const t = parseTime(iso);
    if (t === null) return;
    const dayIndex = Math.floor(t / DAY_MS) - startDay;
    if (dayIndex < 0 || dayIndex >= days) return;
    weeks[Math.min(Math.floor(dayIndex / 7), weekCount - 1)][key] += 1;
  };

  for (const s of scans) bump(s.startedAt, 'scans');
  for (const f of findings) bump(f.firstSeenAt, 'findingsOpened');
  return weeks;
}

export interface ProjectHealth {
  project: DemoProject;
  scanCount: number;
  openFindings: number;
  verifiedFixes: number;
  worstOpenSeverity: DemoSeverity | null;
  latestScan: DemoScan | null;
}

export function getProjectHealth(
  project: DemoProject,
  scans: DemoScan[],
  findings: DemoFinding[],
): ProjectHealth {
  const projectScans = scans.filter((s) => s.projectId === project.id);
  const projectFindings = findings.filter((f) => f.projectId === project.id);
  const open = projectFindings.filter(isOpenFinding);
  const worstOpenSeverity =
    open.length === 0
      ? null
      : open.reduce<DemoSeverity>((worst, f) =>
          SEVERITY_WEIGHT[f.severity] < SEVERITY_WEIGHT[worst] ? f.severity : worst,
        open[0].severity);
  const latestScan =
    projectScans.length === 0
      ? null
      : projectScans.reduce((a, b) => ((parseTime(b.startedAt) ?? 0) > (parseTime(a.startedAt) ?? 0) ? b : a));
  return {
    project,
    scanCount: projectScans.length,
    openFindings: open.length,
    verifiedFixes: projectFindings.filter((f) => f.remediationStatus === 'verified_fixed').length,
    worstOpenSeverity,
    latestScan,
  };
}

/** Short human label for a scan phase, e.g. "Executing". */
export function formatPhase(phase: DemoScan['phase']): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}
