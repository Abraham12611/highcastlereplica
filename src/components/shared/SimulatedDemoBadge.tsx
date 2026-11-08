import styles from './SimulatedDemoBadge.module.css';

interface SimulatedDemoBadgeProps {
  /** Compact shortens padding for tight topbar space. Full label text is always kept. */
  compact?: boolean;
  className?: string;
}

/**
 * Visible "Simulated demo" marker required on scenario surfaces (AGENTS.md rule 3).
 * Purely presentational: no props for custom wording so the label stays exact.
 */
export function SimulatedDemoBadge({ compact = false, className }: SimulatedDemoBadgeProps) {
  const classes = [styles.pill, compact ? styles.compact : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span
      className={classes}
      title="Simulated product walkthrough — all scans, findings and histories are seeded sample data, not live results."
    >
      <span className={styles.dot} aria-hidden="true" />
      Simulated demo
    </span>
  );
}
