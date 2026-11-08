# Scenario Library and Seeded Workspace

## Canonical default
Fictional workspace “Northstar Labs” is visibly **Sample workspace**. Four projects: InvoiceCloud (flagship synthetic invoices), CartForge (fictional store), TeamDesk (fictional team SaaS), SupportHarbor (fictional helpdesk). 90-day sample history, exactly 63 scans, exactly 18 distinct findings, exactly 10 verified fixes, with coherent times, severity distribution and project references. Counts should be derived from rows, not separately hardcoded. No stale links. Seeded IDs distinct and stable.

## Flagship scenario: BOLA / IDOR invoice
- Owned synthetic users Alice and Bob and harmless synthetic invoice IDs.
- Baseline Alice → Alice invoice: HTTP 200.
- Vulnerable revision: Alice → Bob invoice: HTTP 200 with Bob fixture. This is only a scripted sample.
- Policy-approved sample test and mock runner lifecycle.
- Containment scene: prohibited out-of-scope request is blocked, as an **illustration**, not a genuine runtime event.
- Analysis summarizes why owner authorization is missing.
- Finding marked High, confirmed in simulated scenario; evidence links all resolve.
- Fix guidance: owner ID must match authenticated principal, otherwise reject.
- Patched replay: Alice → Bob HTTP 403, Alice → Alice HTTP 200.
- Simulated verdict: verified_fixed with separate security and positive-control assertions.
- The initial finding stays in history, and updated remediation badge is reflected on dashboard.

## Other scenarios
1. Payment coupon replay logic (fictional controlled demo).
2. Cross-tenant project membership (fictional controlled demo).
3. API rate-limit bypass (fictional controlled demo).
No arbitrary real-site security claims, realistic but harmless request samples.

## Scenario data requirements
Use a fixed seed, canonical event ordering, references to same project/scan/finding, and virtual durations. Sample history should include completed, partial, canceled, and recent runs. Preserve user-created URL as display-only text, never auto-verify or fetch. The selected scenario determines every simulated finding; never claim findings for the entered real domain.
