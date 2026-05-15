# Guide: Create a New Linear Gauge

**Status:** ✅ Implemented | Profile playbooks for shipped Speed/Depth/Temperature/Voltage/Wind/Compass linear kinds

## Prerequisites

Read first:

- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

## Overview

Linear gauges should be thin wrappers over `LinearGaugeEngine`.
Cluster host registration remains `renderHtml`; linear canvas wrappers run on internal `surface: "canvas-dom"` routes.
Route selection lives in `config.clusterRoutes.byRouteId`; it owns `mapperId`, `rendererId`, `surface`, optional `viewModelId`, and `shellSizing`.

Select a profile first, then keep the wrapper focused on formatter, ticks, axis mode, and sectors.

Responsive ownership:

- `ResponsiveScaleProfile` is consumed by `LinearGaugeLayout`, not by wrapper widgets.
- `GeometryScale` converts the linear primary dimension into graphical pixels; wrapper widgets do not scale linework directly.
- `LinearGaugeEngine` exposes layout-owned `state.responsive`, `state.textFillScale`, and `state.compactGeometryScale` to hooks and shared text helpers.
- Do not add wrapper-local user-visible responsive `Math.max(...)` / `clamp(...)` floors or import `ResponsiveScaleProfile` directly in linear wrappers.

## Step 0: Choose Profile

| Profile | `axisMode` | Typical kinds | Domain | Sector style |
|---|---|---|---|---|
| Range high-end | `range` | `sogLinear`, `stwLinear` | Editable `min/max` | Warning/Alarm near max |
| Range low-end | `range` | `depthLinear`, `voltageLinear` | Editable `min/max` | Alarm/Warning near min |
| Range optional high-end | `range` | `tempLinear` | Editable `min/max` | Optional high-end thresholds |
| Centered wind-angle | `centered180` | `angleTrueLinear`, `angleApparentLinear` | Fixed `-180..180` | Optional mirrored laylines |
| Fixed compass | `fixed360` | `hdtLinear`, `hdmLinear` | Fixed `0..360` | Usually none |

## Step 1: Create Wrapper Module

Create `widgets/linear/NewLinearWidget/NewLinearWidget.js` with UMD + `create(def, componentContext)`.

Use `SpeedLinearWidget` as reference and delegate to `LinearGaugeEngine`.

Existing advanced references:

- `CompassLinearWidget` (fixed center pointer + moving `0..360` scale + waypoint marker)
- `WindLinearWidget` (dual angle/speed text + mirrored layline sectors)

Responsive ownership rule:

- Let `LinearGaugeLayout` own insets, track/text rectangles, and compact sizing.
- Keep wrapper hooks on display formatting, tick policy, sector policy, and any truly widget-specific draw callbacks.

```javascript
const engine = componentContext.components.require("LinearGaugeEngine");
const valueMath = componentContext.components.require("ValueMath");

function formatDisplay(raw, props, unit) {
  const n = raw == null ? NaN : Number(raw);
  if (!isFinite(n)) return { num: NaN, text: "---" };
  const out = String(componentContext.format.applyFormatter(n, {
    formatter: "formatDecimal",
    formatterParameters: [3, 1, true],
    default: "---"
  }));
  const text = valueMath.extractNumberText(out);
  const numeric = Number(text);
  return isFinite(numeric) ? { num: numeric, text: text } : { num: NaN, text: "---" };
}
```

## Step 2: Configure `createRenderer(spec)`

### A) Range profile template

For config-backed plugin wrappers, pass `rangeProps` and `ratioProps` only. `rangeDefaults` and `ratioDefaults` stay available for non-config consumers, but plugin wrappers should trust the editable/default pipeline instead of duplicating those literals.

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "value",
  unitDefault: "m",
  axisMode: "range",
  rangeProps: { min: "depthLinearMinValue", max: "depthLinearMaxValue" },
  tickProps: {
    major: "depthLinearTickMajor",
    minor: "depthLinearTickMinor",
    showEndLabels: "depthLinearShowEndLabels"
  },
  ratioProps: {
    normal: "depthLinearRatioThresholdNormal",
    flat: "depthLinearRatioThresholdFlat"
  },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

### B) Centered wind-angle template

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "angle",
  unitDefault: "deg",
  axisMode: "centered180",
  tickProps: {
    major: "windAngleLinearTickMajor",
    minor: "windAngleLinearTickMinor",
    showEndLabels: "windAngleLinearShowEndLabels"
  },
  ratioProps: {
    normal: "windAngleLinearRatioThresholdNormal",
    flat: "windAngleLinearRatioThresholdFlat"
  },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

### C) Fixed compass template

```javascript
const renderCanvas = engine.createRenderer({
  rawValueKey: "heading",
  unitDefault: "deg",
  axisMode: "fixed360",
  tickProps: {
    major: "compassLinearTickMajor",
    minor: "compassLinearTickMinor",
    showEndLabels: "compassLinearShowEndLabels"
  },
  ratioProps: {
    normal: "compassLinearRatioThresholdNormal",
    flat: "compassLinearRatioThresholdFlat"
  },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

## Step 3: Add Editable Parameters

Add new kind(s) in `config/shared/kind-defaults.js` and cluster `kind` lists.

Use gauge-prefixed editable keys:

- Ratio thresholds: `{gauge}LinearRatioThresholdNormal`, `{gauge}LinearRatioThresholdFlat`
- Ticks: `{gauge}LinearTickMajor`, `{gauge}LinearTickMinor`, `{gauge}LinearShowEndLabels`
- Range domain: `{gauge}LinearMinValue`, `{gauge}LinearMaxValue`
- High/low-end sectors: `{gauge}LinearWarningEnabled`, `{gauge}LinearAlarmEnabled`, `{gauge}LinearWarningFrom`, `{gauge}LinearAlarmFrom`
- Wind mirrored sectors: `{gauge}LinearLayEnabled`, `{gauge}LinearLayMin`, `{gauge}LinearLayMax`

Only expose keys relevant for the selected kind via `condition`.

## Step 4: Register Component

1. `config/components/registry-widgets-gauge.js`
- Add `NewLinearWidget` entry

If the linear gauge needs a new renderer component, register that component in the relevant `config/components/registry-*.js` fragment and keep its shadow CSS with the component.

## Step 5: Add Route Metadata

Update `config/cluster-routes/<cluster>.js` so `config.clusterRoutes.byRouteId[routeId]` points at the route.

Set:

- `mapperId` to the cluster mapper
- `rendererId` to `"NewLinearWidget"` or an existing renderer
- `surface` to `"canvas-dom"`
- optional `viewModelId`
- `shellSizing`

Do not add ad hoc router, catalog, or renderer-props wiring here; route metadata plus `ClusterWidget`, `RouteActivationController`, and `RouteActivationPayloadBuilder` own the live route selection.

## Step 6: Mapper Wiring

Keep mapper declarative (`create` + `translate`).

```javascript
if (p.kind === "depthLinear") {
  return {
    value: p.depth,
    caption: cap("depthLinear"),
    unit: unit("depthLinear"),
    formatter: "formatDecimal",
    formatterParameters: [3, 1, true],
    rendererProps: {
      depthLinearRatioThresholdNormal: num(p.depthLinearRatioThresholdNormal),
      depthLinearRatioThresholdFlat: num(p.depthLinearRatioThresholdFlat),
      depthLinearMinValue: num(p.depthLinearMinValue),
      depthLinearMaxValue: num(p.depthLinearMaxValue),
      depthLinearTickMajor: num(p.depthLinearTickMajor),
      depthLinearTickMinor: num(p.depthLinearTickMinor),
      depthLinearShowEndLabels: !!p.depthLinearShowEndLabels,
      captionUnitScale: num(p.captionUnitScale)
    }
  };
}
```

For `centered180` and `fixed360` kinds, omit `*MinValue` / `*MaxValue` props from mapper output.

## Step 7: Validate

Required checks:

- Wrapper unit test (`tests/widgets/linear/*LinearWidget.test.js`)
- Mapper test (`tests/cluster/mappers/*Mapper.test.js`)
- Cluster static config test updates (`tests/config/clusters/*.test.js`)
- Full gate: `npm run check:all`

Manual checks:

- Resize: `high`, `normal`, `flat`
- Pointer tracks value and clamps at axis edges
- Sector behavior matches selected profile
- Day/night colors are correct
- `disconnect === true` shows the shared state-screen (`GPS Lost`) on a cleared canvas (no gauge visible behind it)

## Checklist

- [ ] Kind defaults added in `config/shared/kind-defaults.js`
- [ ] Cluster `kind` select extended in `config/clusters/<cluster>.js`
- [ ] Editable parameter conditions added for new linear keys
- [ ] Wrapper module added in `widgets/linear/`
- [ ] Component registered in `config/components/registry-widgets-gauge.js`
- [ ] Route metadata updated in `config/cluster-routes/<cluster>.js`
- [ ] Mapper routes kind to expected props
- [ ] Formatter tuple docs updated for formatter-bearing kinds:
  - [../architecture/plugin-core-contracts.md](../architecture/plugin-core-contracts.md)
  - [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md)
  - [../avnav-api/core-key-catalog.md](../avnav-api/core-key-catalog.md)
- [ ] `npm run check:all` passes

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
