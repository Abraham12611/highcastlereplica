import type { DemoProject } from '../types';

/**
 * Seed fixture: the four Northstar Labs demo projects.
 *
 * Deterministic sample data only. All URLs are display-only fictional
 * hostnames used as decoration; nothing is ever fetched or scanned.
 */

export const projects: DemoProject[] = [
  {
    id: 'proj-invoicecloud',
    slug: 'invoicecloud',
    name: 'InvoiceCloud',
    description:
      'Flagship synthetic invoicing app used for the staged BOLA/IDOR walkthrough.',
    url: 'https://invoicecloud.sample.test',
    createdAt: '2026-07-28T12:00:00.000Z',
    status: 'scanning',
    scenarioId: 'scenario-bola-invoice',
  },
  {
    id: 'proj-cartforge',
    slug: 'cartforge',
    name: 'CartForge',
    description: 'Fictional storefront used for payment-logic demo scenarios.',
    url: 'https://cartforge.sample.test',
    createdAt: '2026-08-02T12:00:00.000Z',
    status: 'ready',
    scenarioId: 'scenario-coupon-replay',
  },
  {
    id: 'proj-teamdesk',
    slug: 'teamdesk',
    name: 'TeamDesk',
    description: 'Fictional team SaaS used for membership-logic demo scenarios.',
    url: 'https://teamdesk.sample.test',
    createdAt: '2026-08-05T12:00:00.000Z',
    status: 'attention',
    scenarioId: 'scenario-cross-tenant-membership',
  },
  {
    id: 'proj-supportharbor',
    slug: 'supportharbor',
    name: 'SupportHarbor',
    description: 'Fictional helpdesk used for rate-limit demo scenarios.',
    url: 'https://supportharbor.sample.test',
    createdAt: '2026-08-08T12:00:00.000Z',
    status: 'ready',
    scenarioId: 'scenario-ratelimit-bypass',
  },
];

export const projectIds: string[] = projects.map((p) => p.id);

export function getProjectSeedById(projectId: string): DemoProject | undefined {
  return projects.find((p) => p.id === projectId);
}
