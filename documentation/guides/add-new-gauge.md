# Guide: Create a New Semicircle Gauge

**Status:** ✅ Ready | Current workflow with `SemicircleGaugeRenderer` + ClusterHost registries

## Prerequisites

Read first:

- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../architecture/module-system.md](../architecture/module-system.md)
- [../architecture/cluster-system.md](../architecture/cluster-system.md)

## Overview

New semicircle gauges should be thin wrappers over `SemicircleGaugeRenderer`. Keep gauge modules focused on formatting, tick strategy, and sector strategy.

## Step 1: Create Gauge Module

Create `modules/NewGauge/NewGauge.js`:

1. UMD wrapper + `create(def, Helpers)`
2. Resolve shared renderer: `Helpers.getModule("SemicircleGaugeRenderer").create(def, Helpers)`
3. Provide gauge-specific functions only:
- `formatDisplay(raw, props, unit, Helpers) -> { num, text }`
- `tickSteps(range) -> { major, minor }`
- `buildSectors(props, minV, maxV, arc, valueUtils) -> Sector[]`
4. Build `renderCanvas` with `createRenderer(spec)`

```javascript
const rendererModule = Helpers.getModule("SemicircleGaugeRenderer");
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

## Step 2: Register Module in `config/modules.js`

Add module entry:

```javascript
NewGauge: {
  js: BASE + "modules/NewGauge/NewGauge.js",
  css: undefined,
  globalKey: "DyniNewGauge",
  deps: ["SemicircleGaugeRenderer"]
}
```

## Step 3: Wire ClusterHost Renderer Registry

If `ClusterHost` should render this gauge, update both declaration and runtime selection:

1. `config/modules.js`: add `"NewGauge"` to `ClusterHostRendererRegistry.deps`
2. `modules/ClusterHost/Core/RendererRegistry.js`:
- instantiate the new spec in `create()`
- include it in `subSpecs`
- route `props.renderer === "NewGauge"` in `pickRenderer()`

## Step 4: Route Data via Dispatch Module

Update the relevant cluster dispatch module (`modules/ClusterHost/Dispatch/*.js`) so translation emits:

```javascript
return {
  renderer: "NewGauge",
  value: p.someValue,
  caption: cap("someGraphicKind"),
  unit: unit("someGraphicKind"),
  // gauge props: minValue, maxValue, tickMajor, tickMinor, warningFrom, alarmFrom, ...
};
```

Do not edit `ClusterHost.js` for kind-specific translation logic.

## Step 5: Verify

- Resize to trigger `flat`, `normal`, `high`
- Pointer tracks displayed numeric value
- Warning/alarm sectors render correctly
- Day/night colors update
- Disconnect overlay works (`props.disconnect`)

## Checklist

- [ ] Gauge wrapper created in `modules/NewGauge/NewGauge.js`
- [ ] Module registered in `config/modules.js`
- [ ] Added to `ClusterHostRendererRegistry.deps` (if ClusterHost-rendered)
- [ ] Renderer wired in `modules/ClusterHost/Core/RendererRegistry.js`
- [ ] Dispatch module emits `renderer: "NewGauge"` and expected props
- [ ] Visual + resize behavior validated

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../modules/semicircle-gauges.md](../modules/semicircle-gauges.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
