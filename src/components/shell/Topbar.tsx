import { SimulatedDemoBadge } from '../shared/SimulatedDemoBadge';
import { Breadcrumbs } from './Breadcrumbs';
import { ModeToggle } from './ModeToggle';
import type { ShellDemoMode } from './nav';
import styles from './Topbar.module.css';

interface TopbarProps {
  currentPath: string;
  mode: ShellDemoMode;
  onModeChange: (mode: ShellDemoMode) => void;
  workspaceName: string;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
}

/**
 * Workspace header: mobile menu button, breadcrumbs, Simulated demo pill,
 * Builder/Developer toggle. Sticky within the shell content column.
 */
export function Topbar({
  currentPath,
  mode,
  onModeChange,
  workspaceName,
  drawerOpen,
  onToggleDrawer,
}: TopbarProps) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={drawerOpen}
        aria-controls="hc-sidebar"
        aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={onToggleDrawer}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
          className={styles.menuIcon}
        >
          {drawerOpen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <div className={styles.crumbs}>
        <Breadcrumbs path={currentPath} />
      </div>

      <div className={styles.right}>
        <span className={styles.workspace} title={workspaceName}>
          {workspaceName}
        </span>
        <SimulatedDemoBadge compact />
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>
    </header>
  );
}
