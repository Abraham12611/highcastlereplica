/**
 * Route: /app/findings/[id] (lane: finding-detail, issue #11).
 *
 * Server wrapper: resolves the finding deterministically (fallback sample
 * dataset until canonical fixtures land) and renders the client detail
 * shell. Unknown IDs render a deterministic not-found panel — never a fetch
 * against a real host, never invented results for arbitrary input.
 */

import FindingDetail from '@/features/findings/detail/FindingDetail';
import styles from '@/features/findings/detail/detail.module.css';
import { resolveFindingDetail } from '@/features/findings/detail/source';

type RouteParams = { id: string } | Promise<{ id: string }>;

export default async function FindingDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  // `await` accepts both Next 14 (plain object) and Next 15 (promise) params.
  const { id } = await params;
  const model = resolveFindingDetail(decodeURIComponent(id));

  if (!model) {
    return (
      <div className={styles.notFound}>
        <p className={styles.simBadge}>Simulated demo</p>
        <h1 className={styles.title}>Finding not found in the sample dataset</h1>
        <p>
          No sample finding with ID “{decodeURIComponent(id)}” exists. Findings are
          only available for the staged demo scenarios — this demo never invents
          results for arbitrary input.
        </p>
        <div className={styles.ctaRow}>
          <a className={styles.cta} href="/app/findings">
            Browse sample findings
          </a>
        </div>
      </div>
    );
  }

  return <FindingDetail model={model} />;
}
