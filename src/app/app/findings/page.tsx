// Findings-index lane: route `/app/findings` (issue #10).
// Server-safe: no browser globals at module scope; filtering state lives in
// the client component, which initializes after mount.

import FindingsList from "@/features/findings/list/findings-list";

export const metadata = {
  title: "Findings — HighCastle demo",
};

export default function FindingsPage() {
  return <FindingsList />;
}
