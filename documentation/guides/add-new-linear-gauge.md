# Guide: Create a New Linear Gauge

**Status:** ✅ Ready | Current workflow with `LinearGaugeEngine` + ClusterWidget registries

## Prerequisites

Read first:

- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

## Overview

New linear gauges should be thin wrappers over `LinearGaugeEngine`. Keep widget modules focused on formatting, axis selection, tick strategy, and sector strategy.

## Step 1: Create Gauge Module

Create `widgets/linear/NewLinearWidget/NewLinearWidget.js`:

1. UMD wrapper + `create(def, Helpers)`
2. Resolve shared renderer: `Helpers.getModule("LinearGaugeEngine").create(def, Helpers)`
3. Provide gauge-specific functions only:
- `formatDisplay(raw, props, unit, Helpers) -> { num, text }`
- `tickSteps(range) -> { major, minor }`
- `buildSectors(props, minV, maxV, axis, valueApi, theme) -> Sector[]`
4. Build `renderCanvas` with `createRenderer(spec)`

```javascript
const rendererModule = Helpers.getModule("LinearGaugeEngine");
const renderer = rendererModule && rendererModule.create(def, Helpers);

const renderCanvas = renderer.createRenderer({
  rawValueKey: "newValueKey",
  unitDefault: "unit",
  axisMode: "range",
  rangeDefaults: { min: 0, max: 100 },
  ratioProps: {
    normal: "newLinearRatioThresholdNormal",
    flat: "newLinearRatioThresholdFlat"
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
  id: "NewLinearWidget",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction
};
```

## Step 2: Register Module in `config/components.js`

Add module entry:

```javascript
NewLinearWidget: {
  js: BASE + "widgets/linear/NewLinearWidget/NewLinearWidget.js",
  css: undefined,
  globalKey: "DyniNewLinearWidget",
  deps: ["LinearGaugeEngine", "RadialValueMath"]
}
```

## Step 3: Wire ClusterWidget Renderer Registry

If `ClusterWidget` should render this gauge, update both declaration and runtime selection:

1. `config/components.js`: add `"NewLinearWidget"` to `ClusterRendererRouter.deps`
2. `cluster/rendering/ClusterRendererRouter.js`:
- instantiate the new spec in `create()`
- include it in `rendererSpecs`
- route `props.renderer === "NewLinearWidget"` in `pickRenderer()`

## Step 4: Route Data via Mapper Module

Update the relevant cluster mapper module (`cluster/mappers/*.js`) so translation emits:

```javascript
return {
  renderer: "NewLinearWidget",
  value: p.someValue,
  caption: cap("someLinearKind"),
  unit: unit("someLinearKind"),
  formatter: "formatX",
  formatterParameters: [unit("someLinearKind")],
  rendererProps: {
    newLinearMinValue: num(p.newLinearMinValue),
    newLinearMaxValue: num(p.newLinearMaxValue),
    newLinearTickMajor: num(p.newLinearTickMajor),
    newLinearTickMinor: num(p.newLinearTickMinor)
  }
};
```

Mapper rule: keep output declarative. Do not pass dead props that no renderer consumes.

## Step 5: Verify

- Resize to trigger `flat`, `normal`, `high`
- Pointer tracks displayed numeric value
- Warning/alarm sectors render correctly
- Tick labels use expected spacing (`theme.linear.labels.insetFactor`, `fontFactor`)
- Day/night colors update
- Disconnect handling works as implemented by the shared engine

## Checklist

- [ ] Gauge wrapper created in `widgets/linear/NewLinearWidget/NewLinearWidget.js`
- [ ] Module registered in `config/components.js`
- [ ] Added to `ClusterRendererRouter.deps` (if ClusterWidget-rendered)
- [ ] Renderer wired in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Mapper module emits `renderer: "NewLinearWidget"` and expected props
- [ ] Visual + resize behavior validated

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../linear/linear-gauge-style-guide.md](../linear/linear-gauge-style-guide.md)
- [../linear/linear-shared-api.md](../linear/linear-shared-api.md)
