# Host Commit Controller

**Status:** ✅ Implemented | Deferred commit scheduler for `renderHtml` host mounting

## Overview

`runtime/HostCommitController.js` owns deferred DOM commit after `renderHtml` returns shell markup. It is consumed by `cluster/ClusterWidget.js` to resolve mounted shell/root elements before surface-session reconciliation.

## Key Details

- File: `runtime/HostCommitController.js`
- Factory: `runtime.createHostCommitController(options?)`
- Ownership: commit scheduling + shell/root resolution only; no renderer/session lifecycle ownership
- Strict selectors:
  - `.widgetData.dyni-shell[data-dyni-instance="<instanceId>"]`
  - `shellEl.closest(".widget.dyniplugin")`
- Root marker verification: `dyniplugin` and `dyni-host-html`
- Scheduling sequence:
  - `requestAnimationFrame` probe 1
  - `requestAnimationFrame` probe 2
  - `requestAnimationFrame` probe 3
  - `requestAnimationFrame` probe 4
  - `MutationObserver(document.body, { childList: true, subtree: true })`
  - `setTimeout(..., 2000)` observer ceiling final probe
  - `setTimeout(..., 0)` final probe only when `MutationObserver` is unavailable
- Observer scope intentionally remains `document.body`: shell markup is mounted asynchronously and no stable per-instance ancestor is guaranteed before first commit.
- Stale guard: scheduled commit revision must equal current `renderRevision`
- Dedup: repeated `scheduleCommit()` for the same revision is a no-op
- Timeout ceiling behavior: after observer ceiling expires, one final readiness probe runs; unresolved commits are explicitly abandoned and pending state is cleared.
- Cleanup always tears down pending rAF/observer/timeout handles (success, stale, timeout-abandon, cleanup/reset)
- `timeoutHandle` is the single timeout owner for both no-observer fallback probes and observer-ceiling teardown.
- `getState()` uses snapshot memoization: repeated reads return the same object reference until controller state mutates
- Wait-stage tags: `raf-1`, `raf-2`, `raf-3`, `raf-4`, `mutation-observer`, `observer-timeout`, `timeout`, `cleanup`, `reset`, `stale`

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

Snapshot semantics:

- reference is stable across repeated reads while state is unchanged
- a new snapshot object is created after each meaningful state mutation boundary (`recordRender`, scheduling, commit resolution, cleanup/reset, async-handle teardown)

### `onCommit(payload)` Shape

`payload.instanceId`, `payload.revision`, `payload.props`, `payload.rootEl`, `payload.shellEl`, `payload.state`

## Related

- [component-system.md](component-system.md)
- [runtime-lifecycle.md](runtime-lifecycle.md)
- [cluster-widget-system.md](cluster-widget-system.md)
- [surface-session-controller.md](surface-session-controller.md)
