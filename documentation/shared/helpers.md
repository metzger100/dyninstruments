# Helpers Object

**Status:** ✅ Implemented | Defined in `runtime/helpers.js`, passed to module `create()` calls by `runtime/init.js`

## Overview

`Helpers` is passed as second argument to `module.create(def, Helpers)`. It provides canvas setup, theming, formatter application, and module access.

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

Resolves foreground color with priority:

1. `--dyni-fg`
2. `--instrument-fg`
3. `--mainfg`
4. `getComputedStyle(canvas).color` or `#000`

Caching behavior:

- typography values are cached in a per-canvas `WeakMap` entry (`textColor`, `fontFamily`, `nightMode`)
- each call compares cached `nightMode` to current root `.nightMode` class state
- unchanged mode returns cached value without a new `getComputedStyle()` call
- changed mode recomputes from CSS and refreshes cache entry

### resolveFontFamily

Reads `--dyni-font` and falls back to default stack (`Inter`, system fonts, emoji fonts).

`resolveFontFamily()` shares the same per-canvas typography cache as `resolveTextColor()`, so one style read can serve both values while day/night mode state is unchanged.

### applyFormatter

Applies formatter to raw value:

1. Reads `props.formatterParameters`
2. Normalizes parameters:
   - array -> used as-is
   - string -> split by comma
   - otherwise -> `[]`
3. Dispatch order:
   - `props.formatter` function -> call directly
   - `props.formatter` string -> resolve and call `avnav.api.formatter[name]` when present
4. Formatter exceptions are intentionally caught; processing continues with fallback
5. Fallback behavior:
   - if `raw == null` or `Number.isNaN(raw)`:
     - return `props.default` when `default` key is explicitly present (including `""`, `0`, `false`)
     - otherwise return `"---"`
   - otherwise -> `String(raw)`

### getModule

Accesses loaded modules by `config.components` ID.

```javascript
const gaugeUtilsModule = Helpers.getModule("GaugeToolkit");
const gaugeUtils = gaugeUtilsModule && gaugeUtilsModule.create(def, Helpers);
```

## Internal Helper Not in `Helpers`

`defaultsFromEditableParams(editableParams)` (from `runtime/editable-defaults.js`) is used in `runtime/widget-registrar.js` and is not exposed to module code.

## Related

- [css-theming.md](css-theming.md)
- [../avnav-api/formatters.md](../avnav-api/formatters.md)
- [../architecture/component-system.md](../architecture/component-system.md)
