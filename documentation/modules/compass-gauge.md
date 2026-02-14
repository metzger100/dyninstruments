# CompassGauge Module

**Status:** ✅ Implemented | `modules/CompassGauge/CompassGauge.js`

## Overview

Full-circle rotating compass card with upright cardinal labels. The disc (ticks + N/NE/E/SE/S/SW/W/NW) rotates by `-heading` while labels stay upright. Optional target marker (BRG/course). Uses `GaugeUtils.draw` for all polar drawing.

## Module Registration

```javascript
// In MODULES (plugin.js)
CompassGauge: {
  js: BASE + "modules/CompassGauge/CompassGauge.js",
  css: BASE + "modules/CompassGauge/CompassGauge.css",
  globalKey: "DyniCompassGauge",
  deps: ["GaugeUtils"]
}
```

## Props (set by ClusterHost.translateFunction for courseHeading cluster)

| Prop | Type | Default | Description |
|---|---|---|---|
| `heading` | number | — | Heading in degrees (0–360, true or magnetic) |
| `markerCourse` | number | — | Optional target bearing (BRG) for rim marker |
| `caption` | string | `""` | Caption text (e.g. "HDT") |
| `unit` | string | `"°"` | Unit text |
| `leadingZero` | boolean | `true` | Pad value to 3 digits (e.g. "005") |
| `compRatioThresholdNormal` | number | `0.8` | Ratio below which → high mode |
| `compRatioThresholdFlat` | number | `2.2` | Ratio above which → flat mode |
| `captionUnitScale` | number | `0.8` | Caption/unit size relative to value |
| `default` | string | `"---"` | Fallback text when heading invalid |
| `disconnect` | boolean | `false` | Show "NO DATA" overlay |

## Compass Dial Drawing (via `GaugeUtils.draw`)

All draw calls use `rotationDeg = -heading` so the card rotates while the red lubber pointer stays fixed at 0° (North/top).

| Element | Draw Function | Parameters |
|---|---|---|
| Ring | `draw.drawRing` | full circle, lineWidth 1 |
| Ticks | `draw.drawTicks` | `rotationDeg: -heading`, 0→360, major 30°, minor 10° |
| Lubber pointer | `draw.drawPointerAtRim` | fixed at 0°, variant "long", color "#ff2b2b" |
| Target marker | `draw.drawRimMarker` | at `(markerCourse - heading)` degrees, only if both values finite |
| Labels | `draw.drawLabels` | `rotationDeg: -heading`, step 45°, `labelsMap: {0:"N",45:"NE",...}`, `textRotation: "upright"` |

Label rendering order: ring → ticks → pointer → marker → labels (labels always on top for readability).

If draw primitives are not available: no dial is drawn (graceful degradation).

## Layout Modes

```
ratio = W / H
ratio < compRatioThresholdNormal (0.8)  →  "high"
ratio > compRatioThresholdFlat   (2.2)  →  "flat"
else                                    →  "normal"
```

### Single-Value Display

CompassGauge shows one value group: heading with caption and unit.

**flat** — Left strip next to dial:

```
[Caption ]  [         ]
[Value°  ]  [  DIAL   ]
```

Top box: caption (capped at `valuePx × secScale`). Bottom box: value+unit, measured first then caption adapts.

**high** — Inline row above dial:

```
[Caption  Value  Unit]   ← single centered row
[       DIAL        ]
```

Binary search fits caption+value+unit into available band height/width.

**normal** — Three-row block centered inside dial:

```
         [Caption]
  inside [ Value ]
  circle [ Unit  ]
```

Center-aligned text. Optimal block size found by iterating over possible heights within the safe inscribed rectangle (`rSafe = rOuter - labelInset - extra`). Falls back to value+unit only if `rSafe` is too small.

## Internal Value Formatting

| Function | Input | Output |
|---|---|---|
| `formatDirection360(v, leadingZero)` | heading (degrees) | String 0–359, optionally zero-padded |

## Shared Internal Functions (duplicated from other modules)

`setFont`, `clamp`, `isFiniteN`, `fitTextPx`, `measureValueUnitFit`, `drawCaptionMax`, `fitInlineCapValUnit`, `drawThreeRowsBlock`, `drawDisconnectOverlay` — identical to WindDial versions.

## Exports

```javascript
return {
  id: "CompassGauge",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction      // no-op (returns {}); ClusterHost handles translation
};
```

## File Location

`modules/CompassGauge/CompassGauge.js`

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — shared draw API reference
- [../architecture/cluster-system.md](../architecture/cluster-system.md) — courseHeading cluster dispatch
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Pointer config, colors
