# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Refactored | shared renderer + per-gauge wrappers

## Overview

The four semicircle gauges share one renderer implementation:

- Shared rendering and layout in `modules/Cores/SemicircleGaugeRenderer.js`
- Shared helper APIs via `GaugeUtils` (`GaugeTextUtils`, `GaugeValueUtils`, `GaugeAngleUtils`, `GaugeTickUtils`, draw utils)
- Gauge wrappers keep only formatting, tick strategy, and sector strategy

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

In `config/modules.js`, all four gauges depend on `SemicircleGaugeRenderer`:

```text
SpeedGauge/DepthGauge/TemperatureGauge/VoltageGauge
  -> SemicircleGaugeRenderer
  -> GaugeUtils
  -> GaugeTextUtils + GaugeValueUtils + GaugeAngleUtils + GaugeTickUtils + GaugePrimitiveDrawUtils + GaugeDialDrawUtils
```

## Shared Render Flow

`SemicircleGaugeRenderer.createRenderer(spec)` handles:

1. Canvas setup + mode detection (`flat`, `normal`, `high`)
2. Gauge geometry and pointer angle mapping
3. Arc ring + sectors + pointer + ticks + labels
4. Mode-specific text layout
5. Disconnect overlay

## Gauge-Specific Responsibilities

Each wrapper defines:

- Value conversion to `{ num, text }`
- Tick step strategy
- Sector placement strategy (high-end or low-end)
- Defaults (range, unit, ratio props)

### SpeedGauge

- High-end sectors
- Formatter path: `formatSpeed`
- Defaults: range `0..30`, unit `kn`

### DepthGauge

- Low-end sectors
- Formatter path: fixed decimal (1)
- Defaults: range `0..30`, unit `m`

### TemperatureGauge

- High-end sectors
- Formatter path: `formatTemperature(..., "celsius")` + Kelvin fallback heuristic
- Defaults: range `0..35`, unit `°C`

### VoltageGauge

- Low-end sectors
- Formatter path: `formatDecimal(..., 3, 1, true)` + numeric fallback
- Defaults: range `10..15`, unit `V`

## Removed Duplication

Removed from wrappers:

- text fitting and draw helpers
- disconnect overlay helpers
- tick/value-angle helpers
- sector conversion helpers
- semicircle geometry/mode boilerplate

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
