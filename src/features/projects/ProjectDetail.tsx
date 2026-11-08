'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  SIMULATED_DEMO_LABEL,
  URL_DISPLAY_ONLY_NOTICE,
  sampleScanIdFor,
  scenarioById,
} from './projects-catalog';
import { useDemoProjects } from './use-demo-projects';
import styles from './projects.module.css';

interface ProjectDetailProps {
  projectId: string;
}

/**
 * Deterministic fictional activity derived from the project row — no random
 * values, no network, no claims about the display-only URL.
 */
function activityFor(projectId: string, createdAt: string, scenarioTitle: string) {
  let hash = 0;
  for (let i = 0; i < projectId.length; i += 1) hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  const base = Date.parse(createdAt);
  const day = 86_400_000;
  const offsets = [2 * day, 9 * day, 21 * day].map((d) => ((hash % 5) + 1) * d);
  const templates = [
    `Sample assessment completed — ${scenarioTitle}`,
    'Policy gate reviewed the sample plan (illustration, no live run)',
    'Dashboard snapshot refreshed from seeded history',
  ];
  return templates.map((text, i) => ({
    text,
    at: new Date(base + offsets[i % offsets.length]).toISOString(),
  }));
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const { findProject, mounted } = useDemoProjects();
  const project = findProject(projectId);
  const scenario = project ? scenarioById(project.scenarioId) : undefined;
  const activity = useMemo(
    () =>
      project
        ? activityFor(project.id, project.createdAt, scenario?.title ?? project.scenarioId)
        : [],
    [project, scenario],
  );

  if (!mounted) {
    return (
      <div className={styles.hcProjects}>
        <div className={styles.hcInner}>
          <div className={styles.hcEmpty} aria-live="polite">
            Loading project…
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.hcProjects}>
        <div className={styles.hcInner}>
          <p className={styles.hcEyebrow}>
            <span className={`${styles.hcBadge} ${styles.hcBadgeMint}`}>{SIMULATED_DEMO_LABEL}</span>
          </p>
          <h1 className={styles.hcTitle}>Project not found</h1>
          <p className={styles.hcSubtitle}>
            No sample or custom project has id “{projectId}”. Custom projects live only in this
            browser — they may exist in another browser or after a reset.
          </p>
          <div className={styles.hcActions} style={{ marginTop: '1rem' }}>
            <Link className={`${styles.hcButton} ${styles.hcButtonPrimary}`} href="/app/projects">
              Back to projects
            </Link>
            <Link className={styles.hcButton} href="/app/projects/new">
              New project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scanId = sampleScanIdFor(project.id, project.scenarioId);
  const launchHref = `/app/scans/${encodeURIComponent(scanId)}?project=${encodeURIComponent(
    project.id,
  )}&scenario=${encodeURIComponent(project.scenarioId)}`;

  return (
    <div className={styles.hcProjects}>
      <div className={styles.hcInner}>
        <p className={styles.hcEyebrow}>
          <span className={`${styles.hcBadge} ${styles.hcBadgeMint}`}>
            <span className={styles.hcDot} aria-hidden="true" />
            {SIMULATED_DEMO_LABEL}
          </span>
          {project.sample ? (
            <span className={`${styles.hcBadge} ${styles.hcBadgeViolet}`}>Sample project</span>
          ) : (
            <span className={styles.hcBadge}>Custom project · URL display-only</span>
          )}
        </p>
        <div className={styles.hcHeaderRow}>
          <div>
            <h1 className={styles.hcTitle}>{project.name}</h1>
            <p className={styles.hcSubtitle}>{project.description}</p>
          </div>
          <div className={styles.hcActions}>
            <button
              type="button"
              className={`${styles.hcButton} ${styles.hcButtonPrimary}`}
              onClick={() => router.push(launchHref)}
            >
              Launch simulated assessment
            </button>
            <Link className={styles.hcButton} href="/app/projects">
              All projects
            </Link>
          </div>
        </div>

        <p className={styles.hcNotice}>
          <strong>Display-only URL.</strong> {URL_DISPLAY_ONLY_NOTICE} The scenario below is the
          only source of simulated findings on this page.
        </p>

        <div className={styles.hcDetailGrid}>
          <section className={styles.hcPanel} aria-label="Project overview">
            <h2>Overview</h2>
            <dl className={styles.hcKeyValues}>
              <div>
                <dt>Status</dt>
                <dd>{project.status === 'attention' ? 'Needs attention' : project.status}</dd>
              </div>
              <div>
                <dt>URL (text)</dt>
                <dd className={styles.hcUrlText}>{project.url}</dd>
              </div>
              <div>
                <dt>Scenario</dt>
                <dd>{scenario ? scenario.title : project.scenarioId}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(project.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
            {scenario && <p className={styles.hcHint}>{scenario.description}</p>}
            <div className={styles.hcActions} style={{ marginTop: '0.75rem' }}>
              <Link
                className={styles.hcButton}
                href={`/app/scans?project=${encodeURIComponent(project.id)}`}
              >
                Browse scans
              </Link>
              <Link
                className={styles.hcButton}
                href={`/app/findings?project=${encodeURIComponent(project.id)}`}
              >
                View findings
              </Link>
            </div>
          </section>

          <section className={styles.hcPanel} aria-label="Recent sample activity">
            <h2>Recent sample activity</h2>
            <ul className={styles.hcActivity}>
              {activity.map((a) => (
                <li key={`${a.at}-${a.text}`}>
                  <time dateTime={a.at}>{new Date(a.at).toLocaleDateString()}</time>
                  {a.text}
                </li>
              ))}
            </ul>
            <p className={styles.hcHint} style={{ marginTop: '0.75rem' }}>
              Seeded fictional entries. Full 90-day history lives on the dashboard and scan-history
              lanes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
