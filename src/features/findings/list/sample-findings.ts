// Findings-index lane: deterministic synthetic sample adapter.
//
// Simulated demo data only. These records stand in for the canonical seed
// dataset (docs/04: Northstar Labs sample workspace) until the seed-data lane
// lands. IDs follow the contract's stable-ID convention (`p-*` projects,
// `s-*` scans, `f-*` findings) so this list can be swapped for
// `src/demo/fixtures/` rows without changing the component. Every record is
// fictional; nothing here describes a real host or a live assessment.

import type { FindingRecord } from "./finding-filters.ts";

export interface SampleProject {
  id: string;
  name: string;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  { id: "p-invoicecloud", name: "InvoiceCloud" },
  { id: "p-cartforge", name: "CartForge" },
  { id: "p-teamdesk", name: "TeamDesk" },
  { id: "p-supportharbor", name: "SupportHarbor" },
];

export function projectName(projectId: string): string {
  return (
    SAMPLE_PROJECTS.find((project) => project.id === projectId)?.name ??
    projectId
  );
}

export const SAMPLE_FINDINGS: FindingRecord[] = [
  {
    id: "f-bola-invoice-idor",
    projectId: "p-invoicecloud",
    scanId: "s-invoicecloud-041",
    title: "Invoice object allows cross-account reads",
    severity: "high",
    remediationStatus: "open",
    summary:
      "A synthetic invoice lookup accepts another account's invoice identifier without an ownership check.",
    affectedRoute: "GET /api/invoices/{id}",
    firstSeenAt: "2026-09-02T09:14:00Z",
    lastSeenAt: "2026-11-05T16:40:00Z",
  },
  {
    id: "f-coupon-replay",
    projectId: "p-cartforge",
    scanId: "s-cartforge-022",
    title: "Coupon redemption can be replayed",
    severity: "high",
    remediationStatus: "in_progress",
    summary:
      "A synthetic checkout accepts the same single-use coupon token more than once in a scripted replay.",
    affectedRoute: "POST /api/checkout/apply-coupon",
    firstSeenAt: "2026-08-19T13:02:00Z",
    lastSeenAt: "2026-11-01T10:25:00Z",
  },
  {
    id: "f-cross-tenant-membership",
    projectId: "p-teamdesk",
    scanId: "s-teamdesk-017",
    title: "Project membership leaks across tenants",
    severity: "critical",
    remediationStatus: "open",
    summary:
      "A synthetic team-membership query returns rows for a tenant the sampled principal does not belong to.",
    affectedRoute: "GET /api/tenants/{id}/members",
    firstSeenAt: "2026-10-11T08:47:00Z",
    lastSeenAt: "2026-11-06T09:12:00Z",
  },
  {
    id: "f-rate-limit-bypass",
    projectId: "p-supportharbor",
    scanId: "s-supportharbor-009",
    title: "Ticket search tolerates rate-limit bypass",
    severity: "medium",
    remediationStatus: "pending_verification",
    summary:
      "A synthetic ticket-search endpoint keeps answering after the scripted rate budget is exhausted.",
    affectedRoute: "GET /api/tickets/search",
    firstSeenAt: "2026-09-27T15:33:00Z",
    lastSeenAt: "2026-10-30T11:58:00Z",
  },
  {
    id: "f-invoice-enumeration",
    projectId: "p-invoicecloud",
    scanId: "s-invoicecloud-038",
    title: "Sequential invoice identifiers are enumerable",
    severity: "medium",
    remediationStatus: "accepted_risk",
    summary:
      "Synthetic invoice identifiers increment predictably; the sample workspace records this as accepted risk.",
    affectedRoute: "GET /api/invoices/{id}",
    firstSeenAt: "2026-08-05T10:20:00Z",
    lastSeenAt: "2026-10-12T14:05:00Z",
  },
  {
    id: "f-cart-price-tamper",
    projectId: "p-cartforge",
    scanId: "s-cartforge-015",
    title: "Cart total trusts client-supplied price",
    severity: "critical",
    remediationStatus: "verified_fixed",
    summary:
      "A scripted cart revision once accepted a client-supplied total; the patched revision recomputes it server-side.",
    affectedRoute: "POST /api/cart/checkout",
    firstSeenAt: "2026-08-28T17:41:00Z",
    lastSeenAt: "2026-10-22T09:30:00Z",
  },
  {
    id: "f-teamdesk-redirect",
    projectId: "p-teamdesk",
    scanId: "s-teamdesk-011",
    title: "Login redirect accepts unlisted targets",
    severity: "low",
    remediationStatus: "verified_fixed",
    summary:
      "A synthetic login flow once redirected to unlisted targets; the sample now allow-lists post-login destinations.",
    affectedRoute: "GET /login?next=",
    firstSeenAt: "2026-08-14T12:00:00Z",
    lastSeenAt: "2026-09-30T18:22:00Z",
  },
  {
    id: "f-supportharbor-version",
    projectId: "p-supportharbor",
    scanId: "s-supportharbor-004",
    title: "Help widget discloses version string",
    severity: "informational",
    remediationStatus: "dismissed",
    summary:
      "A synthetic help widget renders its own version string; the sample workspace dismisses this as non-actionable.",
    affectedRoute: "GET /widget/help.js",
    firstSeenAt: "2026-08-02T09:00:00Z",
    lastSeenAt: "2026-09-15T09:00:00Z",
  },
];

/**
 * Sample provenance for each finding card: the scripted scenario that produced
 * it. Display-only labels, never assertions about real hosts.
 */
export const SAMPLE_PROVENANCE: Record<string, string> = {
  "f-bola-invoice-idor": "Sample scenario: BOLA / IDOR invoice",
  "f-coupon-replay": "Sample scenario: payment coupon replay",
  "f-cross-tenant-membership": "Sample scenario: cross-tenant membership",
  "f-rate-limit-bypass": "Sample scenario: rate-limit bypass",
  "f-invoice-enumeration": "Sample scenario: BOLA / IDOR invoice",
  "f-cart-price-tamper": "Sample scenario: payment coupon replay",
  "f-teamdesk-redirect": "Sample scenario: cross-tenant membership",
  "f-supportharbor-version": "Sample scenario: rate-limit bypass",
};
