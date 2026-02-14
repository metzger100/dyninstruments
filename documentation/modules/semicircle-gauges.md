# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Refactored | shared renderer + per-gauge wrappers

## Overview

The four semicircle gauges now share one renderer implementation:

- Shared rendering and layout in `modules/Cores/SemicircleGaugeRenderer.js`
- Shared helper APIs via `GaugeUtils` (`GaugeTextUtils`, `GaugeValueUtils`, `InstrumentComponents`)
- Gauge modules (`SpeedGauge`, `DepthGauge`, `TemperatureGauge`, `VoltageGauge`) only keep gauge-specific formatting, tick strategy, and sector strategy

All touched JS files are now below the 300-line target.

## File Locations

| Role | File |
|---|---|
| Shared facade | `modules/Cores/GaugeUtils.js` |
| Shared text helpers | `modules/Cores/GaugeTextUtils.js` |
| Shared numeric/angle helpers | `modules/Cores/GaugeValueUtils.js` |
| Shared semicircle renderer | `modules/Cores/SemicircleGaugeRenderer.js` |
| Speed wrapper | `modules/SpeedGauge/SpeedGauge.js` |
| Depth wrapper | `modules/DepthGauge/DepthGauge.js` |
| Temperature wrapper | `modules/TemperatureGauge/TemperatureGauge.js` |
| Voltage wrapper | `modules/VoltageGauge/VoltageGauge.js` |

## Module Dependencies

In `plugin.js`, all four gauges now depend on `SemicircleGaugeRenderer` instead of directly depending on duplicated local helpers.

Dependency chain:

```
SpeedGauge/DepthGauge/TemperatureGauge/VoltageGauge
  -> SemicircleGaugeRenderer
  -> GaugeUtils
  -> GaugeTextUtils + GaugeValueUtils + InstrumentComponents
```

## Shared Render Flow

`SemicircleGaugeRenderer.createRenderer(spec)` handles:

1. Canvas setup + mode detection (`flat`, `normal`, `high`)
2. Gauge geometry and pointer angle mapping
3. Arc ring + sectors + pointer + ticks + labels
4. Mode-specific text layout
5. Disconnect overlay

## Gauge-Specific Responsibilities

Each gauge wrapper defines only:

- Raw value conversion to `{ num, text }`
- Tick step strategy by value range
- Sector placement logic (high-end or low-end)
- Default range, unit, and ratio-threshold prop names

### SpeedGauge

- High-end sectors: `warningFrom..alarmFrom` and `alarmFrom..max`
- Formatter: `avnav.api.formatter.formatSpeed`
- Defaults: range `0..30`, unit `kn`

### DepthGauge

- Low-end sectors: `min..alarmFrom` and `alarmFrom..warningFrom` (+ warn-only)
- Formatter: fixed decimal (`toFixed(1)`)
- Defaults: range `0..30`, unit `m`

### TemperatureGauge

- High-end sectors (same rule as SpeedGauge)
- Formatter: `formatTemperature(..., "celsius")` with Kelvin fallback heuristic
- Defaults: range `0..35`, unit `°C`

### VoltageGauge

- Low-end sectors (same rule as DepthGauge)
- Formatter: `formatDecimal(..., 3, 1, true)` fallback to `toFixed(1)`
- Defaults: range `10..15`, unit `V`

## Removed Duplication

The duplicated helper groups were removed from all four gauge files:

- Text fit/draw helpers
- Disconnect overlay helper
- Tick generation and value-angle mapping helpers
- Arc sector conversion helpers
- Semicircle geometry/mode boilerplate

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
