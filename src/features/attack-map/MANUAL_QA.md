# Attack Map — owner manual click-path (Issue #15)

Component: `src/features/attack-map` → `<AttackMap />`. Deterministic
simulated demo; no network, auth, or live assessment. The owner performs
all manual UI checks — the notes below are the click-path, not a claim
that the checks were run.

## Setup

Host the component on any page (future Finding Detail page imports it via
`import { AttackMap } from '@/features/attack-map'`). No providers, store,
or env secrets required. Before/after Foundation lands, the map renders
standalone with built-in Nocturne Signal fallback tokens.

## Click-path (~3 minutes)

1. **Badge visible.** Confirm the `Simulated demo` badge in the card header
   at both 1440×900 and 390×844 widths.
2. **Default state.** The map loads on the Vulnerable revision with the
   `Ownership authorization — Check missing` verdict banner
   (“Simulated failure — BOLA/IDOR”).
3. **Read the path.** Trace Alice (`user_A · tenant_A`) → Invoice lookup
   (`GET /api/invoices/:id`) → AUTHZ diamond → Bob invoice
   (`invoice_B · HTTP 200 · leaked`, coral) and the control branch to
   Alice invoice (`invoice_A · HTTP 200 · control`, mint).
4. **Select each node.** Click (or Tab to + Enter on) all five nodes:
   Alice, Invoice lookup, AUTHZ diamond, Bob invoice, Alice invoice.
   The details panel below the map updates each time (request/response
   samples for Alice, both invoices) with no console errors.
5. **Keyboard.** Tab through the revision toggle and all five nodes;
   every stop shows a visible focus outline and activates with
   Enter/Space.
6. **Switch revision.** Activate `Patched revision`. Confirm the verdict
   banner flips to “Simulated fix verified”, the diamond reads ENFORCED,
   Bob invoice reads `HTTP 403 · blocked`, and the control still reads
   `HTTP 200 · control`. Select the Bob node: response must be the
   synthetic `403 Forbidden` body with no invoice data.
7. **Switch back.** Re-activate `Vulnerable revision`; the 200-leak state
   returns byte-identically (deterministic, no reload needed).
8. **Legend.** Statuses are word-labelled (never color alone); the legend
   matches the edge styles (coral solid = failure, mint dashed = denied,
   mint solid = allowed, slate = neutral).
9. **Narrow viewport.** At 390×844 the SVG scales down without horizontal
   scrolling and the legend/details stack below it.

## Expected results

- No fetch/XHR in the network tab; no console errors or React warnings.
- `aria-live` details announce node selection to screen readers.
- `prefers-reduced-motion` changes nothing (the map is fully static).
