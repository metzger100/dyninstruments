# Host Commit Controller

**Status:** ✅ Implemented | Standalone deferred commit scheduler for HTML host mounting

## Overview

`runtime/HostCommitController.js` provides a runtime-owned controller for deferred DOM commit after `renderHtml`.
It is implemented as a standalone module in Phase 5 and is intentionally not wired into `ClusterWidget` yet.

## Key Details

- File: `runtime/HostCommitController.js`
- Factory: `runtime.createHostCommitController(options?)`
- Ownership: commit scheduling + shell/root resolution only; no renderer/session lifecycle ownership
- Strict non-compat selectors:
  - `.widgetData.dyni-shell[data-dyni-instance="<instanceId>"]`
  - `shellEl.closest(".widget.dyniplugin")`
  - root marker verification: `dyniplugin` and `dyni-host-html`
- Scheduling sequence:
  - `requestAnimationFrame` probe 1
  - `requestAnimationFrame` probe 2
  - `MutationObserver(document.body, { childList: true, subtree: true })`
  - `setTimeout(..., 0)` last probe
- Stale guard: scheduled commit revision must equal current `renderRevision`
- Dedup: repeated `scheduleCommit()` for the same revision is a no-op
- Cleanup always tears down pending rAF/observer/timeout handles

## API/Interfaces

```javascript
const controller = runtime.createHostCommitController(options);
controller.initState();
controller.recordRender(props);
controller.scheduleCommit({ onCommit(payload) { /* optional */ } });
controller.cleanup();
controller.getState();
```

### `options` (all optional)

| Key | Type | Purpose |
|---|---|---|
| `instancePrefix` | `string` | Prefix for generated `instanceId` values |
| `document` | `Document` | DOM query target (`querySelector`, `body`) |
| `requestAnimationFrame` | `function` | Inject scheduler for deterministic tests/runtime adapters |
| `cancelAnimationFrame` | `function` | Inject rAF cancellation |
| `setTimeout` | `function` | Inject timeout scheduler |
| `clearTimeout` | `function` | Inject timeout cancellation |
| `MutationObserver` | `function|null` | Inject observer constructor or disable observer fallback |

### State Shape (`getState`)

`instanceId`, `renderRevision`, `mountedRevision`, `lastProps`, `rootEl`, `shellEl`, `scheduledRevision`, `rafHandle`, `observer`, `timeoutHandle`, `commitPending`

### `onCommit(payload)` Shape

`payload.instanceId`, `payload.revision`, `payload.props`, `payload.rootEl`, `payload.shellEl`, `payload.state`

## Related

- [component-system.md](component-system.md)
- [cluster-widget-system.md](cluster-widget-system.md)
- [../../notes/implementation-plans/PLAN1.md](../../notes/implementation-plans/PLAN1.md)
