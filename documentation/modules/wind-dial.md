# WindDial Module

**Status:** ✅ Implemented | `modules/WindDial/WindDial.js`

## Overview

Full-circle wind dial renderer showing wind angle (AWA/TWA) and speed (AWS/TWS) simultaneously. Uses IC for all polar drawing (ring, sectors, ticks, labels, pointer). Text layout for angle and speed values is handled internally with dual-column layout.

## Module Registration

```javascript
// In MODULES (plugin.js)
WindDial: {
  js: BASE + "modules/WindDial/WindDial.js",
  css: BASE + "modules/WindDial/WindDial.css",
  globalKey: "DyniWindDial",
  deps: ["InstrumentComponents"]
}
```

## Props (set by ClusterHost.translateFunction for wind cluster)

| Prop | Type | Default | Description |
|---|---|---|---|
| `angle` | number | — | Wind angle in degrees (±180 for AWA/TWA) |
| `speed` | number | — | Wind speed (m/s raw from SignalK) |
| `angleCaption` | string | `""` | Caption for angle side (e.g. "AWA") |
| `speedCaption` | string | `""` | Caption for speed side (e.g. "AWS") |
| `angleUnit` | string | `"°"` | Unit for angle display |
| `speedUnit` | string | `"kn"` | Unit for speed display |
| `leadingZero` | boolean | `false` | Pad angle to 3 digits (e.g. "045") |
| `layEnabled` | boolean | `true` | Show layline sectors |
| `layMin` | number | `0` | Layline inner angle (degrees, 0–180) |
| `layMax` | number | `0` | Layline outer angle (degrees, 0–180) |
| `dialRatioThresholdNormal` | number | `0.7` | Ratio below which → high mode |
| `dialRatioThresholdFlat` | number | `2.0` | Ratio above which → flat mode |
| `captionUnitScale` | number | `0.8` | Caption/unit size relative to value |
| `disconnect` | boolean | `false` | Show "NO DATA" overlay |

## Dial Drawing (via IC)

Angle convention: 0° = North (top), clockwise positive, range ±180.

| Element | IC Function | Parameters |
|---|---|---|
| Ring | `IC.drawRing` | full circle, lineWidth 1 |
| Layline starboard | `IC.drawAnnularSector` | `layMin→layMax`, `fillStyle: "#82b683"` |
| Layline port | `IC.drawAnnularSector` | `-layMax→-layMin`, `fillStyle: "#ff7a76"` |
| Wind pointer | `IC.drawPointerAtRim` | `angle`, variant "long", sideFactor 0.25, lengthFactor 2, color "#ff2b2b" |
| Ticks | `IC.drawTicks` | -180→180, major 30°, minor 10°, includeEnd |
| Labels | `IC.drawLabels` | -180→180, step 30°, endpoints filtered out |

If IC is not available: dial renders empty (graceful fallback, no crash).

## Layout Modes

```
ratio = W / H
ratio < dialRatioThresholdNormal (0.7)  →  "high"
ratio > dialRatioThresholdFlat   (2.0)  →  "flat"
else                                    →  "normal"
```

### Dual-Value Display

WindDial always shows two value groups: **angle** (left side) and **speed** (right side).

**flat** — Side strips next to dial:

```
[AngleCap]  [         ]  [SpeedCap]
[AngleVal]  [  DIAL   ]  [SpeedVal]
[AngleUni]  [         ]  [SpeedUni]
```

Left strip: angle caption (top), angle value+unit (bottom). Right strip: speed caption (top), speed value+unit (bottom). Value+unit measured first; caption capped at `valuePx × secScale`.

**high** — Inline rows above/below dial:

```
[AngleCap  AngleVal  AngleUnit]   ← top row
[          DIAL              ]
[SpeedCap  SpeedVal  SpeedUnit]   ← bottom row
```

Binary search fits caption+value+unit inline per row.

**normal** — Three-row blocks inside dial circle:

```
         [AngleCap | SpeedCap]
  inside [AngleVal | SpeedVal]
  circle [AngleUni | SpeedUni]
```

Two half-width columns (left=right-aligned angle, right=left-aligned speed). Optimal text height found by iterating over possible block heights and maximizing value font size within the safe inscribed rectangle.

## Internal Value Formatting

| Function | Input | Output |
|---|---|---|
| `formatAngle180(v, leadingZero)` | angle (degrees) | String ±180 (e.g. "-045", "135") |
| `formatSpeed(v, unit)` | speed (m/s) | String via `avnav.api.formatter.formatSpeed` or fallback |

## Shared Internal Functions (duplicated from other modules)

`setFont`, `clamp`, `isFiniteN`, `fitTextPx`, `measureValueUnitFit`, `drawValueUnitWithFit`, `drawCaptionMax`, `drawThreeRowsBlock`, `fitInlineCapValUnit` — identical to CompassGauge versions.

## Exports

```javascript
return {
  id: "WindDial",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction      // no-op (returns {}); ClusterHost handles translation
};
```

## File Location

`modules/WindDial/WindDial.js`

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md) — IC function reference
- [../architecture/cluster-system.md](../architecture/cluster-system.md) — Wind cluster dispatch
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md) — Layline colors
