/**
 * Finding-detail data adapter (lane: finding-detail, issue #11).
 *
 * Contract-first: all runtime records below are typed against the frozen
 * shapes in `docs/03_CONTRACTS.md` via `@/demo/types` (owned by the
 * contracts lane). This module statically imports ONLY types — never
 * runtime code from other lanes.
 *
 * Until the canonical fixtures (`src/demo/fixtures/*`, data lane) and the
 * replay route (`/app/replays/[id]`, replay lane) land, this module ships an
 * embedded deterministic fallback dataset for the flagship synthetic
 * BOLA/IDOR invoice scenario so the page renders standalone. Pass a
 * canonical registry to `resolveFindingDetail()` once fixtures exist and
 * the fallback is bypassed for known IDs.
 *
 * Every record here is synthetic sample data. Nothing is fetched, scanned,
 * or asserted about a real host.
 */

import type {
  DemoConfidence,
  DemoEvidence,
  DemoFinding,
  DemoMode,
  DemoRemediationStatus,
  DemoSeverity,
} from '@/demo/types';

/** Proposed stable IDs — offered to the data lane for the canonical fixtures. */
export const FLAGSHIP_FINDING_ID = 'finding-bola-invoice';
export const FLAGSHIP_PROJECT_ID = 'proj-invoicecloud';
export const FLAGSHIP_PROJECT_NAME = 'InvoiceCloud';
export const FLAGSHIP_SCAN_ID = 'scan-bola-invoice-001';
export const FLAGSHIP_SCENARIO_ID = 'scenario-bola-invoice';
export const FLAGSHIP_REPLAY_ID = 'replay-bola-patched-001';

export type AttackStep = {
  step: number;
  phase: string;
  actor: 'agent' | 'policy' | 'runner' | 'oracle';
  title: string;
  body: string;
  request?: string;
  result?: string;
  blocked?: boolean;
};

export type ReplayCheck = {
  check: string;
  vulnerable: string;
  patched: string;
};

export type FindingDetailModel = {
  finding: DemoFinding;
  evidence: DemoEvidence[];
  attackSteps: AttackStep[];
  replayChecks: ReplayCheck[];
  scenarioId: string;
  replayId: string;
  projectName: string;
  builderImpact: string[];
  developerImpact: string[];
  builderFix: string[];
  fixSnippet: string;
  fixPrompt: string;
  replayVerdict: string;
};

export type FindingRegistry = {
  findings: DemoFinding[];
  evidence: DemoEvidence[];
};

const FALLBACK_FINDING: DemoFinding = {
  id: FLAGSHIP_FINDING_ID,
  projectId: FLAGSHIP_PROJECT_ID,
  scanId: FLAGSHIP_SCAN_ID,
  title: 'Broken object-level authorization on invoice read (BOLA / IDOR)',
  severity: 'high',
  confidence: 'confirmed_by_execution',
  remediationStatus: 'open',
  summary:
    'In the simulated vulnerable revision, invoice read requests accept any invoice ID ' +
    'without checking that the caller owns the invoice. The scripted probe reads a second ' +
    'synthetic tenant invoice while authenticated as the first.',
  impact:
    'Hypothetical illustration for the fictional InvoiceCloud tenant only: if this sample ' +
    'behavior existed in a real product, any signed-in customer could read other customers’ ' +
    'invoices by changing the invoice number — exposing billing totals, line items, and ' +
    'customer names, and enabling invoice fraud or targeted phishing.',
  affectedRoute: 'GET /api/invoices/:invoiceId',
  firstSeenAt: '2026-08-04T09:14:00.000Z',
  lastSeenAt: '2026-11-02T16:41:00.000Z',
  evidenceIds: ['ev-bola-baseline-200', 'ev-bola-exploit-200', 'ev-bola-oracle-assertion'],
};

const FALLBACK_EVIDENCE: DemoEvidence[] = [
  {
    id: 'ev-bola-baseline-200',
    scanId: FLAGSHIP_SCAN_ID,
    findingId: FLAGSHIP_FINDING_ID,
    kind: 'http-exchange',
    request:
      'GET /api/invoices/inv_alice_1042 HTTP/1.1\n' +
      'Host: demo.local\n' +
      'Authorization: Bearer <simulated-token:alice>\n' +
      'X-Demo-Seed: northstar-042',
    response:
      'HTTP/1.1 200 OK\n' +
      'Content-Type: application/json\n' +
      '\n' +
      '{\n' +
      '  "invoiceId": "inv_alice_1042",\n' +
      '  "ownerId": "user_alice_01",\n' +
      '  "amountDue": "$184.20",\n' +
      '  "status": "sent"\n' +
      '}',
    assertion: 'Authorized baseline: owner reads own invoice → HTTP 200 (simulated).',
    digest: 'sim-baseline-9f2c41',
    synthetic: true,
  },
  {
    id: 'ev-bola-exploit-200',
    scanId: FLAGSHIP_SCAN_ID,
    findingId: FLAGSHIP_FINDING_ID,
    kind: 'http-exchange',
    request:
      'GET /api/invoices/inv_bob_2077 HTTP/1.1\n' +
      'Host: demo.local\n' +
      'Authorization: Bearer <simulated-token:alice>\n' +
      'X-Demo-Seed: northstar-042',
    response:
      'HTTP/1.1 200 OK\n' +
      'Content-Type: application/json\n' +
      '\n' +
      '{\n' +
      '  "invoiceId": "inv_bob_2077",\n' +
      '  "ownerId": "user_bob_02",\n' +
      '  "amountDue": "$96.40",\n' +
      '  "status": "sent"\n' +
      '}',
    assertion:
      'Cross-owner read returned HTTP 200 with another tenant’s fixture while ' +
      'authenticated as Alice → authorization check missing (simulated).',
    digest: 'sim-exploit-77ad10',
    synthetic: true,
  },
  {
    id: 'ev-bola-oracle-assertion',
    scanId: FLAGSHIP_SCAN_ID,
    findingId: FLAGSHIP_FINDING_ID,
    kind: 'oracle-verdict',
    assertion:
      'ownerId (user_bob_02) ≠ principal (user_alice_01) and status = 200 ⇒ ' +
      'BOLA confirmed in simulation. Independent of any real host.',
    digest: 'sim-oracle-3e5b88',
    synthetic: true,
  },
];

const FALLBACK_ATTACK_STEPS: AttackStep[] = [
  {
    step: 1,
    phase: 'Baseline',
    actor: 'runner',
    title: 'Authorized control: Alice reads her own invoice',
    body: 'Scripted control request proves the sample API works for the rightful owner before any probe runs.',
    request: 'GET /api/invoices/inv_alice_1042 as Alice',
    result: 'HTTP 200 · owner match (simulated)',
  },
  {
    step: 2,
    phase: 'Probe',
    actor: 'runner',
    title: 'Cross-owner probe: Alice requests Bob’s invoice',
    body: 'Same session, only the invoice ID changes. The vulnerable revision returns the other tenant’s fixture instead of denying access.',
    request: 'GET /api/invoices/inv_bob_2077 as Alice',
    result: 'HTTP 200 · owner mismatch, access granted (simulated leak)',
  },
  {
    step: 3,
    phase: 'Verdict',
    actor: 'oracle',
    title: 'Independent oracle confirms the authorization failure',
    body: 'A separate assertion compares principal against record owner: mismatch plus HTTP 200 means the ownership check is missing.',
    result: 'BOLA confirmed in simulation',
  },
  {
    step: 4,
    phase: 'Containment',
    actor: 'policy',
    title: 'Out-of-scope follow-up is blocked (illustration)',
    body: 'A state-changing refund against Bob’s invoice is refused by policy. Shown as a containment illustration — it was never executed.',
    request: 'POST /api/invoices/inv_bob_2077/refund as Alice',
    result: 'Blocked by policy · never executed (illustration)',
    blocked: true,
  },
  {
    step: 5,
    phase: 'Analysis',
    actor: 'agent',
    title: 'Root cause: no owner check on the read path',
    body: 'The read handler looks the invoice up by ID and returns it without comparing invoice.ownerId to the authenticated principal.',
  },
];

const FALLBACK_REPLAY_CHECKS: ReplayCheck[] = [
  {
    check: 'Alice reads her own invoice',
    vulnerable: 'HTTP 200 (simulated)',
    patched: 'HTTP 200 (simulated)',
  },
  {
    check: 'Alice reads Bob’s invoice',
    vulnerable: 'HTTP 200 — leak (simulated)',
    patched: 'HTTP 403 Forbidden (simulated)',
  },
];

const FALLBACK_MODEL: FindingDetailModel = {
  finding: FALLBACK_FINDING,
  evidence: FALLBACK_EVIDENCE,
  attackSteps: FALLBACK_ATTACK_STEPS,
  replayChecks: FALLBACK_REPLAY_CHECKS,
  scenarioId: FLAGSHIP_SCENARIO_ID,
  replayId: FLAGSHIP_REPLAY_ID,
  projectName: FLAGSHIP_PROJECT_NAME,
  builderImpact: [
    'Any signed-in customer could open another customer’s invoice just by changing the invoice number — no hacking tools needed.',
    'Exposed invoices reveal who pays what: billing totals, line items, and customer names a competitor or scammer could abuse.',
    'One leaked invoice thread is enough to erode trust in billing and trigger refund disputes, chargebacks, and churn.',
  ],
  developerImpact: [
    'Read path performs lookup-by-ID with no authorization predicate: invoice.ownerId is never compared to principal.id.',
    'Confidentiality + integrity exposure: cross-tenant read implies cross-tenant write is one missing check away on sibling routes.',
    'Fix surface is one predicate at the resource boundary; add regression tests asserting 403 on cross-owner read and 200 on owner read.',
  ],
  builderFix: [
    'Decide the rule in one sentence: an invoice is visible only to the customer who owns it and to staff with an explicit billing role.',
    'Ask engineering to add that ownership check to the invoice read request, then re-run the same two-click replay to watch Bob’s invoice get denied.',
    'Keep this finding in history as proof the check was missing, and point auditors at the replay result as the fix evidence.',
  ],
  fixSnippet:
    '// Illustrative fix — require ownership before returning the invoice.\n' +
    'function authorizeInvoiceAccess(\n' +
    '  principal: { id: string },\n' +
    '  invoice: { ownerId: string },\n' +
    ') {\n' +
    "  if (invoice.ownerId !== principal.id) {\n" +
    "    throw Object.assign(new Error('Invoice is private to its owner.'), { status: 403 });\n" +
    '  }\n' +
    '}',
  fixPrompt:
    'Enforce owner authorization on GET /api/invoices/:invoiceId (sample scope: InvoiceCloud). ' +
    'Compare invoice.ownerId to the authenticated principal id; return 403 when they differ. ' +
    'Keep the owner 200 path unchanged. Regression tests: cross-owner read → 403, owner read → 200. ' +
    'Evidence: ev-bola-baseline-200, ev-bola-exploit-200, ev-bola-oracle-assertion (all simulated).',
  replayVerdict: 'verified_fixed (simulated)',
};

/**
 * Resolve a finding-detail model by ID.
 * Prefers canonical registry rows when supplied (post-fixtures); otherwise
 * serves the embedded flagship fallback for its known ID and returns null
 * for anything else so the route can render a deterministic not-found panel.
 */
export function resolveFindingDetail(
  id: string,
  registry?: FindingRegistry,
): FindingDetailModel | null {
  if (registry) {
    const finding = registry.findings.find((f) => f.id === id);
    if (!finding) return id === FALLBACK_MODEL.finding.id ? FALLBACK_MODEL : null;
    if (id === FALLBACK_MODEL.finding.id) return FALLBACK_MODEL;
    return {
      ...FALLBACK_MODEL,
      finding,
      evidence: registry.evidence.filter((e) => e.findingId === id),
    };
  }
  return id === FALLBACK_MODEL.finding.id ? FALLBACK_MODEL : null;
}

/** Deterministic replay-route href owned by the replay lane. */
export function replayHref(replayId: string): string {
  return `/app/replays/${replayId}`;
}

const SEVERITY_LABELS: Record<DemoSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  informational: 'Informational',
};

const CONFIDENCE_LABELS: Record<DemoConfidence, string> = {
  suspected: 'Suspected in simulation',
  supported_by_analysis: 'Supported by analysis (simulated)',
  confirmed_by_execution: 'Confirmed in simulation',
  inconclusive: 'Inconclusive (simulated)',
};

const STATUS_LABELS: Record<DemoRemediationStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  pending_verification: 'Pending verification',
  verified_fixed: 'Verified fixed',
  accepted_risk: 'Accepted risk',
  dismissed: 'Dismissed',
};

export function severityLabel(severity: DemoSeverity): string {
  return SEVERITY_LABELS[severity];
}

export function confidenceLabel(confidence: DemoConfidence): string {
  return CONFIDENCE_LABELS[confidence];
}

export function remediationLabel(status: DemoRemediationStatus): string {
  return STATUS_LABELS[status];
}

export const MODE_STORAGE_KEY = 'hc-demo-mode';

export function isDemoMode(value: unknown): value is DemoMode {
  return value === 'builder' || value === 'developer';
}
