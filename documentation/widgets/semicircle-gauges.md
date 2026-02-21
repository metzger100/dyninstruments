# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Refactored | shared renderer + per-gauge wrappers

## Overview

The four semicircle gauges share one renderer implementation:

- Shared rendering and layout in `shared/widget-kits/gauge/SemicircleGaugeEngine.js`
- Shared helper APIs via `GaugeToolkit` (`ThemeResolver`, `GaugeTextLayout`, `GaugeValueMath`, `GaugeAngleMath`, `GaugeTickMath`, draw utils)
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

In `config/components.js`, all four gauges depend on both `SemicircleGaugeEngine` and `GaugeValueMath`:

```text
SpeedGaugeWidget/DepthGaugeWidget/TemperatureGaugeWidget/VoltageGaugeWidget
  -> SemicircleGaugeEngine + GaugeValueMath
  -> GaugeToolkit
  -> GaugeTextLayout + GaugeValueMath + GaugeAngleMath + GaugeTickMath + GaugeCanvasPrimitives + GaugeDialRenderer
```

## Shared Render Flow

`SemicircleGaugeEngine.createRenderer(spec)` handles:

1. Canvas setup + mode detection (`flat`, `normal`, `high`)
2. One-time theme token resolve (`theme = GaugeToolkit.theme.resolve(canvas)`)
3. Gauge geometry and pointer angle mapping
4. Arc ring + sectors + pointer + ticks + labels
5. Mode-specific text layout
6. Disconnect overlay

Pointer and sector rendering are theme-token only in shared gauge paths (`theme.colors.pointer|warning|alarm` are required).

## Gauge-Specific Responsibilities

Each wrapper defines:

- Value conversion to `{ num, text }`
- Tick step strategy
- Sector placement strategy (high-end or low-end), with `theme` forwarded into shared sector builders
- Defaults (range, unit, ratio props)

### SpeedGaugeWidget

- High-end sectors
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatSpeed", formatterParameters: [unit] })`
- Defaults: range `0..30`, unit `kn`

### DepthGaugeWidget

- Low-end sectors
- Formatter path: fixed decimal (1)
- Defaults: range `0..30`, unit `m`

### TemperatureGaugeWidget

- High-end sectors
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatTemperature", formatterParameters: ["celsius"] })` + Kelvin fallback heuristic
- Defaults: range `0..35`, unit `°C`

### VoltageGaugeWidget

- Low-end sectors
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatDecimal", formatterParameters: [3, 1, true] })` + numeric fallback
- Defaults: range `10..15`, unit `V`

## Removed Duplication

Removed from wrappers:

- text fitting and draw helpers
- disconnect overlay helpers
- tick/value-angle helpers
- sector conversion helpers
- semicircle geometry/mode boilerplate
- numeric extraction (`extractNumberText`)
- high-end/low-end sector builders
- direct `avnav.api` formatter access and duplicated guard patterns

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
