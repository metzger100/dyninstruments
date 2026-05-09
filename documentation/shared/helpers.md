# Component Context

**Status:** ✅ Implemented | Defined by runtime services and passed through `componentContext`

## Overview

`componentContext` is passed as the second argument to component `create(def, componentContext)`.
It is the explicit boundary between runtime-owned services and component code.

Current context surfaces include:

- `componentContext.components.require(name)`
- `componentContext.canvas.setupCanvas()`
- `componentContext.format.applyFormatter(...)`
- `componentContext.dom.requirePluginRoot(...)`
- `componentContext.theme.tokens.resolveForRoot(rootEl)`
- `componentContext.dom.getNightModeState(rootEl)`
- `componentContext.hostActions`

Legacy helper theme fallbacks (resolveTextColor, resolveFontFamily, resolveWidgetRoot) are not part of the production contract.

## API Reference

### componentContext.canvas.setupCanvas

Prepares a HiDPI-safe canvas and returns drawing context plus CSS-pixel dimensions.

Returns object with:

- ctx
- W
- H

### componentContext.dom.requirePluginRoot

Strict committed-root discovery helper for theme consumers.

Accepts:

- element
- ShadowRoot
- event target / event-like object
- canvas element
- node inside committed shadow content

Behavior:

- walks composed tree and crosses ShadowRoot host boundaries
- returns nearest committed .widget.dyniplugin root
- throws if no committed plugin root exists

### componentContext.dom.getNightModeState(rootEl)

Returns true when the committed plugin root is inside a `.nightMode` ancestor.

Canonical check:

- !!rootEl.closest('.nightMode')

No canonical fallback to documentElement/body.

### componentContext.format.applyFormatter

Centralized formatter dispatch boundary.

- preserves explicit falsy defaults via property-presence checks
- applies function formatter or avnav.api formatter by name
- catches formatter exceptions at this external boundary
- falls back to String(raw) when formatter dispatch is unavailable/fails

### componentContext.hostActions

Returns the runtime-owned host action facade created by TemporaryHostActionBridge.

Bridge facade includes:

- getCapabilities()
- routePoints.activate({ index, pointSnapshot })
- routeEditor.openActiveRoute()
- routeEditor.openEditRoute()
- map.checkAutoZoom()
- ais.showInfo(mmsi)

Renderers should consume normalized callbacks through runtime surface policy.

### componentContext.components.require

Returns the already-created declared dependency instance for the current component, loaded by `runtime.componentLoader` from the matching `config.components` ID.

## Theme Consumer Pattern

Theme consumers use the resolved theme snapshot on the component context:

1. rootEl = componentContext.dom.requirePluginRoot(target)
2. theme = componentContext.theme.tokens.resolveForRoot(rootEl)

## Related

- theme-tokens.md
- css-theming.md
- ../architecture/runtime-lifecycle.md
