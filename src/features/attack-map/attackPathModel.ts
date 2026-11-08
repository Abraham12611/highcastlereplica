/**
 * Deterministic attack-path graph model for the signature BOLA/IDOR invoice
 * scenario (docs/04_SCENARIOS_AND_DATA.md).
 *
 * Canonical fixture identities (frozen with the original HighCastle
 * target-lab contract):
 *   alice -> user_A / tenant_A owns invoice_A (INV-2026-0001)
 *   bob   -> user_B / tenant_B owns invoice_B (INV-2026-0002)
 *
 * Two revisions of the SAME graph are produced:
 *   - `vulnerable`: ownership check missing; Alice -> Bob invoice reads 200.
 *   - `patched`:    owner match enforced; Alice -> Bob invoice reads 403,
 *                    Alice -> Alice invoice control still reads 200.
 *
 * Pure data, no React, no randomness, no dates generated at runtime — safe to
 * unit-test and to render on server or client with identical output.
 */

import type {
  AttackMapEdge,
  AttackMapModel,
  AttackMapNode,
  AttackMapRevision,
  AttackMapVerdict,
} from './types';

const ENDPOINT_ROUTE = 'GET /api/invoices/:id';

const BASELINE_REQUEST = [
  'GET /api/invoices/invoice_A HTTP/1.1',
  'X-Synthetic-Session: lab-session-user_A (fixture)',
].join('\n');

const BASELINE_RESPONSE = [
  'HTTP/1.1 200 OK',
  'Content-Type: application/json',
  '',
  '{ "id": "invoice_A", "number": "INV-2026-0001",',
  '  "ownerId": "user_A", "tenantId": "tenant_A",',
  '  "total": "$1,299.00", "access": "owner-match" }',
].join('\n');

const CROSS_REQUEST = [
  'GET /api/invoices/invoice_B HTTP/1.1',
  'X-Synthetic-Session: lab-session-user_A (fixture)',
].join('\n');

const CROSS_RESPONSE_VULNERABLE = [
  'HTTP/1.1 200 OK',
  'Content-Type: application/json',
  '',
  '{ "id": "invoice_B", "number": "INV-2026-0002",',
  '  "ownerId": "user_B", "tenantId": "tenant_B",',
  '  "total": "$542.50", "access": "no-owner-check (simulated failure)" }',
].join('\n');

const CROSS_RESPONSE_PATCHED = [
  'HTTP/1.1 403 Forbidden',
  'Content-Type: application/json',
  '',
  '{ "error": "forbidden",',
  '  "reason": "owner-mismatch: invoice_B is owned by user_B (simulated)" }',
].join('\n');

function aliceNode(): AttackMapNode {
  return {
    id: 'alice',
    kind: 'account',
    title: 'Alice · authenticated session',
    subtitle: 'user_A · tenant_A',
    status: 'info',
    statusLabel: 'Caller',
    summary:
      'Sample actor Alice (user_A of tenant_A) owns invoice_A. Her synthetic ' +
      'session is the caller for both the own-invoice control and the ' +
      'cross-tenant probe — the identity never changes, only the target does.',
    http: {
      request: 'X-Synthetic-Session: lab-session-user_A (fixture)',
      response: 'session principal: user_A · tenant_A (synthetic, deterministic)',
    },
  };
}

function endpointNode(): AttackMapNode {
  return {
    id: 'endpoint',
    kind: 'endpoint',
    title: 'Invoice lookup',
    subtitle: ENDPOINT_ROUTE,
    status: 'neutral',
    statusLabel: 'Endpoint',
    summary:
      'The endpoint resolves an invoice by its ID from the route. Whether the ' +
      'caller may see that invoice is decided downstream, at the ownership ' +
      'authorization boundary — the single gate this map is about.',
  };
}

function boundaryNode(revision: AttackMapRevision): AttackMapNode {
  if (revision === 'vulnerable') {
    return {
      id: 'boundary',
      kind: 'boundary',
      title: 'Ownership authorization',
      subtitle: 'vulnerable revision',
      status: 'missing',
      statusLabel: 'Check missing',
      summary:
        'Vulnerable revision: the lookup applies no owner or tenant predicate ' +
        'for the authenticated actor. Any authenticated session that names a ' +
        'known fixture ID receives that invoice — the simulated failure.',
      assertion:
        'Simulated oracle assertion FAILED: cross-tenant read returned HTTP 200.',
    };
  }
  return {
    id: 'boundary',
    kind: 'boundary',
    title: 'Ownership authorization',
    subtitle: 'patched revision',
    status: 'enforced',
    statusLabel: 'Enforced',
    summary:
      'Patched revision: invoice.ownerId must match the authenticated ' +
      'principal, otherwise the request is rejected with HTTP 403. The rule ' +
      'is the whole fix — no other behavior changes.',
    assertion:
      'Simulated assertions PASSED: cross-tenant read denied (403) and ' +
      'own-invoice control still allowed (200).',
  };
}

function bobNode(revision: AttackMapRevision): AttackMapNode {
  if (revision === 'vulnerable') {
    return {
      id: 'invoice-b',
      kind: 'resource',
      title: "Bob invoice · returned",
      subtitle: 'invoice_B · INV-2026-0002 · owner user_B',
      status: 'breach',
      statusLabel: 'HTTP 200 · leaked',
      summary:
        "Alice's session reading Bob's invoice (invoice_B, owned by user_B of " +
        'tenant_B) returned HTTP 200 with Bob fixture data. This is the ' +
        'simulated BOLA/IDOR failure — scripted sample content, not a live finding.',
      http: { request: CROSS_REQUEST, response: CROSS_RESPONSE_VULNERABLE },
      assertion:
        'Simulated oracle: response body carries ownerId user_B while caller ' +
        'is user_A — ownership violation (simulated).',
    };
  }
  return {
    id: 'invoice-b',
    kind: 'resource',
    title: 'Bob invoice · denied',
    subtitle: 'invoice_B · INV-2026-0002 · owner user_B',
    status: 'denied',
    statusLabel: 'HTTP 403 · blocked',
    summary:
      "Alice's session reading Bob's invoice is rejected with HTTP 403 " +
      'because invoice.ownerId (user_B) does not match the caller (user_A). ' +
      'No invoice data is returned — the patched boundary held.',
    http: { request: CROSS_REQUEST, response: CROSS_RESPONSE_PATCHED },
  };
}

function controlNode(): AttackMapNode {
  return {
    id: 'invoice-a',
    kind: 'resource',
    title: 'Alice invoice · control',
    subtitle: 'invoice_A · INV-2026-0001 · owner user_A',
    status: 'allowed',
    statusLabel: 'HTTP 200 · control',
    summary:
      'Positive control, identical in both revisions: Alice reading her own ' +
      'invoice returns HTTP 200. The oracle requires this baseline before any ' +
      'cross-tenant claim, and the patch must preserve it.',
    http: { request: BASELINE_REQUEST, response: BASELINE_RESPONSE },
  };
}

function edgesFor(revision: AttackMapRevision): AttackMapEdge[] {
  return [
    {
      id: 'e-session',
      from: 'alice',
      to: 'endpoint',
      label: 'session user_A',
      state: 'neutral',
      title: 'Alice’s synthetic session calls the invoice endpoint.',
    },
    {
      id: 'e-route',
      from: 'endpoint',
      to: 'boundary',
      label: ENDPOINT_ROUTE,
      state: 'neutral',
      title: 'Every lookup passes the ownership authorization boundary.',
    },
    {
      id: 'e-cross',
      from: 'boundary',
      to: 'invoice-b',
      label: revision === 'vulnerable' ? '200 · cross-tenant read' : '403 · owner mismatch',
      state: revision === 'vulnerable' ? 'breach' : 'denied',
      title:
        revision === 'vulnerable'
          ? 'Simulated failure: the missing check lets the cross-tenant read through with HTTP 200.'
          : 'Patched boundary: the cross-tenant read is rejected with HTTP 403.',
    },
    {
      id: 'e-control',
      from: 'boundary',
      to: 'invoice-a',
      label: '200 · owner match (control)',
      state: 'allowed',
      title:
        'Control path, unchanged by the patch: the owner’s own read returns HTTP 200.',
    },
  ];
}

function verdictFor(revision: AttackMapRevision): AttackMapVerdict {
  if (revision === 'vulnerable') {
    return {
      tone: 'fail',
      title: 'Simulated failure — BOLA/IDOR (sample data)',
      body: 'Alice → Bob invoice returned HTTP 200 because the ownership check was missing.',
    };
  }
  return {
    tone: 'pass',
    title: 'Simulated fix verified (sample data)',
    body: 'Alice → Bob invoice now returns HTTP 403, and the Alice → Alice control still returns HTTP 200.',
  };
}

/** Build the full deterministic graph for one revision. */
export function buildAttackPath(revision: AttackMapRevision): AttackMapModel {
  const nodes: AttackMapNode[] = [
    aliceNode(),
    endpointNode(),
    boundaryNode(revision),
    bobNode(revision),
    controlNode(),
  ];
  return { revision, nodes, edges: edgesFor(revision), verdict: verdictFor(revision) };
}

/** Node lookup helper for the component and tests. */
export function getNode(model: AttackMapModel, id: string): AttackMapNode | undefined {
  return model.nodes.find((node) => node.id === id);
}

export const ATTACK_MAP_REVISIONS: readonly AttackMapRevision[] = [
  'vulnerable',
  'patched',
] as const;
