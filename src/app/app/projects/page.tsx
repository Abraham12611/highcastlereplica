import ProjectsList from '../../../features/projects/ProjectsList';

export const metadata = {
  title: 'Projects · HighCastle Simulated Demo',
  description:
    'Sample workspace project list. Deterministic demo-only data; user URLs are display-only.',
};

export default function ProjectsPage() {
  return <ProjectsList />;
}
