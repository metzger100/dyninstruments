# Guide: Create a New Semicircle Gauge

**Status:** ✅ Ready | Current workflow with `SemicircleRadialEngine` + ClusterWidget registries

## Prerequisites

Read first:

- [../radial/gauge-style-guide.md](../radial/gauge-style-guide.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

## Overview

New semicircle gauges should be thin wrappers over `SemicircleRadialEngine`. Keep gauge modules focused on formatting,
tick strategy, and sector strategy. Cluster host registration stays `renderHtml`; canvas gauge wrappers are mounted
through the internal `canvas-dom` surface. Route selection lives in `config.clusterRoutes.byRouteId`; it owns
`mapperId`, `rendererId`, `surface`, optional `viewModelId`, and `shellSizing`.

For linear instruments, use [add-new-linear-gauge.md](add-new-linear-gauge.md) and `LinearGaugeEngine`.

## Step 1: Create Gauge Module

Create `widgets/radial/NewGaugeWidget/NewGaugeWidget.js`:

1. UMD wrapper + `create(def, componentContext)`
2. Resolve shared renderer: `componentContext.components.require("SemicircleRadialEngine")`
3. Respect responsive ownership:
   - `SemicircleRadialLayout` already consumes `ResponsiveScaleProfile` and owns compact geometry/text boxes for the
     family.
   - Keep wrapper code thin; do not import `ResponsiveScaleProfile` and do not add user-visible responsive
     `Math.max(...)` / `clamp(...)` floors in wrapper code.
4. Provide gauge-specific functions only:
   - `formatDisplay(raw, props, unit, componentContext) -> { num, text }`
   - `tickSteps(range) -> { major, minor }`
   - `buildSectors(props, minV, maxV, arc, valueUtils, theme) -> Sector[]` Pass `warningColor`/`alarmColor` scalars into
     shared sector builders (typically from `theme.colors.warning`/`theme.colors.alarm`).
5. Build `renderCanvas` with `createRenderer(spec)`

```javascript
const renderer = componentContext.components.require("SemicircleRadialEngine");

const renderCanvas = renderer.createRenderer({
  rawValueKey: "newValueKey",
  unitDefault: "unit",
  ratioProps: {
    normal: "newGaugeRatioThresholdNormal",
    flat: "newGaugeRatioThresholdFlat"
  },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

For config-backed plugin wrappers, do not add `rangeDefaults` or `ratioDefaults` here. The shared engine already owns
the last-resort fallback, and normal plugin runtime should receive min/max and threshold props from the editable/default
config boundary.

6. Export module spec:

```javascript
return {
  id: "NewGaugeWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction
};
```

## Step 2: Register Module in `config/components/registry-widgets-gauge.js`

Add module entry:

```javascript
NewGaugeWidget: {
  js: BASE + "widgets/radial/NewGaugeWidget/NewGaugeWidget.js",
  css: undefined,
  globalKey: "DyniNewGaugeWidget",
  deps: ["SemicircleRadialEngine"]
}
```

## Step 3: Add Route Metadata

If `ClusterWidget` should render this gauge, update the route entry in `config/cluster-routes/<cluster>.js`:

1. set `mapperId` to the cluster mapper
2. set `rendererId` to `"NewGaugeWidget"`
3. set `surface` to `"canvas-dom"`
4. set `shellSizing` to the route's pre-activation shell contract

If this gauge needs a new renderer component, register that component in the relevant `config/components/registry-*.js`
fragment and keep its shadow CSS with the component.

## Step 4: Route Data via Mapper Module

Update the relevant cluster mapper module (`cluster/mappers/*.js`) so translation emits:

```javascript
return {
  value: p.someValue,
  caption: cap("someRadialKind"),
  unit: unit("someRadialKind")
  // gauge props: minValue, maxValue, tickMajor, tickMinor, warningFrom, alarmFrom, ...
};
```

Do not edit `ClusterWidget.js` for kind-specific translation logic. Do not move layout, compact-geometry, or
responsive-floor logic into mapper files.

## Step 5: Verify

- Resize to trigger `flat`, `normal`, `high`
- Pointer tracks displayed numeric value
- Warning/alarm sectors render correctly
- Day/night colors update
- Disconnect handling works as implemented by the new gauge renderer

## Checklist

- [ ] Gauge wrapper created in `widgets/radial/NewGaugeWidget/NewGaugeWidget.js`
- [ ] Module registered in `config/components/registry-widgets-gauge.js`
- [ ] Route metadata updated in `config/cluster-routes/<cluster>.js`
- [ ] Mapper module emits route props and expected values
- [ ] Visual + resize behavior validated

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../widgets/semicircle-gauges.md](../widgets/semicircle-gauges.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
