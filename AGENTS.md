# HighCastle Replica — Mandatory Engineering Rules

## Mission
Build a standalone, deterministic, Vercel-hosted **simulated product walkthrough** for recording a 3–4 minute HighCastle video. No production services and no live security assessments. Product must look/feel like HighCastle from https://github.com/Abraham12611/highcastle. This repository is NOT the real submission/runtime.

## Absolute rules
1. Every engineer takes ONE GitHub issue and explicitly states ownership in an issue comment. Create a NEW branch `feat/issue-NN-short-name` from current `main`. Make a PR into `main`; NEVER merge it yourself. Coordinator reviews and merges.
2. Follow strict **file ownership** in the issue. Do not edit files owned by other lanes. Do not opportunistically change root configs, dependencies, shared types or shell. For needed contract changes, comment on the issue and coordinate.
3. All displayed investigations, AI steps, scans, evidence and histories are deterministic samples. Include visible small label “Simulated demo” on scenario surfaces and do not assert live Vultr execution, real URL findings, or invented provenance. Real URLs are displayed/input only: never request, scan, crawl or interact with submitted hosts.
4. No auth, database, external APIs, model calls, Docker, Postgres, queues, background workers or network-dependent results. Vercel frontend-only. No secrets needed.
5. Reuse or faithfully port the original HighCastle UI: `#080D1A` background, `#10192A` panels, `#62F5D1` mint, `#A48BFF` violet, `#63CFFF` cyan, `#FF708A` coral. Responsive, accessible, original font/assets.
6. Product interactions MUST work; no dead-end primary CTA. All data must be internally consistent. 90-day historical activity is seeded fictional data.
7. All manual UI tests are performed by the OWNER. Engineers run build, lint, typecheck, automated tests and provide reproducible manual QA instructions/screenshots for owner, but do not claim user manual acceptance.
8. Avoid heavy dependencies and risky rewrites. Minimal PRs. No changes to real HighCastle repo.
9. Do not reveal private reasoning as fabricated model chain-of-thought. Show high-level “agent activity summaries” only.
10. If behind schedule, prioritize dashboard → scan theater → evidence finding → patch replay → recording control → Vercel.

## Common interfaces
See docs/03_CONTRACTS.md. Engine and pages must consume `DemoProject`, `DemoFinding`, `DemoScan`, `DemoEvent`, `DemoScenario` from `src/demo/types.ts`. Engine operates on preauthored events with relative offsets, no network. Persist demo recording state through browser storage only. Final architecture choice belongs to Foundation Engineer (issue 1) and must be posted in issue before incompatible work.

## PR format
Title: `feat(demo): ... (#N)`
Body: issue, files owned/changed, screenshots or QA notes, build/lint/typecheck results, any blocked dependencies, remaining limitations. Every PR must target main and await coordinator review. Do not self-merge, force-push main or change repository visibility.

## Timeline
P0 immediate: foundation/port, contracts, fixtures, dashboard, scenario engine, investigation, findings, replay, recording controls, deployment.
P1 if P0 green: attack map, reports, onboarding, gallery and navigation polish.
P2 optional: integration previews, notifications, automation, advanced effects.

## Coordinator merge order
Foundation → contracts/UI shell → fixtures/engine → scenario pages → polish/QA → deploy. Integration PR may need rebase onto updated main. Stop work on conflicting files and ask coordinator.
