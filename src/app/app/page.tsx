import { Dashboard } from '@/features/dashboard/Dashboard';
// Fixture index is owned by the seed-data lane (docs/04: exactly 63 scans,
// 18 findings, 10 verified fixes across the 4 Northstar Labs projects).
// This page consumes that canonical module; all dashboard counts are derived
// from its rows via selectors — nothing is hardcoded here.
import { demoFindings, demoProjects, demoScans, demoWorkspace } from '@/demo/fixtures';

export const metadata = {
  title: 'Workspace overview — HighCastle demo',
  description:
    'Simulated demo: Northstar Labs sample workspace with 90 days of seeded activity.',
};

/**
 * Route: /app — populated workspace overview (dashboard lane).
 * Server component: fixtures are static sample records, so no client
 * state is needed. The shared shell (nav/mode toggle) wraps this route.
 */
export default function WorkspaceOverviewPage() {
  return (
    <Dashboard
      workspaceName={demoWorkspace.name}
      projects={demoProjects}
      scans={demoScans}
      findings={demoFindings}
    />
  );
}
