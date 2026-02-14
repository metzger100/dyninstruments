# AvNav Plugin Lifecycle

**Status:** ✅ Reference | Official AvNav API + dyninstruments internals (marked)

## Global Variables

| Variable | Scope | Description |
|---|---|---|
| `AVNAV_BASE_URL` | plugin.js, user.js | URL to plugin directory. Use to load assets/scripts. |
| `AVNAV_PLUGIN_NAME` | plugin.js only | Plugin name string provided by AvNav. |

## Widget Registration

```javascript
avnav.api.registerWidget(definition, editableParameters)
```

### definition Object

| Field | Type | Widget Types | Description |
|---|---|---|---|
| name | string | all | Unique widget name |
| type | string (opt) | all | `"radialGauge"`, `"linearGauge"`, `"map"`; omitted for user widgets |
| storeKeys | object | all | Key-to-store-path map |
| caption | string (opt) | all | Default caption |
| unit | string (opt) | all | Default unit |
| formatter | function (opt) | defaultWidget, radialGauge, linearGauge | Value formatter |
| translateFunction | fn(props) → obj (opt) | all except map | Transform values before rendering |
| renderHtml | fn(props) → string (opt) | userWidget | Returns HTML string |
| renderCanvas | fn(canvas, props) (opt) | userWidget, map | Draws on canvas |
| initFunction | fn(props) (opt) | userWidget, map | Called once when widget is created |
| finalizeFunction | fn() (opt) | userWidget, map | Called before widget is destroyed |

Use `function` keyword (not arrow functions) when `this` binding to WidgetContext is required.

## storeKeys

Maps symbolic names to AvNav internal store paths. AvNav resolves them to live values:

```javascript
storeKeys: {
  speed: "nav.gps.speed",
  depth: "nav.gps.depthBelowTransducer"
}
```

## Widget Context

Available as `this` in `initFunction`, `finalizeFunction`, `renderHtml`, `renderCanvas`.

| Property/Method | Widget Type | Description |
|---|---|---|
| `eventHandler` | userWidget | Register HTML event handlers |
| `triggerRedraw()` | userWidget | Force re-render |
| `triggerRender()` | map | Force map render |
| `lonLatToPixel(lon, lat)` | map | Coordinates → canvas pixels |
| `pixelToLonLat(x, y)` | map | Canvas pixels → coordinates |
| `getScale()` | map | Display scale factor |
| `getRotation()` | map | Map rotation in radians |
| `getContext()` | map | Canvas context during render |
| `getDimensions()` | map | Canvas size |

## Render Cycle (AvNav Standard)

```text
1. AvNav reads store values via storeKeys
2. translateFunction(storeValues) called (if defined)
3. renderCanvas(canvas, mergedProps) or renderHtml(mergedProps) called
```

`mergedProps` includes editable parameter values, store values, and translate output.

---

## dyninstruments Internals (Not Official AvNav API)

### updateFunction

```javascript
updateFunction: function(values) -> object
```

Used when editor values change (for example KEY-driven dynamic store key mapping). In dyninstruments, update functions are composed in `core/register-instrument.js` via `composeUpdates(spec.updateFunction, inst.def.updateFunction)`.

### cluster

Internal cluster ID (for example `"speed"`, `"wind"`) used by ClusterHost dispatch routing.

### wantsHideNativeHead

When `true`, render wrapper in `core/register-instrument.js` adds `data-dyni` to widget root. CSS then hides AvNav native `.widgetHead` and `.valueData`.

### Module create() Pattern

dyninstruments modules expose `create(def, Helpers)`:

```javascript
function create(def, Helpers) {
  function renderCanvas(canvas, props) { /* ... */ }
  return { id: "ModuleName", wantsHideNativeHead: true, renderCanvas };
}
```

### dyninstruments Runtime Registration Flow

```text
1. plugin.js bootstraps internal scripts
2. core/init.js resolves required module IDs from config.instruments
3. core/module-loader.js loads all required modules (with deps)
4. core/register-instrument.js merges module spec + cluster definition
5. avnav.api.registerWidget(definition, editableParameters)
```

### dyninstruments Render Flow

```text
1. User changes editable parameter -> updateFunction(values)
2. AvNav reads store values via storeKeys
3. ClusterHost.translateFunction(mergedProps)
   -> numeric: { value, caption, unit, formatter, formatterParameters }
   -> graphic: { renderer: "SpeedGauge", value, caption, unit, ... }
4. ClusterHost.renderCanvas() delegates via RendererRegistry
```

## Related

- [editable-parameters.md](editable-parameters.md) — parameter types and conditions
- [formatters.md](formatters.md) — formatter registration and built-ins
- [../architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost dispatch
