'use client';

/**
 * Tab panels for the finding-detail view (lane: finding-detail, issue #11).
 * Pure presentational components; all copy comes from `source.ts`.
 */

import { useState } from 'react';
import type { DemoMode } from '@/demo/types';
import styles from './detail.module.css';
import {
  replayHref,
  type AttackStep,
  type FindingDetailModel,
  type ReplayCheck,
} from './source';

export function OverviewPanel({
  model,
  mode,
}: {
  model: FindingDetailModel;
  mode: DemoMode;
}) {
  const { finding } = model;
  const points = mode === 'builder' ? model.builderImpact : model.developerImpact;
  return (
    <div>
      <h3>{mode === 'builder' ? 'What this means' : 'Technical summary'}</h3>
      <p>{finding.summary}</p>
      <h3>
        {mode === 'builder'
          ? 'Hypothetical business impact (illustration)'
          : 'Hypothetical impact, technical reading (illustration)'}
      </h3>
      <ul className={styles.impactList}>
        {points.map((point) => (
          <li key={point.slice(0, 32)}>{point}</li>
        ))}
      </ul>
      <p className={styles.caveat}>
        Simulated demo: impact is hypothetical for the fictional {model.projectName}{' '}
        tenant. It describes what this sample behavior would mean if it existed in a
        real product — not a claim about any real host.
      </p>
    </div>
  );
}

export function AttackPathPanel({ steps }: { steps: AttackStep[] }) {
  return (
    <div>
      <h3>Attack path (scripted sample)</h3>
      <p>
        Five scripted steps replay the simulated probe in order. Step 4 was refused by
        policy and never executed.
      </p>
      <ol className={styles.stepList}>
        {steps.map((step) => (
          <li
            key={step.step}
            className={`${styles.step} ${step.blocked ? styles.stepBlocked : ''}`}
          >
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>Step {step.step}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepMeta}>
                {step.phase} · {step.actor}
              </span>
            </div>
            <p>{step.body}</p>
            {step.request ? (
              <pre className={styles.mono}>{step.request}</pre>
            ) : null}
            {step.result ? (
              <p className={styles.result}>{step.result}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ProofPanel({ model }: { model: FindingDetailModel }) {
  return (
    <div>
      <h3>Technical proof (synthetic evidence)</h3>
      <p>
        Each exhibit carries a stable evidence ID and a synthetic digest. Requests and
        responses are harmless staged samples — safe to display and copy.
      </p>
      {model.evidence.map((item) => (
        <section key={item.id} aria-label={`Evidence ${item.id}`} className={styles.evidenceCard}>
          <div className={styles.evidenceHead}>
            <span className={styles.evidenceId}>{item.id}</span>
            <span className={styles.evidenceKind}>{item.kind}</span>
            <span className={styles.syntheticTag}>synthetic</span>
          </div>
          {item.request ? (
            <pre className={styles.mono}>{item.request}</pre>
          ) : null}
          {item.response ? (
            <pre className={styles.mono}>{item.response}</pre>
          ) : null}
          {item.assertion ? <p>{item.assertion}</p> : null}
          <p className={styles.stepMeta}>digest {item.digest} · scan {item.scanId}</p>
        </section>
      ))}
      <p className={styles.caveat}>
        Simulated demo: exhibits belong to the staged {model.scenarioId} scenario. They
        are not discoveries from any real URL.
      </p>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.copyRow}>
      <button type="button" className={styles.copyButton} onClick={copy}>
        {copied ? 'Copied' : label}
      </button>
      <span className={styles.copyNote} role="status">
        {copied ? 'Fix prompt copied to clipboard.' : 'Copies the exact text shown above.'}
      </span>
    </div>
  );
}

export function FixPanel({
  model,
  mode,
}: {
  model: FindingDetailModel;
  mode: DemoMode;
}) {
  return (
    <div>
      <h3>
        {mode === 'builder' ? 'How to fix it (plain language)' : 'Remediation (developer)'}
      </h3>
      {mode === 'builder' ? (
        <ul className={styles.impactList}>
          {model.builderFix.map((item) => (
            <li key={item.slice(0, 32)}>{item}</li>
          ))}
        </ul>
      ) : (
        <>
          <p>
            Add an ownership predicate at the resource boundary: compare{' '}
            <code>invoice.ownerId</code> to the authenticated principal and reject with
            403 on mismatch. Illustrative patch (adapt names to the real codebase):
          </p>
          <pre className={styles.mono}>{model.fixSnippet}</pre>
        </>
      )}
      <h3>Copyable fix prompt</h3>
      <pre className={styles.mono}>{model.fixPrompt}</pre>
      <CopyButton text={model.fixPrompt} label="Copy fix prompt" />
    </div>
  );
}

export function ReplayPanel({ model }: { model: FindingDetailModel }) {
  const checks: ReplayCheck[] = model.replayChecks;
  return (
    <div>
      <h3>Patched replay preview (simulated)</h3>
      <p>
        Re-running the same scripted scenario against the patched revision denies the
        cross-owner read while the owner path keeps working. Full side-by-side view
        lives on the replay route.
      </p>
      <table className={styles.compareTable}>
        <thead>
          <tr>
            <th scope="col">Check</th>
            <th scope="col">Vulnerable revision</th>
            <th scope="col">Patched revision</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((row) => (
            <tr key={row.check}>
              <th scope="row">{row.check}</th>
              <td>{row.vulnerable}</td>
              <td>{row.patched}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.verdict}>Replay verdict: {model.replayVerdict}</p>
      <div className={styles.ctaRow}>
        <a className={styles.cta} href={replayHref(model.replayId)}>
          Open patched replay
        </a>
        <a className={styles.secondaryLink} href="/app/scans">
          Back to scan history
        </a>
      </div>
    </div>
  );
}
