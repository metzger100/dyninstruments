# HTML Renderer Lifecycle

**Status:** ✅ Implemented | Commit-driven shadow-root lifecycle for surface html kinds

## Overview

dyninstruments HTML kinds are commit-driven. Pre-commit shell output is inert; semantic rendering begins only after host commit inside HtmlSurfaceController. Route metadata owns the pre-activation shell contract, and committed renderers own post-activation shadow CSS sizing and layout.

## Authoritative Contract

ClusterWidget.renderHtml(...):

- returns inert shell markup only
- includes a stable mount host (.dyni-surface-html-mount)
- contains only stable route/surface metadata and route-owned shell sizing state
- does not carry renderer-spec layout hooks

RouteActivationController is the Phase 4 activation service for the live route-activation path:

- `runtime/cluster/RouteActivationController.js` builds activated route payloads on demand
- it preloads and caches per-renderer shadow CSS for the live activation path
- it resolves renderer identity from `config.clusterRoutes.byRouteId`

HtmlSurfaceController.createSurfaceController(...) owns committed lifecycle:

- attach(payload)
- update(payload)
- detach(reason)
- destroy()

Committed renderer instances implement:

- mount(mountEl, payload)
- update(payload)
- postPatch(payload)
- detach(reason)
- destroy()
- optional layoutSignature(payload)
- there is no renderer-spec vertical-sizing contract

## shellRect Contract

shellRect remains authoritative for committed HTML layout and fit.

- measured from .dyni-surface-html-mount
- provided to committed renderers in payload.shellRect
- used for geometry-driven fit/layout

There is no triggerResize() contract.

## Committed Surface Box Contract

HtmlSurfaceController owns a base shadow-root stylesheet that is injected once per shadow root.

- style marker: `style[data-dyni-shadow-base="html-surface-box-contract"]`
- contract targets: `:host` and `.dyni-html-root`
- base semantics: `display:block`, `width:100%`, `height:100%`, `min-width:0`, `min-height:0`, `box-sizing:border-box`

This keeps the measured mount-host `shellRect` and committed subtree sizing aligned for all HTML kinds.

## Layout and Relayout

- layoutSignature(payload) indicates layout-relevant input changes
- update(payload) patches DOM in place
- postPatch(payload) may request one bounded internal relayout pass
- unbounded rerender loops are not part of the contract
- no ResizeObserver-driven relayout loop is part of this contract

## Prepared Payload Reuse

`shared/widget-kits/html/PreparedPayloadModelCache.js` provides committed-renderer-local semantic model reuse.

- cache key fields: payload `revision`, `props` identity, `shellRect.width`, `shellRect.height`
- intended use: reuse model work across `layoutSignature(payload)` and `patch/update` in the same lifecycle phase
- renderer must clear prepared payload cache on `detach` and `destroy`

## DOM Patch Utility Contract

`HtmlWidgetUtils.patchInnerHtml(rootEl, markup)` is the shared committed DOM patch boundary.

- stores last patched markup in non-enumerable `__dyniLastPatchedMarkup`
- identical markup is a no-op and preserves root identity
- jsdom path uses direct `innerHTML` assignment for deterministic tests
- browser/non-jsdom path keeps structural in-place sync semantics

## Interaction Ownership

dyninstruments HTML surfaces do not rely on AvNav UserHtml event translation.

- no namedHandlers() contract
- no onclick="handlerName" wiring contract
- no global catchAll dependency for dyninstruments HTML surfaces

Committed renderers attach and remove direct DOM listeners under dispatch/passive runtime policy.

## Interactive State Persistence Across Remounts

Committed HTML renderers can be detached and remounted during surface/session switching. The `detach()` -> `mount()` cycle recreates renderer instances and destroys in-memory instance state.

For interactive widgets with user-driven state (running timers, toggles, form input), preserve state explicitly across remount cycles.

Pattern 1: `hostContext` snapshot (same surface session)

- `rendererContext.hostContext` survives detach/remount in the same surface session.
- Persist a minimal snapshot into `hostContext[SESSION_KEY]` during `detach`.
- Read and restore from `hostContext[SESSION_KEY]` during `mount`.

Pattern 2: module-level session registry (cross-session continuity)

- Keep a module-level registry (`Object.create(null)`) keyed by stable identity.
- Recommended identity parts: `routeId + pageId + cluster + kind`.
- Persist only active-state snapshots (for example active countdown phases).
- Clear registry entries when the widget returns to idle/reset state.

Snapshot contract

- Snapshots must be plain serializable objects.
- Store only minimum resume state (timestamps, phase, selected config).
- Do not store DOM nodes, closures, audio nodes, or other runtime handles.

Timer/model integration

- If the model supports resume, expose `getSnapshot()` and accept `snapshot` input in the model factory.
- Validate snapshots during restore (example: discard countdown snapshots whose `endTime` is already in the past).
- Fall back to idle defaults when snapshots are invalid.

Reference implementation

- `shared/widget-kits/vessel/RegattaTimerSessionStore.js`
- `widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js`

## Styling Ownership

- committed HTML styles are shadow-local
- RouteActivationController preloads and caches per-renderer shadow CSS bundles for the live activation path before hydration
- route metadata supplies pre-activation shell sizing; committed renderer shadow CSS owns post-activation sizing behavior
- required outer context (pageId, orientation, interaction mode) is mirrored into shadow-visible attributes/classes

## Related

- cluster-widget-system.md
- runtime-lifecycle.md
- vertical-container-contract.md
- canvas-dom-surface-adapter.md
