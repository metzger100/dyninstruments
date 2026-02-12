# AvNav Plugin Lifecycle

**Status:** ✅ Reference document | External API, not controlled by this project

## Overview

AvNav plugins register widgets via `avnav.api.registerWidget()`. The plugin JS is loaded via `<script>` tag; `AVNAV_BASE_URL` is a global string set by AvNav.

## Widget Registration

```javascript
avnav.api.registerWidget(definition, editableParameters)
```

### definition Object

| Field | Type | Description |
|---|---|---|
| name | string | Unique widget name (e.g. `"dyninstruments_Speed"`) |
| description | string | Display text in AvNav widget picker |
| caption | string | Default caption (empty string if per-kind) |
| unit | string | Default unit (empty string if per-kind) |
| default | string | Fallback display value (e.g. `"---"`) |
| storeKeys | object | SignalK path mapping `{ key: "nav.gps.speed" }` |
| className | string | CSS classes for the widget container |
| renderCanvas | fn(canvas, props) | Canvas rendering callback |
| renderHtml | fn(element, props) | HTML rendering callback (alternative to canvas) |
| initFunction | fn(element) | Called once when widget is created |
| finalizeFunction | fn(element) | Called when widget is removed |
| translateFunction | fn(props) → object | Transform props before renderCanvas |
| updateFunction | fn(values) → object | Transform editor values; can modify storeKeys |
| cluster | string | Internal cluster ID (used by ClusterHost dispatch) |

### wantsHideNativeHead

When a module returns `wantsHideNativeHead: true`, the registration wrapper in plugin.js sets `data-dyni` attribute on the widget root. CSS then hides AvNav's native `.widgetHead` and `.valueData` elements, giving the plugin full control over rendering.

## Render Cycle

```
1. User changes editableParameter in AvNav editor
   → updateFunction(editorValues) called
   → Can modify storeKeys dynamically (e.g. KEY type → custom SignalK path)
   → Returns modified values object

2. AvNav reads SignalK values via storeKeys
   → Each key maps to a SignalK path
   → Values appear in props as { keyName: signalKValue }

3. translateFunction(mergedProps) called
   → Receives ALL: editableParameter values + storeKey values + definition defaults
   → Returns transformed props (e.g. picks renderer, sets formatter, resolves per-kind caption/unit)
   → For graphic kinds: sets { renderer: "SpeedGauge", value: ..., caption: ..., ... }
   → For numeric kinds: sets { value, caption, unit, formatter, formatterParameters }

4. renderCanvas(canvas, translatedProps) called
   → Draws on canvas using Canvas 2D API
   → Props contain everything from step 3 merged with original props
```

## Props in renderCanvas

The `props` object contains ALL merged values:

- **editableParameter values:** `kind`, `minValue`, `maxValue`, `warningFrom`, `leadingZero`, etc.
- **storeKey values:** `value`, `speed`, `awa`, `twa`, `depth`, etc. (as named in storeKeys)
- **translateFunction outputs:** `caption`, `unit`, `formatter`, `formatterParameters`, `renderer`
- **Definition defaults:** `className`, `default`, `cluster`
- **AvNav-injected:** `disconnect` (boolean, true when no data)

## storeKeys

Maps symbolic names to SignalK paths. AvNav resolves them to live values:

```javascript
storeKeys: {
  sog: "nav.gps.course",      // → props.sog = current SOG value
  depth: "nav.gps.depthBelowTransducer"  // → props.depth = current depth
}
```

Dynamic storeKeys can be set via `updateFunction`:
```javascript
updateFunction: function(values) {
  const out = { ...values };
  if (values.kind === "pressure" && values.value) {
    out.storeKeys = { ...out.storeKeys, value: values.value.trim() };
  }
  return out;
}
```

## Module create() Pattern

AvNav calls `mod.create(def, Helpers)` where `def` is the cluster definition and `Helpers` is the shared helper object. The module returns an object with callbacks:

```javascript
function create(def, Helpers) {
  // Setup, get dependencies
  function renderCanvas(canvas, props) { /* ... */ }
  function translateFunction(props) { /* ... */ }
  return {
    id: "ModuleName",
    wantsHideNativeHead: true,
    renderCanvas,
    translateFunction
  };
}
```

## Related

- [editable-parameters.md](editable-parameters.md) — Parameter types and conditions
- [formatters.md](formatters.md) — Available formatters
- [architecture/cluster-system.md](../architecture/cluster-system.md) — How ClusterHost dispatches
