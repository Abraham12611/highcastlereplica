/**
 * Hidden recording operator route (issue #13).
 *
 * Deliberately NOT linked from the main navigation shell: operators reach it
 * by direct URL (`/recording`). Carries its own "Simulated demo" context and
 * stays `noindex` so it never surfaces as product surface.
 */
import type { Metadata } from 'next';
import { RecordingConsole } from '@/features/recording/RecordingConsole';

export const metadata: Metadata = {
  title: 'Recording operator console — Simulated demo',
  description:
    'Hidden deterministic operator tool for recording the HighCastle simulated walkthrough. Preauthored sample timelines only.',
  robots: { index: false, follow: false },
};

export default function RecordingPage(): React.JSX.Element {
  return (
    <main id="main-content">
      <RecordingConsole />
    </main>
  );
}
