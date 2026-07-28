# Gauge Shared API

**Status:** ✅ Implemented | split gauge utility modules + `RadialToolkit` facade

## Overview

Shared gauge logic is split into focused core modules:

- `RadialAngleMath` for angle math and value/angle mapping
- `RadialTickMath` for major/minor tick angle generation
- `RadialCanvasPrimitives` for low-level canvas primitives
- `RadialFrameRenderer` for radial tick/label/frame drawing
- `CanvasTextFitting` and `CanvasTextLayout` for generic text fitting/drawing
- `ValueMath` for generic numeric/range/display helpers
- `RadialTextLayout`, `RadialTextFitting`, and `RadialValueMath` as slim radial compatibility wrappers over canonical
  helpers
- `TextLayoutPrimitives` for binary-fit and inline draw primitives
- `TextLayoutComposite` for reusable multi-row text layouts
- `TextLayoutEngine` as text-layout facade (mode routing + cache + composed helpers)
- `runtime.theme` for plugin-wide CSS theme token resolution; components resolve snapshots via
  `componentContext.theme.tokens.resolveForRoot(rootEl)`
- `GaugeToolkit` as the generic gauge facade
- `RadialToolkit` as the radial facade extending `GaugeToolkit`
- `SemicircleRadialLayout` as shared responsive layout owner for Speed/Depth/Temperature/Voltage
- `SemicircleRadialTextLayout` as shared mode text helper for Speed/Depth/Temperature/Voltage
- `SemicircleRadialEngine` as shared render flow for Speed/Depth/Temperature/Voltage
- `FullCircleRadialLayout` as shared responsive layout owner for Compass/Wind dials
- `FullCircleRadialEngine` as shared render flow for Compass/Wind dials
- `FullCircleRadialTextLayout` as shared mode text helper for full-circle wrappers
- `GeometryScale` as the shared factor-to-pixel scaler for radial graphical geometry

## Key Details

- `GaugeToolkit.create(def, componentContext)` returns `{ theme, text, value }`;
  `RadialToolkit.create(def, componentContext)` returns `{ theme, text, value, angle, tick, draw }`.
- `RadialToolkit.draw` exposes `drawRing`, `drawArcRing`, `drawAnnularSector`, `drawArrow`, `drawPointerAtRim`,
  `drawRimMarker`, `drawTicksFromAngles`, `drawTicks`, `drawLabels`, `drawDialFrame`.
- `SemicircleRadialEngine.create(def, componentContext).createRenderer(spec)` and
  `FullCircleRadialEngine.create(def, componentContext).createRenderer(spec)` both return `renderCanvas(canvas, props)`.
- Semicircle `spec` fields: `rawValueKey`, `unitDefault`, `rangeDefaults`, `ratioProps`, `ratioDefaults`, `tickSteps`,
  `formatDisplay`, `buildSectors`, `arc` (default `{ startDeg: 270, endDeg: 450 }`); sector shape is
  `{ a0, a1, color }`.
- `ValueMath.resolveSemicircleTickSteps(range, profileName)` supports `profileName` `standard` | `temperature` |
  `voltage`, falling back to `standard` for unknown values.
- Full-circle `spec` fields include `ratioProps`, `ratioDefaults`, `cacheLayers`, `layout`, `buildStaticKey`,
  `rebuildLayer`, `drawFrame`, `drawMode`.
- All shared modules are registered by ID (e.g. `RadialAngleMath`, `RadialToolkit`, `SemicircleRadialEngine`,
  `FullCircleRadialEngine`) in the `config/components/registry-shared-*.js` files.

## Responsive Ownership Contract

- `ResponsiveScaleProfile` owns the shared `minDim -> t -> textFillScale` compaction curve.
- `SemicircleRadialLayout` and `FullCircleRadialLayout` map that curve into family-specific insets, slot bounds, label
  metrics, and text/layout spacing.
- `GeometryScale` turns the family primary dimension into ring, tick, and pointer pixels; radial primary dimension is
  radius.
- `SemicircleRadialEngine` and `SemicircleRadialTextLayout` expose layout-owned `responsive`, `textFillScale`, and
  `compactGeometryScale` directly on state; full-circle callbacks consume `state.responsive`, `state.textFillScale`, and
  `state.layout.compactGeometryScale`.
- `compactGeometryScale` only affects text/layout spacing and label sizing; it does not resize ring, tick, or pointer
  geometry.
- Wrapper widgets must not import `ResponsiveScaleProfile` or add widget-local user-visible responsive floors; compact
  policy stays in the layout owners.

## Module Registration

`config/components/registry-shared-foundation-format.js`, `config/components/registry-shared-foundation-geometry.js`,
`config/components/registry-shared-foundation-layout.js`, `config/components/registry-shared-foundation-state.js`, and
`config/components/registry-shared-engines.js` (assembled by `config/components.js`) register these shared modules:

```javascript
RadialAngleMath: { js: BASE + "shared/widget-kits/radial/RadialAngleMath.js", globalKey: "DyniRadialAngleMath" },
RadialTickMath: {
  js: BASE + "shared/widget-kits/radial/RadialTickMath.js",
  globalKey: "DyniRadialTickMath",
  deps: ["RadialAngleMath"]
},
RadialCanvasPrimitives: {
  js: BASE + "shared/widget-kits/radial/RadialCanvasPrimitives.js",
  globalKey: "DyniRadialCanvasPrimitives",
  deps: ["RadialAngleMath"]
},
RadialFrameRenderer: {
  js: BASE + "shared/widget-kits/radial/RadialFrameRenderer.js",
  globalKey: "DyniRadialFrameRenderer",
  deps: ["RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives"]
},
ValueMath: { js: BASE + "shared/widget-kits/value/ValueMath.js", globalKey: "DyniValueMath" },
CanvasTextFitting: { js: BASE + "shared/widget-kits/text/CanvasTextFitting.js", globalKey: "DyniCanvasTextFitting", deps: ["ValueMath"] },
CanvasTextLayout: { js: BASE + "shared/widget-kits/text/CanvasTextLayout.js", globalKey: "DyniCanvasTextLayout", deps: ["CanvasTextFitting"] },
RadialTextLayout: { js: BASE + "shared/widget-kits/radial/RadialTextLayout.js", globalKey: "DyniRadialTextLayout", deps: ["CanvasTextLayout"] },
RadialSectorMath: { js: BASE + "shared/widget-kits/radial/RadialSectorMath.js", globalKey: "DyniRadialSectorMath", deps: ["RadialAngleMath", "ValueMath"] },
RadialValueMath: { js: BASE + "shared/widget-kits/radial/RadialValueMath.js", globalKey: "DyniRadialValueMath", deps: ["RadialAngleMath", "ValueMath", "RadialSectorMath"] },
TextLayoutPrimitives: {
  js: BASE + "shared/widget-kits/text/TextLayoutPrimitives.js",
  globalKey: "DyniTextLayoutPrimitives",
  deps: ["CanvasTextLayout"]
},
TextLayoutComposite: {
  js: BASE + "shared/widget-kits/text/TextLayoutComposite.js",
  globalKey: "DyniTextLayoutComposite",
  deps: ["TextLayoutPrimitives"]
},
TextLayoutEngine: {
  js: BASE + "shared/widget-kits/text/TextLayoutEngine.js",
  globalKey: "DyniTextLayoutEngine",
  deps: ["ValueMath", "TextLayoutPrimitives", "TextLayoutComposite", "ResponsiveScaleProfile"]
},
GaugeToolkit: {
  js: BASE + "shared/widget-kits/gauge/GaugeToolkit.js",
  globalKey: "DyniGaugeToolkit",
  deps: ["CanvasTextLayout", "ValueMath"]
},
RadialToolkit: {
  js: BASE + "shared/widget-kits/radial/RadialToolkit.js",
  globalKey: "DyniRadialToolkit",
  deps: ["GaugeToolkit", "RadialAngleMath", "RadialTickMath", "RadialCanvasPrimitives", "RadialFrameRenderer"]
},
SemicircleRadialLayout: {
  js: BASE + "shared/widget-kits/radial/SemicircleRadialLayout.js",
  globalKey: "DyniSemicircleRadialLayout",
  deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
},
SemicircleRadialTextLayout: {
  js: BASE + "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
  globalKey: "DyniSemicircleRadialTextLayout"
},
SemicircleRadialEngine: {
  js: BASE + "shared/widget-kits/radial/SemicircleRadialEngine.js",
  globalKey: "DyniSemicircleRadialEngine",
  deps: ["RadialToolkit", "CanvasLayerCache", "SemicircleRadialLayout", "SemicircleRadialTextLayout"]
},
FullCircleRadialLayout: {
  js: BASE + "shared/widget-kits/radial/FullCircleRadialLayout.js",
  globalKey: "DyniFullCircleRadialLayout",
  deps: ["ResponsiveScaleProfile", "LayoutRectMath"]
},
FullCircleRadialEngine: {
  js: BASE + "shared/widget-kits/radial/FullCircleRadialEngine.js",
  globalKey: "DyniFullCircleRadialEngine",
  deps: ["RadialToolkit", "CanvasLayerCache", "FullCircleRadialLayout"]
},
FullCircleRadialTextLayout: {
  js: BASE + "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
  globalKey: "DyniFullCircleRadialTextLayout"
}
```

## Access Pattern

```javascript
const gaugeUtils = componentContext.components.require("RadialToolkit");
const valueMath = componentContext.components.require("ValueMath");
const renderer = componentContext.components.require("SemicircleRadialEngine");
const fullCircle = componentContext.components.require("FullCircleRadialEngine");
```

## GaugeToolkit And RadialToolkit Facades

`GaugeToolkit.create(def, componentContext)` returns:

| Field   | Type   | Description                         |
| ------- | ------ | ----------------------------------- |
| `theme` | object | `componentContext.theme.tokens` API |
| `text`  | object | `CanvasTextLayout` API              |
| `value` | object | `ValueMath` API                     |

`RadialToolkit.create(def, componentContext)` returns:

| Field   | Type   | Description                                                         |
| ------- | ------ | ------------------------------------------------------------------- |
| `theme` | object | `componentContext.theme.tokens.resolveForRoot(rootEl)` snapshot API |
| `text`  | object | `CanvasTextLayout` API inherited from `GaugeToolkit`                |
| `value` | object | `ValueMath` API inherited from `GaugeToolkit`                       |
| `angle` | object | `RadialAngleMath` API                                               |
| `tick`  | object | `RadialTickMath` API                                                |
| `draw`  | object | merged API from `RadialCanvasPrimitives` + `RadialFrameRenderer`    |

Color-token flow:

- Resolve once per render path with `const tokens = componentContext.theme.tokens.resolveForRoot(rootEl);`.
- Pass resolved token object down to sector builders and draw helpers where needed.

## Draw API (`RadialToolkit.draw`)

| Function              | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `drawRing`            | Draw full circular ring                                       |
| `drawArcRing`         | Draw stroked arc segment                                      |
| `drawAnnularSector`   | Draw filled annular sector                                    |
| `drawArrow`           | Draw line arrow                                               |
| `drawPointerAtRim`    | Draw triangular pointer at rim                                |
| `drawRimMarker`       | Draw short radial marker at rim                               |
| `drawTicksFromAngles` | Draw major/minor ticks from angle lists                       |
| `drawTicks`           | Build and draw ticks from step config                         |
| `drawLabels`          | Draw labels on arc/circle (`opts.weight` numeric font weight) |
| `drawDialFrame`       | Convenience ring + ticks + labels                             |

`draw.drawPointerAtRim(..., opts)` consumes scalar style inputs (`opts.fillStyle` or `opts.color`) plus precomputed
geometry inputs (`opts.depth`, `opts.halfWidth`). `draw.drawRimMarker(..., opts)` consumes precomputed geometry inputs
(`opts.len`, `opts.width`). `draw.drawLabels(..., opts)` consumes numeric font weight via `opts.weight`.

## Related

- [gauge-shared-api-reference.md](gauge-shared-api-reference.md) — Angle/Tick/Canvas-text/ValueMath/TextLayoutEngine
  function tables and the full Semicircle/FullCircle `spec` field contracts
- [../widgets/semicircle-gauges.md](../widgets/semicircle-gauges.md)
- [../guides/add-new-gauge.md](../guides/add-new-gauge.md)
- [../architecture/component-system.md](../architecture/component-system.md)
