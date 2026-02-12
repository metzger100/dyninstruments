# Gauge Shared API (GaugeUtils)

**Status:** ⏳ Phase 1 target | Currently duplicated in SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge

## Overview

25 functions are identically duplicated across all 4 semicircle gauge modules (~350 lines × 4 = ~1400 lines). Phase 1 extracts these into `modules/Shared/GaugeUtils.js`.

## Target File

**Path:** `modules/Shared/GaugeUtils.js` (~250 lines)
**GlobalKey:** `DyniGaugeUtils`
**Dependencies:** None (pure Canvas 2D math/drawing)
**Used by:** SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge

## Module Registration (plugin.js)

```javascript
GaugeUtils: {
  js: BASE + "modules/Shared/GaugeUtils.js",
  css: undefined,
  globalKey: "DyniGaugeUtils",
  deps: []
}
```

Add `"GaugeUtils"` to deps of SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge.

## Access Pattern in Gauge Modules

```javascript
function create(def, Helpers) {
  const GU = Helpers.getModule('GaugeUtils') && Helpers.getModule('GaugeUtils').create();
  // Then call: GU.setFont(), GU.clamp(), GU.drawArcRing(), etc.
}
```

## Complete Function Reference

### Category 1: Basic Utilities

#### setFont(ctx, px, bold, family)
Sets canvas font. `bold` → weight 700, else 400.

#### clamp(n, lo, hi)
Clamps number to [lo, hi]. Returns `lo` if not finite.

#### isFiniteN(n)
Returns `true` if `typeof n === 'number' && isFinite(n)`.

#### deg2rad(d)
Converts degrees to radians: `d × π / 180`.

#### toCanvasAngleRad(deg)
Converts gauge degrees (0°=North, CW) to canvas radians: `deg2rad(deg - 90)`.

### Category 2: Text Layout

#### fitTextPx(ctx, text, maxW, maxH, family, bold)
Binary-search font size that fits `text` within `maxW × maxH`. Returns pixel size (min 6).

#### measureValueUnitFit(ctx, family, value, unit, w, h, secScale)
Binary-search optimal font sizes for value+unit pair. Returns `{ vPx, uPx, gap, total }`.

#### fitInlineCapValUnit(ctx, family, caption, value, unit, maxW, maxH, secScale)
Binary-search sizes for inline caption+value+unit row ("high" mode). Returns `{ cPx, vPx, uPx, g1, g2, total }`.

### Category 3: Text Rendering

#### drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx, align)
Draws caption text fitted to box. `align`: `'left'` (default) or `'right'`.

#### drawValueUnitWithFit(ctx, family, x, y, w, h, value, unit, fit, align)
Draws value+unit pair using pre-computed `fit` object from `measureValueUnitFit`.

#### drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale)
Draws 3-row layout (Caption / Value / Unit) centered in box. Used in "normal" mode.

#### drawDisconnectOverlay(ctx, W, H, family, color)
Draws semi-transparent overlay with "NO DATA" text.

### Category 4: Gauge Drawing

#### drawArcRing(ctx, cx, cy, r, startDeg, endDeg, lineWidth)
Strokes an arc from `startDeg` to `endDeg` at radius `r`.

#### drawAnnularSector(ctx, cx, cy, rOuter, thickness, startDeg, endDeg, fillStyle)
Fills a colored sector between `rOuter` and `rOuter - thickness`.

#### drawTicksFromAngles(ctx, cx, cy, r, majorsDeg, minorsDeg, majorStyle, minorStyle)
Draws tick marks at specified angles. Styles: `{ len, width }`.

#### drawLabelsForMajorValues(ctx, cx, cy, r, family, fontPx, labelInset, minV, maxV, majorStep, arc, showEndLabels)
Draws numeric labels at major tick positions. Labels placed at `r - labelInset`.

### Category 5: Gauge Calculation

#### buildValueTickAngles(minV, maxV, majorStep, minorStep, arc)
Builds arrays of tick angles from value range. Returns `{ majors: [deg,...], minors: [deg,...] }`.

#### sectorAngles(from, to, minV, maxV, arc)
Converts value range [from, to] to arc angle range. Returns `{ a0, a1 }` (degrees) or `null`.

#### niceTickSteps(range)
Auto-selects major/minor tick step sizes for a given range. Returns `{ major, minor }`.

| Range | Major | Minor |
|---|---|---|
| ≤6 | 1 | 0.5 |
| ≤12 | 2 | 1 |
| ≤30 | 5 | 1 |
| ≤60 | 10 | 2 |
| ≤120 | 20 | 5 |
| >120 | 50 | 10 |

#### almostInt(x, eps)
Returns `true` if `x` is within `eps` (default 1e-6) of an integer.

#### extractNumberText(s)
Extracts first number from string via regex. Returns string or `""`.

### Category 6: Dead Code (Remove During Extraction)

#### drawPointerAtRimFallback(ctx, cx, cy, rOuter, angleDeg, opts)
46-line duplicate of `InstrumentComponents.drawPointerAtRim`. **Never executed** because IC is always loaded. **Do NOT include in GaugeUtils.** All gauges should use `IC.drawPointerAtRim` directly.

## Functions NOT to Extract (Gauge-Specific)

These functions differ per gauge and must stay in individual modules:

| Function | Why Different |
|---|---|
| `displaySpeedFromRaw(raw, unit)` | Calls `formatSpeed`, speed-specific conversion |
| `displayDepthFromRaw(raw, decimals)` | Calls `formatDecimal`, depth-specific |
| `displayTemperatureFromRaw(raw)` | Calls `formatTemperature`, temp-specific |
| `displayVoltageFromRaw(raw)` | Calls `formatDecimal`, voltage-specific |
| `formatSpeedString(raw, unit)` | Speed formatter wrapper |
| Sector logic in renderCanvas | Warning/alarm placement differs per gauge |

## Phase 1 Extraction Checklist

- [ ] Create `modules/Shared/GaugeUtils.js` with UMD wrapper
- [ ] Export all 24 functions (25 minus dead `drawPointerAtRimFallback`)
- [ ] Register in MODULES with globalKey `DyniGaugeUtils`
- [ ] Add `"GaugeUtils"` to deps of SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge
- [ ] In each gauge: `const GU = Helpers.getModule('GaugeUtils')?.create();`
- [ ] Replace all 24 local function calls with `GU.functionName()`
- [ ] Remove local copies of the 24 functions
- [ ] Remove `drawPointerAtRimFallback` entirely (dead code)
- [ ] Keep `IC.drawPointerAtRim` usage unchanged
- [ ] Verify each gauge renders identically after refactoring
- [ ] Update MODULES dependency graph in documentation
- [ ] Target: each gauge module ≤200-250 lines

## Source Reference

All 25 functions can be found identically in:
- `modules/SpeedGauge/SpeedGauge.js` lines 36-425
- `modules/DepthGauge/DepthGauge.js` lines 36-416
- `modules/TemperatureGauge/TemperatureGauge.js` lines 36-425
- `modules/VoltageGauge/VoltageGauge.js` lines 36-440

## Related

- [gauge-style-guide.md](gauge-style-guide.md) — Visual specification
- [../architecture/module-system.md](../architecture/module-system.md) — How to register new module
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md) — Uses GaugeUtils after Phase 1
