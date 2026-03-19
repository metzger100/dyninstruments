# Surface Session Controller

**Status:** ✅ Implemented | Runtime state machine for `html` / `canvas-dom` session ownership, wired in `ClusterWidget` (Phase 9)

## Overview

`runtime/SurfaceSessionController.js` coordinates per-instance surface lifecycle transitions after host commit resolution.
It was introduced as a standalone runtime module in Phase 6 and is now consumed by `cluster/ClusterWidget.js` for live surface attach/update/detach transitions.

## Key Details

- File: `runtime/SurfaceSessionController.js`
- Factory: `runtime.createSurfaceSessionController({ createSurfaceController })`
- Strict supported surfaces:
  - `html`
  - `canvas-dom`
- Strict non-compat behavior:
  - throws for unsupported surface IDs
  - throws when `createSurfaceController` is missing
  - throws when returned controllers do not implement `attach`/`update`/`detach`/`destroy`
- Stale guard: `reconcileSession(payload)` returns `false` when `payload.revision < mountedRevision`
- Same-surface transitions:
  - same shell: `update(payload)`
  - remount/new shell: `detach("remount")` then `attach(payload)`
- Surface switch transition:
  - `detach("surface-switch")`
  - `destroy()` old controller
  - create new controller + `attach(payload)`

## API/Interfaces

```javascript
const session = runtime.createSurfaceSessionController({
  createSurfaceController(surface) {
    return { attach, update, detach, destroy };
  }
});

session.initState();
session.reconcileSession({ surface, rootEl, shellEl, props, revision });
session.isCurrentRevision(revision);
session.destroy();
session.getState();
```

### `reconcileSession(payload)` Input

| Key | Type | Required | Notes |
|---|---|---|---|
| `surface` | `string` | yes | Must be `html` or `canvas-dom` |
| `rootEl` | `Element` | yes | Host root for active session |
| `shellEl` | `Element` | yes | Session shell element |
| `props` | `any` | no | Last mapped props snapshot |
| `revision` | `number` | yes | Finite revision used for stale guard + async checks |

### State Shape (`getState`)

`desiredSurface`, `mountedSurface`, `surfaceRevision`, `activeController`, `lastProps`, `rootEl`, `shellEl`, `mountedRevision`

## Related

- [host-commit-controller.md](host-commit-controller.md)
- [cluster-widget-system.md](cluster-widget-system.md)
- [component-system.md](component-system.md)
- [../../notes/implementation-plans/PLAN1.md](../../notes/implementation-plans/PLAN1.md)
