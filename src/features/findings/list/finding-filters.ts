// Findings-index lane: local contract adapter + pure filter logic.
//
// Dependency note: the contracts lane (`src/demo/types.ts`) and the seed-data
// lane (`src/demo/fixtures/`) have not landed yet. Per docs/02 and docs/03,
// this lane codes against docs/03_CONTRACTS.md and isolates the adapter here.
// Once `DemoFinding`, `DemoSeverity` and `DemoRemediationStatus` exist, replace
// the structural types below with:
//   import type { DemoFinding, DemoSeverity, DemoRemediationStatus } from "@/demo/types";
// The shapes are intentionally assignment-compatible with the contract.

export type FindingSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type FindingStatus =
  | "open"
  | "in_progress"
  | "pending_verification"
  | "verified_fixed"
  | "accepted_risk"
  | "dismissed";

// Minimal structural mirror of the contract's `DemoFinding`: only the fields
// this index reads. A full `DemoFinding` record always satisfies this shape.
export interface FindingRecord {
  id: string;
  projectId: string;
  scanId: string;
  title: string;
  severity: FindingSeverity;
  remediationStatus: FindingStatus;
  summary: string;
  affectedRoute: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface FindingFilters {
  search: string;
  severities: FindingSeverity[];
  statuses: FindingStatus[];
  // Null means "all projects".
  projectId: string | null;
}

export const EMPTY_FILTERS: FindingFilters = {
  search: "",
  severities: [],
  statuses: [],
  projectId: null,
};

export const SEVERITY_ORDER: FindingSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
];

export const STATUS_ORDER: FindingStatus[] = [
  "open",
  "in_progress",
  "pending_verification",
  "verified_fixed",
  "accepted_risk",
  "dismissed",
];

function matchesSearch(finding: FindingRecord, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === "") return true;
  const haystack = [
    finding.id,
    finding.title,
    finding.summary,
    finding.affectedRoute,
  ]
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}

/**
 * Deterministic faceted filtering. `except` removes one facet so pill counts
 * can be computed against the other active filters (standard faceted search):
 * severity counts ignore the severity selection, status counts ignore the
 * status selection, and the visible list applies every active filter.
 */
export function applyFindingFilters(
  findings: FindingRecord[],
  filters: FindingFilters,
  except?: "severity" | "status",
): FindingRecord[] {
  return findings.filter((finding) => {
    if (filters.projectId !== null && finding.projectId !== filters.projectId) {
      return false;
    }
    if (
      except !== "severity" &&
      filters.severities.length > 0 &&
      !filters.severities.includes(finding.severity)
    ) {
      return false;
    }
    if (
      except !== "status" &&
      filters.statuses.length > 0 &&
      !filters.statuses.includes(finding.remediationStatus)
    ) {
      return false;
    }
    return matchesSearch(finding, filters.search);
  });
}

/** Severity pill counts over the dataset filtered by everything except severity. */
export function severityCounts(
  findings: FindingRecord[],
  filters: FindingFilters,
): Record<FindingSeverity, number> {
  const base = applyFindingFilters(findings, filters, "severity");
  const counts: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };
  for (const finding of base) counts[finding.severity] += 1;
  return counts;
}

/** Status pill counts over the dataset filtered by everything except status. */
export function statusCounts(
  findings: FindingRecord[],
  filters: FindingFilters,
): Record<FindingStatus, number> {
  const base = applyFindingFilters(findings, filters, "status");
  const counts: Record<FindingStatus, number> = {
    open: 0,
    in_progress: 0,
    pending_verification: 0,
    verified_fixed: 0,
    accepted_risk: 0,
    dismissed: 0,
  };
  for (const finding of base) counts[finding.remediationStatus] += 1;
  return counts;
}

/** True when any filter narrows the full dataset (drives the Reset control). */
export function isFiltered(filters: FindingFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.severities.length > 0 ||
    filters.statuses.length > 0 ||
    filters.projectId !== null
  );
}
