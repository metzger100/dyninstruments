# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Refactored | shared renderer + per-gauge wrappers

## Overview

The four semicircle gauges share one renderer implementation:

- Shared rendering and layout in `shared/widget-kits/gauge/SemicircleGaugeEngine.js`
- Shared helper APIs via `GaugeToolkit` (`GaugeTextLayout`, `GaugeValueMath`, `GaugeAngleMath`, `GaugeTickMath`, draw utils)
- Gauge wrappers keep only formatting, tick strategy, and sector strategy

## File Locations

| Role | File |
|---|---|
| Shared facade | `shared/widget-kits/gauge/GaugeToolkit.js` |
| Shared text helpers | `shared/widget-kits/gauge/GaugeTextLayout.js` |
| Shared numeric/angle helpers | `shared/widget-kits/gauge/GaugeValueMath.js` |
| Shared semicircle renderer | `shared/widget-kits/gauge/SemicircleGaugeEngine.js` |
| Speed wrapper | `widgets/gauges/SpeedGaugeWidget/SpeedGaugeWidget.js` |
| Depth wrapper | `widgets/gauges/DepthGaugeWidget/DepthGaugeWidget.js` |
| Temperature wrapper | `widgets/gauges/TemperatureGaugeWidget/TemperatureGaugeWidget.js` |
| Voltage wrapper | `widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js` |

## Module Dependencies

In `config/components.js`, all four gauges depend on `SemicircleGaugeEngine`:

```text
SpeedGaugeWidget/DepthGaugeWidget/TemperatureGaugeWidget/VoltageGaugeWidget
  -> SemicircleGaugeEngine
  -> GaugeToolkit
  -> GaugeTextLayout + GaugeValueMath + GaugeAngleMath + GaugeTickMath + GaugeCanvasPrimitives + GaugeDialRenderer
```

## Shared Render Flow

`SemicircleGaugeEngine.createRenderer(spec)` handles:

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

### SpeedGaugeWidget

- High-end sectors
- Formatter path: `formatSpeed`
- Defaults: range `0..30`, unit `kn`

### DepthGaugeWidget

- Low-end sectors
- Formatter path: fixed decimal (1)
- Defaults: range `0..30`, unit `m`

### TemperatureGaugeWidget

- High-end sectors
- Formatter path: `formatTemperature(..., "celsius")` + Kelvin fallback heuristic
- Defaults: range `0..35`, unit `°C`

### VoltageGaugeWidget

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
