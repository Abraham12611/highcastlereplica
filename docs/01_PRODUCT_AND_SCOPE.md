# Product Mission and Scope

HighCastle — “Your personal AI security engineer. Prove the risk. Prove the fix.”

HighCastle's envisioned user loop is Connect → authorize → investigate → plan → bounded test → independently verify evidence → explain & fix → replay → monitor. Replica illustrates these capabilities without actually executing them.

## Audience
AI-assisted indie builders, full-stack developers and startups. Offer Builder Mode (accessible business language) and Developer Mode (technical traces and IDs). Switching modes does not change underlying results.

## Essential video moments
A populated workspace feels like months of activity. User enters a URL and selects a **sample test scenario**. Simulated reconnaissance and agent activities appear slowly and in batches. A synthetic invoice authorization test shows Alice's authorized baseline (200), Alice accessing Bob's private invoice in vulnerable revision (200), and a synthetic oracle finding. A demonstration containment action is blocked. Finding detail explains impact/attack path; remediation guidance is copyable. Patch replay of same scenario yields Bob denied (403) and Alice own invoice still accessible (200). Status becomes Verified Fixed. Finish with reporting/history.

## Non-goals
No live Vultr, arbitrary URL scanning, real security assertions, external model inference, source fetching, OAuth, GitHub Apps, databases, audit authenticity or real vulnerability claims. A real user-supplied URL may decorate the project/scenario, never determine evidence. Never present invented IDs or log lines as genuine services; use synthetic IDs and “Simulated demo” labels.

## Success
The flow runs fully in Vercel, desktop 1440x900 readable, mobile usable, zero dead primary navigation, deterministic repeatable recording, no network calls except loading bundled frontend assets, no production secrets.
