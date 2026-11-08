# Shared Contracts — Freeze Before UI Wiring

Type shapes to implement by contracts owner in `src/demo/types.ts`. Other lanes import, do not redefine.

```ts
export type DemoMode = 'builder' | 'developer';
export type DemoPhase = 'idle' | 'queued' | 'recon' | 'planning' | 'policy' | 'preparing' | 'executing' | 'verifying' | 'finalizing' | 'completed' | 'failed' | 'canceled';
export type DemoSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type DemoConfidence = 'suspected' | 'supported_by_analysis' | 'confirmed_by_execution' | 'inconclusive';
export type DemoRemediationStatus = 'open' | 'in_progress' | 'pending_verification' | 'verified_fixed' | 'accepted_risk' | 'dismissed';
export type DemoEvent = {
 id: string; seq: number; offsetMs: number; phase: DemoPhase; actor: 'agent'|'policy'|'runner'|'oracle'|'system';
 title: string; summary: string; detail?: string; request?: string; response?: string; evidenceId?: string; status: 'pending'|'running'|'done'|'blocked'|'failed';
};
export type DemoProject = {id:string; slug:string; name:string; description:string; url:string; createdAt:string; status:'ready'|'attention'|'scanning'; scenarioId:string};
export type DemoScan = {id:string; projectId:string; scenarioId:string; startedAt:string; completedAt?:string; phase:DemoPhase; status:'queued'|'running'|'completed'|'failed'|'canceled'; findings:string[]; events:DemoEvent[]};
export type DemoFinding = {id:string; projectId:string; scanId:string; title:string; severity:DemoSeverity; confidence:DemoConfidence; remediationStatus:DemoRemediationStatus; summary:string; impact:string; affectedRoute:string; firstSeenAt:string; lastSeenAt:string; evidenceIds:string[]};
export type DemoEvidence = {id:string; scanId:string; findingId?:string; kind:string; request?:string; response?:string; assertion?:string; digest:string; synthetic:true};
export type DemoScenario = {id:string; title:string; description:string; projectId:string; events:DemoEvent[]; replayEvents:DemoEvent[]; findingIds:string[]; durationMs:number};
export type DemoWorkspace = {id:string; name:string; synthetic:true; projects:DemoProject[]};
```

## Engine API contract
```ts
type PlaybackControls = {
 start:(scenarioId:string,opts?:{url?:string})=>void;
 pause:()=>void; resume:()=>void; reset:()=>void; setSpeed:(speed:0.5|1|2|4)=>void;
 seek:(offsetMs:number)=>void; getVisibleEvents:()=>DemoEvent[];
};
```

State may be Zustand or React external-store; choose before implementation. No implicit random event generation or arbitrary fetched real-site results. Every status and count derived from fixture records. To prevent hydration mismatches, browser persistence only initializes after mount. Demo clock can accelerate; events always preserve order.
