# Helpers Object

**Status:** ✅ Implemented | Defined in plugin.js, passed to all module create() calls

## Overview

Helpers is a shared utility object passed as second argument to `module.create(def, Helpers)`. Provides canvas setup, theming, formatter application, and module access.

## API Reference

### setupCanvas(canvas)

Prepares a HiDPI-safe canvas. Maps drawing coordinates to CSS pixels.

```javascript
const { ctx, W, H } = Helpers.setupCanvas(canvas);
// ctx = CanvasRenderingContext2D (scaled for devicePixelRatio)
// W   = CSS width in pixels (drawing coordinates)
// H   = CSS height in pixels (drawing coordinates)
```

**Implementation:**
- Reads `canvas.getBoundingClientRect()` for CSS size
- Sets `canvas.width/height` to CSS size × `devicePixelRatio`
- Applies `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so drawing uses CSS pixels
- Returns `{ ctx, W, H }` where W/H are CSS pixel dimensions

**Usage:** Call at the start of every `renderCanvas()`. All subsequent drawing uses CSS pixel coordinates (not physical pixels).

### resolveTextColor(canvas)

Resolves the foreground color for drawing. Reads CSS custom properties in priority order:

1. `--dyni-fg`
2. `--instrument-fg`
3. `--mainfg`
4. Fallback: `getComputedStyle(canvas).color` or `"#000"`

```javascript
const color = Helpers.resolveTextColor(canvas);
ctx.fillStyle = color;
ctx.strokeStyle = color;
```

Automatically adapts to AvNav's day/night mode via CSS variables.

### resolveFontFamily(el)

Resolves the font stack. Reads `--dyni-font` CSS variable, with a comprehensive fallback stack:

```javascript
const family = Helpers.resolveFontFamily(canvas);
ctx.font = '700 14px ' + family;
```

Default fallback: `"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue",...`

### applyFormatter(raw, props)

Applies a formatter to a raw SignalK value.

```javascript
const displayText = Helpers.applyFormatter(rawValue, props);
```

**Resolution order:**
1. `props.formatter` is a function → call directly with `(raw, ...formatterParameters)`
2. `props.formatter` is a string → look up `avnav.api.formatter[name]` and call
3. Neither → return `String(raw)` or `props.default` if null/NaN

**formatterParameters:** parsed from `props.formatterParameters` (array or comma-separated string).

### getModule(id)

Access other loaded modules by their MODULES registry ID.

```javascript
const IC = Helpers.getModule('InstrumentComponents');
// Returns window.DyniModules.DyniInstrumentComponents (the module object)
// Then call: const ic = IC.create();
```

**Available module IDs:** `InstrumentComponents`, `ThreeElements`, `WindDial`, `CompassGauge`, `SpeedGauge`, `DepthGauge`, `TemperatureGauge`, `VoltageGauge`, `ClusterHost`

## Helper Not in Helpers Object

`defaultsFromEditableParams(editableParams)` — builds default values from typed editableParameters. Used internally by plugin.js during registration, not exposed to modules.

## File Location

Defined in `plugin.js`, lines ~56-130.

## Related

- [css-theming.md](css-theming.md) — CSS variables read by resolveTextColor/resolveFontFamily
- [../avnav-api/formatters.md](../avnav-api/formatters.md) — Available formatters
- [../architecture/module-system.md](../architecture/module-system.md) — How getModule resolves
