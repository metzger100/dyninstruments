# Editable Parameters

**Status:** ✅ Reference document | External API (AvNav widget editor)

## Overview

editableParameters define the widget configuration UI in AvNav's editor. Passed as second argument to `avnav.api.registerWidget(def, editableParameters)`.

## Parameter Types

### SELECT

Dropdown menu. The `list` array contains `{ name, value }` objects.

```javascript
kind: {
  type: "SELECT",
  list: [
    { name: "Speed over ground (SOG)", value: "sog" },
    { name: "Speed through water (STW)", value: "stw" },
    { name: "Speed gauge (SOG) [Graphic]", value: "sogGraphic" }
  ],
  default: "sog",
  name: "Kind"
}
```

### BOOLEAN

Toggle switch. Value is `true` / `false`.

```javascript
showEndLabels: {
  type: "BOOLEAN",
  default: false,
  name: "Show min/max labels",
  condition: { kind: "sogGraphic" }
}
```

### FLOAT

Numeric input with min/max/step constraints.

```javascript
minValue: {
  type: "FLOAT", min: 0, max: 100, step: 0.5, default: 0,
  name: "Min speed",
  condition: { kind: "sogGraphic" }
}
```

### STRING

Free text input. Used for captions and units.

```javascript
caption_sog: {
  type: "STRING",
  displayName: "Caption",      // Note: uses displayName, not name
  default: "SOG",
  condition: { kind: "sog" }
}
```

### KEY

SignalK path selector. AvNav shows a key browser/autocomplete. Used when the data source is user-configurable (not hardcoded in storeKeys).

```javascript
value: {
  type: "KEY",
  default: "",
  name: "SignalK path (pressure)",
  condition: { kind: "pressure" }
}
```

**Important:** KEY-type params require `updateFunction` to dynamically set storeKeys at runtime. See [plugin-lifecycle.md](plugin-lifecycle.md).

## Conditions

Conditions control when a parameter is visible in the editor. Only shown when ALL conditions match.

### Single Condition

```javascript
condition: { kind: "sogGraphic" }
// Visible only when kind === "sogGraphic"
```

### Multiple Conditions (OR logic)

Array of objects → parameter visible if ANY condition matches:

```javascript
condition: [{ kind: "sog" }, { kind: "stw" }]
// Visible when kind is "sog" OR "stw"
```

### Compound Condition (AND logic)

Multiple keys in one object → ALL must match:

```javascript
condition: { kind: "depthGraphic", depthAlarmEnabled: true }
// Visible only when kind === "depthGraphic" AND depthAlarmEnabled === true
```

### No Condition

```javascript
condition: []     // Always visible (explicit empty)
// OR simply omit condition → always visible
```

## Suppressing Built-in Parameters

Set built-in parameter names to `false` to hide AvNav's default editor fields:

```javascript
editableParameters: {
  caption: false,           // Hide default caption editor
  unit: false,              // Hide default unit editor
  formatter: false,         // Hide formatter picker
  formatterParameters: false, // Hide formatter params
  className: true,          // Keep CSS class editor
  value: true               // Keep SignalK value selector
}
```

## Per-Kind Caption/Unit Pattern

Helper function `makePerKindTextParams(KIND_MAP)` generates per-kind caption and unit STRING parameters:

```javascript
// Input KIND_MAP:
const SPEED_KIND = {
  sog: { cap: 'SOG', unit: 'kn' },
  stw: { cap: 'STW', unit: 'kn' }
};

// Generated parameters:
caption_sog: { type: 'STRING', displayName: 'Caption', default: 'SOG', condition: { kind: 'sog' } }
unit_sog:    { type: 'STRING', displayName: 'Unit',    default: 'kn',  condition: { kind: 'sog' } }
caption_stw: { type: 'STRING', displayName: 'Caption', default: 'STW', condition: { kind: 'stw' } }
unit_stw:    { type: 'STRING', displayName: 'Unit',    default: 'kn',  condition: { kind: 'stw' } }
```

ClusterHost resolves these in translateFunction via `p['caption_' + kindName]` and `p['unit_' + kindName]`.

## Common ThreeElements Editables

Shared layout thresholds used by all numeric (ThreeElements) kinds:

```javascript
const commonThreeElementsEditables = {
  ratioThresholdNormal: { type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
                          name: "3-Rows Threshold (higher = flatter)" },
  ratioThresholdFlat:   { type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
                          name: "1-Row Threshold (higher = flatter)" },
  captionUnitScale:     { type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
                          name: "Caption/Unit to Value scale" }
};
```

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — How updateFunction uses KEY params
- [../widgets/cluster-definitions.md](../widgets/cluster-definitions.md) — All cluster configs
