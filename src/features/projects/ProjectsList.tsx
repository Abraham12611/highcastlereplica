'use client';

import Link from 'next/link';
import { useMemo, useState, type ChangeEvent } from 'react';
import {
  SAMPLE_SCENARIOS,
  SIMULATED_DEMO_LABEL,
  WORKSPACE_NAME,
  scenarioById,
} from './projects-catalog';
import { useDemoProjects } from './use-demo-projects';
import styles from './projects.module.css';

type StatusFilter = 'all' | 'ready' | 'attention' | 'scanning';

const STATUS_BADGE: Record<string, string> = {
  ready: styles.hcBadgeMint,
  attention: styles.hcBadgeCoral,
  scanning: styles.hcBadgeCyan,
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'scanning', label: 'Scanning' },
];

export default function ProjectsList() {
  const { projects, mounted, resetToSamples, sampleCount } = useDemoProjects();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.url.toLowerCase().includes(q)
      );
    });
  }, [projects, query, status]);

  return (
    <div className={styles.hcProjects}>
      <div className={styles.hcInner}>
        <div className={styles.hcHeaderRow}>
          <div>
            <p className={styles.hcEyebrow}>
              <span className={`${styles.hcBadge} ${styles.hcBadgeMint}`}>
                <span className={styles.hcDot} aria-hidden="true" />
                {SIMULATED_DEMO_LABEL}
              </span>
              <span>Sample workspace · {WORKSPACE_NAME}</span>
            </p>
            <h1 className={styles.hcTitle}>Projects</h1>
            <p className={styles.hcSubtitle}>
              {projects.length} projects ({sampleCount} seeded samples). Every scan, finding and
              timeline in this workspace is fictional sample data.
            </p>
          </div>
          <div className={styles.hcActions}>
            <Link className={`${styles.hcButton} ${styles.hcButtonPrimary}`} href="/app/projects/new">
              New project
            </Link>
          </div>
        </div>

        <div className={styles.hcToolbar} role="search">
          <input
            className={`${styles.hcInput} ${styles.hcSearch}`}
            type="search"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search name, description or URL…"
            aria-label="Search projects"
          />
          <div className={styles.hcFilterGroup} role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={styles.hcChip}
                aria-pressed={status === f.id}
                onClick={() => setStatus(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!mounted ? (
          <div className={styles.hcEmpty} aria-live="polite">
            Loading sample workspace…
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.hcEmpty}>
            <p>No projects match this filter.</p>
            <p>
              <Link href="/app/projects/new">Create a demo project</Link> or clear the search.
            </p>
          </div>
        ) : (
          <ul className={styles.hcGrid}>
            {visible.map((p) => {
              const scenario = scenarioById(p.scenarioId);
              return (
                <li key={p.id} className={styles.hcCard}>
                  <Link className={styles.hcCardLink} href={`/app/projects/${p.id}`}>
                    <span className={styles.hcCardTop}>
                      <span className={`${styles.hcBadge} ${STATUS_BADGE[p.status] ?? ''}`}>
                        <span className={styles.hcDot} aria-hidden="true" />
                        {p.status === 'attention' ? 'Needs attention' : p.status}
                      </span>
                      {p.sample ? (
                        <span className={`${styles.hcBadge} ${styles.hcBadgeViolet}`}>Sample</span>
                      ) : (
                        <span className={styles.hcBadge}>Custom</span>
                      )}
                    </span>
                    <span className={styles.hcCardName}>{p.name}</span>
                    <span className={styles.hcCardDesc}>{p.description}</span>
                    <span className={styles.hcCardMeta}>
                      {/* URL rendered as text on purpose: display-only, never a fetched link. */}
                      <span className={styles.hcUrlText}>{p.url}</span>
                      <span>
                        Scenario: {scenario ? scenario.title : p.scenarioId} · Created{' '}
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </Link>
                  <span className={styles.hcCardFoot}>
                    <Link className={styles.hcButton} href={`/app/projects/${p.id}`}>
                      Open
                    </Link>
                    <Link
                      className={`${styles.hcButton} ${styles.hcButtonGhost}`}
                      href={`/app/scans?project=${encodeURIComponent(p.id)}`}
                    >
                      Scans
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className={styles.hcHint} style={{ marginTop: '1rem' }}>
          {SAMPLE_SCENARIOS.length} prepared scenarios available ·{' '}
          <button
            type="button"
            className={styles.hcChip}
            onClick={resetToSamples}
            title="Remove custom projects from this browser and restore the four samples"
          >
            Reset to samples
          </button>
        </p>
      </div>
    </div>
  );
}
