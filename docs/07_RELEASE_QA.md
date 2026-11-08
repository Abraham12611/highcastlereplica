# Ship/QA Gates

## Gate A: 1st merge
Next.js app compiles, HighCastle branding and tokens ported, `/app` renders, deployed preview on Vercel configured. No secrets or live service dependencies.

## Gate B: main demo loop
Seed data loads deterministically. Dashboard projects and filters work. New assessment launches a sample scenario, engine reveals events over time, controls work, refresh/resume works, evidence links resolve. Finding and replay show 200→403 plus baseline 200 and update remediation. All states visibly simulated.

## Gate C: polish
No dead navigation, console errors or hydration warnings, 1440x900 primary screenshot clean, 390x844 mobile sanity, motion reasonable, readable evidence panels, no fake real-host vulnerability claims.

## Automated commands
`pnpm install` or `npm install` per Foundation selection; `typecheck`, `lint`, `build`, tests for fixture reference integrity and engine time seeking. Vercel deployment requires no env secrets.

## Owner-only manual UI acceptance
Engineers provide exact click path for owner. No engineer is authorized to claim the owner's manual browser test is complete. Coordinator approves all merges after review.

## Release priority if deadline imminent
1 dashboard 2 scan flow 3 evidence 4 replay 5 recording controls 6 reports. Drop everything P2 if time is tight.

## Submission separation
Replica repo/deployment are used only for recording, not submitted as the underlying real implementation. Avoid capturing Vercel hostname and misleading runtime assertions where possible; retain sample/demo designation.
