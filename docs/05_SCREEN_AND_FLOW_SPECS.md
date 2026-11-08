# Screen Map and UI/UX Flows

## Paths
`/` landing (existing HighCastle aesthetic);
`/demo` entrance/showcase;
`/app` populated workspace overview;
`/app/projects` project list;
`/app/projects/new` new project demo (display-only real URL and scenario selection);
`/app/projects/[id]` project detail;
`/app/scans` scan history;
`/app/scans/[id]` live investigation and completed scan;
`/app/findings` filterable findings;
`/app/findings/[id]` finding overview, attack path, proof, fix, replay;
`/app/replays/[id]` side-by-side patched test;
`/app/reports` report gallery/export;
`/app/automation` illustrative workflow schedules;
`/app/integrations` illustrative connected-source gallery;
`/app/settings` mode preferences;
`/recording` hidden recording operator tools.

## Global shell
Left rail, top header workspace and mode toggle, content max-width, responsive mobile drawer, persistent demo badge. Route links must work. All data read from fixture store.

## Main storyboard flow
Landing (or skip) → sample workspace → project → new assessment → setup scope → start simulated investigation → watch timed timeline/reveal → finding detail → attack path/proof → fix prompt → launch simulated replay → before/after comparison → verified fixed → updated dashboard / report.

## Signature scan view
65/35 split desktop: animated chronological timeline on left; right: status phases, agents, evidence count, containment ledger, resource readouts. Show semantic actor roles: hypothesis violet, execution cyan, verification mint/coral. “Thinking process” means concise fictional status summaries, NOT raw LLM private reasoning. Each event has expand drawer with harmless synthetic request/response; disabled next events do not expose future results.

## Accessibility and responsive
1440x900 primary film frame; 390px mobile sanity. All buttons keyboard accessible. Motion respects reduced-motion. Avoid animations that obscure proof readability. A 2–3 minute playback may use 20–40 visible events, but operator speed override permits rehearsal.
