# Surface Session Controller

**Status:** ✅ Implemented | Runtime state machine for `html` / `canvas-dom` session ownership

## Overview

`runtime/SurfaceSessionController.js` coordinates per-instance surface lifecycle transitions after host commit resolution. `cluster/ClusterWidget.js` uses it to reconcile attach/update/remount/surface-switch transitions against the mounted shell through the runtime surfaces service.

## Key Details

- File: `runtime/SurfaceSessionController.js`
- Factory: `runtime.createSurfaceSessionController({ surfaces: runtime.surfaces })`
- Surface service contract: `surfaces.createController({ surface, rendererSpec, hostContext, shadowCssUrls })`
- Strict supported surfaces:
  - `html`
  - `canvas-dom`
- Strict behavior:
  - throws for unsupported surface IDs
  - throws when the surfaces service is missing or does not expose `createController`
  - throws when returned controllers do not implement `attach`/`update`/`detach`/`destroy`
- Stale guard: `reconcileSession(payload)` returns `false` when `payload.revision < mountedRevision`
- Return value: `reconcileSession(payload)` returns `true` when the session is accepted and processed
- Called from `ClusterWidget` host-commit pipeline (`HostCommitController.onCommit` -> router `createSessionPayload` -> `reconcileSession`)
- Same-surface transitions:
  - no active controller: create controller and attach
  - same route + same renderer + same surface + same shell: `update(payload)`
  - same route + same renderer + same surface + different shell: `detach("remount")` then `attach(payload)`
  - different route or renderer on the same surface: destroy the old controller, create a new controller, and attach the new payload
  - different surface: `detach("surface-switch")`, `destroy()` old controller, create new controller, then `attach(payload)`
- Shell replacement transition:
  - `detachForShellReplacement()` is a no-arg method
  - no active controller: silently no-op
  - active controller: `detach("shell-replacement")`
  - clears only `shellEl`
  - preserves `activeController` plus mounted route/renderer/surface/revision identity
- Shell sizing ownership:
  - `SurfaceSessionController` must not mutate shell sizing styles
  - shell sizing remains owned outside the session controller

## API/Interfaces

```javascript
const session = runtime.createSurfaceSessionController({
  surfaces: runtime.surfaces
});

session.initState();
session.reconcileSession({
  routeId,
  rendererId,
  surface,
  rootEl,
  shellEl,
  hostContext,
  props,
  revision,
  rendererSpec,
  shadowCssUrls
});
session.isCurrentRevision(revision);
session.detachForShellReplacement();
session.destroy();
session.getState();
```

### `reconcileSession(payload)` Input

| Key | Type | Required | Notes |
|---|---|---|---|
| `routeId` | `string` | yes | Mounted route identity used for route comparisons |
| `rendererId` | `string` | yes | Mounted renderer identity used for renderer comparisons |
| `surface` | `string` | yes | Must be `html` or `canvas-dom` |
| `rootEl` | `Element` | yes | Host root for active session |
| `shellEl` | `Element` | yes | Session shell element |
| `hostContext` | `object` | yes | Host context passed to the renderer controller |
| `props` | `object` | yes | Last mapped props snapshot |
| `revision` | `number` | yes | Finite revision used for stale guard + async checks |
| `rendererSpec` | `object` | yes | Renderer spec used to build the controller |
| `shadowCssUrls` | `string[]` | yes | Shadow DOM stylesheet URLs for the session controller |

### `surfaces.createController(payload)` Input

| Key | Type | Required | Notes |
|---|---|---|---|
| `surface` | `string` | yes | Target surface ID |
| `rendererSpec` | `object` | yes | Renderer spec for controller construction |
| `hostContext` | `object` | yes | Host context passed through to the controller |
| `shadowCssUrls` | `string[]` | yes | Shadow DOM stylesheet URLs for the controller |

### State Shape (`getState`)

`mountedRouteId`, `mountedRendererId`, `mountedSurface`, `mountedRevision`, `activeController`, `shellEl`

## Related

- [host-commit-controller.md](host-commit-controller.md)
- [runtime-lifecycle.md](runtime-lifecycle.md)
- [cluster-widget-system.md](cluster-widget-system.md)
- [component-system.md](component-system.md)
- [html-renderer-lifecycle.md](html-renderer-lifecycle.md)
