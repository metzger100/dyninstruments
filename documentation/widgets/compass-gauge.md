# CompassGaugeWidget Module

**Status:** ✅ Implemented | `widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js`

## Overview

Full-circle rotating compass card with upright cardinal labels. The dial rotates by `-heading`; the lubber pointer stays fixed at North. Optional target marker (`markerCourse`) is supported.
Pointer color is resolved once per render via `FullCircleDialEngine` (`GaugeToolkit.theme.resolve(canvas)` internally).
Static dial rendering is cached via shared `CanvasLayerCache` managed by `FullCircleDialEngine`.

## Module Registration

```javascript
// In config/components.js
CompassGaugeWidget: {
  js: BASE + "widgets/gauges/CompassGaugeWidget/CompassGaugeWidget.js",
  css: undefined,
  globalKey: "DyniCompassGaugeWidget",
  deps: ["FullCircleDialEngine", "FullCircleDialTextLayout"]
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `heading` | number | — | Heading (0..360) |
| `markerCourse` | number | — | Optional rim marker target |
| `caption` | string | `""` | Caption text |
| `unit` | string | `"°"` | Unit text |
| `leadingZero` | boolean | `true` | Zero-pad heading |
| `compRatioThresholdNormal` | number | `0.8` | Ratio below -> `high` |
| `compRatioThresholdFlat` | number | `2.2` | Ratio above -> `flat` |
| `captionUnitScale` | number | `0.8` | Caption/unit ratio vs value |
| `default` | string | `"---"` | Fallback text for invalid heading |
| `disconnect` | boolean | `false` | Draw `NO DATA` overlay |

## Compass Dial Drawing (via `GaugeToolkit.draw`)

The rotating dial face cache is built from static inputs. At render time, `heading` is applied as a draw transform (`rotationDeg = -heading`) without invalidating static cache state.

| Element | Draw Function | Parameters |
|---|---|---|
| Ring (cached face) | `draw.drawRing` | full circle |
| Ticks (cached face) | `draw.drawTicks` | `0..360`, major 30, minor 10 |
| Lubber pointer | `draw.drawPointerAtRim` | fixed at 0°, with `fillStyle: theme.colors.pointer` (default `#ff2b2b`) |
| Target marker | `draw.drawRimMarker` | at `(markerCourse - heading)` if both finite |
| Cardinal labels | cached label sprites | existing label set (`N/NE/E/SE/S/SW/W/NW`), rendered upright at heading-rotated positions |

Rendering order keeps labels on top for readability.

## Background Cache Behavior

### Cached Static Assets

- Rotating face bitmap: ring + ticks
- Cardinal label sprites: prerendered text glyphs stored in engine cache metadata

### Dynamic Per-Frame Layer

- Heading rotation application for the cached face (`drawCachedLayer(..., {rotationDeg})`)
- Fixed lubber pointer
- Optional target marker
- Live value text + `disconnect` overlay

### Rotation Model

- `heading` changes only alter draw transforms and label placement math.
- `heading` is explicitly excluded from the static cache key.

### Cache Key Inputs (static-only)

- Pixel buffer dimensions (`canvas.width`, `canvas.height`) and effective DPR mapping
- Dial/tick geometry and static style inputs
- Label geometry inputs (font px, label radius)
- Resolved typography/style inputs (`family`, `labelWeight`, resolved text color)
- Label-set signature (current fixed cardinal label map)

### Invalidation Triggers

- Canvas geometry/buffer size changes
- Dial geometry changes from size/theme style shifts
- Static style/token/typography changes
- Label sprite geometry/style changes

### Non-Triggers

- `heading` updates
- `markerCourse`, live value/caption/unit updates
- `disconnect` toggle

## Layout Modes

```text
ratio = W / H
ratio < compRatioThresholdNormal -> high
ratio > compRatioThresholdFlat -> flat
otherwise -> normal
```

### Single-Value Display

`flat`: left strip with caption (top) + value/unit (bottom)

`normal`: centered 3-row block inside dial

`high`: one inline row above dial

## Internal Value Formatting

| Function | Input | Output |
|---|---|---|
| `GaugeValueMath.formatDirection360(v, leadingZero)` | heading deg | `0..359` string |

## Exports

```javascript
return {
  id: "CompassGaugeWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction // no-op, ClusterWidget handles translation
};
```

## Related

- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../gauges/full-circle-dial-engine.md](../gauges/full-circle-dial-engine.md)
- [../gauges/full-circle-dial-style-guide.md](../gauges/full-circle-dial-style-guide.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../shared/theme-tokens.md](../shared/theme-tokens.md)
