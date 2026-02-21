# Gauge Style Guide

**Status:** ✅ Implemented | SpeedGaugeWidget, DepthGaugeWidget, TemperatureGaugeWidget, VoltageGaugeWidget

## Overview

Visual specification for semicircle gauge widgets. All four semicircle gauges share visual proportions and layout logic; data source/formatting/sector strategy differs per gauge.

## Arc Configuration

- Shape: N-shaped semicircle (opening downward)
- Default arc: `startDeg = 270`, `endDeg = 450`
- Angle convention: 0° at North, clockwise positive
- Generic dial ring/arc stroke width: `theme.ring.arcLineWidth` (default `1`)

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
| `ringW` | `max(6, floor(R * theme.ring.widthFactor))` (default `0.12`) | 12 |
| `needleDepth` | `max(8, floor(ringW * 0.9))` | 10 |
| `labelInset` | `max(18, floor(ringW * theme.labels.insetFactor))` (default `1.8`) | 21 |
| `labelFontPx` | `max(10, floor(R * theme.labels.fontFactor))` (default `0.14`) | 14 |

Gauge centering:

```javascript
const gaugeLeft = pad + Math.floor((availW - 2 * R) / 2);
const gaugeTop = pad + Math.floor((availH - R) / 2);
const cx = gaugeLeft + R;
const cy = gaugeTop + R;
```

## Colors

| Element | Theme token | Default | Usage |
|---|---|---|---|
| Warning sector | `theme.colors.warning` | `#e7c66a` | Matte yellow |
| Alarm sector | `theme.colors.alarm` | `#ff7a76` | Matte red |
| Pointer | `theme.colors.pointer` | `#ff2b2b` | Red triangle |
| Text/ticks/arc stroke | `Helpers.resolveTextColor()` | CSS-resolved | Foreground |
| Layline starboard (WindDialWidget) | `theme.colors.laylineStb` | `#82b683` | Starboard tack |
| Layline port (WindDialWidget) | `theme.colors.laylinePort` | `#ff7a76` | Port tack |

Theme defaults are provided by `ThemeResolver` and can be overridden via CSS variables.

## Pointer Configuration

All semicircle gauges use the same pointer call:

```javascript
draw.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, {
  depth: needleDepth,
  fillStyle: theme.colors.pointer,
  variant: "long",
  sideFactor: theme.pointer.sideFactor,
  lengthFactor: theme.pointer.lengthFactor
});
```

Pointer color is passed directly via `fillStyle` from `theme.colors.pointer`.

## Sector Logic

### SpeedGaugeWidget (high-end)

- Warning: `warningFrom..alarmFrom` (or `warningFrom..maxValue`)
- Alarm: `alarmFrom..maxValue`
- Default toggles: warning enabled, alarm enabled

### DepthGaugeWidget (low-end)

- Alarm: `minValue..alarmFrom`
- Warning: `alarmFrom..warningFrom`
- Default toggles: warning enabled, alarm enabled

### VoltageGaugeWidget (low-end)

- Same pattern as DepthGaugeWidget
- Default toggles: warning enabled, alarm enabled

### TemperatureGaugeWidget (high-end)

- Same pattern as SpeedGaugeWidget
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
    fillStyle: theme.colors.warning
  });
}
```

Warning/alarm sectors in shared builders receive scalar color inputs (`warningColor`/`alarmColor`), typically from theme tokens.

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
| SpeedGaugeWidget | `speedRatioThresholdNormal` (`1.1`) | `speedRatioThresholdFlat` (`3.5`) |
| DepthGaugeWidget | `depthRatioThresholdNormal` (`1.1`) | `depthRatioThresholdFlat` (`3.5`) |
| TemperatureGaugeWidget | `tempRatioThresholdNormal` (`1.1`) | `tempRatioThresholdFlat` (`3.5`) |
| VoltageGaugeWidget | `voltageRatioThresholdNormal` (`1.1`) | `voltageRatioThresholdFlat` (`3.5`) |
| CompassGaugeWidget | `compRatioThresholdNormal` (`0.8`) | `compRatioThresholdFlat` (`2.2`) |
| WindDialWidget | `dialRatioThresholdNormal` (`0.7`) | `dialRatioThresholdFlat` (`2.0`) |

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

- Major ticks: `len=theme.ticks.majorLen`, `width=theme.ticks.majorWidth`
- Minor ticks: `len=theme.ticks.minorLen`, `width=theme.ticks.minorWidth`
- Labels: bold, font from `resolveFontFamily()`
- End labels optional via `showEndLabels`

## Disconnect Overlay

When `props.disconnect === true`, `drawDisconnectOverlay()` renders a dim overlay with centered `NO DATA`.

## Related

- [gauge-shared-api.md](gauge-shared-api.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
