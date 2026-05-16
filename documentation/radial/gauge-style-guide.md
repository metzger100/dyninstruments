# Gauge Style Guide

**Status:** ✅ Implemented | SpeedRadialWidget, DepthRadialWidget, TemperatureRadialWidget, VoltageRadialWidget, DefaultRadialWidget

## Overview

Visual specification for semicircle gauge widgets. `GeometryScale` turns the semicircle radius into ring, tick, and pointer pixels while `compactGeometryScale` only tightens label and text spacing; data source/formatting/sector strategy still differs per gauge.
Shared geometry weights come from `tokens.strokeWeight`, `tokens.pointerDepthWeight`, and `tokens.pointerSideWeight`.
- Theme tokens are resolved once per render via `const tokens = componentContext.theme.tokens.resolveForRoot(rootEl);`.

## Arc Configuration

- Shape: N-shaped semicircle (opening downward)
- Default arc: `startDeg = 270`, `endDeg = 450`
- Angle convention: 0° at North, clockwise positive
- Generic dial ring/arc stroke width: `GeometryScale.scaleStroke(R, theme.radial.ring.arcLineWidthFactor, strokeWeight)`

Value-to-angle mapping:

```text
angleDeg = startDeg + (endDeg - startDeg) * ((value - min) / (max - min))
```

## Proportions (Function of R)

| Element | Formula | Example R=100 |
|---|---|---|
| `R` | `min(floor(availW/2), floor(availH))`, min 14 | 100 |
| `pad` | `ResponsiveScaleProfile.computeInsetPx(responsive, 0.04, 1)` | ~4 |
| `gap` | `ResponsiveScaleProfile.computeInsetPx(responsive, 0.03, 1)` | ~3 |
| `ringW` | `GeometryScale.scale(R, theme.radial.ring.widthFactor)` | 12 |
| `pointerDepth` | `GeometryScale.scalePointer(R, theme.radial.pointer.depthFactor, pointerDepthWeight)` | 10 |
| `labelInset` | `max(1, floor(ringW * theme.radial.labels.insetFactor * compactGeometryScale))` | ~17 |
| `labelFontPx` | `max(1, floor(R * theme.radial.labels.fontFactor * compactGeometryScale))` | ~16 |

Gauge centering:

```javascript
const gaugeLeft = pad + Math.floor((availW - 2 * R) / 2);
const gaugeTop = pad + Math.floor((availH - R) / 2);
const cx = gaugeLeft + R;
const cy = gaugeTop + R;
```

Shared compact math:

```text
textFillScale = lerp(1.18, 1, t)
compactGeometryScale = max(0.5, 1 - max(0, textFillScale - 1))
```

`compactGeometryScale` applies only to label and text spacing, not ring, tick, or pointer geometry.

Ownership:

- `ResponsiveScaleProfile` owns `minDim -> t -> textFillScale`
- `SemicircleRadialLayout` owns semicircle-family geometry, label metrics, and mode boxes
- `SemicircleRadialTextLayout` owns fit caching and mode-routed text consumption

## Colors

| Element | Theme token | Default | Usage |
|---|---|---|---|
| Warning sector | `tokens.colors.warning` | `#e7c66a` | Matte yellow |
| Alarm sector | `tokens.colors.alarm` | `#FA584A` | Matte red |
| Pointer | `tokens.colors.pointer` | `#ff2b2b` | Red triangle |
| Text/ticks/arc stroke | `tokens.surface.fg` | CSS-resolved | Foreground |
| Layline starboard (WindRadialWidget) | `tokens.colors.laylineStb` | `#82b683` | Starboard tack |
| Layline port (WindRadialWidget) | `tokens.colors.laylinePort` | `#ff7a76` | Port tack |

Theme defaults are provided by `runtime.theme` and can be overridden via CSS variables.

## Pointer Configuration

All semicircle gauges use the same pointer call:

```javascript
draw.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, {
  depth: pointerDepth,
  fillStyle: tokens.colors.pointer,
  variant: "long"
});
```

Pointer color is passed directly via `fillStyle` from `tokens.colors.pointer`.
Pointer depth and side thickness are scaled in the layout owner from the semicircle radius using shared weights:

```text
pointerDepthPx = GeometryScale.scalePointer(R, theme.radial.pointer.depthFactor, pointerDepthWeight)
pointerSidePx = GeometryScale.scalePointer(R, theme.radial.pointer.sideFactor, pointerSideWeight)
```

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
    fillStyle: tokens.colors.warning
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

All three layouts now consume `SemicircleRadialLayout` boxes plus `SemicircleRadialTextLayout` ceiling scaling; they no longer rely on fixed user-visible minima like `18`, `10`, `8`, `6`, or `4`.

Text fit contract for semicircle gauges:
- Caption, value, and unit must stay inside their assigned layout boxes in `flat`, `normal`, and `high` modes.
- Compact canvases are allowed to downscale text aggressively to preserve containment; overlap into ring/tick/pointer geometry is not allowed.
- Final draw-time clamping remains active even after cached fit selection to absorb measurement/rounding drift.

## Hide Textual Metrics

- Public UI label: `Hide textual metrics`
- Default: `false`
- Applies to `SpeedRadialWidget`, `DepthRadialWidget`, `TemperatureRadialWidget`, `VoltageRadialWidget`, and `DefaultRadialWidget`
- This semicircle family is hide-only: `hideTextualMetrics` suppresses the live caption/value/unit metric readouts while preserving the existing geometry, responsive mode, arc/ring, pointer, sectors, ticks, scale/end labels, and state screens
- `SemicircleRadialEngine` skips the live text draw path when the relevant `hideTextualMetrics` prop is `true`
- No layout space is reclaimed for semicircle radial gauges in hide mode

## Tick Rendering

- Major ticks: `len=GeometryScale.scale(R, theme.radial.ticks.majorLenFactor)`, `width=GeometryScale.scaleStroke(R, theme.radial.ticks.majorWidthFactor, strokeWeight)`
- Minor ticks: `len=GeometryScale.scale(R, theme.radial.ticks.minorLenFactor)`, `width=GeometryScale.scaleStroke(R, theme.radial.ticks.minorWidthFactor, strokeWeight)`
- Labels: `weight=tokens.font.labelWeight`, font family from `tokens.font.family`
- End labels optional via `showEndLabels`

## Background Cache Rules

Semicircle gauges follow the shared cache convention through `CanvasLayerCache`.

- Cache static background elements (ring/arc, ticks, static label assets).
- Keep dynamic elements uncached (live pointer/value text, state-screen overlays).
- Build keys from geometry + style/theme tokens + typography + label signatures.
- Exclude live data values and per-frame marker/pointer positions from keys.
- Full convention: [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md).

## Canvas State-Screens

Semicircle gauges resolve state-screens before layout/draw work:

- `disconnected` candidate: `p.disconnect === true`
- fallback candidate: `data`

When `kind !== "data"`, the engine clears the canvas and renders the shared `StateScreenCanvasOverlay` label (`GPS Lost` for `disconnected`).

## Related

- [gauge-shared-api.md](gauge-shared-api.md)
- [../conventions/canvas-layer-caching.md](../conventions/canvas-layer-caching.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
