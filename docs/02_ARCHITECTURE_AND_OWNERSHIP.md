# Architecture and Parallel Ownership

## Proposed structure
- `src/app/`: Next.js routes and layouts (Foundation owns root; route owner owns specific route)
- `src/components/shell/`: shared dark shell/navigation (Shell Engineer)
- `src/demo/types.ts`: shared types and interfaces (Contracts Engineer only)
- `src/demo/fixtures/`: seeded projects, scans, findings, timelines, evidence (Data Engineer; split by filename)
- `src/demo/engine/`: pure deterministic timed playback, persistence and subscriptions (Engine Engineer)
- `src/features/dashboard/`: workspace overview/history
- `src/features/projects/`: project catalog/creation
- `src/features/investigation/`: running scan theater
- `src/features/findings/`: findings and proof
- `src/features/replay/`: patch verification
- `src/features/recording/`: private recording control panel
- `src/features/reports/`, `src/features/attack-map/`, `src/features/integrations/`: secondary areas

## Technical boundaries
Build a Vercel-deployable standalone Next.js React TypeScript application; no required server runtime, credentials or services. Reuse HighCastle UI components and CSS from original repo where practical. Avoid bringing backend-bound modules into build paths. Use localStorage for persistence; SSR must not access browser globals. Include clean reset. No arbitrary outbound request from entered URL.

## Cross-lane ownership
Only Engineer 1 owns package.json, next.config, tsconfig, root layout, base global CSS and Vercel config. Only Engineer 2 owns demo/types.ts and central adapter definitions. Only Engineer 3 owns shared nav shell. Only Engineer 4 owns canonical fixture index and dataset generator. Only Engineer 5 owns core engine. Other engineers own their feature folders and specific routes stated in their tickets. If a route needs a shared change, request it in the issue, do not edit cross-lane.

## Contract-first parallelism
Engineers 1–5 expose minimal interfaces first; dependent engineers code against docs/03_CONTRACTS.md and isolate adapters. Avoid circular imports. Use alias `@/` rooted at `src/` or agree with foundation. No CSS globals outside Foundation.

## Playback states
idle | queued | recon | planning | policy | preparing | executing | verifying | finalizing | completed | failed | canceled. Source `occurredAt` is virtual scenario time, `offsetMs` controls reveal schedule. All side effects occur through store actions and must be idempotent. Refresh/resume deterministically reconstructs revealed events.

## PR dependencies
Foundation and contracts are merge gates. Data and Engine land after contracts. Page lanes may open PR early, but coordinator holds merge until dependencies land. No engineer self-merges.
