# Runtime Lifecycle

**Status:** ✅ Implemented | plugin startup ownership + runtime theme commit materialization + commit-driven surface reconciliation

## Overview

This document describes the live runtime lifecycle after PLAN9.

Authoritative owners:

- plugin.js: sole automatic startup owner
- runtime/init.js: startup wiring only (runInit), no self-invocation
- runtime/theme-runtime.js: internal theme lifecycle owner (runtime._theme)
- cluster/ClusterWidget.js: commit ordering owner (theme apply before surface reconcile)
- runtime/TemporaryHostActionBridge.js: temporary host-action shim owner

## Startup Sequence

1. plugin.js bootstraps internal scripts in fixed order and loads runtime/theme-runtime.js before runtime/init.js.
2. plugin.js calls window.DyniPlugin.runtime.runInit() exactly once.
3. runtime/init.js creates the host-action bridge singleton.
4. runtime/init.js resolves required components via runtime/component-loader.js.
5. runtime/init.js eager-loads ThemeModel and ThemeResolver.
6. runtime/init.js reads --dyni-theme-preset once from document.documentElement.
7. runtime/init.js normalizes that preset through ThemeModel.
8. runtime/init.js configures runtime._theme (which configures ThemeResolver).
9. runtime/init.js preloads committed HTML shadow CSS bundles as text.
10. widget registration proceeds.

Startup does not scan plugin roots and does not apply per-root theme state.

## Commit Sequence

For every host commit, ClusterWidget enforces this order:

1. host commit resolves committed root and shell elements
2. runtime._theme.applyToRoot(rootEl) overwrites required --dyni-theme-* outputs
3. ClusterRendererRouter.createSessionPayload(...) resolves route/surface policy and shell sizing materialization
4. SurfaceSessionController.reconcileSession(...) attaches or updates html/canvas-dom surfaces

There is no theme-change gate before apply. Outputs are applied on every commit.

## Preset Ingestion Contract

- startup source is only document.documentElement --dyni-theme-preset
- preset is read once at startup and stored in runtime-owned state
- no live reread loop exists
- no public imperative preset mutation API exists

## Surface Policy and Bridge Ownership

Runtime resolves one normalized surface policy object per routed update.

Policy includes:

- pageId
- containerOrientation (from props.mode)
- interaction.mode (dispatch or passive)
- normalized callbacks under surfacePolicy.actions
- host facts for rendering/sizing (for example viewport height)

Renderers do not probe host React/DOM internals directly. Host coupling stays in TemporaryHostActionBridge.

## Related

- component-system.md
- cluster-widget-system.md
- html-renderer-lifecycle.md
- vertical-container-contract.md
- surface-session-controller.md
- host-commit-controller.md
- ../shared/theme-tokens.md
