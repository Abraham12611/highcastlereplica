'use client';

/**
 * Finding-detail shell (lane: finding-detail, issue #11).
 * Header + Builder/Developer toggle + accessible tabs
 * (Overview, Attack path, Proof, Fix, Replay).
 *
 * Deterministic and offline: no fetching, no timers. Mode preference is
 * restored from browser storage only after mount to avoid SSR hydration
 * mismatches.
 */

import { useEffect, useState } from 'react';
import type { DemoMode } from '@/demo/types';
import styles from './detail.module.css';
import {
  AttackPathPanel,
  FixPanel,
  OverviewPanel,
  ProofPanel,
  ReplayPanel,
} from './DetailPanels';
import {
  MODE_STORAGE_KEY,
  confidenceLabel,
  isDemoMode,
  remediationLabel,
  severityLabel,
  type FindingDetailModel,
} from './source';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attack-path', label: 'Attack path' },
  { id: 'proof', label: 'Proof' },
  { id: 'fix', label: 'Fix' },
  { id: 'replay', label: 'Replay' },
] as const;

export type FindingTabId = (typeof TABS)[number]['id'];

function severityClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return styles.severityCritical;
    case 'high':
      return styles.severityHigh;
    case 'medium':
      return styles.severityMedium;
    case 'low':
      return styles.severityLow;
    default:
      return styles.severityInformational;
  }
}

export default function FindingDetail({ model }: { model: FindingDetailModel }) {
  const [activeTab, setActiveTab] = useState<FindingTabId>('overview');
  const [mode, setMode] = useState<DemoMode>('builder');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (isDemoMode(stored)) setMode(stored);
    } catch {
      // Storage unavailable (private mode, SSR): keep deterministic default.
    }
  }, []);

  function chooseMode(next: DemoMode) {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Non-fatal: preference simply won't persist.
    }
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    const nextId = TABS[next].id;
    setActiveTab(nextId);
    document.getElementById(`finding-tab-${nextId}`)?.focus();
  }

  const { finding } = model;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <span className={styles.simBadge}>Simulated demo</span>
        <div
          className={styles.modeToggle}
          role="group"
          aria-label="Explanation mode"
        >
          {(['builder', 'developer'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={styles.modeButton}
              aria-pressed={mode === option}
              onClick={() => chooseMode(option)}
            >
              {option === 'builder' ? 'Builder' : 'Developer'}
            </button>
          ))}
        </div>
      </div>

      <h1 className={styles.title}>{finding.title}</h1>

      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${severityClass(finding.severity)}`}>
          {severityLabel(finding.severity)}
        </span>
        <span className={`${styles.badge} ${styles.confidence}`}>
          {confidenceLabel(finding.confidence)}
        </span>
        <span className={`${styles.badge} ${styles.status}`}>
          {remediationLabel(finding.remediationStatus)}
        </span>
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Finding ID</dt>
          <dd>{finding.id}</dd>
        </div>
        <div>
          <dt>Affected route</dt>
          <dd>{finding.affectedRoute}</dd>
        </div>
        <div>
          <dt>Project</dt>
          <dd>
            {model.projectName} ({finding.projectId})
          </dd>
        </div>
        <div>
          <dt>Scan</dt>
          <dd>{finding.scanId}</dd>
        </div>
        <div>
          <dt>First seen</dt>
          <dd>{finding.firstSeenAt}</dd>
        </div>
        <div>
          <dt>Last seen</dt>
          <dd>{finding.lastSeenAt}</dd>
        </div>
        <div>
          <dt>Evidence IDs</dt>
          <dd>{finding.evidenceIds.join(', ')}</dd>
        </div>
      </dl>

      <div
        className={styles.tabList}
        role="tablist"
        aria-label="Finding detail sections"
        onKeyDown={onTabKeyDown}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`finding-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`finding-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={styles.tab}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section
        id={`finding-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`finding-tab-${activeTab}`}
        className={styles.panel}
      >
        {activeTab === 'overview' ? (
          <OverviewPanel model={model} mode={mode} />
        ) : activeTab === 'attack-path' ? (
          <AttackPathPanel steps={model.attackSteps} />
        ) : activeTab === 'proof' ? (
          <ProofPanel model={model} />
        ) : activeTab === 'fix' ? (
          <FixPanel model={model} mode={mode} />
        ) : (
          <ReplayPanel model={model} />
        )}
      </section>
    </div>
  );
}
