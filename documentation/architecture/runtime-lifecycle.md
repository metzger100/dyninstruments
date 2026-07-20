# Runtime Lifecycle

**Status:** ✅ Implemented | dual-entrypoint plugin startup ownership + runtime theme commit materialization +
commit-driven surface reconciliation

## Overview

This document describes the live runtime lifecycle after PLAN9.

Authoritative owners:

- runtime/plugin-bootstrap-core.js: shared automatic startup owner (bundle-first, manifest fallback, `runInit()`)
- plugin.js: legacy AvNav adapter (`AVNAV_BASE_URL` + `avnav.api` discovery)
- plugin.mjs: modern AvNav adapter (default export + `api.getBaseUrl()`)
- runtime/init.js: startup wiring only (runInit), no self-invocation
- runtime/theme-runtime.js: internal theme lifecycle owner (`runtime.theme`)
- cluster/ClusterWidget.js: commit ordering owner (theme apply, committed revision floor record, then surface reconcile)
- config/cluster-routes/*.js: route metadata source for `config.clusterRoutes.byRouteId`
- runtime/cluster/ClusterShellRenderer.js: route-frame normalization and pre-activation shell sizing owner
- runtime/cluster/RouteActivationController.js: lazy route activation owner
- runtime/cluster/RouteActivationPayloadBuilder.js: mapper/view-model/renderer loading and activated-payload assembly
- runtime/TemporaryHostActionBridge.js: temporary host-action shim owner

## Startup Sequence

1. `plugin.js` (legacy path) or `plugin.mjs` (modern module path) resolves host API + plugin base URL, feature-detects
   required host methods, then delegates to `runtime/plugin-bootstrap-core.js`.
2. The shared bootstrap core attempts to load `bootstrap-bundle.js` first. If it succeeds, all bootstrap scripts have
   executed and the manifest walk is skipped.
3. If bundle load fails (for example dev mode), the shared core loads `config/bootstrap-manifest.js`, then
   manifest-listed scripts in order, reaching `runtime/theme-runtime.js` before `runtime/init.js`.
4. The shared core records a startup generation (`entrypoint`, `baseUrl`, `hostApi`, unique id) on
   `window.DyniPlugin.startupGeneration`.
5. The shared core calls `window.DyniPlugin.runtime.runInit()` exactly once per startup invocation.
6. On the module path, bootstrap script IDs are generation-aware (derived from module base URL) so timestamped AvNav
   reloads load updated classic scripts instead of reusing stale IDs from an older generation.
7. Component JS and CSS loads go through bootstrap-provided scoped loaders, keeping module timestamp reloads isolated
   while allowing already-loaded static code to remain reusable.
8. runtime/init.js creates the host-action bridge singleton for the current startup generation.
9. runtime/init.js resolves required components via runtime/component-loader.js.
10. runtime/init.js reads --dyni-theme-preset once from document.documentElement.
11. runtime/init.js normalizes that preset through `runtime.theme` internals.
12. runtime/init.js configures `runtime.theme`.
13. runtime/init.js registers widgets against the current AvNav API generation.

## Reload/Shutdown Contract

- `plugin.mjs` returns the shutdown function produced by `runtime.runInit()` when AvNav supports module shutdown.
- Every module invocation is a distinct host/API generation, even when static script code is reused.
- `runtime/init.js` reuses an init promise only within the same generation.
- A new generation clears old `initStarted`, `initPromise`, host-action bridge, `runtime.hostActions`, and
  `runtime.componentLoader` state before registering widgets.
- Shutdown clears only generation-bound state; loaded classic scripts, global component module objects, and declarative
  config remain reusable.
- Failed component loading clears generation state so a later startup can retry and register widgets.

Startup does not scan plugin roots and does not apply per-root theme state. Startup does not preload renderer shadow
CSS; route activation owns active-route shadow CSS preload.

## Commit Sequence

For every host commit, ClusterWidget enforces this order:

1. host commit resolves committed root and shell elements
2. runtime.theme.applyToRoot(rootEl) overwrites required --dyni-theme-* outputs
3. ClusterWidget records the committed revision floor on SurfaceSessionController
4. ClusterWidget uses `runtime.routeActivation.createWidgetController(def)` to create the route activation widget
   controller, then calls that controller's `activateCommittedRoute(...)` to resolve route metadata from
   `config.clusterRoutes.byRouteId`
5. RouteActivationPayloadBuilder merges mapper `rendererProps`, strips renderer identity fields, and materializes the
   activated payload
6. SurfaceSessionController.reconcileSession(...) attaches or updates html/canvas-dom surfaces

There is no theme-change gate before apply. Outputs are applied on every commit.

## Preset Ingestion Contract

- startup source is only document.documentElement --dyni-theme-preset
- startup value is normalized and stored as runtime-owned fallback preset
- `componentContext.theme.tokens.resolveForRoot(rootEl)` returns the committed-root snapshot to components
- effective preset is always normalized through `runtime.theme`
- no public imperative preset mutation API exists

## Surface Policy and Bridge Ownership

Runtime resolves one normalized surface policy object per routed update.

Policy includes:

- pageId
- containerOrientation (from props.mode)
- interaction.mode (dispatch or passive)
- normalized callbacks under surfacePolicy.actions
- host facts for rendering/sizing (for example viewport height)
- route metadata fields from `config.clusterRoutes.byRouteId`: routeId, mapperId, rendererId, surface, optional
  viewModelId, and shellSizing

Renderers do not probe host React/DOM internals directly. Host coupling stays in TemporaryHostActionBridge.

## Related

- component-system.md
- cluster-widget-system.md
- html-renderer-lifecycle.md
- vertical-container-contract.md
- surface-session-controller.md
- host-commit-controller.md
- ../shared/theme-tokens.md
