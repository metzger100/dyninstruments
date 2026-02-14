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

- reads `canvas.getBoundingClientRect()`
- sets `canvas.width/height` to CSS size × `devicePixelRatio`
- applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`
- returns `{ ctx, W, H }` in CSS pixels

### resolveTextColor

Resolves foreground color with priority:

1. `--dyni-fg`
2. `--instrument-fg`
3. `--mainfg`
4. `getComputedStyle(canvas).color` or `#000`

### resolveFontFamily

Reads `--dyni-font` and falls back to default stack (`Inter`, system fonts, emoji fonts).

### applyFormatter

Applies formatter to raw value:

1. `props.formatter` function -> call directly
2. `props.formatter` string -> resolve `avnav.api.formatter[name]`
3. fallback -> `String(raw)` or `props.default` when null/NaN

`formatterParameters` accepts array or comma-separated string.

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
