import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { ShellBadgeCounts, ShellDemoMode } from './nav';
import styles from './DashboardShell.module.css';

const MODE_STORAGE_KEY = 'hc-demo-mode';
const DEFAULT_WORKSPACE = 'Northstar Labs (Sample)';

export interface DashboardShellProps {
  children: ReactNode;
  /** Current route path, e.g. "/app/findings". Defaults to "/app". */
  currentPath?: string;
  /** Controlled mode. Omit for uncontrolled with localStorage persistence. */
  mode?: ShellDemoMode;
  defaultMode?: ShellDemoMode;
  onModeChange?: (mode: ShellDemoMode) => void;
  /** Workspace display name. Seeded default keeps the sample-data framing. */
  workspaceName?: string;
  /** Badge counts derived from fixture rows by the hosting page. */
  badges?: ShellBadgeCounts;
  /** Optional SPA navigation intercept. Without it, anchors navigate normally. */
  onNavigate?: (href: string) => void;
}

function readStoredMode(): ShellDemoMode | null {
  try {
    const value = window.localStorage.getItem(MODE_STORAGE_KEY);
    return value === 'builder' || value === 'developer' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Shared dark app shell: left rail, workspace topbar with Simulated demo
 * pill and Builder/Developer toggle, responsive drawer, breadcrumbs.
 *
 * Deterministic and demo-only: renders props/children, persists only the
 * mode preference to localStorage (after mount, SSR-safe), performs no
 * fetching. Content column caps width; pages render inside `children`.
 */
export function DashboardShell({
  children,
  currentPath = '/app',
  mode: controlledMode,
  defaultMode = 'builder',
  onModeChange,
  workspaceName = DEFAULT_WORKSPACE,
  badges,
  onNavigate,
}: DashboardShellProps) {
  const [internalMode, setInternalMode] = useState<ShellDemoMode>(defaultMode);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate persisted mode after mount so SSR/first paint stay deterministic.
  useEffect(() => {
    if (controlledMode === undefined) {
      const stored = readStoredMode();
      if (stored) setInternalMode(stored);
    }
  }, [controlledMode]);

  const mode = controlledMode ?? internalMode;

  const handleModeChange = useCallback(
    (next: ShellDemoMode) => {
      if (controlledMode === undefined) {
        setInternalMode(next);
        try {
          window.localStorage.setItem(MODE_STORAGE_KEY, next);
        } catch {
          // Storage unavailable (private mode): mode still works for the session.
        }
      }
      onModeChange?.(next);
    },
    [controlledMode, onModeChange],
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);

  // Escape closes the drawer; mobile drawer locks background scroll while open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  return (
    <div className={styles.shell} data-demo-mode={mode}>
      <a className={styles.skip} href="#hc-content">
        Skip to content
      </a>
      <Sidebar
        currentPath={currentPath}
        badges={badges}
        drawerOpen={drawerOpen}
        onCloseDrawer={closeDrawer}
        onNavigate={onNavigate}
        workspaceName={workspaceName}
      />
      {drawerOpen ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close navigation menu"
          onClick={closeDrawer}
          tabIndex={-1}
        />
      ) : null}
      <div className={styles.main}>
        <Topbar
          currentPath={currentPath}
          mode={mode}
          onModeChange={handleModeChange}
          workspaceName={workspaceName}
          drawerOpen={drawerOpen}
          onToggleDrawer={toggleDrawer}
        />
        <main id="hc-content" className={styles.content} tabIndex={-1}>
          {children}
        </main>
        <footer className={styles.footer}>
          <span>Simulated demo — seeded sample data, no live scans.</span>
        </footer>
      </div>
    </div>
  );
}
