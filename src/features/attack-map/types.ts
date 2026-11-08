/**
 * attack-map lane — local structural types.
 *
 * These mirror `docs/03_CONTRACTS.md` (`DemoFinding`, `DemoScenario`) so the
 * map codes against the frozen contract. `src/demo/types.ts` (Contracts lane)
 * has not landed yet, so the shapes below are intentionally structural: once
 * it exists, `DemoFinding` will be assignable to `AttackMapFindingRef` and the
 * `Demo*` imports can be re-pointed without changing this lane's logic.
 *
 * All data rendered through these types is deterministic sample content.
 * No network, auth, or live assessment is involved.
 */

export type AttackMapRevision = 'vulnerable' | 'patched';

export type AttackMapNodeKind = 'account' | 'endpoint' | 'boundary' | 'resource';

export type AttackMapNodeStatus =
  | 'neutral'
  | 'info'
  | 'breach'
  | 'denied'
  | 'allowed'
  | 'missing'
  | 'enforced';

export type AttackMapEdgeState = 'neutral' | 'allowed' | 'breach' | 'denied';

/** Harmless synthetic HTTP exchange shown verbatim in the details panel. */
export interface AttackMapHttpSample {
  request: string;
  response: string;
}

export interface AttackMapNode {
  id: string;
  kind: AttackMapNodeKind;
  title: string;
  subtitle: string;
  status: AttackMapNodeStatus;
  /** Status word shown inside the node badge; never color alone. */
  statusLabel: string;
  summary: string;
  http?: AttackMapHttpSample;
  /** Simulated oracle-style assertion for this node, when applicable. */
  assertion?: string;
}

export interface AttackMapEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  state: AttackMapEdgeState;
  /** Accessible description of what the edge carries. */
  title: string;
}

export interface AttackMapVerdict {
  tone: 'fail' | 'pass';
  title: string;
  body: string;
}

export interface AttackMapModel {
  revision: AttackMapRevision;
  nodes: AttackMapNode[];
  edges: AttackMapEdge[];
  verdict: AttackMapVerdict;
}

/**
 * Structural subset of the contract `DemoFinding` — only the fields this
 * lane reads. A real `DemoFinding` satisfies this interface by construction.
 */
export interface AttackMapFindingRef {
  id: string;
  title?: string;
}

export interface AttackMapProps {
  /** Controlled revision. Omit for uncontrolled (internal toggle state). */
  revision?: AttackMapRevision;
  /** Initial revision for uncontrolled use. Defaults to `'vulnerable'`. */
  defaultRevision?: AttackMapRevision;
  onRevisionChange?: (revision: AttackMapRevision) => void;
  /** Node selected on first render. Defaults to `'boundary'`. Unknown IDs fall back to `'boundary'`. */
  defaultSelectedId?: string;
  /** Optional linked finding context supplied by the Finding Detail page. */
  finding?: AttackMapFindingRef | null;
  className?: string;
  id?: string;
}
