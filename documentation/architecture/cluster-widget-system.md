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

## Runtime Flow

1. host calls translateFunction(props)
2. runtime.clusterShellRenderer normalizes the route frame and reads route metadata
3. ClusterWidget.renderHtml(routeFrame) returns inert shell markup
4. HostCommitController resolves committed root/shell
5. ClusterWidget applies runtime.theme to the committed root
6. ClusterWidget calls SurfaceSessionController.detachForShellReplacement()
7. runtime.routeActivation activates the committed route from `config.clusterRoutes.byRouteId`
8. RouteActivationPayloadBuilder merges `rendererProps` into route props, strips renderer identity fields, and SurfaceSessionController reconciles the activated payload

## Theme and Commit Ordering

Commit order is strict:

- runtime.theme.applyToRoot(rootEl)
- then surface session reconcile

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
- normalized capabilities are cached per hostContext and recomputed only when raw capability object identity changes

Renderers do not call host capability APIs directly.

## Vertical Shell Sizing Ownership

In vertical mode:

- host owns width
- pre-activation shell sizing is route metadata owned by ClusterShellRenderer
- ClusterShellRenderer materializes routeMeta.shellSizing onto the inert shell
- post-activation sizing is renderer shadow CSS owned inside the committed renderer
- there is no renderer-spec `getVerticalShellSizing(...)` hook
- route-specific natural-height behavior is finalized after activation inside the committed renderer, not by the shell

RoutePoints is the only width-derived natural-height exception finalized at first commit before surface attach.

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
