import NewProjectWizard from '../../../../features/projects/NewProjectWizard';

export const metadata = {
  title: 'New Project · HighCastle Simulated Demo',
  description:
    'Create a demo project with a display-only URL and a prepared sample scenario. Nothing is fetched or scanned.',
};

export default function NewProjectPage() {
  return <NewProjectWizard />;
}
