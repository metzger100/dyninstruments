# Helpers Object

**Status:** ✅ Implemented | Defined in `runtime/helpers.js`, passed to module `create()` calls by `runtime/init.js`

## Overview

`Helpers` is passed as second argument to `module.create(def, Helpers)`. It provides canvas setup utilities, root-scoped typography/theming, formatter application, host-action access, and module access.

## API Reference

### setupCanvas

Prepares a HiDPI-safe canvas and returns CSS-pixel drawing dimensions.

```javascript
const { ctx, W, H } = Helpers.setupCanvas(canvas);
```

Implementation summary:

- uses a per-canvas `WeakMap` layout cache (`clientWidth`, `clientHeight`, `cssWidth`, `cssHeight`)
- compares current `canvas.clientWidth/clientHeight` with cached values
- cache hit: reuses cached `cssWidth/cssHeight` and skips `getBoundingClientRect()`
- cache miss: reads `canvas.getBoundingClientRect()`, updates cached layout entry, then continues
- computes buffer size each call (`canvas.width/height` = CSS size × `devicePixelRatio`) and updates only when changed
- always applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` on every call
- returns `{ ctx, W, H }` in CSS pixels

### resolveTextColor

Resolves foreground color from the owning widget root with priority:

1. `--dyni-fg`
2. `--instrument-fg`
3. `--mainfg`
4. `getComputedStyle(rootOrCanvas).color` or `#000`

Caching behavior:

- typography values are cached in a per-root `WeakMap` entry (`textColor`, `fontFamily`, `nightMode`)
- canvas inputs are adapted to their owning widget root before cache lookup
- each call compares cached `nightMode` to current root `.nightMode` class state
- unchanged mode returns cached value without a new `getComputedStyle()` call
- changed mode recomputes from CSS and refreshes cache entry

### resolveFontFamily

Reads `--dyni-font` from the owning widget root and falls back to default stack (`Inter`, system fonts, emoji fonts).

`resolveFontFamily()` shares the same per-root typography cache as `resolveTextColor()`, so one style read can serve both values while day/night mode state is unchanged.

### resolveWidgetRoot

Resolves the owning widget root (`.widget` or `.DirectWidget`) for a DOM target.

```javascript
const rootEl = Helpers.resolveWidgetRoot(canvasOrElement);
```

Usage contract:

- Theme callers that start from canvas inputs must resolve root first and call `ThemeResolver.resolveForRoot(rootEl)`.
- This keeps root discovery logic in one runtime owner instead of duplicating `.closest(...)` logic across renderers.

### applyFormatter

Applies formatter to raw value:

1. Reads `props.formatterParameters`
2. If `raw == null` or `Number.isNaN(raw)`:
   - return `props.default` when `default` key is explicitly present (including `""`, `0`, `false`)
   - otherwise return `"---"`
3. Normalizes parameters:
   - array -> used as-is
   - string -> split by comma
   - otherwise -> `[]`
4. Dispatch order:
   - `props.formatter` function -> call directly
   - `props.formatter` string -> resolve and call `avnav.api.formatter[name]` when present
5. Formatter exceptions are intentionally caught; processing continues with raw-string fallback
6. If no formatter is available, or formatter dispatch fails, return `String(raw)`

### getHostActions

Returns the singleton host-action facade owned by `runtime/TemporaryHostActionBridge.js`.

```javascript
const hostActions = Helpers.getHostActions();
const capabilities = hostActions.getCapabilities();
```

Contract summary:

- intended for interactive route/AIS parity work only
- mirrors the widget-facing namespace shape:
  - `hostActions.getCapabilities()`
  - `hostActions.routePoints.activate(index)`
  - `hostActions.routeEditor.openActiveRoute()`
  - `hostActions.routeEditor.openEditRoute()`
  - `hostActions.ais.showInfo(mmsi)`
- `runtime/init.js` owns bridge creation before widget registration; helper/runtime code treats that as an internal contract
- widgets may also read the same facade from `this.hostActions` because `runtime/widget-registrar.js` injects it before lifecycle/render callbacks
- all host DOM / `window.avnav` coupling stays inside the runtime bridge; widget and cluster code must not reach around this helper

### getModule

Accesses loaded modules by `config.components` ID.

```javascript
const gaugeUtilsModule = Helpers.getModule("RadialToolkit");
const gaugeUtils = gaugeUtilsModule && gaugeUtilsModule.create(def, Helpers);
```

## Internal Helper Not in `Helpers`

`defaultsFromEditableParams(editableParams)` (from `runtime/editable-defaults.js`) is used in `runtime/widget-registrar.js` and is not exposed to module code.

## Related

- [css-theming.md](css-theming.md)
- [../avnav-api/formatters.md](../avnav-api/formatters.md)
- [../architecture/component-system.md](../architecture/component-system.md)
