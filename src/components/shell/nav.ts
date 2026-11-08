/**
 * Shared navigation definition for the demo app shell.
 *
 * Route table mirrors `docs/05_SCREEN_AND_FLOW_SPECS.md`. Labels and match
 * prefixes are the single source of truth for the sidebar active state and
 * the breadcrumb trail. Badge counts are display-only numbers derived from
 * fixture rows by the page that renders the shell — the shell never fetches.
 */

/** Mirrors `DemoMode` in `docs/03_CONTRACTS.md` (`src/demo/types.ts` owner: contracts lane). */
export type ShellDemoMode = 'builder' | 'developer';

export type NavBadgeKey = 'findingsOpen' | 'scansRunning' | 'reportsNew';

/** Badge counts shown on nav items. Omitted or zero hides the badge. */
export type ShellBadgeCounts = Partial<Record<NavBadgeKey, number>>;

export interface ShellNavItem {
  href: string;
  label: string;
  /** Path prefixes that mark this item active (first entry is the item href). */
  match: string[];
  badge?: NavBadgeKey;
  icon: ShellIconName;
}

export type ShellIconName =
  | 'overview'
  | 'projects'
  | 'scans'
  | 'findings'
  | 'reports'
  | 'automation'
  | 'integrations'
  | 'settings';

export const SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  { href: '/app', label: 'Overview', match: ['/app'], icon: 'overview' },
  { href: '/app/projects', label: 'Projects', match: ['/app/projects'], icon: 'projects' },
  {
    href: '/app/scans',
    label: 'Scans',
    match: ['/app/scans'],
    badge: 'scansRunning',
    icon: 'scans',
  },
  {
    href: '/app/findings',
    label: 'Findings',
    match: ['/app/findings'],
    badge: 'findingsOpen',
    icon: 'findings',
  },
  {
    href: '/app/reports',
    label: 'Reports',
    match: ['/app/reports'],
    badge: 'reportsNew',
    icon: 'reports',
  },
  { href: '/app/automation', label: 'Automation', match: ['/app/automation'], icon: 'automation' },
  {
    href: '/app/integrations',
    label: 'Integrations',
    match: ['/app/integrations'],
    icon: 'integrations',
  },
  { href: '/app/settings', label: 'Settings', match: ['/app/settings'], icon: 'settings' },
];

/** True when `path` belongs to `item` (exact href or a deeper detail route). */
export function isNavActive(path: string, item: ShellNavItem): boolean {
  if (path === item.href) return true;
  return item.match.some(
    (prefix) => prefix !== '/app' && path.startsWith(`${prefix}/`),
  );
}

/** Breadcrumb labels for a path: matched nav item plus a "Detail" crumb for nested routes. */
export function breadcrumbsForPath(path: string): { href: string; label: string }[] {
  const clean = path.split('?')[0].split('#')[0] || '/app';
  const crumbs: { href: string; label: string }[] = [];
  const item = SHELL_NAV_ITEMS.find((entry) => isNavActive(clean, entry));
  if (clean === '/' || clean === '/demo') {
    return [{ href: clean, label: clean === '/' ? 'Home' : 'Demo' }];
  }
  if (!item) {
    return [{ href: '/app', label: 'Overview' }];
  }
  if (item.href !== '/app') {
    crumbs.push({ href: '/app', label: 'Overview' });
  }
  crumbs.push({ href: item.href, label: item.label });
  if (clean !== item.href) {
    crumbs.push({ href: clean, label: 'Detail' });
  }
  return crumbs;
}
