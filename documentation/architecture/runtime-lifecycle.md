# Runtime Lifecycle

**Status:** ✅ Implemented | Bootstrap/init/render lifecycle across runtime, theme, and host-action bridges

## Overview

This page documents the live runtime lifecycle after the `renderHtml` host-path refactor. It covers bootstrap order, `runInit()` idempotence, deferred commit/session flow, theme preset resolution, and current runtime trade-offs.

## Key Details

- Bootstrap owner: `plugin.js`
  - Defines canonical `runtime.loadScriptOnce(id, src)` first.
  - Loads 27 internal scripts in fixed order (`runtime/*`, `config/*`, then controllers/init).
- Init call sites:
  - `runtime/init.js` self-invokes `runInit()`.
  - `plugin.js` calls `window.DyniPlugin.runtime.runInit()` again after the internal chain resolves.
  - Guard contract: `state.initStarted` + `state.initPromise` prevent duplicate initialization work.
- Runtime init order (`runtime/init.js`):
  - verifies `avnav.api`
  - creates singleton `state.hostActionBridge` (`TemporaryHostActionBridge`)
  - builds `Helpers` and component loader
  - loads all components required by `widgetDefinitions` plus `ThemePresets`
  - registers widgets via `runtime.registerWidget(...)`
  - caches `ThemeResolver` module reference
  - builds theme preset API and applies selected preset to mounted `.widget.dyniplugin` roots
- Cluster render path (`ClusterWidget`):
  - `translateFunction()` maps cluster props via `ClusterMapperRegistry`
  - `renderHtml()` increments host render revision (`HostCommitController.recordRender`)
  - `ClusterRendererRouter.renderHtml()` returns shell markup with `data-dyni-instance`
  - `HostCommitController.scheduleCommit()` resolves mounted shell/root asynchronously
  - `onCommit` callback builds session payload and reconciles via `SurfaceSessionController.reconcileSession(...)`
- Theme preset selection:
  - init-time preset source precedence:
    - `readThemePresetFromSettingsApi()` stub
    - `window.DyniPlugin.theme`
    - root-level `--dyni-theme-preset`
    - CSS scan fallback (`.widget.dyniplugin` roots, then `documentElement`, then `body`)
    - built-in `default`
  - render-time `ThemeResolver` preset precedence:
    - `data-dyni-theme`
    - root-level `--dyni-theme-preset`
    - built-in `default`
  - token precedence per key:
    - CSS token override -> preset token -> built-in resolver default
- Host-action bridge lifecycle:
  - Created once during init, accessed through `Helpers.getHostActions()`.
  - Capability snapshot cache key is `pageId + routePointsRelayPresence`.
  - Cache auto-refreshes when page identity or route-points relay availability changes.
  - `map/routeEditor/ais` dispatch stays page-sensitive via live DOM + React fiber handler lookup.
- Host commit fallback lifecycle (`HostCommitController`):
  - readiness probes: `raf-1` -> `raf-2` -> `raf-3` -> `raf-4`
  - fallback: `MutationObserver(document.body, { childList: true, subtree: true })`
  - observer ceiling: 2000ms, then final probe/abandon path
  - no-observer fallback: zero-delay timeout probe
  - stale-revision guard abandons outdated scheduled commits and clears pending state

## API/Interfaces

| Owner | API | Contract |
|---|---|---|
| `runtime/init.js` | `runtime.runInit()` | Idempotent startup boundary returning `state.initPromise` |
| `runtime/init.js` | `runtime.applyThemePresetToContainer(rootEl, preset?)` | Applies normalized preset to one plugin root and invalidates theme cache |
| `runtime/init.js` | `runtime.applyThemePresetToRegisteredWidgets(preset?)` | Applies preset across mounted plugin roots |
| `runtime/HostCommitController.js` | `createHostCommitController(options?)` | Deferred shell/root commit scheduler with stale guards and bounded observer fallback |
| `runtime/SurfaceSessionController.js` | `createSurfaceSessionController({ createSurfaceController })` | Per-instance surface state machine (`html`/`canvas-dom`) |
| `runtime/TemporaryHostActionBridge.js` | `createTemporaryHostActionBridge()` | Page-sensitive host action facade + capability snapshots |

## Remaining Trade-offs

- `runInit()` is intentionally called from two places; init guard keeps behavior correct, but bootstrap does one extra method call.
- `HostCommitController` fallback observer still scopes to `document.body` because no stable per-instance ancestor is guaranteed pre-commit.
- `TemporaryHostActionBridge` still performs live page-handler discovery for dispatch paths, favoring correctness across page transitions over aggressive caching.
- HTML lifecycle still computes renderer handler/signature state during shell render and attach/update phases; this is tracked as runtime cost debt.

## Related

- [component-system.md](component-system.md)
- [cluster-widget-system.md](cluster-widget-system.md)
- [host-commit-controller.md](host-commit-controller.md)
- [surface-session-controller.md](surface-session-controller.md)
- [html-renderer-lifecycle.md](html-renderer-lifecycle.md)
- [canvas-dom-surface-adapter.md](canvas-dom-surface-adapter.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
- [../shared/helpers.md](../shared/helpers.md)
