# HTML Renderer Lifecycle

**Status:** ✅ Reference | Two-phase HTML render contract and committed-host-state usage

## Overview

This document defines the renderer-side lifecycle contract for `surface: "html"` kinds. It covers first-render limits, corrective rerender timing, committed host-state consumption, and resize-signature stability.

## Key Details

- HTML renderers run under `HtmlSurfaceController` (`attach`/`update`/`detach`/`destroy`) and must also follow host-commit timing from `ClusterWidget`.
- `renderHtml(props)` runs before returned markup is mounted, so committed DOM ancestry is not reliable in first render.
- `initFunction().triggerResize()` is the canonical corrective-rerender hook for renderers that need committed DOM facts.
- Corrective rerender and later updates may consume committed host state from `hostContext.__dyniHostCommitState`.

## API/Interfaces

### Two-Phase Render Pattern

| Phase | Timing | DOM state | Renderer behavior |
|---|---|---|---|
| First render | `renderHtml(props)` before mount | No committed DOM | Use host-sized assumptions only. No committed-ancestry reads. |
| Corrective rerender | After `initFunction().triggerResize()` | Committed DOM available | Read `hostContext.__dyniHostCommitState`; apply committed-DOM layout corrections. |
| Normal updates | Later `renderHtml(props)` passes | Committed DOM available | Re-evaluate committed facts each pass; same contract as corrective rerender. |

### `hostContext.__dyniHostCommitState` Contract

Set by `ClusterWidget`, owned by `HostCommitController`, read by HTML renderers:

```text
hostContext.__dyniHostCommitState = {
  instanceId: string,
  renderRevision: number,
  mountedRevision: number,
  lastProps: object | undefined,
  rootEl: Element | null,
  shellEl: Element | null,
  scheduledRevision: number | null,
  rafHandle: number | null,
  observer: MutationObserver | null,
  timeoutHandle: number | null,
  commitPending: boolean
}
```

Renderer consumption rules:

- Read-only usage: renderers must not mutate this object.
- Standard target resolution: `targetEl = shellEl || rootEl`.
- If state is missing, null, or unresolved (`shellEl`/`rootEl` absent), fail closed: skip committed-DOM work, keep host-sized assumptions, do not throw.
- Canonical reference implementation: `ActiveRouteTextHtmlWidget.resolveHostElements`.

### Post-Commit DOM Effects Pattern

- Keep committed-DOM side effects in a dedicated module owned by the renderer family.
- Schedule effects after `attach` and after rerenders that can change committed DOM state.
- Effects must be bounded (no unbounded polling), stale-safe (drop outdated work), and idempotent.
- Effects must not mutate state in ways that churn `resizeSignature`.

### Resize-Signature Stability Rules

- `resizeSignature(props, hostContext)` must include every external input that changes layout or fit geometry.
- Do not include self-produced outputs (for example widget-computed height), or signatures will churn.
- If behavior has multiple modes, signatures may use mode-specific input sets; the mode flag itself must remain in both signatures.
- `HtmlSurfaceController` triggers `hostContext.triggerResize()` once per signature change; stable signatures prevent rerender loops.

## Related

- [host-commit-controller.md](host-commit-controller.md)
- [surface-session-controller.md](surface-session-controller.md)
- [cluster-widget-system.md](cluster-widget-system.md)
- [../guides/add-new-html-kind.md](../guides/add-new-html-kind.md)
- [vertical-container-contract.md](vertical-container-contract.md)
