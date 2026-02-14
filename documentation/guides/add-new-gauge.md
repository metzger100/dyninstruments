# Guide: Create a New Semicircle Gauge

**Status:** ✅ Ready | Current workflow with `SemicircleGaugeEngine` + ClusterWidget registries

## Prerequisites

Read first:

- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

## Overview

New semicircle gauges should be thin wrappers over `SemicircleGaugeEngine`. Keep gauge modules focused on formatting, tick strategy, and sector strategy.

## Step 1: Create Gauge Module

Create `widgets/NewGauge/NewGauge.js`:

1. UMD wrapper + `create(def, Helpers)`
2. Resolve shared renderer: `Helpers.getModule("SemicircleGaugeEngine").create(def, Helpers)`
3. Provide gauge-specific functions only:
- `formatDisplay(raw, props, unit, Helpers) -> { num, text }`
- `tickSteps(range) -> { major, minor }`
- `buildSectors(props, minV, maxV, arc, valueUtils) -> Sector[]`
4. Build `renderCanvas` with `createRenderer(spec)`

```javascript
const rendererModule = Helpers.getModule("SemicircleGaugeEngine");
const renderer = rendererModule && rendererModule.create(def, Helpers);

const renderCanvas = renderer.createRenderer({
  rawValueKey: "newValueKey",
  unitDefault: "unit",
  rangeDefaults: { min: 0, max: 100 },
  ratioProps: {
    normal: "newGaugeRatioThresholdNormal",
    flat: "newGaugeRatioThresholdFlat"
  },
  ratioDefaults: { normal: 1.1, flat: 3.5 },
  tickSteps,
  formatDisplay,
  buildSectors
});
```

5. Export module spec:

```javascript
return {
  id: "NewGauge",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction
};
```

## Step 2: Register Module in `config/components.js`

Add module entry:

```javascript
NewGauge: {
  js: BASE + "widgets/NewGauge/NewGauge.js",
  css: undefined,
  globalKey: "DyniNewGauge",
  deps: ["SemicircleGaugeEngine"]
}
```

## Step 3: Wire ClusterWidget Renderer Registry

If `ClusterWidget` should render this gauge, update both declaration and runtime selection:

1. `config/components.js`: add `"NewGauge"` to `ClusterRendererRouter.deps`
2. `cluster/rendering/ClusterRendererRouter.js`:
- instantiate the new spec in `create()`
- include it in `subSpecs`
- route `props.renderer === "NewGauge"` in `pickRenderer()`

## Step 4: Route Data via Mapper Module

Update the relevant cluster mapper module (`cluster/mappers/*.js`) so translation emits:

```javascript
return {
  renderer: "NewGauge",
  value: p.someValue,
  caption: cap("someGraphicKind"),
  unit: unit("someGraphicKind"),
  // gauge props: minValue, maxValue, tickMajor, tickMinor, warningFrom, alarmFrom, ...
};
```

Do not edit `ClusterWidget.js` for kind-specific translation logic.

## Step 5: Verify

- Resize to trigger `flat`, `normal`, `high`
- Pointer tracks displayed numeric value
- Warning/alarm sectors render correctly
- Day/night colors update
- Disconnect overlay works (`props.disconnect`)

## Checklist

- [ ] Gauge wrapper created in `widgets/NewGauge/NewGauge.js`
- [ ] Module registered in `config/components.js`
- [ ] Added to `ClusterRendererRouter.deps` (if ClusterWidget-rendered)
- [ ] Renderer wired in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Mapper module emits `renderer: "NewGauge"` and expected props
- [ ] Visual + resize behavior validated

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../widgets/semicircle-gauges.md](../widgets/semicircle-gauges.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
