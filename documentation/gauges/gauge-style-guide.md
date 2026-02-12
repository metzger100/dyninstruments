# Gauge Style Guide

**Status:** ✅ Implemented | SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge

## Overview

Visual specification for all semicircle gauge widgets. All gauges share identical visual style, proportions, and layout logic. Only data source, value formatting, and sector placement differ between gauges.

## Arc Configuration

- **Shape:** N-shaped semicircle (opening downward)
- **Fixed arc:** `startDeg = 270`, `endDeg = 450`
- **Angle convention:** 0° at North (canvas top), clockwise positive
- **Canvas conversion:** `toCanvasAngleRad(deg) = deg2rad(deg - 90)`

Value-to-angle mapping:
```
angleDeg = startDeg + (endDeg - startDeg) × ((value - min) / (max - min))
```

## Proportions (Function of R)

All dimensions derive from `R` (gauge radius):

| Element | Formula | Example R=100 |
|---|---|---|
| R | `min(floor(availW/2), floor(availH))`, min 14 | 100 |
| pad | `max(6, floor(min(W,H) × 0.04))` | ~6 |
| gap | `max(6, floor(min(W,H) × 0.03))` | ~6 |
| ringW | `max(6, floor(R × 0.12))` | 12 |
| needleDepth | `max(8, floor(ringW × 0.9))` | 10 |
| labelInset | `max(18, floor(ringW × 1.8))` | 21 |
| labelFontPx | `max(10, floor(R × 0.14))` | 14 |

**Gauge centering:**
```javascript
const gaugeLeft = pad + Math.floor((availW - 2*R) / 2);
const gaugeTop  = pad + Math.floor((availH - R) / 2);
const cx = gaugeLeft + R;   // center X
const cy = gaugeTop  + R;   // center Y
```

## Colors

| Element | Hex | Usage |
|---|---|---|
| Warning sector | `#e7c66a` | Matte yellow |
| Alarm sector | `#ff7a76` | Matte red |
| Pointer | `#ff2b2b` | Red triangle |
| Text / Ticks | `resolveTextColor()` | From CSS `--dyni-fg` |
| Arc stroke | `resolveTextColor()` | Same as text |
| Layline green (WindDial) | `#82b683` | Starboard tack |
| Layline red (WindDial) | `#ff7a76` | Port tack |

## Pointer Configuration

All semicircle gauges use identical pointer settings via `InstrumentComponents.drawPointerAtRim()`:

```javascript
IC.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, {
  depth: needleDepth,     // Penetration depth into ring
  color: "#ff2b2b",       // Red
  variant: "long",        // Extended needle variant
  sideFactor: 0.25,       // Narrower base (default would be 0.65)
  lengthFactor: 2         // Double length (extends outward from rim)
});
```

## Sector Logic

Sectors are colored arc segments painted on the ring. Each gauge type has a different sector strategy:

### SpeedGauge — High-end sectors (overspeed warning)

- Warning from `warningFrom` to `alarmFrom` (or `maxValue`)
- Alarm from `alarmFrom` to `maxValue`
- Sectors at the **upper end** of the range
- Default: warning enabled, alarm enabled

### DepthGauge — Low-end sectors (shallow water warning)

- Alarm from `minValue` to `alarmFrom`
- Warning from `alarmFrom` to `warningFrom`
- Sectors at the **lower end** of the range (shallow = dangerous)
- Default: warning enabled, alarm enabled
- Props: `depthWarningFrom` (default 5.0), `depthAlarmFrom` (default 2.0)

### VoltageGauge — Low-end sectors (undervoltage warning)

- Same logic as DepthGauge (low voltage = dangerous)
- Alarm from `minValue` to `alarmFrom`
- Warning from `alarmFrom` to `warningFrom`
- Props: `voltageWarningFrom` (default 12.2), `voltageAlarmFrom` (default 11.6)

### TemperatureGauge — High-end sectors (overheating)

- Same logic as SpeedGauge (high temp = dangerous)
- Default: **both disabled** (`tempWarningEnabled: false`, `tempAlarmEnabled: false`)
- Props: `tempWarningFrom` (default 28), `tempAlarmFrom` (default 32)

### Sector Drawing

```javascript
const angles = sectorAngles(fromValue, toValue, minV, maxV, arc);
// Returns { a0: startAngleRad, a1: endAngleRad }
drawAnnularSector(ctx, cx, cy, rOuter, ringW, angles.a0, angles.a1, "#e7c66a");
```

## Layout Modes

Aspect ratio `ratio = W / H` determines text layout:

| Mode | Condition | Layout | Text Position |
|---|---|---|---|
| `high` | `ratio < thresholdNormal` | Tall/portrait | Gauge centered, text as inline band below |
| `normal` | between thresholds | Square-ish | Text rendered inside the semicircle (3-row block) |
| `flat` | `ratio > thresholdFlat` | Wide/landscape | Gauge on left, text on right side |

### Default Thresholds (Per Gauge)

| Gauge | thresholdNormal | thresholdFlat |
|---|---|---|
| SpeedGauge | `speedRatioThresholdNormal` (1.1) | `speedRatioThresholdFlat` (3.5) |
| DepthGauge | `depthRatioThresholdNormal` (1.1) | `depthRatioThresholdFlat` (3.5) |
| TemperatureGauge | `tempRatioThresholdNormal` (1.1) | `tempRatioThresholdFlat` (3.5) |
| VoltageGauge | `voltageRatioThresholdNormal` (1.1) | `voltageRatioThresholdFlat` (3.5) |
| CompassGauge | `compRatioThresholdNormal` (0.7) | `compRatioThresholdFlat` (2.0) |
| WindDial | `dialRatioThresholdNormal` (0.7) | `dialRatioThresholdFlat` (2.0) |

### Text Layout Per Mode

**normal mode** — 3 rows inside semicircle:
```
    Row 1: Caption (smaller, top)
    Row 2: Value + Unit (largest, middle)  
    Row 3: (empty or used for additional info)
```
Uses `drawThreeRowsBlock()`, `captionUnitScale` controls caption/unit size relative to value.

**flat mode** — 2 rows to the right of gauge:
```
    [Gauge] | Top: Caption
            | Bottom: Value + Unit
```
Uses `drawCaptionMax()` + `drawValueUnitWithFit()` in right-side box.

**high mode** — Inline text band below gauge:
```
    [Gauge at top]
    Caption  Value  Unit  (single row, inline)
```
Uses `fitInlineCapValUnit()` for proportional sizing.

## Tick Rendering

- **Major ticks:** length=9, width=2
- **Minor ticks:** length=5, width=1
- **Labels:** bold 700, font from `resolveFontFamily()`
- **End labels** (min/max values) optional via `showEndLabels` prop
- **Tick generation:** `buildValueTickAngles(minV, maxV, tickMajor, tickMinor, arc)` returns arrays of angles

## Disconnect Overlay

When `props.disconnect === true` or value is invalid, `drawDisconnectOverlay()` renders a semi-transparent overlay with "NO DATA" text centered on the canvas.

## Related

- [gauge-shared-api.md](gauge-shared-api.md) — GaugeUtils function reference (Phase 1)
