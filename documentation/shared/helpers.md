# Helpers Object

**Status:** ✅ Implemented | Defined in runtime/helpers.js and passed to component factory modules

## Overview

Helpers is passed as the second argument to component create(def, Helpers).

Current helper API includes:

- setupCanvas
- requirePluginRoot
- getNightModeState
- applyFormatter
- getHostActions
- getModule

Legacy helper theme fallbacks (resolveTextColor, resolveFontFamily, resolveWidgetRoot) are not part of the production contract.

## API Reference

### setupCanvas

Prepares a HiDPI-safe canvas and returns drawing context plus CSS-pixel dimensions.

Returns object with:

- ctx
- W
- H

### requirePluginRoot

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

### getNightModeState

Returns true when the committed plugin root is inside a .nightMode ancestor.

Canonical check:

- !!rootEl.closest('.nightMode')

No canonical fallback to documentElement/body.

### applyFormatter

Centralized formatter dispatch boundary.

- preserves explicit falsy defaults via property-presence checks
- applies function formatter or avnav.api formatter by name
- catches formatter exceptions at this external boundary
- falls back to String(raw) when formatter dispatch is unavailable/fails

### getHostActions

Returns the runtime-owned host action facade created by TemporaryHostActionBridge.

Bridge facade includes:

- getCapabilities()
- routePoints.activate({ index, pointSnapshot })
- routeEditor.openActiveRoute()
- routeEditor.openEditRoute()
- map.checkAutoZoom()
- ais.showInfo(mmsi)

Renderers should consume normalized callbacks through runtime surface policy.

### getModule

Returns loaded module by config.components ID.

## Theme Consumer Pattern

Theme consumers use strict root resolution + ThemeResolver:

1. rootEl = Helpers.requirePluginRoot(target)
2. theme = ThemeResolver.resolveForRoot(rootEl)

## Related

- theme-tokens.md
- css-theming.md
- ../architecture/runtime-lifecycle.md
