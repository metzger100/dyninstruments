# Implementation Plan — HTML Renderer Support and ActiveRoute Hybrid Migration

**Status:** ⏳ In Progress | Session-safe roadmap for future pure `renderHtml` widgets and the ActiveRoute hybrid shell

## Overview

This plan prepares dyninstruments for two HTML-backed widget shapes: pure `renderHtml` widgets with DOM-owned controls and hybrid widgets that use an HTML shell plus nested Canvas 2D visuals. `ActiveRouteTextWidget` is the first planned hybrid consumer, not the definition of all future HTML rendering.

## Key Details

- Rule 3 remains unchanged:
  - passive visual widget -> `renderCanvas(canvas, props)`
  - interaction-heavy widget with dedicated DOM controls -> `renderHtml(props)` only
  - graphics-heavy interactive widget without button-like DOM controls -> `renderHtml(props)` + child `<canvas>`
- Pure `renderHtml` widgets are already a first-class path. They keep the current `renderHtml` + `this.eventHandler` + deferred root-sync behavior.
- The only new runtime contract in this plan is an optional hybrid hook:
  - `afterHtmlRender(mountEl, props)`
- Hybrid-only mount state must stay registrar-owned:
  - stable per-widget mount id
  - monotonic per-render sequence number
  - queued post-sync callback bound to the specific render result
- `runtime/widget-registrar.js` remains the single owner of:
  - `hostActions` injection
  - HTML sync scheduling
  - hybrid mount-id generation
  - hybrid render-sequence tracking
  - hybrid mounted-shell lookup
- `runtime/init.js` remains the owner of runtime root sync, theme application, cache invalidation, and queued post-sync task flush.
- `ClusterWidget`, `ClusterRendererRouter`, and `RendererPropsWidget` must forward optional HTML lifecycle hooks the same way they already forward render/init/finalize behavior.
- No widget-local polling, retry timers, or query-by-global-selector shell lookup is allowed.
- ActiveRoute visuals stay canvas-owned through a shared nav renderer; future pure HTML widgets stay DOM-owned.
- Each numbered step below is one session bundle and must end with `npm run check:all`.

## Scope

**In scope:**

- preserve and document the pure `renderHtml` widget path
- add a reusable hybrid-shell contract for graphics-heavy interactive widgets
- migrate `ActiveRouteTextWidget` to that hybrid contract
- extract ActiveRoute canvas visuals into a shared nav renderer
- update runtime, router, tests, and docs in lockstep

**Out of scope:**

- forcing pure `renderHtml` widgets into the hybrid shell pattern
- rewriting passive visuals into HTML/CSS
- new host-action APIs beyond the current bridge facade
- speculative migration of unrelated widgets before a concrete use case exists

## API/Interfaces

### Renderer Choice Guide

| Widget shape | Required path | Notes |
|---|---|---|
| Passive visual display | `renderCanvas(canvas, props)` | Default dyninstruments path |
| Interaction-heavy widget with dedicated DOM controls | `renderHtml(props)` | Use DOM-native layout and `this.eventHandler`; no nested canvas |
| Graphics-heavy interactive widget without button-like DOM controls | `renderHtml(props)` + `afterHtmlRender(mountEl, props)` | Hybrid shell owns interaction; child canvas owns visuals |

### Pure `renderHtml` Contract

| Interface | Owner | Purpose |
|---|---|---|
| `renderHtml(props)` | pure HTML renderer | Returns inner markup only |
| `initFunction(...)` | optional renderer hook | Setup timers/listeners/state |
| `finalizeFunction(...)` | optional renderer hook | Cleanup timers/listeners/state |

Rules:

- use `this.eventHandler` for string-mode event handlers or manual propagation blocking for React/HTM output
- runtime continues to call `schedulePluginContainerSync()` after `renderHtml(...)` returns
- no mount id, no render sequence, and no `afterHtmlRender(...)` are required
- do not assume `[data-dyni]` or preset-applied root styling already exists during the first `renderHtml(...)` call

### Hybrid Contract

| Interface | Owner | Purpose |
|---|---|---|
| `renderHtml(props)` | hybrid renderer | Returns shell markup plus nested `<canvas>` |
| `afterHtmlRender(mountEl, props)` | hybrid renderer | Resolves nested canvas from `mountEl` and paints after root sync/theme application |
| `finalizeFunction(...)` | hybrid renderer | Clears DOM refs and invalidates pending hybrid state if needed |
| extracted canvas renderer API | shared module | Reuses canvas visuals without a second implementation |

Rules:

- `afterHtmlRender(...)` is optional and hybrid-only
- if a renderer does not expose `afterHtmlRender(...)`, runtime behavior stays on the pure HTML path
- if `renderCanvas(...)` remains exported during migration, it must be a thin delegation to the same shared visual renderer

### Runtime Contract Additions

| API / state | File | Purpose |
|---|---|---|
| `schedulePluginContainerSync(task?)` | `runtime/init.js` | Existing HTML sync API; optional post-sync task is used only by hybrid renderers |
| `state.pluginContainerSyncTasks` | `runtime/init.js` | Pending post-sync hybrid callbacks |
| `ctx.htmlMount = { mountId, renderSeq }` | widget context | Hybrid-only widget-facing mount state that may be serialized into shell markup |
| `ctx.__dyniHtmlMountId` / `ctx.__dyniHtmlRenderSeq` | widget context | Internal registrar-owned hybrid state |

### Hybrid Shell Markup Contract

Hybrid `renderHtml(props)` must emit shell markup like:

```html
<div
  class="dyni-active-route-shell"
  data-dyni-html-mount="..."
  data-dyni-html-render="...">
  <canvas class="dyni-active-route-canvas"></canvas>
</div>
```

Rules:

- `data-dyni-html-mount` must match `this.htmlMount.mountId`
- `data-dyni-html-render` must match `this.htmlMount.renderSeq`
- the nested canvas is the only visual drawing surface
- interaction handlers live on the shell, not on a fake HTML recreation of the visual layout

### Fail-Closed Rules

- root sync and theme application always run before any queued post-sync task
- `runtime/init.js` must copy the queued task list and clear the queue before invoking tasks
- each queued task must be isolated so one thrown error does not block later tasks
- missing mount, stale render sequence, or missing nested canvas is a no-op, not a retry loop
- task isolation must still surface failure context through logging or another explicit diagnostic path
- plain HTML widgets must remain functional when no post-sync task is provided

## Detailed Runtime Sequences

### Pure HTML-Only Sequence

1. `runtime/widget-registrar.js` wraps `renderHtml(...)`.
2. The wrapper injects `this.hostActions`.
3. The renderer returns inner HTML markup.
4. The registrar calls `runtime.schedulePluginContainerSync()` with no task.
5. `runtime/init.js` rescans plugin roots, applies `[data-dyni]`, applies the theme preset, and invalidates theme-resolver caches as needed.
6. No hybrid mount state and no post-sync paint callback are involved.

### Hybrid Sequence

1. `runtime/widget-registrar.js` wraps `renderHtml(...)`.
2. Before calling the renderer, the wrapper:
   - injects `this.hostActions`
   - assigns hybrid mount state if absent
   - increments the hybrid render sequence
   - exposes `this.htmlMount = { mountId, renderSeq }`
3. The hybrid renderer returns shell markup containing the mount attributes and nested canvas.
4. The registrar schedules `runtime.schedulePluginContainerSync(task)` with a post-sync callback captured for that widget instance and render sequence.
5. `runtime/init.js` rescans plugin roots, applies `[data-dyni]`, applies theme preset, invalidates caches, and only then flushes queued post-sync tasks.
6. The callback verifies that `ctx.__dyniHtmlRenderSeq` still matches the captured sequence.
7. The callback resolves `mountEl` via registrar-owned shell lookup and then resolves the nested canvas from that mount only.
8. If the sequence is stale or the shell is gone, the callback exits without drawing.
9. If the mount matches, `afterHtmlRender(mountEl, props)` paints via the shared canvas renderer.

## Implementation Steps

### Session Rule

- each numbered step below is one session-safe bundle
- do not start the next step until the current step ends with `npm run check:all`
- every step must leave the repo green and mergeable
- if a step changes runtime or widget behavior, update the relevant docs in that same step

### Step 1 — Pure HTML Baseline Lock Bundle

**Files:**

- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/architecture/cluster-widget-system.md`
- `tests/runtime/widget-registrar.test.js`
- `tests/runtime/init-root-ownership.test.js`

Changes:

- lock the current pure `renderHtml` contract as first-class behavior
- make the docs explicitly state that pure HTML renderers remain supported and do not need hybrid mount state
- add non-regression tests for:
  - `hostActions` injection on HTML renderers
  - deferred root sync after `renderHtml(...)`
  - plain HTML behavior when no hybrid post-sync task exists

Completion criteria:

- no runtime behavior changes yet
- pure HTML docs and tests are explicit enough to protect future refactors
- `npm run check:all`

### Step 2 — HTML Sync Queue Bundle

**Files:**

- `runtime/init.js`
- `documentation/avnav-api/plugin-lifecycle.md`
- `tests/runtime/init-root-ownership.test.js`

Changes:

- extend `schedulePluginContainerSync(task?)` to queue optional post-sync callbacks
- keep the no-argument pure HTML call path unchanged
- copy the queued callback list and clear the queue before invoking tasks
- keep root marking, theme application, and cache invalidation ahead of task execution
- isolate each queued task so one thrown error does not block later tasks

Completion criteria:

- pure HTML behavior is unchanged
- runtime exposes a usable post-sync queue for hybrid renderers
- `npm run check:all`

### Step 3 — Hybrid Registrar and Router Contract Bundle

**Files:**

- `runtime/widget-registrar.js`
- `cluster/ClusterWidget.js`
- `cluster/rendering/ClusterRendererRouter.js`
- `cluster/rendering/RendererPropsWidget.js`
- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/architecture/cluster-widget-system.md`
- `tests/runtime/widget-registrar.test.js`
- `tests/cluster/ClusterWidget.test.js`
- `tests/cluster/rendering/ClusterRendererRouter.test.js`
- `tests/cluster/rendering/RendererPropsWidget.test.js`

Changes:

- make `runtime/widget-registrar.js` the only owner of hybrid mount-id generation, render-sequence tracking, widget-facing `this.htmlMount`, and mounted-shell lookup
- expose hybrid mount state only when a renderer implements `afterHtmlRender(...)`
- schedule hybrid post-sync callbacks through `schedulePluginContainerSync(task?)`
- delegate optional `afterHtmlRender(...)` through `ClusterWidget`, `ClusterRendererRouter`, and `RendererPropsWidget`
- keep pure HTML renderers without `afterHtmlRender(...)` on the unchanged baseline path

Completion criteria:

- no shipped widget uses `afterHtmlRender(...)` yet
- hybrid contract plumbing is live without changing pure HTML behavior
- `npm run check:all`

### Step 4 — Shared ActiveRoute Canvas Extraction Bundle

**Files:**

- `shared/widget-kits/nav/ActiveRouteCanvasRenderer.js` (new)
- `config/components.js`
- `documentation/widgets/active-route.md`
- `tests/config/components.test.js`
- `tests/shared/nav/ActiveRouteCanvasRenderer.test.js` (new)
- `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js`
- `tests/widgets/text/ActiveRouteTextWidget.test.js`

Changes:

- move the current `ActiveRouteTextWidget.renderCanvas(...)` visual logic into `ActiveRouteCanvasRenderer`
- keep current visual owners unchanged:
  - `ThemeResolver`
  - `TextLayoutEngine`
  - `RadialTextLayout`
  - `TextTileLayout`
  - `ActiveRouteLayout`
- keep `ActiveRouteTextWidget` behavior unchanged by delegating its existing canvas path to the new shared renderer
- move canvas-visual assertions into the shared renderer tests

Completion criteria:

- ActiveRoute still renders exactly through the current canvas path
- the shared canvas renderer is ready for hybrid reuse
- `npm run check:all`

### Step 5 — Hybrid ActiveRoute Bundle

**Files:**

- `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js`
- `plugin.css`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/widgets/active-route.md`
- `tests/widgets/text/ActiveRouteTextWidget.test.js`

Changes:

- add hybrid `renderHtml(props)` that returns shell markup and nested canvas only
- serialize only `this.htmlMount.mountId` and `this.htmlMount.renderSeq` into shell markup
- add `afterHtmlRender(mountEl, props)` that:
  - accepts `mountEl` from the runtime contract
  - resolves the nested canvas from that mount only
  - calls `ActiveRouteCanvasRenderer`
- register `this.eventHandler.openActiveRoute` only for supported dispatch capability and `editing !== true`
- omit click handlers for passive, unsupported, and edit mode
- keep all layout, fit, accent, and disconnect visuals in the shared canvas renderer

Rules:

- no widget-local mount-id generation
- no widget-local shell selector construction
- no widget-local retry timers
- no second visual implementation beside the shared canvas renderer

Completion criteria:

- hybrid ActiveRoute behavior is live
- shell markup, click ownership, and post-sync canvas repaint tests pass
- `npm run check:all`

### Step 6 — Final Audit Bundle

**Files:**

- `documentation/avnav-api/plugin-lifecycle.md`
- `documentation/avnav-api/interactive-widgets.md`
- `documentation/architecture/cluster-widget-system.md`
- `documentation/widgets/active-route.md`
- `documentation/core-principles.md` (only if wording still drifts)

Updates:

- verify the per-step doc updates stayed aligned
- verify docs still describe pure HTML widgets as first-class and the hybrid shell as an optional exception
- document any remaining wording drift or follow-up debt

Completion criteria:

- documentation matches shipped runtime and widget behavior
- the repo guidance is safe for future pure HTML and hybrid widget work
- `npm run check:all`

## Files Expected To Change

| File | Planned change |
|---|---|
| `runtime/init.js` | optional post-sync task queue for hybrid HTML renders |
| `runtime/widget-registrar.js` | hybrid mount-id/render-sequence assignment and `afterHtmlRender(...)` scheduling |
| `cluster/ClusterWidget.js` | re-export optional `afterHtmlRender(...)` |
| `cluster/rendering/ClusterRendererRouter.js` | delegate optional `afterHtmlRender(...)` |
| `cluster/rendering/RendererPropsWidget.js` | forward merged-prop `afterHtmlRender(...)` |
| `config/components.js` | register `ActiveRouteCanvasRenderer` dependency |
| `shared/widget-kits/nav/ActiveRouteCanvasRenderer.js` | new extracted canvas visual renderer |
| `widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js` | shared-canvas delegation, then hybrid shell/orchestrator rewrite |
| `plugin.css` | hybrid-shell classes only |

## Validation

- run `npm run check:all`
- keep all existing pure HTML, `nav` cluster, and host-action bridge tests green
- add explicit hybrid non-regression coverage before shipping Step 5
- verify no new documentation reachability or format errors

## Related

- [avnav-api/plugin-lifecycle.md](avnav-api/plugin-lifecycle.md)
- [avnav-api/interactive-widgets.md](avnav-api/interactive-widgets.md)
- [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- [widgets/active-route.md](widgets/active-route.md)
- [core-principles.md](core-principles.md)