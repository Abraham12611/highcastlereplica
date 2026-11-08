"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Foundation landing page (issue #1 owned paths only).
 *
 * Display-only sample content. Canonical DemoMode / DemoScenario types and
 * fixture rows land with the contracts (src/demo/types.ts) and data lanes;
 * the ids and shapes used here are chosen to match docs/03_CONTRACTS.md and
 * docs/04_SCENARIOS_AND_DATA.md so lanes can adopt them unchanged.
 */

type BuilderMode = "builder" | "developer";

type SampleProject = {
  id: string;
  name: string;
  description: string;
  scans: number;
  findings: number;
  verifiedFixes: number;
  status: string;
};

const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "proj-invoicecloud",
    name: "InvoiceCloud",
    description: "Flagship synthetic invoicing app for the BOLA walkthrough.",
    scans: 22,
    findings: 7,
    verifiedFixes: 4,
    status: "Needs attention"
  },
  {
    id: "proj-cartforge",
    name: "CartForge",
    description: "Fictional storefront used for the coupon replay scenario.",
    scans: 16,
    findings: 5,
    verifiedFixes: 3,
    status: "Ready"
  },
  {
    id: "proj-teamdesk",
    name: "TeamDesk",
    description: "Fictional team SaaS used for the membership scenario.",
    scans: 14,
    findings: 4,
    verifiedFixes: 2,
    status: "Ready"
  },
  {
    id: "proj-supportharbor",
    name: "SupportHarbor",
    description: "Fictional helpdesk used for the rate-limit scenario.",
    scans: 11,
    findings: 2,
    verifiedFixes: 1,
    status: "Ready"
  }
];

type SampleScenario = {
  id: string;
  projectId: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  severityClass: string;
  summary: string;
  techNote: string;
  durationMin: number;
  eventCount: number;
};

const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: "scen-bola-invoice",
    projectId: "proj-invoicecloud",
    title: "Invoice access control (BOLA / IDOR)",
    severity: "High",
    severityClass: "severity-high",
    summary:
      "Alice can open Bob's private invoice in the vulnerable sample revision. The patched replay denies it while her own invoice still loads.",
    techNote:
      "scan-bola-001 · 28 events · phases recon → executing → verifying · evidence ev-bola-baseline, ev-bola-cross, ev-bola-replay",
    durationMin: 3,
    eventCount: 28
  },
  {
    id: "scen-coupon-replay",
    projectId: "proj-cartforge",
    title: "Payment coupon replay logic",
    severity: "Medium",
    severityClass: "severity-medium",
    summary:
      "A single-use sample coupon is accepted twice in the vulnerable revision, then rejected on replay after the fix.",
    techNote:
      "scan-coupon-002 · 22 events · phases planning → executing → verifying · evidence ev-coupon-first, ev-coupon-replay",
    durationMin: 2,
    eventCount: 22
  },
  {
    id: "scen-xtenant-membership",
    projectId: "proj-teamdesk",
    title: "Cross-tenant project membership",
    severity: "Medium",
    severityClass: "severity-medium",
    summary:
      "A guest identity keeps sample project access after removal in the vulnerable revision; the replay confirms removal sticks.",
    techNote:
      "scan-xtenant-003 · 24 events · phases recon → executing → verifying · evidence ev-xtenant-stale, ev-xtenant-recheck",
    durationMin: 2,
    eventCount: 24
  },
  {
    id: "scen-ratelimit-bypass",
    projectId: "proj-supportharbor",
    title: "API rate-limit bypass",
    severity: "Low",
    severityClass: "severity-medium",
    summary:
      "Burst sample traffic slips past the naive limiter in the vulnerable revision; the patched replay holds the limit.",
    techNote:
      "scan-ratelimit-004 · 20 events · phases executing → verifying · evidence ev-rate-burst, ev-rate-capped",
    durationMin: 2,
    eventCount: 20
  }
];

const MODE_STORAGE_KEY = "hc-demo-mode";

function deriveTotals(projects: SampleProject[]) {
  return {
    scans: projects.reduce((sum, p) => sum + p.scans, 0),
    findings: projects.reduce((sum, p) => sum + p.findings, 0),
    verifiedFixes: projects.reduce((sum, p) => sum + p.verifiedFixes, 0)
  };
}

export default function LandingPage() {
  const [mode, setMode] = useState<BuilderMode>("builder");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    SAMPLE_SCENARIOS[0].id
  );

  // Browser persistence initializes after mount so SSR and first paint agree.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (stored === "builder" || stored === "developer") {
        setMode(stored);
      }
    } catch {
      // Private-mode storage failures must not break the demo shell.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore persistence failures; the toggle still works for the session.
    }
  }, [mode]);

  const totals = deriveTotals(SAMPLE_PROJECTS);
  const selectedScenario =
    SAMPLE_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
    SAMPLE_SCENARIOS[0];
  const selectedProject = SAMPLE_PROJECTS.find(
    (p) => p.id === selectedScenario.projectId
  );

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" href="#top" aria-label="HighCastle simulated demo home">
            <Image src="/logo.svg" alt="" width={28} height={28} />
            HighCastle
          </a>
          <nav className="site-nav" aria-label="Page sections">
            <a href="#workspace">Sample workspace</a>
            <a href="#scenarios">Scenarios</a>
            <a href="#workflow">Workflow</a>
            <a href="#proof">Proof</a>
          </nav>
          <span className="demo-badge">
            <span className="dot" aria-hidden="true" />
            Simulated demo
          </span>
        </div>
      </header>

      <main
        id="main-content"
        className={mode === "developer" ? "mode-developer" : "mode-builder"}
      >
        <div className="hero" id="top">
          <div className="hero-copy">
            <h1>Your personal AI security engineer.</h1>
            <p className="lede">
              Prove the risk. Prove the fix. This page is a deterministic
              simulated walkthrough of HighCastle — every scan, finding, and
              log line on this site is prewritten fiction. Nothing here tests a
              real system.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#scenarios">
                Explore the sample scenarios
              </a>
              <a className="btn btn-ghost" href="#workflow">
                See how the walkthrough runs
              </a>
            </div>
          </div>

          <section
            className="hero-panel"
            id="workspace"
            aria-label="Sample workspace summary"
          >
            <h2>Sample workspace · Northstar Labs</h2>
            <div className="stat-row">
              <span>Simulated scans (90 days)</span>
              <strong className="stat-cyan">{totals.scans}</strong>
            </div>
            <div className="stat-row">
              <span>Distinct sample findings</span>
              <strong className="stat-coral">{totals.findings}</strong>
            </div>
            <div className="stat-row">
              <span>Verified sample fixes</span>
              <strong className="stat-mint">{totals.verifiedFixes}</strong>
            </div>
            <div className="stat-row">
              <span>Sample projects</span>
              <strong>{SAMPLE_PROJECTS.length}</strong>
            </div>
            <p className="panel-note">
              Counts are summed from the project rows below — no hidden totals.
              All four projects are fictional seed data.
            </p>
          </section>
        </div>

        <section className="block" aria-labelledby="projects-heading">
          <h2 id="projects-heading">Projects in this sample workspace</h2>
          <p className="sub">
            Four fictional projects carry the 90-day sample history. Per-project
            rows add up to the workspace totals above.
          </p>
          <div className="card-grid">
            {SAMPLE_PROJECTS.map((project) => (
              <article className="card" key={project.id}>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <dl>
                  <dt>Scans</dt>
                  <dd>{project.scans}</dd>
                  <dt>Findings</dt>
                  <dd>{project.findings}</dd>
                  <dt>Verified fixes</dt>
                  <dd>{project.verifiedFixes}</dd>
                  <dt>Status</dt>
                  <dd>{project.status}</dd>
                </dl>
                <p className="tech-note">{project.id} · scenario-linked</p>
              </article>
            ))}
          </div>
        </section>

        <section className="block" id="scenarios" aria-labelledby="scenarios-heading">
          <h2 id="scenarios-heading">Pick a sample scenario</h2>
          <p className="sub">
            {mode === "developer"
              ? "Developer mode: scenario cards show scripted scan ids, event counts, and evidence references. Values are fixed samples, not live results."
              : "Each scenario is a prewritten script with the same simulated findings every run. Selecting one previews its storyline below."}
          </p>
          <div className="mode-row" role="group" aria-label="Demo language mode">
            <span id="mode-label">Explain it in:</span>
            <div className="mode-toggle" aria-labelledby="mode-label">
              <button
                type="button"
                aria-pressed={mode === "builder"}
                onClick={() => setMode("builder")}
              >
                Builder mode
              </button>
              <button
                type="button"
                aria-pressed={mode === "developer"}
                onClick={() => setMode("developer")}
              >
                Developer mode
              </button>
            </div>
          </div>
          <div className="card-grid">
            {SAMPLE_SCENARIOS.map((scenario) => (
              <article className="card" key={scenario.id}>
                <h3>
                  {scenario.title}
                  <span className={`severity ${scenario.severityClass}`}>
                    {scenario.severity}
                  </span>
                </h3>
                <p>{scenario.summary}</p>
                <dl>
                  <dt>Scenario</dt>
                  <dd>{scenario.id}</dd>
                  <dt>Walkthrough</dt>
                  <dd>
                    ≈{scenario.durationMin} min · {scenario.eventCount} scripted
                    events
                  </dd>
                </dl>
                <p className="tech-note">{scenario.techNote}</p>
                <button
                  type="button"
                  className={
                    selectedScenarioId === scenario.id
                      ? "btn btn-primary"
                      : "btn btn-ghost"
                  }
                  aria-pressed={selectedScenarioId === scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                >
                  {selectedScenarioId === scenario.id
                    ? "Previewing below"
                    : "Preview this scenario"}
                </button>
              </article>
            ))}
          </div>
          <div
            className="card"
            style={{ marginTop: "1rem" }}
            aria-live="polite"
            aria-label="Selected scenario preview"
          >
            <h3>Now previewing: {selectedScenario.title}</h3>
            <p>
              Runs against {selectedProject?.name ?? "its sample project"} as a
              timed script: slow reconnaissance, an approved plan, the
              proof-of-concept checks, then a patched replay that flips the
              verdict to Verified Fixed. Timed playback, pause, and replay
              controls arrive with the engine lane.
            </p>
            <p className="tech-note">
              {selectedScenario.id} → {selectedScenario.projectId} ·
              replay flips remediation to verified_fixed
            </p>
          </div>
        </section>

        <section className="block" id="workflow" aria-labelledby="workflow-heading">
          <h2 id="workflow-heading">How the simulated walkthrough runs</h2>
          <p className="sub">
            The same scripted loop every time, so the recording is repeatable.
            No step contacts a real host.
          </p>
          <ol className="steps">
            <li>
              <div>
                <strong>Scope a sample assessment</strong>
                <p>
                  Enter any URL as a display-only label and choose one of the
                  four sample scenarios. The scenario decides every finding.
                </p>
              </div>
            </li>
            <li>
              <div>
                <strong>Watch the simulated investigation</strong>
                <p>
                  Reconnaissance, hypotheses, and an approved plan appear on a
                  timed schedule with concise status summaries.
                </p>
              </div>
            </li>
            <li>
              <div>
                <strong>Read the finding and the fix</strong>
                <p>
                  Plain-English impact, the harmless synthetic proof, and a
                  copyable remediation prompt for the sample code.
                </p>
              </div>
            </li>
            <li>
              <div>
                <strong>Replay against the patched sample</strong>
                <p>
                  The same checks run again: cross-account access denied, the
                  owner baseline still allowed, verdict Verified Fixed.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="block" id="proof" aria-labelledby="proof-heading">
          <h2 id="proof-heading">The flagship proof, up front</h2>
          <p className="sub">
            Scripted sample HTTP statuses from the invoice scenario. Displayed
            as fiction — this page performs no requests.
          </p>
          <div className="proof-strip">
            <div className="proof ok">
              <span className="code">Alice → own invoice · 200</span>
              <small>Authorized baseline, allowed before and after.</small>
            </div>
            <div className="proof bad">
              <span className="code">Alice → Bob&apos;s invoice · 200</span>
              <small>Vulnerable sample revision (simulated pre-fix).</small>
            </div>
            <div className="proof ok">
              <span className="code">Alice → Bob&apos;s invoice · 403</span>
              <small>Patched sample replay, plus 200 on her own invoice.</small>
            </div>
          </div>
          <p className="panel-note">
            Out-of-scope operations are blocked in the containment ledger as an
            illustration, not a live enforcement event.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          <strong>Simulated demo.</strong> Deterministic fiction for a 3–4
          minute product walkthrough. No live scans, accounts, databases, or
          model calls. A URL entered anywhere in this demo is shown as text
          only and is never fetched, scanned, or crawled.
        </p>
        <p>
          Reference implementation (separate repo, not this demo):{" "}
          <a href="https://github.com/Abraham12611/highcastle">
            Abraham12611/highcastle
          </a>
        </p>
      </footer>
    </>
  );
}
