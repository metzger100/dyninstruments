# AvNav Plugin Lifecycle

**Status:** ✅ Reference | Covers official AvNav API + dyninstruments extensions (marked separately)

## Global Variables

| Variable | Scope | Description |
|---|---|---|
| `AVNAV_BASE_URL` | plugin.js, user.js | URL to directory the JS file was loaded from. Use to load assets: `AVNAV_BASE_URL + "/myLib.js"`. Reach plugin API: `AVNAV_BASE_URL + "/api"` |
| `AVNAV_PLUGIN_NAME` | plugin.js only | Name of the plugin |

## Widget Registration

```javascript
avnav.api.registerWidget(definition, editableParameters)
```

### definition Object

| Field | Type | Widget Types | Description |
|---|---|---|---|
| name | string | all | Unique widget name |
| type | string (opt) | all | `"radialGauge"`, `"linearGauge"`, `"map"`. Omit → defaultWidget (if no renderHtml/renderCanvas) or userWidget (if render fn provided) |
| storeKeys | object | all | Keys to read from AvNav internal store. Values passed to render functions |
| caption | string (opt) | all | Default caption |
| unit | string (opt) | all | Default unit |
| formatter | function (opt) | defaultWidget, radialGauge, linearGauge | Value formatter. **Required** for defaultWidget |
| translateFunction | fn(props) → obj (opt) | all except map | Called with current store values; returns transformed values before rendering |
| renderHtml | fn(props) → string (opt) | userWidget | Returns HTML string. `this` = WidgetContext |
| renderCanvas | fn(canvas, props) (opt) | userWidget, map | Draws on canvas. `this` = WidgetContext. For map: canvas is an overlay shared by all map widgets (use save/restore) |
| initFunction | fn(props) (opt) | userWidget, map | Called once when widget created. `this` = WidgetContext, 1st param = WidgetContext. Since 20210422: 2nd param = widget properties (incl. editableParameters) |
| finalizeFunction | fn() (opt) | userWidget, map | Called before widget destroyed. `this` = WidgetContext, 1st param = WidgetContext |

**Critical:** All functions must use `function` keyword (not arrow functions) for correct `this` binding to WidgetContext.

## storeKeys

Maps symbolic names to AvNav internal store paths. AvNav resolves them to live values:

```javascript
storeKeys: {
  speed: "nav.gps.speed",                    // → props.speed = current value
  depth: "nav.gps.depthBelowTransducer"      // → props.depth = current value
}
```

**Store path convention:** All keys starting with `gps.` in the AvNav server store are automatically forwarded to the WebApp as `nav.gps.*`. Plugin-registered keys appear under their registered path.

## Widget Context

Created per widget instance. Available as `this` in initFunction, finalizeFunction, renderHtml, renderCanvas. User data can be stored on the context object between calls.

| Property/Method | Widget Type | Description |
|---|---|---|
| `eventHandler` | userWidget | Object (not function). Register HTML event handlers: `this.eventHandler.myHandler = function(ev){...}`. Use in renderHtml: `<button onclick="myHandler">` (handler name only, not JS code) |
| `triggerRedraw()` | userWidget | Force re-render (e.g. after async data fetch) |
| `triggerRender()` | map | Same as triggerRedraw for map widgets |
| `lonLatToPixel(lon, lat)` | map | Coordinates → canvas pixels `[x, y]` |
| `pixelToLonLat(x, y)` | map | Canvas pixels → coordinates `[lon, lat]` |
| `getScale()` | map | Display scale factor (>1 for HiDPI) |
| `getRotation()` | map | Map rotation in radians |
| `getContext()` | map | Canvas renderingContext2D (only during renderCanvas) |
| `getDimensions()` | map | Canvas size `[width, height]` |

## Render Cycle (AvNav Standard)

```
1. AvNav reads store values per storeKeys
2. translateFunction(storeValues) called (if defined)
   → Returns transformed values
3. renderCanvas(canvas, mergedProps) or renderHtml(mergedProps) called
   → Props = editableParameter values + store values + translateFunction output
   → renderHtml returns HTML string; renderCanvas draws on canvas
   → Functions re-called whenever store values change
```

---

## dyninstruments Extensions (Not Part of AvNav API)

### updateFunction (dyninstruments-internal)

```javascript
updateFunction: function(values) → object
```

Called when editor values change. Can dynamically modify `storeKeys` (e.g. for KEY-type parameters). Composed with module's updateFunction via `composeUpdates()` in plugin.js.

### cluster (dyninstruments-internal)

Internal cluster ID string (e.g. `"speed"`, `"wind"`). Used by ClusterHost for dispatch routing. Not an AvNav concept.

### wantsHideNativeHead (dyninstruments-internal)

When `true`, plugin.js sets `data-dyni` attribute on widget root → CSS hides AvNav's native `.widgetHead` and `.valueData` → plugin takes full rendering control.

### Module create() Pattern (dyninstruments-internal)

dyninstruments wraps AvNav widgets in a UMD module system. Each module exports `create(def, Helpers)`:

```javascript
function create(def, Helpers) {
  function renderCanvas(canvas, props) { /* ... */ }
  return { id: "ModuleName", wantsHideNativeHead: true, renderCanvas };
}
```

plugin.js calls `registerInstrument()` which merges the module output with the cluster definition and calls `avnav.api.registerWidget()`.

### dyninstruments Render Cycle

```
1. User changes editableParameter → updateFunction(values) — can modify storeKeys
2. AvNav reads store values via storeKeys
3. ClusterHost.translateFunction(mergedProps):
   → Checks props.cluster + props.kind
   → Graphic kinds: { renderer: "SpeedGauge", value, caption, unit, ... }
   → Numeric kinds: { value, caption, unit, formatter, formatterParameters }
4. ClusterHost.renderCanvas → pickRenderer(props) → delegates to sub-renderer
```

## Related

- [editable-parameters.md](editable-parameters.md) — Parameter types and conditions
- [formatters.md](formatters.md) — Formatter registration and built-in formatters
- [../architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost dispatch
