import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DemoFinding, DemoProject, DemoScan, DemoSeverity } from '@/demo/types';
import { ActivityChart } from './ActivityChart';
import styles from './dashboard.module.css';
import {
  formatPhase,
  getActivitySeries,
  getProjectHealth,
  getRecentScans,
  getRecentVerifiedFixes,
  getRiskDistribution,
  getUrgentFindings,
  getWorkspaceTotals,
} from './selectors';

export interface DashboardProps {
  workspaceName: string;
  projects: DemoProject[];
  scans: DemoScan[];
  findings: DemoFinding[];
}

const SEVERITY_LABEL: Record<DemoSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  informational: 'Informational',
};

function severityClass(severity: DemoSeverity): string {
  switch (severity) {
    case 'critical':
      return styles['sev-critical'];
    case 'high':
      return styles['sev-high'];
    case 'medium':
      return styles['sev-medium'];
    case 'low':
      return styles['sev-low'];
    case 'informational':
      return styles['sev-informational'];
  }
}

function statusPillClass(status: DemoProject['status']): string {
  if (status === 'ready') return `${styles.statusPill} ${styles.statusReady}`;
  if (status === 'attention') return `${styles.statusPill} ${styles.statusAttention}`;
  return `${styles.statusPill} ${styles.statusScanning}`;
}

function scanPillClass(status: DemoScan['status']): string {
  const base = styles.pill;
  if (status === 'completed') return `${base} ${styles.pillCompleted}`;
  if (status === 'running' || status === 'queued') return `${base} ${styles.pillRunning}`;
  if (status === 'failed') return `${base} ${styles.pillFailed}`;
  return base;
}

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Unknown date';
  return new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function projectName(projects: DemoProject[], projectId: string): string {
  return projects.find((p) => p.id === projectId)?.name ?? 'Unknown project';
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: ReactNode }) {
  return (
    <div className={styles.card}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      {sub ? <p className={styles.statSub}>{sub}</p> : null}
    </div>
  );
}

function ProjectCard({ project, scans, findings }: { project: DemoProject; scans: DemoScan[]; findings: DemoFinding[] }) {
  const health = getProjectHealth(project, scans, findings);
  return (
    <Link href={`/app/projects/${project.id}`} className={styles.projectCard}>
      <div className={styles.projectTop}>
        <h3 className={styles.projectName}>{project.name}</h3>
        <span className={statusPillClass(project.status)}>{project.status}</span>
      </div>
      <p className={styles.projectUrl}>{project.url}</p>
      <p className={styles.projectDesc}>{project.description}</p>
      <div className={styles.healthRow}>
        <span className={styles.healthItem}>
          <strong>{health.scanCount}</strong> scans
        </span>
        <span className={styles.healthItem}>
          <strong>{health.openFindings}</strong> open findings
        </span>
        <span className={styles.healthItem}>
          <strong>{health.verifiedFixes}</strong> verified fixed
        </span>
        <span className={styles.healthItem}>
          <strong>
            {health.worstOpenSeverity ? SEVERITY_LABEL[health.worstOpenSeverity] : 'None'}
          </strong>
          highest open severity
        </span>
      </div>
    </Link>
  );
}

function RiskDistribution({ findings }: { findings: DemoFinding[] }) {
  const slices = getRiskDistribution(findings);
  const max = Math.max(1, ...slices.map((s) => s.totalCount));
  if (slices.length === 0) {
    return <p className={styles.empty}>No findings in the sample dataset yet.</p>;
  }
  return (
    <div role="list" aria-label="Open findings by severity">
      {slices.map((slice) => (
        <div key={slice.severity} role="listitem" className={styles.riskRow}>
          <span className={styles.riskLabel}>
            <span className={`${styles.severityDot} ${severityClass(slice.severity)}`} aria-hidden="true" />
            {SEVERITY_LABEL[slice.severity]}
          </span>
          <span
            className={styles.riskTrack}
            role="img"
            aria-label={`${SEVERITY_LABEL[slice.severity]}: ${slice.openCount} open of ${slice.totalCount}`}
          >
            <span
              className={`${styles.riskFill} ${severityClass(slice.severity)}`}
              style={{ width: `${Math.round((slice.totalCount / max) * 100)}%` }}
            />
          </span>
          <span className={styles.riskCount}>
            {slice.openCount} / {slice.totalCount}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScanHistory({ scans, projects }: { scans: DemoScan[]; projects: DemoProject[] }) {
  const recent = getRecentScans(scans, 7);
  if (recent.length === 0) {
    return <p className={styles.empty}>No scans in the sample dataset yet.</p>;
  }
  return (
    <ul className={styles.list}>
      {recent.map((scan) => (
        <li key={scan.id} className={styles.listItem}>
          <Link href={`/app/scans/${scan.id}`} className={styles.listLink}>
            <p className={styles.itemTitle}>
              {projectName(projects, scan.projectId)} &middot; {formatPhase(scan.phase)}
            </p>
            <p className={styles.itemMeta}>
              {formatDate(scan.startedAt)} &middot; {scan.findings.length} finding
              {scan.findings.length === 1 ? '' : 's'} &middot; {scan.events.length} events
            </p>
          </Link>
          <span className={scanPillClass(scan.status)}>{scan.status}</span>
        </li>
      ))}
    </ul>
  );
}

function UrgentFindings({ findings }: { findings: DemoFinding[] }) {
  const urgent = getUrgentFindings(findings, 5);
  if (urgent.length === 0) {
    return <p className={styles.empty}>No open critical or high findings. Sample workspace is clear.</p>;
  }
  return (
    <ul className={styles.list}>
      {urgent.map((finding) => (
        <li key={finding.id} className={styles.listItem}>
          <Link href={`/app/findings/${finding.id}`} className={styles.listLink}>
            <p className={styles.itemTitle}>{finding.title}</p>
            <p className={styles.itemMeta}>
              {SEVERITY_LABEL[finding.severity]} &middot; {finding.affectedRoute} &middot; seen{' '}
              {formatDate(finding.lastSeenAt)}
            </p>
          </Link>
          <span className={`${styles.pill} ${severityClass(finding.severity)}`}>
            {finding.severity}
          </span>
        </li>
      ))}
    </ul>
  );
}

function VerifiedFixes({ findings }: { findings: DemoFinding[] }) {
  const fixes = getRecentVerifiedFixes(findings, 4);
  if (fixes.length === 0) {
    return <p className={styles.empty}>No verified fixes yet in the sample dataset.</p>;
  }
  return (
    <ul className={styles.list}>
      {fixes.map((finding) => (
        <li key={finding.id} className={styles.listItem}>
          <Link href={`/app/replays/${finding.scanId}`} className={styles.listLink}>
            <p className={styles.itemTitle}>{finding.title}</p>
            <p className={styles.itemMeta}>
              Verified {formatDate(finding.lastSeenAt)} &middot; replay asserts patched behavior
            </p>
          </Link>
          <span className={`${styles.pill} ${styles.pillVerified}`}>verified fixed</span>
        </li>
      ))}
    </ul>
  );
}

export function Dashboard({ workspaceName, projects, scans, findings }: DashboardProps) {
  const totals = getWorkspaceTotals(projects, scans, findings);
  const weeks = getActivitySeries(scans, findings, 90);

  return (
    <main className={styles.page} aria-label={`${workspaceName} workspace overview`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Sample workspace <span className={styles.badge}>Simulated demo</span>
          </p>
          <h1 className={styles.title}>{workspaceName}</h1>
          <p className={styles.subtitle}>
            Ninety days of seeded sample activity across {totals.projectCount} projects. Every
            count below is derived from the sample dataset &mdash; no live scans, no real hosts,
            no production data.
          </p>
        </div>
        <nav className={styles.actions} aria-label="Workspace actions">
          <Link href="/app/projects/new" className={styles.primaryBtn}>
            New assessment
          </Link>
          <Link href="/app/reports" className={styles.ghostBtn}>
            View reports
          </Link>
        </nav>
      </header>

      <section className={styles.statGrid} aria-label="Workspace totals">
        <StatCard value={String(totals.scanCount)} label="Sample scans (90 days)" />
        <StatCard
          value={String(totals.openFindingCount)}
          label="Open findings"
          sub={
            totals.criticalOpenCount > 0 ? (
              <>
                <strong>{totals.criticalOpenCount} critical</strong> need attention
              </>
            ) : (
              <>No critical findings open</>
            )
          }
        />
        <StatCard
          value={String(totals.verifiedFixCount)}
          label="Verified fixes"
          sub={<>of {totals.findingCount} total findings</>}
        />
        <StatCard
          value={String(totals.activeScanCount)}
          label="Active scans"
          sub={<>{totals.completedScanCount} completed in window</>}
        />
      </section>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.span8}`} aria-labelledby="projects-heading">
          <div className={styles.cardHead}>
            <h2 id="projects-heading" className={styles.cardTitle}>
              Projects
            </h2>
            <Link href="/app/projects" className={styles.cardLink}>
              View all projects
            </Link>
          </div>
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} scans={scans} findings={findings} />
            ))}
          </div>
        </section>

        <section className={`${styles.card} ${styles.span4}`} aria-labelledby="risk-heading">
          <div className={styles.cardHead}>
            <h2 id="risk-heading" className={styles.cardTitle}>
              Risk distribution
            </h2>
            <Link href="/app/findings" className={styles.cardLink}>
              All findings
            </Link>
          </div>
          <RiskDistribution findings={findings} />
        </section>

        <section className={`${styles.card} ${styles.span8}`} aria-labelledby="activity-heading">
          <div className={styles.cardHead}>
            <h2 id="activity-heading" className={styles.cardTitle}>
              Activity &mdash; trailing 90 days
            </h2>
            <Link href="/app/scans" className={styles.cardLink}>
              Scan history
            </Link>
          </div>
          <ActivityChart weeks={weeks} />
        </section>

        <section className={`${styles.card} ${styles.span4}`} aria-labelledby="urgent-heading">
          <div className={styles.cardHead}>
            <h2 id="urgent-heading" className={styles.cardTitle}>
              Needs attention
            </h2>
            <Link href="/app/findings" className={styles.cardLink}>
              Triage
            </Link>
          </div>
          <UrgentFindings findings={findings} />
        </section>

        <section className={`${styles.card} ${styles.span6}`} aria-labelledby="history-heading">
          <div className={styles.cardHead}>
            <h2 id="history-heading" className={styles.cardTitle}>
              Recent scans
            </h2>
            <Link href="/app/scans" className={styles.cardLink}>
              View all scans
            </Link>
          </div>
          <ScanHistory scans={scans} projects={projects} />
        </section>

        <section className={`${styles.card} ${styles.span6}`} aria-labelledby="fixes-heading">
          <div className={styles.cardHead}>
            <h2 id="fixes-heading" className={styles.cardTitle}>
              Recent verified fixes
            </h2>
            <Link href="/app/findings" className={styles.cardLink}>
              All findings
            </Link>
          </div>
          <VerifiedFixes findings={findings} />
        </section>
      </div>

      <p className={styles.footnote}>
        Simulated demo &mdash; all investigations, findings, and replays shown here are preauthored
        sample records for recording. Entering a real URL elsewhere in the demo never triggers a
        real scan.
      </p>
    </main>
  );
}
