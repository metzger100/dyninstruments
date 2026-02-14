# Guide: Create a New Semicircle Gauge

**Status:** ✅ Ready | post-refactoring workflow using shared GaugeUtils API

## Prerequisites

Read first:

- [../gauges/gauge-style-guide.md](../gauges/gauge-style-guide.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
- [../architecture/module-system.md](../architecture/module-system.md)
- [../architecture/cluster-system.md](../architecture/cluster-system.md)

## Overview

New semicircle gauges should be thin wrappers over `SemicircleGaugeRenderer`. Do not copy helper functions from existing gauges.

## Step 1: Create Gauge Module

Create `modules/NewGauge/NewGauge.js` with:

1. UMD wrapper
2. `create(def, Helpers)`
3. Local gauge-specific functions only:
- `formatDisplay(raw, props, unit) -> { num, text }`
- `tickSteps(range) -> { major, minor }`
- `buildSectors(props, minV, maxV, arc, valueUtils) -> Sector[]`
4. `renderCanvas` from shared renderer:

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

5. Export:

```javascript
return {
  id: "NewGauge",
  wantsHideNativeHead: true,
  renderCanvas,
  translateFunction
};
```

## Step 2: Register Module in `plugin.js`

Add to `MODULES`:

```javascript
NewGauge: {
  js: BASE + "modules/NewGauge/NewGauge.js",
  css: undefined,
  globalKey: "DyniNewGauge",
  deps: ["SemicircleGaugeRenderer"]
}
```

## Step 3: Add Cluster Kind + Translation

Update `ClusterHost.js`:

1. Add kind dispatch in `translateFunction`
2. Map editable parameters to generic gauge props (`value`, `minValue`, `maxValue`, `tickMajor`, `tickMinor`, `warningFrom`, `alarmFrom`, thresholds)
3. Route `pickRenderer` to `NewGauge`

## Step 4: Verify

- Resize to trigger `flat`, `normal`, `high`
- Pointer tracks displayed numeric value
- Warning/alarm sectors render correctly
- Day/night colors update
- Disconnect overlay works

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [../modules/semicircle-gauges.md](../modules/semicircle-gauges.md)
- [../gauges/gauge-shared-api.md](../gauges/gauge-shared-api.md)
