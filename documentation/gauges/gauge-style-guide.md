# Gauge Style Guide

**Status:** ✅ Implemented | SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge

## Overview

Visual specification for semicircle gauge widgets. All four semicircle gauges share visual proportions and layout logic; data source/formatting/sector strategy differs per gauge.

## Arc Configuration

- Shape: N-shaped semicircle (opening downward)
- Default arc: `startDeg = 270`, `endDeg = 450`
- Angle convention: 0° at North, clockwise positive

Value-to-angle mapping:

```text
angleDeg = startDeg + (endDeg - startDeg) * ((value - min) / (max - min))
```

## Proportions (Function of R)

| Element | Formula | Example R=100 |
|---|---|---|
| `R` | `min(floor(availW/2), floor(availH))`, min 14 | 100 |
| `pad` | `max(6, floor(min(W,H) * 0.04))` | ~6 |
| `gap` | `max(6, floor(min(W,H) * 0.03))` | ~6 |
| `ringW` | `max(6, floor(R * 0.12))` | 12 |
| `needleDepth` | `max(8, floor(ringW * 0.9))` | 10 |
| `labelInset` | `max(18, floor(ringW * 1.8))` | 21 |
| `labelFontPx` | `max(10, floor(R * 0.14))` | 14 |

Gauge centering:

```javascript
const gaugeLeft = pad + Math.floor((availW - 2 * R) / 2);
const gaugeTop = pad + Math.floor((availH - R) / 2);
const cx = gaugeLeft + R;
const cy = gaugeTop + R;
```

## Colors

| Element | Hex | Usage |
|---|---|---|
| Warning sector | `#e7c66a` | Matte yellow |
| Alarm sector | `#ff7a76` | Matte red |
| Pointer | `#ff2b2b` | Red triangle |
| Text/ticks/arc stroke | `Helpers.resolveTextColor()` | CSS-resolved foreground |
| Layline green (WindDial) | `#82b683` | Starboard tack |
| Layline red (WindDial) | `#ff7a76` | Port tack |

## Pointer Configuration

All semicircle gauges use the same pointer call:

```javascript
draw.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, {
  depth: needleDepth,
  color: "#ff2b2b",
  variant: "long",
  sideFactor: 0.25,
  lengthFactor: 2
});
```

## Sector Logic

### SpeedGauge (high-end)

- Warning: `warningFrom..alarmFrom` (or `warningFrom..maxValue`)
- Alarm: `alarmFrom..maxValue`
- Default toggles: warning enabled, alarm enabled

### DepthGauge (low-end)

- Alarm: `minValue..alarmFrom`
- Warning: `alarmFrom..warningFrom`
- Default toggles: warning enabled, alarm enabled

### VoltageGauge (low-end)

- Same pattern as DepthGauge
- Default toggles: warning enabled, alarm enabled

### TemperatureGauge (high-end)

- Same pattern as SpeedGauge
- Default toggles: warning disabled, alarm disabled

### Sector Drawing

`valueUtils.sectorAngles(from, to, minV, maxV, arc)` returns degree angles:

```javascript
const sector = valueUtils.sectorAngles(fromValue, toValue, minV, maxV, arc);
if (sector) {
  draw.drawAnnularSector(ctx, cx, cy, rOuter, {
    startDeg: sector.a0,
    endDeg: sector.a1,
    thickness: ringW,
    fillStyle: "#e7c66a"
  });
}
```

## Layout Modes

Aspect ratio `ratio = W / H` determines text layout:

| Mode | Condition | Layout |
|---|---|---|
| `high` | `ratio < thresholdNormal` | Gauge centered, inline text band below |
| `normal` | between thresholds | Three-row text block inside semicircle |
| `flat` | `ratio > thresholdFlat` | Gauge left, caption/value/unit box right |

### Default Thresholds

| Gauge | thresholdNormal | thresholdFlat |
|---|---|---|
| SpeedGauge | `speedRatioThresholdNormal` (`1.1`) | `speedRatioThresholdFlat` (`3.5`) |
| DepthGauge | `depthRatioThresholdNormal` (`1.1`) | `depthRatioThresholdFlat` (`3.5`) |
| TemperatureGauge | `tempRatioThresholdNormal` (`1.1`) | `tempRatioThresholdFlat` (`3.5`) |
| VoltageGauge | `voltageRatioThresholdNormal` (`1.1`) | `voltageRatioThresholdFlat` (`3.5`) |
| CompassGauge | `compRatioThresholdNormal` (`0.8`) | `compRatioThresholdFlat` (`2.2`) |
| WindDial | `dialRatioThresholdNormal` (`0.7`) | `dialRatioThresholdFlat` (`2.0`) |

### Text Layout Per Mode

**normal**

```text
Row 1: Caption
Row 2: Value
Row 3: Unit
```

**flat**

```text
[Gauge] | Top: Caption
        | Bottom: Value + Unit
```

**high**

```text
[Gauge at top]
Caption  Value  Unit
```

## Tick Rendering

- Major ticks: `len=9`, `width=2`
- Minor ticks: `len=5`, `width=1`
- Labels: bold, font from `resolveFontFamily()`
- End labels optional via `showEndLabels`

## Disconnect Overlay

When `props.disconnect === true`, `drawDisconnectOverlay()` renders a dim overlay with centered `NO DATA`.

## Related

- [gauge-shared-api.md](gauge-shared-api.md)
