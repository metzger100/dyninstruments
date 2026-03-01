# Editable Parameters

**Status:** ✅ Reference | Covers official AvNav API + dyninstruments extensions (marked separately)

## Overview

editableParameters define the widget configuration UI in AvNav's Layout Editor. Passed as second argument to `avnav.api.registerWidget(def, editableParameters)`. Parameter values are available in renderHtml/renderCanvas props (exception: KEY type provides the store-read value, not the path).

## Parameter Definition

editableParameters is an object of parameter specs.

- The **object key** is the **property name** that appears in renderHtml/renderCanvas props (e.g. `minValue`, `speedRadialRatioThresholdFlat`).
- The **editor label** is controlled by the spec field `name` (used across cluster config files in config/clusters/*) or `displayName` (used by dyninstruments helper `makePerKindTextParams`).
- If neither `name` nor `displayName` is set, AvNav may fall back to showing the key.

```javascript
{
  // key = prop name in render props
  minValue: { type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0, name: "Min value" },

  // dyninstruments legacy helper uses displayName
  caption_sog: { type: "STRING", default: "SOG", displayName: "Caption", condition: { kind: "sog" } }
}
```

## Parameter Types (AvNav API)

| Type | Editor UI | Value Type | Notes |
|---|---|---|---|
| `STRING` | Text input | string | |
| `NUMBER` | Number input | number | Integer |
| `FLOAT` | Number input | number | With min/max/step |
| `BOOLEAN` | Toggle | boolean | |
| `SELECT` | Dropdown | string | Requires `list` |
| `KEY` | Store key browser | any | **Special:** render functions receive the *value read from store*, not the path string |
| `ARRAY` | Text input (comma-separated) | array | |
| `COLOR` | Color picker | string | CSS color value, e.g. `"rgba(200, 50, 50, .75)"` |

### SELECT Details

`list` accepts three forms:
- Array of strings: `["option1", "option2"]`
- Array of objects: `[{ name: "Display Name", value: "val" }, ...]`
- Function returning array (or function returning Promise that resolves to array)

```javascript
kind: {
  type: "SELECT",
  list: [
    { name: "Speed over ground (SOG)", value: "sog" },
    { name: "Speed gauge [Radial]", value: "sogRadial" }
  ],
  default: "sog"
}
```

### FLOAT Details

```javascript
minValue: { type: "FLOAT", min: 0, max: 100, step: 0.5, default: 0 }
```

### KEY Details

Shows a browser for currently available AvNav store keys. The render function receives the **store value** (not the key path). In dyninstruments, KEY params require `updateFunction` to set storeKeys dynamically — see [plugin-lifecycle.md](plugin-lifecycle.md).

```javascript
value: { type: "KEY", default: "" }
```

### COLOR Details

```javascript
bgColor: { type: "COLOR", default: "rgba(200, 50, 50, .75)" }
```

## Pre-defined Parameters (AvNav Built-in)

These are well-known to AvNav and need no type definition — just `true` (show in editor) or `false` (hide):

| Name | Type | Description |
|---|---|---|
| `caption` | STRING | Widget caption |
| `unit` | STRING | Widget unit |
| `formatter` | SELECT | Formatter picker (all registered formatters) |
| `formatterParameters` | ARRAY | Parameters passed to formatter |
| `value` | KEY | Store key selector |
| `className` | STRING | CSS class name |

```javascript
editableParameters: {
  caption: false,            // Hide default caption editor
  unit: false,               // Hide default unit editor
  formatter: false,          // Hide formatter picker
  formatterParameters: true, // Show formatter params
  value: true,               // Show store key selector
  className: true            // Show CSS class editor
}
```

`formatterParameters` are positional and formatter-specific. Parameter order and supported values are defined by the selected formatter; see [formatters.md](formatters.md#built-in-formatters-canonical-list).

---

## dyninstruments Extensions (Not Part of Official AvNav Docs)

### condition (Undocumented AvNav Feature)

`condition` is used extensively in dyninstruments but **not documented in the official AvNav API**. It controls when a parameter is visible in the editor.

**Single condition** — visible when match:
```javascript
condition: { kind: "sogRadial" }
```

**OR logic** — array of objects, visible if ANY matches:
```javascript
condition: [{ kind: "sog" }, { kind: "stw" }]
```

**AND logic** — multiple keys in one object, ALL must match:
```javascript
condition: { kind: "depthRadial", depthRadialAlarmEnabled: true }
```

**Always visible:**
```javascript
condition: []   // or omit condition entirely
```

### Per-Kind Caption/Unit Pattern (dyninstruments-internal)

Helper `makePerKindTextParams(KIND_MAP)` generates per-kind STRING parameters.
Map entries support this schema:

```javascript
{
  cap: "Label default",
  unit: "Unit default",
  kind: "kindOverride",                 // optional, default: map key
  captionName: "Caption editor label",  // optional, default: "Caption"
  unitName: "Unit editor label"         // optional, default: "Unit"
}
```

If `kind` is an array, helper output uses OR conditions (`[{ kind: a }, { kind: b }]`).

```javascript
const WIND_KIND = {
  angleTrue: { cap: "TWA", unit: "°" },
  angleTrueRadialAngle: {
    cap: "TWA",
    unit: "°",
    kind: "angleTrueRadial",
    captionName: "Angle caption",
    unitName: "Angle unit"
  }
};
// Generates:
// caption_angleTrue: { type: "STRING", displayName: "Caption", default: "TWA", condition: { kind: "angleTrue" } }
// unit_angleTrue:    { type: "STRING", displayName: "Unit", default: "°", condition: { kind: "angleTrue" } }
// caption_angleTrueRadialAngle: { type: "STRING", displayName: "Angle caption", default: "TWA", condition: { kind: "angleTrueRadial" } }
// unit_angleTrueRadialAngle:    { type: "STRING", displayName: "Angle unit", default: "°", condition: { kind: "angleTrueRadial" } }
```

ClusterWidget resolves via `p['caption_' + kindName]` and `p['unit_' + kindName]`.

### Common ThreeValueTextWidget Editables (dyninstruments-internal)

Shared layout thresholds for numeric (ThreeValueTextWidget) kinds:

```javascript
const commonThreeElementsEditables = {
  ratioThresholdNormal: { type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0 },
  ratioThresholdFlat:   { type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0 },
  captionUnitScale:     { type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8 }
};
```

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — Widget registration, updateFunction for KEY params
- [formatters.md](formatters.md) — Formatter registration
