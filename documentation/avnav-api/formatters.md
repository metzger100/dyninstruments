# AvNav Formatters

**Status:** ✅ Reference document | External API

## Overview

Formatters convert raw SignalK values to display strings. Set via `translateFunction` return: `{ formatter: 'name', formatterParameters: [...] }`. Applied by `Helpers.applyFormatter(rawValue, props)`.

## Formatter Resolution

1. If `props.formatter` is a **function** → called directly: `formatter(raw, ...params)`
2. If `props.formatter` is a **string** → looked up: `avnav.api.formatter[name](raw, ...params)`
3. If neither → raw value converted to string, or `props.default` if null/NaN

## Available Formatters (Used in This Plugin)

| Formatter | Parameters | Input | Output | Used By |
|---|---|---|---|---|
| `formatSpeed` | `[unit]` where unit = `"kn"`, `"km/h"`, `"m/s"` | Raw speed (m/s from SignalK) | Converted + formatted string (e.g. `"5.2"`) | Speed, Wind speed, VMG |
| `formatDistance` | `[unit]` (optional) | Raw distance (meters) | Formatted string with unit conversion | DST, Route, Anchor |
| `formatDirection360` | `[leadingZero]` | Raw bearing (degrees) | `"005"` or `"5"` (0-360 range) | COG, BRG |
| `formatTemperature` | `["celsius"]` | Raw temp (Kelvin from SignalK) | Celsius string | Temperature |
| `formatDecimal` | `[totalDigits, decimals, trimTrailing]` | Raw number | Formatted decimal (e.g. `"12.4"`) | Depth (numeric), Voltage (numeric) |
| `formatLonLats` | `[]` | Position object | Lat/lon string | Position (boat, WP) |
| `formatTime` | `[]` | Time value | `"HH:MM:SS"` | ETA, Clock, Time |
| `skPressure` | `["hPa"]` | Raw pressure (Pa from SignalK) | Converted hPa string | Pressure |

## Custom Formatter Functions

ClusterHost creates custom angle formatters for wind kinds:

```javascript
function makeAngleFormatter(isDirection, leadingZero, fallback) {
  return function(raw) {
    // isDirection=true  → 0..360 range (TWD)
    // isDirection=false → -180..+180 range (TWA, AWA)
    // leadingZero=true  → "005" instead of "5"
  };
}
```

Used for: `angleTrue`, `angleApparent`, `angleTrueDirection`

## Gauge-Internal Formatting

Graphic gauges (SpeedGauge, DepthGauge, etc.) do NOT use the AvNav formatter pipeline. They have internal formatting functions that call `avnav.api.formatter` directly:

- `displaySpeedFromRaw(raw, unit)` → `{ num, text }` — calls `avnav.api.formatter.formatSpeed`
- `displayDepthFromRaw(raw, decimals)` → `{ num, text }` — calls `avnav.api.formatter.formatDecimal`
- `displayTemperatureFromRaw(raw)` → `{ num, text }` — calls `avnav.api.formatter.formatTemperature`
- `displayVoltageFromRaw(raw)` → `{ num, text }` — calls `avnav.api.formatter.formatDecimal`

These return both a display string and the numeric value (in display units) needed for pointer positioning.

## Related

- [plugin-lifecycle.md](plugin-lifecycle.md) — How translateFunction sets formatters
- [../architecture/cluster-system.md](../architecture/cluster-system.md) — Which formatter is set per kind
