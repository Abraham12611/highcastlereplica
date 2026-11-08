import type { DemoFinding } from '../types';
import { findingScanLinks, getScanSeedById } from './history';

/**
 * Seed fixture: 18 distinct synthetic findings, 10 with verified fixes.
 *
 * Timestamps are derived from the linked scans in history.ts so discovery
 * and verification dates can never drift apart. All prose describes
 * staged samples; nothing here asserts a real vulnerability.
 */

type FindingDraft = Omit<DemoFinding, 'projectId' | 'scanId' | 'firstSeenAt' | 'lastSeenAt' | 'evidenceIds'> & {
  id: string;
};

const drafts: FindingDraft[] = [
  {
    id: 'fnd-01',
    title: 'Invoice IDOR allows reading another synthetic invoice (sample)',
    severity: 'high',
    confidence: 'confirmed_by_execution',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: requesting a synthetic invoice id owned by Bob while authenticated as Alice returned HTTP 200 in the vulnerable revision.',
    impact:
      'In a real system this class of flaw would expose other customers\u2019 invoices. Here both principals and invoices are fixtures.',
    affectedRoute: '/invoices/:id',
  },
  {
    id: 'fnd-02',
    title: 'Coupon replay accepted twice in scripted checkout (sample)',
    severity: 'high',
    confidence: 'supported_by_analysis',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: a one-time coupon code was accepted on two consecutive scripted checkouts because redemption was not recorded atomically.',
    impact: 'Illustrates double-spend logic risk on synthetic orders only.',
    affectedRoute: '/api/checkout/apply-coupon',
  },
  {
    id: 'fnd-03',
    title: 'Invoice export missing owner check (sample)',
    severity: 'medium',
    confidence: 'supported_by_analysis',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: the CSV export endpoint authorized the workspace but not the invoice owner.',
    impact: 'Sample-only illustration of missing object-level authorization.',
    affectedRoute: '/invoices/:id/export',
  },
  {
    id: 'fnd-04',
    title: 'Verbose error echoes invoice identifiers (sample)',
    severity: 'low',
    confidence: 'suspected',
    remediationStatus: 'open',
    summary:
      'Staged sample: a 404 body for unknown invoice ids included internal identifier formatting hints.',
    impact: 'Low-severity information-shape observation in synthetic responses.',
    affectedRoute: '/invoices/:id',
  },
  {
    id: 'fnd-05',
    title: 'Invoice preview rate limit too lenient (sample)',
    severity: 'medium',
    confidence: 'supported_by_analysis',
    remediationStatus: 'in_progress',
    summary:
      'Staged sample: the preview endpoint allowed bursts well above the documented demo policy.',
    impact: 'Remediation in progress in the fictional backlog; no live traffic exists.',
    affectedRoute: '/invoices/:id/preview',
  },
  {
    id: 'fnd-06',
    title: 'Unencoded template field reflected in invoice view (sample)',
    severity: 'high',
    confidence: 'supported_by_analysis',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: a memo field was interpolated into the invoice view without output encoding in the vulnerable revision.',
    impact: 'Scripted proof used a harmless marker string, never a real payload.',
    affectedRoute: '/invoices/:id/view',
  },
  {
    id: 'fnd-07',
    title: 'Sample report metadata includes internal labels (sample)',
    severity: 'informational',
    confidence: 'inconclusive',
    remediationStatus: 'accepted_risk',
    summary:
      'Staged sample: generated PDF metadata carried internal fixture labels.',
    impact: 'Accepted as demo noise; fixture labels are not sensitive.',
    affectedRoute: '/reports/:id/download',
  },
  {
    id: 'fnd-08',
    title: 'Cross-workspace membership accepted without invite (sample)',
    severity: 'high',
    confidence: 'confirmed_by_execution',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: a scripted join request for a second synthetic workspace succeeded without an invite token.',
    impact: 'Tenant-isolation illustration using synthetic workspaces only.',
    affectedRoute: '/api/workspaces/:id/members',
  },
  {
    id: 'fnd-09',
    title: 'Cart total recalculated from client value (sample)',
    severity: 'critical',
    confidence: 'supported_by_analysis',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: the scripted checkout trusted a client-supplied total instead of recomputing from line items.',
    impact: 'Price-integrity illustration on synthetic carts; no real payments.',
    affectedRoute: '/api/cart/total',
  },
  {
    id: 'fnd-10',
    title: 'Checkout rate limit bypass via header rotation (sample)',
    severity: 'medium',
    confidence: 'supported_by_analysis',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: rotating a forwarding header reset the demo throttle counter in the vulnerable revision.',
    impact: 'Throttling illustration against the mock runner, never a live host.',
    affectedRoute: '/api/checkout',
  },
  {
    id: 'fnd-11',
    title: 'Session lifetime longer than demo policy (sample)',
    severity: 'low',
    confidence: 'suspected',
    remediationStatus: 'open',
    summary:
      'Staged sample: synthetic session tokens remained valid past the documented demo idle timeout.',
    impact: 'Session-hygiene note in the fictional backlog.',
    affectedRoute: '/api/session/refresh',
  },
  {
    id: 'fnd-12',
    title: 'Third-party script tag without integrity hash (sample)',
    severity: 'medium',
    confidence: 'suspected',
    remediationStatus: 'pending_verification',
    summary:
      'Staged sample: a demo storefront page referenced a synthetic CDN script without a subresource-integrity hash.',
    impact: 'Supply-chain hygiene note; fix staged, awaiting verification scan.',
    affectedRoute: '/storefront',
  },
  {
    id: 'fnd-13',
    title: 'Role parameter escalates synthetic member to admin (sample)',
    severity: 'critical',
    confidence: 'confirmed_by_execution',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: a profile update accepted role=admin for a synthetic member in the vulnerable revision.',
    impact: 'Privilege-control illustration with synthetic accounts only.',
    affectedRoute: '/api/members/:id',
  },
  {
    id: 'fnd-14',
    title: 'Ticket note markup rendered without sanitization (sample)',
    severity: 'high',
    confidence: 'supported_by_analysis',
    remediationStatus: 'open',
    summary:
      'Staged sample: ticket notes rendered a subset of markup without sanitization in the reviewed revision.',
    impact: 'Open in the fictional backlog; proof used a harmless marker.',
    affectedRoute: '/tickets/:id/notes',
  },
  {
    id: 'fnd-15',
    title: 'Workspace pages missing security headers (sample)',
    severity: 'low',
    confidence: 'supported_by_analysis',
    remediationStatus: 'in_progress',
    summary:
      'Staged sample: demo workspace pages omitted two recommended hardening headers.',
    impact: 'Defense-in-depth note; remediation in progress fictionally.',
    affectedRoute: '/workspace/:id',
  },
  {
    id: 'fnd-16',
    title: 'Attachment download skips ticket ownership (sample)',
    severity: 'medium',
    confidence: 'supported_by_analysis',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: attachment URLs authorized the ticket queue but not the requesting synthetic agent.',
    impact: 'Authorization illustration on synthetic tickets and files.',
    affectedRoute: '/tickets/:id/attachments/:file',
  },
  {
    id: 'fnd-17',
    title: 'Assignment notifications enumerable by id (sample)',
    severity: 'medium',
    confidence: 'suspected',
    remediationStatus: 'verified_fixed',
    summary:
      'Staged sample: sequential notification ids allowed enumerating other synthetic agents\u2019 assignments.',
    impact: 'Enumeration illustration; ids are synthetic and non-sensitive.',
    affectedRoute: '/api/notifications/:id',
  },
  {
    id: 'fnd-18',
    title: 'Verbose lookup error on ticket search (sample)',
    severity: 'low',
    confidence: 'suspected',
    remediationStatus: 'open',
    summary:
      'Staged sample: ticket search errors disclosed query-parsing details useful only for demo narration.',
    impact: 'Low-severity demo noise left open in the fictional backlog.',
    affectedRoute: '/tickets/search',
  },
];

function buildFinding(draft: FindingDraft): DemoFinding {
  const link = findingScanLinks[draft.id];
  if (!link) throw new Error(`No scan link for finding ${draft.id}`);
  const discovery = getScanSeedById(link.discoveryScanId);
  if (!discovery) throw new Error(`Unknown discovery scan for ${draft.id}`);
  const verification = link.verificationScanId ? getScanSeedById(link.verificationScanId) : undefined;
  return {
    ...draft,
    projectId: discovery.projectId,
    scanId: discovery.id,
    firstSeenAt: discovery.startedAt,
    lastSeenAt: verification ? verification.startedAt : discovery.startedAt,
    evidenceIds: [`ev-${draft.id}-http`, `ev-${draft.id}-assert`],
  };
}

export const findings: DemoFinding[] = drafts.map(buildFinding);

export const TOTAL_FINDINGS = 18;
export const VERIFIED_FIX_COUNT = 10;

export function getFindingSeedById(findingId: string): DemoFinding | undefined {
  return findings.find((f) => f.id === findingId);
}
