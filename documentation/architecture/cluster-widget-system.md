# Cluster Widget System

**Status:** ✅ Implemented | Strict route catalog + commit-driven shell/surface orchestration

## Overview

ClusterWidget is the runtime orchestrator used by cluster-based widgets.

Primary owners:

- cluster/ClusterWidget.js: lifecycle orchestration and commit ordering
- cluster/mappers/ClusterMapperRegistry.js: cluster mapper resolution
- cluster/rendering/ClusterKindCatalog.js: strict cluster/kind route tuples
- cluster/rendering/ClusterRendererRouter.js: shell rendering and surface routing
- cluster/rendering/ClusterSurfacePolicy.js: centralized surface policy + vertical shell sizing integration
- cluster/rendering/HtmlSurfaceController.js: committed HTML lifecycle owner
- cluster/rendering/CanvasDomSurfaceAdapter.js: committed canvas lifecycle owner

## Runtime Flow

1. host calls translateFunction(props)
2. mapper registry resolves cluster mapper and returns normalized renderer payload
3. renderHtml(props) returns inert shell markup only
4. HostCommitController resolves committed root/shell for the latest render revision
5. ClusterWidget commit callback applies runtime._theme outputs to root
6. router creates session payload (including normalized surfacePolicy and shell sizing materialization)
7. SurfaceSessionController reconciles html/canvas-dom surface session

## Theme and Commit Ordering

Commit order is strict:

- runtime._theme.applyToRoot(rootEl)
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
- widget owns height through getVerticalShellSizing(...)
- runtime/router materializes ratio sizing via aspect-ratio and natural sizing via height on the inert shell

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
