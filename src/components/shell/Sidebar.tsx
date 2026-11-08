import { Badge } from '../shared/Badge';
import { SimulatedDemoBadge } from '../shared/SimulatedDemoBadge';
import {
  SHELL_NAV_ITEMS,
  isNavActive,
  type ShellBadgeCounts,
  type ShellIconName,
} from './nav';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentPath: string;
  badges?: ShellBadgeCounts;
  /** True on small screens when the drawer is open. Desktop ignores this. */
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  /** Optional SPA navigation intercept. Without it, plain anchors perform full navigation. */
  onNavigate?: (href: string) => void;
  workspaceName: string;
}

const ICON_PATHS: Record<ShellIconName, string> = {
  overview: 'M3 3h7v7H3zM14 3h7v4h-7zM14 12h7v9h-7zM3 14h7v7H3z',
  projects: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  scans: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  findings:
    'M12 3 2.5 20h19zM12 9.5V14M12 17.2v.3',
  reports: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h7M9 17h7',
  automation: 'M13 2 4 14h6l-1 8 9-12h-6z',
  integrations: 'M9 3H3v6h6zM21 9h-6v6h6zM15 3h6v6h-6zM9 15H3v6h6zM6 9v6M12 12h3M9 6h6',
  settings:
    'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
};

function NavIcon({ name }: { name: ShellIconName }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const BADGE_LABEL: Record<string, string> = {
  findingsOpen: 'open findings',
  scansRunning: 'running scans',
  reportsNew: 'new reports',
};

const BADGE_TONE = {
  findingsOpen: 'coral',
  scansRunning: 'cyan',
  reportsNew: 'mint',
} as const;

/**
 * Left rail navigation. Desktop: fixed rail. Mobile: off-canvas drawer
 * controlled by `drawerOpen` (the shell owns the toggle + Escape handling).
 */
export function Sidebar({
  currentPath,
  badges,
  drawerOpen,
  onCloseDrawer,
  onNavigate,
  workspaceName,
}: SidebarProps) {
  const asideClass = drawerOpen ? `${styles.aside} ${styles.open}` : styles.aside;
  return (
    <aside className={asideClass} aria-label="Demo workspace navigation" id="hc-sidebar">
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          H
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>HighCastle</span>
          <span className={styles.workspace} title={workspaceName}>
            {workspaceName}
          </span>
        </span>
      </div>

      <nav aria-label="Primary" className={styles.nav}>
        <ul className={styles.list}>
          {SHELL_NAV_ITEMS.map((item) => {
            const active = isNavActive(currentPath, item);
            const badgeKey = item.badge;
            const count = badgeKey && badges ? badges[badgeKey] : undefined;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={active ? `${styles.link} ${styles.active}` : styles.link}
                  onClick={
                    onNavigate
                      ? (event) => {
                          event.preventDefault();
                          onCloseDrawer();
                          onNavigate(item.href);
                        }
                      : () => onCloseDrawer()
                  }
                >
                  <NavIcon name={item.icon} />
                  <span className={styles.label}>{item.label}</span>
                  {badgeKey ? (
                    <Badge count={count} label={BADGE_LABEL[badgeKey]} tone={BADGE_TONE[badgeKey]} />
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.foot}>
        <SimulatedDemoBadge />
        <p className={styles.footNote}>Seeded sample data. No live scans.</p>
      </div>
    </aside>
  );
}
