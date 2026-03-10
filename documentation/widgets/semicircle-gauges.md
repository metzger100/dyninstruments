# Semicircle Gauges (Speed / Depth / Temperature / Voltage)

**Status:** ✅ Refactored | shared renderer + per-gauge wrappers

## Overview

The four semicircle gauges share one renderer implementation:

- Shared responsive layout ownership in `shared/widget-kits/radial/SemicircleRadialLayout.js`
- Shared mode-routed text fitting/draw in `shared/widget-kits/radial/SemicircleRadialTextLayout.js`
- Shared rendering orchestration in `shared/widget-kits/radial/SemicircleRadialEngine.js`
- Shared helper APIs via `RadialToolkit` (`ThemeResolver`, `RadialTextLayout`, `RadialValueMath`, `RadialAngleMath`, `RadialTickMath`, draw utils)
- Gauge wrappers keep only formatting, tick-profile selection, and sector strategy

## File Locations

| Role | File |
|---|---|
| Shared facade | `shared/widget-kits/radial/RadialToolkit.js` |
| Shared text helpers | `shared/widget-kits/radial/RadialTextLayout.js` |
| Shared numeric/angle helpers | `shared/widget-kits/radial/RadialValueMath.js` |
| Responsive layout owner | `shared/widget-kits/radial/SemicircleRadialLayout.js` |
| Mode text helper | `shared/widget-kits/radial/SemicircleRadialTextLayout.js` |
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
  -> RadialToolkit + SemicircleRadialLayout + SemicircleRadialTextLayout
  -> RadialTextLayout + RadialValueMath + RadialAngleMath + RadialTickMath + RadialCanvasPrimitives + RadialFrameRenderer
  -> ResponsiveScaleProfile + LayoutRectMath
```

## Shared Render Flow

`SemicircleRadialEngine.createRenderer(spec)` handles:

1. Canvas setup + theme resolve + responsive mode detection (`flat`, `normal`, `high`)
2. One-time theme token resolve (`theme = RadialToolkit.theme.resolve(canvas)`)
3. `SemicircleRadialLayout.computeInsets()` / `computeLayout()` for shared responsive geometry, label metrics, and mode boxes
4. Arc ring + sectors + pointer + ticks + labels
5. `SemicircleRadialTextLayout.drawModeText()` for flat/high/normal caption-value-unit layout
6. Disconnect overlay

Pointer and sector rendering in shared gauge paths use direct scalar token values passed at callsites.

Responsive ownership:

- `ResponsiveScaleProfile` owns the compact curve (`textFillScale`)
- `SemicircleRadialLayout` maps that curve into semicircle-family spacing, label metrics, and text boxes
- `SemicircleRadialTextLayout` consumes layout-owned boxes and `textFillScale`; it does not create a second compaction curve

## Gauge-Specific Responsibilities

Each wrapper defines:

- Value conversion to `{ num, text }`
- Tick profile selection via shared `RadialValueMath` resolver methods
- Sector placement strategy (high-end or low-end), with theme colors forwarded as scalar sector colors
- Wrapper-owned unit/ratio bindings plus config-backed range ownership

### SpeedRadialWidget

- High-end sectors
- Tick profile: `resolveStandardSemicircleTickSteps`
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatSpeed", formatterParameters: [unit] })`
- Config-backed range defaults: `0..30`
- Wrapper defaults/bindings: unit `kn`, speed ratio props

### DepthRadialWidget

- Low-end sectors
- Tick profile: `resolveStandardSemicircleTickSteps`
- Formatter path: fixed decimal (1)
- Config-backed range defaults: `0..30`
- Wrapper defaults/bindings: unit `m`, depth ratio props

### TemperatureRadialWidget

- High-end sectors
- Tick profile: `resolveTemperatureSemicircleTickSteps`
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatTemperature", formatterParameters: ["celsius"] })`
- Config-backed range defaults: `0..35`
- Wrapper defaults/bindings: unit `°C`, temperature ratio props

### VoltageRadialWidget

- Low-end sectors
- Tick profile: `resolveVoltageSemicircleTickSteps`
- Formatter path: `Helpers.applyFormatter(raw, { formatter: "formatDecimal", formatterParameters: [3, 1, true] })`
- Config-backed range defaults: `7..15`
- Wrapper defaults/bindings: unit `V`, voltage ratio props
- Toggle behavior: sectors default to enabled when toggle values are unset; explicit `voltageRadialWarningEnabled: false` and/or `voltageRadialAlarmEnabled: false` suppress corresponding sectors
- Low-end defaults (`warningFrom=12.2`, `alarmFrom=11.6`) come from the editable/default config boundary; the wrapper forwards only enabled sector props plus theme colors

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

- Text-fit caching is still owned by the `SemicircleRadialEngine.createRenderer(spec)` closure state (`fitCache`), but the per-mode cache entries are consumed by `SemicircleRadialTextLayout`.
- Covered fitting paths: `flat` (compact), `high`, and `normal` layouts.
- Cache keys include all fitting-relevant inputs:
  - shared inputs: `W`, `H`, active mode, `caption`, `valueText`, `unit`, effective `secScale` (`captionUnitScale` after clamp), resolved font family, and theme font weights.
  - geometry/layout inputs: mode-specific box dimensions and layout-owned geometry values (`R`, `ringW`, label metrics, placement boxes, and normal-mode `rSafe` / search bounds).
- Invalidation is automatic by key mismatch when any text, typography, scale, or geometry input changes.
- Draw calls still execute every frame; only intermediate fitting outputs (chosen sizes/layout fit results) are reused on cache hits.

## Related

- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
