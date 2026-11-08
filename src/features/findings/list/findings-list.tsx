"use client";

// Findings-index lane: searchable, filterable findings list (issue #10).
//
// Simulated demo surface only: renders the lane's synthetic sample adapter.
// Swap `SAMPLE_FINDINGS` / `SAMPLE_PROJECTS` for the canonical fixture store
// once the seed-data lane lands; the component only reads the `FindingRecord`
// shape. Cards link to `/app/findings/[id]`, which the finding-detail lane
// owns — this file never renders detail UI.

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  applyFindingFilters,
  EMPTY_FILTERS,
  isFiltered,
  SEVERITY_ORDER,
  severityCounts,
  STATUS_ORDER,
  statusCounts,
  type FindingFilters,
  type FindingSeverity,
  type FindingStatus,
} from "./finding-filters.ts";
import {
  projectName,
  SAMPLE_FINDINGS,
  SAMPLE_PROJECTS,
  SAMPLE_PROVENANCE,
} from "./sample-findings.ts";
import styles from "./findings-list.module.css";

const SEVERITY_BADGE: Record<FindingSeverity, { label: string; tint: string }> = {
  critical: { label: "Critical", tint: styles.sevCritical },
  high: { label: "High", tint: styles.sevHigh },
  medium: { label: "Medium", tint: styles.sevMedium },
  low: { label: "Low", tint: styles.sevLow },
  informational: { label: "Informational", tint: styles.sevInfo },
};

const STATUS_BADGE: Record<FindingStatus, { label: string; tint: string }> = {
  open: { label: "Open", tint: styles.stOpen },
  in_progress: { label: "In progress", tint: styles.stProgress },
  pending_verification: { label: "Pending verification", tint: styles.stPending },
  verified_fixed: { label: "Verified fixed", tint: styles.stFixed },
  accepted_risk: { label: "Accepted risk", tint: styles.stRisk },
  dismissed: { label: "Dismissed", tint: styles.stDismissed },
};

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export default function FindingsList() {
  const [filters, setFilters] = useState<FindingFilters>(EMPTY_FILTERS);

  const visible = useMemo(
    () => applyFindingFilters(SAMPLE_FINDINGS, filters),
    [filters],
  );
  const sevCounts = useMemo(
    () => severityCounts(SAMPLE_FINDINGS, filters),
    [filters],
  );
  const stCounts = useMemo(
    () => statusCounts(SAMPLE_FINDINGS, filters),
    [filters],
  );
  const filtered = isFiltered(filters);

  return (
    <section className={styles.root} aria-label="Findings index">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Findings</h1>
          <p className={styles.subtitle}>
            Deterministic sample results from the Northstar Labs workspace.
          </p>
        </div>
        <span className={styles.demoPill}>Simulated demo</span>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchRow}>
          <label className={styles.searchLabel} htmlFor="findings-search">
            Search findings
          </label>
          <input
            id="findings-search"
            type="search"
            className={styles.search}
            placeholder="Title, route, or finding ID…"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
          />
        </div>

        <div className={styles.filterGrid}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>Severity</legend>
            <div className={styles.pills}>
              {SEVERITY_ORDER.map((severity) => {
                const active = filters.severities.includes(severity);
                return (
                  <button
                    key={severity}
                    type="button"
                    aria-pressed={active}
                    className={`${styles.pill} ${active ? styles.pillOn : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        severities: toggle(prev.severities, severity),
                      }))
                    }
                  >
                    {SEVERITY_BADGE[severity].label}
                    <span className={styles.count}>{sevCounts[severity]}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Status</legend>
            <div className={styles.pills}>
              {STATUS_ORDER.map((status) => {
                const active = filters.statuses.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    className={`${styles.pill} ${active ? styles.pillOn : ""}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        statuses: toggle(prev.statuses, status),
                      }))
                    }
                  >
                    {STATUS_BADGE[status].label}
                    <span className={styles.count}>{stCounts[status]}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className={styles.group}>
            <label className={styles.legend} htmlFor="findings-project">
              Project
            </label>
            <select
              id="findings-project"
              className={styles.select}
              value={filters.projectId ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  projectId: event.target.value === "" ? null : event.target.value,
                }))
              }
            >
              <option value="">All projects</option>
              {SAMPLE_PROJECTS.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.resultRow}>
          <p className={styles.resultCount} aria-live="polite">
            {visible.length} of {SAMPLE_FINDINGS.length} findings
          </p>
          {filtered && (
            <button
              type="button"
              className={styles.reset}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No findings match these filters</p>
          <p className={styles.emptyBody}>
            Try a different search term or clear a filter facet.
          </p>
          <button
            type="button"
            className={styles.reset}
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul className={styles.cards}>
          {visible.map((finding) => (
            <li key={finding.id} className={styles.card}>
              <Link
                href={`/app/findings/${finding.id}`}
                className={styles.cardLink}
                aria-label={`Open finding ${finding.title}`}
              >
                <span className={styles.cardTop}>
                  <span
                    className={`${styles.badge} ${SEVERITY_BADGE[finding.severity].tint}`}
                  >
                    {SEVERITY_BADGE[finding.severity].label}
                  </span>
                  <span
                    className={`${styles.badge} ${STATUS_BADGE[finding.remediationStatus].tint}`}
                  >
                    {STATUS_BADGE[finding.remediationStatus].label}
                  </span>
                </span>
                <span className={styles.cardTitle}>{finding.title}</span>
                <span className={styles.cardMeta}>
                  {projectName(finding.projectId)} · {finding.affectedRoute}
                </span>
                <span className={styles.cardSummary}>{finding.summary}</span>
                <span className={styles.cardFoot}>
                  <span>{finding.id}</span>
                  <span>
                    {SAMPLE_PROVENANCE[finding.id] ?? "Sample scenario"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
