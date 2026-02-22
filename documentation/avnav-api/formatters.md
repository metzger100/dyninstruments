# AvNav Formatters

**Status:** ✅ Reference | Covers official AvNav API + dyninstruments usage

## Overview

Formatters convert raw store values to display strings. AvNav provides built-in formatters and supports custom registration via `avnav.api.registerFormatter()`.
Authoritative core formatter signatures and parameter-order details are maintained only in [core-formatter-catalog.md](core-formatter-catalog.md).

## Registering Custom Formatters (AvNav API)

```javascript
avnav.api.registerFormatter("myFormatterName", formatterFunction);
```

- First param of formatter function = raw value; must return a string
- Return string should have **constant length** (pad with spaces if needed) to avoid layout jumps
- Throws exception if a formatter with the same name already exists
- Additional parameters accepted via `formatterParameters` (set in Layout Editor)

### Formatter Parameters Property

Each formatter function should have a `.parameters` property describing its Layout Editor params (same syntax as [editable-parameters.md](editable-parameters.md)):

```javascript
const formatTemperature = function(data, opt_unit) {
  try {
    if (!opt_unit || opt_unit.toLowerCase().match(/^k/)) {
      return avnav.api.formatter.formatDecimal(data, 3, 1);
    }
    if (opt_unit.toLowerCase().match(/^c/)) {
      return avnav.api.formatter.formatDecimal(parseFloat(data) - 273.15, 3, 1);
    }
  } catch(e) { return "-----"; }
};
formatTemperature.parameters = [
  { name: 'unit', type: 'SELECT', list: ['celsius', 'kelvin'], default: 'celsius' }
];
avnav.api.registerFormatter("mySpecialTemperature", formatTemperature);
```

## Feature Formatters (AvNav API, since 20210114)

For formatting overlay/feature data:

```javascript
avnav.api.registerFeatureFormatter('myHtmlInfo', myHtmlInfoFunction);
```

## Built-in Formatters (Canonical List)

This file intentionally does not duplicate core formatter signatures.

Use [core-formatter-catalog.md](core-formatter-catalog.md) for:
- canonical signature and positional parameter order
- core alias mapping (`skPressure`, `skTemperature`)
- normative roll/pitch tuple contract and common failure cases

---

For strict integration contracts (including roll/pitch tuple requirements), use:
- [core-formatter-catalog.md](core-formatter-catalog.md)
- [core-key-catalog.md](core-key-catalog.md)
- [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md)

### Compatibility Note: Date/Time Formatter Inputs

`formatTime`, `formatDate`, and `formatDateTime` should receive the raw store value (Date/time object/value) from AvNav.  
Do not pre-coerce these inputs with `Number(...)` in mapper/widget boundaries, or formatter behavior can diverge from core AvNav widgets.

---

## dyninstruments Formatter Usage

### Formatter Resolution in Helpers.applyFormatter (dyninstruments-internal)

Used by text and graphic widgets (`runtime/helpers.js`):

1. Reads `props.formatterParameters`
2. Normalizes parameters:
   - array -> used as-is
   - string -> split by comma
   - otherwise -> `[]`
3. Dispatch order:
   - `props.formatter` is a function -> direct call
   - `props.formatter` is a string -> `avnav.api.formatter[name]` call when present
4. Formatter errors are caught intentionally and continue with fallback
5. Fallback:
   - `raw == null` or `Number.isNaN(raw)` -> `props.default` when explicitly provided, otherwise `"---"`
   - otherwise -> `String(raw)`

### Formatter Names Currently Used by dyninstruments

| Context | Formatter |
|---|---|
| Speed/Wind/VMG | `formatSpeed` |
| Navigation and anchor distances | `formatDistance` |
| Course/bearing | `formatDirection360` |
| Vessel roll/pitch | `formatDirection` with `[true, true, false]` (radian input, signed `±180`) |
| Temperature | `formatTemperature` |
| Depth/voltage numeric formatting | `formatDecimal` |
| ETA/clock display | `formatTime` |
| Position display | `formatLonLats`, `formatLonLatsDecimal` |
| Environment pressure mapper | `skPressure` |

### Compatibility Note: Pressure Formatter Name

Current dyninstruments runtime mapping still uses `skPressure` in `cluster/mappers/EnvironmentMapper.js`.  
See canonical alias mapping in [core-formatter-catalog.md](core-formatter-catalog.md#legacy-aliases-present-in-core).

### Custom Angle Formatter (dyninstruments-internal)

ClusterWidget creates angle formatters for wind kinds:

```javascript
function makeAngleFormatter(isDirection, leadingZero, fallback) {
  return function(raw) {
    // isDirection=true  → 0..360 (TWD)
    // isDirection=false → -180..+180 (TWA, AWA)
  };
}
```

### Gauge-Internal Formatting (dyninstruments-internal)

Graphic gauges use mapper-provided formatter metadata and resolve formatter calls via `Helpers.applyFormatter(...)`. This keeps formatter guards/try-catch/fallback logic centralized in runtime helpers while still returning numeric + display outputs needed for pointer positioning:

- `displaySpeedFromRaw(raw, props, unit)` -> `{ num, text }` via `formatSpeed`
- `displayDepthFromRaw(raw, decimals)` -> `{ num, text }` via local fixed-decimal formatting (`toFixed`)
- `displayTemperatureFromRaw(raw, props)` -> `{ num, text }` via `formatTemperature`
- `displayVoltageFromRaw(raw, props)` -> `{ num, text }` via `formatDecimal`
- `PositionCoordinateWidget` stacked mode formats per-line lat/lon via `Helpers.applyFormatter(raw, { formatter: "formatLonLatsDecimal", formatterParameters: [axis] })`

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — How translateFunction sets formatters
- [core-formatter-catalog.md](core-formatter-catalog.md) — Authoritative signatures and parameter order
- [core-key-catalog.md](core-key-catalog.md) — Key/unit contracts used for formatter selection
- [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md) — Contract tuple schema and roll/pitch incident notes
- [editable-parameters.md](editable-parameters.md) — formatterParameters in Layout Editor
- [../shared/helpers.md](../shared/helpers.md) — runtime `Helpers.applyFormatter` behavior
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md) — Which formatter per kind
