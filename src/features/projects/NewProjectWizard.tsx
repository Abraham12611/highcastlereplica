'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ChangeEvent } from 'react';
import {
  SAMPLE_PERMISSIONS,
  SAMPLE_SCENARIOS,
  SIMULATED_DEMO_LABEL,
  URL_DISPLAY_ONLY_NOTICE,
  sampleScanIdFor,
  validateDisplayOnlyUrl,
} from './projects-catalog';
import { useDemoProjects } from './use-demo-projects';
import styles from './projects.module.css';

const STEPS = ['Details', 'Scenario', 'Scope', 'Review'] as const;

export default function NewProjectWizard() {
  const router = useRouter();
  const { createProject, mounted } = useDemoProjects();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [scenarioId, setScenarioId] = useState(SAMPLE_SCENARIOS[0].id);
  const [permissions, setPermissions] = useState<string[]>([
    'perm-synthetic-invoices',
    'perm-mock-runner',
    'perm-policy-gate',
  ]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [touched, setTouched] = useState(false);
  const [createdScan, setCreatedScan] = useState<{ projectId: string; scanId: string } | null>(null);

  const nameError = name.trim().length < 2 ? 'Give the project a name of at least 2 characters.' : null;
  const urlCheck = useMemo(() => validateDisplayOnlyUrl(url), [url]);
  const urlError = urlCheck.ok ? null : urlCheck.error;

  const canLeaveDetails = !nameError && !urlError;
  const canCreate = canLeaveDetails && scenarioId.length > 0 && acknowledged;

  function togglePermission(id: string) {
    setPermissions((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function next() {
    setTouched(true);
    if (step === 0 && !canLeaveDetails) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleCreate() {
    if (!canCreate || !urlCheck.ok) {
      setTouched(true);
      return;
    }
    const project = createProject({
      name,
      description,
      url: urlCheck.normalized,
      scenarioId,
      permissionIds: permissions,
    });
    setCreatedScan({ projectId: project.id, scanId: sampleScanIdFor(project.id, scenarioId) });
  }

  function launchAssessment() {
    if (!createdScan) return;
    router.push(
      `/app/scans/${encodeURIComponent(createdScan.scanId)}?project=${encodeURIComponent(
        createdScan.projectId,
      )}&scenario=${encodeURIComponent(scenarioId)}`,
    );
  }

  if (createdScan) {
    return (
      <div className={styles.hcProjects}>
        <div className={styles.hcInner}>
          <p className={styles.hcEyebrow}>
            <span className={`${styles.hcBadge} ${styles.hcBadgeMint}`}>{SIMULATED_DEMO_LABEL}</span>
          </p>
          <h1 className={styles.hcTitle}>Project created</h1>
          <p className={styles.hcSubtitle}>
            Added to this browser’s demo store. The entered URL is display-only text — nothing was
            fetched or scanned. Launching an assessment starts the prepared sample scenario, not a
            scan of your URL.
          </p>
          <div className={styles.hcActions} style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className={`${styles.hcButton} ${styles.hcButtonPrimary}`}
              onClick={launchAssessment}
            >
              Launch simulated assessment
            </button>
            <Link className={styles.hcButton} href={`/app/projects/${createdScan.projectId}`}>
              View project
            </Link>
            <Link className={`${styles.hcButton} ${styles.hcButtonGhost}`} href="/app/projects">
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hcProjects}>
      <div className={styles.hcInner}>
        <p className={styles.hcEyebrow}>
          <span className={`${styles.hcBadge} ${styles.hcBadgeMint}`}>{SIMULATED_DEMO_LABEL}</span>
          <span>New project demo</span>
        </p>
        <h1 className={styles.hcTitle}>New project</h1>
        <p className={styles.hcSubtitle}>
          Enter any URL for show — it stays on screen as text only. Then pick one of the prepared
          sample scenarios that will actually run.
        </p>

        <ol className={styles.hcSteps} aria-label="Creation steps" style={{ marginTop: '1rem' }}>
          {STEPS.map((label, i) => (
            <li key={label} className={styles.hcStep} aria-current={i === step ? 'step' : undefined}>
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        <div className={styles.hcForm} style={{ marginTop: '1rem' }}>
          {step === 0 && (
            <>
              <div className={styles.hcField}>
                <label className={styles.hcLabel} htmlFor="hc-new-name">
                  Project name
                </label>
                <input
                  id="hc-new-name"
                  className={styles.hcInput}
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="e.g. My Demo Shop"
                  autoComplete="off"
                />
                {touched && nameError && (
                  <p className={styles.hcError} role="alert">
                    {nameError}
                  </p>
                )}
              </div>
              <div className={styles.hcField}>
                <label className={styles.hcLabel} htmlFor="hc-new-desc">
                  Description (optional)
                </label>
                <textarea
                  id="hc-new-desc"
                  className={styles.hcTextarea}
                  value={description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="What should the recording call this project?"
                  rows={2}
                />
              </div>
              <div className={styles.hcField}>
                <label className={styles.hcLabel} htmlFor="hc-new-url">
                  Project URL — display only
                </label>
                <input
                  id="hc-new-url"
                  className={styles.hcInput}
                  value={url}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  inputMode="url"
                  autoComplete="off"
                />
                <p className={styles.hcNotice} style={{ marginTop: '0.5rem' }}>
                  <strong>Display-only.</strong> {URL_DISPLAY_ONLY_NOTICE} Findings always come from
                  the prepared scenario selected next.
                </p>
                {touched && urlError && (
                  <p className={styles.hcError} role="alert">
                    {urlError}
                  </p>
                )}
                {urlCheck.ok && (
                  <p className={styles.hcHint}>
                    Shown as: <span className={styles.hcUrlText}>{urlCheck.normalized}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <fieldset className={styles.hcFieldset}>
              <legend className={styles.hcLegend}>Prepared sample scenario</legend>
              {SAMPLE_SCENARIOS.map((s) => (
                <label key={s.id} className={styles.hcRadio}>
                  <input
                    type="radio"
                    name="hc-scenario"
                    value={s.id}
                    checked={scenarioId === s.id}
                    onChange={() => setScenarioId(s.id)}
                  />
                  <span>
                    <span className={styles.hcRadioTitle}>{s.title}</span>
                    <p className={styles.hcRadioDesc}>{s.description}</p>
                  </span>
                </label>
              ))}
              <p className={styles.hcHint}>
                Whichever URL was entered, the simulated findings come only from this scenario.
              </p>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className={styles.hcFieldset}>
              <legend className={styles.hcLegend}>Sample permissions &amp; scope</legend>
              {SAMPLE_PERMISSIONS.map((perm) => (
                <label key={perm.id} className={styles.hcCheck}>
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                  />
                  <span>
                    <span className={styles.hcCheckTitle}>{perm.label}</span>
                    <p className={styles.hcCheckDesc}>{perm.hint}</p>
                  </span>
                </label>
              ))}
              <label className={styles.hcCheck}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAcknowledged(e.target.checked)}
                />
                <span>
                  <span className={styles.hcCheckTitle}>Scope acknowledgment (required)</span>
                  <p className={styles.hcCheckDesc}>
                    I understand only the prepared scenario runs against synthetic fixtures; my URL
                    is display-only and is never fetched or scanned.
                  </p>
                </span>
              </label>
            </fieldset>
          )}

          {step === 3 && (
            <>
              <dl className={styles.hcReview}>
                <div>
                  <dt>Name</dt>
                  <dd>{name.trim() || '—'}</dd>
                </div>
                <div>
                  <dt>URL (text)</dt>
                  <dd className={styles.hcUrlText}>{urlCheck.ok ? urlCheck.normalized : '—'}</dd>
                </div>
                <div>
                  <dt>Scenario</dt>
                  <dd>{SAMPLE_SCENARIOS.find((s) => s.id === scenarioId)?.title ?? scenarioId}</dd>
                </div>
                <div>
                  <dt>Permissions</dt>
                  <dd>
                    {permissions.length === 0
                      ? 'None selected'
                      : permissions
                          .map((id) => SAMPLE_PERMISSIONS.find((p) => p.id === id)?.label ?? id)
                          .join('; ')}
                  </dd>
                </div>
              </dl>
              {!mounted && <p className={styles.hcHint}>Preparing browser store…</p>}
            </>
          )}

          <div className={styles.hcActions}>
            {step > 0 && (
              <button type="button" className={styles.hcButton} onClick={back}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className={`${styles.hcButton} ${styles.hcButtonPrimary}`}
                onClick={next}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.hcButton} ${styles.hcButtonPrimary}`}
                onClick={handleCreate}
                disabled={!canCreate}
              >
                Create project
              </button>
            )}
            <Link className={`${styles.hcButton} ${styles.hcButtonGhost}`} href="/app/projects">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
