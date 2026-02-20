# AvNav Formatters

**Status:** ✅ Reference | Covers official AvNav API + dyninstruments usage

## Overview

Formatters convert raw store values to display strings. AvNav provides built-in formatters and supports custom registration via `avnav.api.registerFormatter()`.

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

## Built-in Formatters (Used in This Plugin)

Accessed via `avnav.api.formatter.{name}(value, ...params)`:

| Formatter | Parameters | Input | Output | Used By |
|---|---|---|---|---|
| `formatSpeed` | `[unit]` (`"kn"`, `"km/h"`, `"m/s"`) | Speed (m/s) | Converted string | Speed, Wind speed, VMG |
| `formatDistance` | `[unit]` (opt) | Distance (m) | Formatted with unit conversion | DST, Route, Anchor |
| `formatDirection360` | `[leadingZero]` | Bearing (deg) | `"005"` or `"5"` (0-360) | COG, BRG |
| `formatTemperature` | `["celsius"]` | Temp (Kelvin) | Celsius string | Temperature |
| `formatDecimal` | `[totalDigits, decimals, trimTrailing]` | Number | Formatted decimal | Depth, Voltage |
| `formatLonLats` | `[]` | Position obj | Lat/lon string | Position |
| `formatTime` | `[]` | Time value | `"HH:MM:SS"` | ETA, Clock |
| `skPressure` | `["hPa"]` | Pressure (Pa) | Converted hPa string | Pressure |

---

## dyninstruments Formatter Usage

### Formatter Resolution in Helpers.applyFormatter (dyninstruments-internal)

Used by text and graphic widgets:

1. `props.formatter` is a **function** → `formatter(raw, ...formatterParameters)`
2. `props.formatter` is a **string** → `avnav.api.formatter[name](raw, ...formatterParameters)`
3. Neither → `String(raw)` or `props.default` if null/NaN

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

- `displaySpeedFromRaw(raw, props, unit)` → `{ num, text }` via `formatSpeed`
- `displayDepthFromRaw(raw, decimals)` → `{ num, text }` via local fixed-decimal formatting (`toFixed`)
- `displayTemperatureFromRaw(raw, props)` → `{ num, text }` via `formatTemperature`
- `displayVoltageFromRaw(raw, props)` → `{ num, text }` via `formatDecimal`
- `PositionCoordinateWidget` stacked mode formats per-line lat/lon via `Helpers.applyFormatter(raw, { formatter: "formatLonLatsDecimal", formatterParameters: [axis] })`

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — How translateFunction sets formatters
- [editable-parameters.md](editable-parameters.md) — formatterParameters in Layout Editor
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md) — Which formatter per kind
