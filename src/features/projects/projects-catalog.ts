/**
 * Projects lane — sample catalog, pure helpers and browser-store adapter.
 *
 * Ownership: issue #8 (`src/features/projects/*`).
 * This module is intentionally dependency-free (no React, no Next, no
 * cross-lane imports) so it compiles and behaves deterministically before
 * Foundation / Contracts / Fixtures / Engine lanes land.
 *
 * Contract alignment: the structural shapes below mirror `docs/03_CONTRACTS.md`
 * (`DemoProject`, `DemoScenario`) field-for-field. Once `src/demo/types.ts`
 * exists the demo store can pass fixture rows straight into the components in
 * this lane — no shape changes needed.
 *
 * Simulation rules (AGENTS.md):
 * - A user-entered URL is DISPLAY-ONLY text. It is parsed locally for format
 *   feedback and never fetched, scanned, crawled or otherwise requested.
 * - Prepared scenarios determine every simulated finding. Nothing in this lane
 *   claims findings for an entered domain.
 */

export type ProjectStatus = 'ready' | 'attention' | 'scanning';

export interface SampleDemoProject {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Display-only. Never fetched. */
  url: string;
  createdAt: string;
  status: ProjectStatus;
  scenarioId: string;
}

export interface SampleDemoScenario {
  id: string;
  title: string;
  description: string;
  projectId: string;
  findingIds: string[];
  durationMs: number;
}

/** A project row as rendered by this lane. `sample` marks seeded rows. */
export type ProjectView = SampleDemoProject & { sample: boolean };

/** Canonical seeded workspace marker shown on every surface of this lane. */
export const WORKSPACE_NAME = 'Northstar Labs';

/** localStorage key holding ONLY user-created projects. Samples stay in code. */
export const USER_PROJECTS_STORAGE_KEY = 'highcastle-replica.demo-projects.v1';

export const SIMULATED_DEMO_LABEL = 'Simulated demo';

export const URL_DISPLAY_ONLY_NOTICE =
  'This URL is display-only. The demo never fetches, scans, crawls or otherwise contacts it.';

/* ------------------------------------------------------------------ */
/* Seeded catalog (compatible seed IDs for the fixtures lane)          */
/* ------------------------------------------------------------------ */

export const SAMPLE_SCENARIOS: SampleDemoScenario[] = [
  {
    id: 'scn-bola-invoice',
    title: 'BOLA / IDOR invoice authorization',
    description:
      'Flagship sample: Alice baseline (200), Alice reading Bob’s invoice in the vulnerable revision (200), policy gate, patched replay (403 / 200).',
    projectId: 'proj-invoicecloud',
    findingIds: ['fnd-bola-invoice'],
    durationMs: 150000,
  },
  {
    id: 'scn-coupon-replay',
    title: 'Payment coupon replay logic',
    description:
      'Fictional controlled demo: a synthetic coupon applied twice to one synthetic order.',
    projectId: 'proj-cartforge',
    findingIds: ['fnd-coupon-replay'],
    durationMs: 120000,
  },
  {
    id: 'scn-xtenant-membership',
    title: 'Cross-tenant project membership',
    description:
      'Fictional controlled demo: a synthetic member resolves another tenant’s project reference.',
    projectId: 'proj-teamdesk',
    findingIds: ['fnd-xtenant-membership'],
    durationMs: 120000,
  },
  {
    id: 'scn-ratelimit-bypass',
    title: 'API rate-limit bypass',
    description:
      'Fictional controlled demo: synthetic burst traffic against a sample throttle.',
    projectId: 'proj-supportharbor',
    findingIds: ['fnd-ratelimit-bypass'],
    durationMs: 90000,
  },
];

export const SAMPLE_PROJECTS: SampleDemoProject[] = [
  {
    id: 'proj-invoicecloud',
    slug: 'invoicecloud',
    name: 'InvoiceCloud',
    description: 'Flagship synthetic invoicing app. Home of the BOLA sample scenario.',
    url: 'https://invoices.northstar-labs.example',
    createdAt: '2026-08-12T09:00:00.000Z',
    status: 'attention',
    scenarioId: 'scn-bola-invoice',
  },
  {
    id: 'proj-cartforge',
    slug: 'cartforge',
    name: 'CartForge',
    description: 'Fictional storefront used by the coupon-replay sample scenario.',
    url: 'https://shop.northstar-labs.example',
    createdAt: '2026-08-20T14:30:00.000Z',
    status: 'ready',
    scenarioId: 'scn-coupon-replay',
  },
  {
    id: 'proj-teamdesk',
    slug: 'teamdesk',
    name: 'TeamDesk',
    description: 'Fictional team SaaS used by the cross-tenant sample scenario.',
    url: 'https://team.northstar-labs.example',
    createdAt: '2026-09-02T10:15:00.000Z',
    status: 'ready',
    scenarioId: 'scn-xtenant-membership',
  },
  {
    id: 'proj-supportharbor',
    slug: 'supportharbor',
    name: 'SupportHarbor',
    description: 'Fictional helpdesk used by the rate-limit sample scenario.',
    url: 'https://support.northstar-labs.example',
    createdAt: '2026-09-18T16:45:00.000Z',
    status: 'scanning',
    scenarioId: 'scn-ratelimit-bypass',
  },
];

/** Sample scope permissions offered by the wizard. Fixed, deterministic set. */
export const SAMPLE_PERMISSIONS = [
  {
    id: 'perm-synthetic-invoices',
    label: 'Use synthetic invoice fixtures (Alice / Bob)',
    hint: 'Harmless sample IDs only. No real customer data.',
  },
  {
    id: 'perm-mock-runner',
    label: 'Run the mock assessment runner',
    hint: 'Preauthored timeline events. No live traffic leaves the browser.',
  },
  {
    id: 'perm-policy-gate',
    label: 'Enforce the policy gate before each sample step',
    hint: 'Out-of-scope operations are blocked as an illustration.',
  },
] as const;

export type SamplePermissionId = (typeof SAMPLE_PERMISSIONS)[number]['id'];

/* ------------------------------------------------------------------ */
/* Pure helpers (deterministic, no I/O, no network)                    */
/* ------------------------------------------------------------------ */

export function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'project';
}

export type UrlValidation = { ok: true; normalized: string } | { ok: false; error: string };

/**
 * Format-only URL validation. Parses locally with the URL constructor;
 * performs ZERO network requests. Returns a normalized display string.
 */
export function validateDisplayOnlyUrl(raw: string): UrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Enter a URL, e.g. https://example.com.' };
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: 'That URL does not parse. Use a host like https://example.com.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http(s) URLs are accepted as display text.' };
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { ok: false, error: 'Include a full host name, e.g. https://example.com.' };
  }
  return { ok: true, normalized: parsed.toString() };
}

export function scenarioById(scenarioId: string): SampleDemoScenario | undefined {
  return SAMPLE_SCENARIOS.find((s) => s.id === scenarioId);
}

export function sampleProjectById(projectId: string): SampleDemoProject | undefined {
  return SAMPLE_PROJECTS.find((p) => p.id === projectId);
}

/**
 * Deterministic synthetic scan id for launching a simulated assessment.
 * The scans lane owns `/app/scans/[id]`; this id is the handoff contract so
 * both lanes resolve the same scan for a (project, scenario) pair.
 */
export function sampleScanIdFor(projectId: string, scenarioId: string): string {
  return `scan-${projectId}--${scenarioId}`;
}

/** Deterministic project id derived from the name slug; suffix on collision. */
export function projectIdForSlug(slug: string, taken: ReadonlySet<string>): string {
  const base = `proj-${slug}`;
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/* ------------------------------------------------------------------ */
/* Browser store (localStorage only, SSR-safe)                         */
/* ------------------------------------------------------------------ */

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isValidStoredProject(value: unknown): value is SampleDemoProject {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    typeof v.url === 'string' &&
    typeof v.createdAt === 'string' &&
    (v.status === 'ready' || v.status === 'attention' || v.status === 'scanning') &&
    typeof v.scenarioId === 'string'
  );
}

export function loadUserProjects(): SampleDemoProject[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(USER_PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredProject);
  } catch {
    return [];
  }
}

export function saveUserProjects(projects: SampleDemoProject[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(USER_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or unavailable: the demo stays usable in-memory.
  }
}

export function clearUserProjects(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(USER_PROJECTS_STORAGE_KEY);
  } catch {
    // Ignore: reset is best-effort in private-mode browsers.
  }
}

/** Samples first, then user projects. Counts are derived from rows. */
export function mergeProjects(userProjects: SampleDemoProject[]): ProjectView[] {
  return [
    ...SAMPLE_PROJECTS.map((p) => ({ ...p, sample: true })),
    ...userProjects.map((p) => ({ ...p, sample: false })),
  ];
}
