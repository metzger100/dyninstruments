# Cluster Widget System

**Status:** ✅ Implemented | Route-metadata-driven shell/surface orchestration

## Overview

ClusterWidget is the live shell/orchestrator boundary for cluster-based widgets. Route identity, renderer choice, and shell sizing come from `config.clusterRoutes.byRouteId`.

Primary owners:

- cluster/ClusterWidget.js: lifecycle orchestration and commit ordering
- config/cluster-routes/*.js: route metadata assembly into `config.clusterRoutes.byRouteId` (`routeId`, `mapperId`, `rendererId`, `surface`, optional `viewModelId`, `shellSizing`)
- cluster/mappers/*Mapper.js: declarative route-props mapping only; no renderer identity
- runtime/cluster/ClusterShellRenderer.js: route-frame normalization and pre-activation shell sizing materialization
- runtime/cluster/RouteActivationController.js: lazy route activation service composition
- runtime/cluster/RouteActivationPayloadBuilder.js: mapper/view-model/renderer loading plus `rendererProps` merge/strip
- runtime/surface/HtmlSurfaceController.js: committed HTML lifecycle owner
- runtime/surface/CanvasDomSurfaceAdapter.js: committed canvas lifecycle owner

## Route Metadata Contract

`config.clusterRoutes.byRouteId[routeId]` is the source of route identity and route policy.

It owns:

- `routeId`
- `mapperId`
- `rendererId`
- `surface`
- optional `viewModelId`
- `shellSizing`

Mapper output is route props only.

- mappers do not emit renderer identity
- `rendererProps` is merged into the activated props during route activation
- `renderer` and `rendererProps` are stripped from the activated payload after merge
- route activation memoization compares payload `__mappedSignature` plus `nightMode` and `editing`, and also requires unchanged committed `rootEl`/`shellEl` attachment targets before returning `DISCARDED_ACTIVATION`
- ClusterWidget invalidates route-activation memo state when it detaches an active surface for an invalid/diagnostic route commit (no activation path for that commit)

## Runtime Flow

1. host calls translateFunction(props)
2. runtime.clusterShellRenderer normalizes the route frame and reads route metadata
3. ClusterWidget.renderHtml(routeFrame) returns inert shell markup
4. HostCommitController resolves committed root/shell
5. ClusterWidget applies runtime.theme to the committed root
6. ClusterWidget records the committed revision floor on SurfaceSessionController
7. ClusterWidget calls SurfaceSessionController.detachForShellReplacement() only when the shell was actually replaced or the route is invalid/diagnostic and an active surface must be torn down
8. runtime.routeActivation activates the committed route from `config.clusterRoutes.byRouteId`
9. RouteActivationPayloadBuilder merges `rendererProps` into route props, strips renderer identity fields, and emits payload `__mappedSignature`
10. RouteActivationController memo-compares `__mappedSignature` + `nightMode` + `editing` and committed `rootEl`/`shellEl` identity; only unchanged data with unchanged attachment targets returns `DISCARDED_ACTIVATION` before surface reconcile
11. ClusterWidget calls `activationController.invalidateMemoState()` when it detaches for invalid/diagnostic commits that skip activation
12. SurfaceSessionController reconciles only non-discarded activated payloads

## Theme and Commit Ordering

Commit order is strict:

- runtime.theme.applyToRoot(rootEl)
- SurfaceSessionController.recordCommittedRevision(revision)
- then conditional shell-replacement detachment, followed by surface session reconcile
- stale activation payload filtering belongs to SurfaceSessionController, not ClusterWidget

This ensures both HTML and canvas render against the same committed theme outputs.

## Surface Policy Ownership

ClusterSurfacePolicy resolves one normalized policy object per routed update.

Policy includes:

- pageId
- containerOrientation from props.mode
- interaction.mode (dispatch or passive)
- normalized action callbacks under surfacePolicy.actions
- host facts such as viewport height

Route-prop materialization contract:

- routeState.props identity is preserved (no clone per update)
- runtime-only fields are materialized as non-enumerable props:
  - surfacePolicy
  - viewportHeight

Host-context cache contract:

- normalized action wrappers are cached per hostContext and refreshed when hostActions owner changes
- `hostContext.hostActions` is the snapshot object attached by `runtime/widget-registrar.js` on each wrapped lifecycle call
- normalized capabilities are cached per hostContext and recomputed only when raw capability object identity changes

Renderers do not call host capability APIs directly.

## Vertical Shell Sizing Ownership

In vertical mode:

- host owns width
- pre-activation shell sizing is route metadata owned by ClusterShellRenderer
- ClusterShellRenderer materializes ratio shellSizing onto the inert shell
- post-activation sizing is renderer shadow CSS owned inside the committed renderer
- there is no renderer-spec vertical-sizing hook
- route-specific natural-height behavior is finalized after activation inside the committed renderer, not by the shell

RoutePoints is the only width-derived natural-height exception, and its committed renderer shadow CSS owns the final size after activation.

## HTML Route Contract

HTML routes are split into:

- shell spec: inert shell + stable mount host
- committed renderer factory: mount/update/postPatch/detach/destroy

No named-handler or onclick host translation contract is used for dyninstruments HTML surfaces.

## Related

- component-system.md
- runtime-lifecycle.md
- html-renderer-lifecycle.md
- vertical-container-contract.md
- canvas-dom-surface-adapter.md
