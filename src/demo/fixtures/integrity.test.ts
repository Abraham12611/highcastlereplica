import * as assert from 'node:assert/strict';
import {
  countFindingsByRemediation,
  countFindingsBySeverity,
  countScansByStatus,
  findings,
  getProjectSummaries,
  getScansPerDay,
  northstarWorkspace,
  projects,
  scans,
  validateFixtureIntegrity,
} from './index';

/**
 * Fixture integrity test (issue #4).
 *
 * Runner-agnostic: plain top-level assertions over the exported rows, so
 * this file passes under node --test (with type stripping), vitest, or
 * jest without runner-specific imports. It fails loudly on any drift in
 * counts, foreign keys, or timestamp coherence.
 */

const errors = validateFixtureIntegrity();
assert.deepEqual(errors, [], `fixture integrity errors:\n${errors.join('\n')}`);

// Exact contract counts.
assert.equal(projects.length, 4, 'must seed exactly 4 projects');
assert.equal(scans.length, 63, 'must seed exactly 63 scans');
assert.equal(findings.length, 18, 'must seed exactly 18 findings');
assert.equal(
  findings.filter((f) => f.remediationStatus === 'verified_fixed').length,
  10,
  'must seed exactly 10 verified fixes',
);

// Selectors derive their numbers from rows, never from constants.
const byStatus = countScansByStatus();
assert.equal(byStatus.completed + byStatus.failed + byStatus.canceled + byStatus.running, 63);
assert.ok(byStatus.completed > 50, 'history is mostly completed runs');
assert.ok(byStatus.failed >= 1 && byStatus.canceled >= 1, 'history includes failed and canceled runs');
assert.equal(byStatus.running, 1, 'exactly one in-progress run');

const bySeverity = countFindingsBySeverity();
assert.equal(bySeverity.critical + bySeverity.high + bySeverity.medium + bySeverity.low + bySeverity.informational, 18);

const byRemediation = countFindingsByRemediation();
assert.equal(byRemediation.verified_fixed, 10);

const summaries = getProjectSummaries();
assert.equal(summaries.length, 4);
assert.equal(
  summaries.reduce((n, s) => n + s.scanCount, 0),
  63,
  'per-project scan counts must sum to 63',
);
assert.equal(
  summaries.reduce((n, s) => n + s.findingCount, 0),
  18,
  'per-project finding counts must sum to 18',
);

const buckets = getScansPerDay(90);
assert.equal(buckets.length, 90);
assert.equal(
  buckets.reduce((n, b) => n + b.count, 0),
  63,
  'daily buckets must cover all 63 scans',
);

// Workspace is flagged synthetic and embeds the same project rows.
assert.equal(northstarWorkspace.synthetic, true);
assert.deepEqual(
  northstarWorkspace.projects.map((p) => p.id).sort(),
  projects.map((p) => p.id).sort(),
);
