// Maintained test for the findings-index filter logic (issue #10).
// Runs today with the platform toolchain only: `node --test
// src/features/findings/list/finding-filters.test.ts`
// (Node strips the erasable types; no framework needed.) Adopt this file into
// the foundation test runner when it lands; expectations stay the same.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyFindingFilters,
  EMPTY_FILTERS,
  isFiltered,
  severityCounts,
  statusCounts,
  type FindingFilters,
  type FindingRecord,
} from "./finding-filters.ts";
import { SAMPLE_FINDINGS } from "./sample-findings.ts";

const ROWS: FindingRecord[] = SAMPLE_FINDINGS;

function withFilters(partial: Partial<FindingFilters>): FindingFilters {
  return { ...EMPTY_FILTERS, ...partial };
}

describe("applyFindingFilters", () => {
  it("returns every finding when no filter is active", () => {
    assert.equal(applyFindingFilters(ROWS, EMPTY_FILTERS).length, ROWS.length);
  });

  it("matches search across title, summary, route and id", () => {
    assert.deepEqual(
      applyFindingFilters(ROWS, withFilters({ search: "coupon" })).map(
        (row) => row.id,
      ),
      ["f-coupon-replay"],
    );
    assert.deepEqual(
      applyFindingFilters(ROWS, withFilters({ search: "WIDGET/HELP" })).map(
        (row) => row.id,
      ),
      ["f-supportharbor-version"],
    );
    assert.deepEqual(
      applyFindingFilters(ROWS, withFilters({ search: "  invoice  " })).map(
        (row) => row.id,
      ),
      ["f-bola-invoice-idor", "f-invoice-enumeration"],
    );
  });

  it("filters by severity set", () => {
    const ids = applyFindingFilters(
      ROWS,
      withFilters({ severities: ["critical"] }),
    ).map((row) => row.id);
    assert.deepEqual(ids, ["f-cross-tenant-membership", "f-cart-price-tamper"]);
  });

  it("filters by remediation status set", () => {
    const ids = applyFindingFilters(
      ROWS,
      withFilters({ statuses: ["verified_fixed"] }),
    ).map((row) => row.id);
    assert.deepEqual(ids, ["f-cart-price-tamper", "f-teamdesk-redirect"]);
  });

  it("filters by project", () => {
    const ids = applyFindingFilters(
      ROWS,
      withFilters({ projectId: "p-invoicecloud" }),
    ).map((row) => row.id);
    assert.deepEqual(ids, ["f-bola-invoice-idor", "f-invoice-enumeration"]);
  });

  it("combines every facet and reports an empty set honestly", () => {
    const ids = applyFindingFilters(
      ROWS,
      withFilters({
        search: "invoice",
        severities: ["critical"],
        statuses: ["open"],
        projectId: "p-invoicecloud",
      }),
    );
    assert.deepEqual(ids, []);
  });
});

describe("faceted counts", () => {
  it("derives severity counts from the other active filters", () => {
    const counts = severityCounts(
      ROWS,
      withFilters({ projectId: "p-cartforge", severities: ["low"] }),
    );
    assert.equal(counts.high, 1);
    assert.equal(counts.critical, 1);
    assert.equal(counts.low, 0);
    assert.equal(counts.informational, 0);
  });

  it("derives status counts from the other active filters", () => {
    const counts = statusCounts(
      ROWS,
      withFilters({ search: "synthetic", statuses: ["open"] }),
    );
    // Seven of eight sample summaries mention the scripted run; the cart
    // record says "scripted" instead and is honestly excluded.
    assert.equal(counts.open, 2);
    assert.equal(counts.verified_fixed, 1);
    assert.equal(
      Object.values(counts).reduce((a, b) => a + b, 0),
      7,
    );
  });
});

describe("reset semantics", () => {
  it("flags any active filter and restores the full list on reset", () => {
    assert.equal(isFiltered(EMPTY_FILTERS), false);
    assert.equal(
      isFiltered(withFilters({ search: "x" })),
      true,
    );
    assert.equal(
      isFiltered(withFilters({ projectId: "p-teamdesk" })),
      true,
    );
    const reset: FindingFilters = {
      search: "",
      severities: [],
      statuses: [],
      projectId: null,
    };
    assert.deepEqual(
      applyFindingFilters(ROWS, reset).map((row) => row.id),
      ROWS.map((row) => row.id),
    );
  });
});
