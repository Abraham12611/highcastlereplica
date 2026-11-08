import { useState } from 'react';
import type { AttackMapEdgeState, AttackMapProps, AttackMapRevision } from './types';
import { ATTACK_MAP_REVISIONS, buildAttackPath } from './attackPathModel';
import styles from './attack-map.module.css';

/* Fixed SVG canvas. viewBox scaling keeps the graph legible at 1440px and 390px. */
const NODE_W = 150;
const NODE_H = 88;

interface NodeGeom {
  kind: 'rect' | 'diamond';
  /** Center point, used for edge routing and caption anchoring. */
  cx: number;
  cy: number;
  /** Top-left for rect nodes. */
  x: number;
  y: number;
  lines: string[];
}

const GEOMETRY: Record<string, NodeGeom> = {
  alice: { kind: 'rect', cx: 95, cy: 220, x: 20, y: 176, lines: ['Alice', 'user_A · tenant_A'] },
  endpoint: {
    kind: 'rect',
    cx: 285,
    cy: 220,
    x: 210,
    y: 176,
    lines: ['Invoice lookup', 'GET /api/invoices/:id'],
  },
  boundary: { kind: 'diamond', cx: 475, cy: 220, x: 0, y: 0, lines: [] },
  'invoice-b': {
    kind: 'rect',
    cx: 675,
    cy: 120,
    x: 600,
    y: 76,
    lines: ['Bob invoice', 'invoice_B · user_B'],
  },
  'invoice-a': {
    kind: 'rect',
    cx: 675,
    cy: 320,
    x: 600,
    y: 276,
    lines: ['Alice invoice', 'invoice_A · user_A'],
  },
};

const EDGE_PATHS: Record<string, string> = {
  'e-session': 'M170 220 H210',
  'e-route': 'M360 220 H409',
  'e-cross': 'M541 220 H570 V120 H600',
  'e-control': 'M541 220 H570 V320 H600',
};

const EDGE_LABEL_POS: Record<string, { x: number; y: number; anchor: 'middle' | 'end' }> = {
  'e-session': { x: 190, y: 208, anchor: 'middle' },
  'e-route': { x: 384, y: 238, anchor: 'middle' },
  'e-cross': { x: 564, y: 108, anchor: 'end' },
  'e-control': { x: 564, y: 308, anchor: 'end' },
};

const EDGE_CLASS: Record<AttackMapEdgeState, string> = {
  neutral: styles.edgeNeutral,
  allowed: styles.edgeAllowed,
  breach: styles.edgeBreach,
  denied: styles.edgeDenied,
};

const NODE_CLASS: Record<string, string> = {
  neutral: styles.stNeutral,
  info: styles.stInfo,
  breach: styles.stBreach,
  denied: styles.stDenied,
  allowed: styles.stAllowed,
  missing: styles.stMissing,
  enforced: styles.stEnforced,
};

const REVISION_LABEL: Record<AttackMapRevision, string> = {
  vulnerable: 'Vulnerable revision',
  patched: 'Patched revision',
};

/**
 * Interactive SVG attack path: Alice → invoice endpoint → ownership
 * authorization boundary → Bob invoice, with the own-invoice control branch.
 *
 * Deterministic sample content only. No network, no auth, no live assessment.
 * Exported for the Finding Detail page via a clean `src/features/attack-map`
 * import; all styling is scoped to the co-located CSS module.
 */
export function AttackMap({
  revision: controlledRevision,
  defaultRevision = 'vulnerable',
  onRevisionChange,
  defaultSelectedId = 'boundary',
  finding = null,
  className,
  id,
}: AttackMapProps) {
  const [internalRevision, setInternalRevision] = useState<AttackMapRevision>(defaultRevision);
  const [selectedId, setSelectedId] = useState<string>(defaultSelectedId);

  const revision = controlledRevision ?? internalRevision;
  const model = buildAttackPath(revision);
  const selected =
    model.nodes.find((node) => node.id === selectedId) ??
    model.nodes.find((node) => node.id === 'boundary') ??
    model.nodes[0];

  function setRevision(next: AttackMapRevision) {
    if (controlledRevision === undefined) setInternalRevision(next);
    onRevisionChange?.(next);
  }

  return (
    <section
      aria-label="Threat map: account, endpoint, and authorization attack path (simulated demo)"
      className={className ? `${styles.root} ${className}` : styles.root}
      id={id}
      data-revision={revision}
    >
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>Threat map — attack path</h3>
          <p className={styles.sub}>
            Alice → invoice endpoint → ownership boundary → Bob invoice
            {finding ? ` · linked finding ${finding.id}` : ''}
            {finding?.title ? ` — ${finding.title}` : ''}
          </p>
        </div>
        <span className={styles.simBadge}>Simulated demo</span>
      </div>

      <div className={styles.toggle} role="group" aria-label="Revision under test">
        {ATTACK_MAP_REVISIONS.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={revision === r}
            className={revision === r ? `${styles.toggleBtn} ${styles.toggleBtnActive}` : styles.toggleBtn}
            onClick={() => setRevision(r)}
          >
            {REVISION_LABEL[r]}
          </button>
        ))}
      </div>

      <div
        className={model.verdict.tone === 'fail' ? `${styles.verdict} ${styles.verdictFail}` : `${styles.verdict} ${styles.verdictPass}`}
        role="status"
      >
        <strong>{model.verdict.title}.</strong> {model.verdict.body}
      </div>

      <svg
        viewBox="0 0 760 440"
        className={styles.canvas}
        role="img"
        aria-label={
          revision === 'vulnerable'
            ? 'Simulated vulnerable path: Alice’s session crosses the missing ownership check and Bob’s invoice returns HTTP 200.'
            : 'Simulated patched path: the enforced ownership check denies Alice’s read of Bob’s invoice with HTTP 403 while her own invoice still returns HTTP 200.'
        }
      >
        <defs>
          <marker id="am-arrow-neutral" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowNeutral} />
          </marker>
          <marker id="am-arrow-allowed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowAllowed} />
          </marker>
          <marker id="am-arrow-breach" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowBreach} />
          </marker>
          <marker id="am-arrow-denied" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowDenied} />
          </marker>
        </defs>

        {model.edges.map((edge) => (
          <g key={edge.id}>
            <title>{edge.title}</title>
            <path
              d={EDGE_PATHS[edge.id]}
              className={`${styles.edge} ${EDGE_CLASS[edge.state]}`}
              markerEnd={`url(#am-arrow-${edge.state})`}
            />
            <text
              x={EDGE_LABEL_POS[edge.id].x}
              y={EDGE_LABEL_POS[edge.id].y}
              textAnchor={EDGE_LABEL_POS[edge.id].anchor}
              className={`${styles.edgeLabel} ${EDGE_CLASS[edge.state]}`}
            >
              {edge.label}
            </text>
          </g>
        ))}

        {model.nodes.map((node) => {
          const geom = GEOMETRY[node.id];
          const isSelected = node.id === selected.id;
          if (geom.kind === 'diamond') {
            const { cx, cy } = geom;
            const half = 66;
            return (
              <g key={node.id}>
                <g
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${node.title}, ${node.subtitle}. Status: ${node.statusLabel}. Activate for details.`}
                  className={isSelected ? `${styles.node} ${styles.nodeSelected}` : styles.node}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                >
                  <title>{`${node.title} — ${node.statusLabel}`}</title>
                  <path
                    d={`M${cx - half} ${cy} L${cx} ${cy - half} L${cx + half} ${cy} L${cx} ${cy + half} Z`}
                    className={`${styles.nodeBox} ${NODE_CLASS[node.status]}`}
                  />
                  <text x={cx} y={cy - 6} textAnchor="middle" className={styles.diamondWord}>
                    AUTHZ
                  </text>
                  <text x={cx} y={cy + 12} textAnchor="middle" className={styles.diamondState}>
                    {node.status === 'missing' ? 'MISSING' : 'ENFORCED'}
                  </text>
                </g>
                <text x={cx} y={cy + half + 22} textAnchor="middle" className={styles.nodeName}>
                  Ownership authorization
                </text>
                <text x={cx} y={cy + half + 37} textAnchor="middle" className={styles.nodeSub}>
                  {node.subtitle}
                </text>
              </g>
            );
          }
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${node.title}, ${node.subtitle}. Status: ${node.statusLabel}. Activate for details.`}
              className={isSelected ? `${styles.node} ${styles.nodeSelected}` : styles.node}
              onClick={() => setSelectedId(node.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedId(node.id);
                }
              }}
            >
              <title>{`${node.title} — ${node.statusLabel}`}</title>
              <rect
                x={geom.x}
                y={geom.y}
                width={NODE_W}
                height={NODE_H}
                rx={6}
                className={`${styles.nodeBox} ${NODE_CLASS[node.status]}`}
              />
              <rect
                x={geom.x}
                y={geom.y}
                width={4}
                height={NODE_H}
                className={`${styles.nodeBar} ${NODE_CLASS[node.status]}`}
              />
              <text x={geom.x + 14} y={geom.y + 25} className={styles.nodeName}>
                {geom.lines[0]}
              </text>
              <text x={geom.x + 14} y={geom.y + 42} className={styles.nodeSub}>
                {geom.lines[1]}
              </text>
              <g>
                <rect
                  x={geom.x + 14}
                  y={geom.y + 52}
                  width={node.statusLabel.length * 6.4 + 18}
                  height={20}
                  rx={10}
                  className={`${styles.nodePill} ${NODE_CLASS[node.status]}`}
                />
                <text x={geom.x + 23} y={geom.y + 66} className={styles.nodePillText}>
                  {node.statusLabel}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <div className={styles.lower}>
        <div className={styles.legend} aria-label="Map legend">
          <span className={styles.legendTitle}>Legend</span>
          <ul>
            <li>
              <span className={`${styles.swatch} ${styles.swBreach}`} aria-hidden="true" />
              Simulated failure (coral, solid)
            </li>
            <li>
              <span className={`${styles.swatch} ${styles.swDenied}`} aria-hidden="true" />
              Denied / blocked (mint, dashed)
            </li>
            <li>
              <span className={`${styles.swatch} ${styles.swAllowed}`} aria-hidden="true" />
              Allowed / verified (mint, solid)
            </li>
            <li>
              <span className={`${styles.swatch} ${styles.swNeutral}`} aria-hidden="true" />
              Neutral path (slate, solid)
            </li>
          </ul>
        </div>

        <div className={styles.detail} aria-live="polite" aria-label="Selected node details">
          <div className={styles.detailHead}>
            <strong>{selected.title}</strong>
            <span className={`${styles.statusPill} ${NODE_CLASS[selected.status]}`}>
              {selected.statusLabel}
            </span>
          </div>
          <p className={styles.detailSub}>{selected.subtitle}</p>
          <p>{selected.summary}</p>
          {selected.http ? (
            <div className={styles.http}>
              <div>
                <span className={styles.httpLabel}>Synthetic request</span>
                <pre className={styles.code}>{selected.http.request}</pre>
              </div>
              <div>
                <span className={styles.httpLabel}>Synthetic response</span>
                <pre className={styles.code}>{selected.http.response}</pre>
              </div>
            </div>
          ) : null}
          {selected.assertion ? (
            <p className={styles.assertion}>{selected.assertion}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
