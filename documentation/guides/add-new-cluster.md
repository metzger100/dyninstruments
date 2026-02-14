# Guide: Create a New Cluster Widget

**Status:** ✅ Reference Guide | Cluster creation workflow for ClusterHost

**Prerequisites:** Read first:
- [avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md) — Parameter types and conditions
- [architecture/cluster-system.md](../architecture/cluster-system.md) — ClusterHost dispatch

## Overview

A "cluster" is a single AvNav widget that groups related kinds (e.g. the "speed" cluster offers SOG numeric, STW numeric, SOG gauge, STW gauge). All clusters use ClusterHost as their module.

## Step 1: Define the KIND Map

In `plugin.js`, add a new KIND map with per-kind caption/unit defaults:

```javascript
const NEWCLUSTER_KIND = {
  value1:        { cap: 'VAL1', unit: 'X' },
  value2:        { cap: 'VAL2', unit: 'Y' },
  value1Graphic: { cap: 'VAL1', unit: 'X' }  // if has graphic kind
};
```

## Step 2: Add Cluster Definition to CLUSTERS[]

In `plugin.js`, add to the CLUSTERS array:

```javascript
{
  module: "ClusterHost",
  def: {
    name: "dyninstruments_NewCluster",     // Unique widget name
    description: "Description for widget picker",
    caption: "", unit: "", default: "---",
    cluster: "newcluster",                  // Internal cluster ID
    storeKeys: {
      value1: "signalk.path.to.value1",
      value2: "signalk.path.to.value2"
    },
    editableParameters: {
      // --- Kind selector (required) ---
      kind: {
        type: "SELECT",
        list: [
          { name: "Value 1 (numeric)", value: "value1" },
          { name: "Value 2 (numeric)", value: "value2" },
          { name: "Value 1 gauge (graphic)", value: "value1Graphic" }
        ],
        default: "value1",
        name: "Kind"
      },

      // --- Graphic kind settings (conditioned) ---
      newMinValue: {
        type: "FLOAT", min: 0, max: 1000, step: 1, default: 0,
        name: "Min value",
        condition: { kind: "value1Graphic" }
      },
      newMaxValue: {
        type: "FLOAT", min: 1, max: 5000, step: 1, default: 100,
        name: "Max value",
        condition: { kind: "value1Graphic" }
      },
      // ... ticks, sectors, thresholds (see existing gauges for pattern)

      // --- Layout thresholds for graphic ---
      newRatioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
        name: "NewGauge: Normal Threshold",
        condition: { kind: "value1Graphic" }
      },
      newRatioThresholdFlat: {
        type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
        name: "NewGauge: Flat Threshold",
        condition: { kind: "value1Graphic" }
      },

      // --- Shared ---
      captionUnitScale: {
        type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
        name: "Caption/Unit to Value scale"
      },

      // --- Suppress defaults, add per-kind params ---
      caption: false,
      unit: false,
      formatter: false,
      formatterParameters: false,
      className: true,
      ...makePerKindTextParams(NEWCLUSTER_KIND),

      // --- ThreeElements thresholds for numeric kinds ---
      ratioThresholdNormal: {
        type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
        name: "3-Rows Threshold (numeric)",
        condition: [{ kind: "value1" }, { kind: "value2" }]
      },
      ratioThresholdFlat: {
        type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
        name: "1-Row Threshold (numeric)",
        condition: [{ kind: "value1" }, { kind: "value2" }]
      }
    },

    // --- Dynamic storeKeys (if using KEY type params) ---
    updateFunction: function(values) {
      // Only needed if storeKeys change based on kind selection
      return values;
    }
  }
}
```

## Step 3: Add ClusterHost Dispatch

In `modules/ClusterHost/ClusterHost.js`, inside `translateFunction()`:

```javascript
if (cluster === 'newcluster') {
  const req = p.kind;

  if (req === 'value1Graphic') {
    return {
      renderer: 'NewGauge',   // Must match pickRenderer()
      value: p.value1,
      caption: cap('value1Graphic'),
      unit: unit('value1Graphic'),
      minValue: Number(p.newMinValue),
      maxValue: Number(p.newMaxValue),
      // ... all gauge-specific props
      newRatioThresholdNormal: Number(p.newRatioThresholdNormal),
      newRatioThresholdFlat: Number(p.newRatioThresholdFlat),
      captionUnitScale: Number(p.captionUnitScale)
    };
  }

  // Numeric kinds → ThreeElements
  if (req === 'value1') {
    const u = unit('value1');
    return out(p.value1, cap('value1'), u, 'formatDecimal', [3, 1, true]);
  }
  if (req === 'value2') {
    const u = unit('value2');
    return out(p.value2, cap('value2'), u, 'formatDecimal', [3, 1, true]);
  }
  return {};
}
```

## Adding a New Kind

To add a kind to an existing cluster without creating a new cluster:

1. Add entry to the existing KIND map (e.g. `SPEED_KIND.customSpeed = { cap: 'CSP', unit: 'kn' }`)
2. Add option to the `kind` SELECT list
3. Add conditioned editableParameters for the new kind
4. Add dispatch case in ClusterHost's `translateFunction`
5. If graphic: ensure renderer module is loaded in ClusterHost deps

## Checklist

- [ ] KIND map defined in plugin.js
- [ ] Cluster object added to CLUSTERS[]
- [ ] editableParameters: kind SELECT + conditioned params
- [ ] Per-kind caption/unit via `makePerKindTextParams()`
- [ ] ClusterHost translateFunction handles new cluster
- [ ] ClusterHost pickRenderer handles new renderer (if graphic)
- [ ] New renderer module registered in MODULES (if graphic)
- [ ] New renderer added to ClusterHost deps (if graphic)
- [ ] Test in AvNav: all kinds render, layout modes work

## Related

- [add-new-gauge.md](add-new-gauge.md) — Creating the graphic renderer module
- [../avnav-api/editable-parameters.md](../avnav-api/editable-parameters.md) — Parameter types
