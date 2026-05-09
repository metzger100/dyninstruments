# Runtime Lifecycle

**Status:** ✅ Implemented | plugin startup ownership + runtime theme commit materialization + commit-driven surface reconciliation

## Overview

This document describes the live runtime lifecycle after PLAN9.

Authoritative owners:

- plugin.js: sole automatic startup owner
- runtime/init.js: startup wiring only (runInit), no self-invocation
- runtime/theme-runtime.js: internal theme lifecycle owner (`runtime.theme`)
- cluster/ClusterWidget.js: commit ordering owner (theme apply before surface reconcile)
- config/cluster-routes/*.js: route metadata source for `config.clusterRoutes.byRouteId`
- runtime/cluster/ClusterShellRenderer.js: route-frame normalization and pre-activation shell sizing owner
- runtime/cluster/RouteActivationController.js: lazy route activation owner
- runtime/cluster/RouteActivationPayloadBuilder.js: mapper/view-model/renderer loading and activated-payload assembly
- runtime/TemporaryHostActionBridge.js: temporary host-action shim owner

## Startup Sequence

1. plugin.js loads config/bootstrap-manifest.js, then loads the manifest-listed scripts in order and reaches runtime/theme-runtime.js before runtime/init.js.
2. plugin.js calls window.DyniPlugin.runtime.runInit() exactly once.
3. runtime/init.js creates the host-action bridge singleton.
4. runtime/init.js resolves required components via runtime/component-loader.js.
5. runtime/init.js reads --dyni-theme-preset once from document.documentElement.
6. runtime/init.js normalizes that preset through `runtime.theme` internals.
7. runtime/init.js configures `runtime.theme`.
8. runtime/init.js registers widgets.

Startup does not scan plugin roots and does not apply per-root theme state.
Startup does not preload renderer shadow CSS; route activation owns active-route shadow CSS preload.

## Commit Sequence

For every host commit, ClusterWidget enforces this order:

1. host commit resolves committed root and shell elements
2. runtime.theme.applyToRoot(rootEl) overwrites required --dyni-theme-* outputs
3. ClusterWidget uses `runtime.routeActivation.createWidgetController(def)` to create the route activation widget controller, then calls that controller's `activateCommittedRoute(...)` to resolve route metadata from `config.clusterRoutes.byRouteId`
4. RouteActivationPayloadBuilder merges mapper `rendererProps`, strips renderer identity fields, and materializes the activated payload
5. SurfaceSessionController.reconcileSession(...) attaches or updates html/canvas-dom surfaces

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
- route metadata fields from `config.clusterRoutes.byRouteId`: routeId, mapperId, rendererId, surface, optional viewModelId, and shellSizing

Renderers do not probe host React/DOM internals directly. Host coupling stays in TemporaryHostActionBridge.

## Related

- component-system.md
- cluster-widget-system.md
- html-renderer-lifecycle.md
- vertical-container-contract.md
- surface-session-controller.md
- host-commit-controller.md
- ../shared/theme-tokens.md
