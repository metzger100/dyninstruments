# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Refactored | shared renderer + per-gauge wrappers

## Overview

The four semicircle gauges share one renderer implementation:

- Shared rendering and layout in `shared/widget-kits/radial/SemicircleRadialEngine.js`
- Shared helper APIs via `RadialToolkit` (`ThemeResolver`, `RadialTextLayout`, `RadialValueMath`, `RadialAngleMath`, `RadialTickMath`, draw utils)
- Gauge wrappers keep only formatting, tick-profile selection, and sector strategy

## File Locations

| Role | File |
|---|---|
| Shared facade | `shared/widget-kits/radial/RadialToolkit.js` |
| Shared text helpers | `shared/widget-kits/radial/RadialTextLayout.js` |
| Shared numeric/angle helpers | `shared/widget-kits/radial/RadialValueMath.js` |
| Shared semicircle renderer | `shared/widget-kits/radial/SemicircleRadialEngine.js` |
| Speed wrapper | `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js` |
| Depth wrapper | `widgets/radial/DepthRadialWidget/DepthRadialWidget.js` |
| Temperature wrapper | `widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js` |
| Voltage wrapper | `widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js` |

## Module Dependencies

In `config/components.js`, all four gauges depend on both `SemicircleRadialEngine` and `RadialValueMath`:

```text
SpeedRadialWidget/DepthRadialWidget/TemperatureRadialWidget/VoltageRadialWidget
  -> SemicircleRadialEngine + RadialValueMath
  -> RadialToolkit
  -> RadialTextLayout + RadialValueMath + RadialAngleMath + RadialTickMath + RadialCanvasPrimitives + RadialFrameRenderer
```

## Shared Render Flow

`SemicircleRadialEngine.createRenderer(spec)` handles:

1. Canvas setup + mode detection (`flat`, `normal`, `high`)
2. One-time theme token resolve (`theme = RadialToolkit.theme.resolve(canvas)`)
3. Gauge geometry and pointer angle mapping
4. Arc ring + sectors + pointer + ticks + labels
5. Mode-specific text layout
6. Disconnect overlay

Pointer and sector rendering in shared gauge paths use direct scalar token values passed at callsites.

## Gauge-Specific Responsibilities

Each wrapper defines:

- Value conversion to `{ num, text }`
- Tick profile selection via shared `RadialValueMath` resolver methods
- Sector placement strategy (high-end or low-end), with theme colors forwarded as scalar sector colors
- Defaults (range, unit, ratio props)

### SpeedRadialWidget

- High-end sectors
- Tick profile: `resolveStandardSemicircleTickSteps`
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatSpeed", formatterParameters: [unit] })`
- Defaults: range `0..30`, unit `kn`

### DepthRadialWidget

- Low-end sectors
- Tick profile: `resolveStandardSemicircleTickSteps`
- Formatter path: fixed decimal (1)
- Defaults: range `0..30`, unit `m`

### TemperatureRadialWidget

- High-end sectors
- Tick profile: `resolveTemperatureSemicircleTickSteps`
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatTemperature", formatterParameters: ["celsius"] })`
- Defaults: range `0..35`, unit `°C`

### VoltageRadialWidget

- Low-end sectors
- Tick profile: `resolveVoltageSemicircleTickSteps`
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatDecimal", formatterParameters: [3, 1, true] })`
- Defaults: range `10..15`, unit `V`
- Toggle behavior: sectors default to enabled when toggle values are unset; explicit `voltageRadialWarningEnabled: false` and/or `voltageRadialAlarmEnabled: false` suppress corresponding sectors
- Low-end defaults (`warningFrom=12.2`, `alarmFrom=11.6`) are applied only for sectors that remain enabled

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

## Performance

- Text-fit caching is owned by `SemicircleRadialEngine.createRenderer(spec)` closure state (`fitCache`), so each gauge renderer instance keeps its own cache.
- Covered fitting paths: `flat` (compact), `high`, and `normal` layouts.
- Cache keys include all fitting-relevant inputs:
  - shared inputs: `W`, `H`, active mode, `caption`, `valueText`, `unit`, effective `secScale` (`captionUnitScale` after clamp), resolved font family, and theme font weights.
  - geometry/layout inputs: mode-specific box dimensions and geometry values used by fitting (`R`, `ringW`, placement/box metrics, and normal-mode `rSafe` search bounds).
- Invalidation is automatic by key mismatch when any text, typography, scale, or geometry input changes.
- Draw calls still execute every frame; only intermediate fitting outputs (chosen sizes/layout fit results) are reused on cache hits.

## Related

- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
