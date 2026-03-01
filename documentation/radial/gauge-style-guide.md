# Gauge Style Guide

**Status:** ✅ Implemented | SpeedRadialWidget, DepthRadialWidget, TemperatureRadialWidget, VoltageRadialWidget

## Overview

Visual specification for semicircle gauge widgets. All four semicircle gauges share visual proportions and layout logic; data source/formatting/sector strategy differs per gauge.

## Arc Configuration

- Shape: N-shaped semicircle (opening downward)
- Default arc: `startDeg = 270`, `endDeg = 450`
- Angle convention: 0° at North, clockwise positive
- Generic dial ring/arc stroke width: `theme.radial.ring.arcLineWidth` (default `1`)

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
| `ringW` | `max(6, floor(R * theme.radial.ring.widthFactor))` (default `0.12`) | 12 |
| `needleDepth` | `max(8, floor(ringW * 0.9))` | 10 |
| `labelInset` | `max(18, floor(ringW * theme.radial.labels.insetFactor))` (default `1.8`) | 21 |
| `labelFontPx` | `max(10, floor(R * theme.radial.labels.fontFactor))` (default `0.14`) | 14 |

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
| Layline starboard (WindRadialWidget) | `theme.colors.laylineStb` | `#82b683` | Starboard tack |
| Layline port (WindRadialWidget) | `theme.colors.laylinePort` | `#ff7a76` | Port tack |

Theme defaults are provided by `ThemeResolver` and can be overridden via CSS variables.

## Pointer Configuration

All semicircle gauges use the same pointer call:

```javascript
draw.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, {
  depth: needleDepth,
  fillStyle: theme.colors.pointer,
  variant: "long",
  sideFactor: theme.radial.pointer.sideFactor,
  lengthFactor: theme.radial.pointer.lengthFactor
});
```

Pointer color is passed directly via `fillStyle` from `theme.colors.pointer`.

## Sector Logic

### SpeedRadialWidget (high-end)

- Warning: `warningFrom..alarmFrom` (or `warningFrom..maxValue`)
- Alarm: `alarmFrom..maxValue`
- Default toggles: warning enabled, alarm enabled

### DepthRadialWidget (low-end)

- Alarm: `minValue..alarmFrom`
- Warning: `alarmFrom..warningFrom`
- Default toggles: warning enabled, alarm enabled

### VoltageRadialWidget (low-end)

- Same pattern as DepthRadialWidget
- Default toggles: warning enabled, alarm enabled

### TemperatureRadialWidget (high-end)

- Same pattern as SpeedRadialWidget
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
| SpeedRadialWidget | `speedRadialRatioThresholdNormal` (`1.1`) | `speedRadialRatioThresholdFlat` (`3.5`) |
| DepthRadialWidget | `depthRadialRatioThresholdNormal` (`1.1`) | `depthRadialRatioThresholdFlat` (`3.5`) |
| TemperatureRadialWidget | `tempRadialRatioThresholdNormal` (`1.1`) | `tempRadialRatioThresholdFlat` (`3.5`) |
| VoltageRadialWidget | `voltageRadialRatioThresholdNormal` (`1.1`) | `voltageRadialRatioThresholdFlat` (`3.5`) |
| CompassRadialWidget | `compassRadialRatioThresholdNormal` (`0.8`) | `compassRadialRatioThresholdFlat` (`2.2`) |
| WindRadialWidget | `windRadialRatioThresholdNormal` (`0.7`) | `windRadialRatioThresholdFlat` (`2.0`) |

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

- Major ticks: `len=theme.radial.ticks.majorLen`, `width=theme.radial.ticks.majorWidth`
- Minor ticks: `len=theme.radial.ticks.minorLen`, `width=theme.radial.ticks.minorWidth`
- Labels: `weight=theme.font.labelWeight`, font family from `resolveFontFamily()`
- End labels optional via `showEndLabels`

## Background Cache Rules

Semicircle gauges follow the shared cache convention through `CanvasLayerCache`.

- Cache static background elements (ring/arc, ticks, static label assets).
- Keep dynamic elements uncached (live pointer/value text, disconnect overlay).
- Build keys from geometry + style/theme tokens + typography + label signatures.
- Exclude live data values and per-frame marker/pointer positions from keys.
- Full convention: [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md).

## Disconnect Overlay

When `props.disconnect === true`, `drawDisconnectOverlay()` renders a dim overlay with centered `NO DATA`.

## Related

- [gauge-shared-api.md](gauge-shared-api.md)
- [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
