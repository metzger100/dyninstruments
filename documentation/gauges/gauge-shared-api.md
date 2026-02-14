# InstrumentComponents API Reference

**Status:** ✅ Implemented | `modules/Cores/InstrumentComponents.js`

## Overview

Reusable polar/arc math and Canvas 2D drawing primitives. Pure canvas — no DOM, no Helpers dependency. All angles are **degrees** in the public API, 0° = North, clockwise positive. Most drawing functions accept `opts.rotationDeg` and `opts.angleCfg` for runtime rotation (used by CompassGauge/WindDial for rotating cards).

## Module Registration

```javascript
// In MODULES (plugin.js)
InstrumentComponents: {
  js: BASE + "modules/Cores/InstrumentComponents.js",
  css: undefined,
  globalKey: "DyniInstrumentComponents"
}
```

No dependencies. All gauge/dial modules depend on it.

## Access Pattern

```javascript
// create() takes NO arguments (unlike other modules)
const IC = Helpers.getModule('InstrumentComponents')
        && Helpers.getModule('InstrumentComponents').create();
```

## API Style: opts-Object Pattern

**All IC drawing functions use an opts-object for optional parameters.** This differs from the duplicated positional-parameter functions inside the semicircle gauges (SpeedGauge, DepthGauge, TemperatureGauge, VoltageGauge). The two APIs are independent and not interchangeable.

Example — same concept, different signatures:
```javascript
// IC (opts-object):
IC.drawAnnularSector(ctx, cx, cy, rOuter, {
  startDeg: 300, endDeg: 350, thickness: 12, fillStyle: "#e7c66a"
});

// Gauge-local duplicate (positional):
drawAnnularSector(ctx, cx, cy, rOuter, thickness, startDeg, endDeg, fillStyle);
```

## Common opts Fields (Shared Across Drawing Functions)

| Field | Type | Default | Description |
|---|---|---|---|
| `rotationDeg` | number | `0` | Additional rotation in degrees (e.g. `-heading` for rotating compass card) |
| `angleCfg` | object | `{ zeroDegAt:"north", clockwise:true }` | Angle convention override |
| `alpha` | number | `1` | Canvas globalAlpha |
| `strokeStyle` | string | inherited | Stroke color |
| `fillStyle` | string | inherited | Fill color |
| `lineWidth` | number | `1` | Stroke width |

### angleCfg Object

| Field | Values | Default | Description |
|---|---|---|---|
| `zeroDegAt` | `"north"`, `"east"` | `"north"` | Where 0° points |
| `clockwise` | boolean | `true` | Positive angle direction |

## Complete Function Reference

### Category 1: Math / Angle Helpers

#### degToRad(deg) → number
Degrees to radians.

#### radToDeg(rad) → number
Radians to degrees.

#### norm360(deg) → number
Normalize to [0, 360). Returns input if not finite.

#### norm180(deg) → number
Normalize to [-180, 180). Returns input if not finite.

#### degToCanvasRad(deg, cfg?, rotationDeg?) → number
Convert degrees to Canvas 2D radians (where 0 rad = East, positive = CCW). Applies `rotationDeg` offset and `cfg` convention mapping internally.

### Category 2: Value ↔ Angle Mapping

#### valueToAngle(value, opts) → number
Maps a data value to arc angle in degrees.

| opts field | Type | Description |
|---|---|---|
| `min` | number | Value range minimum |
| `max` | number | Value range maximum |
| `startDeg` | number | Arc start angle (degrees) |
| `endDeg` | number | Arc end angle (degrees) |
| `clamp` | boolean | Clamp value to [min,max] (default `true`) |

Returns `NaN` if inputs not finite.

#### angleToValue(angleDeg, opts) → number
Inverse of `valueToAngle`. Same opts.

#### valueRangeToAngleRange(v0, v1, opts) → { a0, a1 }
Convenience wrapper. Calls `valueToAngle` for both values. Returns degrees.

### Category 3: Tick Generation

#### buildTickAngles(opts) → { majors: number[], minors: number[] }
Generates tick angle arrays along an arc.

| opts field | Type | Default | Description |
|---|---|---|---|
| `startDeg` | number | `0` | Arc start |
| `endDeg` | number | `360` | Arc end |
| `stepMajor` | number | `30` | Major tick interval (degrees) |
| `stepMinor` | number | `10` | Minor tick interval (degrees) |
| `includeEnd` | boolean | `false` | Include exact end angle as tick |
| `majorMode` | string | `"absolute"` | `"absolute"`: major if angle is multiple of stepMajor. `"relative"`: major if (angle−startDeg) is multiple |

### Category 4: Drawing Primitives

#### drawRing(ctx, cx, cy, r, opts?)
Full circle stroke.

| opts field | Type | Default |
|---|---|---|
| `strokeStyle` | string | inherited |
| `lineWidth` | number | `1` |
| `alpha` | number | `1` |
| `dash` | number[] | none |

#### drawArcRing(ctx, cx, cy, r, startDeg, endDeg, opts?)
Partial arc stroke between two angles.

| opts field | Type | Default |
|---|---|---|
| `rotationDeg` | number | `0` |
| `angleCfg` | object | north/CW |
| `strokeStyle` | string | inherited |
| `lineWidth` | number | `1` |
| `alpha` | number | `1` |
| `dash` | number[] | none |

#### drawAnnularSector(ctx, cx, cy, rOuter, opts)
Filled ring segment (sector). Used for warning/alarm bands.

| opts field | Type | Default | Description |
|---|---|---|---|
| `startDeg` | number | **required** | Sector start (degrees) |
| `endDeg` | number | **required** | Sector end (degrees) |
| `thickness` | number | `10` | Radial width (rOuter − rInner) |
| `rotationDeg` | number | `0` | |
| `angleCfg` | object | north/CW | |
| `fillStyle` | string | inherited | Sector color |
| `strokeStyle` | string | none | Optional outline |
| `lineWidth` | number | `0` | Outline width (`0` = no outline) |
| `alpha` | number | `1` | |

#### drawTicks(ctx, cx, cy, rOuter, opts)
High-level: generates ticks via `buildTickAngles` then draws them.

| opts field | Type | Default | Description |
|---|---|---|---|
| `startDeg` | number | `0` | Arc start |
| `endDeg` | number | `360` | Arc end |
| `stepMajor` | number | `30` | Major interval |
| `stepMinor` | number | `10` | Minor interval |
| `includeEnd` | boolean | `false` | |
| `majorMode` | string | `"absolute"` | |
| `major` | object | `{ len:8, width:2 }` | Major tick style |
| `minor` | object | `{ len:5, width:1 }` | Minor tick style |
| `rotationDeg` | number | `0` | |
| `angleCfg` | object | north/CW | |
| `lineCap` | string | `"butt"` | |
| `strokeStyle` | string | inherited | |
| `alpha` | number | `1` | |

#### drawTicksFromAngles(ctx, cx, cy, rOuter, angles, opts)
Low-level: draws pre-computed tick arrays. `angles` = `{ majors: number[], minors: number[] }`. Same opts as `drawTicks` except no generation opts.

#### drawLabels(ctx, cx, cy, rOuter, opts)
Draws text labels along an arc.

| opts field | Type | Default | Description |
|---|---|---|---|
| `angles` | number[] | (generated) | Explicit label positions. If omitted, generates from startDeg/endDeg/step |
| `startDeg` | number | `0` | (only if `angles` omitted) |
| `endDeg` | number | `360` | (only if `angles` omitted) |
| `step` | number | `30` | (only if `angles` omitted) |
| `includeEnd` | boolean | `false` | |
| `radiusOffset` | number | `16` | Inward offset from rOuter for label center |
| `fontPx` | number | `11` | Font size (min 6) |
| `bold` | boolean | `true` | Font weight 700 vs 400 |
| `family` | string | `"sans-serif"` | Font family |
| `labelsMap` | object | `null` | `{ deg: "text" }` lookup (highest priority) |
| `labelFormatter` | function | `deg → String(deg)` | Fallback: converts degree to text |
| `labelFilter` | function | `() → true` | Skip label if returns false |
| `textRotation` | string | `"upright"` | `"upright"`, `"tangent"`, `"radial"` |
| `rotationDeg` | number | `0` | |
| `angleCfg` | object | north/CW | |
| `fillStyle` | string | inherited | |
| `alpha` | number | `1` | |

#### drawArrow(ctx, cx, cy, r, angleDeg, opts)
Line arrow with arrowhead pointing outward.

| opts field | Type | Default |
|---|---|---|
| `tail` | number | `12` (start distance from center) |
| `head` | number | `8` (arrowhead size) |
| `width` | number | `2` (line width) |
| `rotationDeg` | number | `0` |
| `angleCfg` | object | north/CW |
| `strokeStyle` | string | inherited |
| `alpha` | number | `1` |

#### drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts)
Filled triangular needle at the outer rim. **This is the only IC function currently used by the semicircle gauges.**

| opts field | Type | Default | Description |
|---|---|---|---|
| `depth` | number | `max(8, floor(rOuter×0.10))` | Penetration depth into ring |
| `variant` | string | `"normal"` | `"normal"` or `"long"` (1.4× depth) |
| `lengthFactor` | number | none | Multiplier on depth (applied after variant) |
| `sideFactor` | number | `0.65` normal / `0.80` long | Base width ratio |
| `color` | string | `"#ff2b2b"` | Fill color (also accepts `fillStyle`) |
| `rotationDeg` | number | `0` | |
| `angleCfg` | object | north/CW | |
| `alpha` | number | `1` | |

Standard semicircle gauge call:
```javascript
IC.drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, {
  depth: needleDepth,
  color: "#ff2b2b",
  variant: "long",
  sideFactor: 0.25,
  lengthFactor: 2
});
```

#### drawRimMarker(ctx, cx, cy, rOuter, angleDeg, opts)
Non-filled marker line at the rim edge.

| opts field | Type | Default |
|---|---|---|
| `len` | number | `12` |
| `width` | number | `3` |
| `rotationDeg` | number | `0` |
| `angleCfg` | object | north/CW |
| `strokeStyle` | string | inherited |
| `alpha` | number | `1` |

### Category 5: Convenience

#### drawDialFrame(ctx, cx, cy, rOuter, opts)
All-in-one: ring + ticks + labels. Sub-options passed via nested objects.

| opts field | Type | Description |
|---|---|---|
| `rotationDeg` | number | Applied to ticks and labels (unless overridden) |
| `ring` | object or `false` | Options for `drawRing`. `false` = skip ring |
| `ticks` | object | Options for `drawTicks` |
| `labels` | object | Options for `drawLabels` |

## Usage by Module

| Module | IC Functions Used |
|---|---|
| **CompassGauge** | `drawRing`, `drawTicks`, `drawPointerAtRim`, `drawRimMarker`, `drawLabels` |
| **WindDial** | `drawRing`, `drawAnnularSector`, `drawPointerAtRim`, `drawTicks`, `drawLabels` |
| **SpeedGauge** | `drawPointerAtRim` only |
| **DepthGauge** | `drawPointerAtRim` only |
| **TemperatureGauge** | `drawPointerAtRim` only |
| **VoltageGauge** | `drawPointerAtRim` only |

## Duplicated Functions in Semicircle Gauges

The 4 semicircle gauges (Speed, Depth, Temperature, Voltage) each contain many local functions that duplicate functionality also available in IC but with **positional parameters instead of opts-objects**. These local copies handle arc drawing, sectors, ticks, labels, and text layout. They do **not** call IC for any of this — only `drawPointerAtRim` is delegated to IC.

Affected duplicated functions per gauge: `setFont`, `clamp`, `isFiniteN`, `deg2rad`, `toCanvasAngleRad`, `drawDisconnectOverlay`, `fitTextPx`, `niceTickSteps`, `almostInt`, `extractNumberText`, `drawArcRing`, `drawAnnularSector`, `drawTicksFromAngles`, `drawLabelsForMajorValues`, `buildValueTickAngles`, `sectorAngles`, `measureValueUnitFit`, `drawCaptionMax`, `drawValueUnitWithFit`, `fitInlineCapValUnit`, `drawThreeRowsBlock`, `drawPointerAtRimFallback` (dead code — never executes).

**These are not wrappers around IC.** They are independent implementations with a simpler positional-parameter API. Consolidating them is a future refactoring task.

## File Location

`modules/Cores/InstrumentComponents.js`

## Related

- [gauge-style-guide.md](gauge-style-guide.md) — Visual specification for semicircle gauges
- [../architecture/module-system.md](../architecture/module-system.md) — Module registration
- [../shared/helpers.md](../shared/helpers.md) — Helpers.getModule() access pattern
