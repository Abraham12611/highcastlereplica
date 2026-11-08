/**
 * Signature invoice scenario — staged BOLA walkthrough (SIMULATED DEMO).
 *
 * Deterministic, preauthored sample data only. Nothing here performs live
 * scans, network requests, auth, Vultr execution, model inference, or
 * database access. All users (Alice, Bob), invoice IDs, requests, responses,
 * and verdicts are harmless synthetic fixtures for the recorded product tour.
 * Surfaces rendering this scenario must show a visible "Simulated demo" label
 * and must never present these samples as findings about a real submitted URL.
 *
 * Lane ownership: scenario lane only (`src/demo/fixtures/scenarios/invoice.ts`).
 * Seed/index lanes: import `invoiceScenario`, `invoiceFinding`, and
 * `invoiceEvidence` from here instead of redefining them, and adopt the stable
 * IDs below so cross-file references stay coherent.
 */

import type { DemoEvidence, DemoFinding, DemoScenario } from '../../types';

/** Canonical seed IDs shared with the workspace seed and scan history. */
export const invoiceProjectId = 'proj-invoicecloud';
export const invoiceScenarioId = 'scenario-invoice-bola';
export const invoiceScanId = 'scan-invoicecloud-bola-001';
export const invoiceReplayScanId = 'scan-invoicecloud-bola-replay-001';
export const invoiceFindingId = 'finding-invoice-bola-001';

/** Display-only sample hostname. Never fetched, scanned, or verified. */
export const invoiceSampleHost = 'https://invoices.northstar-labs.sample.test';

/** Harmless synthetic invoice IDs owned by the fixture users. */
export const aliceInvoiceId = 'INV-SYN-1001';
export const bobInvoiceId = 'INV-SYN-1042';

/**
 * Synthetic evidence records referenced by `evidenceId` from the timeline.
 * Every record is marked `synthetic: true` with a stable digest string.
 */
export const invoiceEvidence: DemoEvidence[] = [
  {
    id: 'ev-invoice-policy-approval',
    scanId: invoiceScanId,
    findingId: invoiceFindingId,
    kind: 'policy_approval',
    assertion:
      'SIMULATED DEMO — policy approved a read-only sample test of two synthetic invoices; no live system was touched.',
    digest: 'syn:policy-approval:bola-001',
    synthetic: true,
  },
  {
    id: 'ev-invoice-baseline-200',
    scanId: invoiceScanId,
    findingId: invoiceFindingId,
    kind: 'http_baseline',
    request: [
      'GET /api/invoices/INV-SYN-1001 HTTP/1.1',
      'Host: invoices.northstar-labs.sample.test',
      'Authorization: Bearer sess_synth_alice_01 (SYNTHETIC)',
      'X-Simulated-Demo: true',
    ].join('\n'),
    response: [
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      'X-Simulated-Demo: true',
      '',
      '{"id":"INV-SYN-1001","owner":"alice","total":"42.00","currency":"USD","synthetic":true}',
    ].join('\n'),
    assertion:
      'SIMULATED DEMO — owner reads own synthetic invoice: HTTP 200 (baseline control).',
    digest: 'syn:baseline:alice-own-200',
    synthetic: true,
  },
  {
    id: 'ev-invoice-bola-200',
    scanId: invoiceScanId,
    findingId: invoiceFindingId,
    kind: 'http_vulnerable_read',
    request: [
      'GET /api/invoices/INV-SYN-1042 HTTP/1.1',
      'Host: invoices.northstar-labs.sample.test',
      'Authorization: Bearer sess_synth_alice_01 (SYNTHETIC)',
      'X-Simulated-Demo: true',
    ].join('\n'),
    response: [
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      'X-Simulated-Demo: true',
      '',
      '{"id":"INV-SYN-1042","owner":"bob","total":"380.00","currency":"USD","synthetic":true}',
    ].join('\n'),
    assertion:
      'SIMULATED DEMO — Alice reads Bob’s synthetic invoice on the staged vulnerable revision: HTTP 200 (scripted sample).',
    digest: 'syn:bola:alice-bob-200',
    synthetic: true,
  },
  {
    id: 'ev-invoice-oracle-confirm',
    scanId: invoiceScanId,
    findingId: invoiceFindingId,
    kind: 'oracle_assertion',
    assertion:
      'SIMULATED DEMO — synthetic oracle: authenticated principal (alice) != record owner (bob) with HTTP 200, so BOLA is confirmed within the simulation.',
    digest: 'syn:oracle:bola-confirmed',
    synthetic: true,
  },
  {
    id: 'ev-invoice-containment-deny',
    scanId: invoiceScanId,
    findingId: invoiceFindingId,
    kind: 'containment_denial',
    request: 'DELETE /api/invoices/INV-SYN-1042 (OUT OF SCOPE — ILLUSTRATION ONLY)',
    response: 'DENIED — out-of-scope write blocked by sample policy (illustration, not a runtime event)',
    assertion:
      'SIMULATED DEMO — prohibited out-of-scope write is blocked as an illustration of containment; nothing was executed.',
    digest: 'syn:containment:deny-delete',
    synthetic: true,
  },
  {
    id: 'ev-invoice-replay-bob-403',
    scanId: invoiceReplayScanId,
    findingId: invoiceFindingId,
    kind: 'http_patched_denial',
    request: [
      'GET /api/invoices/INV-SYN-1042 HTTP/1.1',
      'Host: invoices.northstar-labs.sample.test',
      'Authorization: Bearer sess_synth_alice_01 (SYNTHETIC)',
      'X-Simulated-Demo: true',
      'X-Sample-Revision: rev-1.4.2-sample (SIMULATED)',
    ].join('\n'),
    response: [
      'HTTP/1.1 403 Forbidden',
      'Content-Type: application/json',
      'X-Simulated-Demo: true',
      '',
      '{"error":"forbidden","reason":"owner mismatch","synthetic":true}',
    ].join('\n'),
    assertion:
      'SIMULATED DEMO — patched sample revision denies cross-owner read: HTTP 403.',
    digest: 'syn:replay:bob-403',
    synthetic: true,
  },
  {
    id: 'ev-invoice-replay-alice-200',
    scanId: invoiceReplayScanId,
    findingId: invoiceFindingId,
    kind: 'http_positive_control',
    request: [
      'GET /api/invoices/INV-SYN-1001 HTTP/1.1',
      'Host: invoices.northstar-labs.sample.test',
      'Authorization: Bearer sess_synth_alice_01 (SYNTHETIC)',
      'X-Simulated-Demo: true',
      'X-Sample-Revision: rev-1.4.2-sample (SIMULATED)',
    ].join('\n'),
    response: [
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      'X-Simulated-Demo: true',
      '',
      '{"id":"INV-SYN-1001","owner":"alice","total":"42.00","currency":"USD","synthetic":true}',
    ].join('\n'),
    assertion:
      'SIMULATED DEMO — patched sample revision still serves the owner’s own invoice: HTTP 200 (positive control).',
    digest: 'syn:replay:alice-200',
    synthetic: true,
  },
  {
    id: 'ev-invoice-verdict',
    scanId: invoiceReplayScanId,
    findingId: invoiceFindingId,
    kind: 'verdict',
    assertion:
      'SIMULATED DEMO — verified_fixed: cross-owner read denied (403) while owner read still succeeds (200) on the staged patched revision.',
    digest: 'syn:verdict:verified-fixed',
    synthetic: true,
  },
];

/**
 * Initial investigation timeline: 32 staged events, offsets in virtual
 * milliseconds (~2:48 at 1x). `seq` is the canonical ordering key; `offsetMs`
 * drives the engine reveal schedule. Every entry is a fictional status
 * summary, never raw model reasoning and never a live result.
 */
const invoiceEvents: DemoScenario['events'] = [
  {
    id: 'inv-plan-e01-scope',
    seq: 1,
    offsetMs: 0,
    phase: 'queued',
    actor: 'system',
    title: 'Simulated assessment queued',
    summary:
      'Simulated demo: sample assessment queued for the InvoiceCloud scenario (display-only host invoices.northstar-labs.sample.test).',
    detail:
      'The entered URL is display text only. It is never fetched, scanned, or verified; every result below comes from this preauthored fixture.',
    status: 'done',
  },
  {
    id: 'inv-plan-e02-identities',
    seq: 2,
    offsetMs: 4000,
    phase: 'queued',
    actor: 'system',
    title: 'Sample dataset pinned',
    summary:
      'Simulated demo: synthetic users Alice and Bob with harmless invoices INV-SYN-1001 (Alice) and INV-SYN-1042 (Bob) pinned for the run.',
    status: 'done',
  },
  {
    id: 'inv-recon-e03-inventory',
    seq: 3,
    offsetMs: 9000,
    phase: 'recon',
    actor: 'agent',
    title: 'Inventorying sample surface (illustrated)',
    summary:
      'Simulated demo: agent lists routes from the bundled sample manifest — no live traffic is sent.',
    detail: 'Illustrated route table: GET /api/invoices/:id, GET /api/invoices, GET /health (sample manifest, not probed).',
    status: 'done',
  },
  {
    id: 'inv-recon-e04-routes',
    seq: 4,
    offsetMs: 15000,
    phase: 'recon',
    actor: 'agent',
    title: 'Mapping invoice read path',
    summary:
      'Simulated demo: agent notes the invoice detail route accepts an object ID path parameter in the sample manifest.',
    status: 'done',
  },
  {
    id: 'inv-recon-e05-owner-field',
    seq: 5,
    offsetMs: 21000,
    phase: 'recon',
    actor: 'agent',
    title: 'Spotting owner-scoped pattern',
    summary:
      'Simulated demo: sample responses carry an owner field; the agent hypothesizes the read path may not check it.',
    detail: 'Fictional status summary: both sample invoices expose {id, owner, total}; ownership looks unenforced in the staged revision.',
    status: 'done',
  },
  {
    id: 'inv-recon-e06-hypothesis',
    seq: 6,
    offsetMs: 27000,
    phase: 'recon',
    actor: 'agent',
    title: 'Hypothesis: missing owner check (BOLA)',
    summary:
      'Simulated demo hypothesis (violet): GET /api/invoices/:id may serve any invoice ID to any authenticated sample user.',
    status: 'done',
  },
  {
    id: 'inv-recon-e07-vultr-plan',
    seq: 7,
    offsetMs: 34000,
    phase: 'recon',
    actor: 'agent',
    title: 'Illustrative run plan presented',
    summary:
      'Simulated demo: a Vultr-style illustrative plan is shown as a static storyboard card — it is not executed on Vultr or anywhere live.',
    detail:
      'Illustrated steps: 1) mint synthetic sessions, 2) baseline read of own invoice, 3) cross-owner read of staged vulnerable revision, 4) synthetic oracle assertion. Illustration only.',
    status: 'done',
  },
  {
    id: 'inv-plan-e08-bounded',
    seq: 8,
    offsetMs: 41000,
    phase: 'planning',
    actor: 'agent',
    title: 'Bounded test plan drafted',
    summary:
      'Simulated demo: plan limited to two read-only sample requests plus one synthetic oracle assertion.',
    status: 'done',
  },
  {
    id: 'inv-plan-e09-exclusions',
    seq: 9,
    offsetMs: 47000,
    phase: 'planning',
    actor: 'agent',
    title: 'Out-of-scope actions excluded',
    summary:
      'Simulated demo: writes, deletes, exports, and any non-sample host are explicitly excluded from the plan.',
    status: 'done',
  },
  {
    id: 'inv-plan-e10-stop',
    seq: 10,
    offsetMs: 53000,
    phase: 'planning',
    actor: 'agent',
    title: 'Checkpoints and stop conditions',
    summary:
      'Simulated demo: plan stops after the oracle assertion or on any unexpected response shape; nothing retries against live systems.',
    status: 'done',
  },
  {
    id: 'inv-policy-e11-approval',
    seq: 11,
    offsetMs: 60000,
    phase: 'policy',
    actor: 'policy',
    title: 'Policy approves sample test',
    summary:
      'Simulated demo: policy approves the read-only sample test against the two synthetic invoices.',
    evidenceId: 'ev-invoice-policy-approval',
    status: 'done',
  },
  {
    id: 'inv-policy-e12-guardrails',
    seq: 12,
    offsetMs: 66000,
    phase: 'policy',
    actor: 'policy',
    title: 'Guardrails pinned',
    summary:
      'Simulated demo: read-only, two invoice IDs, synthetic sessions only; writes remain denied for the whole run.',
    status: 'done',
  },
  {
    id: 'inv-prep-e13-runner',
    seq: 13,
    offsetMs: 72000,
    phase: 'preparing',
    actor: 'runner',
    title: 'Mock runner provisioned',
    summary:
      'Simulated demo: a mock runner lifecycle starts inside the simulation — no sandbox or cloud job is created.',
    status: 'done',
  },
  {
    id: 'inv-prep-e14-sessions',
    seq: 14,
    offsetMs: 78000,
    phase: 'preparing',
    actor: 'runner',
    title: 'Synthetic sessions minted',
    summary:
      'Simulated demo: synthetic sessions sess_synth_alice_01 and sess_synth_bob_01 minted; they authenticate against fixtures only.',
    status: 'done',
  },
  {
    id: 'inv-prep-e15-fixtures',
    seq: 15,
    offsetMs: 84000,
    phase: 'preparing',
    actor: 'runner',
    title: 'Baseline fixtures loaded',
    summary:
      'Simulated demo: INV-SYN-1001 (owner alice) and INV-SYN-1042 (owner bob) loaded from the fixture bundle.',
    status: 'done',
  },
  {
    id: 'inv-exec-e16-baseline',
    seq: 16,
    offsetMs: 91000,
    phase: 'executing',
    actor: 'runner',
    title: 'Alice reads own invoice → 200',
    summary:
      'Simulated demo: Alice requests INV-SYN-1001 and receives HTTP 200 with her own record (baseline control).',
    detail: 'Expected control: an owner can always read their own synthetic invoice.',
    request: 'GET /api/invoices/INV-SYN-1001 — Authorization: synthetic Alice session',
    response: 'HTTP 200 — {"id":"INV-SYN-1001","owner":"alice","total":"42.00 USD"} (synthetic)',
    evidenceId: 'ev-invoice-baseline-200',
    status: 'done',
  },
  {
    id: 'inv-exec-e17-control',
    seq: 17,
    offsetMs: 97000,
    phase: 'executing',
    actor: 'runner',
    title: 'Control assertion recorded',
    summary:
      'Simulated demo: baseline recorded — owner access to own record succeeds as expected.',
    status: 'done',
  },
  {
    id: 'inv-exec-e18-bola',
    seq: 18,
    offsetMs: 103000,
    phase: 'executing',
    actor: 'runner',
    title: 'Alice reads Bob invoice → 200 (vulnerable revision)',
    summary:
      'Simulated demo: Alice requests INV-SYN-1042 on the staged vulnerable revision and receives HTTP 200 with Bob’s record — the scripted sample.',
    detail: 'This 200 is the staged defect being demonstrated, not a discovery about any real system.',
    request: 'GET /api/invoices/INV-SYN-1042 — Authorization: synthetic Alice session',
    response: 'HTTP 200 — {"id":"INV-SYN-1042","owner":"bob","total":"380.00 USD"} (synthetic)',
    evidenceId: 'ev-invoice-bola-200',
    status: 'done',
  },
  {
    id: 'inv-exec-e19-repeat',
    seq: 19,
    offsetMs: 109000,
    phase: 'executing',
    actor: 'runner',
    title: 'Cross-owner read repeats deterministically',
    summary:
      'Simulated demo: the scripted read is replayed once with the identical staged 200 to keep the walkthrough deterministic.',
    status: 'done',
  },
  {
    id: 'inv-exec-e20-readonly',
    seq: 20,
    offsetMs: 114000,
    phase: 'executing',
    actor: 'runner',
    title: 'Runner stays read-only',
    summary:
      'Simulated demo: no write, delete, or export is attempted; the synthetic session ends after reads.',
    status: 'done',
  },
  {
    id: 'inv-verify-e21-compare',
    seq: 21,
    offsetMs: 120000,
    phase: 'verifying',
    actor: 'oracle',
    title: 'Oracle compares principal vs owner',
    summary:
      'Simulated demo: the synthetic oracle checks the authenticated principal (alice) against the record owner (bob).',
    status: 'done',
  },
  {
    id: 'inv-verify-e22-confirm',
    seq: 22,
    offsetMs: 126000,
    phase: 'verifying',
    actor: 'oracle',
    title: 'BOLA confirmed within simulation',
    summary:
      'Simulated demo: principal/owner mismatch with HTTP 200 confirms broken object-level authorization in the staged sample.',
    evidenceId: 'ev-invoice-oracle-confirm',
    status: 'done',
  },
  {
    id: 'inv-verify-e23-analysis',
    seq: 23,
    offsetMs: 131000,
    phase: 'verifying',
    actor: 'oracle',
    title: 'Analysis: authorization check missing',
    summary:
      'Simulated demo: the sample route resolves the invoice by ID but never verifies ownerId against the authenticated principal.',
    detail: 'Attack path summary: authenticate as any sample user → GET /api/invoices/<other-id> → record returned without an owner check.',
    status: 'done',
  },
  {
    id: 'inv-verify-e24-severity',
    seq: 24,
    offsetMs: 135000,
    phase: 'verifying',
    actor: 'oracle',
    title: 'Severity rationale recorded',
    summary:
      'Simulated demo: High severity with confirmed_by_execution confidence — confidence applies to the simulation only.',
    status: 'done',
  },
  {
    id: 'inv-exec-e25-contain',
    seq: 25,
    offsetMs: 139000,
    phase: 'executing',
    actor: 'policy',
    title: 'Out-of-scope write blocked (illustration)',
    summary:
      'Simulated demo: a prohibited delete of Bob’s invoice is denied by sample policy — an illustration, not a genuine runtime event.',
    detail: 'Containment ledger: DELETE /api/invoices/INV-SYN-1042 → DENIED (out of scope). Nothing was executed or modified.',
    request: 'DELETE /api/invoices/INV-SYN-1042 (OUT OF SCOPE — ILLUSTRATION ONLY)',
    response: 'DENIED — out-of-scope write blocked by sample policy',
    evidenceId: 'ev-invoice-containment-deny',
    status: 'blocked',
  },
  {
    id: 'inv-policy-e26-denial',
    seq: 26,
    offsetMs: 143000,
    phase: 'policy',
    actor: 'policy',
    title: 'Denial detail cited',
    summary:
      'Simulated demo: denial cites the pinned guardrails — read-only plan, two invoice IDs, synthetic sessions only.',
    status: 'done',
  },
  {
    id: 'inv-final-e27-finding',
    seq: 27,
    offsetMs: 147000,
    phase: 'finalizing',
    actor: 'agent',
    title: 'Finding drafted (simulated)',
    summary:
      'Simulated demo: finding finding-invoice-bola-001 drafted — invoice BOLA on the staged vulnerable revision.',
    status: 'done',
  },
  {
    id: 'inv-final-e28-impact',
    seq: 28,
    offsetMs: 151000,
    phase: 'finalizing',
    actor: 'agent',
    title: 'Plain-language impact',
    summary:
      'Simulated demo: any signed-in sample user could read any other user’s invoice data in the staged revision — names, totals, and billing detail.',
    status: 'done',
  },
  {
    id: 'inv-final-e29-fix',
    seq: 29,
    offsetMs: 155000,
    phase: 'finalizing',
    actor: 'agent',
    title: 'Fix guidance prepared',
    summary:
      'Simulated demo: enforce ownerId === authenticated principal on the invoice read path, otherwise return 403 (copyable guidance in finding detail).',
    detail: 'Sample guard: if (invoice.ownerId !== principal.id) return 403. Applies to the fictional sample only.',
    status: 'done',
  },
  {
    id: 'inv-final-e30-replay',
    seq: 30,
    offsetMs: 160000,
    phase: 'finalizing',
    actor: 'system',
    title: 'Replay armed on patched revision',
    summary:
      'Simulated demo: patch replay armed against staged sample revision rev-1.4.2-sample carrying the owner check.',
    status: 'done',
  },
  {
    id: 'inv-final-e31-history',
    seq: 31,
    offsetMs: 164000,
    phase: 'finalizing',
    actor: 'system',
    title: 'Initial finding retained in history',
    summary:
      'Simulated demo: the vulnerable-revision finding stays in scan history; its remediation badge updates after replay verifies the fix.',
    status: 'done',
  },
  {
    id: 'inv-done-e32-complete',
    seq: 32,
    offsetMs: 168000,
    phase: 'completed',
    actor: 'system',
    title: 'Investigation theater complete',
    summary:
      'Simulated demo: initial investigation complete — proceed to the patched-revision replay to verify the fix.',
    status: 'done',
  },
];

/**
 * Patched-revision replay: 8 staged events with offsets relative to the start
 * of replay playback (~0:54 at 1x). Same scripted requests, fixed behavior:
 * cross-owner read denied (403), owner read still served (200).
 */
const invoiceReplayEvents: DemoScenario['replayEvents'] = [
  {
    id: 'inv-replay-r01-staged',
    seq: 1,
    offsetMs: 0,
    phase: 'preparing',
    actor: 'runner',
    title: 'Patched revision staged (simulated)',
    summary:
      'Simulated demo: staged sample revision rev-1.4.2-sample carries the owner check — ownerId must match the authenticated principal.',
    status: 'done',
  },
  {
    id: 'inv-replay-r02-deny',
    seq: 2,
    offsetMs: 6000,
    phase: 'executing',
    actor: 'runner',
    title: 'Alice reads Bob invoice → 403',
    summary:
      'Simulated demo: Alice requests INV-SYN-1042 on the patched sample revision and receives HTTP 403 owner mismatch.',
    request: 'GET /api/invoices/INV-SYN-1042 — Authorization: synthetic Alice session',
    response: 'HTTP 403 — {"error":"forbidden","reason":"owner mismatch"} (synthetic)',
    evidenceId: 'ev-invoice-replay-bob-403',
    status: 'done',
  },
  {
    id: 'inv-replay-r03-assertion',
    seq: 3,
    offsetMs: 12000,
    phase: 'executing',
    actor: 'runner',
    title: 'Security assertion: cross-owner read denied',
    summary:
      'Simulated demo: security assertion recorded — the staged vulnerable 200 is now a staged patched 403.',
    status: 'done',
  },
  {
    id: 'inv-replay-r04-allow',
    seq: 4,
    offsetMs: 18000,
    phase: 'executing',
    actor: 'runner',
    title: 'Alice reads own invoice → 200',
    summary:
      'Simulated demo: Alice requests INV-SYN-1001 on the patched sample revision and receives HTTP 200 (positive control).',
    request: 'GET /api/invoices/INV-SYN-1001 — Authorization: synthetic Alice session',
    response: 'HTTP 200 — {"id":"INV-SYN-1001","owner":"alice","total":"42.00 USD"} (synthetic)',
    evidenceId: 'ev-invoice-replay-alice-200',
    status: 'done',
  },
  {
    id: 'inv-replay-r05-positive',
    seq: 5,
    offsetMs: 24000,
    phase: 'verifying',
    actor: 'oracle',
    title: 'Positive-control assertion',
    summary:
      'Simulated demo: owner access is preserved on the patched revision — the fix denies only cross-owner reads.',
    status: 'done',
  },
  {
    id: 'inv-replay-r06-stable',
    seq: 6,
    offsetMs: 30000,
    phase: 'verifying',
    actor: 'oracle',
    title: 'Regression check stable',
    summary:
      'Simulated demo: repeated scripted reads stay 403 (Bob) / 200 (Alice) — deterministic across replay runs.',
    status: 'done',
  },
  {
    id: 'inv-replay-r07-verdict',
    seq: 7,
    offsetMs: 38000,
    phase: 'finalizing',
    actor: 'system',
    title: 'Simulated verdict: verified_fixed',
    summary:
      'Simulated demo: separate security (403) and positive-control (200) assertions both hold — verdict verified_fixed.',
    evidenceId: 'ev-invoice-verdict',
    status: 'done',
  },
  {
    id: 'inv-replay-r08-history',
    seq: 8,
    offsetMs: 46000,
    phase: 'completed',
    actor: 'system',
    title: 'History and badge updated',
    summary:
      'Simulated demo: the initial finding stays in history; dashboards and reports reflect the verified_fixed badge.',
    status: 'done',
  },
];

/**
 * Companion finding for the scenario. The seed/index lane should adopt this
 * record (same stable ID) so finding detail, history, and dashboard badges
 * resolve against the timeline above.
 */
export const invoiceFinding: DemoFinding = {
  id: invoiceFindingId,
  projectId: invoiceProjectId,
  scanId: invoiceScanId,
  title: 'BOLA: cross-owner invoice read (simulated sample)',
  severity: 'high',
  confidence: 'confirmed_by_execution',
  remediationStatus: 'verified_fixed',
  summary:
    'Simulated demo: on the staged vulnerable revision, Alice’s synthetic session could read Bob’s synthetic invoice (HTTP 200); the staged patched revision denies it (HTTP 403).',
  impact:
    'Simulated demo, plain language: in the staged revision any signed-in sample user could read any other user’s invoice data — names, totals, and billing detail. Applies to the fixture only.',
  affectedRoute: 'GET /api/invoices/:id (sample manifest route)',
  firstSeenAt: '2026-11-02T14:05:00.000Z',
  lastSeenAt: '2026-11-08T10:20:00.000Z',
  evidenceIds: [
    'ev-invoice-policy-approval',
    'ev-invoice-baseline-200',
    'ev-invoice-bola-200',
    'ev-invoice-oracle-confirm',
    'ev-invoice-containment-deny',
    'ev-invoice-replay-bob-403',
    'ev-invoice-replay-alice-200',
    'ev-invoice-verdict',
  ],
};

/**
 * Signature scenario export consumed by the engine and scenario pickers.
 * `durationMs` covers the initial investigation run; replay offsets restart
 * at zero for replay playback.
 */
export const invoiceScenario: DemoScenario = {
  id: invoiceScenarioId,
  title: 'Invoice BOLA — Alice, Bob, and the missing owner check (Simulated demo)',
  description:
    'Simulated demo: a staged broken-object-level-authorization walkthrough on harmless synthetic invoices. Covers recon, an illustrative run plan, policy approval, mock runner reads (Alice→own 200, Alice→Bob 200), a synthetic oracle confirmation, a containment-denial illustration, and a patched-revision replay (Bob 403 + Alice 200) ending verified_fixed. No live system is involved.',
  projectId: invoiceProjectId,
  events: invoiceEvents,
  replayEvents: invoiceReplayEvents,
  findingIds: [invoiceFindingId],
  durationMs: 168000,
};

